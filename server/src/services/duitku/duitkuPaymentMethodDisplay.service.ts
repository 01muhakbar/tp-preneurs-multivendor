const DUITKU_PAYMENT_METHOD_LABELS: Record<string, string> = {
  VC: "Credit Card",
  BC: "BCA VA",
  M2: "Mandiri VA H2H",
  I1: "BNI VA",
  BR: "BRI VA",
  BT: "Permata VA",
  B1: "CIMB Niaga VA",
  VA: "Maybank VA",
  NC: "BNC VA",
  A1: "ATM Bersama VA",
  AG: "Artha Graha VA",
  S1: "Sampoerna VA",
  BV: "BSI VA",
  DM: "Danamon VA",
  OV: "OVO",
  SA: "ShopeePay Apps",
  LF: "LinkAja Apps",
  DA: "DANA",
  SP: "ShopeePay QRIS",
  LA: "LinkAja QRIS",
  NQ: "Nobu QRIS",
  GQ: "Gudang Voucher QRIS",
  FT: "Retail",
  IR: "Indomaret",
  JP: "Jenius Pay",
};

export const normalizeDuitkuPaymentCode = (value: unknown) => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
  return normalized ? normalized.slice(0, 40) : null;
};

export const getDuitkuPaymentMethodLabel = (paymentCode: unknown) => {
  const code = normalizeDuitkuPaymentCode(paymentCode);
  if (!code) return null;
  return DUITKU_PAYMENT_METHOD_LABELS[code] || `Duitku ${code}`;
};

export const resolveDuitkuPaymentMethodDisplay = (input: {
  paymentMethod?: unknown;
  paymentCode?: unknown;
  fallback?: string;
}) => {
  const method = String(input.paymentMethod ?? "").trim().toUpperCase();
  if (method !== "DUITKU") {
    return String(input.paymentMethod ?? input.fallback ?? "").trim() || null;
  }

  const label = getDuitkuPaymentMethodLabel(input.paymentCode);
  return label ? `Duitku - ${label}` : input.fallback || "Duitku POP";
};
