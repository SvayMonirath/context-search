import { syncAPI, getCommunicationsAPI } from "../api/communication.api";
export const useCommunication = () => {
  const sync = async (type, profileId) => {
    return await syncAPI(type, profileId);
  }

  const getCommunications = async (profileId, page, limit) => {
    return await getCommunicationsAPI(profileId, page, limit);
  }

  return { sync, getCommunications };
}
