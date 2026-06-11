import type {
  SellerSuborderListResponse,
  SellerSuborderReviewItem,
} from "../sellerPayments.ts";

export type Seller2026PaymentMatchStatus =
  | "MATCHED"
  | "NEEDS_REVIEW"
  | "RISK_FLAG";

export type Seller2026PaymentProofRow = {
  id: number | string;
  paymentId: number | string;
  proofId: number | string | null;
  suborderId: number | string;
  suborderNumber: string;
  orderNumber: string;
  buyer: {
    name: string;
    email: string;
    phone: string;
    initials: string;
  };
  items: SellerSuborderReviewItem["items"];
  paymentMethod: string;
  paymentType: string;
  paymentReference: string;
  expectedAmount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentStatusLabel: string;
  paymentStatusTone: string;
  proofStatus: string;
  proofStatusLabel: string;
  proofStatusTone: string;
  proofUrl: string | null;
  senderName: string;
  senderAccount: string;
  buyerNote: string;
  reviewNote: string;
  submittedAt: string | null;
  transferTime: string | null;
  reviewedAt: string | null;
  reviewedByUserId: number | null;
  fulfillmentStatus: string;
  fulfillmentLabel: string;
  matchStatus: Seller2026PaymentMatchStatus;
  canReview: boolean;
  reviewReason: string;
};

export type Seller2026PaymentReviewViewModel = {
  rows: Seller2026PaymentProofRow[];
  governance: {
    canView: boolean;
    canReview: boolean;
    roleCode: string;
    note: string;
  };
  store: {
    id: number | string | null;
    name: string;
    slug: string;
  };
};

type SellerPaymentPayload = SellerSuborderListResponse["data"];

const text = (value: unknown, fallback = "") =>
  String(value ?? fallback).trim();

const amount = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const initials = (value: string) =>
  value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "CU";

const tone = (value: unknown) => {
  const normalized = text(value).toLowerCase();
  if (["emerald", "green", "success"].includes(normalized)) return "green";
  if (["rose", "red", "danger"].includes(normalized)) return "red";
  if (["amber", "orange", "warning"].includes(normalized)) return "amber";
  if (["sky", "blue", "info"].includes(normalized)) return "blue";
  return "slate";
};

const paymentMethodLabel = (channel: unknown, type: unknown) => {
  const normalized = text(channel || type, "Payment");
  if (normalized.toUpperCase().includes("QRIS")) return "QRIS";
  if (normalized.toUpperCase().includes("BANK")) return "Bank Transfer";
  return normalized.replaceAll("_", " ");
};

const readMatchStatus = (
  paymentStatus: string,
  proofStatus: string,
  expectedAmount: number,
  paidAmount: number,
  hasProof: boolean
): Seller2026PaymentMatchStatus => {
  if (
    paymentStatus === "REJECTED" ||
    proofStatus === "REJECTED" ||
    ["FAILED", "EXPIRED", "CANCELLED"].includes(paymentStatus)
  ) {
    return "RISK_FLAG";
  }
  if (hasProof && expectedAmount > 0 && expectedAmount === paidAmount) {
    return "MATCHED";
  }
  return "NEEDS_REVIEW";
};

export function adaptSeller2026PaymentProof(
  entry: SellerSuborderReviewItem
): Seller2026PaymentProofRow {
  const payment = entry.payment;
  const proof = payment?.proof;
  const expectedAmount = amount(payment?.amount || entry.totalAmount);
  const paidAmount = amount(proof?.transferAmount);
  const paymentStatus = text(
    payment?.status || entry.paymentStatus,
    "PENDING_CONFIRMATION"
  ).toUpperCase();
  const proofStatus = text(proof?.reviewStatus, "PENDING").toUpperCase();
  const buyerName = text(entry.buyer?.name, "Customer");

  return {
    id: payment?.id || proof?.id || entry.suborderId,
    paymentId: payment?.id || entry.suborderId,
    proofId: proof?.id || null,
    suborderId: entry.suborderId,
    suborderNumber: text(entry.suborderNumber, `Order ${entry.suborderId}`),
    orderNumber: text(entry.orderNumber, entry.suborderNumber),
    buyer: {
      name: buyerName,
      email: text(entry.buyer?.email),
      phone: text(entry.buyer?.phone),
      initials: initials(buyerName),
    },
    items: Array.isArray(entry.items) ? entry.items : [],
    paymentMethod: paymentMethodLabel(
      payment?.paymentChannel,
      payment?.paymentType
    ),
    paymentType: text(payment?.paymentType),
    paymentReference: text(payment?.internalReference, "-"),
    expectedAmount,
    paidAmount,
    paymentStatus,
    paymentStatusLabel: text(
      payment?.statusMeta?.label || entry.paymentStatusMeta?.label,
      paymentStatus
    ),
    paymentStatusTone: tone(
      payment?.statusMeta?.tone || entry.paymentStatusMeta?.tone
    ),
    proofStatus,
    proofStatusLabel: text(proof?.reviewMeta?.label, proofStatus),
    proofStatusTone: tone(proof?.reviewMeta?.tone),
    proofUrl: text(proof?.proofImageUrl) || null,
    senderName: text(proof?.senderName, buyerName),
    senderAccount: text(proof?.senderBankOrWallet, "Not provided"),
    buyerNote: text(proof?.note),
    reviewNote: text(proof?.reviewNote),
    submittedAt: proof?.createdAt || entry.createdAt || null,
    transferTime: proof?.transferTime || null,
    reviewedAt: proof?.reviewedAt || null,
    reviewedByUserId: proof?.reviewedByUserId || null,
    fulfillmentStatus: text(entry.fulfillmentStatus, "UNFULFILLED"),
    fulfillmentLabel: text(
      entry.fulfillmentStatusMeta?.label,
      entry.fulfillmentStatus
    ),
    matchStatus: readMatchStatus(
      paymentStatus,
      proofStatus,
      expectedAmount,
      paidAmount,
      Boolean(proof?.proofImageUrl)
    ),
    canReview: Boolean(payment?.reviewActionability?.canReview),
    reviewReason: text(payment?.reviewActionability?.reason),
  };
}

export function adaptSeller2026PaymentReview(
  payloads: SellerPaymentPayload[]
): Seller2026PaymentReviewViewModel {
  const source = payloads.find((payload) => payload?.governance) || payloads[0];
  const uniqueRows = new Map<string, Seller2026PaymentProofRow>();

  payloads.forEach((payload) => {
    (payload?.items || []).forEach((entry) => {
      const row = adaptSeller2026PaymentProof(entry);
      uniqueRows.set(String(row.paymentId), row);
    });
  });

  const governance = source?.governance;
  const store = source?.store;
  return {
    rows: Array.from(uniqueRows.values()).sort(
      (left, right) =>
        new Date(right.submittedAt || 0).getTime() -
        new Date(left.submittedAt || 0).getTime()
    ),
    governance: {
      canView: governance?.canView !== false,
      canReview: Boolean(governance?.canReview),
      roleCode: text(governance?.roleCode),
      note: text(governance?.note),
    },
    store: {
      id: store?.id || null,
      name: text(store?.name),
      slug: text(store?.slug),
    },
  };
}

export const emptySeller2026PaymentReview: Seller2026PaymentReviewViewModel = {
  rows: [],
  governance: {
    canView: false,
    canReview: false,
    roleCode: "",
    note: "",
  },
  store: { id: null, name: "", slug: "" },
};
