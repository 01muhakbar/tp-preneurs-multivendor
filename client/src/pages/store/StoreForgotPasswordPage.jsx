import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { forgotPasswordSchema } from "@ecommerce/schemas";
import { requestClientPasswordReset } from "../../api/storeAuth.ts";
import { getRetryAfterSeconds } from "../../utils/authRateLimit.js";
import {
  FORGOT_PASSWORD_GENERIC_MESSAGE,
  buildCooldownButtonLabel,
  buildRetryAfterMessage,
} from "../../utils/authUi.js";
import StoreForgotPassword2026View from "./forgotPassword2026/StoreForgotPassword2026View.jsx";
import { createStoreForgotPassword2026ViewModel } from "./forgotPassword2026/storeForgotPassword2026Adapter.js";

const toFieldErrors = (error) => {
  const flattened =
    error?.flatten?.()?.fieldErrors ||
    error?.response?.data?.errors?.fieldErrors ||
    error?.fieldErrors ||
    {};
  return flattened && typeof flattened === "object" ? flattened : {};
};

const firstFieldError = (fieldErrors, key) =>
  Array.isArray(fieldErrors?.[key]) && fieldErrors[key].length > 0 ? fieldErrors[key][0] : "";

export default function StoreForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(
    () => i18n?.language || localStorage.getItem("i18nextLng") || "en"
  );

  useEffect(() => {
    const handleLanguageChanged = (lang) => {
      setCurrentLang(lang || "en");
    };
    i18n?.on?.("languageChanged", handleLanguageChanged);
    const handleCustomChange = () => {
      setCurrentLang(i18n?.language || "en");
    };
    window.addEventListener("store_language_changed", handleCustomChange);
    return () => {
      i18n?.off?.("languageChanged", handleLanguageChanged);
      window.removeEventListener("store_language_changed", handleCustomChange);
    };
  }, [i18n]);

  const isIndo =
    currentLang === "id" ||
    currentLang === "id-ID" ||
    (typeof currentLang === "string" && currentLang.startsWith("id"));

  const startedAtRef = useRef(Date.now());
  const emailRef = useRef(null);
  const statusRef = useRef(null);
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("neutral");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setCooldownSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (firstFieldError(fieldErrors, "email") && emailRef.current) {
      emailRef.current.focus();
    }
  }, [fieldErrors]);

  useEffect(() => {
    if (statusMessage && statusRef.current) {
      statusRef.current.focus();
    }
  }, [statusMessage]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setStatusMessage("");
    setStatusTone("neutral");

    const payload = {
      email,
      honeypot,
      startedAt: startedAtRef.current,
    };
    const parsed = forgotPasswordSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestClientPasswordReset(parsed.data);
      const fallbackSuccess = isIndo
        ? "Jika email terdaftar, kami telah mengirimkan tautan untuk mengatur ulang kata sandi."
        : FORGOT_PASSWORD_GENERIC_MESSAGE;
      setStatusMessage(result?.message || t("forgotPassword.successMessage") || fallbackSuccess);
      setStatusTone("success");
    } catch (error) {
      setFieldErrors(toFieldErrors(error));
      const retryAfterSeconds = getRetryAfterSeconds(error);
      const fallbackError = isIndo
        ? "Tidak dapat memproses permintaan saat ini. Silakan coba lagi nanti."
        : "We couldn't process that request right now.";
      const fallbackRateLimit = isIndo
        ? `Terlalu banyak percobaan. Coba lagi dalam ${retryAfterSeconds} detik.`
        : buildRetryAfterMessage(retryAfterSeconds);

      setStatusMessage(
        error?.response?.status === 429 && retryAfterSeconds > 0
          ? fallbackRateLimit
          : error?.response?.data?.message || t("forgotPassword.errorMessage") || fallbackError
      );
      setStatusTone("error");
      if (retryAfterSeconds > 0) {
        setCooldownSeconds(retryAfterSeconds);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmitLabel = () => {
    if (isSubmitting) {
      return t("forgotPassword.sending") || (isIndo ? "Mengirim tautan..." : "Sending link...");
    }
    if (cooldownSeconds > 0) {
      return isIndo
        ? `Coba lagi dalam ${cooldownSeconds} dtk`
        : buildCooldownButtonLabel(cooldownSeconds, "Send reset link");
    }
    return t("forgotPassword.sendResetLink") || (isIndo ? "Kirim tautan pemulihan" : "Send reset link");
  };

  const viewModel = createStoreForgotPassword2026ViewModel({
    form: {
      email,
      honeypot,
    },
    status: {
      message: statusMessage,
      tone: statusTone,
      isSubmitting,
      cooldownSeconds,
      submitLabel: getSubmitLabel(),
      canSubmit: cooldownSeconds <= 0,
      errors: fieldErrors,
    },
    locationState: location.state,
    isIndo,
  });

  return (
    <StoreForgotPassword2026View
      viewModel={viewModel}
      isIndo={isIndo}
      emailRef={emailRef}
      statusRef={statusRef}
      onEmailChange={setEmail}
      onHoneypotChange={setHoneypot}
      onSubmit={handleSubmit}
      onBackToSignIn={() => navigate("/auth/login")}
    />
  );
}
