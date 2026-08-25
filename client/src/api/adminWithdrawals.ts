import { api } from "./axios";

export const listAdminWithdrawals = async (page = 1, limit = 20, status = "") => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.append("status", status);

  const response = await api.get(`/admin/withdrawals?${params.toString()}`);
  return response.data;
};

export const updateWithdrawalStatus = async (
  id: number,
  status: "PROCESSING" | "COMPLETED" | "REJECTED",
  adminNote?: string,
  proofImageUrl?: string
) => {
  const response = await api.put(`/admin/withdrawals/${id}/status`, {
    status,
    adminNote,
    proofImageUrl,
  });
  return response.data;
};

export const uploadWithdrawalProof = async (id: number, file: File) => {
  const form = new FormData();
  form.append("file", file);
  const response = await api.post(`/admin/withdrawals/${id}/proof`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
