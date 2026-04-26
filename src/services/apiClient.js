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
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const apiError = new Error(
      error.response?.data?.message ||
        error.message ||
        "AIDEP API request failed."
    );
    apiError.status = error.response?.status;
    apiError.details = error.response?.data;
    throw apiError;
  }
);

export default apiClient;
