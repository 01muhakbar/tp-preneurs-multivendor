import { api } from "@/api/axios";
export const fetchOrders = (p: number, l: number) =>
  api.get(`/admin/orders`, { params: { page: p, limit: l } }).then(r => r.data);

export const decideAdminReturnDispute = async (
  orderId: string | number,
  suborderId: string | number,
  payload: { decision: "REFUND_BUYER" | "RELEASE_TO_SELLER"; adminNotes?: string }
) => {
  const { data } = await api.post(`/admin/orders/${orderId}/suborders/${suborderId}/return-decision`, payload);
  return data;
};
