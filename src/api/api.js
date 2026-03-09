import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL;

export const Axios = axios.create({ baseURL: BASE_URL });

// ─── Cookie helpers ────────────────────────────────────────────────────────────

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
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

// ─── Request interceptor — attach access token from cookie ────────────────────

Axios.interceptors.request.use((config) => {
  const token = getCookie("_auth");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

// ─── Response interceptor — on 401 clear session and redirect to login ────────
// Only redirects if the user had a valid session (cookie present), so that
// a bad password on the login page itself is not mishandled.

Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getCookie("_auth")) {
      clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
