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

const dateTime = (value, isIndo = false) => {
  const source = text(value);
  if (!source) return isIndo ? "Belum diatur" : "Not set";
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return source;
  return new Intl.DateTimeFormat(isIndo ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const dateOnly = (value, isIndo = false) => {
  const source = text(value);
  if (!source) return isIndo ? "Belum diatur" : "Not set";
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return source;
  return new Intl.DateTimeFormat(isIndo ? "id-ID" : "en-GB", {
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

const normalizeCustomer = (tracking, isIndo = false) => {
  const customer = object(tracking.customer);
  const defaultAddress = isIndo ? "Alamat tidak tersedia" : "Address unavailable";
  const defaultName = isIndo ? "Pembeli" : "Customer";
  if (customer.masked) {
    return {
      name: text(customer.name, defaultName),
      email: text(customer.email),
      phone: text(customer.phone),
      address: text(customer.address, defaultAddress),
    };
  }
  return {
    name: maskName(customer.name || tracking.customerName) || defaultName,
    email: maskEmail(customer.email || tracking.customerEmail),
    phone: maskPhone(customer.phone || tracking.customerPhone),
    address: maskAddress(customer.address || tracking.customerAddress) || defaultAddress,
  };
};

const progressIndex = (code) => {
  const normalized = text(code).toUpperCase();
  if (normalized.includes("DELIVERED") || normalized.includes("COMPLETE")) return 3;
  if (normalized.includes("SHIP") || normalized.includes("DELIVERY")) return 2;
  if (normalized.includes("PROCESS") || normalized.includes("PACK") || normalized.includes("READY")) return 1;
  return 0;
};

const normalizeItems = (items, isIndo = false) =>
  array(items).map((item, index) => {
    const row = object(item);
    const quantity = number(row.quantity ?? row.qty, 0);
    const price = number(row.price, 0);
    const subtotal = number(row.lineTotal ?? row.total, price * quantity);
    return {
      id: row.id ?? index,
      name: text(row.name ?? row.productName ?? row.product?.name, `${isIndo ? "Produk" : "Item"} ${index + 1}`),
      variant: text(row.variantLabel, "-"),
      quantity,
      price,
      priceLabel: formatCurrency(price),
      subtotal,
      subtotalLabel: formatCurrency(subtotal),
      imageUrl: text(row.imageUrl ?? row.image),
    };
  });

const normalizeTimeline = (events, isIndo = false) =>
  array(events).map((event, index) => {
    const row = object(event);
    const meta = object(row.statusMeta);
    return {
      id: `${text(row.status, "event")}-${index}`,
      label: text(meta.label, labelize(row.status, isIndo ? "Status Pengiriman" : "Shipment update")),
      description: text(row.note, meta.description || ""),
      happenedAtLabel: dateTime(row.happenedAt, isIndo),
      tone: normalizeTone(meta.tone, row.status),
    };
  });

const normalizeShipments = (tracking, storeSplits, isIndo = false) => {
  const persisted = normalizeShipmentList(tracking.shipments);
  if (persisted.length) {
    return persisted.map((shipment, index) => ({
      id: shipment.shipmentId ?? `${shipment.suborderNumber || "shipment"}-${index}`,
      storeName: text(shipment.storeName, isIndo ? "Toko" : "Store"),
      suborderNumber: text(shipment.suborderNumber, isIndo ? "Pengiriman Toko" : "Store shipment"),
      status: {
        code: shipment.shipmentStatus,
        label: text(shipment.shipmentStatusMeta?.label, labelize(shipment.shipmentStatus)),
        tone: normalizeTone(shipment.shipmentStatusMeta?.tone, shipment.shipmentStatus),
      },
      sourceLabel: isIndo ? "Pengiriman Toko" : "Store Shipment",
      trackingNumber: text(shipment.trackingNumber, isIndo ? "Belum ada resi" : "Not assigned yet"),
      courier: text(shipment.courierService || shipment.courierCode, isIndo ? "Menunggu penjual" : "Pending seller assignment"),
      itemCount: shipment.shipmentItems.length,
      timeline: normalizeTimeline(shipment.trackingEvents, isIndo),
    }));
  }

  return storeSplits.map((split, index) => {
    const shipment = getSplitOperationalShipment(split);
    const summary = getSplitOperationalStatusSummary(split);
    return {
      id: split.suborderId ?? index,
      storeName: text(split.storeName, isIndo ? "Toko" : "Store"),
      suborderNumber: text(split.suborderNumber, isIndo ? "Pesanan Toko" : "Store split"),
      status: {
        code: shipment.status,
        label: text(summary?.label, shipment.statusMeta?.label || labelize(shipment.status)),
        tone: normalizeTone(summary?.tone || shipment.statusMeta?.tone, shipment.status),
      },
      sourceLabel: isIndo ? "Pesanan Toko" : "Store Order",
      trackingNumber: isIndo ? "Belum ada nomor resi" : "Not assigned yet",
      courier: isIndo ? "Menunggu penugasan kurir" : "Pending seller assignment",
      itemCount: array(split.items).length,
      timeline: split.latestTrackingEvent
        ? normalizeTimeline([split.latestTrackingEvent], isIndo)
        : [],
    };
  });
};

export const getStoreTrackingSafeRef2026 = (params = {}) =>
  resolvePublicOrderReference(params.ref, params.reference, params.orderRef);

export const normalizeStoreOrderTrackingFor2026 = ({ tracking, isIndo = false }) => {
  const order = object(tracking);
  if (!text(order.ref || order.invoiceNo)) return null;

  const contractSummary = object(getOrderContractSummary(order.contract));
  const paymentMeta = object(order.paymentStatusMeta || order.contract?.paymentStatusMeta);
  const shippingMeta = object(order.shippingStatusMeta);
  const storeSplits = array(order.storeSplits);
  const shipments = normalizeShipments(order, storeSplits, isIndo);
  const items = normalizeItems(order.items, isIndo);
  const customer = normalizeCustomer(order, isIndo);
  const statusCode = text(contractSummary.code, order.status || "PENDING").toUpperCase();
  const paymentCode = text(paymentMeta.code, order.paymentStatus || "UNPAID").toUpperCase();
  const shippingCode = text(shippingMeta.code, order.shippingStatus || "WAITING_PAYMENT").toUpperCase();
  const activeStep = progressIndex(statusCode);
  const paymentFromSplit = storeSplits.length
    ? getSplitOperationalPayment(storeSplits[0])
    : null;

  // Clean, customer-friendly status description (no backend fluff)
  const getCustomerFriendlyDescription = () => {
    if (statusCode.includes("DELIVERED") || statusCode.includes("COMPLETE")) {
      return isIndo
        ? "Pesanan telah berhasil diterima. Terima kasih telah berbelanja di TP-Preneurs."
        : "Your order has been delivered successfully. Thank you for shopping with us.";
    }
    if (statusCode.includes("SHIP") || statusCode.includes("TRANSIT")) {
      return isIndo
        ? "Pesanan Anda sedang dalam proses pengiriman menuju alamat tujuan."
        : "Your order is on delivery to your address.";
    }
    if (paymentCode.includes("PAID") || statusCode.includes("PROCESS") || statusCode.includes("READY")) {
      return isIndo
        ? "Pembayaran terkonfirmasi. Pesanan Anda sedang disiapkan oleh penjual."
        : "Payment confirmed. Your order is being prepared by the seller.";
    }
    if (paymentCode.includes("CANCEL") || statusCode.includes("CANCEL")) {
      return isIndo
        ? "Pesanan telah dibatalkan."
        : "This order has been cancelled.";
    }
    return isIndo
      ? "Menunggu konfirmasi pembayaran untuk pesanan Anda."
      : "Waiting for payment confirmation.";
  };

  const getCustomerFriendlyStatusLabel = () => {
    if (statusCode.includes("DELIVERED") || statusCode.includes("COMPLETE")) {
      return isIndo ? "Selesai" : "Delivered";
    }
    if (statusCode.includes("SHIP") || statusCode.includes("TRANSIT")) {
      return isIndo ? "Dalam Pengiriman" : "On delivery";
    }
    if (paymentCode.includes("PAID") || statusCode.includes("PROCESS") || statusCode.includes("READY")) {
      return isIndo ? "Sedang Diproses" : "Processing";
    }
    if (statusCode.includes("CANCEL")) {
      return isIndo ? "Dibatalkan" : "Cancelled";
    }
    return isIndo ? "Menunggu" : "Pending";
  };

  const getCustomerFriendlyPaymentLabel = () => {
    if (paymentCode.includes("PAID") || paymentCode.includes("SETTLED")) {
      return isIndo ? "Lunas" : "Paid";
    }
    if (paymentCode.includes("CANCEL")) {
      return isIndo ? "Batal" : "Cancelled";
    }
    return isIndo ? "Menunggu Pembayaran" : "Pending Payment";
  };

  const getCustomerFriendlyShippingLabel = () => {
    if (shippingCode.includes("DELIVER")) {
      return isIndo ? "Terkirim" : "Delivered";
    }
    if (shippingCode.includes("SHIP") || shippingCode.includes("TRANSIT")) {
      return isIndo ? "Dalam Pengiriman" : "In Transit";
    }
    if (shippingCode.includes("READY") || statusCode.includes("PROCESS")) {
      return isIndo ? "Siap Dikirim" : "Ready to Fulfill";
    }
    return isIndo ? "Menunggu Pembayaran" : "Awaiting Payment";
  };

  return {
    reference: text(order.invoiceNo || order.ref, "Order"),
    createdAt: order.createdAt || null,
    createdAtLabel: dateTime(order.createdAt, isIndo),
    createdDateLabel: dateOnly(order.createdAt, isIndo),
    status: {
      code: statusCode,
      label: getCustomerFriendlyStatusLabel(),
      description: getCustomerFriendlyDescription(),
      tone: normalizeTone(contractSummary.tone, statusCode),
      isFinal: Boolean(contractSummary.isFinal),
    },
    payment: {
      code: paymentCode,
      label: getCustomerFriendlyPaymentLabel(),
      tone: normalizeTone(paymentMeta.tone, paymentCode),
      method: text(order.paymentMethod, isIndo ? "Belum ditentukan" : "Not set"),
      proof: "",
      settledLabel: text(paymentFromSplit?.statusMeta?.label, ""),
    },
    shipment: {
      code: shippingCode,
      label: getCustomerFriendlyShippingLabel(),
      description: isIndo
        ? "Pembaruan nomor resi dan pengiriman akan diperbarui oleh penjual."
        : "Shipment updates and tracking numbers are handled by the seller.",
      tone: normalizeTone(shippingMeta.tone, shippingCode),
      countLabel: isIndo
        ? `${number(order.shipmentCount, shipments.length)} Pengiriman Toko`
        : `${number(order.shipmentCount, shipments.length)} shipment${number(order.shipmentCount, shipments.length) === 1 ? "" : "s"} tracked`,
      trackingNumber: text(order.latestTrackingEvent?.trackingNumber, isIndo ? "Belum ada nomor resi" : "No tracking number yet."),
    },
    progress: [
      {
        code: "RECEIVED",
        label: isIndo ? "Pesanan Dibuat" : "Order received",
        complete: activeStep >= 0,
        active: activeStep === 0,
        dateLabel: dateOnly(order.createdAt, isIndo),
      },
      {
        code: "PROCESSING",
        label: isIndo ? "Sedang Diproses" : "Processing",
        complete: activeStep >= 1,
        active: activeStep === 1,
        dateLabel: activeStep >= 1 ? (isIndo ? "Selesai" : "In progress") : (isIndo ? "Menunggu" : "Pending"),
      },
      {
        code: "SHIPPING",
        label: isIndo ? "Dalam Pengiriman" : "On delivery",
        complete: activeStep >= 2,
        active: activeStep === 2,
        dateLabel: activeStep >= 2 ? (isIndo ? "Selesai" : "In transit") : (isIndo ? "Menunggu" : "Pending"),
      },
      {
        code: "DELIVERED",
        label: isIndo ? "Pesanan Diterima" : "Delivered",
        complete: activeStep >= 3,
        active: activeStep === 3,
        dateLabel: activeStep >= 3 ? (isIndo ? "Selesai" : "Complete") : (isIndo ? "Menunggu" : "Pending"),
      },
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
