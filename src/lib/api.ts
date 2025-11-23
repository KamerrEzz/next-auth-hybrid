import axios from "axios";

const baseURL = "/";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/csrfToken=([^;]+)/);
    if (match) config.headers["X-CSRF-Token"] = match[1];
  }
  return config;
});