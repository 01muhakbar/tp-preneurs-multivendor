export type WithdrawalEligibilityCode =
  | "NOT_PAID"
  | "WAITING_DELIVERY"
  | "PARTIAL"
  | "ELIGIBLE"
  | "BLOCKED";

type BuildWithdrawalEligibilityInput = {
  paymentStatus?: unknown;
  fulfillmentStatus?: unknown;
  orderStatus?: unknown;
  totalAmount?: unknown;
  serviceFeeAmount?: unknown;
};

const toUpper = (value: unknown, fallback = "") =>
  String(value || fallback)
    .trim()
    .toUpperCase();

const toLower = (value: unknown, fallback = "") =>
  String(value || fallback)
    .trim()
    .toLowerCase();

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildMeta = (
  code: WithdrawalEligibilityCode,
  label: string,
  description: string,
  tone: "green" | "amber" | "red" | "slate",
  input: BuildWithdrawalEligibilityInput
) => {
  const grossAmount = toNumber(input.totalAmount);
  const serviceFeeAmount = toNumber(input.serviceFeeAmount);
  const netAmount = code === "ELIGIBLE" ? Math.max(0, grossAmount - serviceFeeAmount) : 0;

  return {
    code,
    label,
    description,
    tone,
    isEligible: code === "ELIGIBLE",
    basis: ["SUBORDER.paymentStatus = PAID", "SUBORDER.fulfillmentStatus = DELIVERED"],
    grossAmount,
    serviceFeeAmount,
    netAmount,
  };
};

export const buildWithdrawalEligibilityMeta = (input: BuildWithdrawalEligibilityInput) => {
  const paymentStatus = toUpper(input.paymentStatus, "UNPAID");
  const fulfillmentStatus = toUpper(input.fulfillmentStatus, "UNFULFILLED");
  const orderStatus = toLower(input.orderStatus, "pending");

  if (
    orderStatus === "cancelled" ||
    fulfillmentStatus === "CANCELLED" ||
    ["FAILED", "EXPIRED", "CANCELLED", "REJECTED"].includes(paymentStatus)
  ) {
    return buildMeta(
      "BLOCKED",
      "Not eligible",
      "This order cannot increase seller available balance because it is cancelled, failed, expired, or rejected.",
      "red",
      input
    );
  }

  if (paymentStatus !== "PAID") {
    return buildMeta(
      "NOT_PAID",
      "Not paid",
      "Seller available balance will not increase until buyer payment is marked Paid.",
      "slate",
      input
    );
  }

  if (fulfillmentStatus !== "DELIVERED") {
    return buildMeta(
      "WAITING_DELIVERY",
      "Paid, waiting delivery",
      "Payment is paid, but seller available balance increases only after Order Status is Delivered.",
      "amber",
      input
    );
  }

  return buildMeta(
    "ELIGIBLE",
    "Delivered, available for withdrawal",
    "This paid and delivered order can increase seller available balance.",
    "green",
    input
  );
};

export const summarizeWithdrawalEligibility = (items: ReturnType<typeof buildWithdrawalEligibilityMeta>[]) => {
  const totalItems = items.length;
  const eligibleItems = items.filter((item) => item.code === "ELIGIBLE");
  const waitingDeliveryItems = items.filter((item) => item.code === "WAITING_DELIVERY");
  const notPaidItems = items.filter((item) => item.code === "NOT_PAID");
  const blockedItems = items.filter((item) => item.code === "BLOCKED");
  const eligibleNetAmount = eligibleItems.reduce((sum, item) => sum + toNumber(item.netAmount), 0);

  if (totalItems === 0) {
    return {
      code: "NOT_PAID",
      label: "No suborders",
      description: "No seller suborders are available for withdrawal eligibility.",
      tone: "slate",
      isEligible: false,
      totalItems,
      eligibleCount: 0,
      waitingDeliveryCount: 0,
      notPaidCount: 0,
      blockedCount: 0,
      eligibleNetAmount: 0,
    };
  }

  if (eligibleItems.length === totalItems) {
    return {
      code: "ELIGIBLE",
      label: "Delivered, available for withdrawal",
      description: "All paid suborders in this order are delivered and can increase seller available balance.",
      tone: "green",
      isEligible: true,
      totalItems,
      eligibleCount: eligibleItems.length,
      waitingDeliveryCount: 0,
      notPaidCount: 0,
      blockedCount: blockedItems.length,
      eligibleNetAmount,
    };
  }

  if (eligibleItems.length > 0) {
    return {
      code: "PARTIAL",
      label: "Partially available",
      description: "Some paid and delivered suborders can increase seller available balance.",
      tone: "amber",
      isEligible: true,
      totalItems,
      eligibleCount: eligibleItems.length,
      waitingDeliveryCount: waitingDeliveryItems.length,
      notPaidCount: notPaidItems.length,
      blockedCount: blockedItems.length,
      eligibleNetAmount,
    };
  }

  if (waitingDeliveryItems.length > 0) {
    return {
      code: "WAITING_DELIVERY",
      label: "Paid, waiting delivery",
      description: "Payment is paid, but available balance increases only after Order Status is Delivered.",
      tone: "amber",
      isEligible: false,
      totalItems,
      eligibleCount: 0,
      waitingDeliveryCount: waitingDeliveryItems.length,
      notPaidCount: notPaidItems.length,
      blockedCount: blockedItems.length,
      eligibleNetAmount: 0,
    };
  }

  return {
    code: blockedItems.length > 0 ? "BLOCKED" : "NOT_PAID",
    label: blockedItems.length > 0 ? "Not eligible" : "Not paid",
    description:
      blockedItems.length > 0
        ? "This order cannot increase seller available balance."
        : "Seller available balance will not increase until buyer payment is marked Paid.",
    tone: blockedItems.length > 0 ? "red" : "slate",
    isEligible: false,
    totalItems,
    eligibleCount: 0,
    waitingDeliveryCount: waitingDeliveryItems.length,
    notPaidCount: notPaidItems.length,
    blockedCount: blockedItems.length,
    eligibleNetAmount: 0,
  };
};
