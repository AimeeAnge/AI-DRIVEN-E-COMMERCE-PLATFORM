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
  categories() {
    return apiClient.get("/api/v1/categories");
  },
  wishlist() {
    return apiClient.get("/api/v1/wishlist");
  },
  addWishlistItem(productId) {
    return apiClient.post("/api/v1/wishlist/items", { product_id: productId });
  },
  removeWishlistItem(itemId) {
    return apiClient.delete(`/api/v1/wishlist/items/${itemId}`);
  }
};
