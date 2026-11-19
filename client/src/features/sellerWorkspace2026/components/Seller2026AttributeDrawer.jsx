import React, { useEffect, useMemo, useState } from "react";
import { Check, CheckSquare, ChevronDown, CircleDot, Info, Plus, Sparkles, X } from "lucide-react";
import {
  createSeller2026AttributeForm,
  getSeller2026AttributeLabels,
  validateSeller2026AttributeForm,
} from "../../../api/seller2026/attributes.adapter.ts";

export default function Seller2026AttributeDrawer({
  isOpen,
  onClose,
  attribute,
  onSave,
  isSaving = false,
  isId = false,
}) {
  const isEdit = Boolean(attribute);
  const labels = useMemo(() => getSeller2026AttributeLabels(isId), [isId]);
  const [form, setForm] = useState(() => createSeller2026AttributeForm(attribute));
  const [valueDraft, setValueDraft] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSynced, setIsSynced] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const initialForm = createSeller2026AttributeForm(attribute);
    setForm(initialForm);
    setValueDraft("");
    setSubmitted(false);
    setIsSynced(!attribute || initialForm.name === initialForm.displayName);
  }, [attribute, isOpen]);

  const errors = useMemo(
    () => (submitted ? validateSeller2026AttributeForm(form, isId) : {}),
    [form, submitted, isId]
  );

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }));

  const handleNameChange = (event) => {
    const nextName = event.target.value;
    if (isSynced) {
      updateForm({ name: nextName, displayName: nextName });
    } else {
      updateForm({ name: nextName });
    }
  };

  const handleDisplayNameChange = (event) => {
    const nextDisplayName = event.target.value;
    setIsSynced(nextDisplayName === form.name);
    updateForm({ displayName: nextDisplayName });
  };

  const syncWithAttributeName = () => {
    setIsSynced(true);
    updateForm({ displayName: form.name });
  };

  const addValue = () => {
    const nextValue = valueDraft.trim();
    if (!nextValue) return;
    const exists = form.values.some((value) => value.toLowerCase() === nextValue.toLowerCase());
    if (!exists) {
      updateForm({ values: [...form.values, nextValue] });
    }
    setValueDraft("");
  };

  const presets = useMemo(
    () => [
      {
        label: isId ? "Ukuran (S - XXL)" : "Sizes (S - XXL)",
        items: ["S", "M", "L", "XL", "XXL"],
      },
      {
        label: isId ? "Sepatu (38 - 43)" : "Shoes (38 - 43)",
        items: ["38", "39", "40", "41", "42", "43"],
      },
      {
        label: isId ? "Warna Dasar" : "Basic Colors",
        items: isId ? ["Hitam", "Putih", "Abu-abu", "Navy"] : ["Black", "White", "Gray", "Navy"],
      },
    ],
    [isId]
  );

  const applyPreset = (presetItems) => {
    const existingSet = new Set(form.values.map((v) => v.toLowerCase().trim()));
    const toAdd = presetItems.filter((val) => !existingSet.has(val.toLowerCase().trim()));
    if (toAdd.length > 0) {
      updateForm({ values: [...form.values, ...toAdd] });
    }
  };

  const submit = () => {
    setSubmitted(true);
    const nextErrors = validateSeller2026AttributeForm(form, isId);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <>
      <button
        className="seller2026-drawer-overlay"
        type="button"
        aria-label={isId ? "Tutup panel atribut" : "Close attribute drawer"}
        onClick={onClose}
      />
      <aside
        className="seller2026-drawer seller2026-attribute-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller2026-attribute-drawer-title"
      >
        <header className="seller2026-drawer-header">
          <div>
            <div className="seller2026-drawer-badge">
              <Sparkles size={13} /> {isId ? "Katalog Toko" : "Store Catalog"}
            </div>
            <h2 id="seller2026-attribute-drawer-title">
              {isEdit
                ? isId
                  ? "Perbarui Atribut"
                  : "Update Attribute"
                : isId
                  ? "Tambah Atribut Baru"
                  : "Add New Attribute"}
            </h2>
            <p>
              {isEdit
                ? isId
                  ? "Sesuaikan rincian identitas dan nilai varian atribut."
                  : "Adjust attribute details and variant values."
                : isId
                  ? "Buat opsi varian baru untuk produk toko Anda."
                  : "Create a new variant option for your store products."}
            </p>
          </div>
          <button className="seller2026-drawer-close" type="button" onClick={onClose} aria-label={isId ? "Tutup" : "Close"}>
            <X size={20} />
          </button>
        </header>

        <div className="seller2026-drawer-body">
          {/* Field: Nama Atribut (Internal) */}
          <div className={`seller2026-form-group ${errors.name ? "has-error" : ""}`}>
            <label htmlFor="seller2026-attr-name" className="seller2026-form-helper-label">
              <span>{isId ? "Nama Atribut (Internal) *" : "Attribute Name (Internal) *"}</span>
              <span className="seller2026-tooltip-hint" title={isId ? "Digunakan sebagai identifikasi internal toko" : "Used as store internal identifier"}>
                <Info size={13} />
              </span>
            </label>
            <input
              id="seller2026-attr-name"
              name="name"
              aria-label={isId ? "Nama Atribut" : "Attribute Name"}
              type="text"
              placeholder={isId ? "cth. Ukuran Pakaian, Warna Baju" : "e.g. Clothing Size, Color"}
              value={form.name}
              onChange={handleNameChange}
              disabled={isSaving}
            />
            <small className="seller2026-field-desc">
              {isId
                ? "Nama identifikasi internal untuk pengelolaan inventaris Anda."
                : "Internal identifier for your inventory catalog management."}
            </small>
            {errors.name ? <small className="seller2026-error-text">{errors.name}</small> : null}
          </div>

          {/* Field: Nama Tampilan (Buyer Facing) */}
          <div className={`seller2026-form-group ${errors.displayName ? "has-error" : ""}`}>
            <div className="seller2026-form-helper-label">
              <label htmlFor="seller2026-attr-display">
                {isId ? "Nama Tampilan di Halaman Produk *" : "Storefront Display Name *"}
              </label>
              {!isSynced && form.name && (
                <button
                  type="button"
                  className="seller2026-sync-btn"
                  onClick={syncWithAttributeName}
                  disabled={isSaving}
                >
                  {isId ? "Samakan dengan nama atribut" : "Sync with attribute name"}
                </button>
              )}
            </div>
            <input
              id="seller2026-attr-display"
              name="displayName"
              aria-label={isId ? "Nama Tampilan" : "Display Name"}
              type="text"
              placeholder={isId ? "cth. Ukuran, Warna" : "e.g. Size, Color"}
              value={form.displayName}
              onChange={handleDisplayNameChange}
              disabled={isSaving}
            />
            <small className="seller2026-field-desc">
              {isId
                ? "Label yang akan muncul di hadapan pembeli saat memilih varian di halaman produk."
                : "Label shown to buyers when selecting options on the product page."}
            </small>
            {errors.displayName ? <small className="seller2026-error-text">{errors.displayName}</small> : null}
          </div>

          {/* Field: Tipe Opsi (Interactive Cards) */}
          <div className={`seller2026-form-group ${errors.optionType ? "has-error" : ""}`}>
            <label className="seller2026-form-helper-label">
              <span>{isId ? "Tipe Tampilan Opsi *" : "Option Display Type *"}</span>
            </label>
            <div className="seller2026-option-cards">
              <button
                type="button"
                className={`seller2026-option-card ${form.optionType === "dropdown" ? "is-active" : ""}`}
                onClick={() => updateForm({ optionType: "dropdown" })}
                disabled={isSaving}
              >
                <div className="seller2026-option-card-icon">
                  <ChevronDown size={18} />
                </div>
                <div className="seller2026-option-card-body">
                  <strong>Dropdown</strong>
                  <span>{isId ? "Menu ringkas tarik-turun" : "Compact select menu"}</span>
                </div>
                {form.optionType === "dropdown" && (
                  <span className="seller2026-option-card-check" aria-hidden="true">
                    <Check size={14} />
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`seller2026-option-card ${form.optionType === "radio" ? "is-active" : ""}`}
                onClick={() => updateForm({ optionType: "radio" })}
                disabled={isSaving}
              >
                <div className="seller2026-option-card-icon">
                  <CircleDot size={18} />
                </div>
                <div className="seller2026-option-card-body">
                  <strong>Radio Button</strong>
                  <span>{isId ? "Pilihan tunggal terlihat" : "Single choice visible"}</span>
                </div>
                {form.optionType === "radio" && (
                  <span className="seller2026-option-card-check" aria-hidden="true">
                    <Check size={14} />
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`seller2026-option-card ${form.optionType === "checkbox" ? "is-active" : ""}`}
                onClick={() => updateForm({ optionType: "checkbox" })}
                disabled={isSaving}
              >
                <div className="seller2026-option-card-icon">
                  <CheckSquare size={18} />
                </div>
                <div className="seller2026-option-card-body">
                  <strong>{isId ? "Kotak Centang" : "Checkbox"}</strong>
                  <span>{isId ? "Pilihan multi-opsi" : "Multi-option choice"}</span>
                </div>
                {form.optionType === "checkbox" && (
                  <span className="seller2026-option-card-check" aria-hidden="true">
                    <Check size={14} />
                  </span>
                )}
              </button>
            </div>
            {errors.optionType ? <small className="seller2026-error-text">{errors.optionType}</small> : null}
          </div>

          {/* Field: Nilai Opsi (Tag Input with Physical Add Button & Presets) */}
          <div className={`seller2026-form-group ${errors.values ? "has-error" : ""}`}>
            <div className="seller2026-form-helper-label">
              <label htmlFor="seller2026-attribute-values">
                {isId ? "Nilai Varian *" : "Variant Values *"}
              </label>
              {form.values.length > 0 && (
                <span className="seller2026-values-counter">
                  {form.values.length} {isId ? "nilai terdaftar" : "values listed"}
                </span>
              )}
            </div>

            <div className="seller2026-values-container">
              {form.values.length > 0 ? (
                <div className="seller2026-values-chips">
                  {form.values.map((value) => (
                    <span key={value} className="seller2026-chip">
                      {value}
                      <button
                        type="button"
                        aria-label={`${isId ? "Hapus" : "Remove"} ${value}`}
                        onClick={() => updateForm({ values: form.values.filter((item) => item !== value) })}
                        disabled={isSaving}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="seller2026-values-empty-hint">
                  {isId ? "Belum ada nilai ditambahkan. Ketik di bawah atau pilih rekomendasi." : "No values added yet. Type below or pick a preset."}
                </div>
              )}

              <div className="seller2026-values-input-group">
                <input
                  id="seller2026-attribute-values"
                  name="values"
                  aria-label={isId ? "Nilai Opsi" : "Values"}
                  type="text"
                  placeholder={isId ? "Ketik nilai (cth: XL, Merah, Katun) lalu tekan Enter..." : "Type value and press Enter..."}
                  value={valueDraft}
                  onChange={(event) => setValueDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addValue();
                    }
                  }}
                  disabled={isSaving}
                />
                <button
                  type="button"
                  className="seller2026-btn-add-value"
                  onClick={addValue}
                  disabled={!valueDraft.trim() || isSaving}
                  title={isId ? "Tambahkan nilai ke daftar" : "Add value to list"}
                >
                  <Plus size={15} /> {isId ? "Tambah" : "Add"}
                </button>
              </div>
            </div>

            {/* Quick Suggestion Presets */}
            <div className="seller2026-preset-section">
              <span className="seller2026-preset-title">
                <Sparkles size={13} /> {isId ? "Rekomendasi Cepat:" : "Quick Suggestions:"}
              </span>
              <div className="seller2026-preset-chips">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="seller2026-preset-pill"
                    onClick={() => applyPreset(preset.items)}
                    disabled={isSaving}
                    title={preset.items.join(", ")}
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {errors.values ? <small className="seller2026-error-text">{errors.values}</small> : null}
          </div>

          {/* Visibility Switch Card */}
          <div className="seller2026-switch-card">
            <div>
              <strong>{isId ? "Visibilitas di Etalase Toko" : "Storefront Visibility"}</strong>
              <p>{isId ? "Izinkan pembeli melihat opsi ini saat menjelajahi produk toko Anda." : "Allow buyers to see and select this option on your storefront."}</p>
            </div>
            <label htmlFor="seller2026-attr-visible" className="seller2026-toggle">
              <input
                id="seller2026-attr-visible"
                name="visible"
                aria-label={isId ? "Visibilitas di Etalase" : "Storefront Visibility"}
                type="checkbox"
                checked={form.visible}
                onChange={(event) => updateForm({ visible: event.target.checked })}
                disabled={isSaving}
              />
              <span className="seller2026-toggle-slider" />
            </label>
          </div>

          {/* Publication Status Card */}
          <div className="seller2026-status-card">
            <div>
              <strong>{isId ? "Status Awal Atribut" : "Attribute Status"}</strong>
              <p>{isId ? "Atribut yang dipublikasikan langsung siap dihubungkan ke produk katalog." : "Published attributes are active and ready to be used in catalog products."}</p>
            </div>
            <div className="seller2026-segmented-control">
              <button
                type="button"
                className={!form.published ? "active" : ""}
                onClick={() => updateForm({ published: false })}
                disabled={isSaving}
              >
                {isId ? "Draf" : "Draft"}
              </button>
              <button
                type="button"
                className={form.published ? "active" : ""}
                onClick={() => updateForm({ published: true, visible: true })}
                disabled={isSaving}
              >
                {isId ? "Dipublikasikan" : "Published"}
              </button>
            </div>
          </div>
        </div>

        <footer className="seller2026-drawer-footer">
          <button className="seller2026-btn-cancel" type="button" onClick={onClose} disabled={isSaving}>
            {isId ? "Batal" : "Cancel"}
          </button>
          <button className="seller2026-btn-primary" type="button" onClick={submit} disabled={isSaving}>
            {isSaving
              ? isId
                ? "Menyimpan..."
                : "Saving..."
              : isEdit
                ? isId
                  ? "Perbarui Atribut"
                  : "Update Attribute"
                : isId
                  ? "Buat Atribut"
                  : "Create Attribute"}
          </button>
        </footer>
      </aside>
    </>
  );
}
