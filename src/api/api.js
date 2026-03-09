import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL;

export const Axios = axios.create({ baseURL: BASE_URL });

// ─── Cookie helpers ────────────────────────────────────────────────────────────

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, maxAgeSeconds) {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; max-age=0; path=/`;
}

function clearAuth() {
  deleteCookie("_auth");
  deleteCookie("_auth_state");
  deleteCookie("_auth_type");
  localStorage.removeItem("_refresh_token");
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
  const token = getCookie("_auth");
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
      clearAuth();
      window.location.href = "/login";
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

      // Update _auth cookie — 15 min to match backend ACCESS_TOKEN_EXPIRY
      setCookie("_auth", newToken, 900);

      processQueue(null, newToken);
      original.headers["Authorization"] = `Bearer ${newToken}`;
      return Axios(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuth();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
