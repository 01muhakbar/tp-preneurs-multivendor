import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Headphones,
  Inbox,
  LinkIcon,
  Loader2,
  Mail,
  Moon,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sun,
  UserRound,
  XCircle,
} from "lucide-react";
import { api } from "../../api/axios.ts";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import useStoreBranding from "../../hooks/useStoreBranding.js";
import { getWorkspaceLogoUrl, hasCustomBrandingLogo } from "../../lib/branding.js";
import "./seller-verify-email-2026.css";

const STORE_APPLICATION_PATH = "/seller/store-application?from=seller-verify-email";
const LOGIN_THEN_APPLICATION_PATH =
  "/auth/login?next=/seller/store-application?from=seller-verify-email";

const LS_EMAIL_KEY = "seller_verify_email_address";
const LS_VERIFICATION_ID_KEY = "seller_verify_verification_id";

const RESEND_COOLDOWN_SECONDS = 45;

const TIMELINE_STEPS = [
  {
    Icon: Inbox,
    title: "Check your inbox",
    text: "Look for an email from TP Preneurs in your inbox or spam folder.",
  },
  {
    Icon: LinkIcon,
    title: "Enter the verification code",
    text: "Type the 6-digit code from the email to confirm your address.",
  },
  {
    Icon: UserRound,
    title: "Continue seller application",
    text: "Once verified, you'll be redirected to continue your seller onboarding.",
  },
];

/* ── Helpers ──────────────────────────────────────────── */

const maskEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  const at = email.indexOf("@");
  if (at <= 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const keep = Math.min(4, Math.floor(local.length / 2));
  return `${local.slice(0, keep)}${"*".repeat(Math.max(1, local.length - keep))}${domain}`;
};

const getEmailProvider = (email) => {
  if (!email) return null;
  const domain = email.split("@")[1]?.toLowerCase() || "";
  if (domain.includes("gmail") || domain.includes("googlemail"))
    return { label: "Gmail", url: "https://mail.google.com/mail/u/0/#inbox" };
  if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live"))
    return { label: "Outlook", url: "https://outlook.live.com/mail/0/inbox" };
  if (domain.includes("yahoo"))
    return { label: "Yahoo Mail", url: "https://mail.yahoo.com/" };
  return null;
};

const readLocalStorage = (key) => {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};

const writeLocalStorage = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
};

/* ── Component ───────────────────────────────────────── */

export default function SellerVerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { resolvedTheme, setTheme } = useTheme();
  const { branding } = useStoreBranding();
  const cooldownRef = useRef(null);

  /* resolve email */
  const [email] = useState(() => {
    const fromState = location.state?.email;
    const fromParam = searchParams.get("email");
    const fromStorage = readLocalStorage(LS_EMAIL_KEY);
    return (fromState || fromParam || fromStorage || "").trim().toLowerCase();
  });

  /* resolve verificationId */
  const [verificationId, setVerificationId] = useState(() => {
    const fromState =
      location.state?.verificationId ||
      location.state?.pendingRegistration?.verification?.verificationId ||
      location.state?.pendingRegistration?.verificationId;
    const fromStorage = readLocalStorage(LS_VERIFICATION_ID_KEY);
    return fromState || fromStorage || "";
  });

  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [status, setStatus] = useState("sent"); // sent | verifying | verified | failed
  const [message, setMessage] = useState("Verification email sent successfully!");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);

  const continueToApplication = useCallback(async () => {
    try {
      const response = await api.get("/auth/account/me", { withCredentials: true });
      const user =
        response?.data?.data?.user || response?.data?.user || response?.data?.id;
      navigate(user ? STORE_APPLICATION_PATH : LOGIN_THEN_APPLICATION_PATH, {
        replace: true,
      });
    } catch {
      navigate(LOGIN_THEN_APPLICATION_PATH, { replace: true });
    }
  }, [navigate]);

  /* persist email + verificationId */
  useEffect(() => {
    if (email) writeLocalStorage(LS_EMAIL_KEY, email);
  }, [email]);

  useEffect(() => {
    if (verificationId) writeLocalStorage(LS_VERIFICATION_ID_KEY, verificationId);
  }, [verificationId]);

  /* cooldown timer */
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    cooldownRef.current = window.setTimeout(() => {
      setCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearTimeout(cooldownRef.current);
  }, [cooldown]);

  /* ── Verify OTP ──────────────────────────────────── */
  const handleVerifyOtp = useCallback(async () => {
    if (!verificationId) {
      setOtpError("Verification session expired. Please register again.");
      setStatus("failed");
      return;
    }
    const code = otpCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setOtpError("Please enter a valid 6-digit verification code.");
      return;
    }

    setOtpError("");
    setStatus("verifying");
    setMessage("Verifying your code...");
    setError("");

    try {
      const response = await api.post(
        "/auth/register/verify-otp",
        { verificationId, otpCode: code },
        { withCredentials: true }
      );
      setStatus("verified");
      setMessage(response?.data?.message || "Your email has been verified successfully!");
      writeLocalStorage(LS_EMAIL_KEY, "");
      writeLocalStorage(LS_VERIFICATION_ID_KEY, "");

      /* auto-redirect after short delay */
      setTimeout(() => {
        continueToApplication();
      }, 1800);
    } catch (err) {
      setStatus("failed");
      const serverMsg =
        err?.response?.data?.message || "The verification code is invalid or expired.";
      setOtpError(serverMsg);
      setMessage("");
      setError(serverMsg);
    }
  }, [verificationId, otpCode, continueToApplication]);

  /* ── Resend ──────────────────────────────────────── */
  const handleResend = useCallback(async () => {
    if (isResending || cooldown > 0 || !verificationId) return;
    setIsResending(true);
    setError("");
    setOtpError("");

    try {
      const response = await api.post(
        "/auth/register/resend-otp",
        { verificationId },
        { withCredentials: true }
      );

      const newVerificationId =
        response?.data?.data?.pendingRegistration?.verification?.verificationId ||
        response?.data?.data?.pendingRegistration?.verificationId;
      if (newVerificationId) {
        setVerificationId(newVerificationId);
      }

      setStatus("sent");
      setMessage(response?.data?.message || "A new verification code has been sent.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to resend verification email. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  }, [isResending, cooldown, verificationId]);

  /* ── Continue to Application ─────────────────────── */
  const handleContinue = useCallback(async () => {
    setIsContinuing(true);
    try {
      await continueToApplication();
    } finally {
      setIsContinuing(false);
    }
  }, [continueToApplication]);

  /* ── Open Email ──────────────────────────────────── */
  const emailProvider = getEmailProvider(email);
  const openEmailUrl = emailProvider?.url || (email ? `mailto:${email}` : "mailto:");
  const openEmailLabel = emailProvider
    ? `Open ${emailProvider.label}`
    : "Open Email App";

  /* ── Derived ─────────────────────────────────────── */
  const masked = maskEmail(email);
  const isVerified = status === "verified";
  const isVerifying = status === "verifying";

  const statusIcon =
    status === "verified" ? (
      <CheckCircle2 size={18} />
    ) : status === "failed" ? (
      <XCircle size={18} />
    ) : status === "verifying" ? (
      <Loader2 size={18} className="sv-spin" />
    ) : (
      <CheckCircle2 size={18} />
    );

  return (
    <main className="sv-page">
      <section className="sv-shell" aria-labelledby="sv-title">
        {/* ════ LEFT PANEL ════ */}
        <aside className="sv-hero">
          <div className="sv-hero__glow" aria-hidden="true" />

          <div className="sv-brand">
            <span
              className="sv-brand__mark"
              aria-hidden="true"
              style={
                hasCustomBrandingLogo(branding?.sellerLogoUrl)
                  ? { background: "transparent", boxShadow: "none" }
                  : undefined
              }
            >
              {hasCustomBrandingLogo(branding?.sellerLogoUrl) ? (
                <img
                  src={getWorkspaceLogoUrl("seller", branding?.sellerLogoUrl)}
                  alt="Seller Workspace Logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <ShoppingBag size={25} strokeWidth={2.3} />
              )}
            </span>
            <span>
              <strong>
                TP <b>Preneurs</b>
              </strong>
              <small>Seller Workspace</small>
            </span>
          </div>

          <div className="sv-hero__content">
            <span className="sv-pill">
              <ShieldCheck size={15} />
              Account Verification
            </span>

            <h1>
              Verify your email.
              <br />
              <em>Start your seller journey.</em>
            </h1>

            <p>
              We&apos;ve sent a secure verification code to your email address.
              Please check your inbox and verify your account before continuing to
              your seller onboarding.
            </p>

            <div className="sv-timeline">
              {TIMELINE_STEPS.map(({ Icon, title, text }) => (
                <div className="sv-timeline__step" key={title}>
                  <span className="sv-timeline__icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={2.2} />
                  </span>
                  <div className="sv-timeline__text">
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* illustration */}
          <div className="sv-illustration" aria-hidden="true">
            <div className="sv-scene">
              <div className="sv-scene__platform" />
              <div className="sv-scene__store" />
              <div className="sv-scene__mail" />
              <div className="sv-scene__shield">
                <Check size={18} strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* wrong email card */}
          <div className="sv-wrong-email">
            <span className="sv-wrong-email__icon" aria-hidden="true">
              <Mail size={20} />
            </span>
            <span>
              <strong>Wrong email address?</strong>
              <small>Update your email or go back to create account.</small>
            </span>
            <Link to="/seller/create-account">
              Update Email <ArrowRight size={14} />
            </Link>
          </div>
        </aside>

        {/* ════ RIGHT PANEL ════ */}
        <section className="sv-form-panel">
          {/* theme toggle */}
          <div className="sv-theme" role="group" aria-label="Choose appearance">
            <button
              type="button"
              className={resolvedTheme === "light" ? "is-active" : ""}
              onClick={() => setTheme("light")}
              aria-label="Use light theme"
              aria-pressed={resolvedTheme === "light"}
            >
              <Sun size={16} aria-hidden="true" /> Light
            </button>
            <button
              type="button"
              className={resolvedTheme === "dark" ? "is-active" : ""}
              onClick={() => setTheme("dark")}
              aria-label="Use dark theme"
              aria-pressed={resolvedTheme === "dark"}
            >
              <Moon size={16} aria-hidden="true" /> Dark
            </button>
          </div>

          <div className="sv-card">
            {/* mail illustration */}
            <div className="sv-mail-hero" aria-hidden="true">
              <div className="sv-mail-hero__envelope" />
              <div className="sv-mail-hero__badge">
                <Check size={16} strokeWidth={3} />
              </div>
              <div className="sv-mail-hero__dot" />
              <div className="sv-mail-hero__dot" />
              <div className="sv-mail-hero__dot" />
            </div>

            <h2 id="sv-title">Verify Your Email</h2>
            <p>
              We sent a verification code to your email address. Please verify
              your account to continue to Seller Workspace.
            </p>

            {/* status banner */}
            {(message || error) && (
              <div
                className={`sv-status sv-status--${status}`}
                role={status === "failed" ? "alert" : "status"}
              >
                {statusIcon}
                <span>{message || error}</span>
              </div>
            )}

            {/* email card */}
            {masked && (
              <div className="sv-email-card">
                <span className="sv-email-card__icon" aria-hidden="true">
                  <Mail size={20} />
                </span>
                <div className="sv-email-card__details">
                  <small>Email Address</small>
                  <strong>{masked}</strong>
                </div>
              </div>
            )}

            {/* OTP input */}
            {!isVerified && (
              <div className="sv-otp-section">
                <label htmlFor="sv-otp-code">Enter verification code</label>
                <input
                  id="sv-otp-code"
                  className={`sv-otp-input${otpError ? " has-error" : ""}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtpCode(val);
                    if (otpError) setOtpError("");
                    if (status === "failed") setStatus("sent");
                  }}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  aria-invalid={Boolean(otpError)}
                  aria-describedby={otpError ? "sv-otp-error" : undefined}
                  disabled={isVerifying}
                />
                {otpError && (
                  <p className="sv-otp-error" id="sv-otp-error">
                    {otpError}
                  </p>
                )}
                <button
                  type="button"
                  className="sv-otp-submit"
                  onClick={handleVerifyOtp}
                  disabled={isVerifying || otpCode.length !== 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={17} /> Verifying...
                    </>
                  ) : (
                    <>
                      <Check size={17} /> Verify Code
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Open Email App */}
            <a
              className="sv-btn-primary"
              href={openEmailUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail size={19} />
              {openEmailLabel}
              <ExternalLink size={14} />
            </a>

            {/* Resend */}
            <button
              type="button"
              className="sv-btn-secondary"
              onClick={handleResend}
              disabled={isResending || cooldown > 0 || isVerified || !verificationId}
            >
              <RefreshCw size={17} />
              {isResending
                ? "Sending..."
                : "Resend Verification Email"}
            </button>

            {cooldown > 0 && (
              <p className="sv-cooldown">
                You can resend again in <b>{cooldown}s</b>
              </p>
            )}

            {/* Use different email */}
            <div className="sv-different-email">
              <Link to="/seller/create-account">Use a different email</Link>
            </div>

            {/* Separator + continue */}
            <button
              type="button"
              className="sv-btn-continue"
              onClick={handleContinue}
              disabled={isContinuing}
            >
              {isContinuing ? (
                <>
                  <Loader2 size={17} /> Checking session...
                </>
              ) : (
                <>
                  Continue Seller Application
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            {/* secure note */}
            <div className="sv-secure">
              <ShieldCheck size={16} />
              Secure verification required for seller onboarding.
            </div>
          </div>
        </section>
      </section>

      {/* ════ SUPPORT BAR ════ */}
      <section className="sv-support">
        <span aria-hidden="true">
          <Headphones size={25} />
        </span>
        <p>
          <strong>Need help?</strong>
          <small>
            Our support team is here to help you with any issues related to
            email verification.
          </small>
        </p>
        <Link to="/contact-us">
          <Headphones size={18} aria-hidden="true" /> Contact Support
        </Link>
      </section>

      <footer className="sv-footer">
        © 2026 TP Preneurs. All rights reserved.
      </footer>
    </main>
  );
}
