import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSellerSuborders } from "../../api/sellerOrders.ts";
import {
  updateSeller2026OrderFulfillment,
  type Seller2026FulfillmentPayload,
} from "../../api/seller2026/orders.mutations.ts";
import {
  adaptSeller2026Orders,
  emptySeller2026Orders,
} from "../../api/seller2026/orders-payments.adapter.ts";

export type Seller2026OrdersQuery = {
  search?: string;
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  channel?: string;
  shippingMethod?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026OrdersOptions = {
  enabled?: boolean;
  permissions?: {
    canFulfill?: boolean;
  };
};

const toApiStatus = (status?: string, paymentStatus?: string, fulfillmentStatus?: string) => {
  if (paymentStatus && paymentStatus !== "all") return { paymentStatus };
  if (fulfillmentStatus && fulfillmentStatus !== "all") return { fulfillmentStatus };
  if (status === "unpaid") return { paymentStatus: "UNPAID" };
  if (status === "pending_confirmation") return { paymentStatus: "PENDING_CONFIRMATION" };
  if (status === "processing") return { fulfillmentStatus: "PROCESSING" };
  if (status === "shipped") return { fulfillmentStatus: "SHIPPED" };
  if (status === "delivered") return { fulfillmentStatus: "DELIVERED" };
  return {};
};

export function useSeller2026Orders(
  storeId: number | string | null | undefined,
  query: Seller2026OrdersQuery = {},
  options: UseSeller2026OrdersOptions = {}
) {
  const enabled = Boolean(storeId) && options.enabled !== false;
  const queryClient = useQueryClient();
  const canFulfill = Boolean(options.permissions?.canFulfill);
  const ordersQuery = useQuery({
    queryKey: ["seller2026", "orders", storeId, query],
    queryFn: () =>
      getSellerSuborders(storeId as number | string, {
        page: Number(query.page || 1),
        limit: Number(query.limit || 10),
        keyword: query.search || undefined,
        ...toApiStatus(query.status, query.paymentStatus, query.fulfillmentStatus),
      }),
    enabled,
    retry: false,
  });

  const data = useMemo(
    () => (enabled || ordersQuery.data ? adaptSeller2026Orders(ordersQuery.data) : emptySeller2026Orders),
    [enabled, ordersQuery.data]
  );
  const invalidateOrders = () => {
    void queryClient.invalidateQueries({ queryKey: ["seller2026", "orders"] });
    void queryClient.invalidateQueries({ queryKey: ["seller2026", "suborder-detail"] });
  };
  const fulfillmentMutation = useMutation({
    mutationFn: async ({
      suborderId,
      payload,
    }: {
      suborderId: number | string;
      payload: Seller2026FulfillmentPayload;
    }) => {
      if (!enabled || !storeId || !canFulfill) {
        throw new Error("Order fulfillment update is not available.");
      }
      const result = await updateSeller2026OrderFulfillment({
        storeId,
        suborderId,
        payload,
      });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onSuccess: invalidateOrders,
  });

  return {
    data,
    isLoading: ordersQuery.isLoading,
    isError: ordersQuery.isError,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch,
    updatingStatusId: fulfillmentMutation.isPending ? "active" : null,
    mutationError: fulfillmentMutation.error,
    updateFulfillmentStatus: fulfillmentMutation.mutateAsync,
    canFulfill,
  };
}
