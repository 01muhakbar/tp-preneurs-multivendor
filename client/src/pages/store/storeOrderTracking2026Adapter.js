import { formatCurrency } from "../../utils/format.js";
import { resolvePublicOrderReference } from "../../utils/publicOrderReference.js";
import { getOrderContractSummary } from "../../utils/orderContract.ts";
import {
  getSplitOperationalPayment,
  getSplitOperationalShipment,
  getSplitOperationalStatusSummary,
} from "../../utils/splitOperationalTruth.ts";
import { normalizeShipmentList } from "../../utils/shipmentReadModel.ts";

const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const array = (value) => (Array.isArray(value) ? value : []);
const text = (value, fallback = "") => String(value ?? "").trim() || fallback;
const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const labelize = (value, fallback = "Not set") =>
  text(value, fallback)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const dateTime = (value) => {
  const source = text(value);
  if (!source) return "Not set";
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return source;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const dateOnly = (value) => {
  const source = text(value);
  if (!source) return "Not set";
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return source;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const tone = (value) => {
  const normalized = text(value).toUpperCase();
  if (normalized.includes("PAID") || normalized.includes("DELIVER") || normalized.includes("COMPLETE")) return "green";
  if (normalized.includes("SHIP") || normalized.includes("TRANSIT")) return "blue";
  if (normalized.includes("PROCESS") || normalized.includes("PACK") || normalized.includes("PROGRESS")) return "teal";
  if (normalized.includes("PENDING") || normalized.includes("WAIT") || normalized.includes("UNPAID")) return "amber";
  if (normalized.includes("CANCEL") || normalized.includes("FAIL") || normalized.includes("EXPIRE")) return "red";
  return "slate";
};

const normalizeTone = (value, fallbackCode) => {
  const normalized = text(value).toLowerCase();
  if (["green", "emerald", "success"].includes(normalized)) return "green";
  if (["blue", "sky", "indigo", "info"].includes(normalized)) return "blue";
  if (["teal", "cyan"].includes(normalized)) return "teal";
  if (["amber", "yellow", "orange", "warning"].includes(normalized)) return "amber";
  if (["red", "rose", "danger", "error"].includes(normalized)) return "red";
  if (["slate", "gray", "grey", "neutral"].includes(normalized)) return "slate";
  return tone(fallbackCode);
};

const maskWord = (value) => {
  const source = text(value);
  if (!source) return "";
  if (source.length === 1) return "*";
  return `${source[0]}${"*".repeat(Math.min(Math.max(source.length - 1, 2), 5))}`;
};

const maskName = (value) =>
  text(value)
    .split(/\s+/)
    .filter(Boolean)
    .map(maskWord)
    .join(" ");

const maskEmail = (value) => {
  const source = text(value);
  if (!source.includes("@")) return "";
  const [local, domain] = source.split("@");
  return `${maskWord(local)}@${domain}`;
};

const maskPhone = (value) => {
  const digits = text(value).replace(/\D/g, "");
  if (!digits) return "";
  return `${digits.slice(0, 2)}${"*".repeat(Math.max(digits.length - 4, 4))}${digits.slice(-2)}`;
};

const maskAddress = (value) => {
  const source = text(value);
  if (!source) return "";
  const parts = source.split(",").map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return "";
  return [parts[0].split(/\s+/).map(maskWord).join(" "), ...parts.slice(1)].join(", ");
};

const normalizeCustomer = (tracking) => {
  const customer = object(tracking.customer);
  if (customer.masked) {
    return {
      name: text(customer.name, "Customer"),
      email: text(customer.email),
      phone: text(customer.phone),
      address: text(customer.address, "Address unavailable"),
    };
  }
  return {
    name: maskName(customer.name || tracking.customerName) || "Customer",
    email: maskEmail(customer.email || tracking.customerEmail),
    phone: maskPhone(customer.phone || tracking.customerPhone),
    address: maskAddress(customer.address || tracking.customerAddress) || "Address unavailable",
  };
};

const progressIndex = (code) => {
  const normalized = text(code).toUpperCase();
  if (normalized.includes("DELIVERED") || normalized.includes("COMPLETE")) return 3;
  if (normalized.includes("SHIP") || normalized.includes("DELIVERY")) return 2;
  if (normalized.includes("PROCESS") || normalized.includes("PACK") || normalized.includes("READY")) return 1;
  return 0;
};

const normalizeItems = (items) =>
  array(items).map((item, index) => {
    const row = object(item);
    const quantity = number(row.quantity ?? row.qty, 0);
    const price = number(row.price, 0);
    const subtotal = number(row.lineTotal ?? row.total, price * quantity);
    return {
      id: row.id ?? index,
      name: text(row.name ?? row.productName ?? row.product?.name, `Item ${index + 1}`),
      variant: text(row.variantLabel, "-"),
      quantity,
      price,
      priceLabel: formatCurrency(price),
      subtotal,
      subtotalLabel: formatCurrency(subtotal),
      imageUrl: text(row.imageUrl ?? row.image),
    };
  });

const normalizeTimeline = (events) =>
  array(events).map((event, index) => {
    const row = object(event);
    const meta = object(row.statusMeta);
    return {
      id: `${text(row.status, "event")}-${index}`,
      label: text(meta.label, labelize(row.status, "Shipment update")),
      description: text(row.note, meta.description || ""),
      happenedAtLabel: dateTime(row.happenedAt),
      tone: normalizeTone(meta.tone, row.status),
    };
  });

const normalizeShipments = (tracking, storeSplits) => {
  const persisted = normalizeShipmentList(tracking.shipments);
  if (persisted.length) {
    return persisted.map((shipment, index) => ({
      id: shipment.shipmentId ?? `${shipment.suborderNumber || "shipment"}-${index}`,
      storeName: text(shipment.storeName, "Store"),
      suborderNumber: text(shipment.suborderNumber, "Store shipment"),
      status: {
        code: shipment.shipmentStatus,
        label: text(shipment.shipmentStatusMeta?.label, labelize(shipment.shipmentStatus)),
        tone: normalizeTone(shipment.shipmentStatusMeta?.tone, shipment.shipmentStatus),
      },
      sourceLabel: shipment.usedLegacyFallback ? "Compatibility shipment" : "Persisted shipment",
      trackingNumber: text(shipment.trackingNumber, "Not assigned yet"),
      courier: text(shipment.courierService || shipment.courierCode, "Pending seller assignment"),
      itemCount: shipment.shipmentItems.length,
      timeline: normalizeTimeline(shipment.trackingEvents),
    }));
  }

  return storeSplits.map((split, index) => {
    const shipment = getSplitOperationalShipment(split);
    const summary = getSplitOperationalStatusSummary(split);
    return {
      id: split.suborderId ?? index,
      storeName: text(split.storeName, "Store"),
      suborderNumber: text(split.suborderNumber, "Store split"),
      status: {
        code: shipment.status,
        label: text(summary?.label, shipment.statusMeta?.label || labelize(shipment.status)),
        tone: normalizeTone(summary?.tone || shipment.statusMeta?.tone, shipment.status),
      },
      sourceLabel: shipment.hasPersistedShipment ? "Persisted shipment" : "Shipment pending",
      trackingNumber: "Not assigned yet",
      courier: "Pending seller assignment",
      itemCount: array(split.items).length,
      timeline: split.latestTrackingEvent
        ? normalizeTimeline([split.latestTrackingEvent])
        : [],
    };
  });
};

export const getStoreTrackingSafeRef2026 = (params = {}) =>
  resolvePublicOrderReference(params.ref, params.reference, params.orderRef);

export const normalizeStoreOrderTrackingFor2026 = ({ tracking }) => {
  const order = object(tracking);
  if (!text(order.ref || order.invoiceNo)) return null;

  const contractSummary = object(getOrderContractSummary(order.contract));
  const paymentMeta = object(order.paymentStatusMeta || order.contract?.paymentStatusMeta);
  const shippingMeta = object(order.shippingStatusMeta);
  const storeSplits = array(order.storeSplits);
  const shipments = normalizeShipments(order, storeSplits);
  const items = normalizeItems(order.items);
  const customer = normalizeCustomer(order);
  const statusCode = text(contractSummary.code, order.status || "PENDING").toUpperCase();
  const paymentCode = text(paymentMeta.code, order.paymentStatus || "UNPAID").toUpperCase();
  const shippingCode = text(shippingMeta.code, order.shippingStatus || "WAITING_PAYMENT").toUpperCase();
  const activeStep = progressIndex(statusCode);
  const paymentFromSplit = storeSplits.length
    ? getSplitOperationalPayment(storeSplits[0])
    : null;

  return {
    reference: text(order.invoiceNo || order.ref, "Order"),
    createdAt: order.createdAt || null,
    createdAtLabel: dateTime(order.createdAt),
    createdDateLabel: dateOnly(order.createdAt),
    status: {
      code: statusCode,
      label: text(contractSummary.label, labelize(statusCode)),
      description: text(contractSummary.description, "Track the latest backend order status here."),
      tone: normalizeTone(contractSummary.tone, statusCode),
      isFinal: Boolean(contractSummary.isFinal),
    },
    payment: {
      code: paymentCode,
      label: text(paymentMeta.label, labelize(paymentCode)),
      tone: normalizeTone(paymentMeta.tone, paymentCode),
      method: text(order.paymentMethod, "Not set"),
      proof: "Payment information is read-only on public tracking.",
      settledLabel: text(paymentFromSplit?.statusMeta?.label, ""),
    },
    shipment: {
      code: shippingCode,
      label: text(shippingMeta.label, labelize(shippingCode)),
      description: text(shippingMeta.description, "Shipment updates come from the seller."),
      tone: normalizeTone(shippingMeta.tone, shippingCode),
      countLabel: `${number(order.shipmentCount, shipments.length)} shipment${number(order.shipmentCount, shipments.length) === 1 ? "" : "s"} tracked`,
      trackingNumber: text(order.latestTrackingEvent?.trackingNumber, "No tracking number yet."),
    },
    progress: [
      { code: "RECEIVED", label: "Order received", complete: activeStep >= 0, active: activeStep === 0, dateLabel: dateOnly(order.createdAt) },
      { code: "PROCESSING", label: "Processing", complete: activeStep >= 1, active: activeStep === 1, dateLabel: activeStep >= 1 ? "In progress" : "Pending" },
      { code: "SHIPPING", label: "On delivery", complete: activeStep >= 2, active: activeStep === 2, dateLabel: activeStep >= 2 ? "In transit" : "Pending" },
      { code: "DELIVERED", label: "Delivered", complete: activeStep >= 3, active: activeStep === 3, dateLabel: activeStep >= 3 ? "Complete" : "Pending" },
    ],
    customer,
    shipments,
    items,
    totals: {
      subtotal: number(order.subtotal ?? order.subtotalAmount, 0),
      subtotalLabel: formatCurrency(order.subtotal ?? order.subtotalAmount),
      shipping: number(order.shipping ?? order.shippingAmount, 0),
      shippingLabel: formatCurrency(order.shipping ?? order.shippingAmount),
      serviceFee: number(order.serviceFeeAmount, 0),
      serviceFeeLabel: formatCurrency(order.serviceFeeAmount),
      discount: number(order.discount ?? order.discountAmount, 0),
      discountLabel: formatCurrency(order.discount ?? order.discountAmount),
      total: number(order.totalAmount ?? order.total, 0),
      totalLabel: formatCurrency(order.totalAmount ?? order.total),
    },
  };
};
