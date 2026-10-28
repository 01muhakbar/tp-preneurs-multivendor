const SENSITIVE_KEY_PATTERN = /api.?key|merchant.?key|secret|password|signature|authorization|token/i;
const SENSITIVE_URL_KEY_PATTERN = /paymentUrl|payment_url|redirectUrl|redirect_url/i;
export const redactDuitkuValue = (key, value) => {
    if (value == null)
        return value;
    if (SENSITIVE_KEY_PATTERN.test(key))
        return "<redacted>";
    if (SENSITIVE_URL_KEY_PATTERN.test(key))
        return "<redacted-url>";
    return value;
};
export const redactDuitkuPayload = (value) => {
    if (Array.isArray(value)) {
        return value.map((entry) => redactDuitkuPayload(entry));
    }
    if (!value || typeof value !== "object")
        return value;
    const output = {};
    for (const [key, entry] of Object.entries(value)) {
        output[key] = redactDuitkuValue(key, redactDuitkuPayload(entry));
    }
    return output;
};
