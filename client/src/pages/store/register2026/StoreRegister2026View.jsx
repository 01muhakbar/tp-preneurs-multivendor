import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import "./store-register-2026.css";

const assignRef = (fieldRefs, key) => (node) => {
  if (fieldRefs?.current) {
    fieldRefs.current[key] = node;
  }
};

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
  const Icon = status.tone === "error" ? CircleAlert : status.tone === "warning" ? CircleAlert : BadgeCheck;
  return (
    <div
      ref={statusRef}
      className={`sr26-status sr26-status--${status.tone || "neutral"}`}
      role={status.tone === "error" ? "alert" : "status"}
      tabIndex={-1}
    >
      <Icon className="sr26-status-icon" size={17} aria-hidden="true" />
      <span>{status.message}</span>
    </div>
  );
}

function PasswordStrength({ strength, isIndo }) {
  const { t } = useTranslation();

  const labelKeyMap = {
    Weak: "register.strengthWeak",
    Fair: "register.strengthFair",
    Good: "register.strengthGood",
    Strong: "register.strengthStrong",
  };

  const translatedLabel = strength.label
    ? t(labelKeyMap[strength.label] || strength.label)
    : "";

  const translatedHelper =
    t("register.passwordHelper") ||
    (isIndo
      ? "Gunakan minimal 8 karakter, termasuk 1 huruf dan 1 angka."
      : "Use at least 8 characters, including at least 1 letter and 1 number.");

  return (
    <div className="sr26-strength" aria-label={`Password strength: ${translatedLabel || "empty"}`}>
      <div className="sr26-strength-bars" aria-hidden="true">
        {strength.segments.map((active, index) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={`sr26-strength-bar ${
              active ? `sr26-strength-bar--active sr26-strength--${strength.tone}` : ""
            }`}
          />
        ))}
      </div>
      <div className="sr26-strength-row">
        <span>{translatedHelper}</span>
        {translatedLabel ? (
          <strong className={`sr26-strength-label sr26-strength-label--${strength.tone}`}>
            {translatedLabel}
          </strong>
        ) : null}
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
  isIndo,
}) {
  const { form, status, errors, passwordStrength } = viewModel;
  const { t } = useTranslation();

  return (
    <form className="sr26-form" onSubmit={onSubmit} noValidate>
      <div className="sr26-card-head">
        <div className="sr26-avatar-box">
          <UserPlus size={22} className="sr26-avatar-icon" />
        </div>
        <div>
          <h2 className="sr26-card-title">
            {t("register.title") || (isIndo ? "Buat akun Anda" : "Create your account")}
          </h2>
          <p className="sr26-card-sub">
            {t("register.subtitle") ||
              (isIndo
                ? "Bergabunglah untuk pengalaman belanja yang lebih baik."
                : "Join us for a better shopping experience.")}
          </p>
        </div>
      </div>

      <StatusNotice status={status} statusRef={statusRef} />

      {/* Honeypot for spam bots */}
      <div className="sr26-honeypot" aria-hidden="true">
        <label htmlFor="sr26-company">{t("register.company") || "Company"}</label>
        <input
          id="sr26-company"
          tabIndex={-1}
          autoComplete="off"
          value={form.honeypot}
          onChange={(event) => onChange("honeypot", event.target.value)}
        />
      </div>

      {/* Row 1: Full Name & Email */}
      <div className="sr26-grid-2">
        <div className="sr26-field">
          <label htmlFor="sr26-name" className="sr26-label">
            {t("register.fullName") || (isIndo ? "Nama lengkap" : "Full name")}
          </label>
          <div className="sr26-input-wrapper">
            <UserRound size={16} className="sr26-input-icon" />
            <input
              id="sr26-name"
              ref={assignRef(fieldRefs, "name")}
              type="text"
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder={t("register.fullNamePlaceholder") || (isIndo ? "Nama lengkap Anda" : "Your full name")}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "sr26-name-error" : undefined}
              className={`sr26-input ${errors.name ? "is-invalid" : ""}`}
              required
            />
          </div>
          <FieldError id="sr26-name-error" message={errors.name} />
        </div>

        <div className="sr26-field">
          <label htmlFor="sr26-email" className="sr26-label">
            {t("register.email") || "Email"}
          </label>
          <div className="sr26-input-wrapper">
            <Mail size={16} className="sr26-input-icon" />
            <input
              id="sr26-email"
              ref={assignRef(fieldRefs, "email")}
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder={t("register.emailPlaceholder") || (isIndo ? "anda@email.com" : "you@email.com")}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "sr26-email-error" : undefined}
              className={`sr26-input ${errors.email ? "is-invalid" : ""}`}
              required
            />
          </div>
          <FieldError id="sr26-email-error" message={errors.email} />
        </div>
      </div>

      {/* Row 2: Phone Number with Integrated Indonesia Flag */}
      <div className="sr26-field">
        <label htmlFor="sr26-phone" className="sr26-label">
          {t("register.phone") || (isIndo ? "Nomor Telepon" : "Phone number")}
        </label>
        <div className="sr26-phone-wrapper">
          <span className="sr26-country-pill" aria-label="Indonesia (+62)">
            <svg
              aria-hidden="true"
              viewBox="0 0 3 2"
              width="18"
              height="12"
              className="sr26-flag-icon"
            >
              <rect width="3" height="1" fill="#ed2939" />
              <rect y="1" width="3" height="1" fill="#ffffff" />
            </svg>
            <span className="sr26-dial-code">+62</span>
          </span>
          <div className="sr26-phone-input-wrap">
            <Phone size={16} className="sr26-input-icon" />
            <input
              id="sr26-phone"
              ref={assignRef(fieldRefs, "phoneNumber")}
              type="tel"
              value={form.phoneNumber}
              onChange={(event) => onChange("phoneNumber", event.target.value)}
              placeholder={t("register.phonePlaceholder") || (isIndo ? "08xxxxxxxxxx" : "Enter your phone number")}
              autoComplete="tel"
              aria-invalid={Boolean(errors.phoneNumber)}
              aria-describedby={errors.phoneNumber ? "sr26-phone-error" : undefined}
              className={`sr26-input sr26-input--phone ${errors.phoneNumber ? "is-invalid" : ""}`}
              required
            />
          </div>
        </div>
        <FieldError id="sr26-phone-error" message={errors.phoneNumber} />
      </div>

      {/* Row 3: Password & Confirm Password */}
      <div className="sr26-grid-2">
        <div className="sr26-field">
          <label htmlFor="sr26-password" className="sr26-label">
            {t("register.password") || (isIndo ? "Kata Sandi" : "Password")}
          </label>
          <div className="sr26-input-wrapper">
            <LockKeyhole size={16} className="sr26-input-icon" />
            <input
              id="sr26-password"
              ref={assignRef(fieldRefs, "password")}
              type={form.showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => onChange("password", event.target.value)}
              placeholder="••••••••••••"
              autoComplete="new-password"
              minLength={8}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "sr26-password-error" : undefined}
              className={`sr26-input sr26-input--password ${errors.password ? "is-invalid" : ""}`}
              required
            />
            <button
              className="sr26-eye-btn"
              type="button"
              onClick={onTogglePassword}
              title={form.showPassword ? t("register.hidePassword") : t("register.showPassword")}
              aria-label={form.showPassword ? t("register.hidePassword") : t("register.showPassword")}
            >
              {form.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <FieldError id="sr26-password-error" message={errors.password} />
        </div>

        <div className="sr26-field">
          <label htmlFor="sr26-password-confirm" className="sr26-label">
            {t("register.confirmPassword") || (isIndo ? "Konfirmasi kata sandi" : "Confirm password")}
          </label>
          <div className="sr26-input-wrapper">
            <LockKeyhole size={16} className="sr26-input-icon" />
            <input
              id="sr26-password-confirm"
              ref={assignRef(fieldRefs, "passwordConfirm")}
              type={form.showPasswordConfirm ? "text" : "password"}
              value={form.passwordConfirm}
              onChange={(event) => onChange("passwordConfirm", event.target.value)}
              placeholder="••••••••••••"
              autoComplete="new-password"
              minLength={8}
              aria-invalid={Boolean(errors.passwordConfirm)}
              aria-describedby={errors.passwordConfirm ? "sr26-password-confirm-error" : undefined}
              className={`sr26-input sr26-input--password ${errors.passwordConfirm ? "is-invalid" : ""}`}
              required
            />
            <button
              className="sr26-eye-btn"
              type="button"
              onClick={onToggleConfirmPassword}
              title={form.showPasswordConfirm ? t("register.hidePasswordConfirm") : t("register.showPasswordConfirm")}
              aria-label={form.showPasswordConfirm ? t("register.hidePasswordConfirm") : t("register.showPasswordConfirm")}
            >
              {form.showPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <FieldError id="sr26-password-confirm-error" message={errors.passwordConfirm} />
        </div>
      </div>

      {/* Password Strength Indicator */}
      <PasswordStrength strength={passwordStrength} isIndo={isIndo} />

      {/* Terms & Conditions Checkbox */}
      <div className="sr26-terms-wrapper">
        <label className="sr26-terms">
          <input
            ref={assignRef(fieldRefs, "termsAccepted")}
            type="checkbox"
            checked={form.termsAccepted}
            onChange={(event) => onChange("termsAccepted", event.target.checked)}
            aria-invalid={Boolean(errors.termsAccepted)}
            className="sr26-checkbox"
            required
          />
          <span>
            {t("register.agreeTo") || (isIndo ? "Saya menyetujui" : "I agree to the")}{" "}
            <a href="/terms-and-conditions" className="sr26-link">
              {t("register.terms") || (isIndo ? "syarat & ketentuan" : "terms")}
            </a>{" "}
            {t("register.and") || (isIndo ? "dan" : "and")}{" "}
            <a href="/privacy-policy" className="sr26-link">
              {t("register.privacyPolicy") || (isIndo ? "kebijakan privasi" : "privacy policy")}
            </a>.
          </span>
        </label>
        <FieldError id="sr26-terms-error" message={errors.termsAccepted} />
      </div>

      {/* Primary Submit Button */}
      <button
        className="sr26-submit-btn"
        type="submit"
        disabled={status.isSubmitting}
      >
        {status.isSubmitting ? (
          <span className="sr26-submit-inner">
            <span className="sr26-spinner" />
            <span>{t("register.creatingAccount") || (isIndo ? "Membuat akun..." : "Creating account...")}</span>
          </span>
        ) : (
          <span className="sr26-submit-inner">
            <span>{status.submitLabel || (isIndo ? "Buat akun" : "Create account")}</span>
            <ArrowRight size={17} aria-hidden="true" />
          </span>
        )}
      </button>

      {/* Footer / Switch to Login */}
      <div className="sr26-footer">
        <span>{t("register.alreadyHaveAccount") || (isIndo ? "Sudah punya akun?" : "Already have an account?")}</span>{" "}
        <button type="button" onClick={onSignIn} className="sr26-signin-link">
          {t("register.signIn") || (isIndo ? "Masuk" : "Sign in")}
        </button>
      </div>
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
  isIndo,
}) {
  const { status, otp, errors } = viewModel;
  const destination = otp.destinationMasked || (isIndo ? "email Anda" : "your email");
  const { t } = useTranslation();

  return (
    <form className="sr26-form sr26-otp-form" onSubmit={onVerifyOtp}>
      <div className="sr26-card-head">
        <div className="sr26-avatar-box">
          <Mail size={22} className="sr26-avatar-icon" />
        </div>
        <div>
          <h2 className="sr26-card-title">
            {t("register.verifyEmail") || (isIndo ? "Verifikasi email Anda" : "Verify your email")}
          </h2>
          <p className="sr26-card-sub">
            {t("register.enterCodeSent", { destination }) ||
              (isIndo
                ? `Masukkan kode yang kami kirim ke ${destination}.`
                : `Enter the code we sent to ${destination}.`)}
          </p>
        </div>
      </div>

      <StatusNotice status={status} statusRef={statusRef} />

      <div className="sr26-otp-info">
        {status.deliveryFailed ? (
          <p className="sr26-otp-failed">
            {t("register.otpFailed") ||
              (isIndo
                ? "Kami tidak dapat mengirimkan kode verifikasi. Minta kode baru ketika tombol kirim ulang aktif."
                : "We could not deliver the latest verification code. Request a new code when resend is available.")}
          </p>
        ) : (
          <p className="sr26-otp-expires">
            {t("register.otpExpires", { seconds: otp.expiresInSeconds || 0 }) ||
              (isIndo
                ? `Kode Anda kedaluwarsa dalam ${otp.expiresInSeconds || 0} detik.`
                : `Your code expires in ${otp.expiresInSeconds || 0} seconds.`)}
          </p>
        )}
      </div>

      <div className="sr26-field">
        <label htmlFor="sr26-otp" className="sr26-label text-center block">
          {t("register.verificationCode") || (isIndo ? "Kode verifikasi" : "Verification code")}
        </label>
        <input
          id="sr26-otp"
          className="sr26-input sr26-otp-input"
          ref={assignRef(fieldRefs, "otpCode")}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp.code}
          onChange={(event) => onOtpChange(event.target.value)}
          placeholder="123456"
          aria-invalid={Boolean(errors.otpCode)}
          aria-describedby={errors.otpCode ? "sr26-otp-error" : undefined}
          required
        />
        <FieldError id="sr26-otp-error" message={errors.otpCode} />
      </div>

      <button
        className="sr26-submit-btn"
        type="submit"
        disabled={status.isVerifying || !status.canSubmitOtp}
      >
        {status.isVerifying ? (
          <span className="sr26-submit-inner">
            <span className="sr26-spinner" />
            <span>{t("register.verifying") || (isIndo ? "Memverifikasi..." : "Verifying...")}</span>
          </span>
        ) : (
          <span className="sr26-submit-inner">
            <span>{status.verifyLabel || (isIndo ? "Verifikasi email" : "Verify email")}</span>
            <CheckCircle2 size={17} aria-hidden="true" />
          </span>
        )}
      </button>

      <button
        className="sr26-secondary-btn"
        type="button"
        onClick={onResendOtp}
        disabled={status.isResending || status.countdown > 0}
      >
        {status.resendLabel || (isIndo ? "Kirim ulang kode" : "Resend code")}
      </button>

      <button className="sr26-back-btn" type="button" onClick={onBackToRegister}>
        <ArrowLeft size={16} aria-hidden="true" />
        <span>{t("register.backToRegister") || (isIndo ? "Kembali ke daftar" : "Back to register")}</span>
      </button>
    </form>
  );
}

export default function StoreRegister2026View({
  viewModel,
  isIndo: isIndoProp,
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
  const { t, i18n } = useTranslation();

  const isIndo =
    typeof isIndoProp === "boolean"
      ? isIndoProp
      : typeof viewModel?.isIndo === "boolean"
        ? viewModel.isIndo
        : i18n?.language === "id" ||
          i18n?.language === "id-ID" ||
          (typeof i18n?.language === "string" && i18n.language.startsWith("id"));

  return (
    <main className="sr26-page">
      <div className="sr26-shell">
        {/* Left Side: Brand Hero Showcase */}
        <section className="sr26-hero" aria-labelledby="store-register-title">
          <div className="sr26-badge">
            <Sparkles className="sr26-badge-icon" size={14} />
            <span>{t("register.badgeMarketplace") || (isIndo ? "Marketplace Resmi" : "Official Marketplace")}</span>
          </div>

          <h1 id="store-register-title" className="sr26-hero-title">
            {t("register.welcomeTitle") || (isIndo ? "Buat akun Anda dan mulai berbelanja" : "Create your account and start shopping")}
          </h1>

          <p className="sr26-hero-desc">
            {t("register.welcomeDesc") ||
              (isIndo
                ? "Bergabunglah dengan ribuan pembeli dan temukan produk inovasi terbaik."
                : "Join happy customers and unlock the best local products.")}
          </p>

          <div className="sr26-trust-card">
            <div className="sr26-trust-icon-box">
              <ShieldCheck size={22} className="sr26-trust-icon" />
            </div>
            <div className="sr26-trust-content">
              <strong className="sr26-trust-title">
                {t("register.trustSecureTitle") ||
                  (isIndo ? "Pendaftaran Cepat & Aman" : "Fast & Secure Registration")}
              </strong>
              <p className="sr26-trust-desc">
                {t("register.trustSecureDesc") ||
                  (isIndo
                    ? "Akses instan ke pesanan, produk favorit, dan transaksi terverifikasi."
                    : "Instant access to orders, saved items, and verified checkout.")}
              </p>
            </div>
          </div>
        </section>

        {/* Right Side: Register or OTP Card */}
        <section className="sr26-card" aria-label="Create Account">
          {isOtp ? (
            <OtpForm
              viewModel={viewModel}
              fieldRefs={fieldRefs}
              statusRef={statusRef}
              onOtpChange={onOtpChange}
              onVerifyOtp={onVerifyOtp}
              onResendOtp={onResendOtp}
              onBackToRegister={onBackToRegister}
              isIndo={isIndo}
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
              isIndo={isIndo}
            />
          )}
        </section>
      </div>
    </main>
  );
}
