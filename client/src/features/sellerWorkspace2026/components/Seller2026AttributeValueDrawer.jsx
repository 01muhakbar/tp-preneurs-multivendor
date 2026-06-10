import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  createSeller2026AttributeValueForm,
  validateSeller2026AttributeValueForm,
} from "../../../api/seller2026/attributeValues.adapter.ts";
import { seller2026AttributeLabels } from "../../../api/seller2026/attributes.adapter.ts";

export default function Seller2026AttributeValueDrawer({
  isOpen,
  onClose,
  valueItem,
  value,
  attribute,
  attributeContext,
  onSave,
  isSaving = false,
}) {
  const selectedValue = valueItem || value || null;
  const currentAttribute = attribute || attributeContext || null;
  const isEdit = Boolean(selectedValue);
  const [form, setForm] = useState(() => createSeller2026AttributeValueForm(selectedValue));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(createSeller2026AttributeValueForm(selectedValue));
    setSubmitted(false);
  }, [isOpen, selectedValue]);

  const errors = useMemo(
    () => (submitted ? validateSeller2026AttributeValueForm(form) : {}),
    [form, submitted]
  );

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }));

  const submit = () => {
    setSubmitted(true);
    const nextErrors = validateSeller2026AttributeValueForm(form);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(form);
  };

  if (!isOpen) return null;

  const optionType = currentAttribute?.optionType || "dropdown";

  return (
    <>
      <button
        className="seller2026-drawer-overlay"
        type="button"
        aria-label="Close attribute value drawer"
        onClick={onClose}
      />
      <aside
        className="seller2026-drawer seller2026-attribute-value-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller2026-attribute-value-drawer-title"
      >
        <header className="seller2026-drawer-header">
          <div>
            <h2 id="seller2026-attribute-value-drawer-title">
              {isEdit ? "Update Attribute Value" : "Add Attribute Value"}
            </h2>
            <p>{isEdit ? "Edit this attribute value." : "Add a new value to this attribute."}</p>
          </div>
          <button className="seller2026-drawer-close" type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="seller2026-drawer-body">
          <label className="seller2026-form-group">
            <span>Attribute</span>
            <input
              aria-label="Attribute"
              type="text"
              value={currentAttribute?.displayName || currentAttribute?.name || "Attribute"}
              readOnly
              className="seller2026-input-readonly"
            />
          </label>

          <label className="seller2026-form-group">
            <span>Option Type</span>
            <input
              aria-label="Option Type"
              type="text"
              value={seller2026AttributeLabels.optionType[optionType] || "Dropdown"}
              readOnly
              className="seller2026-input-readonly"
            />
          </label>

          <label className={`seller2026-form-group ${errors.value ? "has-error" : ""}`}>
            <span>Value *</span>
            <input
              aria-label="Value"
              type="text"
              placeholder="Enter value"
              value={form.value}
              onChange={(event) => {
                const nextValue = event.target.value;
                updateForm({ value: nextValue, label: form.label || nextValue });
              }}
              disabled={isSaving}
            />
            <small>This is the actual value stored in the system.</small>
            {errors.value ? <small>{errors.value}</small> : null}
          </label>

          <label className="seller2026-form-group">
            <span>Label (Optional)</span>
            <input
              aria-label="Label"
              type="text"
              placeholder="Enter label"
              value={form.label}
              onChange={(event) => updateForm({ label: event.target.value })}
              disabled={isSaving}
            />
            <small>This is the label shown to customers.</small>
          </label>

          <div className="seller2026-form-group seller2026-status-section">
            <span className="seller2026-form-label">Status</span>
            <div className="seller2026-value-status-control">
              <label className="seller2026-toggle">
                <input aria-label="Active" type="checkbox" checked={form.active} disabled readOnly />
                <span className="seller2026-toggle-slider" />
              </label>
              <span className="seller2026-toggle-label">{form.active ? "Active" : "Inactive"}</span>
            </div>
            <p className="seller2026-helper-text">Inactive values will be hidden.</p>
          </div>
        </div>

        <footer className="seller2026-drawer-footer">
          <button className="seller2026-btn-cancel" type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button className="seller2026-btn-primary" type="button" onClick={submit} disabled={isSaving}>
            {isSaving ? "Saving..." : isEdit ? "Update Value" : "Add Value"}
          </button>
        </footer>
      </aside>
    </>
  );
}
