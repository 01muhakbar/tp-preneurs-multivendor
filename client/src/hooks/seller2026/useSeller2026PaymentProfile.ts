import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSellerPaymentProfile,
  saveSellerPaymentProfileDraft,
  submitSellerPaymentProfileRequest,
  uploadSellerPaymentProfileImage,
} from "../../api/sellerPaymentProfile.ts";
import {
  adaptSeller2026PaymentProfile,
  emptySeller2026PaymentProfile,
  type Seller2026PaymentProfileForm,
} from "../../api/seller2026/paymentProfile.adapter.ts";
import {
  buildPaymentProfilePayload,
  validatePaymentProfileDraft,
  validatePaymentProfileImage,
} from "../../api/paymentProfile.contract.ts";

type Options = {
  enabled?: boolean;
  canEdit?: boolean;
};

const fail = (message: string): never => {
  throw new Error(message);
};

export const buildSeller2026PaymentProfilePayload = (
  form: Seller2026PaymentProfileForm
) => buildPaymentProfilePayload(form);

const mutationMessage = (error: unknown, fallback: string) => {
  const response = (error as { response?: { data?: { code?: string; message?: string } } })
    ?.response?.data;
  const code = String(response?.code || "").toUpperCase();
  if (code === "PAYMENT_PROFILE_REVIEW_LOCKED") {
    return "This payment profile request is locked while Admin review is in progress.";
  }
  return response?.message || (error as Error)?.message || fallback;
};

export function useSeller2026PaymentProfile(
  storeId: number | string | null | undefined,
  options: Options = {}
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
      profileQuery.data
        ? adaptSeller2026PaymentProfile(profileQuery.data)
        : emptySeller2026PaymentProfile,
    [profileQuery.data]
  );
  const canEdit = Boolean(options.canEdit && data.governance.canEdit);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({
        queryKey: ["seller", "payment-profile", storeId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["seller2026", "dashboard", storeId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["seller", "workspace", storeId],
      }),
    ]);
  };

  const assertEditable = () => {
    if (!enabled || !storeId) {
      fail("Seller store scope is required before updating Payment Profile.");
    }
    if (!canEdit) {
      fail(
        data.governance.lockReason ||
          data.governance.note ||
          "Payment Profile is read-only for this seller role."
      );
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (form: Seller2026PaymentProfileForm) => {
      assertEditable();
      return saveSellerPaymentProfileDraft(
        storeId as number | string,
        buildSeller2026PaymentProfilePayload(form)
      );
    },
    onSuccess: invalidate,
  });

  const submitMutation = useMutation({
    mutationFn: async (form: Seller2026PaymentProfileForm) => {
      assertEditable();
      const payload = buildSeller2026PaymentProfilePayload(form);
      const validationErrors = validatePaymentProfileDraft(form);
      const firstError = Object.values(validationErrors)[0];
      if (firstError) fail(firstError);
      return submitSellerPaymentProfileRequest(
        storeId as number | string,
        payload
      );
    },
    onSuccess: invalidate,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      assertEditable();
      const validationError = validatePaymentProfileImage(file);
      if (validationError) fail(validationError);
      return uploadSellerPaymentProfileImage(file);
    },
  });

  return {
    data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
    canEdit,
    saving: saveMutation.isPending,
    submitting: submitMutation.isPending,
    uploading: uploadMutation.isPending,
    saveError: saveMutation.error
      ? mutationMessage(saveMutation.error, "Failed to save Payment Profile draft.")
      : null,
    submitError: submitMutation.error
      ? mutationMessage(
          submitMutation.error,
          "Failed to submit Payment Profile for review."
        )
      : null,
    uploadError: uploadMutation.error
      ? mutationMessage(uploadMutation.error, "Failed to upload QRIS image.")
      : null,
    saveDraft: saveMutation.mutateAsync,
    submitForReview: submitMutation.mutateAsync,
    uploadQris: uploadMutation.mutateAsync,
  };
}
