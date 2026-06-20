const resolveRedirectNotice = (redirectState) => {
  const fromState = redirectState?.from;
  const fromPath =
    typeof fromState === "string"
      ? fromState
      : fromState && typeof fromState === "object"
        ? `${fromState.pathname || ""}${fromState.search || ""}${fromState.hash || ""}`
        : "";

  if (fromPath && fromPath !== "/auth/login") {
    if (fromPath.startsWith("/checkout")) {
      return "Sign in to continue your checkout securely.";
    }
    if (fromPath.startsWith("/user") || fromPath.startsWith("/account")) {
      return "Sign in to open your account dashboard.";
    }
    return "Sign in to continue where you left off.";
  }

  return "";
};

export function createStoreLogin2026ViewModel({
  form = {},
  status = {},
  submitting = false,
  redirectState = {},
} = {}) {
  return {
    form: {
      email: form.email || "",
      password: form.password || "",
      remember: Boolean(form.remember),
      showPassword: Boolean(form.showPassword),
    },
    status: {
      errorMessage: String(status.errorMessage || "").trim(),
      successMessage: String(status.successMessage || "").trim(),
      redirectNotice: resolveRedirectNotice(redirectState),
      helperMessage: String(status.helperMessage || "").trim(),
      cooldownSeconds: Math.max(0, Number(status.cooldownSeconds) || 0),
      submitLabel: status.submitLabel || "Sign in",
    },
    submitting: Boolean(submitting),
    disabled: Boolean(submitting) || Math.max(0, Number(status.cooldownSeconds) || 0) > 0,
  };
}
