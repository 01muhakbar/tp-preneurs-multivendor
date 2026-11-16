import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
const ACCOUNT_DASHBOARD_PATH = "/user/dashboard";
const LEGACY_ACCOUNT_PATH = "/account";

const normalizePostAuthTarget = (value) =>
  value === LEGACY_ACCOUNT_PATH ? ACCOUNT_DASHBOARD_PATH : value;

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

const localizeFieldErrors = (fieldErrors, isIndo, code) => {
  if (!fieldErrors || typeof fieldErrors !== "object") return {};
  const localized = { ...fieldErrors };

  if (localized.phoneNumber) {
    const rawMsg = Array.isArray(localized.phoneNumber) ? localized.phoneNumber[0] : localized.phoneNumber;
    if (code === "CONTACT_UNAVAILABLE" || /unavailable|already registered|in use/i.test(String(rawMsg || ""))) {
      localized.phoneNumber = [
        isIndo
          ? "Nomor telepon ini sudah terdaftar pada akun lain."
          : "This phone number is already registered to another account.",
      ];
    } else {
      localized.phoneNumber = [
        isIndo
          ? "Masukkan nomor telepon yang valid (contoh: 08123456789)."
          : "Enter a valid phone number (e.g. 08123456789).",
      ];
    }
  }

  if (localized.email) {
    const rawMsg = Array.isArray(localized.email) ? localized.email[0] : localized.email;
    if (code === "CONTACT_UNAVAILABLE" || /unavailable|already in use|registered/i.test(String(rawMsg || ""))) {
      localized.email = [
        isIndo
          ? "Alamat email ini sudah terdaftar pada akun lain."
          : "This email address is already in use by another account.",
      ];
    } else {
      localized.email = [
        isIndo
          ? "Masukkan format alamat email yang valid."
          : "Enter a valid email address.",
      ];
    }
  }

  if (localized.name || localized.fullName) {
    const key = localized.name ? "name" : "fullName";
    localized[key] = [
      isIndo ? "Nama lengkap wajib diisi (minimal 3 karakter)." : "Full name is required (at least 3 characters).",
    ];
  }

  if (localized.password) {
    localized.password = [
      isIndo
        ? "Kata sandi minimal 8 karakter, termasuk huruf dan angka."
        : "Password must be at least 8 characters with letters and numbers.",
    ];
  }

  if (localized.passwordConfirm || localized.confirm) {
    const key = localized.passwordConfirm ? "passwordConfirm" : "confirm";
    localized[key] = [
      isIndo
        ? "Konfirmasi kata sandi tidak cocok."
        : "Password confirmation does not match.",
    ];
  }

  if (localized.termsAccepted || localized.acceptTerms) {
    const key = localized.termsAccepted ? "termsAccepted" : "acceptTerms";
    localized[key] = [
      isIndo
        ? "Anda harus menyetujui syarat & ketentuan serta kebijakan privasi."
        : "You must accept the terms & conditions and privacy policy.",
    ];
  }

  return localized;
};

const buildValidationSummary = (fieldErrors, isIndo) => {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return isIndo
      ? "Mohon periksa dan lengkapi data pendaftaran Anda."
      : "Please review and complete your registration details.";
  }

  // Priority check for specific user actions
  if (fieldErrors.passwordConfirm || fieldErrors.confirm) {
    return isIndo
      ? "Konfirmasi kata sandi tidak cocok. Silakan masukkan kata sandi yang sama persis."
      : "Password confirmation does not match. Please re-enter the identical password.";
  }
  if (fieldErrors.termsAccepted || fieldErrors.acceptTerms) {
    return isIndo
      ? "Harap centang persetujuan syarat & ketentuan serta kebijakan privasi."
      : "Please accept the terms & conditions and privacy policy.";
  }
  if (fieldErrors.phoneNumber) {
    const msg = Array.isArray(fieldErrors.phoneNumber) ? fieldErrors.phoneNumber[0] : fieldErrors.phoneNumber;
    return msg || (isIndo ? "Nomor telepon tidak valid atau sudah terdaftar." : "Phone number is invalid or already registered.");
  }
  if (fieldErrors.email) {
    const msg = Array.isArray(fieldErrors.email) ? fieldErrors.email[0] : fieldErrors.email;
    return msg || (isIndo ? "Alamat email tidak valid atau sudah terdaftar." : "Email address is invalid or already registered.");
  }
  if (fieldErrors.password) {
    const msg = Array.isArray(fieldErrors.password) ? fieldErrors.password[0] : fieldErrors.password;
    return msg || (isIndo ? "Kata sandi minimal 8 karakter, termasuk kombinasi huruf dan angka." : "Password must be at least 8 characters with letters and numbers.");
  }
  if (fieldErrors.name || fieldErrors.fullName) {
    const msg = Array.isArray(fieldErrors.name) ? fieldErrors.name[0] : fieldErrors.name;
    return msg || (isIndo ? "Nama lengkap wajib diisi minimal 3 karakter." : "Full name is required (minimum 3 characters).");
  }

  // Check any other field message
  for (const key of Object.keys(fieldErrors)) {
    const val = fieldErrors[key];
    if (Array.isArray(val) && val[0] && typeof val[0] === "string") {
      return val[0];
    }
    if (typeof val === "string" && val.trim()) {
      return val;
    }
  }

  return isIndo
    ? "Mohon periksa kolom formulir yang belum sesuai."
    : "Please check the form fields that need attention.";
};

const resolveRegisterErrorPresentation = (error, isIndo = false) => {
  const rawFieldErrors = toFieldErrors(error);
  const code = getErrorCode(error);
  const status = error?.response?.status;
  const pending = error?.response?.data?.data?.pending || null;
  const rawMessage = getErrorMessage(error, "");
  const fieldErrors = localizeFieldErrors(rawFieldErrors, isIndo, code);

  // 1. Account conflict: phone or email already registered (409 Conflict)
  if (code === "CONTACT_UNAVAILABLE" || status === 409) {
    const isPhoneConflict = Boolean(fieldErrors.phoneNumber);
    const isEmailConflict = Boolean(fieldErrors.email);
    let message = isIndo
      ? "Nomor telepon atau email ini sudah terdaftar. Silakan masuk ke akun Anda atau gunakan data lain."
      : "This phone number or email is already registered. Please sign in or use different details.";

    if (isPhoneConflict && !isEmailConflict) {
      message = isIndo
        ? "Nomor telepon ini sudah terdaftar pada akun lain. Silakan masuk ke akun Anda atau gunakan nomor lain."
        : "This phone number is already registered to another account. Please sign in or use another number.";
    } else if (isEmailConflict && !isPhoneConflict) {
      message = isIndo
        ? "Alamat email ini sudah terdaftar pada akun lain. Silakan masuk ke akun Anda atau gunakan email lain."
        : "This email address is already registered to another account. Please sign in or use another email.";
    }

    return {
      fieldErrors,
      pending,
      statusMessage: message,
      statusTone: "error",
      isExistingAccount: true,
    };
  }

  // 2. OTP Delivery failed
  if (code === "OTP_DELIVERY_FAILED") {
    return {
      fieldErrors: {},
      pending,
      statusMessage: isIndo
        ? "Akun Anda menunggu verifikasi, namun pengiriman kode OTP melalui email gagal. Silakan coba lagi."
        : "Your account is pending verification, but we could not send the verification code. Please try again.",
      statusTone: pending ? "warning" : "error",
      isExistingAccount: false,
    };
  }

  // 3. Request rejected (rate limit, anti-bot, or fast submission)
  if (code === "REQUEST_REJECTED" || (status === 400 && /could not process/i.test(rawMessage))) {
    return {
      fieldErrors,
      pending,
      statusMessage: isIndo
        ? "Permintaan pendaftaran tidak dapat diproses saat ini. Mohon tunggu beberapa detik lalu coba kembali."
        : "We could not process this registration request right now. Please wait a few seconds and try again.",
      statusTone: "error",
      isExistingAccount: false,
    };
  }

  // 4. Rate limited (429)
  if (status === 429 || code === "RATE_LIMIT_EXCEEDED" || code === "TOO_MANY_REQUESTS") {
    const retryAfter = getRetryAfterSeconds(error);
    const waitMsg = retryAfter > 0 ? ` (${retryAfter} detik)` : "";
    return {
      fieldErrors,
      pending,
      statusMessage: isIndo
        ? `Terlalu banyak percobaan pendaftaran. Silakan tunggu beberapa saat${waitMsg} sebelum mencoba kembali.`
        : `Too many registration attempts. Please wait a moment${waitMsg} before trying again.`,
      statusTone: "error",
      isExistingAccount: false,
    };
  }

  // 5. If specific field validation errors exist
  if (hasFieldErrors(fieldErrors)) {
    return {
      fieldErrors,
      pending,
      statusMessage: buildValidationSummary(fieldErrors, isIndo),
      statusTone: "error",
      isExistingAccount: false,
    };
  }

  // 6. Generic fallback
  return {
    fieldErrors: {},
    pending,
    statusMessage: rawMessage || (isIndo
      ? "Pendaftaran gagal. Periksa kembali koneksi internet dan data Anda, lalu coba lagi."
      : "Registration failed. Please check your connection and details, then try again."),
    statusTone: pending ? "warning" : "error",
    isExistingAccount: false,
  };
};

const resolveVerifyErrorPresentation = (error, isIndo = false) => {
  const pending = error?.response?.data?.data?.pending || null;
  const code = getErrorCode(error);
  const rawMessage = String(error?.response?.data?.message || "").toLowerCase();

  let message = isIndo
    ? "Kode verifikasi tidak valid atau telah kedaluwarsa."
    : "The verification code is invalid or expired.";

  if (code === "OTP_ATTEMPTS_EXCEEDED" || rawMessage.includes("attempts")) {
    message = isIndo
      ? "Batas percobaan kode tercapai. Silakan kirim ulang kode baru."
      : "Verification attempts exceeded. Please resend a new code.";
  } else if (code === "OTP_EXPIRED" || rawMessage.includes("expired")) {
    message = isIndo
      ? "Kode verifikasi telah kedaluwarsa. Silakan kirim ulang kode."
      : "The verification code has expired. Please resend a new code.";
  } else if (code === "OTP_INVALID" || rawMessage.includes("invalid") || rawMessage.includes("incorrect")) {
    message = isIndo
      ? "Kode verifikasi yang Anda masukkan tidak sesuai. Periksa kembali email Anda."
      : "The verification code you entered is incorrect. Please check your email.";
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

const localizeStatusNotice = (msg, isIndo) => {
  if (!msg) return "";
  const str = String(msg).trim();
  const lower = str.toLowerCase();
  if (lower.includes("verification code sent") || lower.includes("kode verifikasi")) {
    return isIndo
      ? "Kode verifikasi telah dikirim ke email Anda."
      : "Verification code sent to your email.";
  }
  if (lower.includes("new verification code") || lower.includes("kode baru")) {
    return isIndo
      ? "Kode verifikasi baru berhasil dikirim ke email Anda."
      : "A new verification code was sent to your email.";
  }
  if (lower.includes("invalid or expired") || lower.includes("tidak valid")) {
    return isIndo
      ? "Kode verifikasi tidak valid atau telah kedaluwarsa."
      : "The verification code is invalid or expired.";
  }
  return str;
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
  const { t, i18n } = useTranslation();
  const [, setLangSync] = useState(0);

  useEffect(() => {
    const handleSync = () => setLangSync((c) => c + 1);
    i18n?.on?.("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("store_language_changed", handleSync);
    return () => {
      i18n?.off?.("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("store_language_changed", handleSync);
    };
  }, [i18n]);

  const isIndo =
    i18n.language === "id" ||
    i18n.language === "id-ID" ||
    (typeof i18n.language === "string" && i18n.language.startsWith("id")) ||
    (typeof window !== "undefined" && localStorage.getItem("store_language") === "Indonesia");

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
  const [isExistingAccount, setIsExistingAccount] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(() => readPendingRegistration());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [countdown, setCountdown] = useState(
    Number(readPendingRegistration()?.verification?.resendAvailableInSeconds || 0)
  );
  const [expiresCountdown, setExpiresCountdown] = useState(() =>
    Number(readPendingRegistration()?.verification?.expiresInSeconds || 600)
  );
  const currentStep = pendingRegistration ? "verify" : "register";
  const pendingVerification = pendingRegistration?.verification || null;
  const canSubmitOtp = pendingVerification?.canSubmitOtp !== false;
  const deliveryFailed = pendingVerification?.deliveryStatus === "FAILED";

  useEffect(() => {
    if (isAccountSession) {
      navigate(ACCOUNT_DASHBOARD_PATH, { replace: true });
    }
  }, [isAccountSession, navigate]);

  useEffect(() => {
    const locationPending = location.state?.pendingRegistration || location.state?.pendingVerification;
    if (locationPending && typeof locationPending === "object") {
      setPendingRegistration(locationPending);
      writePendingRegistration(locationPending);
      setCountdown(Number(locationPending?.verification?.resendAvailableInSeconds || 0));
      if (locationPending?.verification?.expiresInSeconds) {
        setExpiresCountdown(Number(locationPending.verification.expiresInSeconds));
      }
      if (location.state?.pendingNotice) {
        setStatusMessage(String(location.state.pendingNotice));
        setStatusTone("warning");
      }
    }
  }, [location.state]);

  useEffect(() => {
    writePendingRegistration(pendingRegistration);
    setCountdown(Number(pendingRegistration?.verification?.resendAvailableInSeconds || 0));
    if (pendingRegistration?.verification?.expiresInSeconds) {
      setExpiresCountdown(Number(pendingRegistration.verification.expiresInSeconds));
    }
  }, [pendingRegistration]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (expiresCountdown <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setExpiresCountdown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [expiresCountdown]);

  const scrollToErrorOrNotice = (preferredKey) => {
    window.setTimeout(() => {
      const key =
        preferredKey ||
        Object.keys(fieldErrors || {}).find(
          (k) => Array.isArray(fieldErrors?.[k]) && fieldErrors[k].length > 0
        );
      if (key && fieldRefs.current[key]) {
        fieldRefs.current[key].scrollIntoView({ behavior: "smooth", block: "center" });
        fieldRefs.current[key].focus?.();
        return;
      }
      if (statusRef.current) {
        statusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        statusRef.current.focus?.();
      }
    }, 60);
  };

  useEffect(() => {
    const firstErrorKey = Object.keys(fieldErrors || {}).find((key) =>
      Array.isArray(fieldErrors?.[key]) && fieldErrors[key].length > 0
    );
    if (firstErrorKey && fieldRefs.current[firstErrorKey]) {
      fieldRefs.current[firstErrorKey].scrollIntoView({ behavior: "smooth", block: "center" });
      fieldRefs.current[firstErrorKey].focus?.();
    } else if (statusMessage && statusRef.current) {
      statusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      statusRef.current.focus?.();
    }
  }, [fieldErrors, statusMessage]);

  const setField = (key, value) => {
    let sanitizedValue = value;
    if (key === "phoneNumber") {
      sanitizedValue = String(value || "").replace(/\s+/g, "");
      if (sanitizedValue.startsWith("+62")) {
        sanitizedValue = sanitizedValue.slice(3);
      } else if (sanitizedValue.startsWith("62") && sanitizedValue.length > 3) {
        sanitizedValue = sanitizedValue.slice(2);
      }
    }
    setForm((current) => ({ ...current, [key]: sanitizedValue }));
    setIsExistingAccount(false);
    setFieldErrors((current) => {
      if (!current?.[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    // Auto-clear stale validation error banner when user edits any field
    setStatusTone((currentTone) => {
      if (currentTone === "error") {
        setStatusMessage("");
        return "neutral";
      }
      return currentTone;
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
        ? normalizePostAuthTarget(pendingFrom)
        : resolvedFrom && resolvedFrom !== "/auth/register"
          ? normalizePostAuthTarget(resolvedFrom)
          : ACCOUNT_DASHBOARD_PATH;
    navigate(target, { replace: true });
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    setStatusTone("neutral");
    setFieldErrors({});
    setIsExistingAccount(false);

    const cleanPhone = String(form.phoneNumber || "").trim().replace(/[- ]/g, "");
    if (!/^(?:\+62|62|0)?8[1-9][0-9]{6,11}$/.test(cleanPhone)) {
      setFieldErrors({
        phoneNumber: [
          isIndo
            ? "Masukkan nomor telepon Indonesia yang valid (contoh: 08123456789 atau 8123456789)."
            : "Enter a valid Indonesian phone number starting with +62 or 08.",
        ],
      });
      setStatusMessage(
        isIndo
          ? "Format nomor telepon tidak sesuai. Silakan periksa kembali."
          : "Invalid phone number format. Please check and try again."
      );
      setStatusTone("error");
      scrollToErrorOrNotice();
      return;
    }

    const payload = {
      ...form,
      phoneNumber: getPhoneNumber(form.phoneNumber),
      startedAt: startedAtRef.current || Date.now(),
    };
    const parsed = clientRegistrationSchema.safeParse(payload);
    if (!parsed.success) {
      const rawErrors = toFieldErrors(parsed.error);
      const nextFieldErrors = localizeFieldErrors(rawErrors, isIndo, "");
      setFieldErrors(nextFieldErrors);
      const summaryMsg = buildValidationSummary(nextFieldErrors, isIndo);
      setStatusMessage(summaryMsg);
      setStatusTone("error");
      const firstKey = Object.keys(nextFieldErrors).find(
        (k) => Array.isArray(nextFieldErrors[k]) && nextFieldErrors[k].length > 0
      );
      scrollToErrorOrNotice(firstKey);
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
      setStatusMessage(
        result?.message ||
          (isIndo
            ? "Kode verifikasi telah dikirim ke email Anda."
            : "Verification code sent to your email.")
      );
      setStatusTone("success");
      setIsExistingAccount(false);
    } catch (error) {
      const presentation = resolveRegisterErrorPresentation(error, isIndo);
      setFieldErrors(presentation.fieldErrors);
      const pending = presentation.pending;
      if (pending) {
        setPendingRegistration(pending);
      }
      setStatusMessage(presentation.statusMessage);
      setStatusTone(presentation.statusTone);
      setIsExistingAccount(Boolean(presentation.isExistingAccount));
      scrollToErrorOrNotice();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async (event) => {
    event.preventDefault();
    if (!pendingVerification?.verificationId) {
      setStatusMessage(
        isIndo
          ? "Mulai pendaftaran Anda kembali untuk meminta kode baru."
          : "Start your registration again to request a new code."
      );
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
      setStatusMessage(
        result?.message ||
          (isIndo ? "Akun Anda kini telah aktif." : "Your account is now active.")
      );
      setStatusTone("success");
      await completeAuthenticatedRegistration();
    } catch (error) {
      const presentation = resolveVerifyErrorPresentation(error, isIndo);
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
      setStatusMessage(
        isIndo
          ? "Kode verifikasi baru berhasil dikirim ke email Anda."
          : (result?.message || "A new verification code was sent to your email.")
      );
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
          : error?.response?.data?.message || (isIndo ? "Gagal mengirim kode baru saat ini." : "We could not send a new code right now.")
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
    setIsExistingAccount(false);
    startedAtRef.current = Date.now();
  };

  const viewModel = createStoreRegister2026ViewModel({
    form: {
      ...form,
      showPassword,
      showPasswordConfirm,
    },
    status: {
      message: localizeStatusNotice(statusMessage, isIndo),
      tone: statusTone,
      isSubmitting,
      isVerifying,
      isResending,
      countdown,
      canSubmitOtp,
      deliveryFailed,
      isExistingAccount,
      action: isExistingAccount
        ? {
            label: isIndo ? "Masuk ke Akun Sekarang" : "Sign in to your account",
            onClick: () => navigate("/auth/login"),
          }
        : null,
      submitLabel: isSubmitting
        ? (isIndo ? "Membuat akun..." : "Creating account...")
        : (isIndo ? "Buat akun" : "Create account"),
      verifyLabel: isVerifying
        ? (isIndo ? "Memverifikasi..." : "Verifying...")
        : canSubmitOtp
          ? (isIndo ? "Verifikasi email" : "Verify email")
          : (isIndo ? "Tunggu kode verifikasi baru" : "Wait for a new verification code"),
      resendLabel: isResending
        ? (isIndo ? "Mengirim kode baru..." : "Sending new code...")
        : buildCooldownButtonLabel(
            countdown,
            isIndo ? "Kirim ulang kode" : "Resend code",
            isIndo ? "Kirim ulang dalam" : "Resend code in"
          ),
      passwordConfirmHelper: PASSWORD_CONFIRM_HELPER,
      errors: fieldErrors,
    },
    mode: currentStep,
    otp: {
      code: verificationCode,
      destinationMasked: pendingVerification?.destinationMasked,
      channel: pendingVerification?.channel || "EMAIL",
      expiresInSeconds: expiresCountdown,
    },
    isIndo,
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
      isIndo={isIndo}
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
