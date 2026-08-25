import { OrderPaymentAttempt, DuitkuCallbackInbox, OrderPaymentSecurityEvent } from "../../models/index.js";
import type { ParsedDuitkuCallback, DuitkuCallbackFields } from "./duitkuCallbackParser.service.js";
import { sha256Hex } from "./duitkuCallbackParser.service.js";

type CallbackRequestContext = {
  sourceIp?: string;
  userAgent?: string;
};

const truncate = (value: unknown, length: number) => {
  const text = String(value ?? "");
  return text ? text.slice(0, length) : null;
};

const hashOptional = (value: unknown) => {
  const text = String(value ?? "");
  return text ? sha256Hex(text) : null;
};

export const storeValidDuitkuCallback = async (
  parsed: ParsedDuitkuCallback,
  _context: CallbackRequestContext = {}
) => {
  const existing = await DuitkuCallbackInbox.findOne({
    where: { occurrenceKey: parsed.occurrenceKey },
  });
  if (existing) {
    await existing.update({
      duplicateCount: Number((existing as any).duplicateCount ?? 0) + 1,
      lastReceivedAt: new Date(),
    } as any);
    return {
      inbox: existing,
      duplicate: true,
      bindingState: existing.bindingState,
      processingResult: existing.processingResult,
    };
  }

  const attempts = await OrderPaymentAttempt.findAll({
    where: {
      provider: "DUITKU",
      merchantOrderId: parsed.fields.merchantOrderId,
    },
    limit: 2,
  });
  const paymentAttempt = attempts.length === 1 ? attempts[0] : null;
  const bindingState = attempts.length === 1 ? "BOUND" : attempts.length > 1 ? "AMBIGUOUS" : "UNBOUND";

  const now = new Date();
  const inbox = await DuitkuCallbackInbox.create({
    paymentAttemptId: paymentAttempt ? Number(paymentAttempt.id) : null,
    merchantCodeRaw: truncate(parsed.fields.merchantCode, 64)!,
    merchantOrderIdRaw: truncate(parsed.fields.merchantOrderId, 128)!,
    providerReferenceRaw: truncate(parsed.fields.reference, 192),
    paymentCodeRaw: truncate(parsed.fields.paymentCode, 40),
    amountRaw: truncate(parsed.fields.amount, 64)!,
    resultCodeRaw: truncate(parsed.fields.resultCode, 40)!,
    signatureState: "VALID",
    bindingState,
    processingResult: "QUARANTINED",
    quarantineReason:
      bindingState === "BOUND"
        ? "STEP5_NO_FINANCIAL_MUTATION"
        : bindingState === "AMBIGUOUS"
          ? "AMBIGUOUS_MERCHANT_ORDER_ID"
          : "UNKNOWN_MERCHANT_ORDER_ID",
    occurrenceKey: parsed.occurrenceKey,
    eventHash: parsed.eventHash,
    rawBodyDigest: parsed.rawBodyDigest,
    fieldValuesDigest: parsed.fieldValuesDigest,
    duplicateCount: 0,
    firstReceivedAt: now,
    lastReceivedAt: now,
  });

  return {
    inbox,
    duplicate: false,
    bindingState,
    processingResult: "QUARANTINED" as const,
  };
};

export const storeDuitkuCallbackSecurityEvent = async (input: {
  eventType: "CALLBACK_INVALID_SIGNATURE" | "CALLBACK_MALFORMED" | "CALLBACK_OVERSIZED";
  fields?: Partial<DuitkuCallbackFields>;
  signatureState?: "INVALID" | "NOT_CHECKED";
  rawBodyDigest?: string | null;
  fieldValuesDigest?: string | null;
  context?: CallbackRequestContext;
}) => {
  const fields = input.fields || {};
  return OrderPaymentSecurityEvent.create({
    eventType: input.eventType,
    merchantCodePrefix: truncate(fields.merchantCode, 64),
    merchantOrderIdPrefix: truncate(fields.merchantOrderId, 128),
    providerReferencePrefix: truncate(fields.reference, 192),
    amountPrefix: truncate(fields.amount, 64),
    resultCodePrefix: truncate(fields.resultCode, 40),
    signatureState: input.signatureState || "NOT_CHECKED",
    rawBodyDigest: input.rawBodyDigest || null,
    fieldValuesDigest: input.fieldValuesDigest || null,
    sourceIpHash: hashOptional(input.context?.sourceIp),
    userAgentHash: hashOptional(input.context?.userAgent),
    receivedAt: new Date(),
  });
};
