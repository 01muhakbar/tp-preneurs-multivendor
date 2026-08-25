import { formatCurrency } from "../../utils/format.js";
import { getGroupedPaymentReadModel } from "../../utils/groupedPaymentReadModel.ts";
import {
  getSplitOperationalBridge,
  getSplitOperationalBuyerAction,
  getSplitOperationalEnabledBuyerAction,
  getSplitOperationalPayment,
  getSplitOperationalStatusSummary,
} from "../../utils/splitOperationalTruth.ts";

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);

const text = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeCollection = (...sources) => {
  const merged = sources.reduce((acc, source) => {
    const value = asObject(source);
    return { ...acc, ...value };
  }, {});
  return {
    collectionRail: text(merged.collectionRail, null),
    claimState: text(merged.claimState, null),
    claimSource: text(merged.claimSource, null),
    attemptStatus: text(merged.attemptStatus, null),
    paymentUrl: text(merged.paymentUrl, null),
    callbackState: text(merged.callbackState, "NONE"),
    manualReviewReason: text(merged.manualReviewReason, null),
    paymentCode: text(merged.paymentCode, null),
    paymentMethodLabel: text(merged.paymentMethodLabel, null),
    allocations: asArray(merged.allocations),
  };
};

const isDuitkuCollection = (collection, payment) => {
  const rail = text(collection?.collectionRail).toUpperCase();
  const channel = text(payment?.paymentChannel).toUpperCase();
  const type = text(payment?.paymentType || payment?.method).toUpperCase();
  return rail === "DUITKU_POP" || channel === "DUITKU" || type === "DUITKU_POP" || Boolean(collection?.paymentUrl);
};

const isQrisCollection = (collection, payment) => {
  if (isDuitkuCollection(collection, payment)) return false;
  const channel = text(payment?.paymentChannel || payment?.method).toUpperCase();
  const type = text(payment?.paymentType || payment?.method).toUpperCase();
  return channel === "QRIS" || type === "QRIS_STATIC";
};

const normalizeTone = (value) => {
  const tone = text(value, "stone").toLowerCase();
  return [
    "emerald",
    "amber",
    "sky",
    "teal",
    "indigo",
    "rose",
    "orange",
    "slate",
    "stone",
  ].includes(tone)
    ? tone
    : "stone";
};

const normalizeStatus = (code, meta, fallbackLabel = "Pending") => {
  const source = asObject(meta);
  const normalizedCode = text(source.code || code, "UNKNOWN").toUpperCase();
  return {
    code: normalizedCode,
    label: text(source.label, fallbackLabel || normalizedCode),
    tone: normalizeTone(source.tone),
    description: text(source.description),
    isFinal: Boolean(source.isFinal),
  };
};

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const normalizeWhatsAppNumber = (value) => {
  const raw = text(value);
  if (!raw) return "";

  let candidate = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      candidate =
        url.searchParams.get("phone") ||
        url.pathname.split("/").filter(Boolean).find((part) => /\d{7,}/.test(part)) ||
        "";
    } catch {
      candidate = raw;
    }
  }

  const digits = candidate.replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
};

const buildStoreWhatsAppContact = ({
  contact,
  storeName,
  orderReference,
  paymentReference,
  amountDisplay,
  notificationKind,
}) => {
  const number = normalizeWhatsAppNumber(contact);
  if (!number) return null;
  const paymentMessage =
    notificationKind === "paid"
      ? `Pembayaran ${amountDisplay} dengan referensi ${paymentReference} telah berhasil dibayar.`
      : `Saya telah mengunggah bukti pembayaran ${amountDisplay} dengan referensi ${paymentReference}.`;
  const message = [
    `Halo ${storeName},`,
    `saya pembeli untuk pesanan ${orderReference}.`,
    paymentMessage,
    "Mohon bantu cek dan konfirmasi pembayaran pesanan saya. Terima kasih.",
  ].join(" ");

  return {
    href: `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
    number,
  };
};

const getAction = (group, codes) => {
  for (const code of codes) {
    const action = getSplitOperationalEnabledBuyerAction(group, code);
    if (action) return action;
  }
  return null;
};

const hasAnyActionDeclaration = (group, codes) =>
  codes.some((code) => getSplitOperationalBuyerAction(group, code));

const getCompatibleActionability = (group, readModel, payment, codes, key) => {
  const enabledAction = getAction(group, codes);
  if (enabledAction) return { enabled: true, action: enabledAction, reason: "" };

  const hasActionDeclaration = hasAnyActionDeclaration(group, codes);
  const fallback = asObject(readModel?.[key] || payment?.[key]);
  const fallbackEnabled =
    key === "proofActionability" ? fallback.canStartProof : fallback.canCancel;

  return {
    enabled: !hasActionDeclaration && Boolean(fallbackEnabled),
    action: null,
    reason: text(fallback.reason),
  };
};

const getProgressStep = (statusCode) => {
  const code = text(statusCode).toUpperCase();
  if (code === "PAID") return 4;
  if (code === "PENDING_CONFIRMATION") return 3;
  if (["CREATED", "REJECTED", "UNPAID"].includes(code)) return 2;
  if (["FAILED", "EXPIRED", "CANCELLED"].includes(code)) return 3;
  return 1;
};

const normalizeGroup = (value, index, orderReference, detailedPayment) => {
  const group = asObject(value);
  const groupedPayment = asObject(group.payment);
  const detail = asObject(detailedPayment);
  const detailMatches =
    detail.paymentId != null && String(detail.paymentId) === String(groupedPayment.id);
  const payment = detailMatches
    ? { ...groupedPayment, ...detail, id: groupedPayment.id ?? detail.paymentId }
    : groupedPayment;
  const collection = normalizeCollection(
    group.collection,
    payment.collection,
    detail.collection,
    {
      collectionRail: group.collectionRail || payment.collectionRail || detail.collectionRail,
      claimState: group.claimState || payment.claimState || detail.claimState,
      attemptStatus: group.attemptStatus || payment.attemptStatus || detail.attemptStatus,
      paymentUrl: group.paymentUrl || payment.paymentUrl || detail.paymentUrl,
      callbackState: group.callbackState || payment.callbackState || detail.callbackState,
      manualReviewReason:
        group.manualReviewReason || payment.manualReviewReason || detail.manualReviewReason,
      allocations: group.allocations || payment.allocations || detail.allocations,
    }
  );
  const readModel = getGroupedPaymentReadModel(group);
  const operationalPayment = getSplitOperationalPayment(group);
  const operationalSummary = asObject(getSplitOperationalStatusSummary(group));
  const bridge = getSplitOperationalBridge(group);
  const laneStatus = text(
    operationalPayment.laneStatus || readModel.status || payment.status,
    "UNPAID"
  ).toUpperCase();
  const settlementStatus = text(
    operationalPayment.status || readModel.settlementStatus || group.paymentStatus,
    "UNPAID"
  ).toUpperCase();
  const paymentStatus = normalizeStatus(
    laneStatus,
    operationalPayment.laneStatusMeta || readModel.statusMeta || payment.statusMeta,
    text(operationalSummary.label, laneStatus)
  );
  const splitStatus = normalizeStatus(
    operationalSummary.code || settlementStatus,
    operationalSummary,
    text(operationalSummary.label, settlementStatus)
  );
  const confirmActionability = getCompatibleActionability(
    group,
    readModel,
    payment,
    ["SUBMIT_PAYMENT_PROOF", "SUBMIT_PROOF"],
    "proofActionability"
  );
  const cancelActionability = getCompatibleActionability(
    group,
    readModel,
    payment,
    ["CANCEL_PAYMENT", "CANCEL_TRANSACTION"],
    "cancelability"
  );
  const amount = number(payment.amount ?? group.totalAmount, 0);
  const paymentReference = text(
    payment.internalReference || payment.externalReference || group.suborderNumber
  );
  const hasPaymentProof = Boolean(payment.proofSubmitted || payment.proof);
  const hostedPayment = isDuitkuCollection(collection, payment);
  const qrisProofPayment = isQrisCollection(collection, payment);
  const canNotifyStore = laneStatus === "PAID" || hasPaymentProof;
  const storeContact =
    normalizeWhatsAppNumber(group.storeWhatsapp) ||
    normalizeWhatsAppNumber(group.storePhone);
  const whatsappContact = canNotifyStore
    ? buildStoreWhatsAppContact({
        contact: storeContact,
        storeName: text(group.storeName, "Store"),
        orderReference,
        paymentReference,
        amountDisplay: formatCurrency(amount),
        notificationKind: laneStatus === "PAID" ? "paid" : "proof",
      })
    : null;

  return {
    id: payment.id ?? group.suborderId ?? group.storeId ?? index,
    paymentId: payment.id ?? null,
    storeName: text(group.storeName, "Store"),
    suborderNumber: text(group.suborderNumber, "Store split"),
    amount,
    amountDisplay: formatCurrency(amount),
    subtotalDisplay: formatCurrency(number(group.subtotalAmount, 0)),
    shippingDisplay: formatCurrency(number(group.shippingAmount, 0)),
    itemCount: asArray(group.items).reduce(
      (total, item) => total + number(item?.qty ?? item?.quantity, 0),
      0
    ),
    paymentReference,
    method: hostedPayment
      ? text(
          payment.paymentMethodLabel ||
            group.paymentMethodLabel ||
            collection.paymentMethodLabel,
          "Duitku POP"
        )
      : text(payment.paymentType || payment.paymentChannel || group.paymentMethod, "QRIS"),
    collection,
    collectionRail: collection.collectionRail,
    claimState: collection.claimState,
    attemptStatus: collection.attemptStatus,
    paymentUrl: collection.paymentUrl,
    callbackState: collection.callbackState,
    manualReviewReason: collection.manualReviewReason,
    isHostedRedirect: hostedPayment,
    isQrisProofPayment: qrisProofPayment,
    merchantName: text(payment.merchantName || group.merchantName, "Not set"),
    accountName: text(payment.accountName || group.accountName, "Not set"),
    instruction: text(
      payment.instructionText || group.paymentInstruction,
      "Pay to this payment destination only."
    ),
    qrImageUrl: text(payment.qrImageUrl),
    expiresAt: readModel.expiresAt || payment.expiresAt || null,
    expiresAtLabel: formatDateTime(readModel.expiresAt || payment.expiresAt),
    status: paymentStatus,
    splitStatus,
    settlementStatus,
    proof: payment.proof || null,
    proofSubmitted: hasPaymentProof,
    whatsappContact,
    canConfirmTransfer: Boolean(payment.id && qrisProofPayment && confirmActionability.enabled),
    confirmReason: text(confirmActionability.action?.reason || confirmActionability.reason),
    canCancelPayment: Boolean(payment.id && cancelActionability.enabled),
    cancelReason: text(cancelActionability.action?.reason || cancelActionability.reason),
    bridgeNote: text(bridge.shipmentBlockedReason || operationalSummary.description),
    progressStep: getProgressStep(laneStatus),
  };
};

export const normalizeOrderPaymentFor2026 = ({
  order,
  payment,
  readModel,
  selectedPaymentId,
}) => {
  const source = asObject(readModel || payment || order);
  const reference = text(
    source.invoiceNo || source.ref || order?.invoiceNo || order?.ref,
    "Order"
  );
  const groups = asArray(source.groups).map((group, index) =>
    normalizeGroup(group, index, reference, payment)
  );
  const primary =
    groups.find((group) => String(group.paymentId) === String(selectedPaymentId)) ||
    groups.find((group) => group.canConfirmTransfer) ||
    groups.find((group) => group.canCancelPayment) ||
    groups.find((group) => group.qrImageUrl) ||
    groups[0] ||
    null;
  const summary = asObject(source.summary);
  const grandTotal = number(summary.grandTotal ?? source.totalAmount ?? primary?.amount, 0);
  const subtotal = number(summary.subtotalAmount ?? source.subtotalAmount, 0);
  const shipping = number(summary.shippingAmount ?? source.shippingAmount, 0);
  const createdAt = source.createdAt || order?.createdAt || null;
  const status = normalizeStatus(
    source.paymentStatus,
    source.paymentStatusMeta,
    "Awaiting Payment"
  );
  const paymentReference = text(primary?.paymentReference || reference, reference);
  const collection = normalizeCollection(source.collection, primary?.collection, {
    collectionRail: source.collectionRail,
    claimState: source.claimState,
    attemptStatus: source.attemptStatus,
    paymentUrl: source.paymentUrl || primary?.paymentUrl,
    callbackState: source.callbackState,
    manualReviewReason: source.manualReviewReason,
    allocations: source.allocations,
  });

  return {
    orderId: source.orderId ?? order?.id ?? null,
    reference,
    checkoutMode: text(source.checkoutMode, "SINGLE_STORE").replaceAll("_", " "),
    status,
    amount: primary?.amount || grandTotal,
    amountDisplay: formatCurrency(primary?.amount || grandTotal),
    paymentReference,
    collection,
    collectionRail: collection.collectionRail,
    claimState: collection.claimState,
    attemptStatus: collection.attemptStatus,
    paymentUrl: collection.paymentUrl,
    callbackState: collection.callbackState,
    manualReviewReason: collection.manualReviewReason,
    createdAt,
    createdAtLabel: formatDate(createdAt),
    createdAtDateTimeLabel: formatDateTime(createdAt),
    dueAt: primary?.expiresAt || null,
    dueAtLabel: primary?.expiresAtLabel || "No open payment",
    totals: {
      items: number(summary.totalItems, groups.reduce((total, group) => total + group.itemCount, 0)),
      subtotal,
      subtotalDisplay: formatCurrency(subtotal),
      shipping,
      shippingDisplay: formatCurrency(shipping),
      grandTotal,
      grandTotalDisplay: formatCurrency(grandTotal),
      storeGroups: groups.length,
    },
    progress: {
      activeStep: primary?.progressStep || 1,
      steps: ["Created", "Waiting", "Review", "Confirmed"],
    },
    qr: {
      imageUrl: text(primary?.qrImageUrl),
      storeName: text(primary?.storeName, "Store"),
      destination: text(primary?.method, "QRIS"),
      merchantName: text(primary?.merchantName, "Not set"),
      accountName: text(primary?.accountName, "Not set"),
      instruction: text(primary?.instruction, "Pay to this QRIS only."),
    },
    primaryPayment: primary,
    selectedDestination: primary,
    destinations: groups,
    groups,
    warnings: [
      source.checkoutMode &&
      text(source.checkoutMode).toUpperCase() !== "LEGACY" &&
      groups.length === 0
        ? "Store split payment details are temporarily unavailable."
        : "",
    ].filter(Boolean),
    actions: {
      canConfirmTransfer: Boolean(primary?.canConfirmTransfer),
      canCancelPayment: Boolean(primary?.canCancelPayment),
    },
    canConfirm: Boolean(primary?.canConfirmTransfer),
    canCancel: Boolean(primary?.canCancelPayment),
    paymentSummary: {
      items: number(summary.totalItems, groups.reduce((total, group) => total + group.itemCount, 0)),
      subtotal: number(summary.subtotalAmount ?? source.subtotalAmount, 0),
      shipping: number(summary.shippingAmount ?? source.shippingAmount, 0),
      total: grandTotal,
    },
  };
};

export const canConfirmTransfer2026 = (payment) =>
  Boolean(payment?.actions?.canConfirmTransfer && payment?.primaryPayment?.paymentId);

export const canCancelPayment2026 = (payment) =>
  Boolean(payment?.actions?.canCancelPayment && payment?.primaryPayment?.paymentId);
