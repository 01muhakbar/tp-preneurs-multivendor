import {
  ArrowLeft,
  Building2,
  Check,
  Home,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import "./account-shipping-address-2026.css";

function LoadingState() {
  return (
    <div className="tpship2026-loading" aria-label="Loading addresses">
      {Array.from({ length: 4 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function FieldError({ message }) {
  return message ? <span className="tpship2026-field-error">{message}</span> : null;
}

function TextField({
  label,
  name,
  value,
  onFormChange,
  error,
  placeholder,
  type = "text",
  inputMode,
  readOnly,
}) {
  return (
    <label className="tpship2026-field">
      <span>{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value || ""}
        onChange={(event) => onFormChange(name, event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={error ? "tpship2026-invalid" : ""}
      />
      <FieldError message={error} />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  options,
  onFormChange,
  error,
  placeholder,
  disabled,
}) {
  return (
    <label className="tpship2026-field">
      <span>{label}</span>
      <select
        value={value || ""}
        onChange={(event) => onFormChange(name, event.target.value)}
        disabled={disabled}
        className={error ? "tpship2026-invalid" : ""}
      >
        <option value="">{placeholder}</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </label>
  );
}

function AddressCard({
  address,
  onEditAddress,
  onDeleteAddress,
  onMakePrimary,
  isSaving,
  t,
}) {
  const TypeIcon = address.label === "OFFICE" ? Building2 : Home;
  return (
    <article className="tpship2026-card">
      <div className="tpship2026-card-top">
        <div className="tpship2026-badges">
          {address.isPrimary ? <span className="tpship2026-badge-primary">{t("shippingAddress.primary")}</span> : null}
          {address.isStore ? <span>{t("shippingAddress.store")}</span> : null}
          {address.isReturn ? <span>{t("shippingAddress.return")}</span> : null}
        </div>
        <button type="button" className="tpship2026-icon-button" aria-label={t("shippingAddress.addressActions")}>
          <MoreVertical aria-hidden="true" />
        </button>
      </div>

      <div className="tpship2026-card-title">
        <TypeIcon aria-hidden="true" />
        <h2>{address.title}</h2>
      </div>

      <div className="tpship2026-card-lines">
        <p>{address.line1 || address.summary}</p>
        {address.line2 ? <p>{address.line2}</p> : null}
        {address.cityLine ? <p>{address.cityLine}</p> : null}
        <p>{address.country}</p>
        <p>{address.phoneNumber}</p>
      </div>

      <div className="tpship2026-card-actions">
        <button type="button" onClick={() => onEditAddress(address.raw)} disabled={isSaving}>
          <Pencil aria-hidden="true" />
          {t("shippingAddress.edit")}
        </button>
        <button
          type="button"
          onClick={() => onMakePrimary(address.raw)}
          disabled={isSaving || address.isPrimary}
        >
          <Star aria-hidden="true" />
          {t("shippingAddress.makePrimary")}
        </button>
        <button
          type="button"
          className="tpship2026-danger"
          onClick={() => onDeleteAddress(address.raw)}
          disabled={isSaving || address.isPrimary}
          title={address.isPrimary ? "Cannot delete primary address" : ""}
        >
          <Trash2 aria-hidden="true" />
          {t("shippingAddress.delete")}
        </button>
      </div>
    </article>
  );
}

export default function AccountShippingAddress2026View({
  account,
  addresses,
  form,
  fieldErrors,
  provinceOptions,
  cityOptions,
  districtOptions = [],
  activeTab,
  isLoading,
  isSaving,
  error,
  status,
  LinkComponent,
  onTabChange,
  onFocusForm,
  onFormChange,
  onSubmit,
  onEditAddress,
  onDeleteAddress,
  onMakePrimary,
  onResetForm,
}) {
  const { t } = useTranslation();
  const isEditing = Boolean(form?.id);
  const savedCount = addresses.length;

  return (
    <section className="tpship2026-root">
      <header className="tpship2026-heading">
        <div>
          <h1>{t("shippingAddress.title")}</h1>
          <p>{t("shippingAddress.subtitle")}</p>
        </div>
        <LinkComponent className="tpship2026-back" to="/user/my-account">
          <ArrowLeft aria-hidden="true" />
          {t("shippingAddress.backToAccount")}
        </LinkComponent>
      </header>

      <div className="tpship2026-tabs" role="tablist" aria-label="Shipping address sections">
        <button
          type="button"
          className={activeTab === "saved" ? "tpship2026-active" : ""}
          onClick={() => onTabChange("saved")}
        >
          {t("shippingAddress.savedAddresses")} <span>{savedCount}</span>
        </button>
        <button
          type="button"
          className={activeTab === "form" ? "tpship2026-active" : ""}
          onClick={onFocusForm}
        >
          {isEditing ? t("shippingAddress.editAddress") : t("shippingAddress.addNewAddress")}
        </button>
      </div>

      {error ? (
        <div className="tpship2026-alert" role="alert">
          {error}
        </div>
      ) : null}
      {status?.message ? (
        <div className={`tpship2026-status tpship2026-status--${status.type}`} role="status">
          {status.message}
        </div>
      ) : null}

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          <section
            className={`tpship2026-saved ${
              activeTab === "saved" ? "" : "tpship2026-collapsed"
            }`}
            aria-label="Saved shipping addresses"
          >
            <div className="tpship2026-saved-head">
              <div>
                <h2>{t("shippingAddress.savedAddresses")}</h2>
                <p>{account.email}</p>
              </div>
              <button type="button" onClick={() => onResetForm("form")}>
                <Plus aria-hidden="true" />
                {t("shippingAddress.addAddress")}
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="tpship2026-empty">
                <MapPin aria-hidden="true" />
                <h2>{t("shippingAddress.noAddressTitle")}</h2>
                <p>{t("shippingAddress.noAddressDesc")}</p>
                <button type="button" onClick={() => onResetForm("form")}>
                  <Plus aria-hidden="true" />
                  {t("shippingAddress.addNewAddress")}
                </button>
              </div>
            ) : (
              <div className="tpship2026-card-grid">
                {addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    onEditAddress={onEditAddress}
                    onDeleteAddress={onDeleteAddress}
                    onMakePrimary={onMakePrimary}
                    isSaving={isSaving}
                    t={t}
                  />
                ))}
              </div>
            )}
          </section>

          <form
            className={`tpship2026-form ${
              activeTab === "form" ? "" : "tpship2026-collapsed"
            }`}
            onSubmit={onSubmit}
          >
            <div className="tpship2026-form-head">
              <span>
                <MapPin aria-hidden="true" />
              </span>
              <div>
                <h2>{isEditing ? t("shippingAddress.editAddress") : t("shippingAddress.addNewAddress")}</h2>
                <p>{account.name}</p>
              </div>
            </div>

            <div className="tpship2026-form-grid">
              <TextField
                label={t("shippingAddress.firstName")}
                name="firstName"
                value={form.firstName}
                onFormChange={onFormChange}
                error={fieldErrors.firstName}
                placeholder={t("shippingAddress.firstNamePlaceholder")}
              />
              <TextField
                label={t("shippingAddress.lastName")}
                name="lastName"
                value={form.lastName}
                onFormChange={onFormChange}
                error={fieldErrors.lastName}
                placeholder={t("shippingAddress.lastNamePlaceholder")}
              />
              <TextField
                label={t("shippingAddress.phoneNumber")}
                name="phoneNumber"
                value={form.phoneNumber}
                onFormChange={onFormChange}
                error={fieldErrors.phoneNumber}
                placeholder="08xxxxxxxxxx"
              />
              <TextField
                label={t("shippingAddress.email")}
                name="emailAddress"
                value={form.emailAddress}
                onFormChange={onFormChange}
                error={fieldErrors.emailAddress}
                placeholder={t("shippingAddress.emailPlaceholder")}
                type="email"
                readOnly={Boolean(account.email && account.email !== "Not set")}
              />
              <SelectField
                label={t("shippingAddress.province")}
                name="province"
                value={form.province}
                options={provinceOptions}
                onFormChange={onFormChange}
                error={fieldErrors.province}
                placeholder={t("shippingAddress.selectProvince")}
              />
              <SelectField
                label={t("shippingAddress.cityRegency")}
                name="city"
                value={form.city}
                options={cityOptions}
                onFormChange={onFormChange}
                error={fieldErrors.city}
                placeholder={form.province ? t("shippingAddress.selectCity") : t("shippingAddress.selectProvinceFirst")}
                disabled={!form.province}
              />
              <SelectField
                label={t("shippingAddress.subdistrict")}
                name="district"
                value={form.district}
                options={districtOptions}
                onFormChange={onFormChange}
                error={fieldErrors.district}
                placeholder={form.city ? t("shippingAddress.selectSubdistrict") : t("shippingAddress.selectCityFirst")}
                disabled={!form.city}
              />
              <TextField
                label={t("shippingAddress.postalCode")}
                name="postalCode"
                value={form.postalCode}
                onFormChange={onFormChange}
                error={fieldErrors.postalCode}
                placeholder="12345"
                inputMode="numeric"
              />
              <TextField
                label={t("shippingAddress.streetName")}
                name="streetName"
                value={form.streetName}
                onFormChange={onFormChange}
                error={fieldErrors.streetName}
                placeholder={t("shippingAddress.streetNamePlaceholder")}
              />
              <TextField
                label={t("shippingAddress.houseNumber")}
                name="houseNumber"
                value={form.houseNumber}
                onFormChange={onFormChange}
                error={fieldErrors.houseNumber}
                placeholder={t("shippingAddress.houseNumberPlaceholder")}
              />
              <TextField
                label={t("shippingAddress.building")}
                name="building"
                value={form.building}
                onFormChange={onFormChange}
                placeholder={t("shippingAddress.buildingPlaceholder")}
              />
              <label className="tpship2026-field tpship2026-wide-field">
                <span>{t("shippingAddress.otherDetails")}</span>
                <textarea
                  value={form.otherDetails || ""}
                  onChange={(event) => onFormChange("otherDetails", event.target.value)}
                  placeholder={t("shippingAddress.otherDetailsPlaceholder")}
                />
              </label>
            </div>

            <div className="tpship2026-options">
              <div className="tpship2026-radio-group" aria-label="Address type">
                <button
                  type="button"
                  className={form.markAs === "HOME" ? "tpship2026-active" : ""}
                  onClick={() => onFormChange("markAs", "HOME")}
                >
                  <Home aria-hidden="true" />
                  {t("shippingAddress.home")}
                </button>
                <button
                  type="button"
                  className={form.markAs === "OFFICE" ? "tpship2026-active" : ""}
                  onClick={() => onFormChange("markAs", "OFFICE")}
                >
                  <Building2 aria-hidden="true" />
                  {t("shippingAddress.office")}
                </button>
              </div>

              <div className="tpship2026-checks">
                {[
                  ["isPrimary", t("shippingAddress.setAsPrimary")],
                  ["isStore", t("shippingAddress.setAsStore")],
                  ["isReturn", t("shippingAddress.setAsReturn")],
                ].map(([name, label]) => (
                  <label key={name}>
                    <input
                      type="checkbox"
                      checked={Boolean(form[name])}
                      onChange={(event) => onFormChange(name, event.target.checked)}
                    />
                    <span>
                      <Check aria-hidden="true" />
                    </span>
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="tpship2026-form-actions">
              {isEditing ? (
                <button
                  type="button"
                  className="tpship2026-secondary"
                  onClick={() => onResetForm("saved")}
                  disabled={isSaving}
                >
                  {t("shippingAddress.cancelEdit")}
                </button>
              ) : null}
              <button type="submit" disabled={isSaving}>
                <Save aria-hidden="true" />
                {isSaving ? t("shippingAddress.saving") : isEditing ? t("shippingAddress.updateAddress") : t("shippingAddress.saveAddress")}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
