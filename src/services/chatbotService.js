function unavailable() {
  return Promise.reject(new Error("I'm not connected right now. Please try again later."));
}

export const chatbotService = {
  sendMessage(payload) {
    void payload;
    return unavailable();
  },
  listConversations() {
    return Promise.resolve({ items: [], unavailable: true, message: "Chatbot conversations are not available yet." });
  },
  getConversation(id) {
    void id;
    return unavailable();
  }
};
