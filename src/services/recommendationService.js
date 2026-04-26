export const recommendationService = {
  list(params = {}) {
    void params;
    return Promise.resolve([]);
  },
  forProduct(productId) {
    void productId;
    return Promise.resolve([]);
  },
  performance() {
    return Promise.resolve({ unavailable: true, message: "Recommendation performance is not available yet." });
  }
};
