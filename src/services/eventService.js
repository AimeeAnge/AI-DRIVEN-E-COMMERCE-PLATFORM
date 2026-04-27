import apiClient from "./apiClient";

export const eventService = {
  track(payload) {
    return apiClient.post("/api/v1/events", payload);
  },
  safelyTrack(payload) {
    return apiClient.post("/api/v1/events", payload).catch((eventError) => {
      console.log(eventError);
      return null;
    });
  }
};
