import { useTranslation } from "react-i18next";
import { Check, Rocket, Sparkles } from "lucide-react";

const formatTimestamp = (value, isId) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
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
  const { i18n } = useTranslation();
  const isId = Boolean(i18n.language?.toLowerCase().startsWith("id"));

  const formattedDraftUpdatedAt = formatTimestamp(meta?.draftUpdatedAt, isId);
  const formattedPublishedAt = formatTimestamp(meta?.publishedAt, isId);

  const statusLabel = isPublishing
    ? (isId ? "Menerbitkan draf..." : "Publishing draft...")
    : isSaving
      ? (isId ? "Menyimpan draf..." : "Saving draft...")
      : meta?.hasUnpublishedChanges
        ? (isId ? "Draf tersimpan" : "Draft saved")
        : formattedPublishedAt
          ? (isId ? "Telah diterbitkan" : "Published")
          : (isId ? "Siap" : "Ready");

  const statusDetail = isPublishing
    ? (isId ? "Sedang merilis" : "Releasing now")
    : isSaving
      ? (isId ? "Sedang menyimpan" : "Saving now")
      : meta?.hasUnpublishedChanges
        ? formattedDraftUpdatedAt || (isId ? "Ada perubahan belum diterbitkan" : "Unpublished changes")
        : formattedPublishedAt || formattedDraftUpdatedAt || (isId ? "Tidak ada perubahan" : "No changes");

  const disabled = isSaving || isPublishing || isLoading;

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-2.5 sm:gap-3 ${className}`.trim()}>
      <div className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
        <Check className="h-4 w-4 rounded-full bg-[#034c85]/15 p-0.5 text-[#034c85] dark:bg-[#034c85]/30 dark:text-blue-300" />
        <span className="font-bold text-slate-800 dark:text-slate-100">{statusLabel}</span>
        <span className="hidden text-[11px] text-slate-400 min-[480px]:inline">({statusDetail})</span>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#034c85] bg-white px-4 text-xs font-extrabold text-[#034c85] shadow-sm transition hover:bg-[#034c85]/5 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:text-blue-300 dark:border-blue-400 dark:hover:bg-slate-800"
      >
        <Sparkles className="h-3.5 w-3.5 text-[#fe6f05]" />
        <span>{isSaving ? (isId ? "Menyimpan..." : "Saving...") : (isId ? "Simpan Draf" : "Save Changes")}</span>
      </button>

      <button
        type="button"
        onClick={onPublish}
        disabled={disabled}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#fe6f05] px-4 text-xs font-extrabold text-white shadow-md shadow-[#fe6f05]/25 transition hover:bg-[#e05e00] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Rocket className="h-4 w-4" />
        <span>{isPublishing ? (isId ? "Menerbitkan..." : "Publishing...") : (isId ? "Terbitkan Draf" : "Publish Draft")}</span>
      </button>
    </div>
  );
}
