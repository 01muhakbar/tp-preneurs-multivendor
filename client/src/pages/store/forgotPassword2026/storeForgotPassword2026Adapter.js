const pickString = (...values) => {
  const found = values.find((value) => typeof value === "string" && value.trim());
  return found ? found.trim() : "";
};

const firstError = (errors, key) => {
  const value = errors?.[key];
  if (Array.isArray(value)) return pickString(...value);
  return pickString(value);
};

export const createStoreForgotPassword2026ViewModel = ({
  form = {},
  status = {},
  locationState = {},
} = {}) => {
  const tone = status.tone || "neutral";
  const success =
    Boolean(status.success ?? status.sent ?? status.hasSubmitted) || tone === "success";
  const notice = pickString(
    status.message,
    status.successMessage,
    locationState?.message,
    locationState?.notice
  );
  const emailError = firstError(status.errors || status.fieldErrors, "email");

  return {
    form: {
      email: String(form.email || ""),
      honeypot: String(form.honeypot || ""),
    },
    status: {
      tone,
      message: notice,
      errorMessage: pickString(status.errorMessage, tone === "error" ? notice : ""),
      successMessage: pickString(
        status.successMessage,
        success ? notice : "",
        "We'll email you if the address is registered."
      ),
      privacySuccessMessage: "For privacy and security, we always return a generic response.",
      privacyNote: "Your privacy is important to us. We'll never share your email.",
      isSubmitting: Boolean(status.isSubmitting),
      hasSubmitted: success,
      sent: success,
      success,
      cooldownSeconds: Number(status.cooldownSeconds || 0),
      submitLabel: status.submitLabel || (status.isSubmitting ? "Sending..." : "Send reset link"),
      canSubmit: status.canSubmit !== false && !status.isSubmitting,
    },
    errors: {
      email: emailError,
    },
  };
};
