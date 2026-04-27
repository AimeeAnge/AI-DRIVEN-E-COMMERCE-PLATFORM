import apiClient from "./apiClient";

export const recommendationService = {
  list(params = {}) {
    const context = params.context || "home";
    if (context === "cart") return apiClient.get("/api/v1/recommendations/cart", { params });
    if (context === "dashboard" || context === "user") return apiClient.get("/api/v1/recommendations/user", { params });
    return apiClient.get("/api/v1/recommendations/home", { params });
  },
  forProduct(productId) {
    return apiClient.get(`/api/v1/recommendations/product/${productId}`);
  },
  performance() {
    return Promise.resolve({ unavailable: true, message: "Recommendation performance is not available yet." });
  }
};
