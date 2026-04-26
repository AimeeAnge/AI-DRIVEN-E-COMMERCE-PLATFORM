import apiClient from "./apiClient";

export const merchantService = {
  dashboard() {
    return apiClient.get("/api/v1/merchant/dashboard");
  },
  products(params = {}) {
    return apiClient.get("/api/v1/merchant/products", { params });
  },
  orders(params = {}) {
    return apiClient.get("/api/v1/merchant/orders", { params });
  }
};
