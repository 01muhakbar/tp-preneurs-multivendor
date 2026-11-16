import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import "./store-login-2026.css";

function StatusMessage({ id, tone, children, focusRef }) {
  if (!children) return null;
  const Icon = tone === "warning" ? CircleAlert : BadgeCheck;
  return (
    <div
      id={id}
      ref={focusRef}
      role={tone === "warning" ? "alert" : "status"}
      aria-live={tone === "warning" ? "assertive" : "polite"}
      tabIndex={-1}
      className={`sl26-message sl26-message--${tone}`}
    >
      <Icon className="sl26-message-icon" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function ErrorAlert({ errorInfo, fallbackMessage, onAction, focusRef }) {
  const title = errorInfo?.title || "";
  const message = errorInfo?.message || fallbackMessage || "";
  if (!title && !message) return null;

  return (
    <div
      id="store-login-error"
      ref={focusRef}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className="sl26-message sl26-message--error"
    >
      <LockKeyhole className="sl26-message-icon" size={17} aria-hidden="true" />
      <div className="sl26-message-body">
        {title && <strong className="sl26-message-title">{title}</strong>}
        {message && <p className="sl26-message-text">{message}</p>}
        {errorInfo?.action && (
          <button
            type="button"
            className="sl26-message-action"
            onClick={() => onAction?.(errorInfo.action.actionType)}
          >
            <span>{errorInfo.action.label}</span>
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function StoreLogin2026View({
  viewModel,
  isIndo: isIndoProp,
  fieldRefs = {},
  messageRefs = {},
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onTogglePassword,
  onForgotPassword,
  onCreateAccount,
  onAction,
}) {
  const { form, status, submitting, disabled } = viewModel;
  const passwordInputType = form.showPassword ? "text" : "password";
  const { t, i18n } = useTranslation();

  const isIndo =
    typeof isIndoProp === "boolean"
      ? isIndoProp
      : i18n?.language === "id" ||
        i18n?.language === "id-ID" ||
        (typeof i18n?.language === "string" && i18n.language.startsWith("id"));

  const passwordToggleLabel = form.showPassword
    ? t("login.hidePassword") || (isIndo ? "Sembunyikan sandi" : "Hide password")
    : t("login.showPassword") || (isIndo ? "Tampilkan sandi" : "Show password");

  return (
    <main className="sl26-page">
      <div className="sl26-shell">
        {/* Left Side: Brand Showcase & Value Prop */}
        <section className="sl26-hero" aria-labelledby="store-login-title">
          <div className="sl26-badge">
            <Sparkles className="sl26-badge-icon" size={14} />
            <span>{t("login.badgeMarketplace") || (isIndo ? "Marketplace Resmi" : "Official Marketplace")}</span>
          </div>

          <h1 id="store-login-title" className="sl26-hero-title">
            {t("login.signInTo") || (isIndo ? "Masuk ke" : "Sign in to")}{" "}
            <span className="sl26-hero-highlight">
              {t("login.yourAccount") || (isIndo ? "akun Anda" : "your account")}
            </span>
          </h1>

          <p className="sl26-hero-desc">
            {t("login.subtitle") ||
              (isIndo
                ? "Akses pesanan Anda, barang tersimpan, dan penawaran personal."
                : "Access your orders, saved items, and personalized offers.")}
          </p>

          <div className="sl26-trust-card">
            <div className="sl26-trust-icon-box">
              <ShieldCheck size={22} className="sl26-trust-icon" />
            </div>
            <div className="sl26-trust-content">
              <strong className="sl26-trust-title">
                {t("login.trustSecureTitle") ||
                  (isIndo ? "Transaksi Aman & Terlindungi" : "Safe & Secure Transactions")}
              </strong>
              <p className="sl26-trust-desc">
                {t("login.trustSecureDesc") ||
                  (isIndo
                    ? "Belanja nyaman dengan sistem verifikasi pembayaran terpusat."
                    : "Protected shopping with centralized payment verification.")}
              </p>
            </div>
          </div>
        </section>

        {/* Right Side: Member Login Card */}
        <section className="sl26-card" aria-label="Member Login">
          <div className="sl26-card-head">
            <div className="sl26-avatar-box">
              <UserRound size={20} className="sl26-avatar-icon" />
            </div>
            <div>
              <h2 className="sl26-card-title">
                {t("login.memberLogin") || (isIndo ? "Login Anggota" : "Member Login")}
              </h2>
              <p className="sl26-card-sub">
                {t("login.continueTo") || (isIndo ? "Lanjutkan ke TP Preneurs." : "Continue to TP Preneurs.")}
              </p>
            </div>
          </div>

          {status.redirectNotice ? (
            <div className="sl26-redirect" role="status">
              <ShoppingBag size={16} className="sl26-redirect-icon shrink-0" />
              <span>{status.redirectNotice}</span>
            </div>
          ) : null}

          <form className="sl26-form" onSubmit={onSubmit}>
            {/* Email Field */}
            <div className="sl26-field">
              <label htmlFor="store-login-email" className="sl26-label">
                {t("login.email") || "Email"}
              </label>
              <div className="sl26-input-wrapper">
                <Mail size={16} className="sl26-input-icon" />
                <input
                  id="store-login-email"
                  ref={fieldRefs.emailRef}
                  type="email"
                  value={form.email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder={t("login.emailPlaceholder") || (isIndo ? "anda@email.com" : "you@email.com")}
                  autoComplete="email"
                  className={`sl26-input ${status.isInvalidCredentials ? "is-invalid" : ""}`}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="sl26-field">
              <label htmlFor="store-login-password" className="sl26-label">
                {t("login.password") || (isIndo ? "Kata Sandi" : "Password")}
              </label>
              <div className="sl26-input-wrapper">
                <LockKeyhole size={16} className="sl26-input-icon" />
                <input
                  id="store-login-password"
                  ref={fieldRefs.passwordRef}
                  type={passwordInputType}
                  value={form.password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className={`sl26-input sl26-input--password ${status.isInvalidCredentials ? "is-invalid" : ""}`}
                  required
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="sl26-eye-btn"
                  title={passwordToggleLabel}
                  aria-label={passwordToggleLabel}
                >
                  {form.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Options Row: Remember Me & Forgot Password */}
            <div className="sl26-options">
              <label className="sl26-remember">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(event) => onRememberChange(event.target.checked)}
                  className="sl26-checkbox"
                />
                <span>{t("login.rememberMe") || (isIndo ? "Ingat saya" : "Remember me")}</span>
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="sl26-forgot-btn"
              >
                {t("login.forgotPassword") || (isIndo ? "Lupa sandi?" : "Forgot password?")}
              </button>
            </div>

            {/* Status & Error Alerts */}
            <StatusMessage
              id="store-login-status"
              tone={status.noticeMessage ? "warning" : "success"}
              focusRef={messageRefs.statusRef}
            >
              {status.noticeMessage || status.successMessage}
            </StatusMessage>
            <ErrorAlert
              errorInfo={status.errorInfo}
              fallbackMessage={status.errorMessage}
              onAction={onAction || onForgotPassword}
              focusRef={messageRefs.errorRef}
            />

            {/* Submit Button */}
            <button
              className="sl26-submit-btn"
              type="submit"
              disabled={disabled}
            >
              {submitting ? (
                <span className="sl26-submit-inner">
                  <span className="sl26-spinner" />
                  <span>{t("login.signingIn") || (isIndo ? "Masuk..." : "Signing in...")}</span>
                </span>
              ) : (
                <span>{status.submitLabel || (isIndo ? "Masuk" : "Sign in")}</span>
              )}
            </button>
          </form>

          {/* Registration Footer */}
          <div className="sl26-footer">
            <span>{t("login.newHere") || (isIndo ? "Pengguna baru?" : "New here?")}</span>{" "}
            <button
              type="button"
              onClick={onCreateAccount}
              className="sl26-register-link"
            >
              {t("login.createAccount") || (isIndo ? "Buat akun" : "Create an account")}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
