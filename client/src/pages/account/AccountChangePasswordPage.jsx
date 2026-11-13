import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { changeUserPassword } from "../../api/userPassword.ts";
import { useAccountAuth } from "../../auth/authDomainHooks.js";
import { storePendingAuthNotice } from "../../auth/authSessionNotice.js";
import AccountChangePassword2026View from "./AccountChangePassword2026View";
import {
  buildChangePasswordPayloadFrom2026Form,
  getEmptyChangePassword2026Form,
  normalizeChangePasswordFor2026,
  validateChangePassword2026Form,
} from "./accountChangePassword2026Adapter";

const getErrorMessage = (error, isIndo = false) => {
  const raw = error?.response?.data?.message || error?.message || "";
  if (/current password is incorrect/i.test(raw)) {
    return isIndo
      ? "Kata sandi saat ini tidak sesuai. Harap periksa kembali."
      : "Current password is incorrect. Please check and try again.";
  }
  if (/different from current password/i.test(raw)) {
    return isIndo
      ? "Kata sandi baru harus berbeda dari kata sandi saat ini."
      : "New password must be different from current password.";
  }
  return isIndo
    ? "Tidak dapat memperbarui kata sandi. Periksa kata sandi saat ini dan coba lagi."
    : "We couldn't update your password. Check your current password and try again.";
};

export default function AccountChangePasswordPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const outletCtx = useOutletContext() || {};
  const { user: accountUser, isLoading, logout } = useAccountAuth();
  const redirectTimerRef = useRef(null);

  const [currentLang, setCurrentLang] = useState(() => {
    const raw =
      localStorage.getItem("store_language") ||
      localStorage.getItem("i18nextLng") ||
      i18n.language ||
      "en";
    return String(raw).toLowerCase().startsWith("id") || String(raw).toLowerCase() === "indonesia"
      ? "id"
      : "en";
  });

  useEffect(() => {
    const syncLang = () => {
      const raw =
        localStorage.getItem("store_language") ||
        localStorage.getItem("i18nextLng") ||
        i18n.language ||
        "en";
      const next =
        String(raw).toLowerCase().startsWith("id") || String(raw).toLowerCase() === "indonesia"
          ? "id"
          : "en";
      setCurrentLang(next);
    };

    const handleCustomLang = (e) => {
      if (e?.detail?.isoCode) {
        const next = String(e.detail.isoCode).toLowerCase().startsWith("id") ? "id" : "en";
        setCurrentLang(next);
      } else {
        syncLang();
      }
    };

    i18n.on("languageChanged", syncLang);
    window.addEventListener("store_language_changed", handleCustomLang);
    window.addEventListener("storage", syncLang);

    return () => {
      i18n.off("languageChanged", syncLang);
      window.removeEventListener("store_language_changed", handleCustomLang);
      window.removeEventListener("storage", syncLang);
    };
  }, [i18n]);

  const isIndo = Boolean(outletCtx.isId || currentLang === "id");

  const [form, setForm] = useState(() => getEmptyChangePassword2026Form());
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState(null);

  useEffect(
    () => () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    },
    []
  );

  const changePasswordMutation = useMutation({
    mutationFn: changeUserPassword,
    onSuccess: () => {
      const successMsg = isIndo
        ? "Kata sandi berhasil diperbarui. Silakan masuk kembali dengan kata sandi baru Anda."
        : "Password updated successfully. Please log in again with your new password.";
      setStatus({ type: "success", message: successMsg });
      storePendingAuthNotice(successMsg);
    },
    onError: (error) => {
      setStatus({
        type: "error",
        message: getErrorMessage(error, isIndo),
      });
    },
  });

  const handleFormChange = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    if (status?.type === "error") setStatus(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    const validation = validateChangePassword2026Form(form, isIndo);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    const payload = buildChangePasswordPayloadFrom2026Form(form);
    const successNotice = isIndo
      ? "Kata sandi berhasil diperbarui. Silakan masuk kembali dengan kata sandi baru Anda."
      : "Password updated successfully. Please log in again with your new password.";

    try {
      await changePasswordMutation.mutateAsync(payload);
      setForm(getEmptyChangePassword2026Form());
      setFieldErrors({});
      redirectTimerRef.current = window.setTimeout(async () => {
        try {
          if (typeof logout === "function") {
            await logout();
          }
        } finally {
          navigate("/auth/login", {
            replace: true,
            state: {
              authNotice: successNotice,
            },
          });
        }
      }, 1200);
    } catch {
      // Mutation onError owns the user-facing message.
    }
  };

  const normalized = normalizeChangePasswordFor2026({
    user: accountUser,
    form,
    isIndo,
  });

  return (
    <AccountChangePassword2026View
      account={normalized.account}
      form={normalized.form}
      rules={normalized.rules}
      strength={normalized.strength}
      fieldErrors={fieldErrors}
      isLoading={isLoading}
      isSaving={changePasswordMutation.isPending}
      isIndo={isIndo}
      error=""
      status={status}
      LinkComponent={Link}
      onFormChange={handleFormChange}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/user/my-account")}
      onForgotPassword={() => navigate("/auth/forgot-password")}
      onContactSupport={() => navigate("/contact-us")}
    />
  );
}
