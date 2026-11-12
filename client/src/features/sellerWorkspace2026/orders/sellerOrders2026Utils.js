export const paymentStatusLabel = (status, isIndo = false) => {
  const norm = String(status || "").toUpperCase();
  if (norm === "PAID" || norm === "SETTLED") return isIndo ? "Lunas" : "Paid";
  if (norm === "UNPAID") return isIndo ? "Belum Bayar" : "Unpaid";
  if (norm === "EXPIRED") return isIndo ? "Kedaluwarsa" : "Expired";
  if (norm === "FAILED") return isIndo ? "Gagal" : "Failed";
  if (norm === "CANCELLED") return isIndo ? "Dibatalkan" : "Cancelled";
  if (norm === "PENDING_CONFIRMATION") return isIndo ? "Menunggu Konfirmasi" : "Awaiting Review";
  return isIndo ? "Belum Bayar" : "Unpaid";
};

export const fulfillmentStatusLabel = (status, isIndo = false) => {
  const norm = String(status || "").toUpperCase();
  if (norm === "DELIVERED" || norm === "COMPLETED") return isIndo ? "Selesai" : "Delivered";
  if (norm === "SHIPPED" || norm === "IN_TRANSIT") return isIndo ? "Sedang Dikirim" : "In Transit";
  if (norm === "PROCESSING" || norm === "PACKED" || norm === "TO_PACK" || norm === "READY_TO_FULFILL") {
    return isIndo ? "Perlu Dikemas" : "To Pack";
  }
  if (norm === "CANCELLED") return isIndo ? "Dibatalkan" : "Cancelled";
  if (norm === "RETURNED" || norm === "FAILED_DELIVERY") return isIndo ? "Pengembalian" : "Returns";
  return isIndo ? "Belum Diproses" : "Unfulfilled";
};

export const statusTone = (status) => {
  const norm = String(status || "").toUpperCase();
  if (norm === "DELIVERED" || norm === "COMPLETED" || norm === "PAID") return "green";
  if (norm === "SHIPPED" || norm === "IN_TRANSIT") return "blue";
  if (norm === "TO_PACK" || norm === "PROCESSING" || norm === "PACKED") return "orange";
  if (norm === "CANCELLED" || norm === "FAILED" || norm === "EXPIRED" || norm === "RETURNED") return "red";
  if (norm === "UNPAID" || norm === "PENDING_CONFIRMATION") return "amber";
  return "slate";
};

export const getSynchronizedOrderStatus = ({ fulfillmentStatus, paymentStatus, orderStatus }, isIndo = false) => {
  const f = String(fulfillmentStatus || "").toUpperCase();
  const p = String(paymentStatus || "").toUpperCase();
  const o = String(orderStatus || "").toUpperCase();

  if (/CANCELLED|CANCELED|EXPIRED|FAILED|VOID/.test(o) || /CANCELLED|EXPIRED|FAILED/.test(p)) {
    return {
      bucket: "cancelled",
      code: "CANCELLED",
      label: isIndo ? "Dibatalkan" : "Cancelled",
      tone: "red",
    };
  }

  if (/REFUNDED|RETURNED|RETURN/.test(o) || /REFUNDED|RETURNED|FAILED_DELIVERY/.test(f)) {
    return {
      bucket: "returns",
      code: "RETURNS",
      label: isIndo ? "Pengembalian" : "Returns",
      tone: "red",
    };
  }

  if (p !== "PAID" && p !== "SETTLED") {
    return {
      bucket: "unpaid",
      code: "UNPAID",
      label: isIndo ? "Belum Bayar" : "Unpaid",
      tone: "amber",
    };
  }

  if (f === "DELIVERED" || o === "DELIVERED" || o === "COMPLETED") {
    return {
      bucket: "completed",
      code: "COMPLETED",
      label: isIndo ? "Selesai" : "Completed",
      tone: "green",
    };
  }

  if (f === "SHIPPED" || f === "IN_TRANSIT" || f === "OUT_FOR_DELIVERY") {
    return {
      bucket: "shipping",
      code: "SHIPPING",
      label: isIndo ? "Sedang Dikirim" : "Shipping",
      tone: "blue",
    };
  }

  // Payment is settled, fulfillment is UNFULFILLED, PROCESSING, or PACKED -> To Pack
  return {
    bucket: "to_pack",
    code: "TO_PACK",
    label: isIndo ? "Perlu Dikemas" : "To Pack",
    tone: "orange",
  };
};

export const statusLabel = (status, isIndo = false) => {
  const norm = String(status || "").toUpperCase();
  if (norm === "UNPAID") return isIndo ? "Belum Bayar" : "Unpaid";
  if (norm === "PENDING_CONFIRMATION") return isIndo ? "Menunggu Konfirmasi" : "Awaiting Review";
  if (norm === "TO_PACK" || norm === "PROCESSING" || norm === "PACKED") return isIndo ? "Perlu Dikemas" : "To Pack";
  if (norm === "SHIPPED" || norm === "IN_TRANSIT") return isIndo ? "Sedang Dikirim" : "In Transit";
  if (norm === "DELIVERED" || norm === "COMPLETED") return isIndo ? "Selesai" : "Completed";
  if (norm === "CANCELLED") return isIndo ? "Dibatalkan" : "Cancelled";
  if (norm === "FAILED") return isIndo ? "Gagal" : "Failed";
  if (norm === "EXPIRED") return isIndo ? "Kedaluwarsa" : "Expired";
  return isIndo ? "Perlu Dikemas" : "To Pack";
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

  const rawOrderStatus = String(row.status || "").toUpperCase();
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

  const syncStatus = getSynchronizedOrderStatus(
    {
      fulfillmentStatus: rawFulfillmentStatus,
      paymentStatus: rawPaymentStatus,
      orderStatus: rawOrderStatus,
    },
    isIndo
  );

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
          ? (isIndo ? "Belum Bayar" : "Unpaid")
          : fulfillmentStatusLabel(rawFulfillmentStatus, isIndo),
      tone:
        rawFulfillmentStatus === "DELIVERED"
          ? "green"
          : rawFulfillmentStatus === "SHIPPED"
          ? "blue"
          : rawFulfillmentStatus === "PROCESSING"
          ? "orange"
          : rawFulfillmentStatus === "CANCELLED"
          ? "red"
          : "slate",
      progress: Number(row.fulfillmentProgress || 0),
      trackingNumber: row.trackingNumber || "",
      shippingMethod: cleanCourier,
    },

    status: syncStatus.code,
    statusLabel: syncStatus.label,
    statusTone: syncStatus.tone,
    statusBucket: syncStatus.bucket,
    totalAmount: Number(row.totalAmount || row.total || 0),

    canFulfill: Boolean(row.canFulfill),
    allowedActions: Array.isArray(row.allowedActions) ? row.allowedActions : [],
  };
};
