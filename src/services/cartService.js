import apiClient from "./apiClient";

export const cartService = {
  getCart() {
    return apiClient.get("/api/v1/cart");
  },
  addItem(productId, quantity = 1) {
    return apiClient.post("/api/v1/cart/items", { product_id: productId, quantity });
  },
  updateItem(itemId, quantity) {
    return apiClient.put(`/api/v1/cart/items/${itemId}`, { quantity });
  },
  removeItem(itemId) {
    return apiClient.delete(`/api/v1/cart/items/${itemId}`);
  }
};
