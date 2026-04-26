import apiClient from "./apiClient";

export const recommendationService = {
  list(params = {}) {
    return apiClient.get("/api/v1/recommendations", { params });
  },
  forProduct(productId) {
    return apiClient.get(`/api/v1/recommendations/products/${productId}`);
  },
  performance() {
    return apiClient.get("/api/v1/recommendations/performance");
  }
};
