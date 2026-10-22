import { toast } from "react-toastify";
import { api } from "./global.api";

const API_BASE_URL = "/integration";

export const getIntegrationStatusAPI = async (profileID) => {
  try {
    const response = await api.get(`${API_BASE_URL}/status?profileId=${profileID}`);
    console.log("(API) Fetched integration status:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching integration status:", error);
    const message = error.response?.data?.message || "Failed to fetch integration status. Please try again.";
    toast.error(message);
    return { status: "error", message };
  }
}

export const integrateAPI = async (profileID, type) => {
  // switch (type.toUpperCase()) {
  //   case "GMAIL":
  //     const response = await api.post(`/profile/${profileID}/integration/google/connect`);

  //     console.log("Redirecting to:", response.data.data.url);

  //     // window.location.href = response.data.data.url;
  //     toast.success(response.data.message || "Integration successful!");
  //     return response.data;
  //   default:
  //     throw new Error("Unsupported integration type");
  // }
  try {
    if(type.toUpperCase() === "GMAIL") {
      const response = await api.post(`/profile/${profileID}/integration/google/connect`);
      // console.log("Redirecting to:", response.data.data.url);
      window.location.href = response.data.data.url;
      toast.success(response.data.message || "Integration successful!");
      return response.data;
    } else if (type.toUpperCase() === "TELEGRAM") {
    } else {
      throw new Error("Unsupported integration type");
    }
  } catch (error) {
      console.error("Error integrating:", error);
      const message = error.response?.data?.message || "Failed to integrate. Please try again.";
      toast.error(message);
      return { status: "error", message };
  }
};

export const disconnectIntegrationAPI = async (integrationId) => {
  try {
    const response = await api.patch(`${API_BASE_URL}/disconnect?integrationId=${integrationId}`);
    toast.success(response.data.message || "Integration disconnected successfully!");
    return response.data;
  } catch (error) {
    console.error("Error disconnecting integration:", error);
    const message = error.response?.data?.message || "Failed to disconnect integration. Please try again.";
    toast.error(message);
    return { status: "error", message };
  }
}

export const reconnectIntegrationAPI = async (profileId, type) => {
  try {
    if(type.toUpperCase() === "GMAIL") {
      const response = await api.patch(`/profile/${profileId}/integration/google/refresh_token`);
      toast.success(response.data.message || "Integration connected successfully!");
      return response.data;
    } else {
      throw new Error("Unsupported integration type");
    }

  } catch (error) {

    // if(error.response?.data?.message === "invalid_grant") {
    //   deleteIntegrationAPI(profileId);
    //   return { status: "error", message: "Integration expired" };
    // }

    console.error("Error connecting integration:", error);
    const message = error.response?.data?.message || "Failed to connect integration. Please try again.";
    toast.error(message);
    return { status: "error", message };
  }
}

export const deleteIntegrationAPI = async (integrationId) => {
  try {
    const response = await api.delete(`${API_BASE_URL}?integrationId=${integrationId}`);
    toast.success(response.data.message || "Integration deleted successfully!");
    return response.data;
  } catch (error) {
    console.error("Error deleting integration:", error);
    const message = error.response?.data?.message || "Failed to delete integration. Please try again.";
    toast.error(message);
    return { status: "error", message };
  }
}
