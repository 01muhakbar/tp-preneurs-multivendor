import {
  ArrowLeft,
  Building2,
  Check,
  Home,
  MapPin,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import "./account-shipping-address-2026.css";

function LoadingState({ isIndo }) {
  return (
    <div
      className="tpship2026-loading"
      aria-label={isIndo ? "Memuat daftar alamat..." : "Loading addresses..."}
    >
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
  options = [],
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
  isIndo,
}) {
  const TypeIcon = address.label === "OFFICE" ? Building2 : Home;
  const isOffice = address.label === "OFFICE";
  const displayTitle = isOffice ? (isIndo ? "Kantor" : "Office") : (isIndo ? "Rumah" : "Home");

  return (
    <article className="tpship2026-card">
      <div className="tpship2026-card-top">
        <div className="tpship2026-badges">
          {address.isPrimary ? (
            <span className="tpship2026-badge-primary">
              <Star className="tpship2026-badge-star" aria-hidden="true" />
              {isIndo ? "Utama" : "Primary"}
            </span>
          ) : null}
          {address.isStore ? <span>{isIndo ? "Toko" : "Store"}</span> : null}
          {address.isReturn ? <span>{isIndo ? "Retur" : "Return"}</span> : null}
        </div>
      </div>

      <div className="tpship2026-card-title">
        <TypeIcon aria-hidden="true" />
        <h2>{displayTitle}</h2>
      </div>

      <div className="tpship2026-card-lines">
        <p className="tpship2026-card-contact">{address.contactName}</p>
        <p>{address.line1 || address.summary}</p>
        {address.line2 ? <p>{address.line2}</p> : null}
        {address.cityLine ? <p>{address.cityLine}</p> : null}
        {address.phoneNumber && address.phoneNumber !== "Not set" && address.phoneNumber !== "Belum diatur" ? (
          <p className="tpship2026-card-phone">{address.phoneNumber}</p>
        ) : null}
      </div>

      <div className="tpship2026-card-actions">
        <button
          type="button"
          className="tpship2026-btn-edit"
          onClick={() => onEditAddress(address.raw)}
          disabled={isSaving}
        >
          <Pencil aria-hidden="true" />
          {isIndo ? "Edit" : "Edit"}
        </button>
        {!address.isPrimary ? (
          <button
            type="button"
            className="tpship2026-btn-star"
            onClick={() => onMakePrimary(address.raw)}
            disabled={isSaving}
          >
            <Star aria-hidden="true" />
            {isIndo ? "Jadikan Utama" : "Make Primary"}
          </button>
        ) : null}
        <button
          type="button"
          className="tpship2026-danger"
          onClick={() => onDeleteAddress(address.raw)}
          disabled={isSaving || address.isPrimary}
          title={address.isPrimary ? (isIndo ? "Alamat utama tidak dapat dihapus" : "Cannot delete primary address") : ""}
        >
          <Trash2 aria-hidden="true" />
          {isIndo ? "Hapus" : "Delete"}
        </button>
      </div>
    </article>
  );
}

export default function AccountShippingAddress2026View({
  account,
  addresses = [],
  form,
  fieldErrors = {},
  provinceOptions = [],
  cityOptions = [],
  districtOptions = [],
  activeTab = "saved",
  isLoading,
  isSaving,
  isIndo = false,
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
        <div className="tpship2026-heading-copy">
          <h1>{isIndo ? "Alamat Pengiriman" : "Shipping Addresses"}</h1>
          <p>
            {isIndo
              ? "Kelola alamat pengiriman, toko, dan retur Anda."
              : "Manage your delivery, store, and return addresses."}
          </p>
        </div>
        <LinkComponent className="tpship2026-back" to="/user/my-account">
          <ArrowLeft aria-hidden="true" />
          <span>{isIndo ? "Kembali ke Akun Saya" : "Back to My Account"}</span>
        </LinkComponent>
      </header>

      <div className="tpship2026-tabs" role="tablist" aria-label="Shipping address sections">
        <button
          type="button"
          className={activeTab === "saved" ? "tpship2026-active" : ""}
          onClick={() => onTabChange("saved")}
        >
          {isIndo ? "Alamat Tersimpan" : "Saved Addresses"}{" "}
          <span className="tpship2026-tab-badge">{savedCount}</span>
        </button>
        <button
          type="button"
          className={activeTab === "form" ? "tpship2026-active" : ""}
          onClick={onFocusForm}
        >
          {isEditing
            ? isIndo
              ? "Edit Alamat"
              : "Edit Address"
            : isIndo
              ? "+ Tambah Alamat Baru"
              : "+ Add New Address"}
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
        <LoadingState isIndo={isIndo} />
      ) : (
        <>
          <section
            className={`tpship2026-saved ${
              activeTab === "saved" ? "" : "tpship2026-collapsed"
            }`}
            aria-label="Saved shipping addresses"
          >
            <div className="tpship2026-saved-head">
              <h2>{isIndo ? "Daftar Alamat Tersimpan" : "Saved Addresses"}</h2>
              <button
                type="button"
                className="tpship2026-btn-add"
                onClick={() => onResetForm("form")}
              >
                <Plus aria-hidden="true" />
                <span>{isIndo ? "Tambah Alamat" : "Add Address"}</span>
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="tpship2026-empty">
                <MapPin aria-hidden="true" />
                <h2>{isIndo ? "Belum ada alamat tersimpan" : "No address saved yet"}</h2>
                <p>
                  {isIndo
                    ? "Tambahkan alamat pengiriman pertama Anda untuk digunakan saat checkout."
                    : "Add your first shipping address to use it at checkout."}
                </p>
                <button type="button" onClick={() => onResetForm("form")}>
                  <Plus aria-hidden="true" />
                  <span>{isIndo ? "Tambah Alamat Baru" : "Add New Address"}</span>
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
                    isIndo={isIndo}
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
                <h2>
                  {isEditing
                    ? isIndo
                      ? "Edit Alamat Pengiriman"
                      : "Edit Shipping Address"
                    : isIndo
                      ? "Tambah Alamat Pengiriman Baru"
                      : "Add New Shipping Address"}
                </h2>
              </div>
            </div>

            <div className="tpship2026-form-grid">
              <TextField
                label={isIndo ? "Nama Depan *" : "First Name *"}
                name="firstName"
                value={form.firstName}
                onFormChange={onFormChange}
                error={fieldErrors.firstName}
                placeholder={isIndo ? "Nama depan" : "First Name"}
              />
              <TextField
                label={isIndo ? "Nama Belakang *" : "Last Name *"}
                name="lastName"
                value={form.lastName}
                onFormChange={onFormChange}
                error={fieldErrors.lastName}
                placeholder={isIndo ? "Nama belakang" : "Last Name"}
              />
              <TextField
                label={isIndo ? "Nomor Telepon *" : "Phone Number *"}
                name="phoneNumber"
                value={form.phoneNumber}
                onFormChange={onFormChange}
                error={fieldErrors.phoneNumber}
                placeholder="08xxxxxxxxxx"
              />
              <TextField
                label={isIndo ? "Alamat Email *" : "Email *"}
                name="emailAddress"
                value={form.emailAddress}
                onFormChange={onFormChange}
                error={fieldErrors.emailAddress}
                placeholder={isIndo ? "nama@contoh.com" : "Email"}
                type="email"
                readOnly={Boolean(account.email && account.email !== "Not set" && account.email !== "Belum diatur")}
              />
              <SelectField
                label={isIndo ? "Provinsi *" : "Province *"}
                name="province"
                value={form.province}
                options={provinceOptions}
                onFormChange={onFormChange}
                error={fieldErrors.province}
                placeholder={isIndo ? "Pilih Provinsi" : "Select Province"}
              />
              <SelectField
                label={isIndo ? "Kota / Kabupaten *" : "City / Regency *"}
                name="city"
                value={form.city}
                options={cityOptions}
                onFormChange={onFormChange}
                error={fieldErrors.city}
                placeholder={
                  form.province
                    ? isIndo
                      ? "Pilih Kota / Kabupaten"
                      : "Select City / Regency"
                    : isIndo
                      ? "Pilih Provinsi terlebih dahulu"
                      : "Select Province first"
                }
                disabled={!form.province}
              />
              <SelectField
                label={isIndo ? "Kecamatan *" : "Subdistrict *"}
                name="district"
                value={form.district}
                options={districtOptions}
                onFormChange={onFormChange}
                error={fieldErrors.district}
                placeholder={
                  form.city
                    ? isIndo
                      ? "Pilih Kecamatan"
                      : "Select Subdistrict"
                    : isIndo
                      ? "Pilih Kota / Kabupaten terlebih dahulu"
                      : "Select City / Regency first"
                }
                disabled={!form.city}
              />
              <TextField
                label={isIndo ? "Kode Pos *" : "Postal Code *"}
                name="postalCode"
                value={form.postalCode}
                onFormChange={onFormChange}
                error={fieldErrors.postalCode}
                placeholder="12345"
                inputMode="numeric"
              />
              <TextField
                label={isIndo ? "Nama Jalan *" : "Street Name *"}
                name="streetName"
                value={form.streetName}
                onFormChange={onFormChange}
                error={fieldErrors.streetName}
                placeholder={isIndo ? "Jl. Contoh No. 12" : "Street Name"}
              />
              <TextField
                label={isIndo ? "Nomor Rumah *" : "House Number *"}
                name="houseNumber"
                value={form.houseNumber}
                onFormChange={onFormChange}
                error={fieldErrors.houseNumber}
                placeholder={isIndo ? "No. Rumah / Blok" : "House Number"}
              />
              <TextField
                label={isIndo ? "Gedung / Unit" : "Building"}
                name="building"
                value={form.building}
                onFormChange={onFormChange}
                placeholder={isIndo ? "Gedung / Lantai / Unit" : "Building / Floor / Unit"}
              />
              <label className="tpship2026-field tpship2026-wide-field">
                <span>{isIndo ? "Detail Lainnya (Opsional)" : "Other Details"}</span>
                <textarea
                  value={form.otherDetails || ""}
                  onChange={(event) => onFormChange("otherDetails", event.target.value)}
                  placeholder={
                    isIndo
                      ? "Cth. Dekat masjid, patokan cat biru, unit 5A"
                      : "E.g. Near the mosque, unit 5A"
                  }
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
                  <span>{isIndo ? "Rumah" : "Home"}</span>
                </button>
                <button
                  type="button"
                  className={form.markAs === "OFFICE" ? "tpship2026-active" : ""}
                  onClick={() => onFormChange("markAs", "OFFICE")}
                >
                  <Building2 aria-hidden="true" />
                  <span>{isIndo ? "Kantor" : "Office"}</span>
                </button>
              </div>

              <div className="tpship2026-checks">
                {[
                  ["isPrimary", isIndo ? "Jadikan Alamat Utama" : "Set as Primary"],
                  ["isStore", isIndo ? "Jadikan Alamat Toko" : "Set as Store Address"],
                  ["isReturn", isIndo ? "Jadikan Alamat Retur" : "Set as Return Address"],
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
                  <X aria-hidden="true" />
                  <span>{isIndo ? "Batal Edit" : "Cancel Edit"}</span>
                </button>
              ) : null}
              <button type="submit" className="tpship2026-btn-submit" disabled={isSaving}>
                <Save aria-hidden="true" />
                <span>
                  {isSaving
                    ? isIndo
                      ? "Menyimpan..."
                      : "Saving..."
                    : isEditing
                      ? isIndo
                        ? "Perbarui Alamat"
                        : "Update Address"
                      : isIndo
                        ? "Simpan Alamat"
                        : "Save Address"}
                </span>
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
