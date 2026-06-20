const pickString = (...values) => {
  const found = values.find((value) => typeof value === "string" && value.trim());
  return found ? found.trim() : "";
};

const firstError = (errors, key) => {
  const value = errors?.[key];
  if (Array.isArray(value)) return pickString(...value);
  return pickString(value);
};

export const getPasswordStrength = (password = "") => {
  const value = String(password || "");
  const checks = [
    value.length >= 8,
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ];
  const passed = checks.filter(Boolean).length;
  const score = value ? Math.min(4, Math.max(1, passed)) : 0;
  const label = ["", "Weak", "Fair", "Good", "Strong"][score] || "Weak";
  const tone = score >= 4 ? "strong" : score >= 3 ? "good" : score >= 2 ? "fair" : "weak";

  return {
    score,
    label,
    tone,
    percent: score * 25,
    segments: Array.from({ length: 4 }, (_, index) => index < score),
    helper: "Use at least 8 characters, including at least 1 letter and 1 number.",
  };
};

export const createStoreRegister2026ViewModel = ({
  form = {},
  status = {},
  mode = "register",
  otp = {},
} = {}) => {
  const errors = status.errors || {};
  const phoneNumber = pickString(form.phoneNumber, form.phone, form.whatsapp);
  const name = pickString(form.name, form.fullName);
  const termsAccepted = Boolean(form.termsAccepted ?? form.acceptTerms);
  const passwordStrength = getPasswordStrength(form.password);

  return {
    mode,
    form: {
      name,
      fullName: name,
      email: String(form.email || ""),
      phoneNumber,
      phone: phoneNumber,
      whatsapp: phoneNumber,
      password: String(form.password || ""),
      passwordConfirm: String(form.passwordConfirm || form.confirm || ""),
      confirm: String(form.passwordConfirm || form.confirm || ""),
      termsAccepted,
      acceptTerms: termsAccepted,
      honeypot: String(form.honeypot || ""),
      showPassword: Boolean(form.showPassword),
      showPasswordConfirm: Boolean(form.showPasswordConfirm),
    },
    status: {
      message: pickString(status.message),
      tone: status.tone || "neutral",
      isSubmitting: Boolean(status.isSubmitting),
      isVerifying: Boolean(status.isVerifying),
      isResending: Boolean(status.isResending),
      countdown: Number(status.countdown || 0),
      canSubmitOtp: status.canSubmitOtp !== false,
      deliveryFailed: Boolean(status.deliveryFailed),
      submitLabel: status.submitLabel || "Create account",
      verifyLabel: status.verifyLabel || "Verify email",
      resendLabel: status.resendLabel || "Resend code",
      passwordConfirmHelper:
        status.passwordConfirmHelper || "Repeat the same password to continue.",
    },
    otp: {
      code: String(otp.code || otp.otp || ""),
      destinationMasked: pickString(otp.destinationMasked, otp.destination, otp.email),
      channel: String(otp.channel || "EMAIL").toUpperCase(),
      expiresInSeconds: Number(otp.expiresInSeconds || 0),
    },
    errors: {
      name: firstError(errors, "name") || firstError(errors, "fullName"),
      email: firstError(errors, "email"),
      phoneNumber:
        firstError(errors, "phoneNumber") ||
        firstError(errors, "phone") ||
        firstError(errors, "whatsapp"),
      password: firstError(errors, "password"),
      passwordConfirm:
        firstError(errors, "passwordConfirm") ||
        firstError(errors, "confirm") ||
        firstError(errors, "confirmPassword"),
      termsAccepted:
        firstError(errors, "termsAccepted") ||
        firstError(errors, "acceptTerms") ||
        firstError(errors, "terms"),
      otpCode: firstError(errors, "otpCode") || firstError(errors, "otp"),
    },
    passwordStrength,
  };
};

