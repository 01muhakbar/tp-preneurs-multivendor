import { createHash } from "node:crypto";
const SENSITIVE_KEY_PATTERN = /(address|phone|email|name|secret|token|password|payload|qris)/i;
const normalizeAuditValue = (value) => {
    if (value === null || value === undefined)
        return null;
    if (typeof value === "number" || typeof value === "boolean")
        return value;
    const normalized = String(value).trim();
    return normalized || null;
};
export const fingerprintAuditValue = (value) => {
    const normalized = String(value || "").trim();
    if (!normalized)
        return null;
    return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
};
export const getRequestTraceId = (req) => {
    const requestTraceId = String(req?.requestId || req?.correlationId || "").trim();
    if (requestTraceId)
        return requestTraceId;
    const headerTraceId = String(req?.get?.("X-Request-Id") || req?.get?.("X-Correlation-Id") || "").trim();
    return headerTraceId || null;
};
export const appendAuditNote = (baseNote, meta = {}) => {
    const entries = Object.entries(meta)
        .filter(([key]) => !SENSITIVE_KEY_PATTERN.test(key))
        .map(([key, value]) => [key, normalizeAuditValue(value)])
        .filter((entry) => entry[1] !== null)
        .map(([key, value]) => `${key}=${String(value).replace(/[;\n\r]/g, " ").slice(0, 120)}`);
    const base = String(baseNote || "").trim();
    if (entries.length === 0)
        return base || null;
    return `${base || "Audit event."} [audit ${entries.join("; ")}]`;
};
export const logOperationalAuditEvent = (event, meta = {}) => {
    const safeMeta = Object.fromEntries(Object.entries(meta)
        .filter(([key]) => !SENSITIVE_KEY_PATTERN.test(key))
        .map(([key, value]) => [key, normalizeAuditValue(value)])
        .filter((entry) => entry[1] !== null));
    console.info(`[operational-audit] ${event}`, safeMeta);
};
