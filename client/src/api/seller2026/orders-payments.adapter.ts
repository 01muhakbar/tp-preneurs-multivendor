export type Seller2026SuborderStatus =
  | "UNPAID"
  | "PENDING_CONFIRMATION"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "UNKNOWN";

export type Seller2026FulfillmentActionViewModel = {
  code: string;
  label: string;
  nextStatus: string;
  description?: string;
  enabled: boolean;
  reason?: string | null;
};

export type Seller2026OrdersViewModel = {
  summary: {
    total: number;
    pending: number;
    unpaid: number;
    paymentPending: number;
    pendingConfirmation: number;
    processing: number;
    packed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    needsAttention: number;
  };
  suborders: Array<{
    id: string | number;
    suborderId: string | number;
    orderId: string | number | null;
    invoiceNo: string;
    orderNumber: string;
    suborderNo: string;
    orderDate: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    paidAt: string | null;
    customerName: string;
    customerInitials: string;
    customerEmail?: string;
    customerPhone?: string;
    itemsCount: number;
    items: Array<{
      id: string | number;
      label: string;
      imageUrl?: string | null;
    }>;
    channel?: string;
    shippingMethod?: string;
    deliveryMethod?: string;
    trackingNumber?: string;
    currency: string;
    total: number;
    totalAmount: number;
    paymentStatus: string;
    paymentLabel: string;
    paymentTone: string;
    paymentMethod: string;
    withdrawalEligibility: {
      code: string;
      label: string;
      description: string;
      tone: string;
      isEligible: boolean;
      netAmount: number;
    };
    shippingStatus: string;
    status: Seller2026SuborderStatus;
    fulfillmentStatus: Seller2026SuborderStatus;
    fulfillmentLabel: string;
    fulfillmentTone: string;
    fulfillmentProgress: number;
    createdLabel: string;
    updatedLabel: string;
    allowedActions: string[];
    canFulfill: boolean;
    fulfillmentActions: Seller2026FulfillmentActionViewModel[];
    canonicalDetailHref?: string;
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
    suborderId: string | number;
    orderId: string | number | null;
    invoiceNo: string;
    orderNumber: string;
    suborderNo: string;
    status: string;
    paymentStatus: string;
    shippingStatus: string;
    orderDate: string | null;
    channel?: string;
    fulfillmentActions: Seller2026FulfillmentActionViewModel[];
    allowedActions: string[];
    canFulfill: boolean;
    printLabel: {
      canPrint: boolean;
      reason: string | null;
      endpoint: string | null;
    };
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address: string;
    note?: string;
  } | null;
  shipping: {
    method?: string;
    trackingNo?: string;
    courier?: string;
    estimate?: string;
  } | null;
  payment: {
    status: string;
    method: string;
    proof: string;
    paidAt: string | null;
  };
  items: Array<{
    id: string | number;
    productName: string;
    variantLabel?: string;
    quantity: number;
    price: number;
    subtotal: number;
    imageUrl?: string | null;
    productType?: string | null;
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
  internalNotes: string | null;
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
    canReview: boolean;
    reviewReason?: string | null;
    buyerNote?: string | null;
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
    canReview: boolean;
    reviewReason?: string | null;
    buyerNote?: string | null;
    breakdown: Array<{ label: string; value: number | string }>;
    riskChecks: Array<{ label: string; status: "pass" | "warning" | "fail" | "unknown" }>;
    timeline: Array<{ label: string; actor?: string; createdAt: string | null }>;
  } | null;
  governance: {
    canView: boolean;
    canReview: boolean;
    roleCode?: string;
    note?: string;
  };
};

export type Seller2026PaymentProfileViewModel = {
  status: "PENDING" | "ACTIVE" | "REJECTED" | "INACTIVE";
  requestStatus: {
    code: string;
    label: string;
    description?: string | null;
    isSubmitted: boolean;
    isDraft: boolean;
  };
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
  requestDraft: {
    accountName: string;
    merchantName: string;
    merchantId: string;
    qrisImageUrl: string;
    qrisPayload: string;
    instructionText: string;
    sellerNote: string;
  };
  governance: {
    canEdit: boolean;
    permissionCanEdit: boolean;
    isReviewLocked: boolean;
    mode: string;
    note?: string | null;
    editableFields: string[];
  };
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

const formatDateTime = (value: unknown) => {
  const normalized = text(value);
  if (!normalized) return "-";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const initials = (value: unknown) => {
  const normalized = text(value, "Customer");
  return normalized
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "CU";
};

const statusTone = (value: unknown) => {
  const normalized = text(value).toUpperCase();
  if (normalized.includes("PAID") || normalized.includes("DELIVER")) return "green";
  if (normalized.includes("SHIP") || normalized.includes("TRANSIT")) return "blue";
  if (normalized.includes("PROCESS")) return "violet";
  if (normalized.includes("PENDING") || normalized.includes("UNPAID") || normalized.includes("UNFULFILLED")) return "amber";
  if (normalized.includes("CANCEL") || normalized.includes("FAIL") || normalized.includes("EXPIRE")) return "red";
  return "slate";
};

const fulfillmentProgress = (status: Seller2026SuborderStatus) => {
  if (status === "DELIVERED") return 100;
  if (status === "SHIPPED") return 75;
  if (status === "PROCESSING") return 50;
  if (status === "PENDING_CONFIRMATION") return 25;
  return 12;
};

const readFulfillmentActions = (value: unknown): Seller2026FulfillmentActionViewModel[] => {
  const source = object(value);
  const governance = object(source.governance);
  const fulfillment = object(governance.fulfillment);
  return array(fulfillment.availableActions)
    .map((item) => {
      const action = object(item);
      const code = text(action.code).toUpperCase();
      if (!code) return null;
      return {
        code,
        label: text(action.label, code),
        nextStatus: text(action.nextStatus).toUpperCase(),
        description: text(action.description) || undefined,
        enabled: action.enabled !== false,
        reason: text(action.reason) || null,
      };
    })
    .filter(Boolean) as Seller2026FulfillmentActionViewModel[];
};

const readAllowedActionCodes = (value: unknown) =>
  readFulfillmentActions(value)
    .filter((action) => action.enabled !== false)
    .map((action) => action.code);

const hasEnabledFulfillmentAction = (value: unknown) => readAllowedActionCodes(value).length > 0;

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

const readPaymentMethodLabel = (
  source: Record<string, unknown>,
  paymentSummary: Record<string, unknown>,
  fallback = "Payment"
) =>
  text(
    paymentSummary.paymentMethodLabel ??
      source.paymentMethodLabel ??
      paymentSummary.paymentMethod ??
      source.paymentMethod ??
      paymentSummary.paymentChannel ??
      paymentSummary.paymentType,
    fallback
);

const readWithdrawalEligibility = (value: unknown) => {
  const meta = object(value);
  return {
    code: text(meta.code, "NOT_PAID").toUpperCase(),
    label: text(meta.label, "Not paid"),
    description: text(meta.description, ""),
    tone: text(meta.tone, "slate"),
    isEligible: Boolean(meta.isEligible),
    netAmount: number(meta.netAmount, 0),
  };
};

const adaptOrderRow = (value: unknown) => {
  const row = object(value);
  const order = object(row.order);
  const buyer = object(row.buyer ?? row.customer);
  const paymentSummary = object(row.paymentSummary);
  const shipments = array(row.shipments).map(object);
  const latestTracking = object(row.latestTrackingEvent);
  const readModel = object(row.readModel);
  const sellerScope = object(readModel.sellerScope);
  const primaryStatus = object(readModel.primaryStatus);
  const paymentState = object(readModel.paymentState);
  const fulfillmentMeta = object(row.fulfillmentStatusMeta);
  const paymentMeta = object(row.paymentStatusMeta);
  const withdrawalEligibility = readWithdrawalEligibility(row.withdrawalEligibility);
  const shippingMeta = object(row.shippingStatusMeta);
  const status = normalizeSuborderStatus(
    primaryStatus.code ??
      primaryStatus.label ??
      row.fulfillmentStatus ??
      fulfillmentMeta.code ??
      paymentState.code ??
      paymentMeta.code ??
      row.paymentStatus
  );
  const paymentStatus = text(paymentMeta.code ?? paymentState.code ?? row.paymentStatus, "UNPAID").toUpperCase();
  const fulfillmentActions = readFulfillmentActions(row);
  const id = idValue(row.suborderId ?? row.id);
  const orderNumber = text(row.orderNumber ?? order.orderNumber ?? row.invoiceNo, "Order");
  const itemCount = number(row.itemCount ?? sellerScope.itemCount, 0);
  const customerName = text(buyer.name, "Customer");
  const rawItems = array(row.items).map((item, index) => {
    const itemValue = object(item);
    return {
      id: idValue(itemValue.id ?? itemValue.productId, index),
      label: text(itemValue.productName ?? itemValue.name, `Item ${index + 1}`),
      imageUrl: text(itemValue.imageUrl ?? itemValue.thumbnailUrl ?? itemValue.image ?? object(itemValue.product).imageUrl ?? object(itemValue.product).image ?? object(itemValue.Product).imageUrl ?? object(itemValue.Product).image) || null,
    };
  });
  const paymentLabel = text(paymentMeta.label ?? paymentState.label ?? paymentStatus, paymentStatus);
  const fulfillmentLabel = text(
    fulfillmentMeta.label ?? primaryStatus.label ?? row.fulfillmentStatus,
    status === "PROCESSING" ? "Ready to Pack" : status
  );
  const updatedAt = text(row.updatedAt ?? row.createdAt ?? order.createdAt) || null;
  return {
    id,
    suborderId: id,
    orderId: idValue(row.orderId ?? order.id, "") || null,
    invoiceNo: orderNumber,
    orderNumber,
    suborderNo: text(row.suborderNumber ?? row.suborderNo, "Order"),
    orderDate: text(row.createdAt ?? order.createdAt) || "Recently",
    createdAt: text(row.createdAt ?? order.createdAt) || "Recently",
    updatedAt,
    paidAt: text(row.paidAt ?? paymentSummary.paidAt) || null,
    customerName,
    customerInitials: initials(customerName),
    customerEmail: text(buyer.email) || undefined,
    customerPhone: text(buyer.phone) || undefined,
    itemsCount: itemCount,
    items: rawItems,
    channel: text(order.checkoutMode ?? row.checkoutMode ?? row.channel) || undefined,
    shippingMethod: text(row.shippingStatus ?? row.shippingMethod ?? primaryStatus.label) || undefined,
    deliveryMethod: text(row.shippingStatus ?? row.deliveryMethod ?? row.shippingMethod) || "Needs review",
    trackingNumber: text(row.trackingNumber ?? shipments[0]?.trackingNumber ?? latestTracking.trackingNumber) || undefined,
    currency: text(row.currency, "IDR"),
    total: number(row.totalAmount ?? sellerScope.totalAmount ?? paymentSummary.amount, 0),
    totalAmount: number(row.totalAmount ?? sellerScope.totalAmount ?? paymentSummary.amount, 0),
    paymentStatus,
    paymentLabel,
    paymentTone: statusTone(paymentStatus),
    paymentMethod: readPaymentMethodLabel(row, paymentSummary),
    withdrawalEligibility,
    shippingStatus: text(shippingMeta.label ?? row.shippingStatus, "Needs review"),
    status,
    fulfillmentStatus: status,
    fulfillmentLabel,
    fulfillmentTone: statusTone(status),
    fulfillmentProgress: fulfillmentProgress(status),
    createdLabel: formatDateTime(row.createdAt ?? order.createdAt),
    updatedLabel: formatDateTime(updatedAt),
    allowedActions: fulfillmentActions.filter((action) => action.enabled !== false).map((action) => action.code),
    canFulfill: fulfillmentActions.some((action) => action.enabled !== false),
    fulfillmentActions,
    canonicalDetailHref: id ? `/orders/${encodeURIComponent(String(id))}` : undefined,
  };
};

export function adaptSeller2026Orders(value: unknown): Seller2026OrdersViewModel {
  const suborders = readItems(value).map(adaptOrderRow);
  const summary = {
    total: suborders.length,
    pending: suborders.filter((item) => item.fulfillmentStatus === "UNPAID" || item.fulfillmentStatus === "UNKNOWN").length,
    unpaid: suborders.filter((item) => item.paymentStatus === "UNPAID").length,
    paymentPending: suborders.filter((item) => ["UNPAID", "PARTIALLY_PAID", "PENDING_CONFIRMATION"].includes(item.paymentStatus)).length,
    pendingConfirmation: suborders.filter((item) => item.paymentStatus === "PENDING_CONFIRMATION").length,
    processing: suborders.filter((item) => item.fulfillmentStatus === "PROCESSING").length,
    packed: suborders.filter((item) => item.fulfillmentStatus === "PROCESSING").length,
    shipped: suborders.filter((item) => item.fulfillmentStatus === "SHIPPED").length,
    delivered: suborders.filter((item) => item.fulfillmentStatus === "DELIVERED").length,
    cancelled: suborders.filter((item) => item.fulfillmentStatus === "CANCELLED").length,
    needsAttention: suborders.filter((item) => item.canFulfill || item.paymentStatus === "PENDING_CONFIRMATION").length,
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
  const detailPaymentMeta = object(detail.paymentStatusMeta);
  const detailShippingMeta = object(detail.shippingStatusMeta);
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
      imageUrl: text(row.imageUrl ?? row.thumbnailUrl ?? row.image ?? object(row.product).imageUrl ?? object(row.product).image ?? object(row.Product).imageUrl ?? object(row.Product).image) || null,
      productType: text(row.productType) || null,
    };
  });
  const shipments = array(detail.shipments).map(object);
  const trackingEvents = shipments.flatMap((shipment) => array(shipment.trackingEvents ?? shipment.events));
  const printLabel = object(detail.printLabel);

  return {
    suborder: {
      id: suborderId,
      suborderId,
      orderId: idValue(detail.orderId ?? order.id, "") || null,
      invoiceNo: text(order.orderNumber ?? detail.orderNumber ?? detail.invoiceNo, "Order"),
      orderNumber: text(order.orderNumber ?? detail.orderNumber ?? detail.invoiceNo, "Order"),
      suborderNo: text(detail.suborderNumber ?? detail.suborderNo, "Order"),
      status: normalizeSuborderStatus(
        primaryStatus.code ?? primaryStatus.label ?? detail.fulfillmentStatus ?? paymentState.code ?? detail.paymentStatus
      ),
      paymentStatus: text(detailPaymentMeta.code ?? paymentState.code ?? detail.paymentStatus, "UNPAID").toUpperCase(),
      shippingStatus: text(detailShippingMeta.label ?? detail.shippingStatus, "Needs review"),
      orderDate: text(detail.createdAt ?? order.createdAt) || "Recently",
      channel: text(order.checkoutMode ?? detail.checkoutMode) || undefined,
      fulfillmentActions: readFulfillmentActions(detail),
      allowedActions: readAllowedActionCodes(detail),
      canFulfill: hasEnabledFulfillmentAction(detail),
      printLabel: {
        canPrint: Boolean(printLabel.canPrint),
        reason: text(printLabel.reason) || null,
        endpoint: text(printLabel.endpoint) || null,
      },
      createdAt: text(detail.createdAt ?? order.createdAt) || "Recently",
      updatedAt: text(detail.updatedAt) || null,
    },
    customer: {
      name: text(buyer.name ?? shipping.fullName, "Customer"),
      email: text(buyer.email) || undefined,
      phone: text(buyer.phone ?? shipping.phoneNumber) || undefined,
      address: text(shipping.addressLine, "No shipping address available."),
      note: text(order.note) || undefined,
    },
    shipping: {
      method: text(detail.shippingStatus ?? shipments[0]?.courierService) || undefined,
      trackingNo: text(shipments[0]?.trackingNumber, "No tracking number yet."),
      courier: text(shipments[0]?.courierCode ?? shipments[0]?.courierService) || undefined,
      estimate: text(shipments[0]?.estimate) || undefined,
    },
    payment: {
      status: text(detailPaymentMeta.label ?? paymentState.label ?? detail.paymentStatus, "Needs review"),
      method: readPaymentMethodLabel(detail, paymentSummary, "No payment method available."),
      proof: text(object(paymentSummary.proof).proofImageUrl ?? object(paymentSummary.proof).imageUrl, "No payment proof available."),
      paidAt: text(detail.paidAt ?? paymentSummary.paidAt) || null,
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
    internalNotes: text(detail.internalNotes) || null,
  };
}

const adaptPaymentRow = (value: unknown, index = 0) => {
  const suborder = object(value);
  const payment = object(suborder.payment ?? suborder.paymentSummary);
  const proof = object(payment.proof);
  const reviewActionability = object(payment.reviewActionability);
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
    canReview: Boolean(reviewActionability.canReview),
    reviewReason: text(reviewActionability.reason) || null,
    buyerNote: text(proof.note) || null,
  };
};

export function adaptSeller2026PaymentReview(value: unknown): Seller2026PaymentReviewViewModel {
  const payload = readPayload(value);
  const governanceSource = object(payload.governance);
  const items = readItems(value);
  const payments = items.map(adaptPaymentRow);
  const selected = payments[0] || null;
  const governance = {
    canView: governanceSource.canView !== false,
    canReview: Boolean(governanceSource.canReview),
    roleCode: text(governanceSource.roleCode) || undefined,
    note: text(governanceSource.note) || undefined,
  };
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
            { label: "Review eligibility", value: selected.canReview ? "Ready for review" : selected.reviewReason || "Not reviewable" },
          ],
          riskChecks: [
            { label: "Nominal check", status: selected.amount > 0 ? "pass" : "unknown" },
            { label: "Payment proof", status: selected.proofUrl ? "pass" : "unknown" },
            { label: "Review actionability", status: selected.canReview ? "pass" : "warning" },
          ],
          timeline: [{ label: "Payment submitted", actor: "Customer", createdAt: selected.receivedAt }],
        }
      : null,
    governance,
  };
}

export function adaptSeller2026PaymentProfile(value: unknown): Seller2026PaymentProfileViewModel {
  const profile = readPayload(value);
  const active = object(profile.activeSnapshot);
  const activeSource = Object.keys(active).length ? active : profile;
  const pending = object(profile.pendingRequest);
  const governance = object(profile.governance);
  const readModel = object(profile.readModel);
  const requestStatusSource = object(profile.requestStatus ?? object(readModel).requestState);
  const requestDraft = object(profile.requestDraft);
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
    requestStatus: {
      code: text(requestStatusSource.code, "DRAFT"),
      label: text(requestStatusSource.label, "Draft request"),
      description: text(requestStatusSource.description) || null,
      isSubmitted: Boolean(requestStatusSource.isSubmitted),
      isDraft: requestStatusSource.isDraft !== false,
    },
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
    requestDraft: {
      accountName: text(requestDraft.accountName ?? pending.accountName ?? activeSource.accountName),
      merchantName: text(requestDraft.merchantName ?? pending.merchantName ?? activeSource.merchantName),
      merchantId: text(requestDraft.merchantId ?? pending.merchantId ?? activeSource.merchantId),
      qrisImageUrl: text(requestDraft.qrisImageUrl ?? pending.qrisImageUrl ?? activeSource.qrisImageUrl),
      qrisPayload: text(requestDraft.qrisPayload ?? pending.qrisPayload ?? activeSource.qrisPayload),
      instructionText: text(requestDraft.instructionText ?? pending.instructionText ?? activeSource.instructionText),
      sellerNote: text(requestDraft.sellerNote ?? pending.sellerNote),
    },
    governance: {
      canEdit: Boolean(governance.canEdit),
      permissionCanEdit: Boolean(governance.permissionCanEdit ?? governance.canEdit),
      isReviewLocked: Boolean(governance.isReviewLocked),
      mode: text(governance.mode, "READ_ONLY_SNAPSHOT"),
      note: text(governance.note) || null,
      editableFields: array(governance.editableFields).map((item) => text(item)).filter(Boolean),
    },
  };
}

export const emptySeller2026Orders: Seller2026OrdersViewModel = {
  summary: { total: 0, pending: 0, unpaid: 0, paymentPending: 0, pendingConfirmation: 0, processing: 0, packed: 0, shipped: 0, delivered: 0, cancelled: 0, needsAttention: 0 },
  suborders: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
};

export const emptySeller2026SuborderDetail: Seller2026SuborderDetailViewModel = {
  suborder: null,
  customer: null,
  shipping: null,
  payment: { status: "Needs review", method: "No payment method available.", proof: "No payment proof available.", paidAt: null },
  items: [],
  totals: { subtotal: 0, shippingFee: 0, serviceFee: 0, discount: 0, total: 0 },
  timeline: [],
  internalNotes: null,
};

export const emptySeller2026PaymentReview: Seller2026PaymentReviewViewModel = {
  summary: { totalPending: 0, totalAmount: 0, approvedToday: 0, rejectedToday: 0 },
  payments: [],
  selectedPayment: null,
  governance: { canView: false, canReview: false },
};

export const emptySeller2026PaymentProfile: Seller2026PaymentProfileViewModel = {
  status: "INACTIVE",
  requestStatus: { code: "INACTIVE", label: "Inactive", description: null, isSubmitted: false, isDraft: false },
  methods: [],
  payoutAccount: null,
  balances: { available: 0, hold: 0 },
  documents: [],
  timeline: [],
  requestDraft: {
    accountName: "",
    merchantName: "",
    merchantId: "",
    qrisImageUrl: "",
    qrisPayload: "",
    instructionText: "",
    sellerNote: "",
  },
  governance: {
    canEdit: false,
    permissionCanEdit: false,
    isReviewLocked: false,
    mode: "READ_ONLY_SNAPSHOT",
    note: null,
    editableFields: [],
  },
};
