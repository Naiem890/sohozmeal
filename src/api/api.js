import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL;

export const Axios = axios.create({ baseURL: BASE_URL });

// ─── Cookie helpers ────────────────────────────────────────────────────────────

function getCookie(name) {
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

let cachedAccessToken = null;

/** Call this on every logout/session-expiry so the cache doesn't outlive the session. */
export function clearCachedToken() {
  cachedAccessToken = null;
}

// ─── Session expiry signal ────────────────────────────────────────────────────
// Dispatches a custom DOM event so the React AuthEventHandler component can call
// useSignOut() + navigate() — avoiding direct cookie manipulation which can miss
// the Secure/SameSite attributes set by react-auth-kit on HTTPS and cause loops.

const LOGIN_PATHS = new Set(["/login", "/admin", "/staff"]);

function signalSessionExpired() {
  // Already on a login page — nothing to do (prevents re-firing after navigate)
  if (LOGIN_PATHS.has(window.location.pathname)) return;
  localStorage.removeItem("_refresh_token");
  window.dispatchEvent(new CustomEvent("auth:session-expired"));
}

// ─── Refresh token state ──────────────────────────────────────────────────────

let isRefreshing = false;
let pendingQueue = []; // { resolve, reject }[]

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

// ─── Request interceptor — attach access token from cookie ────────────────────

Axios.interceptors.request.use((config) => {
  const token = cachedAccessToken || getCookie("_auth");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

// ─── Response interceptor — refresh on 401, no infinite loop ─────────────────
// Skips interception for the refresh call itself and already-retried requests.

Axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("_refresh_token");
    if (!refreshToken) {
      signalSessionExpired();
      return Promise.reject(error);
    }

    // Queue concurrent 401s while a refresh is in progress
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers["Authorization"] = `Bearer ${token}`;
        return Axios(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const newToken = data.accessToken;

      cachedAccessToken = newToken;
      processQueue(null, newToken);
      original.headers["Authorization"] = `Bearer ${newToken}`;
      return Axios(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      signalSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
