import apiClient from "./apiClient";

function loginPayload(credentials) {
  return {
    email: credentials.email,
    password: credentials.password
  };
}

function registerPayload(payload) {
  return {
    full_name: payload.full_name || payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    store_name: payload.store_name || payload.storeName,
    phone_number: payload.phone_number || payload.phone,
    phone_country_code: payload.phone_country_code,
    country_code: payload.country_code,
    region: payload.region,
    city: payload.city
  };
}

export const authService = {
  login(credentials) {
    return apiClient.post("/api/v1/auth/login", loginPayload(credentials));
  },
  register(payload) {
    return apiClient.post("/api/v1/auth/register", registerPayload(payload));
  },
  logout() {
    window.localStorage.removeItem("aidep.auth.token");
    window.localStorage.removeItem("aidep.auth.user");
    window.localStorage.removeItem("aidep.auth.role");
    window.sessionStorage.removeItem("aidep.auth.token");
    window.sessionStorage.removeItem("aidep.auth.user");
    window.sessionStorage.removeItem("aidep.auth.role");
    return Promise.resolve({ success: true, message: "Signed out locally.", data: {} });
  },
  me() {
    return apiClient.get("/api/v1/auth/me");
  }
};
