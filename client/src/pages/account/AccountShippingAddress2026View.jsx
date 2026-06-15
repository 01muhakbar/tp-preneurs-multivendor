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
}) {
  const TypeIcon = address.label === "OFFICE" ? Building2 : Home;
  return (
    <article className="tpship2026-card">
      <div className="tpship2026-card-top">
        <div className="tpship2026-badges">
          {address.isPrimary ? <span className="tpship2026-badge-primary">Primary</span> : null}
          {address.isStore ? <span>Store</span> : null}
          {address.isReturn ? <span>Return</span> : null}
        </div>
        <button type="button" className="tpship2026-icon-button" aria-label="Address actions">
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
          Edit
        </button>
        <button
          type="button"
          onClick={() => onMakePrimary(address.raw)}
          disabled={isSaving || address.isPrimary}
        >
          <Star aria-hidden="true" />
          Make Primary
        </button>
        <button
          type="button"
          className="tpship2026-danger"
          onClick={() => onDeleteAddress(address.raw)}
          disabled={isSaving}
        >
          <Trash2 aria-hidden="true" />
          Delete
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
  const isEditing = Boolean(form?.id);
  const savedCount = addresses.length;

  return (
    <section className="tpship2026-root">
      <header className="tpship2026-heading">
        <div>
          <h1>Shipping Addresses</h1>
          <p>Manage your delivery, store, and return addresses.</p>
        </div>
        <LinkComponent className="tpship2026-back" to="/user/my-account">
          <ArrowLeft aria-hidden="true" />
          Back to My Account
        </LinkComponent>
      </header>

      <div className="tpship2026-tabs" role="tablist" aria-label="Shipping address sections">
        <button
          type="button"
          className={activeTab === "saved" ? "tpship2026-active" : ""}
          onClick={() => onTabChange("saved")}
        >
          Saved Addresses <span>{savedCount}</span>
        </button>
        <button
          type="button"
          className={activeTab === "form" ? "tpship2026-active" : ""}
          onClick={onFocusForm}
        >
          {isEditing ? "Edit Address" : "Add New Address"}
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
                <h2>Saved Addresses</h2>
                <p>{account.email}</p>
              </div>
              <button type="button" onClick={() => onResetForm("form")}>
                <Plus aria-hidden="true" />
                Add Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="tpship2026-empty">
                <MapPin aria-hidden="true" />
                <h2>No address saved yet</h2>
                <p>Add your first shipping address to use it at checkout.</p>
                <button type="button" onClick={() => onResetForm("form")}>
                  <Plus aria-hidden="true" />
                  Add New Address
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
                <h2>{isEditing ? "Edit Address" : "Add New Address"}</h2>
                <p>{account.name}</p>
              </div>
            </div>

            <div className="tpship2026-form-grid">
              <TextField
                label="First Name *"
                name="firstName"
                value={form.firstName}
                onFormChange={onFormChange}
                error={fieldErrors.firstName}
                placeholder="First Name"
              />
              <TextField
                label="Last Name *"
                name="lastName"
                value={form.lastName}
                onFormChange={onFormChange}
                error={fieldErrors.lastName}
                placeholder="Last Name"
              />
              <TextField
                label="Phone Number *"
                name="phoneNumber"
                value={form.phoneNumber}
                onFormChange={onFormChange}
                error={fieldErrors.phoneNumber}
                placeholder="08xxxxxxxxxx"
              />
              <TextField
                label="Email *"
                name="emailAddress"
                value={form.emailAddress}
                onFormChange={onFormChange}
                error={fieldErrors.emailAddress}
                placeholder="Email"
                type="email"
                readOnly={Boolean(account.email && account.email !== "Not set")}
              />
              <SelectField
                label="Province *"
                name="province"
                value={form.province}
                options={provinceOptions}
                onFormChange={onFormChange}
                error={fieldErrors.province}
                placeholder="Select Province"
              />
              <SelectField
                label="City / Regency *"
                name="city"
                value={form.city}
                options={cityOptions}
                onFormChange={onFormChange}
                error={fieldErrors.city}
                placeholder={form.province ? "Select City / Regency" : "Select Province first"}
                disabled={!form.province}
              />
              <SelectField
                label="Subdistrict *"
                name="district"
                value={form.district}
                options={districtOptions}
                onFormChange={onFormChange}
                error={fieldErrors.district}
                placeholder={form.city ? "Select Subdistrict" : "Select City / Regency first"}
                disabled={!form.city}
              />
              <TextField
                label="Postal Code *"
                name="postalCode"
                value={form.postalCode}
                onFormChange={onFormChange}
                error={fieldErrors.postalCode}
                placeholder="12345"
                inputMode="numeric"
              />
              <TextField
                label="Street Name *"
                name="streetName"
                value={form.streetName}
                onFormChange={onFormChange}
                error={fieldErrors.streetName}
                placeholder="Street Name"
              />
              <TextField
                label="House Number *"
                name="houseNumber"
                value={form.houseNumber}
                onFormChange={onFormChange}
                error={fieldErrors.houseNumber}
                placeholder="House Number"
              />
              <TextField
                label="Building"
                name="building"
                value={form.building}
                onFormChange={onFormChange}
                placeholder="Building / Floor / Unit"
              />
              <label className="tpship2026-field tpship2026-wide-field">
                <span>Other Details</span>
                <textarea
                  value={form.otherDetails || ""}
                  onChange={(event) => onFormChange("otherDetails", event.target.value)}
                  placeholder="E.g. Near the mosque, unit 5A"
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
                  Home
                </button>
                <button
                  type="button"
                  className={form.markAs === "OFFICE" ? "tpship2026-active" : ""}
                  onClick={() => onFormChange("markAs", "OFFICE")}
                >
                  <Building2 aria-hidden="true" />
                  Office
                </button>
              </div>

              <div className="tpship2026-checks">
                {[
                  ["isPrimary", "Set as Primary"],
                  ["isStore", "Set as Store Address"],
                  ["isReturn", "Set as Return Address"],
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
                  Cancel Edit
                </button>
              ) : null}
              <button type="submit" disabled={isSaving}>
                <Save aria-hidden="true" />
                {isSaving ? "Saving..." : isEditing ? "Update Address" : "Save Address"}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
