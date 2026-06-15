import { getOrderContractSummary } from "../../utils/orderContract.ts";
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

const normalizeTone = (value) => {
  const tone = text(value, "stone").toLowerCase();
  return ["emerald", "amber", "sky", "teal", "indigo", "rose", "orange", "stone"].includes(
    tone
  )
    ? tone
    : "stone";
};

const normalizeCheckoutMode = (value) => {
  const code = text(value, "LEGACY").toUpperCase();
  return {
    code,
    label: code.replaceAll("_", " "),
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

const normalizeOrder = (value) => {
  const order = asObject(value);
  const id = asNumber(order.id, 0);
  const contractSummary = getOrderContractSummary(order.contract);
  const truthStatus = getOrderTruthStatus(order);
  const paymentMeta = asObject(order.paymentStatusMeta);
  const paymentEntry = asObject(order.paymentEntry);
  const checkoutMode = normalizeCheckoutMode(order.checkoutMode);
  const reference =
    resolvePublicOrderReference(
      order.invoiceNo,
      order.ref,
      order.invoice,
      order.orderRef
    ) || (id ? `#${id}` : "Order");

  return {
    id,
    reference,
    detailPath: id ? `/user/my-orders/${encodeURIComponent(String(id))}` : null,
    createdAt: order.createdAt || order.created_at || order.orderTime || null,
    checkoutMode,
    status: {
      code: text(contractSummary?.code || truthStatus.code, "UNKNOWN").toUpperCase(),
      label: text(contractSummary?.label || truthStatus.label, "Unknown"),
      tone: normalizeTone(contractSummary?.tone || truthStatus.tone),
      description: text(contractSummary?.description),
      isFinal: Boolean(contractSummary?.isFinal ?? truthStatus.isFinal),
      bucket: resolveFilterBucket(truthStatus),
    },
    payment: {
      code: text(order.paymentStatus, "UNPAID").toUpperCase(),
      label: text(paymentMeta.label, "Unpaid"),
      tone: normalizeTone(paymentMeta.tone),
      description: text(
        paymentEntry.summaryLabel || paymentMeta.description || contractSummary?.description
      ),
    },
    shippingAmount: asNumber(
      order.shipping ?? order.shippingAmount ?? order.deliveryFee,
      0
    ),
    totalAmount: asNumber(order.totalAmount ?? order.total, 0),
    paymentMethod: text(order.paymentMethod || order.method, "-"),
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
