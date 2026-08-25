import { createHash, randomUUID } from "node:crypto";
import {
  OrderPaymentAttempt,
  OrderPaymentAttemptEvent,
} from "../../models/index.js";
import type { OrderPaymentAttemptStatus } from "../../models/OrderPaymentAttempt.js";
import type {
  DuitkuCreateInvoiceRequest,
  NormalizedDuitkuCreateInvoiceResponse,
} from "./duitkuTypes.js";
import { normalizeDuitkuPaymentMethodCode } from "./duitkuPaymentMethods.service.js";

export type PersistDuitkuCreateInvoiceAttemptInput = {
  orderId: number;
  createdByUserId?: number | null;
  merchantOrderId: string;
  idempotencyKey: string;
  request: DuitkuCreateInvoiceRequest;
  response: NormalizedDuitkuCreateInvoiceResponse;
  createdAtProvider?: Date | null;
  transaction?: any;
};

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

export const sha256Hex = (value: unknown) =>
  createHash("sha256").update(typeof value === "string" ? value : stableStringify(value)).digest("hex");

export const mapDuitkuCreateInvoiceAttemptStatus = (
  response: NormalizedDuitkuCreateInvoiceResponse
): OrderPaymentAttemptStatus => {
  if (response.statusCode === "00" && response.reference && response.paymentUrl) return "PENDING";
  if (response.statusCode === "01") return "FAILED";
  return "UNKNOWN";
};

export const buildDuitkuAttemptHashes = (input: {
  idempotencyKey: string;
  request: DuitkuCreateInvoiceRequest;
}) => ({
  idempotencyKeyHash: sha256Hex(input.idempotencyKey),
  requestFingerprint: sha256Hex(input.request),
});

export const persistDuitkuCreateInvoiceAttempt = async (
  input: PersistDuitkuCreateInvoiceAttemptInput
) => {
  const { idempotencyKeyHash, requestFingerprint } = buildDuitkuAttemptHashes({
    idempotencyKey: input.idempotencyKey,
    request: input.request,
  });
  const status = mapDuitkuCreateInvoiceAttemptStatus(input.response);
  const transactionOption = input.transaction ? { transaction: input.transaction } : undefined;

  const existing = await OrderPaymentAttempt.findOne({
    where: {
      orderId: input.orderId,
      idempotencyKeyHash,
    },
    transaction: input.transaction,
  } as any);

  if (existing) {
    const existingFingerprint = String((existing as any).requestFingerprint || "");
    if (existingFingerprint !== requestFingerprint) {
      throw new Error("Duitku idempotency key conflict for different request fingerprint.");
    }
    return {
      attempt: existing,
      replayed: true,
    };
  }

  const attempt = await OrderPaymentAttempt.create(
    {
      orderId: input.orderId,
      provider: "DUITKU",
      status,
      requiresManualReview: status === "UNKNOWN",
      manualReviewReason: status === "UNKNOWN" ? "CREATE_INVOICE_UNKNOWN" : null,
      manualReviewCreatedAt: status === "UNKNOWN" ? new Date() : null,
      merchantOrderId: input.merchantOrderId,
      providerReference: input.response.reference,
      paymentUrl: input.response.paymentUrl,
      amount: input.request.paymentAmount,
      currency: "IDR",
      expiryPeriodMinutes: input.request.expiryPeriod || 60,
      createdAtProvider: input.createdAtProvider || null,
      idempotencyKeyHash,
      requestFingerprint,
      providerLastCode: input.response.statusCode || null,
      providerLastMessage: input.response.statusMessage || null,
      reconcileAttemptCount: 0,
      createdByUserId: input.createdByUserId ?? null,
    } as any,
    transactionOption
  );

  await OrderPaymentAttemptEvent.create(
    {
      paymentAttemptId: Number((attempt as any).id),
      eventType: "CREATE_INVOICE",
      occurrenceKey: randomUUID(),
      providerCallId: randomUUID(),
      merchantOrderId: input.merchantOrderId,
      providerReference: input.response.reference,
      amountNormalized: input.request.paymentAmount,
      providerStatusCode: input.response.statusCode,
      paymentCode: normalizeDuitkuPaymentMethodCode(input.request.paymentMethod),
      signatureState: "NOT_APPLICABLE",
      processingResult: status === "PENDING" ? "APPLIED" : status === "FAILED" ? "IGNORED" : "QUARANTINED",
      eventHash: sha256Hex({
        request: input.request,
        response: input.response.raw,
      }),
      duplicateCount: 0,
    } as any,
    transactionOption
  );

  return {
    attempt,
    replayed: false,
  };
};
