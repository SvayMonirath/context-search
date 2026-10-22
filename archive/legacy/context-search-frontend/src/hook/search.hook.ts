import { searchAPI, statelesSearchAPI } from "../api/search.api";

export const useSearch = () => {
  const search = async (
    query: string,
    aiId: string,
    onEvent: (data: any) => void,
    chatId?: string,
    profileId?: string,
    type?: string
  ) => {

    console.log(type, "profile type");
    if(type === "STANDARD") {
      await searchAPI(query, aiId, onEvent, chatId, profileId);
    } else if(type === "STATELESS") {
      await statelesSearchAPI(query, aiId, onEvent, chatId, profileId);
    } else {
      console.error("Invalid search type:", type);
    }
  };

  return { search };
};
