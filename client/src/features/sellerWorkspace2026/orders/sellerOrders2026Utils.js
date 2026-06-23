export const normalizeOrderRow = (row) => {
  if (!row) return null;

  return {
    id: row.suborderId || row.id || null,
    reference: row.orderNumber || row.invoiceNo || "N/A",
    createdAt: row.createdAt || row.orderDate || null,
    createdLabel: row.createdLabel || "",
    updatedLabel: row.updatedLabel || row.createdLabel || "",

    customer: {
      initials: row.customerInitials || "?",
      name: row.customerName || "Customer",
      email: row.customerEmail || row.customerPhone || "Buyer",
    },

    itemsCount: Number(row.itemsCount || (row.items ? row.items.length : 0)),
    items: Array.isArray(row.items) ? row.items : [],

    payment: {
      status: row.paymentStatus || "UNKNOWN",
      label: row.paymentLabel || "Unknown",
      tone: row.paymentTone || "slate",
      method: row.paymentMethod || "-",
    },

    fulfillment: {
      status: row.fulfillmentStatus || "UNKNOWN",
      label: row.fulfillmentLabel || "Unknown",
      tone: row.fulfillmentTone || "slate",
      progress: Number(row.fulfillmentProgress || 0),
    },

    status: row.status || "UNKNOWN",
    totalAmount: Number(row.totalAmount || row.total || 0),

    canFulfill: Boolean(row.canFulfill),
    allowedActions: Array.isArray(row.allowedActions) ? row.allowedActions : [],
  };
};

export const statusTone = (status) => {
  const norm = String(status || "").toUpperCase();
  if (norm === "DELIVERED") return "violet";
  if (norm === "SHIPPED") return "blue";
  if (norm === "PROCESSING") return "green";
  if (norm === "CANCELLED" || norm === "FAILED" || norm === "EXPIRED") return "red";
  if (norm === "UNPAID" || norm === "PENDING_CONFIRMATION") return "amber";
  return "slate";
};

export const statusLabel = (status) => {
  const norm = String(status || "").toUpperCase();
  if (norm === "UNPAID") return "Awaiting Payment";
  if (norm === "PENDING_CONFIRMATION") return "Awaiting Review";
  if (norm === "PROCESSING") return "Ready to Pack";
  if (norm === "SHIPPED") return "In Transit";
  if (norm === "DELIVERED") return "Delivered";
  if (norm === "CANCELLED") return "Cancelled";
  if (norm === "FAILED") return "Failed";
  if (norm === "EXPIRED") return "Expired";
  return "New";
};

export const formatMoney = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
