import {
  getFirstEnabledOrderContractAction,
  getOrderContractSummary,
} from "../../utils/orderContract.ts";
import { getOrderTruthStatus } from "../../utils/orderTruth.js";
import { resolvePublicOrderReference } from "../../utils/publicOrderReference.js";

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);

const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const text = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const KNOWN_TONES = [
  "emerald",
  "amber",
  "sky",
  "teal",
  "indigo",
  "rose",
  "orange",
  "stone",
  "success",
  "warning",
  "danger",
  "blue",
  "neutral",
];

const normalizeTone = (value) => {
  const tone = text(value, "stone").toLowerCase();
  return KNOWN_TONES.includes(tone)
    ? tone
    : "stone";
};

const toTitleCase = (value) =>
  text(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeCheckoutMode = (value) => {
  const code = text(value, "LEGACY").toUpperCase();
  const label =
    code === "SINGLE_STORE"
      ? "Single Store"
      : code === "MULTI_STORE"
        ? "Multi Store"
        : toTitleCase(code) || "Order";
  return {
    code,
    label,
    shortLabel: label.toUpperCase(),
  };
};

const resolveFilterBucket = (truthStatus) => {
  if (truthStatus.bucket === "complete") return "completed";
  if (truthStatus.bucket === "cancelled") return "cancelled";
  if (truthStatus.bucket === "processing" || truthStatus.bucket === "shipping") {
    return "processing";
  }
  return "pending";
};

const resolveVisualTone = (codeValue, labelValue, fallbackTone) => {
  const code = text(codeValue).toUpperCase();
  const label = text(labelValue).toLowerCase();
  const combined = `${code} ${label}`;

  if (/split payment under review|under review|pending|awaiting payment|action_required/.test(combined)) {
    return "warning";
  }
  if (/cancelled|canceled/.test(combined)) {
    return "neutral";
  }
  if (/failed|rejected|void|expired/.test(combined)) {
    return "danger";
  }
  if (/processing|packed|shipped|fulfillment|in_delivery|in progress|ready/.test(combined)) {
    return "blue";
  }
  if (/completed|complete|delivered|paid|success|final/.test(combined)) {
    return "success";
  }

  const normalizedTone = normalizeTone(fallbackTone);
  if (["amber", "orange"].includes(normalizedTone)) return "warning";
  if (normalizedTone === "rose") return "danger";
  if (["sky", "teal", "indigo"].includes(normalizedTone)) return "blue";
  if (normalizedTone === "emerald") return "success";
  return "neutral";
};

const resolvePaymentState = (order, paymentEntry, paymentMeta, contractSummary) => {
  const code = text(
    paymentEntry.summaryStatus ||
      order.paymentStatus ||
      paymentMeta.code ||
      contractSummary?.paymentStatus,
    "UNPAID"
  ).toUpperCase();
  const label = text(
    paymentEntry.summaryStatus === "ACTION_REQUIRED"
      ? "Unpaid"
      : paymentMeta.label || paymentEntry.summaryLabel,
    code === "PAID" ? "Paid" : "Unpaid"
  );
  return {
    code,
    label,
    tone: resolveVisualTone(code, label, paymentMeta.tone),
  };
};

const normalizeAvailableActions = (contract) =>
  asArray(asObject(contract).availableActions).map((actionValue) => {
    const action = asObject(actionValue);
    return {
      code: text(action.code).toUpperCase(),
      label: text(action.label, "Order action"),
      enabled: Boolean(action.enabled),
      reason: text(action.reason),
      targetPath: text(action.targetPath),
    };
  });

const resolvePaymentAction = ({ id, contract, paymentEntry }) => {
  const continuePaymentAction = getFirstEnabledOrderContractAction(contract, [
    "CONTINUE_PAYMENT",
    "CONTINUE_STRIPE_PAYMENT",
  ]);
  const path =
    (paymentEntry.visible && text(paymentEntry.targetPath)) ||
    text(continuePaymentAction?.targetPath) ||
    (paymentEntry.visible && id
      ? `/user/my-orders/${encodeURIComponent(String(id))}/payment`
      : "");

  if (!path) return null;
  return {
    label: text(paymentEntry.label || continuePaymentAction?.label, "Payment"),
    path,
  };
};

const normalizeStoreNames = (order) => {
  const names = [
    order.storeName,
    order.store?.name,
    ...asArray(order.storeNames),
    ...asArray(order.storeSplits).map((split) => asObject(split).storeName),
    ...asArray(order.groups).map((group) => asObject(group).storeName),
  ]
    .map((value) => text(value))
    .filter(Boolean);
  return [...new Set(names)];
};

const normalizeOrder = (value) => {
  const order = asObject(value);
  const id = asNumber(order.id, 0);
  const contract = asObject(order.contract);
  const contractSummary = getOrderContractSummary(contract);
  const truthStatus = getOrderTruthStatus(order);
  const paymentMeta = asObject(order.paymentStatusMeta);
  const paymentEntry = asObject(order.paymentEntry);
  const checkoutMode = normalizeCheckoutMode(order.checkoutMode);
  const storeNames = normalizeStoreNames(order);
  const reference =
    resolvePublicOrderReference(
      order.invoiceNo,
      order.ref,
      order.invoice,
      order.orderRef
    ) || (id ? `#${id}` : "Order");
  const statusCode = text(contractSummary?.code || truthStatus.code, "UNKNOWN").toUpperCase();
  const statusLabel = text(contractSummary?.label || truthStatus.label, "Unknown");
  const statusTone = resolveVisualTone(
    statusCode,
    statusLabel,
    contractSummary?.tone || truthStatus.tone
  );
  const paymentState = resolvePaymentState(order, paymentEntry, paymentMeta, contractSummary);
  const note = text(
    paymentEntry.summaryLabel ||
      paymentMeta.description ||
      contractSummary?.description ||
      truthStatus.summary?.description
  );
  const detailPath = id ? `/user/my-orders/${encodeURIComponent(String(id))}` : null;
  const paymentAction = resolvePaymentAction({ id, contract, paymentEntry });
  const createdAt = order.createdAt || order.created_at || order.orderTime || null;
  const shippingAmount = asNumber(
    order.shipping ?? order.shippingAmount ?? order.deliveryFee,
    0
  );
  const totalAmount = asNumber(order.totalAmount ?? order.total, 0);
  const paymentMethod = text(order.paymentMethodLabel || order.paymentMethod || order.method, "-");

  return {
    id,
    displayId: reference,
    reference,
    href: detailPath,
    detailPath,
    date: createdAt,
    createdAt,
    storeNames,
    storeMode: checkoutMode.shortLabel,
    checkoutMode,
    status: {
      code: statusCode,
      label: statusLabel,
      tone: statusTone,
      description: text(contractSummary?.description || truthStatus.summary?.description),
      isFinal: Boolean(contractSummary?.isFinal ?? truthStatus.isFinal),
      bucket: resolveFilterBucket(truthStatus),
    },
    statusKey: statusCode,
    statusTone,
    payment: {
      code: text(order.paymentStatus, "UNPAID").toUpperCase(),
      label: text(paymentMeta.label, "Unpaid"),
      tone: paymentState.tone,
      description: note,
    },
    paymentState,
    note,
    shipping: shippingAmount,
    shippingAmount,
    total: totalAmount,
    totalAmount,
    paymentMethod,
    paymentAction,
    availableActions: normalizeAvailableActions(contract),
  };
};

export const normalizeAccountOrdersFor2026 = (response, options = {}) => {
  const source = asObject(response);
  const rawOrders = Array.isArray(response)
    ? response
    : asArray(source.data ?? source.items ?? source.orders);
  const meta = asObject(source.meta ?? source.pagination ?? source.pageInfo);
  const orders = rawOrders.map(normalizeOrder);
  const page = Math.max(1, asNumber(meta.page, asNumber(options.page, 1)));
  const pageSize = Math.max(
    1,
    asNumber(meta.limit ?? meta.pageSize ?? meta.perPage, orders.length || 20)
  );
  const totalOrders = Math.max(
    orders.length,
    asNumber(meta.total ?? meta.totalItems ?? meta.count, orders.length)
  );
  const totalPages = Math.max(
    1,
    asNumber(
      meta.totalPages ?? meta.total_pages ?? meta.lastPage ?? meta.totalPage,
      Math.ceil(totalOrders / pageSize) || 1
    )
  );

  return {
    orders,
    page,
    pageSize,
    totalOrders,
    totalPages,
    counts: {
      all: totalOrders,
      pending: orders.filter((order) => order.status.bucket === "pending").length,
      processing: orders.filter((order) => order.status.bucket === "processing").length,
      completed: orders.filter((order) => order.status.bucket === "completed").length,
      cancelled: orders.filter((order) => order.status.bucket === "cancelled").length,
    },
  };
};
