const SENSITIVE_KEY_PATTERN =
  /api.?key|merchant.?key|secret|password|signature|authorization|token/i;
const SENSITIVE_URL_KEY_PATTERN = /paymentUrl|payment_url|redirectUrl|redirect_url/i;

export const redactDuitkuValue = (key: string, value: unknown): unknown => {
  if (value == null) return value;
  if (SENSITIVE_KEY_PATTERN.test(key)) return "<redacted>";
  if (SENSITIVE_URL_KEY_PATTERN.test(key)) return "<redacted-url>";
  return value;
};

export const redactDuitkuPayload = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((entry) => redactDuitkuPayload(entry)) as T;
  }
  if (!value || typeof value !== "object") return value;

  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    output[key] = redactDuitkuValue(key, redactDuitkuPayload(entry));
  }
  return output as T;
};
