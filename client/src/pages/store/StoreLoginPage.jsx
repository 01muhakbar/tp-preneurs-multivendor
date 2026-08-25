import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccountAuth } from "../../auth/authDomainHooks.js";
import { api } from "../../api/axios.ts";
import { useCart } from "../../hooks/useCart.ts";
import * as cartApi from "../../api/cartApi.ts";
import { clearGuestCart, getGuestCart } from "../../utils/guestCart.ts";
import { getRetryAfterSeconds } from "../../utils/authRateLimit.js";
import { clearPendingAuthNotice, readPendingAuthNotice } from "../../auth/authSessionNotice.js";
import {
  PASSWORD_HIDDEN_HELPER,
  buildCooldownButtonLabel,
  buildRetryAfterMessage,
} from "../../utils/authUi.js";
import StoreLogin2026View from "./login2026/StoreLogin2026View.jsx";
import { createStoreLogin2026ViewModel } from "./login2026/storeLogin2026Adapter.js";

const PENDING_ADD_KEY = "pending_cart_add";
const PENDING_ADD_CONSUMED_KEY = "pending_cart_add_consumed";
const ADMIN_WORKSPACE_ROLES = new Set(["admin", "super_admin", "superadmin", "staff"]);

const normalizeRole = (value) => String(value || "").trim().toLowerCase();

export default function StoreLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshSession, isAccountSession } = useAccountAuth();
  const { refreshCart } = useCart();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const statusRef = useRef(null);
  const errorRef = useRef(null);

  useEffect(() => {
    if (isAccountSession) {
      navigate("/account", { replace: true });
    }
  }, [isAccountSession, navigate]);

  useEffect(() => {
    const nextMessage = String(
      location.state?.authNotice || location.state?.passwordResetMessage || readPendingAuthNotice() || ""
    ).trim();
    if (nextMessage) {
      setStatusMessage(nextMessage);
      clearPendingAuthNotice();
    }
  }, [location.state]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setCooldownSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  useEffect(() => {
    if (statusMessage && statusRef.current) {
      statusRef.current.focus();
    }
  }, [statusMessage]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatusMessage("");
    setIsSubmitting(true);
    try {
      const response = await api.post(
        "/auth/login",
        { email, password },
        { withCredentials: true }
      );
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
              variantSelections: Array.isArray(item?.variantSelections)
                ? item.variantSelections
                : [],
            });
          }
          clearGuestCart();
        } catch (mergeError) {
          if (import.meta.env.DEV) {
            console.warn("[store-login] guest cart merge failed", mergeError);
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
            console.warn("[store-login] pending add merge failed", mergeError);
          }
          return null;
        }
      };
      if (import.meta.env.DEV) {
        console.log("[store-login] login ok", {
          url: "/api/auth/login",
          status: response?.status,
        });
        console.log("[store-login] document.cookie", document.cookie);
        fetch("/api/auth/me", { credentials: "include" })
          .then((res) =>
            console.log("[store-login] me status", res.status)
          )
          .catch((err) =>
            console.log("[store-login] me status error", err)
          );
      }
      await mergeGuestCart();
      const pendingFrom = await mergePendingAdd();
      await refreshSession();
      await refreshCart(false);
      const authenticatedRole = normalizeRole(
        response?.data?.data?.user?.role || response?.data?.user?.role
      );
      if (ADMIN_WORKSPACE_ROLES.has(authenticatedRole)) {
        navigate("/admin", { replace: true });
        return;
      }
      // Redirect back to intended page if present; avoid looping to login.
      const fromState = location.state?.from;
      const resolvedFrom =
        typeof fromState === "string"
          ? fromState
          : fromState && fromState.pathname
            ? `${fromState.pathname || ""}${fromState.search || ""}${fromState.hash || ""}`
            : null;
      let target =
        pendingFrom && pendingFrom !== "/auth/login"
          ? pendingFrom
          : resolvedFrom && resolvedFrom !== "/auth/login"
            ? resolvedFrom
            : "/account";

      if (target === "/account") {
        try {
          const storesResponse = await api.get("/seller/stores");
          const storesData = storesResponse?.data;
          const stores = Array.isArray(storesData?.stores) ? storesData.stores 
                       : Array.isArray(storesData?.data?.stores) ? storesData.data.stores
                       : Array.isArray(storesData?.items) ? storesData.items
                       : Array.isArray(storesData?.data?.items) ? storesData.data.items 
                       : Array.isArray(storesData) ? storesData : [];
          if (stores.length > 0) {
            target = "/user/dashboard";
          }
        } catch (err) {
          // ignore
        }
      }

      const postLoginState =
        location.state?.postLoginState &&
        typeof location.state.postLoginState === "object"
          ? location.state.postLoginState
          : undefined;
      navigate(target, { replace: true, state: postLoginState });
    } catch (err) {
      if (err?.response?.status === 403 && err?.response?.data?.code === "VERIFICATION_REQUIRED") {
        const pendingRegistration = err?.response?.data?.data?.pending || null;
        navigate("/auth/register", {
          replace: true,
          state: {
            pendingRegistration,
            pendingNotice:
              err?.response?.data?.message || "Verify your email before signing in.",
          },
        });
        return;
      }
      setError(
        err?.response?.status === 429 && getRetryAfterSeconds(err) > 0
          ? buildRetryAfterMessage(getRetryAfterSeconds(err))
          : err?.response?.data?.message ||
              "We couldn't sign you in. Check your email and password and try again."
      );
      const retryAfterSeconds = getRetryAfterSeconds(err);
      if (retryAfterSeconds > 0) {
        setCooldownSeconds(retryAfterSeconds);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewModel = createStoreLogin2026ViewModel({
    form: {
      email,
      password,
      remember,
      showPassword,
    },
    status: {
      errorMessage: error,
      successMessage: statusMessage,
      helperMessage: PASSWORD_HIDDEN_HELPER,
      cooldownSeconds,
      submitLabel: buildCooldownButtonLabel(cooldownSeconds, "Sign in"),
    },
    submitting: isSubmitting,
    redirectState: location.state,
  });

  return (
    <StoreLogin2026View
      viewModel={viewModel}
      fieldRefs={{ emailRef, passwordRef }}
      messageRefs={{ statusRef, errorRef }}
      onSubmit={handleSubmit}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onRememberChange={setRemember}
      onTogglePassword={() => setShowPassword((value) => !value)}
      onForgotPassword={() => navigate("/auth/forgot-password")}
      onCreateAccount={() => navigate("/auth/register")}
    />
  );
}
