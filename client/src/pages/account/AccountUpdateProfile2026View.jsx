import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ImageUp,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
  User,
} from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import "./account-update-profile-2026.css";

function LoadingBlock() {
  return (
    <div className="tpup2026-loading" aria-label="Loading profile">
      {Array.from({ length: 7 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  name,
  type = "text",
  value,
  placeholder,
  error,
  disabled,
  onFormChange,
}) {
  return (
    <label className="tpup2026-field">
      <span>{label}</span>
      <div className={error ? "tpup2026-input-wrap tpup2026-invalid" : "tpup2026-input-wrap"}>
        {Icon ? <Icon aria-hidden="true" /> : null}
        <input
          type={type}
          name={name}
          value={value || ""}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onFormChange(name, event.target.value)}
        />
      </div>
      {error ? <small>{error}</small> : null}
    </label>
  );
}

function SelectField({ label, name, value, options, disabled, onFormChange }) {
  return (
    <label className="tpup2026-field">
      <span>{label}</span>
      <div className="tpup2026-input-wrap tpup2026-select-wrap">
        <select
          name={name}
          value={value || ""}
          disabled={disabled}
          onChange={(event) => onFormChange(name, event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" />
      </div>
    </label>
  );
}

function ProfilePicture({
  profile,
  hasAvatar,
  isSaving,
  onUploadImage,
  onRemoveImage,
  t,
}) {
  const inputRef = useRef(null);

  return (
    <article className="tpup2026-panel tpup2026-picture-card">
      <h2>{t("updateProfile.profilePicture")}</h2>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="tpup2026-file-input"
        onChange={onUploadImage}
      />
      <div className="tpup2026-avatar" aria-hidden="true">
        {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span>{profile.initials}</span>}
        <i>
          <ImageUp aria-hidden="true" />
        </i>
      </div>
      <p>{t("updateProfile.pictureHint")}</p>
      <div className="tpup2026-picture-actions">
        <button
          type="button"
          className="tpup2026-btn tpup2026-btn-soft"
          disabled={isSaving}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUp aria-hidden="true" />
          <span>{hasAvatar ? t("updateProfile.uploadNew") : t("updateProfile.uploadNew")}</span>
        </button>
        <button
          type="button"
          className="tpup2026-btn tpup2026-btn-danger"
          disabled={isSaving || !hasAvatar}
          onClick={onRemoveImage}
        >
          <Trash2 aria-hidden="true" />
          <span>{t("updateProfile.remove")}</span>
        </button>
      </div>
    </article>
  );
}

export default function AccountUpdateProfile2026View({
  form,
  profile,
  defaultAddress,
  fieldErrors = {},
  genderOptions = [],
  languageOptions = [],
  isLoading,
  isSaving,
  error,
  status,
  LinkComponent,
  onFormChange,
  onSubmit,
  onCancel,
  onUploadImage,
  onRemoveImage,
}) {
  const { t } = useTranslation();
  const hasAvatar = Boolean(form?.avatarUrl || profile?.avatarUrl);

  return (
    <section className="tpup2026-root">
      <header className="tpup2026-heading">
        <div>
          <h1>{t("updateProfile.title")}</h1>
          <p>{t("updateProfile.subtitle")}</p>
        </div>
        <LinkComponent className="tpup2026-back-link" to="/user/my-account">
          <ArrowLeft aria-hidden="true" />
          <span>{t("updateProfile.backToAccount")}</span>
        </LinkComponent>
      </header>

      {error ? (
        <div className="tpup2026-alert tpup2026-alert-error" role="alert">
          {error}
        </div>
      ) : null}

      {status?.message ? (
        <div
          className={
            status.type === "success"
              ? "tpup2026-alert tpup2026-alert-success"
              : "tpup2026-alert tpup2026-alert-error"
          }
          role="status"
        >
          {status.message}
        </div>
      ) : null}

      {isLoading ? (
        <LoadingBlock />
      ) : (
        <form className="tpup2026-form" onSubmit={onSubmit}>
          <div className="tpup2026-top-grid">
            <ProfilePicture
              profile={profile}
              hasAvatar={hasAvatar}
              isSaving={isSaving}
              onUploadImage={onUploadImage}
              onRemoveImage={onRemoveImage}
              t={t}
            />

            <article className="tpup2026-panel tpup2026-info-card">
              <h2>{t("updateProfile.personalInfo")}</h2>
              <div className="tpup2026-field-grid">
                <Field
                  icon={User}
                  label={t("updateProfile.fullName")}
                  name="name"
                  value={form.name}
                  placeholder={t("updateProfile.fullNamePlaceholder")}
                  error={fieldErrors.name}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <Field
                  icon={Mail}
                  label={t("updateProfile.emailAddress")}
                  name="email"
                  type="email"
                  value={form.email}
                  placeholder={t("updateProfile.emailPlaceholder")}
                  error={fieldErrors.email}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <Field
                  icon={Phone}
                  label={t("updateProfile.phone")}
                  name="phone"
                  value={form.phone}
                  placeholder={t("updateProfile.notSet")}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <Field
                  icon={CalendarDays}
                  label={t("updateProfile.dateOfBirth")}
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  placeholder={t("updateProfile.selectDate")}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <SelectField
                  label={t("updateProfile.gender")}
                  name="gender"
                  value={form.gender}
                  options={genderOptions}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <SelectField
                  label={t("updateProfile.preferredLanguage")}
                  name="language"
                  value={form.language}
                  options={languageOptions}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
              </div>
            </article>
          </div>

          <article className="tpup2026-panel tpup2026-address-card">
            <div className="tpup2026-panel-copy">
              <h2>{t("updateProfile.shippingAddress")}</h2>
              <p>{t("updateProfile.shippingAddressDesc")}</p>
            </div>
            <div
              className={
                defaultAddress.hasAddress
                  ? "tpup2026-address-preview"
                  : "tpup2026-address-preview tpup2026-empty"
              }
            >
              <span className="tpup2026-address-icon">
                <MapPin aria-hidden="true" />
              </span>
              <div className="tpup2026-address-body">
                <strong>{defaultAddress.title}</strong>
                <p>{defaultAddress.subtitle}</p>
                {defaultAddress.hasAddress ? <small>{defaultAddress.phone}</small> : null}
              </div>
              <LinkComponent className="tpup2026-manage-link" to="/user/shipping-address">
                {t("updateProfile.manageAddresses")}
              </LinkComponent>
            </div>
          </article>

          <div className="tpup2026-actions">
            <button type="submit" className="tpup2026-btn tpup2026-btn-primary" disabled={isSaving}>
              <CheckCircle2 aria-hidden="true" />
              <span>{isSaving ? t("updateProfile.saving") : t("updateProfile.saveChanges")}</span>
            </button>
            <button
              type="button"
              className="tpup2026-btn tpup2026-btn-neutral"
              disabled={isSaving}
              onClick={onCancel}
            >
              <Save aria-hidden="true" />
              <span>{t("updateProfile.cancel")}</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
