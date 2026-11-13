import { useTranslation } from "react-i18next";
import { Trash2, X } from "lucide-react";

export default function DeleteCouponModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isLoading = false,
  errorMessage = "",
}) {
  const { t, i18n } = useTranslation("admin");
  if (!open) return null;

  const isId = String(i18n.language || "").toLowerCase().startsWith("id");

  const displayTitle = title
    ? t(`coupons.${title}`, title)
    : (isId ? "Yakin Ingin Menghapus?" : t("coupons.Are You Sure! Want to Delete ?", "Are You Sure! Want to Delete ?"));

  const displayDesc = description
    ? t(`coupons.${description}`, description)
    : (isId
        ? "Kupon yang dihapus tidak dapat dipulihkan."
        : t("coupons.Deleted coupons cannot be recovered.", "Deleted coupons cannot be recovered."));

  const displayConfirm = confirmLabel
    ? t(`coupons.${confirmLabel}`, confirmLabel)
    : (isId ? "Ya, Hapus" : t("coupons.Yes, Delete It", "Yes, Delete It"));

  const displayCancel = cancelLabel
    ? t(`coupons.${cancelLabel}`, cancelLabel)
    : (isId ? "Batal" : t("coupons.No, Keep It", "No, Keep It"));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={isId ? "Tutup modal hapus" : "Close delete modal"}
        disabled={isLoading}
        onClick={() => !isLoading && onClose()}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => !isLoading && onClose()}
          disabled={isLoading}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
          aria-label={isId ? "Tutup" : "Close"}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <Trash2 className="h-6 w-6" />
        </div>

        <h3 className="text-center text-lg font-bold text-slate-900 dark:text-slate-100">{displayTitle}</h3>
        <p className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">{displayDesc}</p>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex min-h-[44px] h-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {displayCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex min-h-[44px] h-11 items-center justify-center rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700 transition shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (isId ? "Menghapus..." : t("coupons.Deleting...", "Deleting...")) : displayConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
