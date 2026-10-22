import { createProfileAPI, deleteProfileAPI, getProfilesAPI } from "../api/profile.api";

export const useCreateProfile = () => {
  const createProfile = async (name, color, type) => {
    const data = await createProfileAPI(name, color, type);
    return data;
  }
  return { createProfile };
}

export const useGetProfiles = () => {
  const getProfiles = async () => {
    const data = await getProfilesAPI();
    const profiles = data.data?.data || [];
    return profiles;
  }
  return { getProfiles };
}

export const useDeleteProfile = () => {
  const deleteProfile = async (profileId) => {
    return await deleteProfileAPI(profileId);
  }
  return { deleteProfile };
}

export const useGetProfileParam = () => {
  const location = useLocation();
  const profileId = new URLSearchParams(location.search).get('profileId');
  return { profileId };
}
