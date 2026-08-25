import { submitSellerPaymentProfileRequest } from "../sellerPaymentProfile.ts";
import { runSeller2026Mutation } from "./mutations.ts";

export type Seller2026PaymentProfileRequestPayload = {
  accountName?: string | null;
  merchantName?: string | null;
  merchantId?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolderName?: string | null;
  payoutProofImageUrl?: string | null;
  qrisImageUrl?: string | null;
  qrisPayload?: string | null;
  instructionText?: string | null;
  sellerNote?: string | null;
};

const textOrNull = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  return normalized || null;
};

export function buildSeller2026PaymentProfileRequestPayload(
  payload: Seller2026PaymentProfileRequestPayload
) {
  return {
    accountName: textOrNull(payload.accountName),
    merchantName: textOrNull(payload.merchantName),
    merchantId: textOrNull(payload.merchantId),
    bankName: textOrNull(payload.bankName),
    accountNumber: textOrNull(payload.accountNumber),
    accountHolderName: textOrNull(payload.accountHolderName),
    payoutProofImageUrl: textOrNull(payload.payoutProofImageUrl),
    qrisImageUrl: textOrNull(payload.qrisImageUrl),
    qrisPayload: textOrNull(payload.qrisPayload),
    instructionText: textOrNull(payload.instructionText),
    sellerNote: textOrNull(payload.sellerNote),
  };
}

export async function submitSeller2026PaymentProfileRequest({
  storeId,
  payload,
}: {
  storeId: number | string;
  payload: Seller2026PaymentProfileRequestPayload;
}) {
  return runSeller2026Mutation(() =>
    submitSellerPaymentProfileRequest(storeId, buildSeller2026PaymentProfileRequestPayload(payload))
  );
}
