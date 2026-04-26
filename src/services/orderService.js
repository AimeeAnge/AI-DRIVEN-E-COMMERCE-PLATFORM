import apiClient from "./apiClient";

export const orderService = {
  list() {
    return apiClient.get("/api/v1/orders");
  },
  getById(id) {
    return apiClient.get(`/api/v1/orders/${id}`);
  },
  checkout(payload) {
    return apiClient.post("/api/v1/orders/checkout", payload);
  }
};
