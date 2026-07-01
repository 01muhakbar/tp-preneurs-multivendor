import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import "./account-change-password-2026.css";

function LoadingBlock() {
  return (
    <div className="tppwd2026-loading" aria-label="Loading change password">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function PasswordField({
  label,
  name,
  value,
  placeholder,
  autoComplete,
  helper,
  error,
  disabled,
  onFormChange,
  t,
}) {
  const [visible, setVisible] = useState(false);
  const inputType = visible ? "text" : "password";

  return (
    <label className="tppwd2026-field">
      <span>{label}</span>
      <div className={error ? "tppwd2026-input-wrap tppwd2026-invalid" : "tppwd2026-input-wrap"}>
        <LockKeyhole aria-hidden="true" />
        <input
          type={inputType}
          name={name}
          value={value || ""}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          onChange={(event) => onFormChange(name, event.target.value)}
        />
        <button
          type="button"
          className="tppwd2026-eye-btn"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? `${t("changePassword.hide")} ${label}` : `${t("changePassword.show")} ${label}`}
          title={visible ? `${t("changePassword.hide")} ${label}` : `${t("changePassword.show")} ${label}`}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
      {error ? <small className="tppwd2026-error-text">{error}</small> : null}
      {helper && !error ? <small>{helper}</small> : null}
    </label>
  );
}

function RulesPanel({ rules, t }) {
  return (
    <article className="tppwd2026-rules">
      <span className="tppwd2026-rules-icon">
        <ShieldCheck aria-hidden="true" />
      </span>
      <div>
        <h2>{t("changePassword.passwordRequirements")}</h2>
        <ul>
          {rules.map((rule) => (
            <li key={rule.id} className={rule.isMet ? "tppwd2026-rule-met" : ""}>
              {rule.isMet ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
              <span>{rule.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function StrengthMeter({ strength, t }) {
  return (
    <div className={`tppwd2026-strength tppwd2026-strength-${strength.level}`} role="status">
      <div className="tppwd2026-strength-head">
        <span>{t("changePassword.passwordStrength")}</span>
        <strong>{strength.label}</strong>
      </div>
      <div className="tppwd2026-strength-bars" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <span
            key={index}
            className={index < strength.activeBars ? "tppwd2026-strength-active" : ""}
          />
        ))}
      </div>
      <p>{strength.helper}</p>
    </div>
  );
}

export default function AccountChangePassword2026View({
  account,
  form,
  rules,
  strength,
  fieldErrors = {},
  isLoading,
  isSaving,
  error,
  status,
  LinkComponent,
  onFormChange,
  onSubmit,
  onCancel,
  onForgotPassword,
  onContactSupport,
}) {
  const { t } = useTranslation();

  return (
    <section className="tppwd2026-root">
      <header className="tppwd2026-heading">
        <div>
          <LinkComponent className="tppwd2026-back-link" to="/user/my-account">
            <ArrowLeft aria-hidden="true" />
            <span>{t("changePassword.backToAccount")}</span>
          </LinkComponent>
          <div className="tppwd2026-title-row">
            <h1>{t("changePassword.title")}</h1>
            <span>
              <ShieldCheck aria-hidden="true" />
            </span>
          </div>
          <p>{t("changePassword.subtitle")}</p>
        </div>
        <div className="tppwd2026-hero" aria-hidden="true">
          <span>
            <LockKeyhole />
          </span>
        </div>
      </header>

      {error ? (
        <div className="tppwd2026-alert tppwd2026-alert-error" role="alert">
          {error}
        </div>
      ) : null}

      {status?.message ? (
        <div
          className={
            status.type === "success"
              ? "tppwd2026-alert tppwd2026-alert-success"
              : "tppwd2026-alert tppwd2026-alert-error"
          }
          role={status.type === "success" ? "status" : "alert"}
        >
          {status.message}
        </div>
      ) : null}

      {isLoading ? (
        <LoadingBlock />
      ) : (
        <>
          <RulesPanel rules={rules} t={t} />

          <form className="tppwd2026-form-panel" onSubmit={onSubmit}>
            <div className="tppwd2026-account-strip">
              <div className="tppwd2026-avatar" aria-hidden="true">
                {account.avatarUrl ? <img src={account.avatarUrl} alt="" /> : <span>{account.initials}</span>}
              </div>
              <div>
                <strong>{account.name}</strong>
                <span>
                  <Mail aria-hidden="true" />
                  {account.email}
                </span>
              </div>
              <em>{account.badgeLabel}</em>
            </div>

            <PasswordField
              label={t("changePassword.currentPassword")}
              name="currentPassword"
              value={form.currentPassword}
              placeholder={t("changePassword.currentPasswordPlaceholder")}
              autoComplete="current-password"
              helper={t("changePassword.currentPasswordHelper")}
              error={fieldErrors.currentPassword}
              disabled={isSaving}
              onFormChange={onFormChange}
              t={t}
            />

            <PasswordField
              label={t("changePassword.newPassword")}
              name="newPassword"
              value={form.newPassword}
              placeholder={t("changePassword.newPasswordPlaceholder")}
              autoComplete="new-password"
              error={fieldErrors.newPassword}
              disabled={isSaving}
              onFormChange={onFormChange}
              t={t}
            />
            <StrengthMeter strength={strength} t={t} />

            <PasswordField
              label={t("changePassword.confirmPassword")}
              name="confirmPassword"
              value={form.confirmPassword}
              placeholder={t("changePassword.confirmPasswordPlaceholder")}
              autoComplete="new-password"
              helper={t("changePassword.confirmPasswordHelper")}
              error={fieldErrors.confirmPassword}
              disabled={isSaving}
              onFormChange={onFormChange}
              t={t}
            />

            <div className="tppwd2026-secondary-actions">
              <button type="button" onClick={onForgotPassword} disabled={isSaving}>
                <KeyRound aria-hidden="true" />
                <span>{t("changePassword.forgotPassword")}</span>
              </button>
              <button type="button" onClick={onContactSupport} disabled={isSaving}>
                <HelpCircle aria-hidden="true" />
                <span>{t("changePassword.contactSupport")}</span>
              </button>
            </div>

            <div className="tppwd2026-actions">
              <button type="submit" className="tppwd2026-btn tppwd2026-btn-primary" disabled={isSaving}>
                <LockKeyhole aria-hidden="true" />
                <span>{isSaving ? t("changePassword.changing") : t("changePassword.changeBtn")}</span>
              </button>
              <button
                type="button"
                className="tppwd2026-btn tppwd2026-btn-neutral"
                disabled={isSaving}
                onClick={onCancel}
              >
                <span>{t("changePassword.cancel")}</span>
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
