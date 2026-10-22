import { api } from "./global.api";
import { toast } from "react-toastify";

const API_BASE_URL = "/memory";

export const deleteMemoryNodeAPI = async (communicationIds, profile_id) => {
  try {
    const response = await api.post(`${API_BASE_URL}/communication/${profile_id}/delete`, { communicationIDs: communicationIds });

    console.log("(API) Deleted memory nodes:", response.data);

    toast.success(response.data.message || "Selected memory nodes deleted successfully!");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to delete memory nodes.";
    console.error("(API) Delete Memory Nodes failed:", message);
    toast.error(message);
    return { status: "error", message };
  }
}

export const searchMemoryAPI = async (
  profile_id,
  query,
  filters = {},
  limit = 25,
  offset = 0
) => {
  try {
    const response = await api.post(`${API_BASE_URL}/communication/search/${profile_id}`, {
      query,
      filters,
      limit,
      offset,
    });

    console.log("(API) Searched memory nodes:", response.data);

    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to search memory nodes.";
    console.error("(API) Search Memory Nodes failed:", message);
    toast.error(message);
    return { status: "error", message };
  }
}

export const createMemoryRuleAPI = async (profile_id, type, scope, value) => {
  try {
    const response = await api.post(`${API_BASE_URL}/profile/${profile_id}/rules`, { type, scope, value });
    console.log("(API) Created memory rule:", response.data);
    toast.success(response.data.message || "Memory rule created successfully!");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to create memory rule.";
    console.error("(API) Create Memory Rule failed:", message);
    toast.error(message);
    return { status: "error", message };
  }
}

export const getMemoryRulesAPI = async (profile_id) => {
  try {
    const response = await api.get(
      `${API_BASE_URL}/profile/${profile_id}/rules`
    );

    console.log("(API) Retrieved memory rules:", response.data);

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      "Failed to retrieve memory rules.";

    console.error("(API) Get Memory Rules failed:", message);

    return { status: "error", message };
  }
};

export const deleteMemoryRuleAPI = async (profile_id, rule_id) => {
  try {
    const response = await api.delete(`${API_BASE_URL}/profile/${profile_id}/rules/${rule_id}`);
    console.log("(API) Deleted memory rule:", response.data);
    toast.success(response.data.message || "Memory rule deleted successfully!");
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      "Failed to delete memory rule.";

    console.error("(API) Delete Memory Rule failed:", message);

    return { status: "error", message };
  }
}
