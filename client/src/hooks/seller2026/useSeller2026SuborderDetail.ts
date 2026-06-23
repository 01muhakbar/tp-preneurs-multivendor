import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSellerSuborderDetail } from "../../api/sellerOrders.ts";
import {
  updateSeller2026OrderFulfillment,
  updateSeller2026OrderInternalNote,
  type Seller2026FulfillmentPayload,
} from "../../api/seller2026/orders.mutations.ts";
import {
  adaptSeller2026SuborderDetail,
  emptySeller2026SuborderDetail,
} from "../../api/seller2026/orders-payments.adapter.ts";

type UseSeller2026SuborderDetailOptions = {
  enabled?: boolean;
  permissions?: {
    canFulfill?: boolean;
  };
};

export function useSeller2026SuborderDetail(
  storeId: number | string | null | undefined,
  suborderId: number | string | null | undefined,
  options: UseSeller2026SuborderDetailOptions = {}
) {
  const enabled = Boolean(storeId) && Boolean(suborderId) && options.enabled !== false;
  const queryClient = useQueryClient();
  const canFulfill = Boolean(options.permissions?.canFulfill);
  const detailQuery = useQuery({
    queryKey: ["seller2026", "suborder-detail", storeId, suborderId],
    queryFn: () =>
      getSellerSuborderDetail(storeId as number | string, suborderId as number | string),
    enabled,
    retry: false,
  });

  const data = useMemo(
    () =>
      enabled || detailQuery.data
        ? adaptSeller2026SuborderDetail(detailQuery.data)
        : emptySeller2026SuborderDetail,
    [detailQuery.data, enabled]
  );
  const invalidateOrders = () => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ["seller2026", "orders", storeId] }),
      queryClient.invalidateQueries({ queryKey: ["seller2026", "suborder-detail", storeId, suborderId] }),
      queryClient.invalidateQueries({ queryKey: ["seller", "suborders", storeId] }),
      queryClient.invalidateQueries({ queryKey: ["seller", "suborder", "detail", storeId, suborderId] }),
    ]);
  };
  const fulfillmentMutation = useMutation({
    mutationFn: async ({
      payload,
    }: {
      suborderId?: number | string;
      payload: Seller2026FulfillmentPayload;
    }) => {
      if (!enabled || !storeId || !suborderId || !canFulfill) {
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

  const notesMutation = useMutation({
    mutationFn: async ({ note }: { note: string }) => {
      if (!enabled || !storeId || !suborderId || !canFulfill) {
        throw new Error("Internal note update is not available.");
      }
      const result = await updateSeller2026OrderInternalNote({
        storeId,
        suborderId,
        note,
      });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onSuccess: invalidateOrders,
  });

  return {
    data,
    isLoading: detailQuery.isLoading,
    isError: detailQuery.isError,
    error: detailQuery.error,
    refetch: detailQuery.refetch,
    updatingStatusId: fulfillmentMutation.isPending ? String(suborderId) : null,
    mutationError: fulfillmentMutation.error,
    updateFulfillmentStatus: fulfillmentMutation.mutateAsync,
    updateInternalNote: notesMutation.mutateAsync,
    canFulfill,
  };
}
