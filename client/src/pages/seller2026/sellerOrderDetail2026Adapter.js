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

const labelize = (value, fallback = "Not set") =>
  text(value, fallback)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const isPaymentSettled = (value) => {
  const normalized = text(value).toUpperCase();
  return normalized === "PAID" || normalized.includes("PAID");
};

const hasStatus = (current, statuses) => {
  const normalized = text(current).toUpperCase();
  return statuses.includes(normalized);
};

const buildProgressSteps = ({ order, payment }) => {
  const fulfillmentStatus = text(order.status).toUpperCase();
  const paymentStatus = text(order.paymentStatus).toUpperCase();
  const paid = isPaymentSettled(paymentStatus);
  const packed = hasStatus(fulfillmentStatus, ["PROCESSING", "SHIPPED", "DELIVERED"]);
  const shipped = hasStatus(fulfillmentStatus, ["SHIPPED", "DELIVERED"]);
  const delivered = fulfillmentStatus === "DELIVERED";

  return [
    {
      code: "NEW",
      label: "New",
      active: true,
      complete: true,
      dateLabel: formatDateShort(order.createdAt),
    },
    {
      code: "PAID",
      label: "Paid",
      active: paid,
      complete: paid,
      dateLabel: formatDateShort(payment.paidAt),
    },
    {
      code: "PACKED",
      label: "Packed",
      active: packed,
      complete: packed,
      dateLabel: packed ? "Ready" : "",
    },
    {
      code: "SHIPPED",
      label: "Shipped",
      active: shipped,
      complete: shipped,
      dateLabel: shipped ? "In transit" : "",
    },
    {
      code: "DELIVERED",
      label: "Delivered",
      active: delivered,
      complete: delivered,
      dateLabel: delivered ? "Done" : "",
    },
  ];
};

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

const normalizeTimeline = (timeline) =>
  asArray(timeline).map((event, index) => {
    const row = asObject(event);
    return {
      id: row.id ?? index,
      label: labelize(row.label ?? row.status, "Shipment update"),
      description: text(row.description),
      createdAtLabel: formatDateTime(row.createdAt ?? row.timestamp),
    };
  });

export const normalizeSellerOrderDetailFor2026 = ({ suborder }) => {
  const detail = asObject(suborder);
  const order = asObject(detail.suborder);
  const customer = asObject(detail.customer);
  const shipping = asObject(detail.shipping);
  const payment = asObject(detail.payment);
  const totals = asObject(detail.totals);
  const actions = asArray(order.fulfillmentActions);
  const printLabel = asObject(order.printLabel ?? detail.printLabel);
  const markDeliveredAction =
    actions.find(
      (action) =>
        text(action?.code).toUpperCase() === "MARK_DELIVERED" &&
        action?.enabled !== false
    ) || null;
  const disabledDeliveredAction =
    actions.find((action) => text(action?.code).toUpperCase() === "MARK_DELIVERED") ||
    null;
  const fulfillmentStatus = text(order.status, "UNKNOWN").toUpperCase();
  const paymentStatus = text(order.paymentStatus, payment.status || "UNPAID").toUpperCase();

  return {
    id: order.suborderId ?? order.id ?? null,
    reference: text(order.orderNumber ?? order.invoiceNo, "Order"),
    suborderNo: text(order.suborderNo, "Store-scoped suborder"),
    createdAt: order.createdAt || order.orderDate || null,
    createdAtLabel: formatDateTime(order.createdAt || order.orderDate),
    status: {
      code: fulfillmentStatus,
      label: labelize(order.status, "New"),
      tone: statusTone(fulfillmentStatus),
    },
    paymentStatus: {
      code: paymentStatus,
      label: labelize(payment.status || order.paymentStatus, "Waiting Payment"),
      tone: statusTone(paymentStatus),
    },
    progress: buildProgressSteps({ order, payment }),
    customer: {
      name: text(customer.name, "Customer"),
      email: text(customer.email),
      phone: text(customer.phone, "Not set"),
      address: text(customer.address, "No shipping address available."),
      note: text(customer.note),
    },
    items: normalizeItems(detail.items),
    shipping: {
      method: text(shipping.method, "Not set"),
      courier: text(shipping.courier || shipping.method, "Courier not assigned"),
      trackingNo: text(shipping.trackingNo, "No tracking number yet."),
      estimate: text(shipping.estimate),
      status: text(order.shippingStatus, "Needs review"),
      statusTone: statusTone(order.shippingStatus || fulfillmentStatus),
      timeline: normalizeTimeline(detail.timeline),
    },
    payment: {
      method: text(payment.method, "No payment method available."),
      status: text(payment.status, "Waiting Payment"),
      proof: text(payment.proof),
      paidAt: payment.paidAt || null,
    },
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
    canPrintLabel: Boolean(printLabel.canPrint),
    printLabelReason: text(
      printLabel.reason,
      printLabel.canPrint ? "Print shipping label" : "Print label endpoint is not available yet."
    ),
    printLabelEndpoint: text(printLabel.endpoint),
    canMessageBuyer: Boolean(text(customer.phone || customer.email)),
    canMarkDelivered: Boolean(markDeliveredAction),
    markDeliveredReason:
      text(markDeliveredAction?.reason) ||
      text(disabledDeliveredAction?.reason) ||
      (order.canFulfill
        ? "Backend governance has not enabled MARK_DELIVERED for this suborder."
        : "Your current seller role cannot update fulfillment for this suborder."),
  };
};
