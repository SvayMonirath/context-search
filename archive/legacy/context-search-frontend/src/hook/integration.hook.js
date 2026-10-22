import { getIntegrationStatusAPI, disconnectIntegrationAPI, reconnectIntegrationAPI, integrateAPI } from "../api/integration.api"

export const useIntegration = () => {
  const getIntegrationStatus = async (profileID) => {
    return await getIntegrationStatusAPI(profileID);
  };

  const disconnectIntegration = async (integrationId) => {
    return await disconnectIntegrationAPI(integrationId);
  }

  const reconnectIntegration = async (profileId, type) => {
    return await reconnectIntegrationAPI(profileId, type);
  }

  const integrate = async (profileID, type) => {
    return await integrateAPI(profileID, type);
  }

  return { getIntegrationStatus, disconnectIntegration, reconnectIntegration, integrate };
}
