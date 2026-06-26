import { normalizeSellerOrderDetailFor2026 } from "../../../../pages/seller2026/sellerOrderDetail2026Adapter.js";

export const normalizeDrawerOrderDetail = (detailData) => {
  if (!detailData) return null;

  // Utilize the robust existing adapter as the source of truth
  const base = normalizeSellerOrderDetailFor2026({ suborder: detailData });
  const rawSuborder = detailData.suborder || {};
  const isPaid = base.paymentStatus.code === "PAID";
  const fulfillmentStatus = base.status.code; // UNKNOWN, UNFULFILLED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  
  let primaryAction = null;
  
  if (base.status.code === "CANCELLED") {
    primaryAction = null;
  } else if (base.paymentStatus.code === "PENDING_CONFIRMATION") {
    primaryAction = {
      label: "Review Proof",
      action: "REVIEW_PAYMENT",
      disabled: false,
    };
  } else if (!isPaid && (fulfillmentStatus === "UNFULFILLED" || fulfillmentStatus === "UNKNOWN" || fulfillmentStatus === "NEW")) {
    primaryAction = {
      label: "Waiting Payment",
      action: null,
      disabled: true,
      reason: "Payment must be paid before fulfillment."
    };
  } else if (isPaid && (fulfillmentStatus === "UNFULFILLED" || fulfillmentStatus === "READY_TO_FULFILL" || fulfillmentStatus === "UNKNOWN" || fulfillmentStatus === "NEW")) {
    primaryAction = {
      label: "Mark as Packed",
      action: "MARK_PROCESSING",
      disabled: false,
    };
  } else if (fulfillmentStatus === "PROCESSING" || fulfillmentStatus === "PACKED") {
    primaryAction = {
      label: "Mark as Shipped",
      action: "MARK_SHIPPED",
      disabled: false,
    };
  } else if (fulfillmentStatus === "SHIPPED") {
    primaryAction = {
      label: "Mark as Delivered",
      action: "MARK_DELIVERED",
      disabled: !base.canMarkDelivered,
      reason: base.markDeliveredReason
    };
  }

  // Make the progress stepper safe
  const progress = base.progress || [];

  const clearVal = (val, defaults = []) => {
    const norm = (val || "").trim();
    if (!norm || norm === "PACKED" || norm === "READY_TO_FULFILL" || defaults.includes(norm)) return "";
    return norm;
  };

  const fulfillmentDraft = {
    trackingNumber: clearVal(base.shipping?.trackingNo, ["No tracking number yet.", "No tracking yet"]),
    shippingProvider: clearVal(base.shipping?.courier, ["Courier not assigned"]),
    courierService: clearVal(base.shipping?.method, ["Not set"]),
  };

  return {
    ...base,
    rawSuborder,
    note: rawSuborder.internalNote || rawSuborder.note || "",
    primaryAction,
    fulfillmentDraft
  };
};
