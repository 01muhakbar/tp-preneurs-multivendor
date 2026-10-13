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

const formatMoney = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number(value, 0));

const formatDateTime = (value) => {
  const normalized = text(value);
  if (!normalized || normalized === "Recently") return "Not set";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return normalized;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDateShort = (value) => {
  const normalized = text(value);
  if (!normalized || normalized === "Recently") return "";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return normalized;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const labelize = (value, fallback = "Not set") =>
  text(value, fallback)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusTone = (value) => {
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

const hasStatus = (current, statuses) => statuses.includes(text(current).toUpperCase());

const isPaymentSettled = (value) => {
  const normalized = text(value).toUpperCase();
  return normalized === "PAID" || normalized.includes("PAID");
};

const findAction = (actions, code) =>
  asArray(actions).find((action) => text(action?.code).toUpperCase() === code) || null;

const isActionEnabled = (action) => Boolean(action && action.enabled !== false);

const normalizeItems = (items) =>
  asArray(items).map((item, index) => {
    const row = asObject(item);
    const quantity = number(row.quantity ?? row.qty, 0);
    const price = number(row.price, 0);
    const subtotal = number(row.subtotal ?? row.totalPrice, price * quantity);
    return {
      id: row.id ?? index,
      name: text(row.productName ?? row.name, `Item ${index + 1}`),
      variantLabel: text(row.variantLabel ?? row.variant, "Standard item"),
      quantity,
      price,
      priceLabel: formatMoney(price),
      subtotal,
      subtotalLabel: formatMoney(subtotal),
      imageUrl: text(row.imageUrl ?? row.image),
    };
  });

const normalizeTimeline = ({ timeline, createdAt, paidAt, paymentStatus }) => {
  const explicitTimeline = asArray(timeline).map((event, index) => {
    const row = asObject(event);
    return {
      id: row.id ?? index,
      label: labelize(row.label ?? row.status, "Shipment update"),
      description: text(row.description),
      createdAtLabel: formatDateTime(row.createdAt ?? row.timestamp),
      complete: true,
    };
  });

  if (explicitTimeline.length) return explicitTimeline;

  return [
    {
      id: "created",
      label: "Order Created",
      description: "Store-scoped suborder was created.",
      createdAtLabel: formatDateTime(createdAt),
      complete: true,
    },
    {
      id: "paid",
      label: isPaymentSettled(paymentStatus) ? "Payment Confirmed" : "Awaiting Payment",
      description: "Payment status is read-only in Seller Orders.",
      createdAtLabel: formatDateTime(paidAt),
      complete: isPaymentSettled(paymentStatus),
    },
    {
      id: "packing",
      label: "Awaiting Packing",
      description: "Fulfillment follows backend available actions.",
      createdAtLabel: "Pending",
      complete: false,
    },
  ];
};

const buildProgressSteps = ({ fulfillmentStatus, paymentStatus, createdAt, paidAt }) => {
  const paid = isPaymentSettled(paymentStatus);
  const packed = hasStatus(fulfillmentStatus, ["PROCESSING", "SHIPPED", "DELIVERED"]);
  const shipped = hasStatus(fulfillmentStatus, ["SHIPPED", "DELIVERED"]);
  const delivered = fulfillmentStatus === "DELIVERED";

  return [
    { code: "NEW", label: "New", complete: true, active: true, dateLabel: formatDateShort(createdAt) },
    { code: "PAID", label: "Paid", complete: paid, active: paid, dateLabel: formatDateShort(paidAt) },
    { code: "PACKED", label: "Packed", complete: packed, active: packed, dateLabel: packed ? "Ready" : "Pending" },
    { code: "SHIPPED", label: "Shipped", complete: shipped, active: shipped, dateLabel: shipped ? "In transit" : "Pending" },
    { code: "DELIVERED", label: "Delivered", complete: delivered, active: delivered, dateLabel: delivered ? "Done" : "Pending" },
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
    if (courierCode) payload.courierCode = courierCode;
    if (courierService) payload.courierService = courierService;
  }

  return payload;
};

export const normalizeSellerSuborderDetailFor2026 = ({ suborder, routes = {} }) => {
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

  const humanize = (val) => {
    if (!val) return "";
    if (val === "WAITING_PAYMENT") return "Waiting Payment";
    if (val === "No tracking number yet." || val === "No tracking yet") return "";
    if (val === "PACKED") return "";
    return val;
  };

  return {
    id: order.suborderId ?? order.id ?? null,
    reference: text(order.orderNumber ?? order.invoiceNo, "Order"),
    suborderNo: text(order.suborderNo, "Store-scoped suborder"),
    scopeLabel: text(order.channel, "SINGLE_STORE"),
    ordersPath: routes.orders || "/seller/stores",
    createdAt,
    createdAtLabel: formatDateTime(createdAt),
    paidAtLabel: formatDateTime(paidAt),
    fulfillmentStatus: {
      code: fulfillmentStatus,
      label: labelize(order.status, "Unfulfilled"),
      tone: statusTone(fulfillmentStatus),
    },
    paymentStatus: {
      code: paymentStatus,
      label: labelize(payment.status || order.paymentStatus, "Waiting Payment"),
      tone: statusTone(paymentStatus),
    },
    readinessStatus: {
      label: isPaymentSettled(paymentStatus) ? "Ready to Fulfill" : "Waiting Payment",
      tone: isPaymentSettled(paymentStatus) ? "blue" : "amber",
    },
    progress: buildProgressSteps({ fulfillmentStatus, paymentStatus, createdAt, paidAt }),
    customer: {
      name: text(customer.name, "Customer"),
      email: text(customer.email),
      phone: text(customer.phone, "Not set"),
      address: text(customer.address, "No shipping address available."),
      note: text(customer.note),
    },
    shipping: {
      status: text(order.shippingStatus, "Ready to fulfill"),
      statusTone: statusTone(order.shippingStatus || fulfillmentStatus),
      method: humanize(text(shipping.method, "REG")),
      courier: humanize(text(shipping.courier || shipping.method, "JNE")),
      trackingNo: text(shipping.trackingNo),
      trackingLabel: humanize(text(shipping.trackingNo, "No tracking yet")),
      estimate: text(shipping.estimate),
    },
    payment: {
      method: text(payment.method, "No payment method available."),
      proof: text(payment.proof, "No payment proof"),
      paidAt,
      readOnlyReason: "Read-only",
    },
    items: normalizeItems(detail.items),
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
    }),
    fulfillmentDraft: {
      trackingNumber: humanize(text(shipping.trackingNo)),
      shippingProvider: humanize(text(shipping.courier || shipping.method)),
      courierService: humanize(text(shipping.method)),
      note: "",
    },
    internalNotes: text(detail.internalNotes),
    actions: {
      canMarkPacked: isActionEnabled(markPackedAction),
      canMarkShipped: isActionEnabled(markShippedAction),
      canMarkDelivered: isActionEnabled(markDeliveredAction),
      markPackedReason: text(markPackedAction?.reason, "Mark packed is not available for this status."),
      markShippedReason: text(markShippedAction?.reason, "Mark shipped is not available for this status."),
      markDeliveredReason: text(markDeliveredAction?.reason, "Mark delivered is not available for this status."),
    },
  };
};
