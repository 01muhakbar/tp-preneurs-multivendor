import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerPaymentProfile } from "../../api/sellerPaymentProfile.ts";
import {
  adaptSeller2026PaymentProfile,
  emptySeller2026PaymentProfile,
} from "../../api/seller2026/orders-payments.adapter.ts";

type UseSeller2026PaymentProfileOptions = {
  enabled?: boolean;
};

export function useSeller2026PaymentProfile(
  storeId: number | string | null | undefined,
  options: UseSeller2026PaymentProfileOptions = {}
) {
  const enabled = Boolean(storeId) && options.enabled !== false;
  const profileQuery = useQuery({
    queryKey: ["seller2026", "payment-profile", storeId],
    queryFn: () => getSellerPaymentProfile(storeId as number | string),
    enabled,
    retry: false,
  });

  const data = useMemo(
    () =>
      enabled || profileQuery.data
        ? adaptSeller2026PaymentProfile(profileQuery.data)
        : emptySeller2026PaymentProfile,
    [enabled, profileQuery.data]
  );

  return {
    data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
  };
}
