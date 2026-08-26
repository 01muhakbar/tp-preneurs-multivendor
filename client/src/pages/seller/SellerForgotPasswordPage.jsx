import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Headphones,
  KeyRound,
  LockKeyhole,
  Mail,
  Moon,
  Send,
  ShieldCheck,
  ShoppingBag,
  Store,
  Sun,
} from "lucide-react";
import { api } from "../../api/axios.ts";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useTranslation } from "react-i18next";
import useStoreBranding from "../../hooks/useStoreBranding.js";
import { getWorkspaceLogoUrl, hasCustomBrandingLogo } from "../../lib/branding.js";
import "./seller-forgot-password-2026.css";

const STORED_EMAIL_KEY = "seller_forgot_password_email";
const RESEND_COOLDOWN_SECONDS = 45;
const FALLBACK_ERROR_MESSAGE =
  "Unable to send reset link. Please check your email and try again.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getBenefits = (t) => [
  {
    title: t("forgot.Secure & Safe"),
    description: t("forgot.Your recovery request is protected from start to finish."),
    Icon: LockKeyhole,
  },
  {
    title: t("forgot.Quick Recovery"),
    description: t("forgot.Use one secure link to create your new password."),
    Icon: Mail,
  },
  {
    title: t("forgot.Protected Access"),
    description: t("forgot.Return to a workspace verified for your seller account."),
    Icon: ShieldCheck,
  },
];

const getRecoverySteps = (t) => [
  {
    title: t("forgot.Check your inbox"),
    description: t("forgot.We'll send a reset link to your email address."),
    Icon: Mail,
  },
  {
    title: t("forgot.Open the link"),
    description: t("forgot.Follow the secure link before it expires."),
    Icon: ArrowRight,
  },
  {
    title: t("forgot.Create a new password"),
    description: t("forgot.Set a new password and sign in again."),
    Icon: KeyRound,
  },
];

const readStoredEmail = () => {
  try {
    return String(window.localStorage.getItem(STORED_EMAIL_KEY) || "").trim();
  } catch {
    return "";
  }
};

const storeEmail = (email) => {
  try {
    window.localStorage.setItem(STORED_EMAIL_KEY, email);
  } catch {
    // Storage can be unavailable in private or automated browser contexts.
  }
};

export default function SellerForgotPasswordPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const { branding } = useStoreBranding();
  const { i18n, t } = useTranslation("seller");
  const startedAtRef = useRef(Date.now());
  const emailRef = useRef(null);
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setEmail(readStoredEmail());
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const validateEmail = () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setFieldError(t("forgot.Email address is required."));
      return false;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setFieldError(t("signup.Enter a valid email address."));
      return false;
    }
    setFieldError("");
    return true;
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (fieldError) setFieldError("");
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || cooldown > 0) return;

    setSubmitError("");
    setSuccessMessage("");
    if (!validateEmail()) return;

    const normalizedEmail = email.trim();
    setIsSubmitting(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: normalizedEmail,
        scope: "seller",
        honeypot: "",
        startedAt: startedAtRef.current,
      });
      setEmail(normalizedEmail);
      storeEmail(normalizedEmail);
      setSuccessMessage(
        response?.data?.message ||
          t("forgot.If an account matches that email, a password reset link has been sent.")
      );
      setCooldown(RESEND_COOLDOWN_SECONDS);
      startedAtRef.current = Date.now();
    } catch (error) {
      setSubmitError(error?.response?.data?.message || t("forgot.Unable to send reset link. Please check your email and try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="seller-forgot-page">
      <section
        className="seller-forgot-shell"
        aria-labelledby="seller-forgot-title"
      >
        <div className="seller-forgot-hero">
          <div className="seller-forgot-hero__rings" aria-hidden="true" />

          <div className="seller-forgot-brand">
            <span 
              className="seller-forgot-brand__mark" 
              aria-hidden="true"
              style={hasCustomBrandingLogo(branding?.sellerLogoUrl) ? { background: "transparent", boxShadow: "none" } : undefined}
            >
              {hasCustomBrandingLogo(branding?.sellerLogoUrl) ? (
                <img 
                  src={getWorkspaceLogoUrl("seller", branding?.sellerLogoUrl)} 
                  alt="Seller Workspace Logo" 
                  className="h-full w-full object-contain" 
                />
              ) : (
                <ShoppingBag size={24} strokeWidth={2.2} />
              )}
            </span>
            <span>
              <strong>
                TP <b>Preneurs</b>
              </strong>
              <small>Seller Workspace</small>
            </span>
          </div>

          <div className="seller-forgot-hero__content">
            <p className="seller-forgot-eyebrow">{t("forgot.Account recovery")}</p>
            <h1>
              {t("forgot.Let's get you")} <span>{t("forgot.back to your store.")}</span>
            </h1>
            <p className="seller-forgot-hero__intro">
              {t("forgot.Enter your seller account email and we'll send a secure link to reset your password.")}
            </p>

            <div className="seller-forgot-benefits">
              {getBenefits(t).map(({ title, description, Icon }) => (
                <div className="seller-forgot-benefit" key={title}>
                  <span aria-hidden="true">
                    <Icon size={21} strokeWidth={2} />
                  </span>
                  <p>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="seller-forgot-illustration" aria-hidden="true">
            <div className="seller-forgot-shop">
              <div className="seller-forgot-shop__sign">Your Store</div>
              <div className="seller-forgot-shop__awning">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="seller-forgot-shop__building">
                <div className="seller-forgot-shop__window">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="seller-forgot-shop__door" />
              </div>
            </div>
            <div className="seller-forgot-lock">
              <span />
              <KeyRound size={34} strokeWidth={2.3} />
            </div>
            <div className="seller-forgot-plant">
              <span />
              <span />
              <span />
              <i />
            </div>
          </div>

          <div className="seller-forgot-return">
            <p>
              <strong>{t("forgot.Remember your password?")}</strong>
              <small>{t("forgot.Sign in to access your seller workspace.")}</small>
            </p>
            <Link to="/seller/login">
              {t("forgot.Back to Seller Login")} <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="seller-forgot-form-panel">
          <div className="seller-forgot-topbar">
            <button
              type="button"
              className="seller-forgot-icon-btn"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <select
              className="seller-forgot-lang-select"
              value={i18n.language?.startsWith("id") ? "id" : "en"}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              aria-label="Select language"
            >
              <option value="en">English</option>
              <option value="id">Indonesia</option>
            </select>
          </div>

          <div className="seller-forgot-card">
            <div className="seller-forgot-card__heading">
              <span className="seller-forgot-card__icon" aria-hidden="true">
                <Mail size={34} strokeWidth={2.1} />
                <LockKeyhole size={18} strokeWidth={2.5} />
              </span>
              <p className="seller-forgot-eyebrow">{t("forgot.Secure reset")}</p>
              <h2 id="seller-forgot-title">
                {t("forgot.Forgot")} <span>{t("forgot.Password?")}</span>
              </h2>
              <p>{t("forgot.No worries. Enter your email and we'll send you a reset link.")}</p>
            </div>

            <form className="seller-forgot-form" onSubmit={handleSubmit} noValidate>
              <div className="seller-forgot-field">
                <label htmlFor="seller-forgot-email">{t("signup.Email Address")}</label>
                <div
                  className={`seller-forgot-input ${
                    fieldError ? "seller-forgot-input--error" : ""
                  }`}
                >
                  <Mail size={19} aria-hidden="true" />
                  <input
                    id="seller-forgot-email"
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder={t("signup.Enter your email address")}
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={
                      fieldError ? "seller-forgot-email-error" : undefined
                    }
                  />
                </div>
                {fieldError ? (
                  <p
                    className="seller-forgot-field__error"
                    id="seller-forgot-email-error"
                    role="alert"
                  >
                    {fieldError}
                  </p>
                ) : null}
              </div>

              {submitError ? (
                <div className="seller-forgot-alert is-error" role="alert">
                  <ShieldCheck size={18} aria-hidden="true" />
                  <span>{submitError}</span>
                </div>
              ) : null}

              {successMessage ? (
                <div className="seller-forgot-alert is-success" role="status">
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>{successMessage}</span>
                </div>
              ) : null}

              <button
                className="seller-forgot-submit"
                type="submit"
                disabled={isSubmitting || cooldown > 0}
              >
                <Send size={19} aria-hidden="true" />
                <span>
                  {isSubmitting
                    ? t("forgot.Sending...")
                    : cooldown > 0
                      ? `${t("forgot.Resend in")} ${cooldown}s`
                      : successMessage
                        ? t("forgot.Resend Reset Link")
                        : t("forgot.Send Reset Link")}
                </span>
              </button>
            </form>

            <div className="seller-forgot-steps" aria-label="Password recovery steps">
              {getRecoverySteps(t).map(({ title, description, Icon }, index) => (
                <div className="seller-forgot-step" key={title}>
                  <span aria-hidden="true">
                    <Icon size={18} strokeWidth={2.2} />
                  </span>
                  <p>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </p>
                  <b aria-hidden="true">0{index + 1}</b>
                </div>
              ))}
            </div>

            <div className="seller-forgot-card__links">
              <Link to="/seller/login">
                <ArrowRight size={16} aria-hidden="true" />
                {t("forgot.Back to Seller Login")}
              </Link>
              <p>
                {t("signup.Need help?")} <Link to="/contact-us">{t("signup.Contact Support")}</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="seller-forgot-support" aria-label="Seller support">
        <span aria-hidden="true">
          <Headphones size={24} strokeWidth={2} />
        </span>
        <p>
          <strong>{t("signup.Need help?")}</strong>
          <small>{t("forgot.Our support team is here to help you 24/7.")}</small>
        </p>
        <Link to="/contact-us">
          <Headphones size={18} aria-hidden="true" />
          {t("signup.Contact Support")}
        </Link>
      </section>

      <footer className="seller-forgot-footer">
        &copy; 2026 TP Preneurs. All rights reserved.
      </footer>
    </main>
  );
}
