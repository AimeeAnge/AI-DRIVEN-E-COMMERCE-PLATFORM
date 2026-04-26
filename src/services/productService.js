import apiClient from "./apiClient";

export const productService = {
  list(params = {}) {
    return apiClient.get("/api/v1/products", { params });
  },
  getById(id) {
    return apiClient.get(`/api/v1/products/${id}`);
  },
  search(query) {
    return apiClient.get("/api/v1/products/search", { params: { q: query } });
  },
  wishlist() {
    return apiClient.get("/api/v1/products/wishlist");
  }
};
