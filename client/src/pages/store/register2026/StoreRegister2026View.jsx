import {
  ArrowLeft,
  ArrowRight,
  Box,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  LockKeyhole,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import "./store-register-2026.css";

const assignRef = (fieldRefs, key) => (node) => {
  if (fieldRefs?.current) {
    fieldRefs.current[key] = node;
  }
};

const benefitItems = [
  {
    icon: ShieldCheck,
    titleKey: "register.benefitSecure",
    textKey: "register.benefitSecureDesc",
  },
  {
    icon: Zap,
    titleKey: "register.benefitFast",
    textKey: "register.benefitFastDesc",
  },
  {
    icon: PackageCheck,
    titleKey: "register.benefitTrack",
    textKey: "register.benefitTrackDesc",
  },
  {
    icon: MapPin,
    titleKey: "register.benefitAddress",
    textKey: "register.benefitAddressDesc",
  },
];

const mobileBenefits = [
  { icon: Box, labelKey: "register.mobileLocal" },
  { icon: Truck, labelKey: "register.mobileFast" },
  { icon: ShieldCheck, labelKey: "register.mobileSecure" },
];

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p className="sr26-field-error" id={id}>
      {message}
    </p>
  );
}

function StatusNotice({ status, statusRef }) {
  if (!status.message) return null;
  return (
    <div
      ref={statusRef}
      className={`sr26-status sr26-status-${status.tone || "neutral"}`}
      role={status.tone === "error" ? "alert" : "status"}
      tabIndex={-1}
    >
      <Sparkles aria-hidden="true" size={16} />
      <span>{status.message}</span>
    </div>
  );
}

function PasswordStrength({ strength }) {
  const { t } = useTranslation();

  const labelKeyMap = {
    "Weak": "register.strengthWeak",
    "Fair": "register.strengthFair",
    "Good": "register.strengthGood",
    "Strong": "register.strengthStrong"
  };

  const translatedLabel = strength.label ? t(labelKeyMap[strength.label] || strength.label) : "";
  const translatedHelper = strength.helper === "Use at least 8 characters, including at least 1 letter and 1 number." ? t("register.passwordHelper") : strength.helper;

  return (
    <div className="sr26-strength" aria-label={`Password strength: ${translatedLabel || "empty"}`}>
      <div className="sr26-strength-bars" aria-hidden="true">
        {strength.segments.map((active, index) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={`sr26-strength-bar ${active ? `sr26-strength-bar-active sr26-strength-${strength.tone}` : ""}`}
          />
        ))}
      </div>
      <div className="sr26-strength-row">
        <span>{translatedHelper}</span>
        {translatedLabel ? <strong>{translatedLabel}</strong> : null}
      </div>
    </div>
  );
}

function RegisterForm({
  viewModel,
  fieldRefs,
  statusRef,
  onChange,
  onSubmit,
  onSignIn,
  onTogglePassword,
  onToggleConfirmPassword,
}) {
  const { form, status, errors, passwordStrength } = viewModel;
  const { t } = useTranslation();

  return (
    <form className="sr26-card sr26-register-card" onSubmit={onSubmit} noValidate>
      <div className="sr26-card-head">
        <div>
          <h1>{t("register.title")}</h1>
          <p>{t("register.subtitle")}</p>
        </div>
        <span className="sr26-secure-badge">
          <ShieldCheck aria-hidden="true" size={18} />
          {t("register.secureBadge")}
        </span>
      </div>

      <StatusNotice status={status} statusRef={statusRef} />

      <div className="sr26-honeypot" aria-hidden="true">
        <label htmlFor="sr26-company">{t("register.company")}</label>
        <input
          id="sr26-company"
          tabIndex={-1}
          autoComplete="off"
          value={form.honeypot}
          onChange={(event) => onChange("honeypot", event.target.value)}
        />
      </div>

      <div className="sr26-field-grid">
        <div className="sr26-field">
          <label htmlFor="sr26-name">{t("register.fullName")}</label>
          <div className="sr26-input-wrap">
            <UserRound aria-hidden="true" size={19} />
            <input
              id="sr26-name"
              ref={assignRef(fieldRefs, "name")}
              type="text"
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder={t("register.fullNamePlaceholder")}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "sr26-name-error" : undefined}
              required
            />
          </div>
          <FieldError id="sr26-name-error" message={errors.name} />
        </div>

        <div className="sr26-field">
          <label htmlFor="sr26-email">{t("register.email")}</label>
          <div className="sr26-input-wrap">
            <Mail aria-hidden="true" size={19} />
            <input
              id="sr26-email"
              ref={assignRef(fieldRefs, "email")}
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder={t("register.emailPlaceholder")}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "sr26-email-error" : undefined}
              required
            />
          </div>
          <FieldError id="sr26-email-error" message={errors.email} />
        </div>
      </div>

      <div className="sr26-field">
        <label htmlFor="sr26-phone">{t("register.phone")}</label>
        <div className="sr26-phone-wrap">
          <span className="sr26-country-pill" aria-label="Indonesia country code" style={{ padding: '0 12px', gap: '8px' }}>
            <svg aria-hidden="true" viewBox="0 0 3 2" width="18" height="13" style={{ borderRadius: '1.5px', border: '1px solid rgba(128, 128, 128, 0.15)', display: 'block', overflow: 'hidden', flex: '0 0 auto' }}>
              <rect width="3" height="1" fill="#ed2939" />
              <rect y="1" width="3" height="1" fill="#ffffff" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--tp-text)' }}>+62</span>
          </span>
          <div className="sr26-input-wrap">
            <Phone aria-hidden="true" size={18} />
            <input
              id="sr26-phone"
              ref={assignRef(fieldRefs, "phoneNumber")}
              type="tel"
              value={form.phoneNumber}
              onChange={(event) => onChange("phoneNumber", event.target.value)}
              placeholder={t("register.phonePlaceholder")}
              autoComplete="tel"
              aria-invalid={Boolean(errors.phoneNumber)}
              aria-describedby={errors.phoneNumber ? "sr26-phone-error" : "sr26-phone-helper"}
              required
            />
          </div>
        </div>
        <FieldError id="sr26-phone-error" message={errors.phoneNumber} />
        {!errors.phoneNumber ? (
          <p className="sr26-field-helper" id="sr26-phone-helper">
            {t("register.phoneHelper")}
          </p>
        ) : null}
      </div>

      <div className="sr26-field-grid">
        <div className="sr26-field">
          <label htmlFor="sr26-password">{t("register.password")}</label>
          <div className="sr26-input-wrap">
            <LockKeyhole aria-hidden="true" size={18} />
            <input
              id="sr26-password"
              ref={assignRef(fieldRefs, "password")}
              type={form.showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => onChange("password", event.target.value)}
              placeholder="••••••••••"
              autoComplete="new-password"
              minLength={8}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "sr26-password-error" : undefined}
              required
            />
            <button
              className="sr26-eye-btn"
              type="button"
              onClick={onTogglePassword}
              aria-label={form.showPassword ? t("register.hidePassword") : t("register.showPassword")}
            >
              {form.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <FieldError id="sr26-password-error" message={errors.password} />
        </div>

        <div className="sr26-field">
          <label htmlFor="sr26-password-confirm">{t("register.confirmPassword")}</label>
          <div className="sr26-input-wrap">
            <LockKeyhole aria-hidden="true" size={18} />
            <input
              id="sr26-password-confirm"
              ref={assignRef(fieldRefs, "passwordConfirm")}
              type={form.showPasswordConfirm ? "text" : "password"}
              value={form.passwordConfirm}
              onChange={(event) => onChange("passwordConfirm", event.target.value)}
              placeholder="••••••••••"
              autoComplete="new-password"
              minLength={8}
              aria-invalid={Boolean(errors.passwordConfirm)}
              aria-describedby={
                errors.passwordConfirm
                  ? "sr26-password-confirm-error"
                  : "sr26-password-confirm-helper"
              }
              required
            />
            <button
              className="sr26-eye-btn"
              type="button"
              onClick={onToggleConfirmPassword}
              aria-label={form.showPasswordConfirm ? t("register.hidePasswordConfirm") : t("register.showPasswordConfirm")}
            >
              {form.showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <FieldError id="sr26-password-confirm-error" message={errors.passwordConfirm} />
        </div>
      </div>

      <PasswordStrength strength={passwordStrength} />
      {!errors.passwordConfirm ? (
        <p className="sr26-field-helper" id="sr26-password-confirm-helper">
          {status.passwordConfirmHelper === "Enter the same password again to confirm it." || status.passwordConfirmHelper === "Repeat the same password to continue."
            ? t("register.passwordConfirmHelperText")
            : status.passwordConfirmHelper}
        </p>
      ) : null}

      <label className="sr26-terms">
        <input
          ref={assignRef(fieldRefs, "termsAccepted")}
          type="checkbox"
          checked={form.termsAccepted}
          onChange={(event) => onChange("termsAccepted", event.target.checked)}
          aria-invalid={Boolean(errors.termsAccepted)}
          required
        />
        <span>
          {t("register.agreeTo")}{" "}
          <a href="/terms-and-conditions">{t("register.terms")}</a> {t("register.and")}{" "}
          <a href="/privacy-policy">{t("register.privacyPolicy")}</a>.
        </span>
      </label>
      <FieldError id="sr26-terms-error" message={errors.termsAccepted} />

      <button className="sr26-primary-btn" type="submit" disabled={status.isSubmitting}>
        <span>{status.submitLabel === "Create account" ? t("register.createAccountBtn") : status.submitLabel}</span>
        <ArrowRight aria-hidden="true" size={19} />
      </button>

      <p className="sr26-switch">
        {t("register.alreadyHaveAccount")}{" "}
        <button type="button" onClick={onSignIn}>
          {t("register.signIn")}
        </button>
      </p>
    </form>
  );
}

function OtpForm({
  viewModel,
  fieldRefs,
  statusRef,
  onOtpChange,
  onVerifyOtp,
  onResendOtp,
  onBackToRegister,
}) {
  const { status, otp, errors } = viewModel;
  const destination = otp.destinationMasked || "your email";
  const { t } = useTranslation();

  return (
    <form className="sr26-card sr26-otp-card" onSubmit={onVerifyOtp}>
      <div className="sr26-card-head">
        <div>
          <h1>{t("register.verifyEmail")}</h1>
          <p>{t("register.enterCodeSent", { destination })}</p>
        </div>
        <span className="sr26-secure-badge">
          <Mail aria-hidden="true" size={18} />
          {otp.channel}
        </span>
      </div>

      <StatusNotice status={status} statusRef={statusRef} />

      <div className="sr26-otp-info">
        {status.deliveryFailed ? (
          <p>{t("register.otpFailed")}</p>
        ) : (
          <p>{t("register.otpExpires", { seconds: otp.expiresInSeconds || 0 })}</p>
        )}
      </div>

      <div className="sr26-field">
        <label htmlFor="sr26-otp">{t("register.verificationCode")}</label>
        <input
          id="sr26-otp"
          className="sr26-otp-input"
          ref={assignRef(fieldRefs, "otpCode")}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp.code}
          onChange={(event) => onOtpChange(event.target.value)}
          placeholder="123456"
          aria-invalid={Boolean(errors.otpCode)}
          aria-describedby={errors.otpCode ? "sr26-otp-error" : "sr26-otp-helper"}
          required
        />
        <FieldError id="sr26-otp-error" message={errors.otpCode} />
        {!errors.otpCode ? (
          <p className="sr26-field-helper" id="sr26-otp-helper">
            {t("register.otpHelperText")}
          </p>
        ) : null}
      </div>

      <button
        className="sr26-primary-btn"
        type="submit"
        disabled={status.isVerifying || !status.canSubmitOtp}
      >
        <span>{status.verifyLabel}</span>
        <CheckCircle2 aria-hidden="true" size={19} />
      </button>

      <button
        className="sr26-secondary-btn"
        type="button"
        onClick={onResendOtp}
        disabled={status.isResending || status.countdown > 0}
      >
        {status.resendLabel}
      </button>

      <button className="sr26-link-btn" type="button" onClick={onBackToRegister}>
        <ArrowLeft aria-hidden="true" size={17} />
        {t("register.backToRegister")}
      </button>
    </form>
  );
}

export default function StoreRegister2026View({
  viewModel,
  fieldRefs,
  statusRef,
  onChange,
  onSubmit,
  onSignIn,
  onTogglePassword,
  onToggleConfirmPassword,
  onOtpChange,
  onVerifyOtp,
  onResendOtp,
  onBackToRegister,
}) {
  const isOtp = viewModel.mode === "verify";
  const { t } = useTranslation();

  return (
    <main className="sr26-page">
      <div className="sr26-bg-orb sr26-bg-orb-left" aria-hidden="true" />
      <div className="sr26-bg-orb sr26-bg-orb-right" aria-hidden="true" />

      <section className="sr26-shell" aria-label="Create account">
        <aside className="sr26-left-card">
          <span className="sr26-kicker">{t("register.welcomeKicker")}</span>
          <h2>{t("register.welcomeTitle")}</h2>
          <p>{t("register.welcomeDesc")}</p>

          <div className="sr26-benefits">
            {benefitItems.map((item) => {
              const Icon = item.icon;
              return (
                <div className="sr26-benefit" key={item.titleKey}>
                  <span>
                    <Icon aria-hidden="true" size={24} />
                  </span>
                  <div>
                    <h3>{t(item.titleKey)}</h3>
                    <p>{t(item.textKey)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sr26-mini-scene" aria-hidden="true">
            <ShoppingBag size={74} />
            <ShieldCheck size={62} />
            <Gift size={44} />
          </div>
        </aside>

        <section className="sr26-center">
          {isOtp ? (
            <OtpForm
              viewModel={viewModel}
              fieldRefs={fieldRefs}
              statusRef={statusRef}
              onOtpChange={onOtpChange}
              onVerifyOtp={onVerifyOtp}
              onResendOtp={onResendOtp}
              onBackToRegister={onBackToRegister}
            />
          ) : (
            <RegisterForm
              viewModel={viewModel}
              fieldRefs={fieldRefs}
              statusRef={statusRef}
              onChange={onChange}
              onSubmit={onSubmit}
              onSignIn={onSignIn}
              onTogglePassword={onTogglePassword}
              onToggleConfirmPassword={onToggleConfirmPassword}
            />
          )}
        </section>

        <aside className="sr26-visual" aria-hidden="true">
          <div className="sr26-rings">
            <span />
            <span />
            <span />
          </div>
          <div className="sr26-shield">
            <ShieldCheck size={120} strokeWidth={1.35} />
          </div>
          <div className="sr26-bag">
            <ShoppingBag size={116} strokeWidth={1.25} />
          </div>
          <div className="sr26-cube sr26-cube-one" />
          <div className="sr26-cube sr26-cube-two" />
        </aside>
      </section>

      <section className="sr26-mobile-strip" aria-label="Shopping benefits">
        {mobileBenefits.map((item) => {
          const Icon = item.icon;
          return (
            <div className="sr26-mobile-benefit" key={item.labelKey}>
              <span>
                <Icon aria-hidden="true" size={22} />
              </span>
              <p>{t(item.labelKey)}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}

