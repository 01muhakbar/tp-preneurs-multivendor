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

export const statusTone = (status) => {
  const norm = String(status || "").toUpperCase();
  if (norm === "DELIVERED") return "violet";
  if (norm === "SHIPPED") return "blue";
  if (norm === "PROCESSING") return "green";
  if (norm === "CANCELLED" || norm === "FAILED" || norm === "EXPIRED") return "red";
  if (norm === "UNPAID" || norm === "PENDING_CONFIRMATION") return "amber";
  return "slate";
};

export const statusLabel = (status, isIndo = false) => {
  const norm = String(status || "").toUpperCase();
  if (norm === "UNPAID") return isIndo ? "Menunggu Pembayaran" : "Awaiting Payment";
  if (norm === "PENDING_CONFIRMATION") return isIndo ? "Menunggu Konfirmasi" : "Awaiting Review";
  if (norm === "PROCESSING") return isIndo ? "Siap Dikemas" : "Ready to Pack";
  if (norm === "SHIPPED") return isIndo ? "Dalam Pengiriman" : "In Transit";
  if (norm === "DELIVERED") return isIndo ? "Terkirim" : "Delivered";
  if (norm === "CANCELLED") return isIndo ? "Dibatalkan" : "Cancelled";
  if (norm === "FAILED") return isIndo ? "Gagal" : "Failed";
  if (norm === "EXPIRED") return isIndo ? "Kedaluwarsa" : "Expired";
  return isIndo ? "Baru" : "New";
};

export const formatMoney = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const normalizeOrderRow = (row, isIndo = false) => {
  if (!row) return null;

  const rawPaymentStatus = String(row.paymentStatus || "").toUpperCase();
  let rawFulfillmentStatus = String(row.fulfillmentStatus || "").toUpperCase();

  // If paid and not yet shipped/delivered/cancelled, fulfillment is READY TO PACK (PROCESSING)
  if (
    rawPaymentStatus === "PAID" &&
    !["SHIPPED", "DELIVERED", "CANCELLED"].includes(rawFulfillmentStatus)
  ) {
    rawFulfillmentStatus = "PROCESSING";
  } else if (
    (rawPaymentStatus === "UNPAID" || rawPaymentStatus === "PENDING_CONFIRMATION") &&
    rawFulfillmentStatus === "UNFULFILLED"
  ) {
    rawFulfillmentStatus = "UNPAID";
  }

  const rawOrderStatus = String(row.status || rawFulfillmentStatus || "").toUpperCase();
  const rawInvoice = row.rawOrderNumber || row.invoiceNo || row.orderNumber || "Order";
  const orderId = row.orderId || null;
  const compactReference = row.compactOrderNumber || row.orderNumber || rawInvoice;

  // Real courier name cleanup: never show internal enums like WAITING_PAYMENT
  const cleanCourier = (() => {
    const rawCourier = String(row.shippingMethod || row.deliveryMethod || "").trim();
    if (
      !rawCourier ||
      /^(WAITING_PAYMENT|READY_TO_FULFILL|UNFULFILLED|PROCESSING|SHIPPED|DELIVERED|CANCELLED|UNKNOWN|PENDING|PAID|EXPIRED|UNPAID|FAILED)$/i.test(
        rawCourier
      )
    ) {
      return "";
    }
    return rawCourier;
  })();

  return {
    id: row.suborderId || row.id || null,
    orderId,
    reference: compactReference,
    invoiceNo: rawInvoice,
    suborderNo: row.suborderNo || "",
    createdAt: row.createdAt || row.orderDate || null,
    createdLabel: row.createdLabel || "",
    updatedLabel: row.updatedLabel || row.createdLabel || "",

    customer: {
      initials: row.customerInitials || "?",
      name: row.customerName || (isIndo ? "Pelanggan" : "Customer"),
      email: row.customerEmail || row.customerPhone || (isIndo ? "Pembeli" : "Buyer"),
    },

    itemsCount: Number(row.itemsCount || (row.items ? row.items.length : 0)),
    items: Array.isArray(row.items) ? row.items : [],

    payment: {
      status: rawPaymentStatus || "UNKNOWN",
      label: paymentStatusLabel(rawPaymentStatus, isIndo),
      tone:
        row.paymentTone ||
        (rawPaymentStatus === "PAID"
          ? "green"
          : rawPaymentStatus === "EXPIRED" || rawPaymentStatus === "FAILED"
          ? "red"
          : "amber"),
      method: row.paymentMethod || "-",
    },

    withdrawalEligibility: {
      code: row.withdrawalEligibility?.code || "NOT_PAID",
      label: row.withdrawalEligibility?.label || (isIndo ? "Belum cair" : "Not paid"),
      description: row.withdrawalEligibility?.description || "",
      tone: row.withdrawalEligibility?.tone || "slate",
      isEligible: Boolean(row.withdrawalEligibility?.isEligible),
      netAmount: Number(row.withdrawalEligibility?.netAmount || 0),
    },

    fulfillment: {
      status: rawFulfillmentStatus || "UNKNOWN",
      label:
        rawFulfillmentStatus === "UNPAID"
          ? (isIndo ? "Menunggu Bayar" : "Awaiting Pay")
          : fulfillmentStatusLabel(rawFulfillmentStatus, isIndo),
      tone:
        rawFulfillmentStatus === "DELIVERED"
          ? "green"
          : rawFulfillmentStatus === "SHIPPED"
          ? "blue"
          : rawFulfillmentStatus === "PROCESSING"
          ? "amber"
          : rawFulfillmentStatus === "CANCELLED"
          ? "red"
          : "slate",
      progress: Number(row.fulfillmentProgress || 0),
      trackingNumber: row.trackingNumber || "",
      shippingMethod: cleanCourier,
    },

    status: rawOrderStatus || "UNKNOWN",
    statusLabel: statusLabel(rawOrderStatus, isIndo),
    totalAmount: Number(row.totalAmount || row.total || 0),

    canFulfill: Boolean(row.canFulfill),
    allowedActions: Array.isArray(row.allowedActions) ? row.allowedActions : [],
  };
};
