import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { changeUserPassword } from "../../api/userPassword.ts";
import { useAccountAuth } from "../../auth/authDomainHooks.js";
import { storePendingAuthNotice } from "../../auth/authSessionNotice.js";
import { CHANGE_PASSWORD_SUCCESS_MESSAGE } from "../../utils/authUi.js";
import AccountChangePassword2026View from "./AccountChangePassword2026View";
import {
  buildChangePasswordPayloadFrom2026Form,
  getEmptyChangePassword2026Form,
  normalizeChangePasswordFor2026,
  validateChangePassword2026Form,
} from "./accountChangePassword2026Adapter";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  "We couldn't update your password. Check your current password and try again.";

export default function AccountChangePasswordPage() {
  const navigate = useNavigate();
  const { user: accountUser, isLoading, logout } = useAccountAuth();
  const redirectTimerRef = useRef(null);
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
    onSuccess: (response) => {
      const message = response?.message || CHANGE_PASSWORD_SUCCESS_MESSAGE;
      setStatus({ type: "success", message });
      storePendingAuthNotice(message);
    },
    onError: (error) => {
      setStatus({
        type: "error",
        message: getErrorMessage(error),
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

    const validation = validateChangePassword2026Form(form);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    const payload = buildChangePasswordPayloadFrom2026Form(form);

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
              authNotice: CHANGE_PASSWORD_SUCCESS_MESSAGE,
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
