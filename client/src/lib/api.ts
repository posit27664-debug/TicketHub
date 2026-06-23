import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor — redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on /auth/* endpoints
      const url: string = error.config?.url ?? "";
      if (!url.startsWith("/auth")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
