import { toast } from "react-toastify";
import { api } from "./global.api";

export const API_BASE_URL = "/communication";

export const getCommunicationsAPI = async (profileId, page = 1, limit = 25) => {
  try {
    const response = await api.get(
      `${API_BASE_URL}/${profileId}/${limit}/${page}`
    );

    console.log("(API) Fetched communications:", response.data);

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to fetch communications.";

    console.error("(API) Get Communications failed:", message);
    toast.error(message);
    return { status: "error", message };
  }
};
export const syncAPI = async (type, profileId) => {
  try {
    if(type.toUpperCase() === "GMAIL") {
      const response = await api.get(`${API_BASE_URL}/gmail/sync/${profileId}`);
      toast.success(response.data.message || "Gmail sync successful!");
      return response.data;
    }
    else if (type.toUpperCase() === "TELEGRAM") {
      const response = await api.get(`${API_BASE_URL}/telegram/sync/${profileId}`);
      toast.success(response.data.message || "Telegram sync successful!");
      return response.data;
    }

  } catch (error) {
    const message = error.response?.data?.message || "Sync failed. Please try again.";
    console.error("(API) Sync failed:", message);
    toast.error(message);
    return { status: "error", message };
  }
}
