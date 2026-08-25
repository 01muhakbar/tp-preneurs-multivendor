import { api } from "./axios";

export const listSellerWithdrawals = async (storeId: number) => {
  const response = await api.get(`/seller/stores/${storeId}/withdrawals`);
  return response.data;
};

export const requestWithdrawal = async (storeId: number, amount: number) => {
  const response = await api.post(`/seller/stores/${storeId}/withdrawals`, { amount });
  return response.data;
};
