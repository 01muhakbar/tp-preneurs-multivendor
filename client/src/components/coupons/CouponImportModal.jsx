import { useEffect, useRef, useState } from "react";
import { FileJson, Upload, X } from "lucide-react";

export default function CouponImportModal({
  open,
  onClose,
  onImport,
  title = "Import coupons",
  description = "Upload a JSON file to import coupon campaigns.",
  helperText = "Only JSON exports from this workspace are supported.",
  unavailableMessage = "",
  confirmLabel = "Import Now",
  accept = "application/json,.json",
  selectPrompt = "Choose JSON coupon file",
  closeLabel = "Close",
  importingLabel = "Importing...",
  isSubmitting = false,
  errorMessage = "",
}) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
    }
  }, [open]);

  if (!open) return null;

  const canImport = typeof onImport === "function" && !unavailableMessage;

  const handlePickFile = () => {
    if (!canImport || isSubmitting) return;
    inputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    setSelectedFile(file);
  };

  const handleConfirm = () => {
    if (!canImport || !selectedFile || isSubmitting) return;
    onImport(selectedFile);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose?.()}
        disabled={isSubmitting}
        aria-label="Close import modal"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => !isSubmitting && onClose?.()}
          disabled={isSubmitting}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#034c85]/10 dark:bg-[#034c85]/30 text-[#034c85] dark:text-[#60a5fa] border border-[#034c85]/20">
          <Upload className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>

        {canImport ? (
          <div className="mt-5 space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={handlePickFile}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-5 py-8 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-[#034c85] hover:bg-[#034c85]/5 dark:hover:bg-[#034c85]/15 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileJson className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedFile?.name || selectPrompt}
              </span>
            </button>

            <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
            {unavailableMessage || "Import is currently unavailable."}
          </div>
        )}

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] h-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {closeLabel}
          </button>
          {canImport ? (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedFile || isSubmitting}
              className="inline-flex min-h-[44px] h-11 items-center justify-center rounded-xl bg-[#fe6f05] hover:bg-[#e05f00] px-5 text-sm font-semibold text-white transition shadow-md shadow-[#fe6f05]/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? importingLabel : confirmLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
