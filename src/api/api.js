import axios from "axios";

// Define your Axios instance
export const Axios = axios.create({
  // baseURL: "https://sohozmeal.eastus.cloudapp.azure.com/api",
  baseURL: "http://localhost:5000/api",
});

// attach the auth token to every request
Axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("_auth");
    console.log("token", token);
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    config.headers["Content-Type"] = "application/json";

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
