import { fetchChatsAPI, createChatAPI, fetchConversationAPI, deleteChatAPI} from "../api/chat.api"
import { useNavigate } from "react-router-dom";

export const useChat = () => {
  const navigate = useNavigate();
  const fetch_chats = async (profileId) => {
    return await fetchChatsAPI(profileId);
  }

  const fetch_conversation = async (chatId) => {
    return await fetchConversationAPI(chatId);
  }

  const create_chat = async (profileId, profileType) => {
    const data = await createChatAPI(profileId);
    if (data.status === "success") {
      navigate(`/dashboard/omni-search?profileId=${profileId}&chatId=${data.data}&profileType=${profileType}`);
    }
  }

  const delete_chat = async (chatId) => {
    return await deleteChatAPI(chatId);
  }
  return { fetch_chats, fetch_conversation, create_chat, delete_chat };
}
