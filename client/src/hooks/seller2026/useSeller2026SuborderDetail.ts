import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerSuborderDetail } from "../../api/sellerOrders.ts";
import {
  adaptSeller2026SuborderDetail,
  emptySeller2026SuborderDetail,
} from "../../api/seller2026/orders-payments.adapter.ts";

type UseSeller2026SuborderDetailOptions = {
  enabled?: boolean;
};

export function useSeller2026SuborderDetail(
  storeId: number | string | null | undefined,
  suborderId: number | string | null | undefined,
  options: UseSeller2026SuborderDetailOptions = {}
) {
  const enabled = Boolean(storeId) && Boolean(suborderId) && options.enabled !== false;
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

  return {
    data,
    isLoading: detailQuery.isLoading,
    isError: detailQuery.isError,
    error: detailQuery.error,
    refetch: detailQuery.refetch,
  };
}
