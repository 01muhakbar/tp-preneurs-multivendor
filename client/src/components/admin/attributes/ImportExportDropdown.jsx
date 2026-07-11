import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, Plus, Upload } from "lucide-react";

const btnBase =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#fe6f05]/25 disabled:cursor-not-allowed disabled:opacity-60";
const btnOutline = `${btnBase} border border-slate-200 bg-white text-slate-700 hover:border-[#034c85]/30 hover:bg-[#034c85]/5`;
const btnSoft = `${btnBase} border border-slate-200 bg-slate-50 text-slate-700 hover:border-[#fe6f05]/30 hover:bg-[#fe6f05]/5`;
const btnBlue = `${btnBase} bg-[#034c85] text-white shadow-sm shadow-[#034c85]/20 hover:bg-[#023e6d]`;

export default function ImportExportDropdown({
  pendingImportFileName = "",
  pendingImportCount = 0,
  isImporting = false,
  exportingFormat = "",
  onImportFileSelect,
  onImportNow,
  onExport,
}) {
  const exportMenuRef = useRef(null);
  const importInputRef = useRef(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [importPickerVisible, setImportPickerVisible] = useState(false);

  useEffect(() => {
    if (!exportMenuOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (!exportMenuRef.current) return;
      if (!exportMenuRef.current.contains(event.target)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [exportMenuOpen]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div ref={exportMenuRef} className="relative">
        <button
          type="button"
          className={btnOutline}
          onClick={() => setExportMenuOpen((prev) => !prev)}
          disabled={Boolean(exportingFormat)}
        >
          <Download className="h-4 w-4" />
          {exportingFormat ? `Exporting ${exportingFormat.toUpperCase()}...` : "Export"}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {exportMenuOpen ? (
          <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
            <button
              type="button"
              onClick={() => {
                setExportMenuOpen(false);
                onExport?.("csv");
              }}
              className="block w-full px-3 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-[#034c85]/5"
            >
              Export to CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setExportMenuOpen(false);
                onExport?.("json");
              }}
              className="block w-full px-3 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-[#034c85]/5"
            >
              Export to JSON
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className={btnSoft}
        onClick={() => setImportPickerVisible(true)}
        disabled={isImporting}
      >
        <Upload className="h-4 w-4" />
        Import
      </button>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
          onImportFileSelect?.(file);
          if (file) {
            setImportPickerVisible(true);
          }
          event.target.value = "";
        }}
      />

      {importPickerVisible ? (
        <>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex h-10 min-w-[168px] max-w-[260px] items-center rounded-lg border border-dashed border-[#034c85]/35 bg-white px-3 text-xs font-semibold text-slate-500 transition hover:border-[#fe6f05]/60 hover:bg-[#fe6f05]/5"
            title={pendingImportFileName || "Select JSON attribute file"}
          >
            <span className="truncate">
              {pendingImportFileName || "Choose JSON"}
            </span>
          </button>

          {pendingImportFileName ? (
            <button
              type="button"
              className={btnBlue}
              disabled={isImporting}
              onClick={onImportNow}
            >
              <Plus className="h-4 w-4" />
              {isImporting ? "Importing..." : "Import Now"}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
