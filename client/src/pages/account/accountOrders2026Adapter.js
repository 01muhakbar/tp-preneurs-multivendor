import {
  getFirstEnabledOrderContractAction,
  getOrderContractSummary,
} from "../../utils/orderContract.ts";
import { getOrderTruthStatus } from "../../utils/orderTruth.js";
import { resolvePublicOrderReference } from "../../utils/publicOrderReference.js";
import {
  buildStoreWhatsAppUrl,
  formatCompactOrderNumber,
} from "./accountOrderDetail2026Adapter.js";

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

const resolveFilterBucket = (order, truthStatus, contractSummary) => {
  const statusCode = text(contractSummary?.code || truthStatus?.code || order?.status, "").toUpperCase();
  const paymentCode = text(order?.paymentStatus || contractSummary?.paymentStatus, "").toUpperCase();
  const fulfillmentStatus = text(order?.fulfillmentStatus || order?.stores?.[0]?.fulfillmentStatus, "").toUpperCase();

  if (/CANCELLED|CANCELED|FAILED|EXPIRED|VOID/.test(statusCode) || /CANCELLED|FAILED|EXPIRED/.test(paymentCode)) {
    return "cancelled";
  }
  if (/REFUNDED|RETURNED|RETURN/.test(statusCode) || /REFUNDED|RETURNED/.test(fulfillmentStatus)) {
    return "returns";
  }
  if (paymentCode !== "PAID" && paymentCode !== "SETTLED") {
    return "unpaid";
  }
  if (statusCode === "DELIVERED" || statusCode === "COMPLETED" || fulfillmentStatus === "DELIVERED") {
    return "completed";
  }
  if (statusCode === "SHIPPED" || statusCode === "IN_DELIVERY" || fulfillmentStatus === "SHIPPED") {
    return "shipping";
  }
  return "to_pack";
};

const normalizeItem = (item) => {
  const it = asObject(item);
  return {
    id: asNumber(it.id ?? it.order_item_id ?? it.orderItemId, 0),
    productId: asNumber(it.productId ?? it.product_id ?? it.itemId ?? it.product?.id, 0),
    name: text(it.name || it.productName || it.title || it.product?.name, "Produk"),
    image: text(it.image || it.imageSnapshot || it.imageUrl || it.product?.image, ""),
    variant: text(it.variant || it.variantLabel || it.variantKey, ""),
    price: asNumber(
      it.price ||
      it.priceSnapshot ||
      it.unitPrice ||
      (it.totalPrice && it.quantity ? Math.round(it.totalPrice / it.quantity) : 0),
      0
    ),
    quantity: Math.max(1, asNumber(it.quantity || it.qty, 1)),
    totalPrice: asNumber(it.totalPrice || it.price, 0),
    slug: text(it.slug || it.productSlug || it.product?.slug, ""),
    isReviewed: Boolean(it.isReviewed),
    reviewId: asNumber(it.reviewId, null),
    rating: asNumber(it.rating, null),
  };
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

const resolvePaymentAction = ({ id, contract, paymentEntry, order }) => {
  const continuePaymentAction = getFirstEnabledOrderContractAction(contract, [
    "CONTINUE_PAYMENT",
    "CONTINUE_STRIPE_PAYMENT",
  ]);
  const paymentUrl =
    text(order?.paymentUrl) ||
    text(order?.duitkuPaymentUrl) ||
    text(paymentEntry.paymentUrl) ||
    (paymentEntry.targetUrl && /^https?:\/\//i.test(paymentEntry.targetUrl) ? text(paymentEntry.targetUrl) : "") ||
    "";

  const isExternal = Boolean(paymentUrl && /^https?:\/\//i.test(paymentUrl));
  const path = isExternal
    ? paymentUrl
    : (paymentEntry.visible && text(paymentEntry.targetPath)) ||
      text(continuePaymentAction?.targetPath) ||
      (id ? `/user/my-orders/${encodeURIComponent(String(id))}` : "");

  if (!path) return null;
  return {
    label: text(paymentEntry.label || continuePaymentAction?.label, "Bayar Sekarang"),
    path,
    url: isExternal ? paymentUrl : "",
    isExternal,
  };
};

const STATUS_TRANSLATIONS = {
  DELIVERED: { en: "Delivered", id: "Terkirim" },
  IN_DELIVERY: { en: "On delivery", id: "Dalam Pengiriman" },
  IN_PROGRESS: { en: "In progress", id: "Sedang Diproses" },
  READY_TO_FULFILL: { en: "Ready to Fulfill", id: "Siap Diproses" },
  PROCESSING: { en: "Processing", id: "Diproses" },
  AWAITING_PAYMENT: { en: "Awaiting Payment", id: "Menunggu Pembayaran" },
  UNDER_REVIEW: { en: "Under Review", id: "Dalam Peninjauan" },
  CANCELLED: { en: "Cancelled", id: "Dibatalkan" },
  CANCELED: { en: "Cancelled", id: "Dibatalkan" },
  FAILED: { en: "Failed", id: "Gagal" },
  EXPIRED: { en: "Expired", id: "Kedaluwarsa" },
  PENDING: { en: "Pending", id: "Menunggu" },
  COMPLETED: { en: "Completed", id: "Selesai" },
};

const PAYMENT_TRANSLATIONS = {
  PAID: { en: "Paid", id: "Lunas" },
  UNPAID: { en: "Unpaid", id: "Belum Bayar" },
  EXPIRED: { en: "Expired", id: "Kedaluwarsa" },
  FAILED: { en: "Failed", id: "Gagal" },
  REFUNDED: { en: "Refunded", id: "Dikembalikan" },
  ACTION_REQUIRED: { en: "Action Required", id: "Perlu Tindakan" },
};

export const slugifyStoreName = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const resolveStoreSlug = (order, primaryStoreName = "") => {
  const directSlug =
    order?.storeSlug ||
    order?.store?.slug ||
    asArray(order?.stores).find((s) => asObject(s).slug)?.slug ||
    asArray(order?.storeSplits).find((s) => asObject(s).storeSlug)?.storeSlug ||
    asArray(order?.groups).find((g) => asObject(g).storeSlug)?.storeSlug;

  const valid = text(directSlug);
  if (valid) return valid;
  return slugifyStoreName(primaryStoreName) || "store";
};

const normalizeStoreNames = (order) => {
  const names = [
    order.storeName,
    order.store?.name,
    ...asArray(order.storeNames),
    ...asArray(order.stores).map((store) => asObject(store).name),
    ...asArray(order.storeSplits).map((split) => asObject(split).storeName),
    ...asArray(order.groups).map((group) => asObject(group).storeName),
  ]
    .map((value) => text(value))
    .filter(Boolean);
  return [...new Set(names)];
};

const normalizeOrder = (value, options = {}) => {
  const isIndo = Boolean(options.isIndo);
  const order = asObject(value);
  const id = asNumber(order.id, 0);
  const contract = asObject(order.contract);
  const contractSummary = getOrderContractSummary(contract);
  const truthStatus = getOrderTruthStatus(order);
  const paymentMeta = asObject(order.paymentStatusMeta);
  const paymentEntry = asObject(order.paymentEntry);
  const checkoutMode = normalizeCheckoutMode(order.checkoutMode);
  const storeNames = normalizeStoreNames(order);
  const primaryStoreName = storeNames.length > 0 ? storeNames[0] : "";
  const primaryStoreSlug = resolveStoreSlug(order, primaryStoreName);
  const reference =
    resolvePublicOrderReference(
      order.invoiceNo,
      order.ref,
      order.invoice,
      order.orderRef
    ) || (id ? `#${id}` : "Order");
  const statusCode = text(contractSummary?.code || truthStatus.code, "UNKNOWN").toUpperCase();
  const rawStatusLabel = text(contractSummary?.label || truthStatus.label, "Unknown");
  const bucket = resolveFilterBucket(order, truthStatus, contractSummary);
  const bucketLabels = {
    completed: { en: "Completed", id: "Selesai" },
    to_pack: { en: "To Pack", id: "Dikemas" },
    shipping: { en: "On Delivery", id: "Dikirim" },
    unpaid: { en: "Unpaid", id: "Belum Bayar" },
    returns: { en: "Refund Completed", id: "Pengembalian Dana Selesai" },
    cancelled: { en: "Cancelled", id: "Dibatalkan" },
  };
  const statusLabel =
    bucketLabels[bucket]?.[isIndo ? "id" : "en"] ||
    STATUS_TRANSLATIONS[statusCode]?.[isIndo ? "id" : "en"] ||
    (isIndo && rawStatusLabel === "In progress"
      ? "Sedang Diproses"
      : isIndo && rawStatusLabel === "Delivered"
        ? "Terkirim"
        : rawStatusLabel);
  const statusTone = resolveVisualTone(
    statusCode,
    statusLabel,
    contractSummary?.tone || truthStatus.tone
  );
  const rawPayment = resolvePaymentState(order, paymentEntry, paymentMeta, contractSummary);
  const paymentCode = rawPayment.code || "UNPAID";
  const paymentLabel =
    PAYMENT_TRANSLATIONS[paymentCode]?.[isIndo ? "id" : "en"] ||
    (isIndo && rawPayment.label === "Paid"
      ? "Lunas"
      : isIndo && rawPayment.label === "Unpaid"
        ? "Belum Bayar"
        : rawPayment.label);
  const paymentState = {
    ...rawPayment,
    label: paymentLabel,
  };
  const detailPath = id ? `/user/my-orders/${encodeURIComponent(String(id))}` : null;
  const paymentAction = resolvePaymentAction({ id, contract, paymentEntry, order });
  const createdAt = order.createdAt || order.created_at || order.orderTime || null;
  const shippingAmount = asNumber(
    order.shipping ?? order.shippingAmount ?? order.deliveryFee,
    0
  );
  const totalAmount = asNumber(order.totalAmount ?? order.total, 0);
  const paymentMethod = text(order.paymentMethodLabel || order.paymentMethod || order.method, "-");

  const rawItems = asArray(order.items);
  const items = rawItems.map(normalizeItem);
  const effectiveItems =
    items.length > 0
      ? items
      : [
          {
            id: id,
            productId: 0,
            name: primaryStoreName ? `${primaryStoreName} Produk` : reference,
            image: "",
            variant: "",
            price: totalAmount,
            quantity: 1,
            totalPrice: totalAmount,
            slug: "",
          },
        ];
  const totalItemCount = asNumber(
    order.itemsCount,
    effectiveItems.reduce((acc, it) => acc + (it.quantity || 1), 0)
  );

  const rawStoreWhatsapp =
    text(order.storeWhatsapp) ||
    text(asArray(order.stores).find((s) => asObject(s).whatsapp)?.whatsapp) ||
    text(order.storePhone) ||
    text(asArray(order.stores).find((s) => asObject(s).phone)?.phone) ||
    "";

  const rawStorePhone =
    text(order.storePhone) ||
    text(asArray(order.stores).find((s) => asObject(s).phone)?.phone) ||
    "";

  const compactOrderNo = formatCompactOrderNumber(
    order.invoiceNo || reference,
    id,
    createdAt
  );

  const sellerChatUrl = buildStoreWhatsAppUrl({
    whatsappNumber: rawStoreWhatsapp,
    storePhone: rawStorePhone,
    orderRef: compactOrderNo,
    storeName: primaryStoreName,
    orderDate: createdAt,
    paymentMethod,
    totalAmount,
    items: effectiveItems,
    isIndo,
  });

  return {
    id,
    displayId: reference,
    compactOrderNo,
    reference,
    href: detailPath,
    detailPath,
    date: createdAt,
    createdAt,
    storeNames,
    primaryStoreName,
    primaryStoreSlug,
    storeSlug: primaryStoreSlug,
    storeWhatsapp: rawStoreWhatsapp,
    storePhone: rawStorePhone,
    sellerChatUrl,
    storeMode: checkoutMode.shortLabel,
    checkoutMode,
    items: effectiveItems,
    totalItemCount,
    isReviewed: Boolean(
      order.isReviewed ||
        (effectiveItems.length > 0 && effectiveItems.every((it) => it.isReviewed))
    ),
    status: {
      code: statusCode,
      label: statusLabel,
      tone: statusTone,
      description: text(contractSummary?.description || truthStatus.summary?.description),
      isFinal: Boolean(contractSummary?.isFinal ?? truthStatus.isFinal),
      bucket,
    },
    statusKey: statusCode,
    statusTone,
    payment: {
      code: paymentCode,
      label: paymentLabel,
      tone: paymentState.tone,
      description: "",
    },
    paymentState,
    note: "",
    shipping: shippingAmount,
    shippingAmount,
    total: totalAmount,
    totalAmount,
    paymentMethod,
    paymentAction,
    availableActions: normalizeAvailableActions(contract),
  };
};

export const isIndonesianLanguage = (i18nInstance) => {
  if (typeof window !== "undefined") {
    const stored = String(localStorage.getItem("store_language") || "").trim().toLowerCase();
    if (stored === "indonesia" || stored === "id" || stored === "bahasa indonesia") {
      return true;
    }
    if (stored === "english" || stored === "en") {
      return false;
    }
  }
  const current = String(i18nInstance?.language || "").trim().toLowerCase();
  return current.startsWith("id");
};

export const normalizeAccountOrdersFor2026 = (response, options = {}) => {
  const source = asObject(response);
  const rawOrders = Array.isArray(response)
    ? response
    : asArray(source.data ?? source.items ?? source.orders);
  const meta = asObject(source.meta ?? source.pagination ?? source.pageInfo);
  const orders = rawOrders.map((row) => normalizeOrder(row, options));
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
      unpaid: orders.filter((order) => order.status.bucket === "unpaid").length,
      to_pack: orders.filter((order) => order.status.bucket === "to_pack").length,
      shipping: orders.filter((order) => order.status.bucket === "shipping").length,
      completed: orders.filter((order) => order.status.bucket === "completed").length,
      returns: orders.filter((order) => order.status.bucket === "returns").length,
      cancelled: orders.filter((order) => order.status.bucket === "cancelled").length,
    },
  };
};
