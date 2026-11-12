import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  createSeller2026AttributeForm,
  getSeller2026AttributeLabels,
  validateSeller2026AttributeForm,
} from "../../../api/seller2026/attributes.adapter.ts";

const supportedOptionTypes = ["dropdown", "radio", "checkbox"];

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

  useEffect(() => {
    if (!isOpen) return;
    setForm(createSeller2026AttributeForm(attribute));
    setValueDraft("");
    setSubmitted(false);
  }, [attribute, isOpen]);

  const errors = useMemo(
    () => (submitted ? validateSeller2026AttributeForm(form, isId) : {}),
    [form, submitted, isId]
  );

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }));

  const addValue = () => {
    const nextValue = valueDraft.trim();
    if (!nextValue) return;
    const exists = form.values.some((value) => value.toLowerCase() === nextValue.toLowerCase());
    if (!exists) updateForm({ values: [...form.values, nextValue] });
    setValueDraft("");
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
            <h2 id="seller2026-attribute-drawer-title">
              {isEdit ? (isId ? "Perbarui Atribut" : "Update Attribute") : (isId ? "Tambah Atribut" : "Add Attribute")}
            </h2>
            <p>{isEdit ? (isId ? "Edit rincian dan nilai atribut." : "Edit attribute details and values.") : (isId ? "Buat atribut baru untuk opsi produk." : "Create an attribute for product options.")}</p>
          </div>
          <button className="seller2026-drawer-close" type="button" onClick={onClose} aria-label={isId ? "Tutup" : "Close"}>
            <X size={20} />
          </button>
        </header>

        <div className="seller2026-drawer-body">
          <label className={`seller2026-form-group ${errors.name ? "has-error" : ""}`}>
            <span>{isId ? "Nama Atribut *" : "Attribute Name *"}</span>
            <input
              aria-label={isId ? "Nama Atribut" : "Attribute Name"}
              type="text"
              placeholder={isId ? "cth. Ukuran Baju" : "e.g. Size Dress"}
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;
                updateForm({ name, displayName: form.displayName || name });
              }}
              disabled={isSaving}
            />
            {errors.name ? <small>{errors.name}</small> : null}
          </label>

          <label className={`seller2026-form-group ${errors.displayName ? "has-error" : ""}`}>
            <span>{isId ? "Nama Tampilan *" : "Display Name *"}</span>
            <input
              aria-label={isId ? "Nama Tampilan" : "Display Name"}
              type="text"
              placeholder={isId ? "cth. Ukuran Baju" : "e.g. Size Dress"}
              value={form.displayName}
              onChange={(event) => updateForm({ displayName: event.target.value })}
              disabled={isSaving}
            />
            {errors.displayName ? <small>{errors.displayName}</small> : null}
          </label>

          <label className={`seller2026-form-group ${errors.optionType ? "has-error" : ""}`}>
            <span>{isId ? "Tipe Opsi *" : "Option Type *"}</span>
            <select
              aria-label={isId ? "Tipe Opsi" : "Option Type"}
              value={form.optionType}
              onChange={(event) => updateForm({ optionType: event.target.value })}
              disabled={isSaving}
            >
              {supportedOptionTypes.map((type) => (
                <option key={type} value={type}>
                  {labels.optionType[type]}
                </option>
              ))}
            </select>
          </label>

          <div className={`seller2026-form-group ${errors.values ? "has-error" : ""}`}>
            <label htmlFor="seller2026-attribute-values">{isId ? "Nilai Opsi *" : "Values *"}</label>
            <div className="seller2026-values-container">
              <div className="seller2026-values-chips">
                {form.values.map((value) => (
                  <span key={value} className="seller2026-chip">
                    {value}
                    <button
                      type="button"
                      aria-label={`${isId ? "Hapus" : "Remove"} ${value}`}
                      onClick={() => updateForm({ values: form.values.filter((item) => item !== value) })}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                id="seller2026-attribute-values"
                aria-label={isId ? "Nilai Opsi" : "Values"}
                type="text"
                placeholder={isId ? "Tambah nilai lalu tekan Enter" : "Add value and press Enter"}
                value={valueDraft}
                onChange={(event) => setValueDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addValue();
                  }
                }}
                onBlur={addValue}
                disabled={isSaving}
              />
            </div>
            <small>{isId ? "Tips: Tekan Enter untuk menambahkan beberapa nilai opsi." : "Tip: Press Enter to add more values."}</small>
            {errors.values ? <small>{errors.values}</small> : null}
          </div>

          <div className="seller2026-form-group seller2026-toggle-group">
            <div>
              <span className="seller2026-form-label">{isId ? "Visibilitas di Etalase" : "Storefront Visibility"}</span>
              <p className="seller2026-helper-text">{isId ? "Tampilkan atribut ini di etalase pembeli." : "Show this attribute on the storefront."}</p>
            </div>
            <label className="seller2026-toggle">
              <input
                aria-label={isId ? "Visibilitas di Etalase" : "Storefront Visibility"}
                type="checkbox"
                checked={form.visible}
                onChange={(event) => updateForm({ visible: event.target.checked })}
                disabled={isSaving}
              />
              <span className="seller2026-toggle-slider" />
            </label>
          </div>

          <div className="seller2026-form-group seller2026-status-section">
            <span className="seller2026-form-label">{isId ? "Status Publikasi" : "Status"}</span>
            <p className="seller2026-helper-text">{isId ? "Tentukan status awal atribut produk ini." : "Set initial status for this attribute."}</p>
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
            {isSaving ? (isId ? "Menyimpan..." : "Saving...") : isEdit ? (isId ? "Perbarui Atribut" : "Update Attribute") : (isId ? "Buat Atribut" : "Create Attribute")}
          </button>
        </footer>
      </aside>
    </>
  );
}
