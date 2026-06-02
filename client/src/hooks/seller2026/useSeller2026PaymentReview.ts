import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerPaymentReviewSuborders } from "../../api/sellerPayments.ts";
import {
  adaptSeller2026PaymentReview,
  emptySeller2026PaymentReview,
} from "../../api/seller2026/orders-payments.adapter.ts";

export type Seller2026PaymentReviewQuery = {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026PaymentReviewOptions = {
  enabled?: boolean;
};

export function useSeller2026PaymentReview(
  storeId: number | string | null | undefined,
  query: Seller2026PaymentReviewQuery = {},
  options: UseSeller2026PaymentReviewOptions = {}
) {
  const enabled = Boolean(storeId) && options.enabled !== false;
  const paymentStatus =
    query.status && query.status !== "all" ? String(query.status).toUpperCase() : "PENDING_CONFIRMATION";
  const reviewQuery = useQuery({
    queryKey: ["seller2026", "payment-review", storeId, paymentStatus],
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
      selectedPayment: payments[0] ? adapted.selectedPayment : null,
      summary: {
        ...adapted.summary,
        totalPending: payments.filter((item) => item.status.includes("PENDING")).length,
        totalAmount: payments.reduce((sum, item) => sum + item.amount, 0),
      },
    };
  }, [enabled, query.search, reviewQuery.data]);

  return {
    data,
    isLoading: reviewQuery.isLoading,
    isError: reviewQuery.isError,
    error: reviewQuery.error,
    refetch: reviewQuery.refetch,
  };
}
