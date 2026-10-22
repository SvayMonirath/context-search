import { toast } from "react-toastify";
import { api } from "./global.api";

export const API_BASE_URL = "/profile";

export const createProfileAPI = async (name, color, type, password, confirm_password) => {
  try {
    const response = await api.post(`${API_BASE_URL}/`, {
      name: name,
      color: color,
      type: type,
    });
    toast.success(response.data.message || "Profile created successfully!");
    return response.data;
  } catch (error) {
    console.error("Error creating profile:", error);
    const message = error.response?.data?.message || "Failed to create profile. Please try again.";
    toast.error(message);
    return { status: "error", message };
  }
}

export const deleteProfileAPI = async (profileId) => {
  try {    const response = await api.delete(`${API_BASE_URL}/${profileId}`);
    toast.success(response.data.message || "Profile deleted successfully!");
    return response.data;
  } catch (error) {
    console.error("Error deleting profile:", error);
    const message = error.response?.data?.message || "Failed to delete profile. Please try again.";
    toast.error(message);
    return { status: "error", message };
  }
}

export const getProfilesAPI = async (id) => {
  try {
    const response = await api.get(`${API_BASE_URL}/`);
    console.log("(API) Fetched profiles:", response.data);
    return response;
  } catch (error) {
    console.error("(API) Error fetching profiles:", error);
    const message = error.response?.data?.message || "Failed to fetch profiles. Please try again.";
    toast.error(message);
    return { status: "error", message };
  }
}
