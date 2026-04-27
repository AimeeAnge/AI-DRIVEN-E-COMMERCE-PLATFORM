import apiClient from "./apiClient";

export const merchantService = {
  dashboard() {
    return apiClient.get("/api/v1/merchant/analytics");
  },
  analytics(params = {}) {
    return apiClient.get("/api/v1/merchant/analytics", { params });
  },
  products(params = {}) {
    return apiClient.get("/api/v1/merchant/products", { params });
  },
  createProduct(payload) {
    return apiClient.post("/api/v1/merchant/products", payload);
  },
  updateProduct(id, payload) {
    return apiClient.put(`/api/v1/merchant/products/${id}`, payload);
  },
  updateProductStatus(id, status) {
    return apiClient.patch(`/api/v1/merchant/products/${id}/status`, { status });
  },
  orders(params = {}) {
    return apiClient.get("/api/v1/merchant/orders", { params });
  },
  updateOrderStatus(orderId, status) {
    return apiClient.patch(`/api/v1/merchant/orders/${orderId}/status`, { status });
  }
};
