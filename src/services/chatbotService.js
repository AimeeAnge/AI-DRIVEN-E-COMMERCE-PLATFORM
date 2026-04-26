import apiClient from "./apiClient";

export const chatbotService = {
  sendMessage(payload) {
    return apiClient.post("/api/v1/chatbot/messages", payload);
  },
  listConversations() {
    return apiClient.get("/api/v1/chatbot/conversations");
  },
  getConversation(id) {
    return apiClient.get(`/api/v1/chatbot/conversations/${id}`);
  }
};
