import apiClient from "./apiClient";

export const analyticsService = {
  merchant() {
    return apiClient.get("/api/v1/merchant/analytics");
  },
  admin() {
    return apiClient.get("/api/v1/admin/analytics");
  },
  users() {
    return apiClient.get("/api/v1/admin/users");
  },
  chatbotConversations() {
    return apiClient.get("/api/v1/admin/chatbot/conversations");
  }
};
