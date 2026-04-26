import apiClient from "./apiClient";

export const analyticsService = {
  merchant() {
    return apiClient.get("/api/v1/merchant/analytics");
  },
  admin() {
    return Promise.resolve({ unavailable: true, message: "Admin analytics are not available yet." });
  },
  users() {
    return apiClient.get("/api/v1/admin/users");
  },
  updateUserStatus(userId, status) {
    return apiClient.patch(`/api/v1/admin/users/${userId}/status`, { status });
  },
  chatbotConversations() {
    return Promise.resolve({ items: [], unavailable: true, message: "Chatbot conversations are not available yet." });
  }
};
