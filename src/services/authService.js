import apiClient from "./apiClient";

export const authService = {
  login(credentials) {
    return apiClient.post("/api/v1/auth/login", credentials);
  },
  register(payload) {
    return apiClient.post("/api/v1/auth/register", payload);
  },
  logout() {
    return apiClient.post("/api/v1/auth/logout");
  },
  me() {
    return apiClient.get("/api/v1/auth/me");
  }
};
