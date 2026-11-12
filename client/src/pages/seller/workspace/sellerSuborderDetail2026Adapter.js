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

export const formatCompactOrderNumber = (invoiceNo, orderId, createdAt) => {
  const raw = String(invoiceNo || "").trim();
  if (!raw && !orderId) return "-";
  if (/^TP-\d{6}-\w+/i.test(raw)) return raw;

  const d = createdAt ? new Date(createdAt) : null;
  const dateStr =
    d && !Number.isNaN(d.getTime())
      ? `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
      : "261111";

  const numPart = orderId
    ? String(orderId).padStart(4, "0")
    : raw.replace(/[^A-Za-z0-9]/g, "").slice(-4) || "0001";

  return `TP-${dateStr}-${numPart}`;
};

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

export const statusTone = (value) => {
  const normalized = text(value).toUpperCase();
  if (normalized.includes("PAID") || normalized.includes("DELIVER") || normalized.includes("COMPLETE")) return "green";
  if (normalized.includes("SHIP") || normalized.includes("TRANSIT")) return "blue";
  if (normalized.includes("TO_PACK") || normalized.includes("PROCESS") || normalized.includes("PACK")) return "orange";
  if (normalized.includes("PENDING") || normalized.includes("UNPAID") || normalized.includes("WAIT")) {
    return "amber";
  }
  if (normalized.includes("CANCEL") || normalized.includes("FAIL") || normalized.includes("EXPIRE") || normalized.includes("RETURN")) {
    return "red";
  }
  return "slate";
};

export const isPaymentSettled = (value) => {
  const normalized = text(value).toUpperCase();
  return normalized === "PAID" || normalized === "SETTLED" || normalized.includes("PAID");
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
      substage: "order_arrived",
      code: "DELIVERED",
      label: isIndo ? "Pesanan Tiba" : "Order Arrived",
      tone: "green",
    };
  }

  if (f === "OUT_FOR_DELIVERY" || o === "OUT_FOR_DELIVERY") {
    return {
      bucket: "shipping",
      substage: "out_for_delivery",
      code: "OUT_FOR_DELIVERY",
      label: isIndo ? "Menuju Alamat" : "Out for Delivery",
      tone: "blue",
    };
  }

  if (f === "SHIPPED" || f === "IN_TRANSIT" || o === "SHIPPED") {
    return {
      bucket: "shipping",
      substage: "in_transit",
      code: "IN_TRANSIT",
      label: isIndo ? "Sedang Dikirim" : "In Transit",
      tone: "blue",
    };
  }

  if (f === "PACKED") {
    return {
      bucket: "to_pack",
      substage: "packed",
      code: "PACKED",
      label: isIndo ? "Siap Dikirim" : "Packed",
      tone: "orange",
    };
  }

  // Payment is settled, fulfillment not yet dispatched -> To Pack
  return {
    bucket: "to_pack",
    substage: "to_pack",
    code: "TO_PACK",
    label: isIndo ? "Perlu Dikemas" : "To Pack",
    tone: "orange",
  };
};

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
    const price = number(row.price ?? row.priceSnapshot, 0);
    const subtotal = number(row.subtotal ?? row.totalPrice, price * quantity);
    const name = text(
      row.productName ?? row.productNameSnapshot ?? row.name ?? row.product?.name,
      `${isIndo ? "Produk" : "Product"} ${index + 1}`
    );
    return {
      id: row.id ?? index,
      name,
      variantLabel: text(row.variantLabel ?? row.variant, isIndo ? "Standar" : "Standard item"),
      quantity,
      price,
      priceLabel: formatMoney(price),
      subtotal,
      subtotalLabel: formatMoney(subtotal),
      imageUrl: text(row.imageUrl ?? row.image ?? row.imageSnapshot ?? row.product?.image),
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
  const isPacked = isShipped || fulfillmentStatus === "PROCESSING" || fulfillmentStatus === "PACKED";

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
      createdAtLabel: isPacked ? (isIndo ? "Siap" : "Ready") : (isIndo ? "Menunggu" : "Pending"),
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

const buildProgressSteps = ({ syncStatus, isPaid, createdAt, paidAt, isIndo = false }) => {
  const syncBucket = syncStatus?.bucket || "to_pack";
  const substage = syncStatus?.substage || "";
  const isShipped = ["shipping", "completed"].includes(syncBucket);
  const isDelivered = syncBucket === "completed";
  const isOutForDelivery = substage === "out_for_delivery" || isDelivered;

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
      complete: isPaid,
      active: isPaid,
      dateLabel: isPaid ? formatDateShort(paidAt, isIndo) : (isIndo ? "Menunggu" : "Pending"),
    },
    {
      code: "PACKED",
      label: isIndo ? "Dikemas" : "Packed",
      complete: isShipped || substage === "packed",
      active: syncBucket === "to_pack",
      dateLabel: isShipped || substage === "packed" ? (isIndo ? "Siap" : "Ready") : (isIndo ? "Menunggu" : "Pending"),
    },
    {
      code: "IN_TRANSIT",
      label: isIndo ? "Sedang Dikirim" : "In Transit",
      complete: isDelivered || isOutForDelivery,
      active: syncBucket === "shipping" && !isOutForDelivery,
      dateLabel: isShipped ? (isIndo ? "Perjalanan" : "In transit") : (isIndo ? "Menunggu" : "Pending"),
    },
    {
      code: "OUT_FOR_DELIVERY",
      label: isIndo ? "Menuju Alamat" : "Out for Delivery",
      complete: isDelivered,
      active: substage === "out_for_delivery",
      dateLabel: isDelivered ? (isIndo ? "Selesai" : "Done") : isOutForDelivery ? (isIndo ? "Pengantaran" : "Delivering") : (isIndo ? "Menunggu" : "Pending"),
    },
    {
      code: "DELIVERED",
      label: isIndo ? "Pesanan Tiba" : "Order Arrived",
      complete: isDelivered,
      active: isDelivered,
      dateLabel: isDelivered ? (isIndo ? "Tiba" : "Delivered") : (isIndo ? "Menunggu" : "Pending"),
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

  // Robustly extract payment and fulfillment statuses
  const rawPaymentStatus = text(
    order.paymentStatus ?? detail.paymentStatus ?? payment.status,
    "UNPAID"
  ).toUpperCase();
  const rawFulfillmentStatus = text(
    order.fulfillmentStatus ?? detail.fulfillmentStatus ?? (order.status !== "UNPAID" ? order.status : null),
    "UNFULFILLED"
  ).toUpperCase();
  const rawParentOrderStatus = text(detail.orderStatus ?? order.orderStatus ?? detail.order?.status, "").toUpperCase();

  const isPaid = isPaymentSettled(rawPaymentStatus);

  // Synchronized 6-phase status bucket
  const syncStatus = getSynchronizedOrderStatus(
    {
      fulfillmentStatus: rawFulfillmentStatus,
      paymentStatus: rawPaymentStatus,
      orderStatus: rawParentOrderStatus,
    },
    isIndo
  );

  const createdAt = order.createdAt || order.orderDate || null;
  const paidAt = payment.paidAt || null;

  const rawCourier = shipping.courier || "";
  const rawMethod = shipping.method || "";
  const rawTracking = text(shipping.trackingNo);
  const safeTracking =
    rawTracking && !rawTracking.toLowerCase().includes("no tracking") ? rawTracking : "";

  // Next step guidance for the seller
  const nextStep = (() => {
    switch (syncStatus.bucket) {
      case "to_pack":
        return {
          bucket: "to_pack",
          title: isIndo ? "Langkah Selanjutnya: Kemas & Kirim Pesanan" : "Next Step: Pack & Ship Order",
          description: isIndo
            ? "Pembayaran telah terverifikasi. Masukkan nomor resi pengiriman di bawah untuk mengirim pesanan."
            : "Payment verified. Enter courier tracking number below to dispatch the order.",
          icon: "package",
          primaryAction: "MARK_SHIPPED",
          primaryLabel: isIndo ? "Kirim Pesanan" : "Ship Order",
          secondaryAction: "MARK_PROCESSING",
          secondaryLabel: isIndo ? "Tandai Siap Dikemas" : "Mark as Packed",
          canShip: true,
          canPack: true,
          badge: isIndo ? "Perlu Dikemas" : "To Pack",
          badgeTone: "orange",
        };
      case "shipping":
        return {
          bucket: "shipping",
          title: isIndo ? "Langkah Selanjutnya: Pantau Pengiriman" : "Next Step: Track Shipment",
          description: isIndo
            ? `Paket dalam perjalanan ekspedisi ${rawCourier ? `(${rawCourier})` : ""}. Konfirmasi selesai jika pembeli telah menerima pesanan.`
            : `Package in transit ${rawCourier ? `(${rawCourier})` : ""}. Confirm delivery once customer receives it.`,
          icon: "truck",
          primaryAction: "MARK_DELIVERED",
          primaryLabel: isIndo ? "Tandai Selesai" : "Mark as Delivered",
          canDeliver: true,
          badge: isIndo ? "Sedang Dikirim" : "Shipping",
          badgeTone: "blue",
        };
      case "completed":
        return {
          bucket: "completed",
          title: isIndo ? "Pesanan Selesai" : "Order Completed",
          description: isIndo
            ? "Pesanan telah diterima oleh pembeli. Dana penjualan telah masuk ke Saldo Toko Anda."
            : "Order delivered. Sale earnings credited to your store balance.",
          icon: "check",
          badge: isIndo ? "Selesai" : "Completed",
          badgeTone: "green",
        };
      case "unpaid":
        return {
          bucket: "unpaid",
          title: isIndo ? "Menunggu Pembayaran Pembeli" : "Awaiting Customer Payment",
          description: isIndo
            ? "Pesanan belum dibayar. Jangan kirim barang sebelum pembayaran berhasil diverifikasi."
            : "Order is unpaid. Do not ship until payment is confirmed.",
          icon: "clock",
          badge: isIndo ? "Belum Bayar" : "Unpaid",
          badgeTone: "amber",
        };
      case "returns":
        return {
          bucket: "returns",
          title: isIndo ? "Pengembalian / Kendala Pengiriman" : "Return / Delivery Issue",
          description: isIndo
            ? "Pesanan mengalami kendala pengiriman atau retur barang. Hubungi kurir atau pembeli."
            : "Shipment issue or return recorded. Please contact courier or buyer.",
          icon: "alert",
          badge: isIndo ? "Pengembalian" : "Returns",
          badgeTone: "red",
        };
      case "cancelled":
      default:
        return {
          bucket: "cancelled",
          title: isIndo ? "Pesanan Dibatalkan" : "Order Cancelled",
          description: isIndo
            ? "Pesanan telah dibatalkan atau masa pembayaran telah berakhir."
            : "Order was cancelled or payment expired.",
          icon: "x",
          badge: isIndo ? "Dibatalkan" : "Cancelled",
          badgeTone: "red",
        };
    }
  })();

  const rawParentOrderNo = text(order.orderNumber ?? order.invoiceNo, "Order");
  const parentOrderId = order.orderId || order.order?.id || null;
  const compactReference = formatCompactOrderNumber(rawParentOrderNo, parentOrderId, createdAt);
  const compactSuborderNo = order.suborderNo
    ? order.suborderNo.replace(/^STORE-IDEMP-[A-Fa-f0-9]+/, compactReference)
    : `${compactReference}-S01`;

  const rawPaymentMethod =
    payment.method && !payment.method.toLowerCase().includes("no payment") && !payment.method.toLowerCase().includes("tidak")
      ? payment.method
      : text(
          detail.paymentMethodLabel ||
          detail.paymentMethod ||
          order.paymentMethodLabel ||
          order.paymentMethod,
          isIndo ? "Metode Pembayaran Online" : "Online Payment"
        );

  const printLabel = asObject(order.printLabel ?? detail.printLabel);

  return {
    id: order.suborderId ?? order.id ?? null,
    orderId: parentOrderId,
    reference: compactReference,
    rawReference: rawParentOrderNo,
    suborderNo: compactSuborderNo,
    rawSuborderNo: text(order.suborderNo, isIndo ? "Sub-pesanan Toko" : "Store suborder"),
    scopeLabel: text(order.channel, isIndo ? "Pesanan Toko Tunggal" : "Single Store"),
    ordersPath: routes.orders || "/seller/stores",
    createdAt,
    createdAtLabel: formatDateTime(createdAt, isIndo),
    paidAtLabel: formatDateTime(paidAt, isIndo),

    statusBucket: syncStatus.bucket,
    syncStatus,
    nextStep,

    fulfillmentStatus: {
      code: rawFulfillmentStatus,
      label: syncStatus.label,
      tone: syncStatus.tone,
    },

    paymentStatus: {
      code: rawPaymentStatus,
      label: paymentStatusLabel(rawPaymentStatus, isIndo),
      tone: isPaid ? "green" : statusTone(rawPaymentStatus),
    },

    readinessStatus: {
      label: syncStatus.label,
      tone: syncStatus.tone,
    },

    progress: buildProgressSteps({
      syncStatus,
      isPaid,
      createdAt,
      paidAt,
      isIndo,
    }),

    customer: {
      name: text(customer.name, isIndo ? "Pelanggan" : "Customer"),
      email: text(customer.email),
      phone: text(customer.phone, "-"),
      address: text(customer.address, isIndo ? "Tidak ada alamat pengiriman." : "No shipping address available."),
      note: text(customer.note),
    },

    shipping: {
      status: syncStatus.label,
      statusTone: syncStatus.tone,
      method: sanitizeMethod(rawMethod),
      courier: sanitizeCourier(rawCourier, isIndo),
      trackingNo: safeTracking,
      trackingLabel: safeTracking || (isIndo ? "Belum ada resi" : "No tracking yet"),
      estimate: text(shipping.estimate),
      trackingUrl: `/order/${rawParentOrderNo || compactReference || parentOrderId}`,
    },

    payment: {
      method: rawPaymentMethod,
      proof: text(payment.proof, isIndo ? "Bukti tidak tersedia" : "No payment proof available"),
      paidAt,
    },
    canPrintLabel: Boolean(printLabel.canPrint),
    printLabelReason: text(
      printLabel.reason,
      printLabel.canPrint ? "Cetak Label Pengiriman" : "Label pengiriman belum tersedia."
    ),
    canMessageBuyer: Boolean(text(customer.phone || customer.email)),

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
      paymentStatus: rawPaymentStatus,
      fulfillmentStatus: rawFulfillmentStatus,
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
      canMarkPacked: syncStatus.bucket === "to_pack" || isActionEnabled(markPackedAction),
      canMarkShipped: syncStatus.bucket === "to_pack" || isActionEnabled(markShippedAction),
      canMarkDelivered: syncStatus.bucket === "shipping" || isActionEnabled(markDeliveredAction),
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
