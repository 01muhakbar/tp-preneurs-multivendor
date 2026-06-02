import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerSuborders } from "../../api/sellerOrders.ts";
import {
  adaptSeller2026Orders,
  emptySeller2026Orders,
} from "../../api/seller2026/orders-payments.adapter.ts";

export type Seller2026OrdersQuery = {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  channel?: string;
  shippingMethod?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026OrdersOptions = {
  enabled?: boolean;
};

const toApiStatus = (status?: string) => {
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
  const ordersQuery = useQuery({
    queryKey: ["seller2026", "orders", storeId, query],
    queryFn: () =>
      getSellerSuborders(storeId as number | string, {
        page: Number(query.page || 1),
        limit: Number(query.limit || 10),
        keyword: query.search || undefined,
        ...toApiStatus(query.status),
      }),
    enabled,
    retry: false,
  });

  const data = useMemo(
    () => (enabled || ordersQuery.data ? adaptSeller2026Orders(ordersQuery.data) : emptySeller2026Orders),
    [enabled, ordersQuery.data]
  );

  return {
    data,
    isLoading: ordersQuery.isLoading,
    isError: ordersQuery.isError,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch,
  };
}
