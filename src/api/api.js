import axios from "axios";

export const Axios = axios.create({
  baseURL: "https://sohozmeal.eastus.cloudapp.azure.com/api",
});
