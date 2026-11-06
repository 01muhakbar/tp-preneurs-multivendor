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

export const formatMoney = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number(value, 0));

export const formatDateTime = (value, isIndo = false) => {
  const normalized = text(value);
  if (!normalized || normalized === "Recently") return isIndo ? "Belum diatur" : "Not set";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return normalized;
  return new Intl.DateTimeFormat(isIndo ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatDateShort = (value, isIndo = false) => {
  const normalized = text(value);
  if (!normalized || normalized === "Recently") return "";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return normalized;
  return new Intl.DateTimeFormat(isIndo ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const paymentStatusLabel = (status, isIndo = false) => {
  const norm = String(status || "").toUpperCase();
  if (norm === "PAID") return isIndo ? "Lunas" : "Paid";
  if (norm === "UNPAID") return isIndo ? "Belum Bayar" : "Unpaid";
  if (norm === "EXPIRED") return isIndo ? "Kedaluwarsa" : "Expired";
  if (norm === "FAILED") return isIndo ? "Gagal" : "Failed";
  if (norm === "CANCELLED") return isIndo ? "Dibatalkan" : "Cancelled";
  if (norm === "PENDING_CONFIRMATION") return isIndo ? "Menunggu Konfirmasi" : "Awaiting Review";
  return isIndo ? "Belum Bayar" : "Unpaid";
};

export const fulfillmentStatusLabel = (status, isIndo = false) => {
  const norm = String(status || "").toUpperCase();
  if (norm === "DELIVERED") return isIndo ? "Terkirim" : "Delivered";
  if (norm === "SHIPPED") return isIndo ? "Dalam Pengiriman" : "In Transit";
  if (norm === "PROCESSING") return isIndo ? "Siap Dikemas" : "Ready to Pack";
  if (norm === "CANCELLED") return isIndo ? "Dibatalkan" : "Cancelled";
  return isIndo ? "Belum Diproses" : "Unfulfilled";
};

export const statusTone = (value) => {
  const normalized = text(value).toUpperCase();
  if (normalized.includes("PAID") || normalized.includes("DELIVER")) return "green";
  if (normalized.includes("SHIP") || normalized.includes("TRANSIT")) return "blue";
  if (normalized.includes("PROCESS") || normalized.includes("PACK")) return "violet";
  if (normalized.includes("PENDING") || normalized.includes("UNPAID") || normalized.includes("WAIT")) {
    return "amber";
  }
  if (normalized.includes("CANCEL") || normalized.includes("FAIL") || normalized.includes("EXPIRE")) {
    return "red";
  }
  return "slate";
};

export const isPaymentSettled = (value) => {
  const normalized = text(value).toUpperCase();
  return normalized === "PAID" || normalized.includes("PAID");
};

const hasStatus = (current, statuses) => statuses.includes(text(current).toUpperCase());

const isStatusEnum = (val) =>
  [
    "DELIVERED",
    "SHIPPED",
    "PROCESSING",
    "PACKED",
    "UNFULFILLED",
    "CANCELLED",
    "PENDING",
    "COMPLETED",
    "WAITING_PAYMENT",
    "UNKNOWN",
  ].includes(String(val || "").trim().toUpperCase());

const sanitizeCourier = (val, isIndo = false) => {
  const trimmed = text(val);
  if (!trimmed || isStatusEnum(trimmed)) {
    return isIndo ? "Belum ditentukan" : "Pending assignment";
  }
  return trimmed;
};

const sanitizeMethod = (val) => {
  const trimmed = text(val);
  if (!trimmed || isStatusEnum(trimmed)) {
    return "-";
  }
  return trimmed;
};

const findAction = (actions, code) =>
  asArray(actions).find((action) => text(action?.code).toUpperCase() === code) || null;

const isActionEnabled = (action) => Boolean(action && action.enabled !== false);

const normalizeItems = (items, isIndo = false) =>
  asArray(items).map((item, index) => {
    const row = asObject(item);
    const quantity = number(row.quantity ?? row.qty, 0);
    const price = number(row.price, 0);
    const subtotal = number(row.subtotal ?? row.totalPrice, price * quantity);
    return {
      id: row.id ?? index,
      name: text(row.productName ?? row.name, `${isIndo ? "Item" : "Product"} ${index + 1}`),
      variantLabel: text(row.variantLabel ?? row.variant, isIndo ? "Standar" : "Standard item"),
      quantity,
      price,
      priceLabel: formatMoney(price),
      subtotal,
      subtotalLabel: formatMoney(subtotal),
      imageUrl: text(row.imageUrl ?? row.image),
    };
  });

const normalizeTimeline = ({ timeline, createdAt, paidAt, paymentStatus, fulfillmentStatus, isIndo = false }) => {
  const explicitTimeline = asArray(timeline).map((event, index) => {
    const row = asObject(event);
    return {
      id: row.id ?? index,
      label: text(row.label ?? row.status, isIndo ? "Pembaruan Pengiriman" : "Shipment update"),
      description: text(row.description),
      createdAtLabel: formatDateTime(row.createdAt ?? row.timestamp, isIndo),
      complete: true,
    };
  });

  if (explicitTimeline.length) return explicitTimeline;

  const paid = isPaymentSettled(paymentStatus);
  const isDelivered = fulfillmentStatus === "DELIVERED";
  const isShipped = isDelivered || fulfillmentStatus === "SHIPPED";
  const isPacked = isShipped || fulfillmentStatus === "PROCESSING";

  const list = [
    {
      id: "created",
      label: isIndo ? "Pesanan Dibuat" : "Order Created",
      description: isIndo ? "Pesanan dibuat oleh pembeli." : "Order placed by customer.",
      createdAtLabel: formatDateTime(createdAt, isIndo),
      complete: true,
    },
    {
      id: "paid",
      label: paid
        ? isIndo
          ? "Pembayaran Terverifikasi"
          : "Payment Confirmed"
        : isIndo
        ? "Menunggu Pembayaran"
        : "Awaiting Payment",
      description: paid
        ? isIndo
          ? "Pembayaran pesanan telah berhasil diverifikasi."
          : "Payment verified successfully."
        : isIndo
        ? "Menunggu penyelesaian pembayaran oleh pembeli."
        : "Awaiting customer payment.",
      createdAtLabel: paid ? formatDateTime(paidAt, isIndo) : (isIndo ? "Menunggu" : "Pending"),
      complete: paid,
    },
    {
      id: "packing",
      label: isPacked
        ? isIndo
          ? "Pesanan Dikemas"
          : "Order Packed"
        : isIndo
        ? "Siap Dikemas"
        : "Ready to Pack",
      description: isPacked
        ? isIndo
          ? "Pesanan telah dikemas oleh toko dan siap dikirim."
          : "Order packed by store and ready for shipment."
        : isIndo
        ? "Pesanan menunggu pengemasan oleh penjual."
        : "Awaiting store packaging.",
      createdAtLabel: isPacked ? (isIndo ? "Selesai" : "Ready") : (isIndo ? "Menunggu" : "Pending"),
      complete: isPacked,
    },
  ];

  if (isShipped) {
    list.push({
      id: "shipped",
      label: isIndo ? "Dalam Pengiriman" : "In Transit",
      description: isIndo
        ? "Paket telah diserahkan kepada kurir pengiriman."
        : "Package picked up by courier and in transit.",
      createdAtLabel: isIndo ? "Dalam perjalanan" : "In transit",
      complete: true,
    });
  }

  if (isDelivered) {
    list.push({
      id: "delivered",
      label: isIndo ? "Pesanan Selesai" : "Delivered",
      description: isIndo
        ? "Pesanan telah berhasil diterima oleh pembeli."
        : "Package delivered successfully to buyer.",
      createdAtLabel: isIndo ? "Selesai" : "Delivered",
      complete: true,
    });
  }

  return list;
};

const buildProgressSteps = ({ fulfillmentStatus, paymentStatus, createdAt, paidAt, isIndo = false }) => {
  const paid = isPaymentSettled(paymentStatus);
  const packed = hasStatus(fulfillmentStatus, ["PROCESSING", "SHIPPED", "DELIVERED"]);
  const shipped = hasStatus(fulfillmentStatus, ["SHIPPED", "DELIVERED"]);
  const delivered = fulfillmentStatus === "DELIVERED";

  return [
    {
      code: "NEW",
      label: isIndo ? "Baru" : "New",
      complete: true,
      active: true,
      dateLabel: formatDateShort(createdAt, isIndo),
    },
    {
      code: "PAID",
      label: isIndo ? "Lunas" : "Paid",
      complete: paid,
      active: paid,
      dateLabel: paid ? formatDateShort(paidAt, isIndo) : (isIndo ? "Menunggu" : "Pending"),
    },
    {
      code: "PACKED",
      label: isIndo ? "Dikemas" : "Packed",
      complete: packed,
      active: packed,
      dateLabel: packed ? (isIndo ? "Siap" : "Ready") : (isIndo ? "Menunggu" : "Pending"),
    },
    {
      code: "SHIPPED",
      label: isIndo ? "Dikirim" : "Shipped",
      complete: shipped,
      active: shipped,
      dateLabel: shipped ? (isIndo ? "Perjalanan" : "In transit") : (isIndo ? "Menunggu" : "Pending"),
    },
    {
      code: "DELIVERED",
      label: isIndo ? "Selesai" : "Delivered",
      complete: delivered,
      active: delivered,
      dateLabel: delivered ? (isIndo ? "Selesai" : "Done") : (isIndo ? "Menunggu" : "Pending"),
    },
  ];
};

export const buildSellerSuborderFulfillmentPayload2026 = (action, draft = {}) => {
  const actionCode = text(action).toUpperCase();
  const payload = { action: actionCode };

  if (actionCode === "MARK_SHIPPED") {
    const trackingNumber = text(draft.trackingNumber);
    const courierCode = text(draft.shippingProvider ?? draft.courierCode);
    const courierService = text(draft.courierService);
    if (trackingNumber) payload.trackingNumber = trackingNumber;
    if (courierCode && !isStatusEnum(courierCode)) payload.courierCode = courierCode;
    if (courierService && !isStatusEnum(courierService)) payload.courierService = courierService;
  }

  return payload;
};

export const normalizeSellerSuborderDetailFor2026 = ({ suborder, routes = {}, isIndo = false }) => {
  const detail = asObject(suborder);
  const order = asObject(detail.suborder);
  const customer = asObject(detail.customer);
  const shipping = asObject(detail.shipping);
  const payment = asObject(detail.payment);
  const totals = asObject(detail.totals);
  const actions = asArray(order.fulfillmentActions);
  const markPackedAction = findAction(actions, "MARK_PROCESSING");
  const markShippedAction = findAction(actions, "MARK_SHIPPED");
  const markDeliveredAction = findAction(actions, "MARK_DELIVERED");
  const fulfillmentStatus = text(order.status, "UNFULFILLED").toUpperCase();
  const paymentStatus = text(order.paymentStatus, payment.status || "UNPAID").toUpperCase();
  const createdAt = order.createdAt || order.orderDate || null;
  const paidAt = payment.paidAt || null;

  // Resolve readiness dynamically
  let readinessLabel = isIndo ? "Menunggu Pembayaran" : "Awaiting Payment";
  let readinessTone = "amber";

  if (fulfillmentStatus === "DELIVERED") {
    readinessLabel = isIndo ? "Pesanan Selesai" : "Delivered";
    readinessTone = "green";
  } else if (fulfillmentStatus === "SHIPPED") {
    readinessLabel = isIndo ? "Dalam Pengiriman" : "In Transit";
    readinessTone = "blue";
  } else if (fulfillmentStatus === "PROCESSING") {
    readinessLabel = isIndo ? "Siap Dikemas" : "Ready to Pack";
    readinessTone = "violet";
  } else if (isPaymentSettled(paymentStatus)) {
    readinessLabel = isIndo ? "Siap Diproses" : "Ready to Fulfill";
    readinessTone = "blue";
  } else if (fulfillmentStatus === "CANCELLED" || paymentStatus === "CANCELLED") {
    readinessLabel = isIndo ? "Dibatalkan" : "Cancelled";
    readinessTone = "red";
  }

  const rawCourier = shipping.courier || "";
  const rawMethod = shipping.method || "";
  const rawTracking = text(shipping.trackingNo);
  const safeTracking =
    rawTracking && !rawTracking.toLowerCase().includes("no tracking") ? rawTracking : "";

  return {
    id: order.suborderId ?? order.id ?? null,
    reference: text(order.orderNumber ?? order.invoiceNo, "Order"),
    suborderNo: text(order.suborderNo, isIndo ? "Sub-pesanan Toko" : "Store suborder"),
    scopeLabel: text(order.channel, isIndo ? "Pesanan Toko Tunggal" : "Single Store"),
    ordersPath: routes.orders || "/seller/stores",
    createdAt,
    createdAtLabel: formatDateTime(createdAt, isIndo),
    paidAtLabel: formatDateTime(paidAt, isIndo),

    fulfillmentStatus: {
      code: fulfillmentStatus,
      label: fulfillmentStatusLabel(fulfillmentStatus, isIndo),
      tone: statusTone(fulfillmentStatus),
    },

    paymentStatus: {
      code: paymentStatus,
      label: paymentStatusLabel(paymentStatus, isIndo),
      tone: statusTone(paymentStatus),
    },

    readinessStatus: {
      label: readinessLabel,
      tone: readinessTone,
    },

    progress: buildProgressSteps({ fulfillmentStatus, paymentStatus, createdAt, paidAt, isIndo }),

    customer: {
      name: text(customer.name, isIndo ? "Pelanggan" : "Customer"),
      email: text(customer.email),
      phone: text(customer.phone, "-"),
      address: text(customer.address, isIndo ? "Tidak ada alamat pengiriman." : "No shipping address available."),
      note: text(customer.note),
    },

    shipping: {
      status: fulfillmentStatusLabel(fulfillmentStatus, isIndo),
      statusTone: statusTone(fulfillmentStatus),
      method: sanitizeMethod(rawMethod),
      courier: sanitizeCourier(rawCourier, isIndo),
      trackingNo: safeTracking,
      trackingLabel: safeTracking || (isIndo ? "Belum ada resi" : "No tracking yet"),
      estimate: text(shipping.estimate),
    },

    payment: {
      method: text(payment.method, isIndo ? "Metode tidak tercatat" : "No payment method recorded"),
      proof: text(payment.proof, isIndo ? "Bukti tidak tersedia" : "No payment proof available"),
      paidAt,
    },

    items: normalizeItems(detail.items, isIndo),

    totals: {
      subtotal: number(totals.subtotal, 0),
      subtotalLabel: formatMoney(totals.subtotal),
      shippingFee: number(totals.shippingFee, 0),
      shippingFeeLabel: formatMoney(totals.shippingFee),
      serviceFee: number(totals.serviceFee, 0),
      serviceFeeLabel: formatMoney(totals.serviceFee),
      discount: number(totals.discount, 0),
      discountLabel: formatMoney(totals.discount),
      total: number(totals.total, 0),
      totalLabel: formatMoney(totals.total),
    },

    timeline: normalizeTimeline({
      timeline: detail.timeline,
      createdAt,
      paidAt,
      paymentStatus,
      fulfillmentStatus,
      isIndo,
    }),

    fulfillmentDraft: {
      trackingNumber: safeTracking,
      shippingProvider: isStatusEnum(rawCourier) ? "" : text(rawCourier),
      courierService: isStatusEnum(rawMethod) ? "" : text(rawMethod),
      note: "",
    },

    internalNotes: text(detail.internalNotes),

    actions: {
      canMarkPacked: isActionEnabled(markPackedAction),
      canMarkShipped: isActionEnabled(markShippedAction),
      canMarkDelivered: isActionEnabled(markDeliveredAction),
      markPackedReason: text(
        markPackedAction?.reason,
        isIndo ? "Aksi kemas belum tersedia untuk status ini." : "Mark packed is not available for this status."
      ),
      markShippedReason: text(
        markShippedAction?.reason,
        isIndo ? "Aksi kirim belum tersedia untuk status ini." : "Mark shipped is not available for this status."
      ),
      markDeliveredReason: text(
        markDeliveredAction?.reason,
        isIndo ? "Aksi terkirim belum tersedia untuk status ini." : "Mark delivered is not available for this status."
      ),
    },
  };
};
