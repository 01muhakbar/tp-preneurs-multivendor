import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import "./account-change-password-2026.css";

function LoadingBlock({ isIndo }) {
  return (
    <div
      className="tppwd2026-loading"
      aria-label={isIndo ? "Memuat formulir sandi..." : "Loading change password..."}
    >
      {Array.from({ length: 4 }).map((_, index) => (
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
  error,
  disabled,
  onFormChange,
  isIndo,
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
          aria-label={
            visible
              ? isIndo
                ? "Sembunyikan kata sandi"
                : "Hide password"
              : isIndo
                ? "Tampilkan kata sandi"
                : "Show password"
          }
          title={
            visible
              ? isIndo
                ? "Sembunyikan kata sandi"
                : "Hide password"
              : isIndo
                ? "Tampilkan kata sandi"
                : "Show password"
          }
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
      {error ? <small className="tppwd2026-error-text">{error}</small> : null}
    </label>
  );
}

function RulesPanel({ rules = [], isIndo }) {
  return (
    <article className="tppwd2026-rules">
      <span className="tppwd2026-rules-icon">
        <ShieldCheck aria-hidden="true" />
      </span>
      <div className="tppwd2026-rules-body">
        <h2>{isIndo ? "Syarat Kata Sandi" : "Password Requirements"}</h2>
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

function StrengthMeter({ strength, isIndo }) {
  return (
    <div className={`tppwd2026-strength tppwd2026-strength-${strength.level}`} role="status">
      <div className="tppwd2026-strength-head">
        <span>{isIndo ? "Kekuatan Sandi:" : "Password Strength:"}</span>
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
  form,
  rules,
  strength,
  fieldErrors = {},
  isLoading,
  isSaving,
  isIndo = false,
  error,
  status,
  LinkComponent,
  onFormChange,
  onSubmit,
  onCancel,
  onForgotPassword,
  onContactSupport,
}) {
  return (
    <section className="tppwd2026-root">
      <header className="tppwd2026-heading">
        <div className="tppwd2026-heading-copy">
          <LinkComponent className="tppwd2026-back-link" to="/user/my-account">
            <ArrowLeft aria-hidden="true" />
            <span>{isIndo ? "Kembali ke Akun Saya" : "Back to My Account"}</span>
          </LinkComponent>
          <div className="tppwd2026-title-row">
            <h1>{isIndo ? "Ganti Kata Sandi" : "Change Password"}</h1>
            <span className="tppwd2026-title-shield" aria-hidden="true">
              <ShieldCheck />
            </span>
          </div>
          <p>
            {isIndo
              ? "Perbarui kata sandi untuk menjaga keamanan akun Anda."
              : "Update your password to keep your account secure."}
          </p>
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
        <LoadingBlock isIndo={isIndo} />
      ) : (
        <>
          <RulesPanel rules={rules} isIndo={isIndo} />

          <form className="tppwd2026-form-panel" onSubmit={onSubmit}>
            <PasswordField
              label={isIndo ? "Kata Sandi Saat Ini *" : "Current Password *"}
              name="currentPassword"
              value={form.currentPassword}
              placeholder={isIndo ? "Masukkan kata sandi saat ini" : "Enter current password"}
              autoComplete="current-password"
              error={fieldErrors.currentPassword}
              disabled={isSaving}
              onFormChange={onFormChange}
              isIndo={isIndo}
            />

            <PasswordField
              label={isIndo ? "Kata Sandi Baru *" : "New Password *"}
              name="newPassword"
              value={form.newPassword}
              placeholder={isIndo ? "Masukkan kata sandi baru" : "Enter new password"}
              autoComplete="new-password"
              error={fieldErrors.newPassword}
              disabled={isSaving}
              onFormChange={onFormChange}
              isIndo={isIndo}
            />

            <StrengthMeter strength={strength} isIndo={isIndo} />

            <PasswordField
              label={isIndo ? "Konfirmasi Kata Sandi Baru *" : "Confirm New Password *"}
              name="confirmPassword"
              value={form.confirmPassword}
              placeholder={isIndo ? "Ulangi kata sandi baru" : "Confirm new password"}
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
              disabled={isSaving}
              onFormChange={onFormChange}
              isIndo={isIndo}
            />

            <div className="tppwd2026-secondary-actions">
              <button type="button" onClick={onForgotPassword} disabled={isSaving}>
                <KeyRound aria-hidden="true" />
                <span>{isIndo ? "Lupa Kata Sandi?" : "Forgot Password?"}</span>
              </button>
              <button type="button" onClick={onContactSupport} disabled={isSaving}>
                <HelpCircle aria-hidden="true" />
                <span>{isIndo ? "Bantuan Dukungan" : "Contact Support"}</span>
              </button>
            </div>

            <div className="tppwd2026-actions">
              <button type="submit" className="tppwd2026-btn tppwd2026-btn-primary" disabled={isSaving}>
                <LockKeyhole aria-hidden="true" />
                <span>
                  {isSaving
                    ? isIndo
                      ? "Menyimpan..."
                      : "Changing..."
                    : isIndo
                      ? "Ganti Kata Sandi"
                      : "Change Password"}
                </span>
              </button>
              <button
                type="button"
                className="tppwd2026-btn tppwd2026-btn-neutral"
                disabled={isSaving}
                onClick={onCancel}
              >
                <span>{isIndo ? "Batal" : "Cancel"}</span>
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
