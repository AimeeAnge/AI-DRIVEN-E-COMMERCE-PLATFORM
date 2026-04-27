import apiClient from "./apiClient";
import { paginationTotal } from "../utils/apiData";

export const analyticsService = {
  merchant() {
    return apiClient.get("/api/v1/merchant/analytics");
  },
  async admin() {
    const [allUsers, activeUsers, disabledUsers, customers, merchants] = await Promise.all([
      apiClient.get("/api/v1/admin/users", { params: { page_size: 5 } }),
      apiClient.get("/api/v1/admin/users", { params: { status: "active", page_size: 1 } }),
      apiClient.get("/api/v1/admin/users", { params: { status: "disabled", page_size: 1 } }),
      apiClient.get("/api/v1/admin/users", { params: { role: "customer", page_size: 1 } }),
      apiClient.get("/api/v1/admin/users", { params: { role: "merchant", page_size: 1 } })
    ]);

    return {
      usersCount: paginationTotal(allUsers),
      activeUsersCount: paginationTotal(activeUsers),
      disabledUsersCount: paginationTotal(disabledUsers),
      customerCount: paginationTotal(customers),
      merchantCount: paginationTotal(merchants),
      recentUsers: allUsers?.data?.items || allUsers?.items || []
    };
  },
  users(params = {}) {
    return apiClient.get("/api/v1/admin/users", { params });
  },
  updateUserStatus(userId, status) {
    return apiClient.patch(`/api/v1/admin/users/${userId}/status`, { status });
  },
  chatbotConversations() {
    return Promise.resolve({ items: [], unavailable: true, message: "Chatbot conversations are not available yet." });
  }
};
