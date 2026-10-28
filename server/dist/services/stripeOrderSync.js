import { Op } from "sequelize";
import { Order, sequelize } from "../models/index.js";
import { getStripeSessionInvoiceNo, getStripeSessionOrderId, isStripeCheckoutSessionPaid, } from "./stripeCheckout.js";
import { logOperationalAuditEvent } from "./operationalAudit.service.js";
const getAttr = (row, key) => row?.getDataValue?.(key) ??
    row?.get?.(key) ??
    row?.dataValues?.[key] ??
    undefined;
export const syncStoreOrderFromStripeSession = async (input) => {
    const invoiceNo = getStripeSessionInvoiceNo(input.session);
    const orderId = getStripeSessionOrderId(input.session);
    const sessionId = String(input.session?.id || "").trim() || null;
    if (!invoiceNo) {
        return {
            ok: false,
            reason: "missing_invoice_no",
            invoiceNo: null,
            orderId,
            sessionId,
            updated: false,
            paid: false,
        };
    }
    return sequelize.transaction(async (transaction) => {
        const where = { invoiceNo };
        if (orderId) {
            where.id = orderId;
        }
        const order = await Order.findOne({
            where: where,
            attributes: ["id", "invoiceNo", "paymentMethod", "paymentStatus", "status"],
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!order) {
            return {
                ok: false,
                reason: "order_not_found",
                invoiceNo,
                orderId,
                sessionId,
                updated: false,
                paid: false,
            };
        }
        const paymentMethod = String(getAttr(order, "paymentMethod") || "").toUpperCase().trim();
        if (paymentMethod !== "STRIPE") {
            return {
                ok: false,
                reason: "payment_method_mismatch",
                invoiceNo,
                orderId: Number(getAttr(order, "id") || 0) || orderId,
                sessionId,
                updated: false,
                paid: false,
            };
        }
        const currentPaymentStatus = String(getAttr(order, "paymentStatus") || "UNPAID").toUpperCase().trim() || "UNPAID";
        const currentOrderStatus = String(getAttr(order, "status") || "pending").toLowerCase().trim() || "pending";
        const paid = isStripeCheckoutSessionPaid(input.session);
        if (!paid) {
            return {
                ok: true,
                invoiceNo,
                orderId: Number(getAttr(order, "id") || 0) || orderId,
                sessionId,
                updated: false,
                paid: false,
                paymentStatus: currentPaymentStatus,
                orderStatus: currentOrderStatus,
                alreadyFinalized: currentPaymentStatus === "PAID",
                source: input.source,
            };
        }
        const nextPaymentStatus = "PAID";
        const nextOrderStatus = currentOrderStatus === "pending" ? "processing" : currentOrderStatus;
        let updated = false;
        if (currentPaymentStatus !== nextPaymentStatus || currentOrderStatus !== nextOrderStatus) {
            const [affectedRows] = await Order.update({
                paymentStatus: nextPaymentStatus,
                status: nextOrderStatus,
            }, {
                where: {
                    id: Number(getAttr(order, "id") || 0),
                    [Op.or]: [
                        { paymentStatus: { [Op.ne]: nextPaymentStatus } },
                        { status: { [Op.ne]: nextOrderStatus } },
                    ],
                },
                transaction,
            });
            updated = Number(affectedRows || 0) > 0;
        }
        const syncResult = {
            ok: true,
            invoiceNo,
            orderId: Number(getAttr(order, "id") || 0) || orderId,
            sessionId,
            updated,
            paid: true,
            paymentStatus: nextPaymentStatus,
            orderStatus: nextOrderStatus,
            alreadyFinalized: !updated && currentPaymentStatus === nextPaymentStatus,
            source: input.source,
            traceId: input.traceId || null,
        };
        logOperationalAuditEvent("stripe.order.sync", {
            source: input.source,
            invoiceNo: syncResult.invoiceNo,
            orderId: syncResult.orderId,
            sessionId: syncResult.sessionId,
            paid: syncResult.paid,
            updated: syncResult.updated,
            alreadyFinalized: syncResult.alreadyFinalized,
            oldPaymentStatus: currentPaymentStatus,
            newPaymentStatus: nextPaymentStatus,
            oldOrderStatus: currentOrderStatus,
            newOrderStatus: nextOrderStatus,
            traceId: syncResult.traceId,
        });
        return syncResult;
    });
};
