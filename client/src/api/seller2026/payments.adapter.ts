const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export function adaptSellerPaymentReview(value: unknown) {
  const payment = object(value);
  return {
    id: payment?.id ?? null,
    suborderId: payment?.suborderId ?? null,
    senderName: text(payment?.senderName),
    amount: number(payment?.transferAmount ?? payment?.amount, 0),
    proofUrl: payment?.proofUrl || payment?.imageUrl || null,
    status: text(payment?.reviewStatus || payment?.status, "PENDING").toUpperCase(),
    riskLevel: text(payment?.riskLevel, "Low"),
    submittedAt: payment?.createdAt || payment?.submittedAt || null,
  };
}

export function adaptSellerPaymentProfile(value: unknown) {
  const profile = object(value);
  const qris = object(profile.qris);
  const bankAccount = object(profile.bankAccount);
  return {
    id: profile?.id ?? null,
    status: text(profile?.status || profile?.reviewStatus, "DRAFT").toUpperCase(),
    qrisEnabled: Boolean(profile?.qrisEnabled || qris.enabled),
    bankTransferEnabled: Boolean(profile?.bankTransferEnabled || profile?.bankAccount),
    payoutAccountLabel: text(profile?.payoutAccountLabel || bankAccount.accountName),
    verificationTimeline: Array.isArray(profile?.verificationTimeline)
      ? profile.verificationTimeline
      : [],
  };
}
