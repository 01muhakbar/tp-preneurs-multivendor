export type Seller2026SuborderStatus =
  | "UNPAID"
  | "PENDING_CONFIRMATION"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "UNKNOWN";

export type Seller2026OrdersViewModel = {
  summary: {
    total: number;
    unpaid: number;
    pendingConfirmation: number;
    processing: number;
    shipped: number;
    delivered: number;
  };
  suborders: Array<{
    id: string | number;
    invoiceNo: string;
    suborderNo: string;
    orderDate: string | null;
    customerName: string;
    customerPhone?: string;
    channel?: string;
    shippingMethod?: string;
    total: number;
    status: Seller2026SuborderStatus;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type Seller2026SuborderDetailViewModel = {
  suborder: {
    id: string | number;
    invoiceNo: string;
    suborderNo: string;
    status: string;
    orderDate: string | null;
    channel?: string;
  } | null;
  customer: {
    name: string;
    phone?: string;
    address: string;
    note?: string;
  } | null;
  shipping: {
    method?: string;
    trackingNo?: string;
    estimate?: string;
  } | null;
  items: Array<{
    id: string | number;
    productName: string;
    variantLabel?: string;
    quantity: number;
    price: number;
    subtotal: number;
    imageUrl?: string | null;
  }>;
  totals: {
    subtotal: number;
    shippingFee: number;
    serviceFee: number;
    discount: number;
    total: number;
  };
  timeline: Array<{
    id: string | number;
    label: string;
    description?: string;
    createdAt: string | null;
  }>;
  notes: Array<{
    id: string | number;
    author: string;
    message: string;
    createdAt: string | null;
  }>;
};

export type Seller2026PaymentReviewViewModel = {
  summary: {
    totalPending: number;
    totalAmount: number;
    approvedToday: number;
    rejectedToday: number;
  };
  payments: Array<{
    id: string | number;
    paymentNo: string;
    invoiceNo?: string;
    customerName?: string;
    amount: number;
    method?: string;
    status: string;
    receivedAt: string | null;
    proofUrl?: string | null;
    riskLabel?: "low" | "medium" | "high" | "unknown";
  }>;
  selectedPayment?: {
    id: string | number;
    paymentNo: string;
    invoiceNo?: string;
    customerName?: string;
    amount: number;
    method?: string;
    payerName?: string;
    referenceNo?: string;
    proofUrl?: string | null;
    status: string;
    receivedAt: string | null;
    breakdown: Array<{ label: string; value: number | string }>;
    riskChecks: Array<{ label: string; status: "pass" | "warning" | "fail" | "unknown" }>;
    timeline: Array<{ label: string; actor?: string; createdAt: string | null }>;
  } | null;
};

export type Seller2026PaymentProfileViewModel = {
  status: "PENDING" | "ACTIVE" | "REJECTED" | "INACTIVE";
  methods: Array<{
    type: "QRIS" | "BANK_TRANSFER" | "OTHER";
    label: string;
    status: "ACTIVE" | "PENDING" | "REJECTED" | "INACTIVE";
    qrUrl?: string | null;
    accountName?: string;
    accountNoMasked?: string;
    bankName?: string;
  }>;
  payoutAccount: {
    bankName: string;
    accountNoMasked: string;
    accountName: string;
    status: "VERIFIED" | "PENDING" | "REJECTED" | "UNKNOWN";
  } | null;
  balances: {
    available: number;
    hold: number;
    lastPayoutAmount?: number;
    lastPayoutDate?: string | null;
  };
  documents: Array<{
    label: string;
    value?: string;
    status: "VERIFIED" | "PENDING" | "REJECTED" | "OPTIONAL" | "MISSING";
  }>;
  timeline: Array<{ label: string; actor?: string; createdAt: string | null }>;
};

const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const idValue = (value: unknown, fallback: string | number = ""): string | number =>
  typeof value === "string" || typeof value === "number" ? value : fallback;

export function normalizeSuborderStatus(status: unknown): Seller2026SuborderStatus {
  const value = text(status).toUpperCase();

  if (value.includes("UNPAID")) return "UNPAID";
  if (value.includes("PENDING")) return "PENDING_CONFIRMATION";
  if (value.includes("PROCESS")) return "PROCESSING";
  if (value.includes("SHIP")) return "SHIPPED";
  if (value.includes("DELIVER") || value.includes("COMPLETED")) return "DELIVERED";
  if (value.includes("CANCEL")) return "CANCELLED";

  return "UNKNOWN";
}

const normalizePaymentProfileStatus = (status: unknown) => {
  const value = text(status).toUpperCase();
  if (value.includes("ACTIVE") || value.includes("VERIFIED")) return "ACTIVE";
  if (value.includes("REJECT")) return "REJECTED";
  if (value.includes("PENDING") || value.includes("SUBMITTED")) return "PENDING";
  return "INACTIVE";
};

const readItems = (value: unknown) => {
  const response = object(value);
  const data = object(response.data);
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(response.data)) return response.data;
  return [];
};

const readPayload = (value: unknown) => {
  const response = object(value);
  const data = object(response.data);
  return Object.keys(data).length ? data : response;
};

const readPagination = (value: unknown, fallbackLimit = 10) => {
  const response = object(value);
  const pagination = object(response.pagination ?? object(response.data).pagination);
  const page = number(pagination.page, 1);
  const limit = number(pagination.limit, fallbackLimit);
  const total = number(pagination.total, readItems(value).length);
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / Math.max(1, limit))) };
};

const adaptOrderRow = (value: unknown) => {
  const row = object(value);
  const order = object(row.order);
  const buyer = object(row.buyer ?? row.customer);
  const readModel = object(row.readModel);
  const sellerScope = object(readModel.sellerScope);
  const primaryStatus = object(readModel.primaryStatus);
  const paymentState = object(readModel.paymentState);
  const paymentSummary = object(row.paymentSummary);
  const fulfillmentMeta = object(row.fulfillmentStatusMeta);
  const paymentMeta = object(row.paymentStatusMeta);
  const status = normalizeSuborderStatus(
    primaryStatus.code ??
      primaryStatus.label ??
      row.fulfillmentStatus ??
      fulfillmentMeta.code ??
      paymentState.code ??
      paymentMeta.code ??
      row.paymentStatus
  );
  return {
    id: idValue(row.suborderId ?? row.id),
    invoiceNo: text(row.orderNumber ?? order.orderNumber ?? row.invoiceNo, "-"),
    suborderNo: text(row.suborderNumber ?? row.suborderNo, "-"),
    orderDate: text(row.createdAt ?? order.createdAt) || null,
    customerName: text(buyer.name, "Customer"),
    customerPhone: text(buyer.phone) || undefined,
    channel: text(order.checkoutMode ?? row.checkoutMode ?? row.channel) || undefined,
    shippingMethod: text(row.shippingStatus ?? row.shippingMethod ?? primaryStatus.label) || undefined,
    total: number(row.totalAmount ?? sellerScope.totalAmount ?? paymentSummary.amount, 0),
    status,
  };
};

export function adaptSeller2026Orders(value: unknown): Seller2026OrdersViewModel {
  const suborders = readItems(value).map(adaptOrderRow);
  const summary = {
    total: suborders.length,
    unpaid: suborders.filter((item) => item.status === "UNPAID").length,
    pendingConfirmation: suborders.filter((item) => item.status === "PENDING_CONFIRMATION").length,
    processing: suborders.filter((item) => item.status === "PROCESSING").length,
    shipped: suborders.filter((item) => item.status === "SHIPPED").length,
    delivered: suborders.filter((item) => item.status === "DELIVERED").length,
  };

  return {
    summary: { ...summary, total: readPagination(value).total || summary.total },
    suborders,
    pagination: readPagination(value, 10),
  };
}

export function adaptSeller2026SuborderDetail(value: unknown): Seller2026SuborderDetailViewModel {
  const detail = readPayload(value);
  const order = object(detail.order);
  const buyer = object(detail.buyer);
  const shipping = object(detail.shipping);
  const readModel = object(detail.readModel);
  const sellerScope = object(readModel.sellerScope);
  const primaryStatus = object(readModel.primaryStatus);
  const paymentState = object(readModel.paymentState);
  const totals = object(detail.totals);
  const paymentSummary = object(detail.paymentSummary);
  const suborderId = idValue(detail.suborderId ?? detail.id, "");
  if (!suborderId) {
    return emptySeller2026SuborderDetail;
  }

  const items = array(detail.items).map((item, index) => {
    const row = object(item);
    const quantity = number(row.qty ?? row.quantity, 0);
    const price = number(row.price, 0);
    return {
      id: idValue(row.id, index),
      productName: text(row.productName ?? row.name, `Product ${index + 1}`),
      variantLabel: text(row.variantLabel ?? row.variant) || undefined,
      quantity,
      price,
      subtotal: number(row.totalPrice ?? row.subtotal, price * quantity),
      imageUrl: text(row.imageUrl ?? row.thumbnailUrl) || null,
    };
  });
  const shipments = array(detail.shipments).map(object);
  const trackingEvents = shipments.flatMap((shipment) => array(shipment.trackingEvents ?? shipment.events));

  return {
    suborder: {
      id: suborderId,
      invoiceNo: text(order.orderNumber ?? detail.orderNumber ?? detail.invoiceNo, "-"),
      suborderNo: text(detail.suborderNumber ?? detail.suborderNo, "-"),
      status: normalizeSuborderStatus(
        primaryStatus.code ?? primaryStatus.label ?? detail.fulfillmentStatus ?? paymentState.code ?? detail.paymentStatus
      ),
      orderDate: text(detail.createdAt ?? order.createdAt) || null,
      channel: text(order.checkoutMode ?? detail.checkoutMode) || undefined,
    },
    customer: {
      name: text(buyer.name ?? shipping.fullName, "Customer"),
      phone: text(buyer.phone ?? shipping.phoneNumber) || undefined,
      address: text(shipping.addressLine, "Shipping address is not available."),
      note: text(order.note) || undefined,
    },
    shipping: {
      method: text(detail.shippingStatus ?? shipments[0]?.courierService) || undefined,
      trackingNo: text(shipments[0]?.trackingNumber) || undefined,
      estimate: text(shipments[0]?.estimate) || undefined,
    },
    items,
    totals: {
      subtotal: number(totals.subtotalAmount, items.reduce((sum, item) => sum + item.subtotal, 0)),
      shippingFee: number(totals.shippingAmount ?? sellerScope.shippingAmount, 0),
      serviceFee: number(totals.serviceFeeAmount ?? sellerScope.serviceFeeAmount, 0),
      discount: number(totals.discountAmount, 0),
      total: number(totals.totalAmount ?? sellerScope.totalAmount ?? paymentSummary.amount, 0),
    },
    timeline: trackingEvents.map((item, index) => {
      const event = object(item);
      return {
        id: idValue(event.id, index),
        label: text(event.status ?? event.label, "Shipment update"),
        description: text(event.description) || undefined,
        createdAt: text(event.createdAt ?? event.timestamp) || null,
      };
    }),
    notes: [],
  };
}

const adaptPaymentRow = (value: unknown, index = 0) => {
  const suborder = object(value);
  const payment = object(suborder.payment ?? suborder.paymentSummary);
  const proof = object(payment.proof);
  const buyer = object(suborder.buyer);
  const order = object(suborder.order);
  const id = idValue(payment.id ?? proof.id ?? suborder.suborderId, index);
  const amount = number(payment.amount ?? proof.transferAmount ?? suborder.totalAmount, 0);
  return {
    id,
    paymentNo: text(payment.internalReference ?? suborder.suborderNumber ?? id, `PAY-${id}`),
    invoiceNo: text(suborder.orderNumber ?? order.orderNumber) || undefined,
    customerName: text(buyer.name ?? suborder.customerName) || undefined,
    amount,
    method: text(payment.paymentChannel ?? proof.senderBankOrWallet) || undefined,
    status: text(proof.reviewStatus ?? payment.status ?? suborder.paymentStatus, "PENDING").toUpperCase(),
    receivedAt: text(proof.createdAt ?? proof.transferTime ?? payment.paidAt ?? suborder.paidAt) || null,
    proofUrl: text(proof.proofImageUrl ?? proof.imageUrl) || null,
    riskLabel: "unknown" as const,
  };
};

export function adaptSeller2026PaymentReview(value: unknown): Seller2026PaymentReviewViewModel {
  const items = readItems(value);
  const payments = items.map(adaptPaymentRow);
  const selected = payments[0] || null;
  return {
    summary: {
      totalPending: payments.filter((item) => item.status.includes("PENDING")).length,
      totalAmount: payments.reduce((sum, item) => sum + item.amount, 0),
      approvedToday: payments.filter((item) => item.status.includes("APPROVED") || item.status.includes("PAID")).length,
      rejectedToday: payments.filter((item) => item.status.includes("REJECT")).length,
    },
    payments,
    selectedPayment: selected
      ? {
          ...selected,
          payerName: selected.customerName,
          referenceNo: selected.paymentNo,
          breakdown: [
            { label: "Amount received", value: selected.amount },
            { label: "Payment method", value: selected.method || "Unknown" },
            { label: "Invoice", value: selected.invoiceNo || "-" },
          ],
          riskChecks: [
            { label: "Nominal check", status: selected.amount > 0 ? "pass" : "unknown" },
            { label: "Payment proof", status: selected.proofUrl ? "pass" : "unknown" },
            { label: "Manual review", status: "unknown" },
          ],
          timeline: [{ label: "Payment submitted", actor: "Customer", createdAt: selected.receivedAt }],
        }
      : null,
  };
}

export function adaptSeller2026PaymentProfile(value: unknown): Seller2026PaymentProfileViewModel {
  const profile = readPayload(value);
  const active = object(profile.activeSnapshot);
  const activeSource = Object.keys(active).length ? active : profile;
  const pending = object(profile.pendingRequest);
  const governance = object(profile.governance);
  const readModel = object(profile.readModel);
  const review = object(profile.reviewFeedback);
  const readiness = object(profile.readiness ?? activeSource.readiness);
  const status = normalizePaymentProfileStatus(
    activeSource.verificationStatus ?? readiness.code ?? pending.requestStatus ?? review.code
  );
  const qrisUrl = text(activeSource.qrisImageUrl ?? pending.qrisImageUrl) || null;
  const accountName = text(activeSource.accountName ?? pending.accountName);
  const merchantName = text(activeSource.merchantName ?? pending.merchantName);

  return {
    status,
    methods: qrisUrl || accountName || merchantName
      ? [{
          type: "QRIS",
          label: merchantName || accountName || "QRIS",
          status,
          qrUrl: qrisUrl,
          accountName: accountName || undefined,
        }]
      : [],
    payoutAccount: accountName
      ? {
          bankName: "QRIS",
          accountNoMasked: text(activeSource.merchantId ?? pending.merchantId, "-"),
          accountName,
          status: status === "ACTIVE" ? "VERIFIED" : status === "REJECTED" ? "REJECTED" : "PENDING",
        }
      : null,
    balances: { available: 0, hold: 0 },
    documents: [
      { label: "KTP/NIK", value: accountName || undefined, status: accountName ? "PENDING" : "MISSING" },
      { label: "NPWP", status: "OPTIONAL" },
      { label: "QRIS document", value: qrisUrl || undefined, status: qrisUrl ? (status === "ACTIVE" ? "VERIFIED" : "PENDING") : "MISSING" },
    ],
    timeline: [
      { label: text(object(readModel.nextStep).label, "Payment profile snapshot"), actor: text(object(readModel.nextStep).actor) || undefined, createdAt: text(profile.updatedAt ?? activeSource.updatedAt) || null },
      { label: text(governance.note, "Admin review required"), actor: "System", createdAt: text(governance.submittedAt) || null },
    ].filter((item) => item.label),
  };
}

export const emptySeller2026Orders: Seller2026OrdersViewModel = {
  summary: { total: 0, unpaid: 0, pendingConfirmation: 0, processing: 0, shipped: 0, delivered: 0 },
  suborders: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
};

export const emptySeller2026SuborderDetail: Seller2026SuborderDetailViewModel = {
  suborder: null,
  customer: null,
  shipping: null,
  items: [],
  totals: { subtotal: 0, shippingFee: 0, serviceFee: 0, discount: 0, total: 0 },
  timeline: [],
  notes: [],
};

export const emptySeller2026PaymentReview: Seller2026PaymentReviewViewModel = {
  summary: { totalPending: 0, totalAmount: 0, approvedToday: 0, rejectedToday: 0 },
  payments: [],
  selectedPayment: null,
};

export const emptySeller2026PaymentProfile: Seller2026PaymentProfileViewModel = {
  status: "INACTIVE",
  methods: [],
  payoutAccount: null,
  balances: { available: 0, hold: 0 },
  documents: [],
  timeline: [],
};
