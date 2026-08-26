import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { adminForgotPasswordSchema } from "@ecommerce/schemas";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  Moon,
  RefreshCcw,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { requestAdminPasswordReset } from "../../api/adminPublicAuth.ts";
import useStoreBranding from "../../hooks/useStoreBranding.js";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { getWorkspaceLogoUrl } from "../../lib/branding.js";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useTranslation } from "react-i18next";
import { getRetryAfterSeconds } from "../../utils/authRateLimit.js";
import {
  buildCooldownButtonLabel,
  buildRetryAfterMessage,
} from "../../utils/authUi.js";
import "./admin-forgot-password-2026.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_FORGOT_PASSWORD_SUCCESS_MESSAGE =
  "If this email is registered, a secure reset link has been sent.";

const toFieldErrors = (error) => {
  const flattened =
    error?.flatten?.()?.fieldErrors ||
    error?.response?.data?.errors?.fieldErrors ||
    error?.fieldErrors ||
    {};
  return flattened && typeof flattened === "object" ? flattened : {};
};

const firstFieldError = (fieldErrors, key) => {
  const error = fieldErrors?.[key];
  if (Array.isArray(error)) return error[0] || "";
  return typeof error === "string" ? error : "";
};

const validateEmail = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "Email is required.";
  if (!EMAIL_PATTERN.test(normalized)) return "Enter a valid email address.";
  return "";
};

function AdminRecoveryBrand({ logoSrc, compact = false }) {
  return (
    <div className={`admin-forgot-2026__brand${compact ? " is-compact" : ""}`}>
      <span className="admin-forgot-2026__brand-mark">
        <img src={logoSrc} alt="" />
      </span>
      <span className="admin-forgot-2026__brand-copy">
        <strong>TP Preneurs</strong>
        <small>Admin Workspace</small>
      </span>
    </div>
  );
}

function RecoveryIllustration() {
  return (
    <div className="admin-forgot-2026__illustration" aria-hidden="true">
      <span className="admin-forgot-2026__orbit is-one" />
      <span className="admin-forgot-2026__orbit is-two" />

      <div className="admin-forgot-2026__dashboard-card">
        <div className="admin-forgot-2026__dashboard-title">
          <span><UserRound size={18} /></span>
          <strong>Admin</strong>
        </div>
        <i /><i /><i />
        <span className="is-selected"><ShieldCheck size={20} /></span>
      </div>

      <div className="admin-forgot-2026__mail-card">
        <Mail size={54} strokeWidth={1.8} />
        <span>1</span>
      </div>

      <div className="admin-forgot-2026__shield">
        <ShieldCheck size={202} strokeWidth={1.25} />
        <span><LockKeyhole size={70} strokeWidth={1.8} /></span>
      </div>

      <span className="admin-forgot-2026__refresh">
        <RefreshCcw size={50} strokeWidth={2.2} />
      </span>

      <div className="admin-forgot-2026__key-card">
        <span><KeyRound size={24} /></span>
        <div><strong>Reset Link</strong><i /><i /></div>
      </div>

      <div className="admin-forgot-2026__password-card">
        <LockKeyhole size={17} />
        <strong>********</strong>
      </div>

      <div className="admin-forgot-2026__verified-card">
        <CheckCircle2 size={30} />
        <i /><i />
      </div>
    </div>
  );
}

export default function AdminForgotPasswordPage() {
  const startedAtRef = useRef(Date.now());
  const emailRef = useRef(null);
  const statusRef = useRef(null);
  const { branding } = useStoreBranding();
  const { resolvedTheme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("neutral");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const isDark = resolvedTheme === "dark";
  const adminLogoSrc = getWorkspaceLogoUrl("admin", branding?.adminLogoUrl);
  const customHeroSrc = resolveAssetUrl(branding?.adminForgotPasswordHeroUrl);
  const emailValidationMessage = useMemo(() => validateEmail(email), [email]);
  const visibleEmailError = firstFieldError(fieldErrors, "email");
  const isEmailValid = !emailValidationMessage;

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setCooldownSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const focusEmail = () => {
    window.requestAnimationFrame(() => emailRef.current?.focus());
  };

  const focusStatus = () => {
    window.requestAnimationFrame(() => statusRef.current?.focus());
  };

  const handleEmailChange = (event) => {
    const value = event.target.value;
    setEmail(value);
    setFieldErrors((current) => {
      if (!current.email) return current;
      const next = { ...current };
      delete next.email;
      return next;
    });
    if (statusTone === "error") {
      setStatusMessage("");
      setStatusTone("neutral");
    }
  };

  const handleEmailBlur = () => {
    const message = validateEmail(email);
    setFieldErrors((current) => {
      const next = { ...current };
      if (message) next.email = [message];
      else delete next.email;
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    setStatusTone("neutral");

    const validationMessage = validateEmail(email);
    if (validationMessage) {
      setFieldErrors({ email: [validationMessage] });
      focusEmail();
      return;
    }

    const payload = {
      email: email.trim().toLowerCase(),
      honeypot,
      startedAt: startedAtRef.current,
    };
    const parsed = adminForgotPasswordSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      focusEmail();
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const result = await requestAdminPasswordReset(parsed.data);
      setStatusMessage(result?.message || ADMIN_FORGOT_PASSWORD_SUCCESS_MESSAGE);
      setStatusTone("success");
      focusStatus();
    } catch (error) {
      const backendFieldErrors = toFieldErrors(error);
      setFieldErrors(backendFieldErrors);
      const retryAfterSeconds = getRetryAfterSeconds(error);
      setStatusMessage(
        error?.response?.status === 429 && retryAfterSeconds > 0
          ? buildRetryAfterMessage(retryAfterSeconds)
          : error?.response?.data?.message || "We couldn't process that request right now."
      );
      setStatusTone("error");
      if (retryAfterSeconds > 0) setCooldownSeconds(retryAfterSeconds);
      if (firstFieldError(backendFieldErrors, "email")) focusEmail();
      else focusStatus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className={`admin-forgot-2026${isDark ? " admin-forgot-2026--dark" : ""}`}
    >
      <div className="admin-forgot-topbar">
        <button
          className="admin-forgot-icon-btn"
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>
        <select
          className="admin-forgot-lang-select"
          value={i18n.language?.startsWith("id") ? "id" : "en"}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          aria-label="Select language"
        >
          <option value="en">English</option>
          <option value="id">Indonesia</option>
        </select>
      </div>

      <section className="admin-forgot-2026__shell" aria-labelledby="admin-recovery-title">
        <div className={`admin-forgot-2026__hero${customHeroSrc ? " has-custom-media" : ""}`}>
          <AdminRecoveryBrand logoSrc={adminLogoSrc} />
          {customHeroSrc ? (
            <div className="admin-forgot-2026__custom-media">
              <img src={customHeroSrc} alt="Admin account recovery" />
              <span aria-hidden="true" />
            </div>
          ) : (
            <RecoveryIllustration />
          )}
        </div>

        <div className="admin-forgot-2026__panel">
          <div className="admin-forgot-2026__mobile-brand">
            <AdminRecoveryBrand logoSrc={adminLogoSrc} compact />
          </div>

          <div className="admin-forgot-2026__card">
            <p className="admin-forgot-2026__kicker">Account Recovery</p>
            <h1 id="admin-recovery-title">Forgot password</h1>
            <p className="admin-forgot-2026__intro">
              We'll send a secure reset link to your email.
            </p>

            {statusMessage ? (
              <div
                id="admin-forgot-password-status"
                ref={statusRef}
                className={`admin-forgot-2026__notice is-${statusTone}`}
                tabIndex={-1}
                role={statusTone === "error" ? "alert" : "status"}
                aria-live={statusTone === "error" ? "assertive" : "polite"}
              >
                {statusTone === "success" ? (
                  <CheckCircle2 size={19} aria-hidden="true" />
                ) : (
                  <ShieldCheck size={19} aria-hidden="true" />
                )}
                <span>{statusMessage}</span>
              </div>
            ) : null}

            <form className="admin-forgot-2026__form" onSubmit={handleSubmit} noValidate>
              <div className="admin-forgot-2026__honeypot" aria-hidden="true">
                <label htmlFor="admin-forgot-password-company">Company</label>
                <input
                  id="admin-forgot-password-company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                />
              </div>

              <div className="admin-forgot-2026__field">
                <label htmlFor="admin-forgot-password-email">Email</label>
                <div className={`admin-forgot-2026__input${visibleEmailError ? " has-error" : ""}`}>
                  <Mail size={20} aria-hidden="true" />
                  <input
                    id="admin-forgot-password-email"
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    placeholder="staff@example.com"
                    autoComplete="email"
                    aria-invalid={Boolean(visibleEmailError)}
                    aria-describedby={visibleEmailError ? "admin-forgot-password-email-error" : undefined}
                    required
                  />
                </div>
                {visibleEmailError ? (
                  <p
                    className="admin-forgot-2026__field-error"
                    id="admin-forgot-password-email-error"
                    role="alert"
                  >
                    {visibleEmailError}
                  </p>
                ) : null}
              </div>

              <button
                className="admin-forgot-2026__submit"
                type="submit"
                disabled={!isEmailValid || isSubmitting || cooldownSeconds > 0}
                aria-busy={isSubmitting}
              >
                <span>
                  {isSubmitting
                    ? "Sending link..."
                    : buildCooldownButtonLabel(cooldownSeconds, "Send reset link")}
                </span>
                <ArrowRight size={19} aria-hidden="true" />
              </button>
            </form>

            <div className="admin-forgot-2026__links">
              <Link to="/admin/login">
                <ArrowLeft size={17} aria-hidden="true" /> Back to login
              </Link>
            </div>
          </div>
        </div>

        <footer className="admin-forgot-2026__footer">
          &copy; 2026 TP Preneurs. All rights reserved.
        </footer>
      </section>
    </main>
  );
}
