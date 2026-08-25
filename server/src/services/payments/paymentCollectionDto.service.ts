import {
  normalizeDuitkuPaymentCode,
  resolveDuitkuPaymentMethodDisplay,
} from "../duitku/duitkuPaymentMethodDisplay.service.js";

const getAttr = (row: any, key: string) =>
  row?.getDataValue?.(key) ?? row?.get?.(key) ?? row?.dataValues?.[key];

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asArray = (value: unknown) => (Array.isArray(value) ? value : []);

const latestByDate = (rows: any[], key: string) =>
  [...rows].sort((left, right) => {
    const leftTime = new Date(getAttr(left, key) || 0).getTime();
    const rightTime = new Date(getAttr(right, key) || 0).getTime();
    return rightTime - leftTime;
  })[0] ?? null;

const readPaymentAttempts = (order: any) =>
  asArray(order?.paymentAttempts ?? order?.get?.("paymentAttempts"));

const readCallbackRows = (attempt: any) =>
  asArray(attempt?.callbackInboxRows ?? attempt?.get?.("callbackInboxRows"));

const readAttemptEvents = (attempt: any) =>
  asArray(attempt?.events ?? attempt?.get?.("events"));

export type PaymentCollectionDtoInput = {
  order?: any | null;
  suborders?: any[] | null;
  payments?: any[] | null;
};

export const buildPaymentCollectionDto = (input: PaymentCollectionDtoInput = {}) => {
  const order = input.order || null;
  const claim = order?.collectionClaim ?? order?.get?.("collectionClaim") ?? null;
  const attempts = readPaymentAttempts(order);
  const latestAttempt = latestByDate(attempts, "updatedAt");
  const callbacks = attempts.flatMap(readCallbackRows);
  const events = attempts.flatMap(readAttemptEvents);
  const latestCallback = latestByDate(callbacks, "updatedAt") || latestByDate(callbacks, "lastReceivedAt");
  const latestEventWithPaymentCode =
    latestByDate(events.filter((event: any) => getAttr(event, "paymentCode")), "lastReceivedAt") ||
    latestByDate(events.filter((event: any) => getAttr(event, "paymentCode")), "updatedAt");
  const paymentCode = normalizeDuitkuPaymentCode(
    getAttr(latestEventWithPaymentCode, "paymentCode") || getAttr(latestCallback, "paymentCodeRaw")
  );
  const callbackProcessingResult = String(getAttr(latestCallback, "processingResult") || "").toUpperCase();
  const callbackBindingState = String(getAttr(latestCallback, "bindingState") || "").toUpperCase();
  const callbackState = latestCallback
    ? callbackProcessingResult === "QUARANTINED"
      ? "QUARANTINED"
      : callbackBindingState || "BOUND"
    : "NONE";
  const suborders = asArray(input.suborders);
  const payments =
    input.payments && input.payments.length > 0
      ? asArray(input.payments)
      : suborders.flatMap((suborder: any) => asArray(suborder?.payments ?? suborder?.get?.("payments")));

  return {
    collectionRail: getAttr(claim, "rail") ? String(getAttr(claim, "rail")) : null,
    claimState: getAttr(claim, "claimState") ? String(getAttr(claim, "claimState")) : null,
    claimSource: getAttr(claim, "claimSource") ? String(getAttr(claim, "claimSource")) : null,
    attemptStatus: getAttr(latestAttempt, "status") ? String(getAttr(latestAttempt, "status")) : null,
    paymentCode,
    paymentMethodLabel: resolveDuitkuPaymentMethodDisplay({
      paymentMethod: getAttr(latestAttempt, "provider") ? "DUITKU" : null,
      paymentCode,
      fallback: getAttr(latestAttempt, "provider") ? "Duitku POP" : undefined,
    }),
    paymentUrl: getAttr(latestAttempt, "paymentUrl") ? String(getAttr(latestAttempt, "paymentUrl")) : null,
    callbackState,
    manualReviewReason: getAttr(latestAttempt, "manualReviewReason")
      ? String(getAttr(latestAttempt, "manualReviewReason"))
      : null,
    allocations: payments.map((payment: any) => ({
      paymentId: toNumber(getAttr(payment, "id"), 0) || null,
      suborderId: toNumber(getAttr(payment, "suborderId"), 0) || null,
      storeId: toNumber(getAttr(payment, "storeId"), 0) || null,
      paymentChannel: String(getAttr(payment, "paymentChannel") || "QRIS"),
      paymentType: String(getAttr(payment, "paymentType") || "QRIS_STATIC"),
      status: String(getAttr(payment, "status") || "CREATED"),
      amount: toNumber(getAttr(payment, "amount"), 0),
    })),
  };
};
