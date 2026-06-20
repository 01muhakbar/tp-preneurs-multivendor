import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Gift,
  LockKeyhole,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  UserRound,
  Zap,
} from "lucide-react";
import "./store-login-2026.css";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Secure & Protected",
    text: "Your data is safe with us.",
  },
  {
    icon: Zap,
    title: "Fast & Easy Access",
    text: "One login for everything.",
  },
  {
    icon: Gift,
    title: "Exclusive Benefits",
    text: "Member-only offers & rewards.",
  },
];

function BenefitList({ compact = false }) {
  return (
    <div className={compact ? "sl26-mobile-benefits" : "sl26-benefits"}>
      {benefits.map((item) => {
        const Icon = item.icon;
        return (
          <div className="sl26-benefit" key={item.title}>
            <span>
              <Icon aria-hidden="true" />
            </span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusMessage({ id, tone, children, focusRef }) {
  if (!children) return null;
  return (
    <div
      id={id}
      ref={focusRef}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      tabIndex={-1}
      className={`sl26-message sl26-message--${tone}`}
    >
      {tone === "error" ? <LockKeyhole aria-hidden="true" /> : <BadgeCheck aria-hidden="true" />}
      <span>{children}</span>
    </div>
  );
}

export default function StoreLogin2026View({
  viewModel,
  fieldRefs = {},
  messageRefs = {},
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onTogglePassword,
  onForgotPassword,
  onCreateAccount,
}) {
  const { form, status, submitting, disabled } = viewModel;
  const passwordInputType = form.showPassword ? "text" : "password";
  const passwordToggleLabel = form.showPassword ? "Hide password" : "Show password";

  return (
    <main className="sl26-page">
      <div className="sl26-shell">
        <section className="sl26-copy" aria-labelledby="store-login-title">
          <span className="sl26-chip">Welcome back!</span>
          <h1 id="store-login-title">
            Sign in to <span>your account</span>
          </h1>
          <p>Access your orders, saved items, and exclusive member benefits.</p>
          <BenefitList />
          <div className="sl26-flight" aria-hidden="true">
            <span />
            <ArrowRight />
          </div>
        </section>

        <section className="sl26-card" aria-label="Member Login">
          <div className="sl26-card-head">
            <span>
              <UserRound aria-hidden="true" />
            </span>
            <div>
              <h2>Member Login</h2>
              <p>Continue to TP Preneurs.</p>
            </div>
          </div>

          {status.redirectNotice ? (
            <div className="sl26-redirect" role="status">
              <ShoppingBag aria-hidden="true" />
              <span>{status.redirectNotice}</span>
            </div>
          ) : null}

          <form className="sl26-form" onSubmit={onSubmit}>
            <div className="sl26-field">
              <label htmlFor="store-login-email">Email address</label>
              <input
                id="store-login-email"
                ref={fieldRefs.emailRef}
                type="email"
                value={form.email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="sl26-field">
              <label htmlFor="store-login-password">Password</label>
              <div className="sl26-password">
                <input
                  id="store-login-password"
                  ref={fieldRefs.passwordRef}
                  type={passwordInputType}
                  value={form.password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  aria-describedby="store-login-password-helper"
                  required
                />
                <button type="button" onClick={onTogglePassword} aria-label={passwordToggleLabel}>
                  {form.showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="sl26-options">
              <label className="sl26-remember">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(event) => onRememberChange(event.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button type="button" onClick={onForgotPassword}>
                Forgot password?
              </button>
            </div>

            <p id="store-login-password-helper" className="sl26-helper">
              {status.helperMessage}
            </p>

            <StatusMessage
              id="store-login-status"
              tone="success"
              focusRef={messageRefs.statusRef}
            >
              {status.successMessage}
            </StatusMessage>
            <StatusMessage id="store-login-error" tone="error" focusRef={messageRefs.errorRef}>
              {status.errorMessage}
            </StatusMessage>

            <button className="sl26-submit" type="submit" disabled={disabled}>
              {submitting ? "Signing in..." : status.submitLabel}
            </button>
          </form>

          <p className="sl26-register">
            New here?{" "}
            <button type="button" onClick={onCreateAccount}>
              Create account
            </button>
          </p>
        </section>

        <aside className="sl26-visual" aria-label="Login security highlights">
          <div className="sl26-orb">
            <span className="sl26-shield">
              <ShieldCheck aria-hidden="true" />
              <LockKeyhole aria-hidden="true" />
            </span>
            <i />
            <b />
          </div>
          <div className="sl26-mini sl26-mini--top">
            <Rocket aria-hidden="true" />
            <div>
              <strong>Shop faster after login</strong>
              <p>Cart, checkout, and orders stay in sync.</p>
            </div>
          </div>
          <div className="sl26-mini sl26-mini--bottom">
            <Target aria-hidden="true" />
            <div>
              <strong>Personalized deals</strong>
              <p>See offers that match your account.</p>
            </div>
          </div>
          <Sparkles className="sl26-spark" aria-hidden="true" />
        </aside>

        <BenefitList compact />
      </div>
    </main>
  );
}
