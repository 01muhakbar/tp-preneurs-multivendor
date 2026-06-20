import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import "./store-forgot-password-2026.css";

function StatusMessage({ viewModel, statusRef }) {
  const { status } = viewModel;
  if (!status.message) return null;

  const isError = status.tone === "error";
  const Icon = isError ? LockKeyhole : CheckCircle2;

  return (
    <div
      ref={statusRef}
      className={`fp26-status fp26-status-${isError ? "error" : "success"}`}
      role={isError ? "alert" : "status"}
      tabIndex={-1}
    >
      <Icon aria-hidden="true" size={18} />
      <div>
        <p>{isError ? status.errorMessage : status.successMessage}</p>
        {!isError && status.hasSubmitted ? <span>{status.privacySuccessMessage}</span> : null}
      </div>
    </div>
  );
}

export default function StoreForgotPassword2026View({
  viewModel,
  emailRef,
  statusRef,
  onEmailChange,
  onHoneypotChange,
  onSubmit,
  onBackToSignIn,
}) {
  const { form, status, errors } = viewModel;

  return (
    <main className="fp26-page">
      <div className="fp26-wave fp26-wave-one" aria-hidden="true" />
      <div className="fp26-wave fp26-wave-two" aria-hidden="true" />

      <section className="fp26-shell" aria-label="Reset password">
        <form className="fp26-card" onSubmit={onSubmit} noValidate>
          <div className="fp26-kicker">
            <ShieldCheck aria-hidden="true" size={16} />
            <span>Account recovery</span>
          </div>

          <h1>Reset your password</h1>
          <p className="fp26-subtitle">
            Enter the email linked to your TP Preneurs account. We’ll send a secure link to reset
            your password.
          </p>

          <StatusMessage viewModel={viewModel} statusRef={statusRef} />

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

          <div className="fp26-field">
            <label htmlFor="fp26-email">Email address</label>
            <div className="fp26-input-wrap">
              <Mail aria-hidden="true" size={20} />
              <input
                id="fp26-email"
                ref={emailRef}
                type="email"
                value={form.email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "fp26-email-error" : "fp26-email-helper"}
                required
              />
            </div>
            {errors.email ? (
              <p className="fp26-field-error" id="fp26-email-error">
                {errors.email}
              </p>
            ) : (
              <p className="fp26-field-helper" id="fp26-email-helper">
                We always return a generic response to protect account privacy.
              </p>
            )}
          </div>

          <button
            className="fp26-primary-btn"
            type="submit"
            disabled={status.isSubmitting || status.cooldownSeconds > 0 || !status.canSubmit}
          >
            <Send aria-hidden="true" size={18} />
            <span>{status.submitLabel}</span>
          </button>

          <div className="fp26-trust-note">
            <LockKeyhole aria-hidden="true" size={17} />
            <span>{status.privacyNote}</span>
          </div>
        </form>

        <aside className="fp26-visual" aria-hidden="true">
          <div className="fp26-visual-card">
            <div className="fp26-plane">
              <Send size={36} />
            </div>
            <div className="fp26-envelope">
              <div className="fp26-envelope-flap" />
              <div className="fp26-letter">
                <LockKeyhole size={32} />
              </div>
              <div className="fp26-envelope-front" />
            </div>
            <div className="fp26-shield">
              <ShieldCheck size={46} />
            </div>
            <div className="fp26-user-bubble">
              <UserRound size={26} />
            </div>
            <div className="fp26-spark fp26-spark-one">
              <Sparkles size={18} />
            </div>
            <div className="fp26-spark fp26-spark-two">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="fp26-trust-chip">
            Secure. Private. <strong>Trusted.</strong>
          </div>
        </aside>
      </section>

      <button className="fp26-back-link" type="button" onClick={onBackToSignIn}>
        <span>Remembered your password?</span>
        <strong>Back to sign in</strong>
        <ArrowRight aria-hidden="true" size={18} />
      </button>
    </main>
  );
}

