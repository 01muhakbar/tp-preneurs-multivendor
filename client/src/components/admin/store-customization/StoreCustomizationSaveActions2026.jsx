import { Check, Rocket } from "lucide-react";

const formatTimestamp = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function StoreCustomizationSaveActions2026({
  onSave,
  onPublish,
  isSaving = false,
  isPublishing = false,
  isLoading = false,
  meta = {},
  className = "",
}) {
  const formattedDraftUpdatedAt = formatTimestamp(meta?.draftUpdatedAt);
  const formattedPublishedAt = formatTimestamp(meta?.publishedAt);
  const statusLabel = isPublishing
    ? "Publishing draft"
    : isSaving
      ? "Saving draft"
      : meta?.hasUnpublishedChanges
        ? "Draft saved"
        : formattedPublishedAt
          ? "Published"
          : "Ready";
  const statusDetail = isPublishing
    ? "Releasing now"
    : isSaving
      ? "Saving now"
      : meta?.hasUnpublishedChanges
        ? formattedDraftUpdatedAt || "Unpublished changes"
        : formattedPublishedAt || formattedDraftUpdatedAt || "No changes";
  const disabled = isSaving || isPublishing || isLoading;

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-3 ${className}`.trim()}>
      <div className="flex min-w-0 flex-wrap items-center gap-2 px-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
        <Check className="h-5 w-5 rounded-full bg-emerald-100 p-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" />
        <span>{statusLabel}</span>
        <span className="text-xs font-medium">{statusDetail}</span>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        className="h-11 rounded-2xl border border-emerald-500 bg-white px-5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-950 dark:hover:bg-emerald-500/10"
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
      <button
        type="button"
        onClick={onPublish}
        disabled={disabled}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Rocket className="h-4 w-4" />
        {isPublishing ? "Publishing..." : "Publish Draft"}
      </button>
    </div>
  );
}
