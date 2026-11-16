const toUpper = (value, fallback = "") => String(value || fallback)
    .trim()
    .toUpperCase();
const toLower = (value, fallback = "") => String(value || fallback)
    .trim()
    .toLowerCase();
const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};
const buildMeta = (code, label, description, tone, input) => {
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
export const buildWithdrawalEligibilityMeta = (input) => {
    const paymentStatus = toUpper(input.paymentStatus, "UNPAID");
    const fulfillmentStatus = toUpper(input.fulfillmentStatus, "UNFULFILLED");
    const orderStatus = toLower(input.orderStatus, "pending");
    if (orderStatus === "cancelled" ||
        fulfillmentStatus === "CANCELLED" ||
        ["FAILED", "EXPIRED", "CANCELLED", "REJECTED"].includes(paymentStatus)) {
        return buildMeta("BLOCKED", "Not eligible", "This order cannot increase seller available balance because it is cancelled, failed, expired, or rejected.", "red", input);
    }
    if (paymentStatus !== "PAID") {
        return buildMeta("NOT_PAID", "Not paid", "Seller available balance will not increase until buyer payment is marked Paid.", "slate", input);
    }
    const isDelivered = fulfillmentStatus === "DELIVERED" ||
        orderStatus === "delivered" ||
        orderStatus === "completed";
    if (!isDelivered) {
        return buildMeta("WAITING_DELIVERY", "Paid, waiting delivery", "Payment is paid, but seller available balance increases only after Order is Delivered and confirmed.", "amber", input);
    }
    // 1. If buyer explicitly confirmed receipt or order is marked completed
    const isCustomerConfirmed = Boolean(input.customerConfirmed || orderStatus === "completed");
    if (isCustomerConfirmed) {
        return buildMeta("ELIGIBLE", "Pesanan selesai & dikonfirmasi", "Pesanan telah dikonfirmasi diterima oleh pembeli. Saldo tersedia untuk ditarik.", "green", input);
    }
    // 2. If delivered, check if 7-day auto-release window has elapsed
    const deliveredDate = input.deliveredAt ? new Date(input.deliveredAt) : null;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const isAutoReleaseEligible = Boolean(deliveredDate &&
        !Number.isNaN(deliveredDate.getTime()) &&
        Date.now() - deliveredDate.getTime() >= SEVEN_DAYS_MS);
    if (isAutoReleaseEligible) {
        return buildMeta("ELIGIBLE", "Penyelesaian otomatis 7 hari", "Pesanan telah melewati batas waktu 7 hari sejak tiba tanpa pengajuan retur. Saldo otomatis tersedia untuk ditarik.", "green", input);
    }
    // 3. Otherwise, order arrived but awaiting customer confirmation or 7 days timeout
    return buildMeta("WAITING_DELIVERY", "Menunggu konfirmasi pembeli", "Pesanan telah tiba di tujuan. Saldo akan otomatis bertambah ke Saldo Tersedia setelah pembeli mengklik 'Pesanan Diterima' atau otomatis setelah 7 hari.", "amber", input);
};
export const summarizeWithdrawalEligibility = (items) => {
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
        description: blockedItems.length > 0
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
