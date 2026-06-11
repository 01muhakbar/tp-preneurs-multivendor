import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSellerPaymentReviewSuborders,
  type SellerSuborderListResponse,
} from "../../api/sellerPayments.ts";
import {
  adaptSeller2026PaymentReview,
  emptySeller2026PaymentReview,
  type Seller2026PaymentMatchStatus,
} from "../../api/seller2026/paymentReview.adapter.ts";
import {
  approveSeller2026PaymentReview,
  rejectSeller2026PaymentReview,
  type Seller2026PaymentReviewMutationPayload,
} from "../../api/seller2026/payments.mutations.ts";

export type Seller2026PaymentReviewQuery = {
  search?: string;
  status?: string;
  paymentMethod?: string;
  matchStatus?: Seller2026PaymentMatchStatus | "all";
  reviewer?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026PaymentReviewOptions = {
  enabled?: boolean;
  canReview?: boolean;
};

const REVIEW_STATUSES = ["PENDING_CONFIRMATION", "PAID", "REJECTED"] as const;

const fail = (message: string) => {
  throw new Error(message);
};

const readDate = (value: string | undefined, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const matchesTab = (paymentStatus: string, tab: string) => {
  if (tab === "all") return true;
  if (tab === "awaiting") return paymentStatus === "PENDING_CONFIRMATION";
  if (tab === "approved") return paymentStatus === "PAID";
  if (tab === "rejected") return paymentStatus === "REJECTED";
  return true;
};

export function useSeller2026PaymentReview(
  storeId: number | string | null | undefined,
  query: Seller2026PaymentReviewQuery = {},
  options: UseSeller2026PaymentReviewOptions = {}
) {
  const queryClient = useQueryClient();
  const enabled = Boolean(storeId) && options.enabled !== false;
  const reviewQuery = useQuery({
    queryKey: ["seller2026", "payment-review", storeId],
    queryFn: async () =>
      Promise.all(
        REVIEW_STATUSES.map((status) =>
          getSellerPaymentReviewSuborders(storeId as number | string, status)
        )
      ),
    enabled,
    retry: false,
  });

  const completeData = useMemo(
    () =>
      enabled || reviewQuery.data
        ? adaptSeller2026PaymentReview(
            (reviewQuery.data || []) as SellerSuborderListResponse["data"][]
          )
        : emptySeller2026PaymentReview,
    [enabled, reviewQuery.data]
  );

  const data = useMemo(() => {
    const search = String(query.search || "").trim().toLowerCase();
    const tab = String(query.status || "awaiting").toLowerCase();
    const method = String(query.paymentMethod || "all").toLowerCase();
    const matchStatus = String(query.matchStatus || "all").toUpperCase();
    const reviewer = String(query.reviewer || "all").toLowerCase();
    const dateFrom = readDate(query.dateFrom);
    const dateTo = readDate(query.dateTo, true);

    const filteredRows = completeData.rows.filter((row) => {
      if (!matchesTab(row.paymentStatus, tab)) return false;
      if (
        search &&
        ![
          row.orderNumber,
          row.suborderNumber,
          row.paymentReference,
          row.buyer.name,
          row.buyer.email,
          row.buyerNote,
          row.reviewNote,
        ].some((value) => String(value || "").toLowerCase().includes(search))
      ) {
        return false;
      }
      if (
        method !== "all" &&
        !`${row.paymentMethod} ${row.paymentType}`.toLowerCase().includes(method)
      ) {
        return false;
      }
      if (matchStatus !== "ALL" && row.matchStatus !== matchStatus) return false;
      if (reviewer === "reviewed" && !row.reviewedByUserId) return false;
      if (reviewer === "unreviewed" && row.reviewedByUserId) return false;
      const submittedAt = row.submittedAt ? new Date(row.submittedAt) : null;
      if (dateFrom && submittedAt && submittedAt < dateFrom) return false;
      if (dateTo && submittedAt && submittedAt > dateTo) return false;
      return true;
    });

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Number(query.limit || 10));
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const today = new Date();
    const isToday = (value: string | null) => {
      if (!value) return false;
      const date = new Date(value);
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    };

    return {
      ...completeData,
      rows: filteredRows.slice(start, start + limit),
      counts: {
        awaiting: completeData.rows.filter(
          (row) => row.paymentStatus === "PENDING_CONFIRMATION"
        ).length,
        approved: completeData.rows.filter((row) => row.paymentStatus === "PAID")
          .length,
        rejected: completeData.rows.filter(
          (row) => row.paymentStatus === "REJECTED"
        ).length,
        all: completeData.rows.length,
      },
      summary: {
        awaiting: completeData.rows.filter(
          (row) => row.paymentStatus === "PENDING_CONFIRMATION"
        ).length,
        approvedToday: completeData.rows.filter(
          (row) => row.paymentStatus === "PAID" && isToday(row.reviewedAt || row.submittedAt)
        ).length,
        rejectedToday: completeData.rows.filter(
          (row) =>
            row.paymentStatus === "REJECTED" &&
            isToday(row.reviewedAt || row.submittedAt)
        ).length,
        verifiedAmount: completeData.rows
          .filter((row) => row.paymentStatus === "PAID")
          .reduce((sum, row) => sum + row.expectedAmount, 0),
      },
      pagination: {
        page: safePage,
        limit,
        total: filteredRows.length,
        totalPages,
      },
    };
  }, [completeData, query]);

  const invalidatePaymentReview = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["seller2026", "payment-review", storeId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["seller", "payment-review", storeId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["seller", "suborders", storeId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["seller", "workspace", "finance-summary", storeId],
      }),
      queryClient.invalidateQueries({ queryKey: ["account", "orders"] }),
    ]);
  };

  const canReview = Boolean(
    options.canReview && completeData.governance.canReview
  );

  const approveMutation = useMutation({
    mutationFn: async ({
      paymentId,
      payload,
    }: {
      paymentId: string | number;
      payload?: Seller2026PaymentReviewMutationPayload;
    }) => {
      if (!enabled || !storeId) {
        fail("Seller store scope is required before reviewing payment.");
      }
      if (!canReview) {
        fail(
          completeData.governance.note ||
            "Payment review is not available for this role."
        );
      }
      const row = completeData.rows.find(
        (item) => String(item.paymentId) === String(paymentId)
      );
      if (!row?.canReview) {
        fail(row?.reviewReason || "This payment is no longer reviewable.");
      }
      const scopedStoreId = storeId as number | string;
      const result = await approveSeller2026PaymentReview({
        storeId: scopedStoreId,
        paymentId,
        payload,
      });
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
      if (!enabled || !storeId) {
        fail("Seller store scope is required before reviewing payment.");
      }
      if (!canReview) {
        fail(
          completeData.governance.note ||
            "Payment review is not available for this role."
        );
      }
      const row = completeData.rows.find(
        (item) => String(item.paymentId) === String(paymentId)
      );
      if (!row?.canReview) {
        fail(row?.reviewReason || "This payment is no longer reviewable.");
      }
      if (!String(payload?.reason ?? payload?.note ?? "").trim()) {
        fail("Reject reason is required.");
      }
      const scopedStoreId = storeId as number | string;
      const result = await rejectSeller2026PaymentReview({
        storeId: scopedStoreId,
        paymentId,
        payload,
      });
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
