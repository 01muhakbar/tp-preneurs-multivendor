import type {
  SellerSuborderListResponse,
  SellerSuborderReviewItem,
} from "../sellerPayments.ts";
import type { PaymentCollectionDto } from "../paymentCollectionDto";

export type Seller2026PaymentMatchStatus =
  | "MATCHED"
  | "NEEDS_REVIEW"
  | "RISK_FLAG";

export type Seller2026PaymentProofRow = {
  id: number | string;
  paymentId: number | string;
  proofId: number | string | null;
  orderId: number | string;
  orderCode: string;
  suborderId: number | string;
  suborderNumber: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  buyer: {
    name: string;
    email: string;
    phone: string;
    initials: string;
  };
  items: SellerSuborderReviewItem["items"];
  paymentMethod: string;
  paymentType: string;
  collection?: PaymentCollectionDto;
  collectionRail: string;
  claimState: string;
  attemptStatus: string;
  callbackState: string;
  paymentUrl: string | null;
  paymentReference: string;
  paymentCode: string;
  expectedAmount: number;
  amount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentStatusLabel: string;
  paymentStatusTone: string;
  proofStatus: string;
  proofStatusLabel: string;
  proofStatusTone: string;
  proofUrl: string | null;
  proofImageUrl: string | null;
  proofPreviewUrls: string[];
  senderName: string;
  senderAccount: string;
  buyerNote: string;
  reviewNote: string;
  submittedAt: string | null;
  transferTime: string | null;
  reviewedAt: string | null;
  reviewedByUserId: number | null;
  reviewer: string;
  fulfillmentStatus: string;
  fulfillmentLabel: string;
  matchStatus: Seller2026PaymentMatchStatus;
  canReview: boolean;
  reviewReason: string;
  raw: SellerSuborderReviewItem;
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

const readCollection = (entry: SellerSuborderReviewItem): PaymentCollectionDto => ({
  ...(entry.collection || {}),
  ...(entry.payment?.collection || {}),
  collectionRail:
    entry.payment?.collectionRail ||
    entry.collectionRail ||
    entry.payment?.collection?.collectionRail ||
    entry.collection?.collectionRail ||
    null,
  claimState:
    entry.payment?.claimState ||
    entry.claimState ||
    entry.payment?.collection?.claimState ||
    entry.collection?.claimState ||
    null,
  attemptStatus:
    entry.payment?.attemptStatus ||
    entry.attemptStatus ||
    entry.payment?.collection?.attemptStatus ||
    entry.collection?.attemptStatus ||
    null,
  paymentUrl:
    entry.payment?.paymentUrl ||
    entry.paymentUrl ||
    entry.payment?.collection?.paymentUrl ||
    entry.collection?.paymentUrl ||
    null,
  callbackState:
    entry.payment?.callbackState ||
    entry.callbackState ||
    entry.payment?.collection?.callbackState ||
    entry.collection?.callbackState ||
    null,
  manualReviewReason:
    entry.payment?.manualReviewReason ||
    entry.manualReviewReason ||
    entry.payment?.collection?.manualReviewReason ||
    entry.collection?.manualReviewReason ||
    null,
});

const isQrisSellerReview = (entry: SellerSuborderReviewItem, collection: PaymentCollectionDto) => {
  const rail = text(collection.collectionRail).toUpperCase();
  const channel = text(entry.payment?.paymentChannel).toUpperCase();
  const type = text(entry.payment?.paymentType).toUpperCase();
  if (rail === "DUITKU_POP" || channel === "DUITKU" || type === "DUITKU_POP" || collection.paymentUrl) {
    return false;
  }
  return channel === "QRIS" || type === "QRIS_STATIC";
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
  const proofImageUrl = text(proof?.proofImageUrl) || null;
  const paymentReference = text(payment?.internalReference, "-");
  const collection = readCollection(entry);
  const canReviewQris = isQrisSellerReview(entry, collection);

  return {
    id: payment?.id || proof?.id || entry.suborderId,
    paymentId: payment?.id || entry.suborderId,
    proofId: proof?.id || null,
    orderId: entry.orderId,
    orderCode: text(entry.orderNumber, entry.suborderNumber),
    suborderId: entry.suborderId,
    suborderNumber: text(entry.suborderNumber, `Order ${entry.suborderId}`),
    orderNumber: text(entry.orderNumber, entry.suborderNumber),
    buyerName,
    buyerEmail: text(entry.buyer?.email),
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
    collection,
    collectionRail: text(collection.collectionRail),
    claimState: text(collection.claimState),
    attemptStatus: text(collection.attemptStatus),
    callbackState: text(collection.callbackState, "NONE"),
    paymentUrl: text(collection.paymentUrl) || null,
    paymentReference,
    paymentCode: paymentReference,
    expectedAmount,
    amount: expectedAmount,
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
    proofUrl: proofImageUrl,
    proofImageUrl,
    proofPreviewUrls: proofImageUrl ? [proofImageUrl] : [],
    senderName: text(proof?.senderName, buyerName),
    senderAccount: text(proof?.senderBankOrWallet, "Not provided"),
    buyerNote: text(proof?.note),
    reviewNote: text(proof?.reviewNote),
    submittedAt: proof?.createdAt || entry.createdAt || null,
    transferTime: proof?.transferTime || null,
    reviewedAt: proof?.reviewedAt || null,
    reviewedByUserId: proof?.reviewedByUserId || null,
    reviewer: proof?.reviewedByUserId ? `Reviewer #${proof?.reviewedByUserId}` : "",
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
    canReview: Boolean(canReviewQris && payment?.reviewActionability?.canReview),
    reviewReason: canReviewQris
      ? text(payment?.reviewActionability?.reason)
      : "Duitku hosted payments are settled by callback and are not reviewed in the QRIS proof lane.",
    raw: entry,
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
