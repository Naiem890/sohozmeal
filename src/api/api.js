import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL;

export const Axios = axios.create({ baseURL: BASE_URL });

// ─── Token helpers ────────────────────────────────────────────────────────────

export const auth = {
  getAccessToken:  ()        => localStorage.getItem("_auth"),
  getRefreshToken: ()        => localStorage.getItem("_refresh_token"),
  setAccessToken:  (token)   => localStorage.setItem("_auth", token),
  clearAll: () => {
    localStorage.removeItem("_auth");
    localStorage.removeItem("_auth_state");
    localStorage.removeItem("_auth_type");
    localStorage.removeItem("_refresh_token");
  },
};

// ─── Request interceptor — attach access token ────────────────────────────────

Axios.interceptors.request.use((config) => {
  const token = auth.getAccessToken();
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

// ─── Refresh logic with request queue ────────────────────────────────────────
// Multiple concurrent 401s → only one refresh call, others wait in queue.

let isRefreshing = false;
let waitQueue    = []; // { resolve, reject }[]

function processQueue(error, token = null) {
  waitQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  waitQueue = [];
}

async function refreshAccessToken() {
  const refreshToken = auth.getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  // Use plain axios to avoid triggering our interceptor again
  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
  auth.setAccessToken(data.accessToken);
  return data.accessToken;
}

// ─── Response interceptor — silent token refresh on 401 ───────────────────────

Axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push({
          resolve: (token) => {
            original.headers["Authorization"] = `Bearer ${token}`;
            resolve(Axios(original));
          },
          reject,
        });
      });
    }

    original._retry  = true;
    isRefreshing     = true;

    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      isRefreshing = false;
      original.headers["Authorization"] = `Bearer ${newToken}`;
      return Axios(original);
    } catch (refreshError) {
      processQueue(refreshError);
      isRefreshing = false;
      auth.clearAll();
      window.location.href = "/";
      return Promise.reject(refreshError);
    }
  }
);
