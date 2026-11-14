import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Boxes, CheckCircle2, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import VariantInput from "./VariantInput.jsx";

const toText = (value) => String(value ?? "").trim();

export function buildAdminAttributePayload(form) {
  const trimmedName = toText(form.name);
  return {
    name: trimmedName,
    displayName: toText(form.displayName) || trimmedName,
    type: toText(form.optionType).toLowerCase() || "dropdown",
    published: Boolean(form.published),
    values: Array.isArray(form.variants)
      ? form.variants.map((entry) => toText(entry)).filter(Boolean)
      : [],
  };
}

export function createAdminAttributeFormState(attribute) {
  const nextName = toText(attribute?.name);
  return {
    name: nextName,
    displayName: toText(attribute?.displayName ?? attribute?.display_name) || nextName,
    optionType: toText(attribute?.type).toLowerCase() || "dropdown",
    published: attribute?.published ?? true,
    variants: Array.isArray(attribute?.values)
      ? attribute.values.map((entry) => toText(entry)).filter(Boolean)
      : [],
  };
}

export function AttributeFormPanel({
  mode = "create",
  attribute,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = "",
  formId = "attribute-form",
  resetSignal,
  layoutMode = "page",
  bodyClassName = "",
  footerClassName = "border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4",
}) {
  const { t, i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");
  const [form, setForm] = useState(() => createAdminAttributeFormState(attribute));
  const [validationError, setValidationError] = useState("");
  const isDrawer = layoutMode === "drawer";

  const optionTypeOptions = useMemo(
    () => [
      { value: "dropdown", label: t("attributes.Dropdown", "Dropdown") },
      { value: "radio", label: t("attributes.Radio", "Radio") },
      { value: "checkbox", label: t("attributes.Checkbox", "Checkbox") },
    ],
    [t]
  );

  useEffect(() => {
    setForm(createAdminAttributeFormState(attribute));
    setValidationError("");
  }, [attribute, resetSignal]);

  const actionLabel =
    mode === "edit"
      ? t("attributes.Save Changes", "Save Changes")
      : t("attributes.Create Attribute", "Create Attribute");

  const isValid = useMemo(
    () => Boolean(toText(form.name)) && Boolean(toText(form.optionType)),
    [form.name, form.optionType]
  );
  const finalError = validationError || submitError;

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedName = toText(form.name);
    if (!trimmedName) {
      setValidationError(t("attributes.Attribute title is required.", "Attribute title is required."));
      return;
    }
    if (!toText(form.optionType)) {
      setValidationError(t("attributes.Option type is required.", "Option type is required."));
      return;
    }

    setValidationError("");
    onSubmit?.(buildAdminAttributePayload(form));
  };

  return (
    <div className="w-full">
      <form id={formId} onSubmit={handleSubmit} className={bodyClassName}>
        {finalError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
            {finalError}
          </div>
        ) : null}

        <div className={isDrawer ? "space-y-4 px-5 py-4" : "grid grid-cols-1 lg:grid-cols-3 gap-5"}>
          {/* Main Info Column */}
          <div className={isDrawer ? "space-y-4" : "lg:col-span-2 space-y-4"}>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#034c85]/10 text-[#034c85] dark:bg-sky-500/15 dark:text-sky-400">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t("attributes.Attribute Details", "Attribute Details")}
                  </h3>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
                  <span className="flex items-center gap-1">
                    {t("attributes.Name", "Name")}
                    <span className="text-[#fe6f05]">*</span>
                  </span>
                  <input
                    id="admin-attribute-name"
                    name="name"
                    value={form.name}
                    onChange={(event) => updateForm({ name: event.target.value })}
                    disabled={isSubmitting}
                    placeholder={t("attributes.Color, Size...", "Color, Size...")}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal text-slate-900 outline-none focus:border-[#034c85] focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-950 transition disabled:opacity-60"
                    required
                  />
                </label>

                <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
                  <span>{t("attributes.Display", "Display")}</span>
                  <input
                    id="admin-attribute-display"
                    name="displayName"
                    value={form.displayName}
                    onChange={(event) => updateForm({ displayName: event.target.value })}
                    disabled={isSubmitting}
                    placeholder={t("attributes.Label display...", "Label display...")}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal text-slate-900 outline-none focus:border-[#034c85] focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-950 transition disabled:opacity-60"
                  />
                </label>

                <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
                  <span>{t("attributes.Input Type", "Input Type")}</span>
                  <div className="relative">
                    <select
                      id="admin-attribute-type"
                      name="optionType"
                      value={form.optionType}
                      onChange={(event) => updateForm({ optionType: event.target.value })}
                      disabled={isSubmitting}
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-10 text-sm font-normal text-slate-900 outline-none focus:border-[#034c85] focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-950 transition disabled:opacity-60"
                    >
                      {optionTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Side Column (Status & Values) */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="h-4 w-4 text-[#034c85] dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("attributes.Status", "Status")}</h3>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${form.published ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                  {form.published ? (isId ? "Diterbitkan" : "Published") : (isId ? "Draf" : "Draft")}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(form.published)}
                  aria-label={t("attributes.Status", "Status")}
                  onClick={() => updateForm({ published: !form.published })}
                  disabled={isSubmitting}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#034c85] focus:ring-offset-2 ${form.published ? "bg-[#034c85]" : "bg-slate-300 dark:bg-slate-700"}`}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${form.published ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <Boxes className="h-4 w-4 text-[#034c85] dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("attributes.Values", "Values")}</h3>
              </div>
              <VariantInput
                value={form.variants}
                onChange={(variants) => updateForm({ variants })}
                disabled={isSubmitting}
                placeholder={t("attributes.Press enter to add variant", "Press enter to add variant")}
              />
            </section>
          </div>
        </div>
      </form>

      <div className={footerClassName}>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] h-11 items-center justify-center rounded-xl border border-slate-200 bg-white dark:bg-slate-800 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#034c85]/20 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 transition"
          >
            {t("attributes.Cancel", "Cancel")}
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isSubmitting || !isValid}
            className="inline-flex min-h-[44px] h-11 items-center justify-center gap-2 rounded-xl bg-[#fe6f05] px-6 text-sm font-semibold text-white shadow-md shadow-[#fe6f05]/25 hover:bg-[#e05f00] focus:outline-none focus:ring-2 focus:ring-[#fe6f05]/30 disabled:opacity-60 transition"
          >
            {isSubmitting ? t("attributes.Saving...", "Saving...") : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttributeModal({
  open,
  mode = "create",
  attribute,
  onClose,
  onSubmit,
  isSubmitting = false,
  submitError = "",
}) {
  const { t } = useTranslation("admin");

  const heading =
    mode === "edit"
      ? t("attributes.Edit Attribute", "Edit Attribute")
      : t("attributes.New Attribute", "New Attribute");

  if (!open) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]">
      <button
        type="button"
        onClick={handleClose}
        className="absolute inset-0 cursor-default"
        aria-label={t("attributes.Close", "Close")}
      />

      <aside className="absolute right-0 top-0 z-10 flex h-full w-full max-w-[820px] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-[#034c85]/20 bg-[#034c85]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#034c85] dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#fe6f05]" />
                {t("attributes.Catalog Attribute", "Catalog Attribute")}
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-2xl">
                {heading}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              aria-label={t("attributes.Close", "Close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AttributeFormPanel
            layoutMode="drawer"
            mode={mode}
            attribute={attribute}
            onSubmit={onSubmit}
            onCancel={handleClose}
            isSubmitting={isSubmitting}
            submitError={submitError}
            formId="attribute-modal-form"
            resetSignal={open}
            footerClassName="border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
      </aside>
    </div>
  );
}
