import axios from "axios";

// Define your Axios instance
export const Axios = axios.create({
  baseURL: "https://sohozmeal.eastus.cloudapp.azure.com/api",
  // baseURL: "http://localhost:5000/api",
});

// Attach the auth token to every request and handle file uploads
Axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("_auth");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Check if the request has file data and set the appropriate Content-Type
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
