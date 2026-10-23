import api from "./api";

<<<<<<< Updated upstream
export const getProfile = async (walletAddress) => {
    const response = await api.get("student/profile", { params: { walletAddress } });
    return response.data.user;
=======
export const getProfile = async () => {
  const response = await api.get("/student/profile");
  return response.data.user;
};

export const getFullProfile = async () => {
  const response = await api.get("/student/profile/full");
  return response.data.profile;
};

export const updateProfile = async (profileData) => {
  const response = await api.put("/student/profile", profileData);
  return response.data.user;
};

export const lookupStudent = async (identifier) => {
  if (!identifier) return null;
  const response = await api.get(`/students/lookup/${encodeURIComponent(identifier.trim())}`);
  return response.data.student;
>>>>>>> Stashed changes
};