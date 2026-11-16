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
  isIndo = false,
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
        isIndo
          ? "Jika email terdaftar, kami telah mengirimkan tautan untuk mengatur ulang kata sandi."
          : "We'll email you if the address is registered."
      ),
      privacySuccessMessage: isIndo
        ? "Tautan pemulihan dikirimkan dengan aman ke email Anda."
        : "A recovery link has been safely sent to your email address.",
      privacyNote: isIndo
        ? "Data Anda terlindungi. Tautan pemulihan dikirim secara aman."
        : "Your data is protected. Reset links are sent safely.",
      isSubmitting: Boolean(status.isSubmitting),
      hasSubmitted: success,
      sent: success,
      success,
      cooldownSeconds: Number(status.cooldownSeconds || 0),
      submitLabel:
        status.submitLabel ||
        (status.isSubmitting
          ? isIndo
            ? "Mengirim tautan..."
            : "Sending..."
          : isIndo
            ? "Kirim tautan pemulihan"
            : "Send reset link"),
      canSubmit: status.canSubmit !== false && !status.isSubmitting,
    },
    errors: {
      email: emailError,
    },
    isIndo,
  };
};
