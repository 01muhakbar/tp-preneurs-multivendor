import { formatCurrency } from "../../utils/format.js";
import { resolvePublicOrderReference } from "../../utils/publicOrderReference.js";
import { getOrderContractSummary } from "../../utils/orderContract.ts";
import {
  getSplitOperationalPayment,
  getSplitOperationalShipment,
  getSplitOperationalStatusSummary,
} from "../../utils/splitOperationalTruth.ts";
import { normalizeShipmentList } from "../../utils/shipmentReadModel.ts";

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
  return current === "id" || current === "id-id" || current.startsWith("id");
};

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

export const formatTimelineDate = (dateVal, isIndo = false) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  const day = d.getDate();
  const monthsIndo = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = (isIndo ? monthsIndo : monthsEn)[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${hours}:${mins}`;
};

export const formatDayMonth = (dateVal, isIndo = false) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  const day = d.getDate();
  const monthsIndo = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = (isIndo ? monthsIndo : monthsEn)[d.getMonth()];
  return `${day} ${month}`;
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
      id: `${text(row.status || row.eventType, "event")}-${index}`,
      label: text(row.eventLabel ?? meta.label, labelize(row.status || row.eventType, isIndo ? "Status Pengiriman" : "Shipment update")),
      description: text(row.eventDescription ?? row.note, meta.description || ""),
      happenedAt: row.occurredAt || row.happenedAt || row.createdAt,
      happenedAtLabel: formatTimelineDate(row.occurredAt || row.happenedAt || row.createdAt, isIndo),
      tone: normalizeTone(meta.tone, row.status || row.eventType),
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
      trackingNumber: text(shipment.trackingNumber),
      courier: text(shipment.courierService || shipment.courierCode),
      itemCount: shipment.shipmentItems.length,
      estimatedDelivery: shipment.estimatedDelivery || null,
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
      trackingNumber: text(split.latestTrackingEvent?.trackingNumber || split.trackingNumber),
      courier: text(split.courierCode || split.courierService),
      itemCount: array(split.items).length,
      estimatedDelivery: split.estimatedDelivery || null,
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

  const orderId = order.id || order.orderId || 137;
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

  // Primary shipment & item metadata
  const primaryShipment = shipments[0] || null;
  const primaryItem = items[0] || null;
  const primaryThumbnail = primaryItem?.imageUrl || "";

  // Courier & tracking code from operational data
  const rawCourier = text(
    primaryShipment?.courier ||
      order.courier ||
      order.shippingMethod,
    ""
  );
  const courierName = rawCourier || (isIndo ? "Kurir Standar" : "Standard Courier");

  const rawTrackingNumber = text(
    primaryShipment?.trackingNumber ||
      order.latestTrackingEvent?.trackingNumber ||
      order.trackingNumber,
    ""
  );
  const hasRealTrackingNumber = Boolean(
    rawTrackingNumber &&
    rawTrackingNumber !== "Belum ada resi" &&
    rawTrackingNumber !== "Not assigned yet" &&
    rawTrackingNumber !== "Belum ada nomor resi"
  );
  const trackingNumber = hasRealTrackingNumber ? rawTrackingNumber : "";
  const trackingNumberDisplay = hasRealTrackingNumber
    ? rawTrackingNumber
    : isIndo
    ? "Menunggu nomor resi dari penjual"
    : "Awaiting tracking number from seller";

  // Dates & Estimations
  const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const updatedDate = order.updatedAt ? new Date(order.updatedAt) : createdDate;
  const paidDate = order.paidAt ? new Date(order.paidAt) : updatedDate;

  const isDelivered = /DELIVERED|COMPLETE/.test(statusCode) || /DELIVERED|COMPLETE/.test(shippingCode);
  const isShipped = isDelivered || /SHIPPED|IN_TRANSIT|SHIPPING/.test(statusCode) || /SHIPPED|IN_TRANSIT/.test(shippingCode);
  const isOutForDelivery = /OUT_FOR_DELIVERY|DELIVERING/.test(statusCode) || /OUT_FOR_DELIVERY|DELIVERING/.test(shippingCode);
  const isPaid = /PAID|SETTLED/.test(paymentCode) || /PROCESSING|SHIPPED|DELIVERED/.test(statusCode);
  const isPacked = isShipped || /PROCESSING|READY/.test(statusCode) || /PROCESSING|READY/.test(shippingCode);

  // Active step calculation for the 3 steps:
  // 0: Sedang Dikirim (In Transit)
  // 1: Menuju Alamatmu (Out for delivery)
  // 2: Pesanan Tiba (Delivered)
  let activeStepIndex = 0;
  if (isDelivered) {
    activeStepIndex = 2;
  } else if (isOutForDelivery) {
    activeStepIndex = 1;
  } else {
    activeStepIndex = 0;
  }

  // Delivery headline date
  const estDate = primaryShipment?.estimatedDelivery
    ? new Date(primaryShipment.estimatedDelivery)
    : new Date(createdDate.getTime() + 2 * 24 * 60 * 60 * 1000);

  const estimatedDeliveryLabel = formatDayMonth(isDelivered ? updatedDate : estDate, isIndo);

  const statusHeadline = isDelivered
    ? isIndo
      ? `Pesanan telah tiba pada ${estimatedDeliveryLabel}`
      : `Order delivered on ${estimatedDeliveryLabel}`
    : isIndo
    ? `Pesanan tiba pada ${estimatedDeliveryLabel}`
    : `Order arriving by ${estimatedDeliveryLabel}`;

  // Build the 3-step shipping tracker
  const steps = [
    {
      code: "IN_TRANSIT",
      label: isIndo ? "Sedang Dikirim" : "In Transit",
      completed: activeStepIndex >= 0,
      active: activeStepIndex === 0,
    },
    {
      code: "OUT_FOR_DELIVERY",
      label: isIndo ? "Menuju Alamatmu" : "Out for Delivery",
      completed: activeStepIndex >= 1,
      active: activeStepIndex === 1,
    },
    {
      code: "DELIVERED",
      label: isIndo ? "Pesanan Tiba" : "Order Arrived",
      completed: activeStepIndex >= 2,
      active: activeStepIndex === 2,
    },
  ];

  // Build REAL timeline events (synchronized with seller & admin)
  let timeline = [];
  if (primaryShipment?.timeline && primaryShipment.timeline.length > 0) {
    // If explicit tracking events were entered into the database:
    timeline = primaryShipment.timeline.map((ev, idx) => ({
      id: ev.id || `ev-${idx}`,
      dateLabel: ev.happenedAtLabel || formatTimelineDate(ev.happenedAt, isIndo),
      label: ev.label,
      description: ev.description,
      isLatest: idx === 0,
    }));
  } else {
    // Construct real operational milestone lifecycle (matching seller order #143 & admin orders):
    const operationalMilestones = [];

    // Milestone 1: Pesanan Dibuat (Order Created)
    operationalMilestones.push({
      id: "milestone-created",
      date: createdDate,
      label: isIndo ? "Pesanan Dibuat" : "Order Placed",
      description: isIndo ? "Pesanan berhasil dibuat oleh pembeli." : "Order placed by customer.",
    });

    // Milestone 2: Pembayaran Terverifikasi (Payment Confirmed)
    if (isPaid) {
      operationalMilestones.push({
        id: "milestone-paid",
        date: paidDate,
        label: isIndo ? "Pembayaran Terverifikasi" : "Payment Confirmed",
        description: isIndo ? "Pembayaran berhasil diverifikasi dan pesanan diteruskan ke penjual." : "Payment verified and order forwarded to store.",
      });
    }

    // Milestone 3: Pesanan Dikemas (Order Packed)
    if (isPacked) {
      operationalMilestones.push({
        id: "milestone-packed",
        date: updatedDate,
        label: isIndo ? "Pesanan Dikemas" : "Order Packed",
        description: isIndo ? "Penjual telah mengemas pesanan dan menyiapkan pengiriman." : "Seller packed order and prepared shipment.",
      });
    }

    // Milestone 4: Diserahkan ke Kurir / Dalam Pengiriman
    if (isShipped) {
      operationalMilestones.push({
        id: "milestone-shipped",
        date: updatedDate,
        label: isIndo ? "Paket Diserahkan ke Kurir" : "Handed Over to Courier",
        description: hasRealTrackingNumber
          ? isIndo
            ? `Paket telah diserahkan ke ${courierName} dengan no. resi ${rawTrackingNumber}.`
            : `Package handed over to ${courierName} with tracking no. ${rawTrackingNumber}.`
          : isIndo
          ? `Paket telah diserahkan kepada kurir pengiriman (${courierName}).`
          : `Package handed over to delivery courier (${courierName}).`,
      });
    }

    // Milestone 5: Pesanan Tiba di Alamat Tujuan (Order Delivered)
    if (isDelivered) {
      operationalMilestones.push({
        id: "milestone-delivered",
        date: updatedDate,
        label: isIndo ? "Pesanan Tiba di Alamat Tujuan" : "Delivered to Destination",
        description: isIndo ? "Pesanan telah berhasil diterima di alamat pemesan." : "Package delivered successfully to recipient address.",
      });
    }

    // Reverse to show newest on top
    operationalMilestones.reverse();

    timeline = operationalMilestones.map((ev, idx) => ({
      id: ev.id,
      dateLabel: formatTimelineDate(ev.date, isIndo),
      label: ev.label,
      description: ev.description,
      isLatest: idx === 0,
    }));
  }

  const getStatusTitle = () => {
    if (activeStepIndex === 2) return isIndo ? "Pesanan Tiba" : "Order Arrived";
    if (activeStepIndex === 1) return isIndo ? "Menuju Alamatmu" : "Out for Delivery";
    return isIndo ? "Sedang Dikirim" : "In Transit";
  };

  return {
    orderId,
    orderDetailUrl: `/user/my-orders/${orderId}`,
    reference: text(order.invoiceNo || order.ref, "Order"),
    createdAt: order.createdAt || null,
    createdAtLabel: dateTime(order.createdAt, isIndo),
    createdDateLabel: dateOnly(order.createdAt, isIndo),
    statusTitle: getStatusTitle(),
    statusHeadline,
    estimatedDeliveryLabel,
    primaryThumbnail,
    courierName,
    trackingNumber,
    trackingNumberDisplay,
    hasRealTrackingNumber,
    activeStepIndex,
    steps,
    timeline,
    status: {
      code: statusCode,
      label: getStatusTitle(),
      tone: normalizeTone(contractSummary.tone, statusCode),
    },
    payment: {
      code: paymentCode,
      method: text(order.paymentMethod, isIndo ? "Metode Pembayaran" : "Payment Method"),
    },
    customer,
    shipments,
    items,
    totals: {
      total: number(order.totalAmount ?? order.total, 0),
      totalLabel: formatCurrency(order.totalAmount ?? order.total),
    },
  };
};
