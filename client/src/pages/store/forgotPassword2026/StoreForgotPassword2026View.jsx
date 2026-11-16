import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  KeyRound,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import "./store-forgot-password-2026.css";

function StatusNotice({ status, statusRef }) {
  if (!status?.message) return null;
  const isError = status.tone === "error";
  const isSuccess = status.tone === "success";
  const Icon = isError ? CircleAlert : isSuccess ? CheckCircle2 : Sparkles;

  return (
    <div
      ref={statusRef}
      className={`fp26-status fp26-status--${status.tone || "neutral"}`}
      role={isError ? "alert" : "status"}
      tabIndex={-1}
    >
      <Icon className="fp26-status-icon" size={17} aria-hidden="true" />
      <span className="fp26-status-text">{status.message}</span>
    </div>
  );
}

export default function StoreForgotPassword2026View({
  viewModel,
  isIndo: isIndoProp,
  emailRef,
  statusRef,
  onEmailChange,
  onHoneypotChange,
  onSubmit,
  onBackToSignIn,
}) {
  const { form, status, errors } = viewModel;
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
    <main className="fp26-page">
      <div className="fp26-shell">
        {/* Left Side: Brand Hero Showcase */}
        <section className="fp26-hero" aria-labelledby="store-forgot-title">
          <div className="fp26-badge">
            <Sparkles className="fp26-badge-icon" size={14} />
            <span>{t("forgotPassword.badge") || (isIndo ? "Pemulihan Akun" : "Account Recovery")}</span>
          </div>

          <h1 id="store-forgot-title" className="fp26-hero-title">
            {t("forgotPassword.heroTitle") || (isIndo ? "Atur ulang kata sandi Anda" : "Reset your password")}
          </h1>

          <p className="fp26-hero-desc">
            {t("forgotPassword.heroDesc") ||
              (isIndo
                ? "Masukkan alamat email yang terdaftar dan kami akan mengirimkan tautan aman untuk mengatur ulang kata sandi Anda."
                : "Enter your registered email address and we'll send you a secure link to reset your password.")}
          </p>

          <div className="fp26-trust-card">
            <div className="fp26-trust-icon-box">
              <ShieldCheck size={22} className="fp26-trust-icon" />
            </div>
            <div className="fp26-trust-content">
              <strong className="fp26-trust-title">
                {t("forgotPassword.trustSecureTitle") ||
                  (isIndo ? "Aman & Terenkripsi" : "Encrypted & Secure")}
              </strong>
              <p className="fp26-trust-desc">
                {t("forgotPassword.trustSecureDesc") ||
                  (isIndo
                    ? "Tautan pemulihan dienkripsi dengan aman dan kedaluwarsa secara otomatis demi keamanan akun Anda."
                    : "Reset links are securely encrypted and expire automatically for your safety.")}
              </p>
            </div>
          </div>
        </section>

        {/* Right Side: Recovery Form Card */}
        <section className="fp26-card" aria-label="Reset Password">
          <form className="fp26-form" onSubmit={onSubmit} noValidate>
            <div className="fp26-card-head">
              <div className="fp26-avatar-box">
                <KeyRound size={22} className="fp26-avatar-icon" />
              </div>
              <div>
                <h2 className="fp26-card-title">
                  {t("forgotPassword.cardTitle") || (isIndo ? "Atur ulang kata sandi" : "Reset your password")}
                </h2>
                <p className="fp26-card-sub">
                  {t("forgotPassword.cardSubtitle") ||
                    (isIndo
                      ? "Masukkan email yang terdaftar pada akun Anda."
                      : "Enter the email associated with your account.")}
                </p>
              </div>
            </div>

            <StatusNotice status={status} statusRef={statusRef} />

            {/* Honeypot for spam bots */}
            <div className="fp26-honeypot" aria-hidden="true">
              <label htmlFor="fp26-company">Company</label>
              <input
                id="fp26-company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.honeypot}
                onChange={(event) => onHoneypotChange?.(event.target.value)}
              />
            </div>

            {/* Field: Email */}
            <div className="fp26-field">
              <label htmlFor="fp26-email" className="fp26-label">
                {t("forgotPassword.email") || (isIndo ? "Alamat email" : "Email address")}
              </label>
              <div className="fp26-input-wrapper">
                <Mail size={16} className="fp26-input-icon" />
                <input
                  id="fp26-email"
                  ref={emailRef}
                  type="email"
                  value={form.email}
                  onChange={(event) => onEmailChange?.(event.target.value)}
                  placeholder={
                    t("forgotPassword.emailPlaceholder") || (isIndo ? "anda@email.com" : "you@email.com")
                  }
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "fp26-email-error" : undefined}
                  className={`fp26-input ${errors.email ? "is-invalid" : ""}`}
                  required
                />
              </div>
              {errors.email ? (
                <p className="fp26-field-error" id="fp26-email-error">
                  {errors.email}
                </p>
              ) : null}
            </div>

            {/* Primary Action Button */}
            <button
              className="fp26-submit-btn"
              type="submit"
              disabled={status.isSubmitting || status.cooldownSeconds > 0 || !status.canSubmit}
            >
              {status.isSubmitting ? (
                <span className="fp26-submit-inner">
                  <span className="fp26-spinner" />
                  <span>{t("forgotPassword.sending") || (isIndo ? "Mengirim tautan..." : "Sending link...")}</span>
                </span>
              ) : (
                <span className="fp26-submit-inner">
                  <span>
                    {status.submitLabel || (isIndo ? "Kirim tautan pemulihan" : "Send reset link")}
                  </span>
                  <Send size={16} aria-hidden="true" />
                </span>
              )}
            </button>

            {/* Footer / Back to Sign In */}
            <div className="fp26-footer">
              <span>
                {t("forgotPassword.rememberPassword") ||
                  (isIndo ? "Ingat kata sandi Anda?" : "Remembered your password?")}
              </span>{" "}
              <button type="button" onClick={onBackToSignIn} className="fp26-signin-link">
                {t("forgotPassword.backToSignIn") || (isIndo ? "Kembali untuk masuk" : "Back to sign in")}
                <ArrowRight size={14} className="fp26-signin-icon" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
