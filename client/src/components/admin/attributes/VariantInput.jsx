import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";

const toText = (value) => String(value ?? "").trim();

export default function VariantInput({
  value,
  onChange,
  disabled = false,
  placeholder,
}) {
  const { t } = useTranslation("admin");
  const defaultPlaceholder = placeholder || t("attributes.Press enter to add variant", "Press enter to add variant");
  const [input, setInput] = useState("");

  const chips = useMemo(
    () =>
      Array.isArray(value)
        ? value
          .map((entry) => toText(entry))
          .filter(Boolean)
        : [],
    [value]
  );

  const commitInput = () => {
    const nextValue = toText(input);
    if (!nextValue) {
      setInput("");
      return;
    }
    const dedupeKey = nextValue.toLowerCase();
    const hasDuplicate = chips.some((entry) => entry.toLowerCase() === dedupeKey);
    if (!hasDuplicate) {
      onChange?.([...chips, nextValue]);
    }
    setInput("");
  };

  const removeValue = (target) => {
    const next = chips.filter((entry) => entry.toLowerCase() !== String(target).toLowerCase());
    onChange?.(next);
  };

  return (
    <div className="space-y-2.5">
      <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm transition focus-within:border-[#034c85] focus-within:ring-2 focus-within:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex min-h-[38px] items-center gap-2">
          <Plus className="h-4 w-4 text-[#fe6f05] shrink-0" />
          <input
            id="admin-attribute-variant-input"
            name="variantInput"
            aria-label={defaultPlaceholder}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                commitInput();
              }
            }}
            onBlur={commitInput}
            disabled={disabled}
            placeholder={defaultPlaceholder}
            className="h-8 w-full border-0 bg-transparent px-0 text-sm text-slate-800 placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        {chips.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
            {chips.map((entry) => (
              <span
                key={entry.toLowerCase()}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#034c85]/20 bg-[#034c85]/10 px-3 py-1 text-xs font-semibold text-[#034c85] dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-300"
              >
                {entry}
                <button
                  type="button"
                  onClick={() => removeValue(entry)}
                  disabled={disabled}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full transition hover:bg-[#034c85]/20 dark:hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Remove ${entry}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t("attributes.Press Enter to add.", "Press Enter to add.")}
      </p>
    </div>
  );
}
