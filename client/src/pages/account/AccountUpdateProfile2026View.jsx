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
}) {
  const inputRef = useRef(null);

  return (
    <article className="tpup2026-panel tpup2026-picture-card">
      <h2>Profile Picture</h2>
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
      <p>JPG, PNG or WEBP. Max size 2MB.</p>
      <div className="tpup2026-picture-actions">
        <button
          type="button"
          className="tpup2026-btn tpup2026-btn-soft"
          disabled={isSaving}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUp aria-hidden="true" />
          <span>{hasAvatar ? "Upload New" : "Upload New"}</span>
        </button>
        <button
          type="button"
          className="tpup2026-btn tpup2026-btn-danger"
          disabled={isSaving || !hasAvatar}
          onClick={onRemoveImage}
        >
          <Trash2 aria-hidden="true" />
          <span>Remove</span>
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
  const hasAvatar = Boolean(form?.avatarUrl || profile?.avatarUrl);

  return (
    <section className="tpup2026-root">
      <header className="tpup2026-heading">
        <div>
          <h1>Update Profile</h1>
          <p>Keep your profile information up to date.</p>
        </div>
        <LinkComponent className="tpup2026-back-link" to="/user/my-account">
          <ArrowLeft aria-hidden="true" />
          <span>Back to My Account</span>
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
            />

            <article className="tpup2026-panel tpup2026-info-card">
              <h2>Personal Information</h2>
              <div className="tpup2026-field-grid">
                <Field
                  icon={User}
                  label="Full Name *"
                  name="name"
                  value={form.name}
                  placeholder="Full Name"
                  error={fieldErrors.name}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <Field
                  icon={Mail}
                  label="Email Address *"
                  name="email"
                  type="email"
                  value={form.email}
                  placeholder="name@example.com"
                  error={fieldErrors.email}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <Field
                  icon={Phone}
                  label="Phone / Mobile"
                  name="phone"
                  value={form.phone}
                  placeholder="Not set"
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <Field
                  icon={CalendarDays}
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  placeholder="Select date"
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <SelectField
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  options={genderOptions}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <SelectField
                  label="Preferred Language"
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
              <h2>Shipping Address</h2>
              <p>This is your default shipping address for deliveries.</p>
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
                Manage Addresses
              </LinkComponent>
            </div>
          </article>

          <div className="tpup2026-actions">
            <button type="submit" className="tpup2026-btn tpup2026-btn-primary" disabled={isSaving}>
              <CheckCircle2 aria-hidden="true" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
            <button
              type="button"
              className="tpup2026-btn tpup2026-btn-neutral"
              disabled={isSaving}
              onClick={onCancel}
            >
              <Save aria-hidden="true" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
