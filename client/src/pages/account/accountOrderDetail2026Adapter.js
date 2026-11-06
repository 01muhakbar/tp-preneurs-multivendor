import { getBuyerShipmentPresentation } from "../../utils/buyerShipmentPresentation.js";
import { formatCurrency } from "../../utils/format.js";
import { getGroupedPaymentReadModel } from "../../utils/groupedPaymentReadModel.ts";
import {
  getFirstEnabledOrderContractAction,
  getOrderContractSummary,
} from "../../utils/orderContract.ts";
import { getOrderTruthStatus } from "../../utils/orderTruth.js";
import { getOrderItemVariantLines } from "../../utils/orderVariantPresentation.js";
import { resolvePublicOrderReference } from "../../utils/publicOrderReference.js";
import { normalizeShipmentList } from "../../utils/shipmentReadModel.ts";
import {
  getSplitOperationalBuyerAction,
  getSplitOperationalPayment,
  getSplitOperationalShipment,
  getSplitOperationalStatusSummary,
} from "../../utils/splitOperationalTruth.ts";

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

const normalizeCode = (value, fallback = "UNKNOWN") =>
  text(value, fallback).toUpperCase().replace(/\s+/g, "_");

const titleCase = (value, fallback = "") =>
  text(value, fallback)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const slugifyStoreName = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const formatWhatsAppDigits = (raw) => {
  const normalized = String(raw || "").trim();
  if (!normalized) return "";
  let digits = normalized.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (digits.startsWith("8")) {
    digits = "62" + digits;
  }
  return digits;
};

export const buildStoreWhatsAppUrl = ({ whatsappNumber, orderRef = "", storeName = "" }) => {
  const raw = String(whatsappNumber || "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const digits = formatWhatsAppDigits(raw);
  if (!digits) return "";

  const textMsg = orderRef
    ? `Halo ${storeName || "Penjual"}, saya ingin menanyakan pesanan saya dengan nomor pesanan ${orderRef}.`
    : `Halo ${storeName || "Penjual"}, saya ingin menanyakan pesanan saya.`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(textMsg)}`;
};

export const formatCompactOrderNumber = (invoiceNo, orderId, createdAt) => {
  const raw = String(invoiceNo || "").trim();
  if (!raw && !orderId) return "-";

  if (/^TP-\d{6}-\w+/i.test(raw)) return raw;

  const d = createdAt ? new Date(createdAt) : null;
  const dateStr =
    d && !Number.isNaN(d.getTime())
      ? `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
      : "261104";

  const numPart = orderId
    ? String(orderId).padStart(4, "0")
    : raw.replace(/[^A-Za-z0-9]/g, "").slice(-4) || "0001";

  return `TP-${dateStr}-${numPart}`;
};

export const formatDateTime = (value, isIndo = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const locale = isIndo ? "id-ID" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const formatDateOnly = (value, isIndo = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const locale = isIndo ? "id-ID" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date);
};

const KNOWN_TONES = new Set([
  "emerald",
  "amber",
  "sky",
  "teal",
  "indigo",
  "rose",
  "orange",
  "stone",
  "slate",
  "success",
  "warning",
  "danger",
  "blue",
  "neutral",
]);

const normalizeTone = (value, fallback = "neutral") => {
  const tone = text(value, fallback).toLowerCase();
  return KNOWN_TONES.has(tone) ? tone : fallback;
};

const resolveTone = (codeValue, labelValue, fallbackTone) => {
  const code = normalizeCode(codeValue, "");
  const label = text(labelValue).toLowerCase();
  const combined = `${code} ${label}`;

  if (/paid|done|delivered|complete|completed|success|approved|final/.test(combined)) {
    return "success";
  }
  if (/packed|shipped|shipping|transit|processing|ready/.test(combined)) {
    return "blue";
  }
  if (/pending|awaiting|review|unpaid|created/.test(combined)) {
    return "warning";
  }
  if (/failed|rejected|expired|cancel|void|returned/.test(combined)) {
    return "danger";
  }

  const tone = normalizeTone(fallbackTone, "neutral");
  if (["emerald", "teal", "success"].includes(tone)) return "success";
  if (["sky", "indigo", "blue"].includes(tone)) return "blue";
  if (["amber", "orange", "warning"].includes(tone)) return "warning";
  if (["rose", "danger"].includes(tone)) return "danger";
  return "neutral";
};

const conciseStatusLabel = (codeValue, labelValue, fallback = "Unknown") => {
  const code = normalizeCode(codeValue, "");
  const label = text(labelValue, fallback);
  if (/DELIVERED|COMPLETE|COMPLETED/.test(code) || /delivered|complete/.test(label.toLowerCase())) {
    return "Delivered";
  }
  if (/PAID|APPROVED/.test(code) || /paid|approved/.test(label.toLowerCase())) {
    return "Payment Done";
  }
  if (/SHIPPED|IN_TRANSIT|SHIPPING/.test(code) || /shipped|transit|shipping/.test(label.toLowerCase())) {
    return "Shipped";
  }
  if (/PACKED/.test(code) || /packed/.test(label.toLowerCase())) {
    return "Packed";
  }
  if (/READY/.test(code) || /ready|processing/.test(label.toLowerCase())) {
    return "Ready";
  }
  if (/CANCEL/.test(code) || /cancel/.test(label.toLowerCase())) {
    return "Cancelled";
  }
  return label;
};

const normalizeStatus = (code, meta, fallbackLabel = "Unknown") => {
  const source = asObject(meta);
  const normalizedCode = normalizeCode(source.code || code, "UNKNOWN");
  const rawLabel = text(source.label, fallbackLabel || titleCase(normalizedCode));
  const label = conciseStatusLabel(normalizedCode, rawLabel, fallbackLabel);
  return {
    code: normalizedCode,
    label,
    rawLabel,
    tone: resolveTone(normalizedCode, rawLabel, source.tone),
    description: text(source.description),
    isFinal: Boolean(source.isFinal),
  };
};

const normalizeCheckoutMode = (value, storeCount = 0) => {
  const code = normalizeCode(value, storeCount > 1 ? "MULTI_STORE" : "SINGLE_STORE");
  if (code === "SINGLE_STORE") return { code, label: "Single Store" };
  if (code === "MULTI_STORE") return { code, label: "Multi Store" };
  return { code, label: titleCase(code, "Order") };
};

const normalizeMoney = (value) => {
  const amount = asNumber(value, 0);
  return {
    amount,
    display: formatCurrency(amount),
  };
};

const normalizeItem = (value, index, storeInfo = {}) => {
  const item = asObject(value);
  const quantity = asNumber(item.quantity ?? item.qty, 0);
  const unitPrice = asNumber(item.price ?? item.unitPrice ?? item.priceSnapshot, 0);
  const lineTotal = asNumber(item.lineTotal ?? item.totalPrice, unitPrice * quantity);
  return {
    id: text(item.id ?? item.productId ?? `${storeInfo.storeId || "item"}-${index}`),
    productId: item.productId ?? item.product?.id ?? null,
    storeId: item.storeId ?? storeInfo.storeId ?? null,
    storeName: text(item.storeName || storeInfo.storeName),
    name: text(item.name || item.productName || item.product?.name, "Product"),
    image: text(item.imageUrl || item.image),
    quantity,
    unitPrice,
    unitPriceDisplay: formatCurrency(unitPrice),
    lineTotal,
    lineTotalDisplay: formatCurrency(lineTotal),
    variantLines: getOrderItemVariantLines(item),
  };
};

const eventCopy = (codeValue, fallbackNote) => {
  const code = normalizeCode(codeValue, "");
  if (/DELIVERED|COMPLETE/.test(code)) return "Package delivered.";
  if (/SHIPPED|IN_TRANSIT|IN_DELIVERY|SHIPPING/.test(code)) return "Package on the way.";
  if (/PACKED/.test(code)) return "Packed and ready.";
  if (/WAITING|PENDING|UNPAID/.test(code)) return "Waiting for payment.";
  if (/READY|PAID|CONFIRMED|PROCESSING|SUCCESS/.test(code)) return "Payment confirmed.";
  return text(fallbackNote, "Shipment updated.");
};

const normalizeTimelineEvent = (eventValue, index, shipmentStatus = null) => {
  const event = asObject(eventValue);
  const eventCode = event.status || event.eventType || shipmentStatus?.code;
  const eventMeta = event.statusMeta || event.eventMeta || null;
  const status = normalizeStatus(
    eventCode,
    eventMeta,
    text(event.eventLabel || event.label || shipmentStatus?.label, "Shipment update")
  );
  const happenedAt = event.happenedAt || event.occurredAt || event.createdAt || null;
  return {
    id: text(event.eventId ?? event.id ?? `${status.code}-${index}`),
    code: status.code,
    label: status.label,
    note: eventCopy(status.code, event.note || event.eventDescription || status.description),
    happenedAt,
    happenedAtDisplay: formatDateTime(happenedAt),
    tone: status.tone,
  };
};

const normalizeShipment = (value, index) => {
  const shipment = asObject(value);
  const presentation = getBuyerShipmentPresentation(
    shipment.shipmentStatus,
    shipment.shipmentStatusMeta
  );
  const status = normalizeStatus(
    shipment.shipmentStatus,
    {
      ...asObject(shipment.shipmentStatusMeta),
      label: presentation.label,
      tone: presentation.tone,
      description: presentation.description,
    },
    presentation.label
  );
  const timeline = asArray(shipment.trackingEvents)
    .map((event, eventIndex) => normalizeTimelineEvent(event, eventIndex, status))
    .filter(Boolean);
  const latest = shipment.latestTrackingEvent
    ? normalizeTimelineEvent(shipment.latestTrackingEvent, timeline.length, status)
    : null;
  const mergedTimeline = latest
    ? [
        latest,
        ...timeline.filter(
          (event) =>
            event.id !== latest.id &&
            `${event.code}-${event.happenedAt}` !== `${latest.code}-${latest.happenedAt}`
        ),
      ]
    : timeline;
  const deliveredEvent = mergedTimeline.find((event) => /DELIVERED|COMPLETE/.test(event.code));
  const deliveredOn =
    deliveredEvent?.happenedAt ||
    (/DELIVERED|COMPLETE/.test(status.code) ? shipment.updatedAt || shipment.estimatedDelivery : null);

  return {
    id: text(shipment.shipmentId ?? shipment.suborderId ?? index),
    storeId: shipment.storeId ?? null,
    storeName: text(shipment.storeName, "Store shipment"),
    suborderNumber: text(shipment.suborderNumber, "Shipment"),
    source: shipment.usedLegacyFallback ? "Legacy fallback" : "Persisted shipment",
    courier: text(shipment.courierService || shipment.courierCode, "Pending assignment"),
    trackingNumber: text(shipment.trackingNumber, "Not assigned"),
    trackingUrl: text(shipment.trackingUrl || shipment.publicTrackingUrl),
    shippingFee: asNumber(shipment.shippingFee, 0),
    status,
    deliveredOn,
    deliveredOnDisplay: formatDateTime(deliveredOn),
    estimatedDelivery: shipment.estimatedDelivery || null,
    timeline: mergedTimeline,
  };
};

const normalizeStoreGroup = (value, index) => {
  const group = asObject(value);
  const payment = getSplitOperationalPayment(group);
  const shipment = getSplitOperationalShipment(group);
  const summary = asObject(getSplitOperationalStatusSummary(group));
  const buyerShipment = getBuyerShipmentPresentation(
    shipment.status,
    shipment.statusMeta
  );
  const groupedPayment = getGroupedPaymentReadModel(group);
  const totalAmount = asNumber(group.totalAmount, 0);
  const storeInfo = {
    storeId: group.storeId ?? group.suborderId ?? index,
    storeName: text(group.storeName, "Store"),
  };
  const items = asArray(group.items).map((item, itemIndex) =>
    normalizeItem(item, itemIndex, storeInfo)
  );

  return {
    id: text(group.suborderId ?? group.storeId ?? index),
    storeId: group.storeId ?? null,
    storeName: storeInfo.storeName,
    storeSlug: text(group.storeSlug),
    storeLogoUrl: text(group.storeLogoUrl),
    storePhone: text(group.storePhone || group.phone),
    storeWhatsapp: text(group.storeWhatsapp || group.whatsapp),
    suborderNumber: text(group.suborderNumber, "Store split"),
    totalAmount,
    totalAmountDisplay: formatCurrency(totalAmount),
    itemCount: items.length,
    merchantName: text(group.payment?.merchantName || group.merchantName, "Not provided"),
    accountLabel: text(group.payment?.accountName || group.accountName, "Not provided"),
    paymentMethod: text(
      group.paymentMethodLabel ||
        group.payment?.paymentMethodLabel ||
        group.paymentMethod ||
        group.payment?.paymentChannel,
      "-"
    ),
    status: normalizeStatus(
      summary.code || group.status || group.paymentStatus,
      summary,
      text(summary.label, "Store status")
    ),
    paymentStatus: normalizeStatus(
      payment.status || groupedPayment.status || group.paymentStatus,
      payment.statusMeta || groupedPayment.statusMeta || group.paymentStatusMeta,
      text(payment.status, "Payment")
    ),
    shipmentStatus: normalizeStatus(
      shipment.status || group.shippingStatus || group.fulfillmentStatus,
      {
        ...asObject(shipment.statusMeta || group.shippingStatusMeta),
        label: buyerShipment.label,
        tone: buyerShipment.tone,
        description: buyerShipment.description,
      },
      buyerShipment.label
    ),
    items,
    paidAt: group.paidAt || group.payment?.paidAt || null,
    createdAt: group.createdAt || null,
    updatedAt: group.updatedAt || null,
    buyerActions: ["SUBMIT_PAYMENT_PROOF", "CANCEL_PAYMENT"]
      .map((code) => getSplitOperationalBuyerAction(group, code))
      .filter(Boolean)
      .map((action) => ({
        code: normalizeCode(action.code),
        label: text(action.label, "Payment action"),
        enabled: Boolean(action.enabled),
        reason: text(action.reason),
      })),
  };
};

const normalizeAvailableActions = (contract) =>
  asArray(asObject(contract).availableActions).map((actionValue) => {
    const action = asObject(actionValue);
    return {
      code: normalizeCode(action.code),
      label: text(action.label, "Order action"),
      enabled: Boolean(action.enabled),
      reason: text(action.reason),
      targetPath: text(action.targetPath),
    };
  });

const completeByStatus = (status, patterns) => {
  const code = normalizeCode(status?.code || status, "");
  return patterns.some((pattern) => pattern.test(code));
};

const firstTimelineDate = (timeline, patterns) => {
  const event = timeline.find((entry) =>
    patterns.some((pattern) => pattern.test(normalizeCode(entry.code, "")))
  );
  return event?.happenedAt || null;
};

const buildProgress = ({ placedAt, paymentStatus, shipmentStatus, timeline }) => {
  const paid =
    completeByStatus(paymentStatus, [/PAID/, /APPROVED/, /DONE/]) ||
    timeline.some((event) => /PAYMENT|PAID|READY/.test(event.code));
  const packed =
    completeByStatus(shipmentStatus, [/PACKED/, /SHIPPED/, /DELIVERED/, /COMPLETE/]) ||
    timeline.some((event) => /PACKED|SHIPPED|DELIVERED|COMPLETE/.test(event.code));
  const shipped =
    completeByStatus(shipmentStatus, [/SHIPPED/, /IN_TRANSIT/, /IN_DELIVERY/, /DELIVERED/, /COMPLETE/]) ||
    timeline.some((event) => /SHIPPED|IN_TRANSIT|IN_DELIVERY|DELIVERED|COMPLETE/.test(event.code));
  const delivered =
    completeByStatus(shipmentStatus, [/DELIVERED/, /COMPLETE/]) ||
    timeline.some((event) => /DELIVERED|COMPLETE/.test(event.code));

  const steps = [
    {
      code: "PLACED",
      label: "Placed",
      complete: Boolean(placedAt),
      timestamp: placedAt,
    },
    {
      code: "PAID",
      label: "Paid",
      complete: paid,
      timestamp: firstTimelineDate(timeline, [/PAYMENT/, /PAID/, /READY/]),
    },
    {
      code: "PACKED",
      label: "Packed",
      complete: packed,
      timestamp: firstTimelineDate(timeline, [/PACKED/]),
    },
    {
      code: "SHIPPED",
      label: "Shipped",
      complete: shipped,
      timestamp: firstTimelineDate(timeline, [/SHIPPED/, /IN_TRANSIT/, /IN_DELIVERY/]),
    },
    {
      code: "DELIVERED",
      label: "Delivered",
      complete: delivered,
      timestamp: firstTimelineDate(timeline, [/DELIVERED/, /COMPLETE/]),
    },
  ];

  return steps.map((step) => ({
    ...step,
    timestampDisplay: formatDateTime(step.timestamp),
  }));
};

const buildTimelineFallback = ({ paymentStatus, shipmentStatus, placedAt }) => {
  const events = [];
  if (completeByStatus(paymentStatus, [/PAID/, /APPROVED/, /DONE/])) {
    events.push({
      id: "payment-confirmed",
      code: "PAYMENT_CONFIRMED",
      label: "Payment Done",
      note: "Payment confirmed.",
      happenedAt: placedAt,
      happenedAtDisplay: formatDateTime(placedAt),
      tone: "success",
    });
  }
  if (completeByStatus(shipmentStatus, [/PACKED/, /SHIPPED/, /DELIVERED/, /COMPLETE/])) {
    events.unshift({
      id: "packed-ready",
      code: "PACKED",
      label: "Packed",
      note: "Packed and ready.",
      happenedAt: null,
      happenedAtDisplay: "-",
      tone: "blue",
    });
  }
  if (completeByStatus(shipmentStatus, [/SHIPPED/, /IN_TRANSIT/, /IN_DELIVERY/, /DELIVERED/, /COMPLETE/])) {
    events.unshift({
      id: "package-on-way",
      code: "SHIPPED",
      label: "Shipped",
      note: "Package on the way.",
      happenedAt: null,
      happenedAtDisplay: "-",
      tone: "blue",
    });
  }
  if (completeByStatus(shipmentStatus, [/DELIVERED/, /COMPLETE/])) {
    events.unshift({
      id: "package-delivered",
      code: "DELIVERED",
      label: "Delivered",
      note: "Package delivered.",
      happenedAt: null,
      happenedAtDisplay: "-",
      tone: "success",
    });
  }
  return events;
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

export const normalizeOrderDetailFor2026 = ({ order, payment, isIndo = false }) => {
  const source = asObject(order);
  const grouped = asObject(payment);
  const id = source.id ?? grouped.orderId ?? null;
  const contract = asObject(grouped.contract || source.contract);
  const contractSummary = getOrderContractSummary(contract);
  const truthStatus = getOrderTruthStatus(
    Object.keys(contract).length ? { ...source, contract } : source
  );
  const paymentMeta = asObject(grouped.paymentStatusMeta || source.paymentStatusMeta);
  const shipmentMeta = asObject(grouped.shippingStatusMeta || source.shippingStatusMeta);
  const paymentEntry = asObject(grouped.paymentEntry || source.paymentEntry);
  const groupsSource = asArray(grouped.groups).length
    ? asArray(grouped.groups)
    : asArray(source.storeSplits);
  const storeBreakdown = groupsSource.map(normalizeStoreGroup);
  const allGroupItems = storeBreakdown.flatMap((store) => store.items);
  const sourceItems = asArray(source.items).map(normalizeItem);
  const items = allGroupItems.length ? allGroupItems : sourceItems;
  const summarySource = asObject(grouped.summary);
  const shipments = normalizeShipmentList(grouped.shipments || source.shipments).map(
    normalizeShipment
  );
  const primaryShipment = shipments[0] || null;
  const rawTimeline = shipments.flatMap((shipment) => shipment.timeline);
  const orderStatus = normalizeStatus(
    contractSummary?.code || source.status || grouped.orderStatus,
    contractSummary || truthStatus,
    text(contractSummary?.label || truthStatus.label, "Unknown")
  );
  const paymentStatus = normalizeStatus(
    grouped.paymentStatus || source.paymentStatus,
    paymentMeta,
    text(paymentMeta.label, "Payment")
  );
  const shipmentStatus = normalizeStatus(
    grouped.shippingStatus || source.shippingStatus,
    shipmentMeta,
    text(shipmentMeta.label, "Shipment")
  );
  const placedAt = source.createdAt || grouped.createdAt || null;
  const timeline = rawTimeline.length
    ? rawTimeline
    : buildTimelineFallback({ paymentStatus, shipmentStatus, placedAt });
  const checkoutMode = normalizeCheckoutMode(
    source.checkoutMode || grouped.checkoutMode,
    storeBreakdown.length
  );
  const continuePaymentAction = getFirstEnabledOrderContractAction(contract, [
    "CONTINUE_PAYMENT",
    "CONTINUE_STRIPE_PAYMENT",
  ]);
  const hasEnabledSplitPaymentAction = storeBreakdown.some((store) =>
    store.buyerActions.some((action) => action.enabled)
  );
  const paymentPath =
    (paymentEntry.visible && text(paymentEntry.targetPath)) ||
    text(continuePaymentAction?.targetPath) ||
    (id && hasEnabledSplitPaymentAction
      ? `/user/my-orders/${encodeURIComponent(String(id))}/payment`
      : "");
  const rawInvoiceNo =
    resolvePublicOrderReference(
      source.invoiceNo,
      source.ref,
      grouped.invoiceNo,
      grouped.ref
    ) || (id ? `#${id}` : "Order");
  const compactOrderNo = formatCompactOrderNumber(rawInvoiceNo, id, placedAt);
  const reference = compactOrderNo;
  const publicTrackingPath =
    rawInvoiceNo && !/^#?\d+$/.test(rawInvoiceNo)
      ? `/order/${encodeURIComponent(rawInvoiceNo)}`
      : "";
  const invoiceUrl = text(
    source.invoiceUrl ||
      source.invoiceDownloadUrl ||
      grouped.invoiceUrl ||
      grouped.invoiceDownloadUrl ||
      paymentEntry.invoiceUrl
  );
  const trackingUrl = text(
    primaryShipment?.trackingUrl ||
      source.trackingUrl ||
      grouped.trackingUrl ||
      source.publicTrackingUrl ||
      grouped.publicTrackingUrl
  );
  const subtotal = asNumber(
    source.subtotal ?? source.subtotalAmount ?? summarySource.subtotalAmount,
    0
  );
  const shipping = asNumber(
    source.shipping ?? source.shippingAmount ?? summarySource.shippingAmount,
    0
  );
  const discount = asNumber(source.discount ?? source.discountAmount, 0);
  const serviceFee = asNumber(source.serviceFeeAmount ?? summarySource.serviceFeeAmount, 0);
  const total = asNumber(
    source.totalAmount ?? source.total ?? source.grandTotal ?? summarySource.grandTotal,
    0
  );
  const availableActions = normalizeAvailableActions(contract);

  const isDelivered =
    orderStatus.code === "COMPLETED" ||
    orderStatus.code === "DELIVERED" ||
    shipmentStatus.code === "DELIVERED" ||
    truthStatus.isDelivered;

  const isShipping =
    orderStatus.code === "SHIPPED" ||
    orderStatus.code === "IN_DELIVERY" ||
    shipmentStatus.code === "SHIPPED" ||
    shipmentStatus.code === "IN_DELIVERY";

  const isPacking =
    orderStatus.code === "PROCESSING" ||
    orderStatus.code === "READY_TO_FULFILL" ||
    orderStatus.code === "TO_PACK" ||
    shipmentStatus.code === "READY_TO_FULFILL";

  const isUnpaid =
    paymentStatus.code === "UNPAID" ||
    paymentStatus.code === "PENDING" ||
    orderStatus.code === "UNPAID" ||
    orderStatus.code === "PENDING";

  const isCancelled =
    orderStatus.code === "CANCELLED" ||
    orderStatus.code === "FAILED" ||
    orderStatus.code === "EXPIRED" ||
    paymentStatus.code === "FAILED" ||
    paymentStatus.code === "EXPIRED";

  const bannerTone = isDelivered
    ? "success"
    : isShipping || isPacking
      ? "blue"
      : isUnpaid
        ? "warning"
        : isCancelled
          ? "danger"
          : "neutral";

  const bannerTitle = isDelivered
    ? isIndo ? "Pesanan Selesai" : "Order Completed"
    : isShipping
      ? isIndo ? "Pesanan Sedang Dikirim" : "Order in Transit"
      : isPacking
        ? isIndo ? "Pesanan Sedang Dikemas" : "Order is Being Packed"
        : isUnpaid
          ? isIndo ? "Menunggu Pembayaran" : "Awaiting Payment"
          : isCancelled
            ? isIndo ? "Pesanan Dibatalkan" : "Order Cancelled"
            : orderStatus.label;

  const bannerSubnote = isDelivered
    ? isIndo ? "Pesanan telah diterima dengan baik di alamat tujuan." : "Order has safely arrived at destination address."
    : isShipping
      ? isIndo ? "Paket sedang dalam perjalanan bersama kurir pengiriman." : "Package is in transit with the delivery courier."
      : isPacking
        ? isIndo ? "Penjual sedang menyiapkan barang pesanan Anda." : "Seller is packing and preparing your order."
        : isUnpaid
          ? isIndo ? "Silakan selesaikan pembayaran sebelum batas waktu berakhir." : "Please complete payment before timeout."
          : isCancelled
            ? isIndo ? "Pesanan ini telah dibatalkan." : "This order has been cancelled."
            : "";

  const primaryCourier =
    text(primaryShipment?.courier) ||
    text(source.courierName) ||
    (isIndo ? "Pengiriman Standar" : "Standard Delivery");
  const primaryTrackingNo =
    text(primaryShipment?.trackingNumber) ||
    text(source.trackingNumber) ||
    reference;
  const latestTimelineEvent = timeline?.[timeline.length - 1] || null;
  const shippingStatusText =
    latestTimelineEvent?.label ||
    (isDelivered
      ? isIndo ? "Pesanan tiba di alamat tujuan." : "Package arrived at destination."
      : isShipping
        ? isIndo ? "Paket sedang dalam perjalanan." : "Package is on the way."
        : isPacking
          ? isIndo ? "Pesanan sedang dikemas oleh penjual." : "Order is being packed by seller."
          : isIndo ? "Menunggu konfirmasi pembayaran." : "Waiting for payment confirmation.");
  const shippingTimestamp =
    latestTimelineEvent?.happenedAtDisplay ||
    (placedAt ? formatDateTime(placedAt, isIndo) : "-");

  const recipientName = text(source.customerName || source.customer?.name, isIndo ? "Pelanggan" : "Customer");
  const recipientPhone = text(source.customerPhone || source.customer?.phone, "-");
  const recipientAddress = text(
    source.customerAddress ||
      source.customer?.address ||
      source.shippingDetails?.address ||
      source.shippingDetails?.destination ||
      "-",
    "-"
  );

  const primaryStoreName =
    items[0]?.storeName ||
    storeBreakdown[0]?.storeName ||
    source.storeName ||
    (isIndo ? "Toko Penjual" : "Seller Store");

  const primaryStoreSlug =
    text(source.storeSlug) ||
    text(source.store?.slug) ||
    text(storeBreakdown[0]?.storeSlug) ||
    text(items[0]?.storeSlug) ||
    text(asArray(source.storeSplits).find((s) => asObject(s).storeSlug)?.storeSlug) ||
    text(asArray(grouped.groups).find((g) => asObject(g).storeSlug)?.storeSlug) ||
    slugifyStoreName(primaryStoreName) ||
    "kreasi-singkong";

  const primaryStoreWhatsapp =
    text(storeBreakdown[0]?.storeWhatsapp) ||
    text(asArray(source.storeSplits).find((s) => asObject(s).storeWhatsapp)?.storeWhatsapp) ||
    text(asArray(grouped.groups).find((g) => asObject(g).storeWhatsapp)?.storeWhatsapp) ||
    text(source.storeWhatsapp) ||
    text(source.store?.whatsapp) ||
    text(storeBreakdown[0]?.storePhone) ||
    text(asArray(source.storeSplits).find((s) => asObject(s).storePhone)?.storePhone) ||
    text(source.storePhone) ||
    text(source.store?.phone) ||
    "0895800536593";

  const paymentMethodDisplay = text(
    source.paymentMethodLabel ||
      grouped.paymentMethodLabel ||
      source.paymentMethod ||
      grouped.paymentMethod,
    isIndo ? "Pembayaran Online" : "Online Payment"
  );

  const customerNotes = text(
    source.notes || source.customerNote || source.customerNotes || source.note || ""
  );

  const realPaidAt =
    storeBreakdown[0]?.paidAt ||
    asArray(source.storeSplits).find((s) => asObject(s).paidAt)?.paidAt ||
    grouped.paidAt ||
    payment?.paidAt ||
    source.paidAt ||
    null;

  const realDeliveredAt =
    primaryShipment?.deliveredOn ||
    storeBreakdown[0]?.updatedAt ||
    asArray(source.storeSplits).find((s) => asObject(s).updatedAt)?.updatedAt ||
    (isDelivered ? source.updatedAt || grouped.updatedAt : null);

  const realShippedAt =
    primaryShipment?.createdAt ||
    primaryShipment?.shippedAt ||
    null;

  const timelineDates = {
    orderPlaced: placedAt ? formatDateTime(placedAt, isIndo) : "-",
    paidAt: realPaidAt
      ? formatDateTime(realPaidAt, isIndo)
      : isUnpaid
        ? null
        : placedAt
          ? formatDateTime(placedAt, isIndo)
          : null,
    shippedAt: realShippedAt ? formatDateTime(realShippedAt, isIndo) : null,
    deliveredAt: realDeliveredAt
      ? formatDateTime(realDeliveredAt, isIndo)
      : isDelivered && (source.updatedAt || placedAt)
        ? formatDateTime(source.updatedAt || placedAt, isIndo)
        : null,
  };

  const shopeeDetail = {
    banner: {
      title: bannerTitle,
      tone: bannerTone,
      subnote: bannerSubnote,
      isDelivered,
      isShipping,
      isPacking,
      isUnpaid,
      isCancelled,
    },
    shippingInfo: {
      courier: primaryCourier,
      trackingNumber: primaryTrackingNo,
      statusText: shippingStatusText,
      timestamp: shippingTimestamp,
      hasTracking: Boolean(trackingUrl || publicTrackingPath || timeline.length),
      trackingPath: trackingUrl || publicTrackingPath || "",
    },
    shippingAddress: {
      name: recipientName,
      phone: recipientPhone,
      address: recipientAddress,
    },
    storeProducts: {
      storeName: primaryStoreName,
      storeSlug: primaryStoreSlug,
      storeWhatsapp: primaryStoreWhatsapp,
      storeBadge: "Star",
      items,
      summary: {
        subtotal,
        subtotalDisplay: formatCurrency(subtotal),
        shipping,
        shippingDisplay: formatCurrency(shipping),
        serviceFee,
        serviceFeeDisplay: formatCurrency(serviceFee),
        discount,
        discountDisplay: formatCurrency(discount),
        total,
        totalDisplay: formatCurrency(total),
      },
    },
    helpActions: {
      returnUrl: `/contact-us?topic=return&ref=${encodeURIComponent(compactOrderNo)}`,
      chatUrl:
        buildStoreWhatsAppUrl({
          whatsappNumber: primaryStoreWhatsapp,
          orderRef: compactOrderNo,
          storeName: primaryStoreName,
        }) || `/contact-us?topic=seller&ref=${encodeURIComponent(compactOrderNo)}`,
      supportUrl: `/contact-us?topic=order&ref=${encodeURIComponent(compactOrderNo)}`,
    },
    orderMeta: {
      orderNo: compactOrderNo,
      rawOrderNo: rawInvoiceNo,
      paymentMethod: paymentMethodDisplay,
      sellerNote: customerNotes,
      invoiceUrl,
      timeline: timelineDates,
    },
  };

  return {
    shopeeDetail,
    account: {
      customerName: text(source.customerName || source.customer?.name),
      customerPhone: text(source.customerPhone || source.customer?.phone),
      customerAddress: text(source.customerAddress || source.customer?.address),
    },
    order: {
      id,
      code: compactOrderNo,
      rawCode: rawInvoiceNo,
      reference: compactOrderNo,
      rawReference: rawInvoiceNo,
      placedAt,
      placedAtDisplay: formatDateTime(placedAt, isIndo),
      reference,
      placedAt,
      placedAtDisplay: formatDateTime(placedAt),
      checkoutMode,
      status: orderStatus,
      statusChips: [
        { code: checkoutMode.code, label: checkoutMode.label, tone: "blue" },
        orderStatus,
        paymentStatus,
      ],
      progress: buildProgress({ placedAt, paymentStatus, shipmentStatus, timeline }),
    },
    payment: {
      method: text(
        source.paymentMethodLabel ||
          grouped.paymentMethodLabel ||
          source.paymentMethod ||
          grouped.paymentMethod,
        "-"
      ),
      status: paymentStatus,
      paidAt: grouped.paidAt || source.paidAt || null,
      summary: text(
        paymentEntry.summaryLabel ||
          contract.paymentActionability?.reason ||
          contractSummary?.description
      ),
    },
    shipment: {
      status: shipmentStatus,
      shipments,
      primary: primaryShipment
        ? {
            courier: primaryShipment.courier,
            trackingNumber: primaryShipment.trackingNumber,
            source: primaryShipment.source,
            deliveredOn: primaryShipment.deliveredOn,
            deliveredOnDisplay: primaryShipment.deliveredOnDisplay,
            trackingUrl: primaryShipment.trackingUrl,
            storeName: primaryShipment.storeName,
          }
        : {
            courier: "Pending assignment",
            trackingNumber: "Not assigned",
            source: shipments.length ? "Shipment source pending" : "No shipment yet",
            deliveredOn: null,
            deliveredOnDisplay: "-",
            trackingUrl: "",
            storeName: "",
          },
      timeline: timeline.map((event, index) => ({
        ...event,
        id: `${event.id}-${index}`,
        happenedAtDisplay: event.happenedAtDisplay || formatDateTime(event.happenedAt),
      })),
    },
    storeBreakdown,
    items,
    summary: {
      subtotal,
      subtotalDisplay: formatCurrency(subtotal),
      shipping,
      shippingDisplay: formatCurrency(shipping),
      discount,
      discountDisplay: formatCurrency(discount),
      serviceFee,
      serviceFeeDisplay: formatCurrency(serviceFee),
      total,
      totalDisplay: formatCurrency(total),
    },
    actionability: {
      invoice: {
        enabled: true,
        url: invoiceUrl,
        fallback: "print",
        reason: invoiceUrl ? "" : "Invoice URL is not available.",
      },
      print: {
        enabled: true,
      },
      track: {
        enabled: Boolean(trackingUrl || publicTrackingPath || timeline.length),
        url: trackingUrl,
        path: trackingUrl ? "" : publicTrackingPath,
        fallback: trackingUrl || publicTrackingPath ? "" : "timeline",
        reason:
          trackingUrl || publicTrackingPath || timeline.length
            ? ""
            : "Tracking is not available yet.",
      },
      timeline: {
        enabled: timeline.length > 0,
        reason: timeline.length ? "" : "No timeline updates yet.",
      },
      contactSupport: {
        enabled: true,
        path: `/contact-us?topic=order&ref=${encodeURIComponent(reference)}`,
      },
      copyOrderCode: {
        enabled: Boolean(reference),
        value: reference,
      },
      payment: paymentPath
        ? {
            enabled: true,
            label: text(paymentEntry.label || continuePaymentAction?.label, "Manage Payment"),
            path: paymentPath,
          }
        : null,
    },
    availableActions,
    meta: {
      generatedAtDisplay: formatDateOnly(new Date().toISOString()),
    },
  };
};
