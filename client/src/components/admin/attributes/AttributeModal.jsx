import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ChevronDown, X } from "lucide-react";
import VariantInput from "./VariantInput.jsx";

const toText = (value) => String(value ?? "").trim();

const fieldClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm shadow-slate-200/40 transition focus:border-[#034c85]/60 focus:outline-none focus:ring-4 focus:ring-[#034c85]/10 disabled:cursor-not-allowed disabled:bg-slate-50";

function FieldRow({ label, children }) {
  return (
    <div className="grid gap-3 px-5 py-4 md:grid-cols-[150px_minmax(0,1fr)] md:items-start">
      <label className="pt-2 text-sm font-semibold text-slate-700">{label}</label>
      <div>{children}</div>
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
  const [language, setLanguage] = useState("en");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [optionType, setOptionType] = useState("dropdown");
  const [published, setPublished] = useState(true);
  const [variants, setVariants] = useState([]);
  const [validationError, setValidationError] = useState("");

  const optionTypeOptions = useMemo(
    () => [
      { value: "dropdown", label: t("attributes.Dropdown", "Dropdown") },
      { value: "radio", label: t("attributes.Radio", "Radio") },
      { value: "checkbox", label: t("attributes.Checkbox", "Checkbox") },
    ],
    [t]
  );

  useEffect(() => {
    if (!open) return;
    const nextName = toText(attribute?.name);
    setName(nextName);
    setDisplayName(toText(attribute?.displayName ?? attribute?.display_name) || nextName);
    setOptionType(toText(attribute?.type).toLowerCase() || "dropdown");
    setPublished(attribute?.published ?? true);
    setVariants(
      Array.isArray(attribute?.values)
        ? attribute.values.map((entry) => toText(entry)).filter(Boolean)
        : []
    );
    setValidationError("");
    setLanguage("en");
  }, [open, attribute]);

  const heading =
    mode === "edit"
      ? t("attributes.Edit Attribute", "Edit Attribute")
      : t("attributes.New Attribute", "New Attribute");
  const actionLabel =
    mode === "edit"
      ? t("attributes.Save Changes", "Save Changes")
      : t("attributes.Create Attribute", "Create Attribute");
  const isValid = useMemo(
    () =>
      Boolean(toText(name)) &&
      Boolean(toText(optionType)),
    [name, optionType]
  );
  const finalError = validationError || submitError;

  if (!open) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose?.();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedName = toText(name);
    if (!trimmedName) {
      setValidationError(t("attributes.Attribute title is required.", "Attribute title is required."));
      return;
    }
    if (!toText(optionType)) {
      setValidationError(t("attributes.Option type is required.", "Option type is required."));
      return;
    }

    setValidationError("");
    onSubmit?.({
      name: trimmedName,
      displayName: toText(displayName) || trimmedName,
      type: optionType,
      published,
      values: variants,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]">
      <button
        type="button"
        onClick={handleClose}
        className="absolute inset-0 cursor-default"
        aria-label="Close attribute modal"
      />

      <aside className="absolute right-0 top-0 z-10 flex h-full w-full max-w-[820px] flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-white via-[#034c85]/5 to-[#fe6f05]/10 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#034c85]/15 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#034c85]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#fe6f05]" />
                {t("attributes.Catalog Attribute", "Catalog Attribute")}
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[30px]">
                {heading}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t("attributes.Name, option type, publish state, and values.", "Name, option type, publish state, and values.")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  disabled={isSubmitting}
                  className="h-10 appearance-none rounded-lg border border-[#034c85]/20 bg-white pl-3 pr-9 text-sm font-semibold text-slate-700 focus:border-[#034c85]/60 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="en">en</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close attribute modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="divide-y divide-slate-200">
            <FieldRow label={t("attributes.Name", "Name")}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSubmitting}
                placeholder={t("attributes.Color, Size, Material", "Color, Size, Material")}
                className={fieldClass}
              />
            </FieldRow>

            <FieldRow label={t("attributes.Display", "Display")}>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={isSubmitting}
                placeholder={t("attributes.Customer-facing label", "Customer-facing label")}
                className={fieldClass}
              />
            </FieldRow>

            <FieldRow label={t("attributes.Input Type", "Input Type")}>
              <select
                value={optionType}
                onChange={(event) => setOptionType(event.target.value)}
                disabled={isSubmitting}
                className={`${fieldClass} appearance-none`}
              >
                {optionTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FieldRow>

            <FieldRow label={t("attributes.Status", "Status")}>
              <select
                value={published ? "published" : "draft"}
                onChange={(event) => setPublished(event.target.value === "published")}
                disabled={isSubmitting}
                className={`${fieldClass} appearance-none`}
              >
                <option value="published">{t("attributes.Published", "Published")}</option>
                <option value="draft">{t("attributes.Draft", "Draft")}</option>
              </select>
            </FieldRow>

            <FieldRow label={t("attributes.Values", "Values")}>
              <VariantInput
                value={variants}
                onChange={setVariants}
                disabled={isSubmitting}
                placeholder={t("attributes.Press enter to add variant", "Press enter to add variant")}
              />
            </FieldRow>
          </div>

          {finalError ? (
            <div className="mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {finalError}
            </div>
          ) : null}
        </form>

        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("attributes.Cancel", "Cancel")}
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !isValid}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#034c85] px-4 text-sm font-semibold text-white shadow-sm shadow-[#034c85]/25 transition hover:bg-[#023e6d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t("attributes.Saving...", "Saving...") : actionLabel}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
