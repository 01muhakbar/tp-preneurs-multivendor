import React, { useState, useEffect } from "react";
import { Check, Package, Scale, Truck, X } from "lucide-react";

const DEFAULT_COURIER_OPTIONS = [
  {
    courierCode: "JNE",
    courierName: "JNE Express",
    serviceCode: "REG",
    serviceName: "Reguler (REG)",
    ratePerKg: 10000,
    estimate: "2 - 3 Hari",
    estimateEn: "2 - 3 Business Days",
  },
  {
    courierCode: "JNE",
    courierName: "JNE Express",
    serviceCode: "YES",
    serviceName: "Yakin Esok Sampai (YES)",
    ratePerKg: 20000,
    estimate: "1 Hari",
    estimateEn: "1 Business Day",
  },
  {
    courierCode: "JNE",
    courierName: "JNE Express",
    serviceCode: "OKE",
    serviceName: "Ongkos Kirim Ekonomis (OKE)",
    ratePerKg: 8000,
    estimate: "3 - 5 Hari",
    estimateEn: "3 - 5 Business Days",
  },
  {
    courierCode: "JNT",
    courierName: "J&T Express",
    serviceCode: "EZ",
    serviceName: "Reguler (EZ)",
    ratePerKg: 10000,
    estimate: "2 - 3 Hari",
    estimateEn: "2 - 3 Business Days",
  },
  {
    courierCode: "JNT",
    courierName: "J&T Express",
    serviceCode: "SUPER",
    serviceName: "Layanan Kilat (SUPER)",
    ratePerKg: 22000,
    estimate: "1 Hari",
    estimateEn: "1 Business Day",
  },
  {
    courierCode: "SICEPAT",
    courierName: "SiCepat Express",
    serviceCode: "SIUNTUNG",
    serviceName: "Reguler (SIUNTUNG)",
    ratePerKg: 10000,
    estimate: "2 - 3 Hari",
    estimateEn: "2 - 3 Business Days",
  },
  {
    courierCode: "SICEPAT",
    courierName: "SiCepat Express",
    serviceCode: "BEST",
    serviceName: "Besok Sampai (BEST)",
    ratePerKg: 20000,
    estimate: "1 Hari",
    estimateEn: "1 Business Day",
  },
  {
    courierCode: "POS",
    courierName: "Pos Indonesia",
    serviceCode: "Pos Reguler",
    serviceName: "Pos Reguler",
    ratePerKg: 9000,
    estimate: "2 - 4 Hari",
    estimateEn: "2 - 4 Business Days",
  },
  {
    courierCode: "ANTERAJA",
    courierName: "Anteraja",
    serviceCode: "Regular",
    serviceName: "Anteraja Regular",
    ratePerKg: 10000,
    estimate: "2 - 3 Hari",
    estimateEn: "2 - 3 Business Days",
  },
];

export default function CheckoutShippingModal({
  isOpen,
  onClose,
  store,
  selectedShippingOption,
  availableShippingRates = [],
  packageWeightKg = 1,
  totalWeightGrams = 1000,
  onSelectShipping,
  isIndo = true,
  formatMoney = (n) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`,
}) {
  const effectiveWeight = Math.max(1, Math.ceil(Number(packageWeightKg) || 1));
  const rates =
    Array.isArray(availableShippingRates) && availableShippingRates.length > 0
      ? availableShippingRates
      : DEFAULT_COURIER_OPTIONS.map((opt) => ({
          ...opt,
          shippingFee: opt.ratePerKg * effectiveWeight,
          weightKg: effectiveWeight,
        }));

  const [tempSelectedKey, setTempSelectedKey] = useState("");

  const buildOptionKey = (opt) =>
    `${opt?.courierCode || "JNE"}_${opt?.serviceCode || opt?.courierService || "REG"}`;

  useEffect(() => {
    if (!isOpen) return;
    if (selectedShippingOption) {
      setTempSelectedKey(buildOptionKey(selectedShippingOption));
    } else if (rates.length > 0) {
      setTempSelectedKey(buildOptionKey(rates[0]));
    }
  }, [isOpen, selectedShippingOption, rates]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const chosen = rates.find((r) => buildOptionKey(r) === tempSelectedKey) || rates[0];
    if (chosen && onSelectShipping) {
      onSelectShipping(chosen);
    }
    onClose?.();
  };

  return (
    <div className="co26-modal-overlay" onClick={onClose}>
      <div
        className="co26-modal-container max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="co26-modal-header border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#034c85]/20 flex items-center justify-center text-[#fe6f05]">
              <Truck size={18} />
            </div>
            <div>
              <h3 className="co26-modal-title text-base sm:text-lg font-bold text-slate-100">
                {isIndo ? "Pilih Opsi Pengiriman" : "Select Shipping Option"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {store?.storeName || store?.name || "Toko"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="co26-modal-close-btn p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Package Weight & Info Banner */}
        <div className="px-4 py-3 bg-[#034c85]/10 border-b border-[#034c85]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Scale size={16} className="text-[#fe6f05] shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">
                {isIndo ? "Total Berat Paket:" : "Total Package Weight:"}
              </span>{" "}
              <strong className="text-[#fe6f05] font-bold">
                {effectiveWeight} kg
              </strong>
              {totalWeightGrams ? (
                <span className="text-slate-400 text-[11px] ml-1">
                  ({totalWeightGrams} g)
                </span>
              ) : null}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 text-right shrink-0 hidden sm:inline">
            {isIndo ? "Dihitung otomatis per kg" : "Auto calculated per kg"}
          </span>
        </div>

        {/* Courier Services List */}
        <div className="co26-modal-body p-4 max-h-[58vh] overflow-y-auto space-y-2.5">
          {rates.map((opt) => {
            const key = buildOptionKey(opt);
            const isSelected = key === tempSelectedKey;
            const rateFee = Number(opt.shippingFee || opt.ratePerKg * effectiveWeight || 0);

            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => setTempSelectedKey(key)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-[#034c85]/20 border-[#fe6f05] shadow-sm shadow-[#fe6f05]/10"
                    : "bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600"
                }`}
              >
                {/* Left side: Radio + Details */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                      isSelected
                        ? "border-[#fe6f05] bg-[#fe6f05] text-white"
                        : "border-slate-500 bg-transparent"
                    }`}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#034c85]/40 text-blue-200 border border-[#034c85]">
                        {opt.courierName || opt.courierCode}
                      </span>
                      <strong className="text-xs sm:text-sm text-slate-100 font-semibold truncate">
                        {opt.serviceName || opt.serviceCode}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span>
                        {isIndo ? "Estimasi:" : "Est:"}{" "}
                        <span className="text-slate-300 font-medium">
                          {isIndo ? opt.estimate || "2 - 3 Hari" : opt.estimateEn || "2 - 3 Business Days"}
                        </span>
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">
                        {formatMoney(opt.ratePerKg || 10000)} / kg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Calculated Shipping Fee */}
                <div className="text-right shrink-0">
                  <strong className="text-sm sm:text-base font-bold text-[#fe6f05] block">
                    {formatMoney(rateFee)}
                  </strong>
                  <span className="text-[10px] text-slate-400 block">
                    ({effectiveWeight} kg)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-700/60 flex items-center justify-end gap-2.5 bg-slate-900/60 rounded-b-2xl">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            onClick={onClose}
          >
            {isIndo ? "Batal" : "Cancel"}
          </button>
          <button
            type="button"
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#034c85] to-[#fe6f05] hover:opacity-95 active:scale-95 transition shadow-md shadow-[#fe6f05]/20"
            onClick={handleConfirm}
          >
            {isIndo ? "Konfirmasi Opsi Ini" : "Confirm Option"}
          </button>
        </div>
      </div>
    </div>
  );
}
