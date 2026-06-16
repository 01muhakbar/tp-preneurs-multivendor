import { api } from "./axios.ts";

export const fetchUserStoreInvitations = async () => {
  const { data } = await api.get("/seller/invitations");
  return data ?? null;
};

export const acceptUserStoreInvitation = async (memberId: number | string) => {
  const { data } = await api.post(`/seller/invitations/${memberId}/accept`);
  return data ?? null;
};

export const declineUserStoreInvitation = async (memberId: number | string) => {
  const { data } = await api.post(`/seller/invitations/${memberId}/decline`);
  return data ?? null;
};
