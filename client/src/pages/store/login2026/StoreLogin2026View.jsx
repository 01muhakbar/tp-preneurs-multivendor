import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
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
import { useTranslation } from "react-i18next";
import "./store-login-2026.css";

const benefits = [
  {
    icon: ShieldCheck,
    titleKey: "login.benefitSecure",
    textKey: "login.benefitSecureDesc",
  },
  {
    icon: Zap,
    titleKey: "login.benefitFast",
    textKey: "login.benefitFastDesc",
  },
  {
    icon: Gift,
    titleKey: "login.benefitExclusive",
    textKey: "login.benefitExclusiveDesc",
  },
];

function BenefitList({ compact = false }) {
  const { t } = useTranslation();
  return (
    <div className={compact ? "sl26-mobile-benefits" : "sl26-benefits"}>
      {benefits.map((item) => {
        const Icon = item.icon;
        return (
          <div className="sl26-benefit" key={item.titleKey}>
            <span>
              <Icon aria-hidden="true" />
            </span>
            <div>
              <strong>{t(item.titleKey)}</strong>
              <p>{t(item.textKey)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusMessage({ id, tone, children, focusRef }) {
  if (!children) return null;
  const Icon =
    tone === "error" ? LockKeyhole : tone === "warning" ? CircleAlert : BadgeCheck;
  return (
    <div
      id={id}
      ref={focusRef}
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      aria-live={tone === "error" || tone === "warning" ? "assertive" : "polite"}
      tabIndex={-1}
      className={`sl26-message sl26-message--${tone}`}
    >
      <Icon aria-hidden="true" />
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
  const { t } = useTranslation();
  const passwordToggleLabel = form.showPassword ? t("login.hidePassword") : t("login.showPassword");

  return (
    <main className="sl26-page">
      <div className="sl26-shell">
        <section className="sl26-copy" aria-labelledby="store-login-title">
          <span className="sl26-chip">{t("login.welcomeBack")}</span>
          <h1 id="store-login-title">
            {t("login.signInTo")} <span>{t("login.yourAccount")}</span>
          </h1>
          <p>{t("login.subtitle")}</p>
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
              <h2>{t("login.memberLogin")}</h2>
              <p>{t("login.continueTo")}</p>
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
              <label htmlFor="store-login-email">{t("login.email")}</label>
              <input
                id="store-login-email"
                ref={fieldRefs.emailRef}
                type="email"
                value={form.email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder={t("login.emailPlaceholder")}
                autoComplete="email"
                required
              />
            </div>

            <div className="sl26-field">
              <label htmlFor="store-login-password">{t("login.password")}</label>
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
                <span>{t("login.rememberMe")}</span>
              </label>
              <button type="button" onClick={onForgotPassword}>
                {t("login.forgotPassword")}
              </button>
            </div>

            <p id="store-login-password-helper" className="sl26-helper">
              {status.helperMessage}
            </p>

            <StatusMessage
              id="store-login-status"
              tone={status.noticeMessage ? "warning" : "success"}
              focusRef={messageRefs.statusRef}
            >
              {status.noticeMessage || status.successMessage}
            </StatusMessage>
            <StatusMessage id="store-login-error" tone="error" focusRef={messageRefs.errorRef}>
              {status.errorMessage}
            </StatusMessage>

            <button className="sl26-submit" type="submit" disabled={disabled}>
              {submitting ? t("login.signingIn") : status.submitLabel}
            </button>
          </form>

          <p className="sl26-register">
            {t("login.newHere")}{" "}
            <button type="button" onClick={onCreateAccount}>
              {t("login.createAccount")}
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
              <strong>{t("login.shopFaster")}</strong>
              <p>{t("login.shopFasterDesc")}</p>
            </div>
          </div>
          <div className="sl26-mini sl26-mini--bottom">
            <Target aria-hidden="true" />
            <div>
              <strong>{t("login.personalizedDeals")}</strong>
              <p>{t("login.personalizedDealsDesc")}</p>
            </div>
          </div>
          <Sparkles className="sl26-spark" aria-hidden="true" />
        </aside>

        <BenefitList compact />
      </div>
    </main>
  );
}
