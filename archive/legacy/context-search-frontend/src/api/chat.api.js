import { toast } from "react-toastify";
import { api } from "./global.api";

const BASE_URL = "/chat";

export const fetchChatsAPI = async (profileId) => {
  try {
    const response = await api.get(`${BASE_URL}/get_chats?profileId=${profileId}`);

    console.log("Fetch Chats Response:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error fetching chats:", error);
    toast.error(error.response?.data?.message || "Failed to fetch chats");
    throw error;
  }
}

export const deleteChatAPI = async (chatId) => {
  try {
    const response = await api.delete(`${BASE_URL}/${chatId}`);
    toast.success(response.data.message || "Chat deleted successfully");
    return response.data;
  } catch (error) {
    console.error("Error deleting chat:", error);
    toast.error(error.response?.data?.message || "Failed to delete chat");
    throw error;
  }
}

export const fetchConversationAPI = async (chatId) => {
  try {
    const response = await api.get(`${BASE_URL}/get_conversations?chatId=${chatId}`);

    console.log("Fetch Conversation Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    toast.error(error.response?.data?.message || "Failed to fetch conversation");
    throw error;
  }
}

export const createChatAPI = async (profileId) => {
  try {
    const response = await api.post(`${BASE_URL}`, { profileId: profileId });
    toast.success(response.data.message || "Chat created successfully");
    return response.data;
  } catch (error) {
    console.error("Error creating chat:", error);
    toast.error(error.response?.data?.message || "Failed to create chat");
    throw error;
  }
}
