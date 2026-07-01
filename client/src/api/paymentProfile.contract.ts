export const PAYMENT_PROFILE_PROVIDER_CODE = "MANUAL_QRIS" as const;
export const PAYMENT_PROFILE_PAYMENT_TYPE = "QRIS_STATIC" as const;
export const PAYMENT_PROFILE_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const PAYMENT_PROFILE_IMAGE_TYPES = ["image/png", "image/jpeg"] as const;

export const PAYMENT_PROFILE_LIMITS = {
  accountName: 160,
  merchantName: 160,
  merchantId: 160,
  qrisImageUrl: 2_000_000,
  qrisPayload: 2_000_000,
  instructionText: 4_000,
  sellerNote: 4_000,
} as const;

export type PaymentProfileDraft = {
  accountName: string;
  merchantName: string;
  merchantId: string;
  qrisImageUrl: string;
  qrisPayload: string;
  instructionText: string;
  sellerNote: string;
};

export const EMPTY_PAYMENT_PROFILE_DRAFT: PaymentProfileDraft = {
  accountName: "",
  merchantName: "",
  merchantId: "",
  qrisImageUrl: "",
  qrisPayload: "",
  instructionText: "",
  sellerNote: "",
};

const text = (value: unknown) => String(value ?? "").trim();
const textOrNull = (value: unknown) => text(value) || null;

export const buildPaymentProfilePayload = (form: PaymentProfileDraft) => ({
  accountName: text(form.accountName),
  merchantName: text(form.merchantName),
  merchantId: textOrNull(form.merchantId),
  qrisImageUrl: text(form.qrisImageUrl),
  qrisPayload: textOrNull(form.qrisPayload),
  instructionText: textOrNull(form.instructionText),
  sellerNote: textOrNull(form.sellerNote),
});

export const validatePaymentProfileDraft = (form: PaymentProfileDraft) => {
  const errors: Partial<Record<keyof PaymentProfileDraft, string>> = {};
  const required: Array<[keyof PaymentProfileDraft, string]> = [
    ["accountName", "Account name"],
    ["merchantName", "Merchant name"],
    ["qrisImageUrl", "QRIS image"],
  ];

  required.forEach(([key, label]) => {
    if (!text(form[key])) errors[key] = `${label} is required.`;
  });

  (Object.keys(PAYMENT_PROFILE_LIMITS) as Array<keyof PaymentProfileDraft>).forEach((key) => {
    const limit = PAYMENT_PROFILE_LIMITS[key];
    if (text(form[key]).length > limit) {
      errors[key] = `${key} must be ${limit.toLocaleString("en-US")} characters or fewer.`;
    }
  });

  return errors;
};

export const validatePaymentProfileImage = (file: File) => {
  if (!(PAYMENT_PROFILE_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Upload a PNG or JPEG QRIS image.";
  }
  if (file.size > PAYMENT_PROFILE_MAX_IMAGE_BYTES) {
    return "QRIS image must be 5MB or smaller.";
  }
  return null;
};
