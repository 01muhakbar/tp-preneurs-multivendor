import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  createSeller2026AttributeForm,
  seller2026AttributeLabels,
  validateSeller2026AttributeForm,
} from "../../../api/seller2026/attributes.adapter.ts";

const supportedOptionTypes = ["dropdown", "radio", "checkbox"];

export default function Seller2026AttributeDrawer({
  isOpen,
  onClose,
  attribute,
  onSave,
  isSaving = false,
}) {
  const isEdit = Boolean(attribute);
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
    () => (submitted ? validateSeller2026AttributeForm(form) : {}),
    [form, submitted]
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
    const nextErrors = validateSeller2026AttributeForm(form);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <>
      <button
        className="seller2026-drawer-overlay"
        type="button"
        aria-label="Close attribute drawer"
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
              {isEdit ? "Update Attribute" : "Add Attribute"}
            </h2>
            <p>{isEdit ? "Edit attribute details and values." : "Create an attribute for product options."}</p>
          </div>
          <button className="seller2026-drawer-close" type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="seller2026-drawer-body">
          <label className={`seller2026-form-group ${errors.name ? "has-error" : ""}`}>
            <span>Attribute Name *</span>
            <input
              aria-label="Attribute Name"
              type="text"
              placeholder="e.g. Size Dress"
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
            <span>Display Name *</span>
            <input
              aria-label="Display Name"
              type="text"
              placeholder="e.g. Size Dress"
              value={form.displayName}
              onChange={(event) => updateForm({ displayName: event.target.value })}
              disabled={isSaving}
            />
            {errors.displayName ? <small>{errors.displayName}</small> : null}
          </label>

          <label className={`seller2026-form-group ${errors.optionType ? "has-error" : ""}`}>
            <span>Option Type *</span>
            <select
              aria-label="Option Type"
              value={form.optionType}
              onChange={(event) => updateForm({ optionType: event.target.value })}
              disabled={isSaving}
            >
              {supportedOptionTypes.map((type) => (
                <option key={type} value={type}>
                  {seller2026AttributeLabels.optionType[type]}
                </option>
              ))}
            </select>
          </label>

          <div className={`seller2026-form-group ${errors.values ? "has-error" : ""}`}>
            <label htmlFor="seller2026-attribute-values">Values *</label>
            <div className="seller2026-values-container">
              <div className="seller2026-values-chips">
                {form.values.map((value) => (
                  <span key={value} className="seller2026-chip">
                    {value}
                    <button
                      type="button"
                      aria-label={`Remove ${value}`}
                      onClick={() => updateForm({ values: form.values.filter((item) => item !== value) })}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
              <input
                id="seller2026-attribute-values"
                aria-label="Values"
                type="text"
                placeholder="Add value and press Enter"
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
            <small>Tip: Press Enter to add more values.</small>
            {errors.values ? <small>{errors.values}</small> : null}
          </div>

          <div className="seller2026-form-group seller2026-toggle-group">
            <div>
              <span className="seller2026-form-label">Storefront Visibility</span>
              <p className="seller2026-helper-text">Show this attribute on the storefront.</p>
            </div>
            <label className="seller2026-toggle">
              <input
                aria-label="Storefront Visibility"
                type="checkbox"
                checked={form.visible}
                onChange={(event) => updateForm({ visible: event.target.checked })}
                disabled={isSaving}
              />
              <span className="seller2026-toggle-slider" />
            </label>
          </div>

          <div className="seller2026-form-group seller2026-status-section">
            <span className="seller2026-form-label">Status</span>
            <p className="seller2026-helper-text">Set initial status for this attribute.</p>
            <div className="seller2026-segmented-control">
              <button
                type="button"
                className={!form.published ? "active" : ""}
                onClick={() => updateForm({ published: false })}
                disabled={isSaving}
              >
                Draft
              </button>
              <button
                type="button"
                className={form.published ? "active" : ""}
                onClick={() => updateForm({ published: true, visible: true })}
                disabled={isSaving}
              >
                Published
              </button>
            </div>
          </div>
        </div>

        <footer className="seller2026-drawer-footer">
          <button className="seller2026-btn-cancel" type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button className="seller2026-btn-primary" type="button" onClick={submit} disabled={isSaving}>
            {isSaving ? "Saving..." : isEdit ? "Update Attribute" : "Create Attribute"}
          </button>
        </footer>
      </aside>
    </>
  );
}
