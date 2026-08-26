import { api } from "./axios.ts";

const EMPTY_INVITATIONS_RESPONSE = {
  success: true,
  data: {
    items: [],
    total: 0,
  },
};

const isUnauthorizedError = (error: unknown) =>
  Number((error as { response?: { status?: number } })?.response?.status || 0) === 401;

export const fetchUserStoreInvitations = async () => {
  try {
    const { data } = await api.get("/seller/invitations");
    return data ?? EMPTY_INVITATIONS_RESPONSE;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return EMPTY_INVITATIONS_RESPONSE;
    }
    throw error;
  }
};

export const acceptUserStoreInvitation = async (memberId: number | string) => {
  const { data } = await api.post(`/seller/invitations/${memberId}/accept`);
  return data ?? null;
};

export const declineUserStoreInvitation = async (memberId: number | string) => {
  const { data } = await api.post(`/seller/invitations/${memberId}/decline`);
  return data ?? null;
};
