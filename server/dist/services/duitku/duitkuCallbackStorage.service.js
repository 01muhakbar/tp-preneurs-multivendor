import { OrderPaymentAttempt, DuitkuCallbackInbox, OrderPaymentSecurityEvent } from "../../models/index.js";
import { sha256Hex } from "./duitkuCallbackParser.service.js";
const truncate = (value, length) => {
    const text = String(value ?? "");
    return text ? text.slice(0, length) : null;
};
const hashOptional = (value) => {
    const text = String(value ?? "");
    return text ? sha256Hex(text) : null;
};
export const storeValidDuitkuCallback = async (parsed, _context = {}) => {
    const existing = await DuitkuCallbackInbox.findOne({
        where: { occurrenceKey: parsed.occurrenceKey },
    });
    if (existing) {
        await existing.update({
            duplicateCount: Number(existing.duplicateCount ?? 0) + 1,
            lastReceivedAt: new Date(),
        });
        return {
            inbox: existing,
            duplicate: true,
            bindingState: existing.bindingState,
            processingResult: existing.processingResult,
        };
    }
    const attempts = await OrderPaymentAttempt.findAll({
        where: {
            provider: "DUITKU",
            merchantOrderId: parsed.fields.merchantOrderId,
        },
        limit: 2,
    });
    const paymentAttempt = attempts.length === 1 ? attempts[0] : null;
    const bindingState = attempts.length === 1 ? "BOUND" : attempts.length > 1 ? "AMBIGUOUS" : "UNBOUND";
    const now = new Date();
    const inbox = await DuitkuCallbackInbox.create({
        paymentAttemptId: paymentAttempt ? Number(paymentAttempt.id) : null,
        merchantCodeRaw: truncate(parsed.fields.merchantCode, 64),
        merchantOrderIdRaw: truncate(parsed.fields.merchantOrderId, 128),
        providerReferenceRaw: truncate(parsed.fields.reference, 192),
        paymentCodeRaw: truncate(parsed.fields.paymentCode, 40),
        amountRaw: truncate(parsed.fields.amount, 64),
        resultCodeRaw: truncate(parsed.fields.resultCode, 40),
        signatureState: "VALID",
        bindingState,
        processingResult: "QUARANTINED",
        quarantineReason: bindingState === "BOUND"
            ? "STEP5_NO_FINANCIAL_MUTATION"
            : bindingState === "AMBIGUOUS"
                ? "AMBIGUOUS_MERCHANT_ORDER_ID"
                : "UNKNOWN_MERCHANT_ORDER_ID",
        occurrenceKey: parsed.occurrenceKey,
        eventHash: parsed.eventHash,
        rawBodyDigest: parsed.rawBodyDigest,
        fieldValuesDigest: parsed.fieldValuesDigest,
        duplicateCount: 0,
        firstReceivedAt: now,
        lastReceivedAt: now,
    });
    return {
        inbox,
        duplicate: false,
        bindingState,
        processingResult: "QUARANTINED",
    };
};
export const storeDuitkuCallbackSecurityEvent = async (input) => {
    const fields = input.fields || {};
    return OrderPaymentSecurityEvent.create({
        eventType: input.eventType,
        merchantCodePrefix: truncate(fields.merchantCode, 64),
        merchantOrderIdPrefix: truncate(fields.merchantOrderId, 128),
        providerReferencePrefix: truncate(fields.reference, 192),
        amountPrefix: truncate(fields.amount, 64),
        resultCodePrefix: truncate(fields.resultCode, 40),
        signatureState: input.signatureState || "NOT_CHECKED",
        rawBodyDigest: input.rawBodyDigest || null,
        fieldValuesDigest: input.fieldValuesDigest || null,
        sourceIpHash: hashOptional(input.context?.sourceIp),
        userAgentHash: hashOptional(input.context?.userAgent),
        receivedAt: new Date(),
    });
};
