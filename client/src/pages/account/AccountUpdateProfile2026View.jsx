import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  ImageUp,
  Mail,
  MapPin,
  Phone,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import "./account-update-profile-2026.css";

function LoadingBlock({ isIndo }) {
  return (
    <div className="tpup2026-loading" aria-label={isIndo ? "Memuat profil..." : "Loading profile..."}>
      {Array.from({ length: 6 }).map((_, index) => (
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

function SelectField({ label, name, value, options = [], disabled, onFormChange }) {
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
  isIndo,
  onUploadImage,
  onRemoveImage,
}) {
  const inputRef = useRef(null);

  return (
    <article className="tpup2026-panel tpup2026-picture-card">
      <div className="tpup2026-panel-header">
        <h2>{isIndo ? "Foto Profil" : "Profile Picture"}</h2>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="tpup2026-file-input"
        onChange={onUploadImage}
      />
      <div
        className="tpup2026-avatar"
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label={isIndo ? "Ganti foto profil" : "Change profile picture"}
        title={isIndo ? "Klik untuk mengubah foto" : "Click to change photo"}
      >
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.name || "User Avatar"} />
        ) : (
          <span>{profile.initials}</span>
        )}
        <i aria-hidden="true">
          <Camera />
        </i>
      </div>
      <p className="tpup2026-picture-hint">
        {isIndo ? "Format JPG, PNG, atau WEBP. Maks 2MB." : "JPG, PNG or WEBP. Max size 2MB."}
      </p>
      <div className="tpup2026-picture-actions">
        <button
          type="button"
          className="tpup2026-btn tpup2026-btn-soft"
          disabled={isSaving}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUp aria-hidden="true" />
          <span>{hasAvatar ? (isIndo ? "Ganti Foto" : "Upload New") : (isIndo ? "Unggah Baru" : "Upload New")}</span>
        </button>
        {hasAvatar ? (
          <button
            type="button"
            className="tpup2026-btn tpup2026-btn-danger"
            disabled={isSaving}
            onClick={onRemoveImage}
          >
            <Trash2 aria-hidden="true" />
            <span>{isIndo ? "Hapus" : "Remove"}</span>
          </button>
        ) : null}
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
  isIndo = false,
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

  const titleText = isIndo ? "Ubah Profil" : "Update Profile";
  const subtitleText = isIndo
    ? "Perbarui rincian informasi dan preferensi akun Anda."
    : "Keep your profile details and preferences up to date.";
  const backText = isIndo ? "Kembali ke Akun Saya" : "Back to My Account";

  return (
    <section className="tpup2026-root">
      <header className="tpup2026-heading">
        <div className="tpup2026-heading-copy">
          <h1>{titleText}</h1>
          <p>{subtitleText}</p>
        </div>
        <LinkComponent className="tpup2026-back-link" to="/user/my-account">
          <ArrowLeft aria-hidden="true" />
          <span>{backText}</span>
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
        <LoadingBlock isIndo={isIndo} />
      ) : (
        <form className="tpup2026-form" onSubmit={onSubmit}>
          <div className="tpup2026-top-grid">
            <ProfilePicture
              profile={profile}
              hasAvatar={hasAvatar}
              isSaving={isSaving}
              isIndo={isIndo}
              onUploadImage={onUploadImage}
              onRemoveImage={onRemoveImage}
            />

            <article className="tpup2026-panel tpup2026-info-card">
              <div className="tpup2026-panel-header">
                <h2>{isIndo ? "Informasi Pribadi" : "Personal Information"}</h2>
              </div>
              <div className="tpup2026-field-grid">
                <Field
                  icon={User}
                  label={isIndo ? "Nama Lengkap *" : "Full Name *"}
                  name="name"
                  value={form.name}
                  placeholder={isIndo ? "Masukkan nama lengkap" : "Enter full name"}
                  error={fieldErrors.name}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <Field
                  icon={Mail}
                  label={isIndo ? "Alamat Email *" : "Email Address *"}
                  name="email"
                  type="email"
                  value={form.email}
                  placeholder={isIndo ? "nama@contoh.com" : "name@example.com"}
                  error={fieldErrors.email}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <Field
                  icon={Phone}
                  label={isIndo ? "Telepon / No. HP" : "Phone / Mobile"}
                  name="phone"
                  value={form.phone}
                  placeholder={isIndo ? "Belum diatur" : "Not set"}
                  error={fieldErrors.phone}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <Field
                  icon={CalendarDays}
                  label={isIndo ? "Tanggal Lahir" : "Date of Birth"}
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <SelectField
                  label={isIndo ? "Jenis Kelamin" : "Gender"}
                  name="gender"
                  value={form.gender}
                  options={genderOptions}
                  disabled={isSaving}
                  onFormChange={onFormChange}
                />
                <SelectField
                  label={isIndo ? "Bahasa Pilihan" : "Preferred Language"}
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
            <div className="tpup2026-panel-header">
              <h2>{isIndo ? "Alamat Pengiriman Utama" : "Shipping Address"}</h2>
              <p>
                {isIndo
                  ? "Alamat pengiriman default untuk mempercepat pesanan Anda."
                  : "This is your default shipping address for deliveries."}
              </p>
            </div>
            <div
              className={
                defaultAddress?.hasAddress
                  ? "tpup2026-address-preview"
                  : "tpup2026-address-preview tpup2026-empty"
              }
            >
              <span className="tpup2026-address-icon">
                <MapPin aria-hidden="true" />
              </span>
              <div className="tpup2026-address-body">
                <div className="tpup2026-address-title-row">
                  <strong>{defaultAddress?.title}</strong>
                  {defaultAddress?.label ? (
                    <span className="tpup2026-address-badge">{defaultAddress.label}</span>
                  ) : null}
                </div>
                <p>{defaultAddress?.subtitle}</p>
                {defaultAddress?.hasAddress && defaultAddress?.phone ? (
                  <small>{defaultAddress.phone}</small>
                ) : null}
              </div>
              <LinkComponent className="tpup2026-manage-link" to="/user/shipping-address">
                {isIndo ? "Kelola Alamat" : "Manage Addresses"}
              </LinkComponent>
            </div>
          </article>

          <div className="tpup2026-actions">
            <button type="submit" className="tpup2026-btn tpup2026-btn-primary" disabled={isSaving}>
              <CheckCircle2 aria-hidden="true" />
              <span>
                {isSaving
                  ? isIndo
                    ? "Menyimpan..."
                    : "Saving..."
                  : isIndo
                    ? "Simpan Perubahan"
                    : "Save Changes"}
              </span>
            </button>
            <button
              type="button"
              className="tpup2026-btn tpup2026-btn-neutral"
              disabled={isSaving}
              onClick={onCancel}
            >
              <X aria-hidden="true" />
              <span>{isIndo ? "Batal" : "Cancel"}</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
