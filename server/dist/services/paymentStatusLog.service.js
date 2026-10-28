import { PaymentStatusLog } from "../models/index.js";
import { logOperationalAuditEvent } from "./operationalAudit.service.js";
const normalizeStatus = (value) => {
    const normalized = String(value || "").trim().toUpperCase();
    return normalized || null;
};
export const appendPaymentStatusLog = async (input, transaction) => {
    const paymentId = Number(input.paymentId || 0);
    const newStatus = normalizeStatus(input.newStatus);
    if (!paymentId || !newStatus) {
        throw new Error("Invalid payment status log payload.");
    }
    await PaymentStatusLog.create({
        paymentId,
        oldStatus: normalizeStatus(input.oldStatus),
        newStatus,
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        note: input.note ? String(input.note).trim() || null : null,
    }, transaction ? { transaction } : undefined);
    const logTransition = () => logOperationalAuditEvent("payment.status.transition", {
        paymentId,
        oldStatus: normalizeStatus(input.oldStatus) || "NONE",
        newStatus,
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        traceId: input.traceId ?? null,
    });
    if (transaction?.afterCommit) {
        transaction.afterCommit(logTransition);
    }
    else {
        logTransition();
    }
};
