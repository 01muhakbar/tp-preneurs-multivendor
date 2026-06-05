import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSellerPaymentProfile } from "../../api/sellerPaymentProfile.ts";
import {
  adaptSeller2026PaymentProfile,
  emptySeller2026PaymentProfile,
} from "../../api/seller2026/orders-payments.adapter.ts";
import {
  submitSeller2026PaymentProfileRequest,
  type Seller2026PaymentProfileRequestPayload,
} from "../../api/seller2026/payment-profile.mutations.ts";

type UseSeller2026PaymentProfileOptions = {
  enabled?: boolean;
  canSubmit?: boolean;
};

const fail = (message: string) => {
  throw new Error(message);
};

export function useSeller2026PaymentProfile(
  storeId: number | string | null | undefined,
  options: UseSeller2026PaymentProfileOptions = {}
) {
  const queryClient = useQueryClient();
  const enabled = Boolean(storeId) && options.enabled !== false;
  const queryKey = ["seller2026", "payment-profile", storeId];
  const profileQuery = useQuery({
    queryKey,
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

  const canSubmit = Boolean(options.canSubmit && data.governance?.canEdit);
  const submitMutation = useMutation({
    mutationFn: async (payload: Seller2026PaymentProfileRequestPayload) => {
      if (!enabled || !storeId) fail("Seller store scope is required before submitting payment profile.");
      if (!canSubmit) {
        fail(
          data.governance?.isReviewLocked
            ? "The latest payment profile request is already under admin review."
            : data.governance?.note || "Payment profile request is not available for this role."
        );
      }
      if (!String(payload.accountName ?? "").trim()) fail("Account owner name is required.");
      if (!String(payload.merchantName ?? "").trim()) fail("Merchant name is required.");
      if (!String(payload.qrisImageUrl ?? "").trim()) fail("QRIS image URL is required.");
      const result = await submitSeller2026PaymentProfileRequest({
        storeId: storeId as number | string,
        payload,
      });
      if (!result.ok) fail(result.error.message);
      return result.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ["seller2026", "dashboard", storeId] }),
        queryClient.invalidateQueries({ queryKey: ["seller", "payment-profile", storeId] }),
      ]);
    },
  });

  return {
    data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
    canSubmit,
    submitting: submitMutation.isPending,
    mutationError: submitMutation.error || null,
    submitProfileRequest: submitMutation.mutateAsync,
  };
}
