import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("aidep.auth.token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    if (typeof config.headers?.set === "function") {
      config.headers.set("Content-Type", undefined);
    } else {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const backendMessage = error.response?.data?.error?.message || error.response?.data?.message;
    const apiError = new Error(
      backendMessage ||
        error.message ||
        "AIDEP API request failed."
    );
    apiError.status = error.response?.status;
    apiError.details = error.response?.data;
    apiError.config = error.config;
    throw apiError;
  }
);

export default apiClient;
