export type DuitkuPaymentMethodCategory = "virtual_account" | "e_wallet" | "retail" | "qris";

export type DuitkuPaymentMethodOption = {
  code: string;
  label: string;
  category: DuitkuPaymentMethodCategory;
  sortOrder: number;
};

export const DUITKU_PAYMENT_METHOD_OPTIONS: DuitkuPaymentMethodOption[] = [
  { code: "BC", label: "BCA VA", category: "virtual_account", sortOrder: 10 },
  { code: "I1", label: "BNI VA", category: "virtual_account", sortOrder: 20 },
  { code: "BR", label: "BRI VA", category: "virtual_account", sortOrder: 30 },
  { code: "M2", label: "Mandiri VA H2H", category: "virtual_account", sortOrder: 40 },
  { code: "BT", label: "Permata VA", category: "virtual_account", sortOrder: 50 },
  { code: "B1", label: "CIMB Niaga VA", category: "virtual_account", sortOrder: 60 },
  { code: "BV", label: "BSI VA", category: "virtual_account", sortOrder: 70 },
  { code: "DA", label: "DANA", category: "e_wallet", sortOrder: 110 },
  { code: "OV", label: "OVO", category: "e_wallet", sortOrder: 120 },
  { code: "IR", label: "Indomaret", category: "retail", sortOrder: 210 },
  { code: "FT", label: "Retail", category: "retail", sortOrder: 220 },
  { code: "SP", label: "QRIS ShopeePay", category: "qris", sortOrder: 310 },
  { code: "NQ", label: "QRIS Nobu", category: "qris", sortOrder: 320 },
  { code: "GQ", label: "QRIS Gudang Voucher", category: "qris", sortOrder: 330 },
];

const METHOD_CODES = new Set(DUITKU_PAYMENT_METHOD_OPTIONS.map((option) => option.code));

export const normalizeDuitkuPaymentMethodCode = (value: unknown) => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return normalized || null;
};

export const isSupportedDuitkuPaymentMethodCode = (value: unknown) => {
  const code = normalizeDuitkuPaymentMethodCode(value);
  return Boolean(code && METHOD_CODES.has(code));
};

export const requireSupportedDuitkuPaymentMethodCode = (value: unknown) => {
  const code = normalizeDuitkuPaymentMethodCode(value);
  if (!code || !METHOD_CODES.has(code)) {
    const supported = DUITKU_PAYMENT_METHOD_OPTIONS.map((option) => option.code).join(", ");
    const error = new Error(`Unsupported Duitku payment method. Supported codes: ${supported}.`);
    (error as any).statusCode = 400;
    (error as any).code = "DUITKU_PAYMENT_METHOD_UNSUPPORTED";
    throw error;
  }
  return code;
};
