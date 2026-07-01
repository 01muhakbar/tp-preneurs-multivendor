import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  clientRegistrationSchema,
  clientRegistrationVerifySchema,
} from "@ecommerce/schemas";
import { useAccountAuth } from "../../auth/authDomainHooks.js";
import { useCart } from "../../hooks/useCart.ts";
import * as cartApi from "../../api/cartApi.ts";
import { clearGuestCart, getGuestCart } from "../../utils/guestCart.ts";
import {
  registerClientAccount,
  resendClientRegistrationOtp,
  verifyClientRegistrationOtp,
} from "../../api/storeAuth.ts";
import { getRetryAfterSeconds } from "../../utils/authRateLimit.js";
import {
  PASSWORD_CONFIRM_HELPER,
  buildCooldownButtonLabel,
  buildResendCooldownMessage,
} from "../../utils/authUi.js";
import StoreRegister2026View from "./register2026/StoreRegister2026View.jsx";
import { createStoreRegister2026ViewModel } from "./register2026/storeRegister2026Adapter.js";

const PENDING_ADD_KEY = "pending_cart_add";
const PENDING_ADD_CONSUMED_KEY = "pending_cart_add_consumed";
const PENDING_REGISTRATION_KEY = "client_pending_registration";

const readPendingRegistration = () => {
  try {
    const raw = sessionStorage.getItem(PENDING_REGISTRATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const writePendingRegistration = (value) => {
  try {
    if (value) {
      sessionStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(value));
      return;
    }
    sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
  } catch {
    // ignore storage errors
  }
};

const toFieldErrors = (error) => {
  const flattened =
    error?.flatten?.()?.fieldErrors ||
    error?.response?.data?.errors?.fieldErrors ||
    error?.fieldErrors ||
    {};
  return flattened && typeof flattened === "object" ? flattened : {};
};

const getErrorCode = (error) => String(error?.response?.data?.code || error?.code || "").trim();

const getErrorMessage = (error, fallback) =>
  String(error?.response?.data?.message || error?.message || fallback || "").trim();

const hasFieldErrors = (fieldErrors) =>
  Boolean(
    fieldErrors &&
      typeof fieldErrors === "object" &&
      Object.values(fieldErrors).some((messages) => Array.isArray(messages) && messages.length > 0)
  );

const resolveRegisterErrorPresentation = (error) => {
  const fieldErrors = toFieldErrors(error);
  const code = getErrorCode(error);
  const pending = error?.response?.data?.data?.pending || null;

  if (hasFieldErrors(fieldErrors)) {
    return {
      fieldErrors,
      pending,
      statusMessage: "",
      statusTone: "neutral",
    };
  }

  if (code === "OTP_DELIVERY_FAILED") {
    return {
      fieldErrors: {},
      pending,
      statusMessage: getErrorMessage(
        error,
        "Your account is pending verification, but we could not send the code right now."
      ),
      statusTone: pending ? "warning" : "error",
    };
  }

  if (code === "REQUEST_REJECTED") {
    return {
      fieldErrors: {},
      pending,
      statusMessage: getErrorMessage(
        error,
        "We could not process this registration request."
      ),
      statusTone: "error",
    };
  }

  return {
    fieldErrors: {},
    pending,
    statusMessage: getErrorMessage(error, "Registration failed. Please try again."),
    statusTone: pending ? "warning" : "error",
  };
};

const resolveVerifyErrorPresentation = (error) => {
  const pending = error?.response?.data?.data?.pending || null;
  const code = getErrorCode(error);
  const message = getErrorMessage(error, "The verification code is invalid or expired.");

  if (code === "OTP_INVALID_OR_EXPIRED" || code === "OTP_ATTEMPTS_EXCEEDED") {
    return {
      pending,
      fieldErrors: {
        otpCode: [message],
      },
      statusMessage: "",
      statusTone: "neutral",
    };
  }

  return {
    pending,
    fieldErrors: {
      otpCode: [message],
    },
    statusMessage: message,
    statusTone: "error",
  };
};
const getPhoneNumber = (phone) => {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("62")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return `+62${digits}`;
};

export default function StoreRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshSession, isAccountSession } = useAccountAuth();
  const { refreshCart } = useCart();
  const startedAtRef = useRef(Date.now());
  const statusRef = useRef(null);
  const fieldRefs = useRef({
    name: null,
    email: null,
    phoneNumber: null,
    password: null,
    passwordConfirm: null,
    otpCode: null,
    termsAccepted: null,
  });
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    passwordConfirm: "",
    termsAccepted: false,
    honeypot: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("neutral");
  const [pendingRegistration, setPendingRegistration] = useState(() => readPendingRegistration());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [countdown, setCountdown] = useState(
    Number(readPendingRegistration()?.verification?.resendAvailableInSeconds || 0)
  );
  const currentStep = pendingRegistration ? "verify" : "register";
  const pendingVerification = pendingRegistration?.verification || null;
  const canSubmitOtp = pendingVerification?.canSubmitOtp !== false;
  const deliveryFailed = pendingVerification?.deliveryStatus === "FAILED";

  useEffect(() => {
    if (isAccountSession) {
      navigate("/account", { replace: true });
    }
  }, [isAccountSession, navigate]);

  useEffect(() => {
    const locationPending = location.state?.pendingRegistration || location.state?.pendingVerification;
    if (locationPending && typeof locationPending === "object") {
      setPendingRegistration(locationPending);
      writePendingRegistration(locationPending);
      setCountdown(Number(locationPending?.verification?.resendAvailableInSeconds || 0));
      if (location.state?.pendingNotice) {
        setStatusMessage(String(location.state.pendingNotice));
        setStatusTone("warning");
      }
    }
  }, [location.state]);

  useEffect(() => {
    writePendingRegistration(pendingRegistration);
    setCountdown(Number(pendingRegistration?.verification?.resendAvailableInSeconds || 0));
  }, [pendingRegistration]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    const firstErrorKey = Object.keys(fieldErrors || {}).find((key) =>
      Array.isArray(fieldErrors?.[key]) && fieldErrors[key].length > 0
    );
    if (firstErrorKey && fieldRefs.current[firstErrorKey]) {
      fieldRefs.current[firstErrorKey].focus();
      return;
    }
    if (statusMessage && statusRef.current) {
      statusRef.current.focus();
    }
  }, [fieldErrors, statusMessage]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current?.[key]) return current;
      return { ...current, [key]: undefined };
    });
  };

  const mergeGuestCart = async () => {
    try {
      const guest = getGuestCart();
      const items = Array.isArray(guest?.items) ? guest.items : [];
      if (items.length === 0) return;
      for (const item of items) {
        const id = Number(item?.productId);
        const qty = Math.max(1, Number(item?.qty) || 1);
        if (!Number.isFinite(id) || id <= 0) continue;
        await cartApi.addToCart(id, qty, {
          variantKey: item?.variantKey ?? null,
          variantSelections: Array.isArray(item?.variantSelections) ? item.variantSelections : [],
        });
      }
      clearGuestCart();
    } catch (mergeError) {
      if (import.meta.env.DEV) {
        console.warn("[store-register] guest cart merge failed", mergeError);
      }
    }
  };

  const mergePendingAdd = async () => {
    try {
      const raw = localStorage.getItem(PENDING_ADD_KEY);
      if (!raw) return null;
      localStorage.removeItem(PENDING_ADD_KEY);
      const parsed = JSON.parse(raw);
      const nonce = parsed?.nonce;
      if (nonce) {
        const consumed = sessionStorage.getItem(PENDING_ADD_CONSUMED_KEY);
        if (consumed === String(nonce)) {
          return null;
        }
        sessionStorage.setItem(PENDING_ADD_CONSUMED_KEY, String(nonce));
      }
      const id = Number(parsed?.productId);
      const qty = Math.max(1, Number(parsed?.qty) || 1);
      if (Number.isFinite(id) && id > 0) {
        await cartApi.addToCart(id, qty, parsed?.snapshot || undefined);
      }
      return typeof parsed?.from === "string" ? parsed.from : null;
    } catch (mergeError) {
      if (import.meta.env.DEV) {
        console.warn("[store-register] pending add merge failed", mergeError);
      }
      return null;
    }
  };

  const completeAuthenticatedRegistration = async () => {
    await mergeGuestCart();
    const pendingFrom = await mergePendingAdd();
    await refreshSession();
    await refreshCart(false);
    writePendingRegistration(null);
    setPendingRegistration(null);
    const fromState = location.state?.from;
    const resolvedFrom =
      typeof fromState === "string"
        ? fromState
        : fromState && fromState.pathname
          ? `${fromState.pathname || ""}${fromState.search || ""}${fromState.hash || ""}`
          : null;
    const target =
      pendingFrom && pendingFrom !== "/auth/register"
        ? pendingFrom
        : resolvedFrom && resolvedFrom !== "/auth/register"
          ? resolvedFrom
          : "/account";
    navigate(target, { replace: true });
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    setStatusTone("neutral");
    setFieldErrors({});

    const cleanPhone = String(form.phoneNumber || "").trim().replace(/[- ]/g, "");
    if (!/^(?:\+62|62|0)8[1-9][0-9]{6,11}$/.test(cleanPhone)) {
      setFieldErrors({ phoneNumber: ["Enter a valid Indonesian phone number starting with +62 or 08."] });
      return;
    }

    const payload = {
      ...form,
      phoneNumber: getPhoneNumber(form.phoneNumber),
      startedAt: startedAtRef.current,
    };
    const parsed = clientRegistrationSchema.safeParse(payload);
    if (!parsed.success) {
      const nextFieldErrors = toFieldErrors(parsed.error);
      setFieldErrors(nextFieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerClientAccount(parsed.data);
      const pending = result?.data?.pendingRegistration || null;
      if (pending) {
        setPendingRegistration(pending);
        setVerificationCode("");
      }
      setStatusMessage(result?.message || "Verification code sent to your email.");
      setStatusTone("success");
    } catch (error) {
      const presentation = resolveRegisterErrorPresentation(error);
      setFieldErrors(presentation.fieldErrors);
      const pending = presentation.pending;
      if (pending) {
        setPendingRegistration(pending);
      }
      setStatusMessage(presentation.statusMessage);
      setStatusTone(presentation.statusTone);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async (event) => {
    event.preventDefault();
    if (!pendingVerification?.verificationId) {
      setStatusMessage("Start your registration again to request a new code.");
      setStatusTone("error");
      return;
    }

    setStatusMessage("");
    setStatusTone("neutral");
    setFieldErrors((current) => ({
      ...current,
      otpCode: undefined,
    }));
    const parsed = clientRegistrationVerifySchema.safeParse({
      verificationId: pendingVerification.verificationId,
      otpCode: verificationCode,
    });
    if (!parsed.success) {
      const nextFieldErrors = toFieldErrors(parsed.error);
      setFieldErrors((current) => ({ ...current, ...nextFieldErrors }));
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyClientRegistrationOtp(parsed.data);
      setStatusMessage(result?.message || "Your account is now active.");
      setStatusTone("success");
      await completeAuthenticatedRegistration();
    } catch (error) {
      const presentation = resolveVerifyErrorPresentation(error);
      const pending = presentation.pending;
      if (pending) {
        setPendingRegistration(pending);
      }
      setFieldErrors((current) => ({ ...current, ...presentation.fieldErrors }));
      setStatusMessage(presentation.statusMessage);
      setStatusTone(presentation.statusTone);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingVerification?.verificationId || countdown > 0) return;
    setStatusMessage("");
    setStatusTone("neutral");
    setIsResending(true);
    try {
      const result = await resendClientRegistrationOtp(pendingVerification.verificationId);
      const pending = result?.data?.pendingRegistration || null;
      if (pending) {
        setPendingRegistration(pending);
      }
      setStatusMessage(result?.message || "A new verification code was sent.");
      setStatusTone("success");
    } catch (error) {
      const pending = error?.response?.data?.data?.pending || null;
      if (pending) {
        setPendingRegistration(pending);
      }
      const retryAfterSeconds = getRetryAfterSeconds(error);
      if (retryAfterSeconds > 0) {
        setCountdown((current) => Math.max(current, retryAfterSeconds));
      }
      setStatusMessage(
        error?.response?.status === 429 && retryAfterSeconds > 0
          ? buildResendCooldownMessage(retryAfterSeconds)
          : error?.response?.data?.message || "We could not send a new code right now."
      );
      setStatusTone("error");
    } finally {
      setIsResending(false);
    }
  };

  const resetRegistration = () => {
    writePendingRegistration(null);
    setPendingRegistration(null);
    setVerificationCode("");
    setFieldErrors({});
    setStatusMessage("");
    setStatusTone("neutral");
    startedAtRef.current = Date.now();
  };

  const viewModel = createStoreRegister2026ViewModel({
    form: {
      ...form,
      showPassword,
      showPasswordConfirm,
    },
    status: {
      message: statusMessage,
      tone: statusTone,
      isSubmitting,
      isVerifying,
      isResending,
      countdown,
      canSubmitOtp,
      deliveryFailed,
      submitLabel: isSubmitting ? "Creating account..." : "Create account",
      verifyLabel: isVerifying
        ? "Verifying..."
        : canSubmitOtp
          ? "Verify email"
          : "Wait for a new verification code",
      resendLabel: isResending
        ? "Sending new code..."
        : buildCooldownButtonLabel(countdown, "Resend code", "Resend code in"),
      passwordConfirmHelper: PASSWORD_CONFIRM_HELPER,
      errors: fieldErrors,
    },
    mode: currentStep,
    otp: {
      code: verificationCode,
      destinationMasked: pendingVerification?.destinationMasked,
      channel: pendingVerification?.channel || "EMAIL",
      expiresInSeconds: pendingVerification?.expiresInSeconds || 0,
    },
  });

  const handleOtpChange = (value) => {
    setVerificationCode(String(value || "").replace(/\D/g, "").slice(0, 6));
    setFieldErrors((current) => {
      if (!current?.otpCode) return current;
      return { ...current, otpCode: undefined };
    });
  };

  return (
    <StoreRegister2026View
      viewModel={viewModel}
      fieldRefs={fieldRefs}
      statusRef={statusRef}
      onChange={setField}
      onSubmit={handleRegisterSubmit}
      onSignIn={() => navigate("/auth/login")}
      onTogglePassword={() => setShowPassword((value) => !value)}
      onToggleConfirmPassword={() => setShowPasswordConfirm((value) => !value)}
      onOtpChange={handleOtpChange}
      onVerifyOtp={handleVerifySubmit}
      onResendOtp={handleResendOtp}
      onBackToRegister={resetRegistration}
    />
  );
}
