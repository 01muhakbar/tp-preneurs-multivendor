const resolveRedirectNotice = (redirectState, isIndo = false) => {
  const fromState = redirectState?.from;
  const fromPath =
    typeof fromState === "string"
      ? fromState
      : fromState && typeof fromState === "object"
        ? `${fromState.pathname || ""}${fromState.search || ""}${fromState.hash || ""}`
        : "";

  if (fromPath && fromPath !== "/auth/login") {
    if (fromPath.startsWith("/checkout")) {
      return isIndo
        ? "Masuk untuk melanjutkan proses checkout dengan aman."
        : "Sign in to continue your checkout securely.";
    }
    if (fromPath.startsWith("/user") || fromPath.startsWith("/account")) {
      return isIndo
        ? "Masuk untuk membuka dashboard akun Anda."
        : "Sign in to open your account dashboard.";
    }
    return isIndo
      ? "Masuk untuk melanjutkan aktivitas belanja Anda."
      : "Sign in to continue where you left off.";
  }

  return "";
};

export function createStoreLogin2026ViewModel({
  form = {},
  status = {},
  submitting = false,
  redirectState = {},
  isIndo = false,
} = {}) {
  return {
    form: {
      email: form.email || "",
      password: form.password || "",
      remember: Boolean(form.remember),
      showPassword: Boolean(form.showPassword),
    },
    status: {
      errorInfo: status.errorInfo || null,
      errorMessage: String(status.errorMessage || "").trim(),
      isInvalidCredentials: Boolean(status.isInvalidCredentials),
      noticeMessage: String(status.noticeMessage || "").trim(),
      successMessage: String(status.successMessage || "").trim(),
      redirectNotice: resolveRedirectNotice(redirectState, isIndo),
      helperMessage: "",
      cooldownSeconds: Math.max(0, Number(status.cooldownSeconds) || 0),
      submitLabel: status.submitLabel || (isIndo ? "Masuk" : "Sign in"),
    },
    submitting: Boolean(submitting),
    disabled: Boolean(submitting) || Math.max(0, Number(status.cooldownSeconds) || 0) > 0,
    isIndo,
  };
}
