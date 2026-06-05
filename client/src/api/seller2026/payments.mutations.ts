import { reviewSellerStorePayment } from "../sellerPayments.ts";
import { runSeller2026Mutation } from "./mutations.ts";

type Seller2026PaymentReviewAction = "APPROVE" | "REJECT";

export type Seller2026PaymentReviewMutationPayload = {
  note?: string | null;
  reason?: string | null;
};

const trimOptional = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || null;
};

function buildReviewPayload(
  action: Seller2026PaymentReviewAction,
  payload: Seller2026PaymentReviewMutationPayload = {}
) {
  const note = action === "REJECT"
    ? trimOptional(payload.reason ?? payload.note)
    : trimOptional(payload.note);

  return {
    action,
    note: note ? note.slice(0, 2000) : null,
  };
}

export async function approveSeller2026PaymentReview({
  storeId,
  paymentId,
  payload,
}: {
  storeId: number | string;
  paymentId: number | string;
  payload?: Seller2026PaymentReviewMutationPayload;
}) {
  return runSeller2026Mutation(() =>
    reviewSellerStorePayment(storeId, paymentId, buildReviewPayload("APPROVE", payload))
  );
}

export async function rejectSeller2026PaymentReview({
  storeId,
  paymentId,
  payload,
}: {
  storeId: number | string;
  paymentId: number | string;
  payload?: Seller2026PaymentReviewMutationPayload;
}) {
  return runSeller2026Mutation(() =>
    reviewSellerStorePayment(storeId, paymentId, buildReviewPayload("REJECT", payload))
  );
}
