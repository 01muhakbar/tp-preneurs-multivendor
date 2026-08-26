import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  LockKeyhole,
  Mail,
  Moon,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Store,
  Sun,
  UserRound,
} from "lucide-react";
import { api } from "../../api/axios.ts";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useTranslation } from "react-i18next";
import useStoreBranding from "../../hooks/useStoreBranding.js";
import { getWorkspaceLogoUrl, hasCustomBrandingLogo } from "../../lib/branding.js";
import "./seller-create-account-2026.css";

const STORE_APPLICATION_PATH = "/user/store-application?from=seller-create-account";
const LOGIN_AFTER_REGISTRATION_PATH =
  "/auth/login?registered=1&next=/user/store-application?from=seller-create-account";

const getBenefits = (t) => [
  {
    title: t("signup.Your Store, Your Brand"),
    description: t("signup.Customize your storefront and build a brand customers remember."),
    Icon: Store,
  },
  {
    title: t("signup.Powerful Dashboard"),
    description: t("signup.Manage products, orders, and business insights in one place."),
    Icon: BarChart3,
  },
  {
    title: t("signup.Secure & Reliable"),
    description: t("signup.Your account and store access are protected at every step."),
    Icon: ShieldCheck,
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getSafeInternalPath = (value) => {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return null;

  try {
    const target = new URL(candidate, window.location.origin);
    return target.origin === window.location.origin
      ? `${target.pathname}${target.search}${target.hash}`
      : null;
  } catch {
    return null;
  }
};

const getResponseData = (response) => response?.data?.data || response?.data || {};

const getPhoneNumber = (phone) => {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("62")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return `+62${digits}`;
};

export default function SellerCreateAccountPage() {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { branding } = useStoreBranding();
  const { i18n, t } = useTranslation("seller");
  const startedAtRef = useRef(Date.now());
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(null);

  const passwordRules = useMemo(
    () => [
      { label: t("signup.At least 8 characters"), met: password.length >= 8 },
      { label: t("signup.One uppercase letter"), met: /[A-Z]/.test(password) },
      { label: t("signup.One number or symbol"), met: /[\d\W_]/.test(password) },
    ],
    [password, t]
  );

  const clearFieldError = (name) => {
    setFieldErrors((current) => {
      if (!current[name]) return current;
      return { ...current, [name]: "" };
    });
  };

  const validate = () => {
    const errors = {};
    if (!fullName.trim()) errors.fullName = t("signup.Enter your full name.");
    if (!email.trim()) {
      errors.email = t("signup.Enter your email address.");
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = t("signup.Enter a valid email address.");
    }
    if (!phone.trim()) {
      errors.phone = t("signup.Enter your phone number.");
    } else {
      const cleanPhone = phone.trim().replace(/[- ]/g, "");
      if (!/^(?:\+62|62|0)8[1-9][0-9]{6,11}$/.test(cleanPhone)) {
        errors.phone = t("signup.Enter a valid Indonesian phone number starting with +62 or 08.");
      }
    }
    if (!password) {
      errors.password = t("signup.Create a password.");
    } else if (!passwordRules.every((rule) => rule.met)) {
      errors.password = t("signup.Your password must meet all three requirements.");
    }
    if (!confirmPassword) {
      errors.confirmPassword = t("signup.Confirm your password.");
    } else if (confirmPassword !== password) {
      errors.confirmPassword = t("signup.Passwords do not match.");
    }
    if (!agree) errors.agree = t("signup.You must agree to the Terms and Privacy Policy.");

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setSuccessMessage("");
    setPendingVerification(null);

    if (!validate()) return;

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const phoneNumber = getPhoneNumber(phone);
    setIsSubmitting(true);

    try {
      const response = await api.post("/auth/register", {
        name: normalizedName,
        fullName: normalizedName,
        email: normalizedEmail,
        phone: phoneNumber,
        phoneNumber,
        password,
        passwordConfirm: confirmPassword,
        confirmPassword,
        passwordConfirmation: confirmPassword,
        termsAccepted: agree,
        honeypot: "",
        startedAt: startedAtRef.current,
        roleIntent: "seller",
        onboardingIntent: "seller",
        source: "seller_create_account",
      });

      const responseData = getResponseData(response);
      const safeRedirect = getSafeInternalPath(
        responseData?.redirectTo || responseData?.next || response?.data?.redirectTo || response?.data?.next
      );
      const verification =
        responseData?.pendingRegistration ||
        responseData?.pendingVerification ||
        responseData?.verification ||
        null;
      const requiresVerification =
        Boolean(verification) ||
        response?.data?.code === "VERIFICATION_REQUIRED" ||
        responseData?.requiresEmailVerification === true ||
        responseData?.emailVerificationRequired === true;

      if (safeRedirect) {
        navigate(safeRedirect, { replace: true });
        return;
      }

      if (requiresVerification) {
        try {
          localStorage.setItem("seller_verify_email_address", normalizedEmail);
          const vid = verification?.verification?.verificationId || verification?.verificationId || "";
          if (vid) localStorage.setItem("seller_verify_verification_id", vid);
        } catch { /* storage unavailable */ }
        navigate(
          `/seller/verify-email?email=${encodeURIComponent(normalizedEmail)}`,
          {
            replace: true,
            state: {
              email: normalizedEmail,
              verificationId: verification?.verification?.verificationId || verification?.verificationId,
              pendingRegistration: verification,
            },
          }
        );
        return;
      }

      let hasSession = Boolean(
        responseData?.user || responseData?.session || responseData?.authenticated
      );
      if (!hasSession) {
        try {
          const sessionResponse = await api.get("/auth/account/me");
          hasSession = Boolean(
            sessionResponse?.data?.data?.user ||
              sessionResponse?.data?.user ||
              sessionResponse?.data?.id
          );
        } catch {
          hasSession = false;
        }
      }

      navigate(hasSession ? STORE_APPLICATION_PATH : LOGIN_AFTER_REGISTRATION_PATH, {
        replace: true,
      });
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message ||
          t("signup.Unable to create your seller account. Please review your details and try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueToVerification = () => {
    navigate("/seller/verify-email", {
      state: {
        pendingRegistration: pendingVerification,
        email: email.trim().toLowerCase(),
      },
    });
  };

  return (
    <main className="seller-create-page">
      <section className="seller-create-shell" aria-labelledby="seller-create-title">
        <aside className="seller-create-hero">
          <div className="seller-create-hero__glow" aria-hidden="true" />
          <div className="seller-create-brand">
            <span 
              className="seller-create-brand__mark" 
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
                <ShoppingBag size={25} strokeWidth={2.3} />
              )}
            </span>
            <span>
              <strong>TP <b>Preneurs</b></strong>
              <small>Seller Workspace</small>
            </span>
          </div>

          <div className="seller-create-hero__content">
            <h1>{t("signup.Start selling.")}<br /><em>{t("signup.Grow your store.")}</em></h1>
            <p>{t("signup.Create your seller account and take the first step toward building your business on TP Preneurs.")}</p>
            <div className="seller-create-benefits">
              {getBenefits(t).map(({ title, description, Icon }) => (
                <article className="seller-create-benefit" key={title}>
                  <span aria-hidden="true"><Icon size={23} strokeWidth={2.2} /></span>
                  <div>
                    <h2>{title}</h2>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="seller-create-shop" aria-hidden="true">
            <div className="seller-create-shop__halo" />
            <div className="seller-create-shop__roof" />
            <div className="seller-create-shop__awning"><i /><i /><i /><i /><i /></div>
            <div className="seller-create-shop__building">
              <span className="seller-create-shop__window"><b /><b /><b /></span>
              <span className="seller-create-shop__door" />
            </div>
            <div className="seller-create-shop__bag">TP</div>
            <div className="seller-create-shop__plant seller-create-shop__plant--left"><i /><i /><i /></div>
            <div className="seller-create-shop__plant seller-create-shop__plant--right"><i /><i /><i /></div>
          </div>

          <div className="seller-create-login-card">
            <span><strong>{t("signup.Already have an account?")}</strong><small>{t("signup.Sign in to access your seller workspace.")}</small></span>
            <Link to="/seller/login">{t("signup.Back to Login")} <ArrowRight size={17} /></Link>
          </div>
        </aside>

        <section className="seller-create-form-panel">
          <div className="seller-create-topbar">
            <button
              type="button"
              className="seller-create-icon-btn"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <select
              className="seller-create-lang-select"
              value={i18n.language?.startsWith("id") ? "id" : "en"}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              aria-label="Select language"
            >
              <option value="en">English</option>
              <option value="id">Indonesia</option>
            </select>
          </div>

          <div className="seller-create-card">
            <header className="seller-create-card__header">
              <span className="seller-create-card__icon" aria-hidden="true"><UserRound size={31} /><i>+</i></span>
              <h2 id="seller-create-title">{t("signup.Create")} <em>{t("signup.Seller")}</em> {t("signup.Account")}</h2>
              <p>{t("signup.Join TP Preneurs and start growing your business today.")}</p>
            </header>

            <form className="seller-create-form" onSubmit={handleSubmit} noValidate>
              <div className="seller-create-field">
                <label htmlFor="seller-create-name">{t("signup.Full Name")}</label>
                <div className={`seller-create-input ${fieldErrors.fullName ? "has-error" : ""}`}>
                  <UserRound size={18} aria-hidden="true" />
                  <input id="seller-create-name" value={fullName} onChange={(event) => { setFullName(event.target.value); clearFieldError("fullName"); }} type="text" autoComplete="name" placeholder={t("signup.Enter your full name")} aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? "seller-create-name-error" : undefined} />
                </div>
                {fieldErrors.fullName ? <p id="seller-create-name-error" className="seller-create-field__error">{fieldErrors.fullName}</p> : null}
              </div>

              <div className="seller-create-field">
                <label htmlFor="seller-create-email">{t("signup.Email Address")}</label>
                <div className={`seller-create-input ${fieldErrors.email ? "has-error" : ""}`}>
                  <Mail size={18} aria-hidden="true" />
                  <input id="seller-create-email" value={email} onChange={(event) => { setEmail(event.target.value); clearFieldError("email"); }} type="email" inputMode="email" autoComplete="email" placeholder={t("signup.Enter your email address")} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "seller-create-email-error" : undefined} />
                </div>
                {fieldErrors.email ? <p id="seller-create-email-error" className="seller-create-field__error">{fieldErrors.email}</p> : null}
              </div>

              <div className="seller-create-field">
                <label htmlFor="seller-create-phone">{t("signup.WhatsApp / Phone number")}</label>
                <div className="seller-create-phone-row">
                  <div className="seller-create-fixed-code" aria-label="Country calling code">
                    <svg aria-hidden="true" className="seller-create-fixed-flag" viewBox="0 0 3 2" width="18" height="13" style={{ borderRadius: '1.5px', border: '1px solid rgba(128, 128, 128, 0.15)', display: 'block', overflow: 'hidden' }}>
                      <rect width="3" height="1" fill="#ed2939" />
                      <rect y="1" width="3" height="1" fill="#ffffff" />
                    </svg>
                    <span className="seller-create-fixed-num">+62</span>
                  </div>
                  <div className={`seller-create-input ${fieldErrors.phone ? "has-error" : ""}`}>
                    <Phone size={18} aria-hidden="true" />
                    <input id="seller-create-phone" value={phone} onChange={(event) => { setPhone(event.target.value); clearFieldError("phone"); }} type="tel" inputMode="tel" autoComplete="tel-national" placeholder={t("signup.Enter your phone number")} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "seller-create-phone-error" : undefined} />
                  </div>
                </div>
                {fieldErrors.phone ? <p id="seller-create-phone-error" className="seller-create-field__error">{fieldErrors.phone}</p> : null}
              </div>

              <div className="seller-create-field">
                <label htmlFor="seller-create-password">{t("signup.Password")}</label>
                <div className={`seller-create-input ${fieldErrors.password ? "has-error" : ""}`}>
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input id="seller-create-password" value={password} onChange={(event) => { setPassword(event.target.value); clearFieldError("password"); }} type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder={t("signup.Create a strong password")} aria-invalid={Boolean(fieldErrors.password)} aria-describedby="seller-create-password-rules" />
                  <button type="button" className="seller-create-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {fieldErrors.password ? <p className="seller-create-field__error">{fieldErrors.password}</p> : null}
              </div>

              <div className="seller-create-field">
                <label htmlFor="seller-create-password-confirm">{t("signup.Confirm Password")}</label>
                <div className={`seller-create-input ${fieldErrors.confirmPassword ? "has-error" : ""}`}>
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input id="seller-create-password-confirm" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); clearFieldError("confirmPassword"); }} type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder={t("signup.Confirm your password")} aria-invalid={Boolean(fieldErrors.confirmPassword)} aria-describedby={fieldErrors.confirmPassword ? "seller-create-confirm-error" : undefined} />
                  <button type="button" className="seller-create-password-toggle" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"} aria-pressed={showConfirmPassword}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {fieldErrors.confirmPassword ? <p id="seller-create-confirm-error" className="seller-create-field__error">{fieldErrors.confirmPassword}</p> : null}
              </div>

              <div className="seller-create-rules" id="seller-create-password-rules">
                {passwordRules.map((rule) => <span className={rule.met ? "is-met" : ""} key={rule.label}><CheckCircle2 size={15} aria-hidden="true" />{rule.label}</span>)}
              </div>

              <div>
                <label className="seller-create-agreement">
                  <input type="checkbox" checked={agree} onChange={(event) => { setAgree(event.target.checked); clearFieldError("agree"); }} aria-invalid={Boolean(fieldErrors.agree)} aria-describedby={fieldErrors.agree ? "seller-create-agree-error" : undefined} />
                  <span className="seller-create-checkbox" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
                  <span>{t("signup.I agree to the")} <Link to="/terms-and-conditions">{t("signup.Terms of Service")}</Link> {t("signup.and")} <Link to="/privacy-policy">{t("signup.Privacy Policy")}</Link>.</span>
                </label>
                {fieldErrors.agree ? <p id="seller-create-agree-error" className="seller-create-field__error">{fieldErrors.agree}</p> : null}
              </div>

              {submitError ? <div className="seller-create-alert seller-create-alert--error" role="alert"><ShieldCheck size={18} aria-hidden="true" /><span>{submitError}</span></div> : null}
              {successMessage ? (
                <div className="seller-create-alert seller-create-alert--success" role="status">
                  <CheckCircle2 size={19} aria-hidden="true" />
                  <span>{successMessage}</span>
                  {pendingVerification ? <button type="button" onClick={continueToVerification}>{t("signup.Continue to email verification")} <ArrowRight size={15} /></button> : null}
                </div>
              ) : null}

              <button className="seller-create-submit" type="submit" disabled={isSubmitting}>
                <UserRound size={19} aria-hidden="true" />
                {isSubmitting ? t("signup.Creating Account...") : t("signup.Create Account")}
              </button>
            </form>

            <div className="seller-create-form-links">
              <p>
                {t("signup.Already have an account?")}{" "}
                <Link to="/seller/login">{t("signup.Back to Login")}</Link>
              </p>
            </div>

            <div className="seller-create-next-step">
              <ShieldCheck size={18} aria-hidden="true" />
              <p><strong>{t("signup.What happens next?")}</strong>{t("signup.Your seller application is reviewed before any store is activated.")}</p>
            </div>
          </div>
        </section>
      </section>

      <section className="seller-create-support">
        <span aria-hidden="true"><Headphones size={25} /></span>
        <p><strong>{t("signup.Need help?")}</strong><small>{t("signup.Our support team is here to help you anytime.")}</small></p>
        <Link to="/contact-us"><Headphones size={18} aria-hidden="true" /> {t("signup.Contact Support")}</Link>
      </section>

      <footer className="seller-create-footer">© 2026 TP Preneurs. All rights reserved.</footer>
    </main>
  );
}
