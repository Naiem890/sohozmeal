import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL as string;

export const Axios = axios.create({ baseURL: BASE_URL });

// ─── Cookie helpers ────────────────────────────────────────────────────────────

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ─── In-memory access token cache ────────────────────────────────────────────
// We never write to the _auth cookie directly. Writing to document.cookie can
// create a DUPLICATE _auth cookie on HTTPS production (different domain attribute
// vs what react-auth-kit's universal-cookie sets), which survives signOut() and
// causes stale-token conflicts when switching roles.
// Instead, cache the refreshed token in memory. On page load the cookie provides
// the initial token; after any refresh, the cache takes over until signOut().

let cachedAccessToken: string | null = null;

/** Call this on every logout/session-expiry so the cache doesn't outlive the session. */
export function clearCachedToken(): void {
  cachedAccessToken = null;
}

// ─── JWT expiry check ─────────────────────────────────────────────────────────
// Decodes the JWT payload client-side (no verification) to read the `exp` claim.
// A 10-second buffer handles clock skew and network latency so we refresh before
// the backend would reject the token.

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return !payload.exp || payload.exp * 1000 < Date.now() + 10_000;
  } catch {
    return true;
  }
}

// ─── Session expiry signal ────────────────────────────────────────────────────
// Dispatches a custom DOM event so the React AuthEventHandler component can call
// useSignOut() + navigate() — avoiding direct cookie manipulation which can miss
// the Secure/SameSite attributes set by react-auth-kit on HTTPS and cause loops.

const LOGIN_PATHS = new Set(["/login", "/admin", "/staff"]);

function signalSessionExpired(): void {
  // Already on a login page — nothing to do (prevents re-firing after navigate)
  if (LOGIN_PATHS.has(window.location.pathname)) return;
  localStorage.removeItem("_refresh_token");
  window.dispatchEvent(new CustomEvent("auth:session-expired"));
}

// ─── Refresh token state ──────────────────────────────────────────────────────

interface QueueItem {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}

let isRefreshing = false;
let pendingQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null = null): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token as string);
  });
  pendingQueue = [];
}

// ─── Shared refresh logic ─────────────────────────────────────────────────────
// Used by both the request interceptor (proactive) and the response interceptor
// (fallback). Queues concurrent callers so only one refresh call goes out.

async function refreshAndCache(): Promise<string | null> {
  const refreshToken = localStorage.getItem("_refresh_token");
  if (!refreshToken) {
    signalSessionExpired();
    return null;
  }

  // Another request is already refreshing — join the queue
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    }).catch(() => null);
  }

  isRefreshing = true;
  try {
    const { data } = await axios.post<{ accessToken: string }>(
      `${BASE_URL}/auth/refresh`,
      { refreshToken }
    );
    const newToken = data.accessToken;
    cachedAccessToken = newToken;
    processQueue(null, newToken);
    return newToken;
  } catch (err) {
    processQueue(err, null);
    signalSessionExpired();
    return null;
  } finally {
    isRefreshing = false;
  }
}

// ─── Request interceptor — proactively refresh expired token ──────────────────
// On every request, read the cached token (or fall back to the cookie).
// If the token is expired (or within 10 s of expiry), refresh it BEFORE the
// request goes out — eliminating the 401 → refresh → retry cycle on page reload.

Axios.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Never intercept the refresh call itself
  if ((config.url as string | undefined)?.includes("/auth/refresh")) {
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  }

  let token = cachedAccessToken ?? getCookie("_auth");

  if (token && isTokenExpired(token)) {
    // Expired — refresh proactively so the actual request goes out fresh
    token = await refreshAndCache();
  }

  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

// ─── Response interceptor — fallback for any unexpected 401s ─────────────────
// Handles edge cases like server clock skew or tokens invalidated server-side.

interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

Axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableRequestConfig;

    if (
      error.response?.status !== 401 ||
      original._retry ||
      (original.url as string | undefined)?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    const newToken = await refreshAndCache();
    if (!newToken) return Promise.reject(error);

    if (original.headers) original.headers["Authorization"] = `Bearer ${newToken}`;
    return Axios(original);
  }
);
