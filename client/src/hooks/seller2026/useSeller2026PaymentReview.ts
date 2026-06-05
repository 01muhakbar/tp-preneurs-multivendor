import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSellerPaymentReviewSuborders } from "../../api/sellerPayments.ts";
import {
  adaptSeller2026PaymentReview,
  emptySeller2026PaymentReview,
} from "../../api/seller2026/orders-payments.adapter.ts";
import {
  approveSeller2026PaymentReview,
  rejectSeller2026PaymentReview,
  type Seller2026PaymentReviewMutationPayload,
} from "../../api/seller2026/payments.mutations.ts";

export type Seller2026PaymentReviewQuery = {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026PaymentReviewOptions = {
  enabled?: boolean;
  canReview?: boolean;
};

const fail = (message: string) => {
  throw new Error(message);
};

export function useSeller2026PaymentReview(
  storeId: number | string | null | undefined,
  query: Seller2026PaymentReviewQuery = {},
  options: UseSeller2026PaymentReviewOptions = {}
) {
  const queryClient = useQueryClient();
  const enabled = Boolean(storeId) && options.enabled !== false;
  const paymentStatus =
    query.status && query.status !== "all" ? String(query.status).toUpperCase() : "PENDING_CONFIRMATION";
  const queryKey = ["seller2026", "payment-review", storeId, paymentStatus];
  const reviewQuery = useQuery({
    queryKey,
    queryFn: () => getSellerPaymentReviewSuborders(storeId as number | string, paymentStatus),
    enabled,
    retry: false,
  });

  const data = useMemo(() => {
    const adapted =
      enabled || reviewQuery.data
        ? adaptSeller2026PaymentReview(reviewQuery.data)
        : emptySeller2026PaymentReview;
    const search = String(query.search || "").trim().toLowerCase();
    if (!search) return adapted;
    const payments = adapted.payments.filter((item) =>
      [item.paymentNo, item.invoiceNo, item.customerName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
    return {
      ...adapted,
      payments,
      selectedPayment: payments[0]
        ? {
            ...payments[0],
            payerName: payments[0].customerName,
            referenceNo: payments[0].paymentNo,
            breakdown: [
              { label: "Amount received", value: payments[0].amount },
              { label: "Payment method", value: payments[0].method || "Unknown" },
              { label: "Invoice", value: payments[0].invoiceNo || "-" },
              {
                label: "Review eligibility",
                value: payments[0].canReview ? "Ready for review" : payments[0].reviewReason || "Not reviewable",
              },
            ],
            riskChecks: [
              { label: "Nominal check", status: payments[0].amount > 0 ? "pass" as const : "unknown" as const },
              { label: "Payment proof", status: payments[0].proofUrl ? "pass" as const : "unknown" as const },
              { label: "Review actionability", status: payments[0].canReview ? "pass" as const : "warning" as const },
            ],
            timeline: [{ label: "Payment submitted", actor: "Customer", createdAt: payments[0].receivedAt }],
          }
        : null,
      summary: {
        ...adapted.summary,
        totalPending: payments.filter((item) => item.status.includes("PENDING")).length,
        totalAmount: payments.reduce((sum, item) => sum + item.amount, 0),
      },
    };
  }, [enabled, query.search, reviewQuery.data]);

  const invalidatePaymentReview = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["seller2026", "payment-review", storeId] }),
      queryClient.invalidateQueries({ queryKey: ["seller2026", "orders", storeId] }),
      queryClient.invalidateQueries({ queryKey: ["seller2026", "suborder-detail", storeId] }),
      queryClient.invalidateQueries({ queryKey: ["seller", "payment-review", storeId] }),
      queryClient.invalidateQueries({ queryKey: ["seller", "orders", storeId] }),
    ]);
  };

  const canReview = Boolean(options.canReview && data.governance?.canReview);

  const approveMutation = useMutation({
    mutationFn: async ({
      paymentId,
      payload,
    }: {
      paymentId: string | number;
      payload?: Seller2026PaymentReviewMutationPayload;
    }) => {
      if (!enabled || !storeId) fail("Seller store scope is required before reviewing payment.");
      if (!canReview) fail(data.governance?.note || "Payment review is not available for this role.");
      if (paymentId === undefined || paymentId === null || paymentId === "") fail("Payment id is required.");
      const scopedStoreId = storeId as number | string;
      const result = await approveSeller2026PaymentReview({ storeId: scopedStoreId, paymentId, payload });
      if (!result.ok) fail(result.error.message);
      return result.data;
    },
    onSuccess: invalidatePaymentReview,
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      paymentId,
      payload,
    }: {
      paymentId: string | number;
      payload?: Seller2026PaymentReviewMutationPayload;
    }) => {
      if (!enabled || !storeId) fail("Seller store scope is required before reviewing payment.");
      if (!canReview) fail(data.governance?.note || "Payment review is not available for this role.");
      if (paymentId === undefined || paymentId === null || paymentId === "") fail("Payment id is required.");
      if (!String(payload?.reason ?? payload?.note ?? "").trim()) {
        fail("Reject reason is required.");
      }
      const scopedStoreId = storeId as number | string;
      const result = await rejectSeller2026PaymentReview({ storeId: scopedStoreId, paymentId, payload });
      if (!result.ok) fail(result.error.message);
      return result.data;
    },
    onSuccess: invalidatePaymentReview,
  });

  return {
    data,
    isLoading: reviewQuery.isLoading,
    isError: reviewQuery.isError,
    error: reviewQuery.error,
    refetch: reviewQuery.refetch,
    canReview,
    approvingId: approveMutation.variables?.paymentId ?? null,
    rejectingId: rejectMutation.variables?.paymentId ?? null,
    isMutating: approveMutation.isPending || rejectMutation.isPending,
    mutationError: approveMutation.error || rejectMutation.error || null,
    approvePayment: approveMutation.mutateAsync,
    rejectPayment: rejectMutation.mutateAsync,
  };
}
