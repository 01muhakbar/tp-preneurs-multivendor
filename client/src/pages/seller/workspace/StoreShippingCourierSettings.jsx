import React from "react";
import {
  Truck,
  Zap,
  Package,
  Boxes,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

export const COURIER_DEFINITIONS = [
  {
    code: "GRAB",
    name: "GrabExpress",
    desc: "Same Day, Instant (Motor), Instant (Mobil)",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    services: ["instant"],
    popular: true,
  },
  {
    code: "JNT",
    name: "J&T Express",
    desc: "EZ (Reguler), J&T Super (Kilat)",
    badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
    services: ["regular", "express"],
    popular: true,
  },
  {
    code: "JNE",
    name: "JNE Express",
    desc: "REG (Reguler), YES (Kilat), OKE (Ekonomi), JTR (Kargo)",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    services: ["regular", "express", "economy", "cargo"],
    popular: true,
  },
  {
    code: "SICEPAT",
    name: "SiCepat Ekspres",
    desc: "SIUNTUNG (Reguler), BEST (Kilat), GOKIL (Kargo)",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    services: ["regular", "express", "cargo"],
    popular: true,
  },
  {
    code: "POS",
    name: "Pos Indonesia",
    desc: "Pos Reguler, Nextday, Pos Jumbo (Kargo)",
    badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    services: ["regular", "express", "cargo"],
    popular: false,
  },
  {
    code: "ANTERAJA",
    name: "Anteraja",
    desc: "Reguler, Next Day, Cargo",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    services: ["regular", "express", "cargo"],
    popular: false,
  },
  {
    code: "LION",
    name: "Lion Parcel",
    desc: "REGPACK, ONEPACK, JAGOPACK, BIGPACK",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    services: ["regular", "express", "economy", "cargo"],
    popular: false,
  },
  {
    code: "WAHANA",
    name: "Wahana Express",
    desc: "Service Normal, Cargo",
    badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    services: ["economy", "cargo"],
    popular: false,
  },
  {
    code: "NINJA",
    name: "Ninja Xpress",
    desc: "Standard, Express",
    badgeColor: "bg-red-600/20 text-red-300 border-red-600/30",
    services: ["regular", "express"],
    popular: false,
  },
];

export const SERVICE_CATEGORY_DEFINITIONS = [
  {
    code: "instant",
    labelId: "Instan & Same Day",
    labelEn: "Instant & Same Day",
    estId: "1 - 8 Jam (GrabExpress)",
    estEn: "1 - 8 Hours",
    icon: Zap,
    color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  },
  {
    code: "regular",
    labelId: "Reguler / Standar",
    labelEn: "Regular / Standard",
    estId: "1 - 3 Hari",
    estEn: "1 - 3 Days",
    icon: Package,
    color: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  },
  {
    code: "express",
    labelId: "Kilat / Next Day",
    labelEn: "Express / Next Day",
    estId: "1 Hari",
    estEn: "1 Day",
    icon: Sparkles,
    color: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  },
  {
    code: "economy",
    labelId: "Ekonomi / Hemat",
    labelEn: "Economy / Budget",
    estId: "3 - 6 Hari",
    estEn: "3 - 6 Days",
    icon: ShoppingBag,
    color: "text-teal-400 border-teal-500/40 bg-teal-500/10",
  },
  {
    code: "cargo",
    labelId: "Kargo / Truk",
    labelEn: "Cargo / Trucking",
    estId: "Min. 10 kg (3 - 7 Hari)",
    estEn: "Min. 10 kg",
    icon: Boxes,
    color: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  },
];

export default function StoreShippingCourierSettings({
  enabledCouriers = [],
  enabledCategories = [],
  onChangeCouriers,
  onChangeCategories,
  isIndo = true,
  platformCouriers,
  platformMandatoryCouriers = ["JNE", "JNT"],
}) {
  const selectedCouriers = Array.isArray(enabledCouriers) ? enabledCouriers : [];
  const selectedCategories = Array.isArray(enabledCategories) ? enabledCategories : [];

  const handleToggleCourier = (code) => {
    if (Array.isArray(platformCouriers) && platformCouriers.length > 0 && !platformCouriers.includes(code)) {
      return;
    }
    if (Array.isArray(platformMandatoryCouriers) && platformMandatoryCouriers.includes(code) && selectedCouriers.includes(code)) {
      return;
    }
    const isSelected = selectedCouriers.includes(code);
    let next;
    if (isSelected) {
      next = selectedCouriers.filter((c) => c !== code);
    } else {
      next = [...selectedCouriers, code];
    }
    onChangeCouriers?.(next);
  };

  const handleToggleCategory = (categoryCode) => {
    const isSelected = selectedCategories.includes(categoryCode);
    let next;
    if (isSelected) {
      next = selectedCategories.filter((c) => c !== categoryCode);
    } else {
      next = [...selectedCategories, categoryCode];
    }
    onChangeCategories?.(next);
  };

  // Quick Presets
  const applyPresetCulinary = () => {
    onChangeCouriers?.(["GRAB", "JNT"]);
    onChangeCategories?.(["instant", "regular"]);
  };

  const applyPresetRetail = () => {
    onChangeCouriers?.(["JNT", "JNE", "SICEPAT", "POS"]);
    onChangeCategories?.(["regular", "express", "economy"]);
  };

  const applyPresetCargo = () => {
    onChangeCouriers?.(["JNE", "SICEPAT", "POS", "ANTERAJA"]);
    onChangeCategories?.(["regular", "cargo"]);
  };

  const applyPresetAll = () => {
    onChangeCouriers?.(COURIER_DEFINITIONS.map((c) => c.code));
    onChangeCategories?.(SERVICE_CATEGORY_DEFINITIONS.map((c) => c.code));
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-700/80 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fe6f05]/15 text-[#fe6f05] border border-[#fe6f05]/30">
            <Truck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              {isIndo
                ? "Pilihan Ekspedisi & Tipe Layanan Toko"
                : "Store Couriers & Service Tiers"}
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#fe6f05]/10 text-[#fe6f05] border border-[#fe6f05]/20 font-mono">
                {selectedCouriers.length} / {COURIER_DEFINITIONS.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isIndo
                ? "Centang ekspedisi yang sanggup Anda kirim agar hanya opsi ini yang tampil bagi pembeli di Checkout."
                : "Select the couriers and services you support. Only selected options will be shown to buyers."}
            </p>
          </div>
        </div>

        {/* Quick Presets Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={applyPresetCulinary}
            className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition flex items-center gap-1.5"
            title={
              isIndo
                ? "Hanya Instan & Reguler cepat (untuk makanan/kuliner segar)"
                : "Instant & fast regular only (for fresh food)"
            }
          >
            <Zap size={12} className="text-emerald-400" />
            <span>{isIndo ? "⚡ Kuliner / Makanan Segar" : "⚡ Fresh Food"}</span>
          </button>
          <button
            type="button"
            onClick={applyPresetRetail}
            className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition flex items-center gap-1.5"
            title={
              isIndo
                ? "Reguler & Kilat standar (untuk fashion, craft, buku, retail)"
                : "Regular & express for retail products"
            }
          >
            <Package size={12} className="text-blue-400" />
            <span>{isIndo ? "📦 Retail & Kerajinan" : "📦 Retail / Craft"}</span>
          </button>
          <button
            type="button"
            onClick={applyPresetCargo}
            className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition flex items-center gap-1.5"
            title={
              isIndo
                ? "Ekspedisi kargo untuk barang berat >10kg"
                : "Cargo for heavy items"
            }
          >
            <Boxes size={12} className="text-amber-400" />
            <span>{isIndo ? "🚛 Kargo / Berat" : "🚛 Cargo"}</span>
          </button>
          <button
            type="button"
            onClick={applyPresetAll}
            className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            {isIndo ? "Pilih Semua" : "Select All"}
          </button>
        </div>
      </div>

      {/* Info Notice: Non-Physical Products Exemption */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
        <Info size={16} className="shrink-0 text-blue-400 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-300">
            {isIndo ? "Khusus Pengiriman Produk Fisik: " : "Physical Products Only: "}
          </span>
          {isIndo
            ? "Pilihan ekspedisi ini hanya berlaku untuk produk fisik. Produk Digital & Layanan (Jasa) dibebaskan dari ongkos kirim dan tidak memerlukan kurir ekspedisi di checkout."
            : "These shipping options only apply to physical products. Digital assets and Services are freight-exempt (free shipping) and will not require courier selection at checkout."}
        </div>
      </div>

      {/* 1. Service Categories Tiers Toggle */}
      <div className="mt-4">
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          {isIndo
            ? "1. Kategori Layanan yang Diizinkan Toko"
            : "1. Allowed Service Tiers"}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SERVICE_CATEGORY_DEFINITIONS.map((cat) => {
            const isChecked = selectedCategories.includes(cat.code);
            const Icon = cat.icon;
            return (
              <button
                type="button"
                key={cat.code}
                onClick={() => handleToggleCategory(cat.code)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                  isChecked
                    ? `${cat.color} ring-1 ring-offset-0 ring-current`
                    : "border-slate-800 bg-slate-950/60 text-slate-500 hover:border-slate-700 hover:text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Icon size={14} />
                  <div
                    className={`h-4 w-4 rounded-full flex items-center justify-center border text-[10px] ${
                      isChecked
                        ? "bg-current text-slate-950 border-transparent font-bold"
                        : "border-slate-700"
                    }`}
                  >
                    {isChecked ? "✓" : ""}
                  </div>
                </div>
                <span className="text-xs font-bold leading-tight">
                  {isIndo ? cat.labelId : cat.labelEn}
                </span>
                <span className="text-[10px] opacity-75 mt-0.5 line-clamp-1">
                  {isIndo ? cat.estId : cat.estEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Courier Partner Grid */}
      <div className="mt-5">
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          {isIndo
            ? "2. Mitra Ekspedisi yang Diaktifkan Toko"
            : "2. Enabled Courier Partners"}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {COURIER_DEFINITIONS.map((courier) => {
            const isMandatory =
              Array.isArray(platformMandatoryCouriers) &&
              platformMandatoryCouriers.includes(courier.code);
            const isPlatformDisabled =
              Array.isArray(platformCouriers) &&
              platformCouriers.length > 0 &&
              !platformCouriers.includes(courier.code);
            const isChecked = selectedCouriers.includes(courier.code) || isMandatory;

            return (
              <div
                key={courier.code}
                onClick={() => handleToggleCourier(courier.code)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all select-none ${
                  isPlatformDisabled
                    ? "border-slate-800/60 bg-slate-950/20 text-slate-600 opacity-40 cursor-not-allowed"
                    : isChecked
                    ? "border-[#fe6f05]/60 bg-gradient-to-r from-slate-900 to-slate-850/90 shadow-md ring-1 ring-[#fe6f05]/30 cursor-pointer"
                    : "border-slate-800 bg-slate-950/40 text-slate-500 opacity-65 hover:opacity-90 hover:border-slate-700 cursor-pointer"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    isPlatformDisabled
                      ? "border-slate-800 bg-slate-950"
                      : isChecked
                      ? isMandatory
                        ? "border-amber-500 bg-amber-500 text-slate-950"
                        : "border-[#fe6f05] bg-[#fe6f05] text-white"
                      : "border-slate-700 bg-slate-900"
                  }`}
                >
                  {isChecked && !isPlatformDisabled && <Check size={13} strokeWidth={3} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-bold truncate ${
                        isPlatformDisabled
                          ? "text-slate-600 line-through"
                          : isChecked
                          ? "text-slate-100"
                          : "text-slate-400"
                      }`}
                    >
                      {courier.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {isMandatory && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded">
                          ★ Wajib
                        </span>
                      )}
                      {isPlatformDisabled && (
                        <span className="text-[9px] text-slate-500 bg-slate-800 border border-slate-700 px-1 py-0.2 rounded">
                          Nonaktif
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${courier.badgeColor}`}
                      >
                        {courier.code}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {courier.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation warning if none selected */}
      {selectedCouriers.length === 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
          <AlertCircle size={15} className="shrink-0 text-rose-400" />
          <span>
            {isIndo
              ? "Peringatan: Toko Anda harus memiliki minimal 1 ekspedisi aktif agar pembeli dapat memilih pengiriman."
              : "Warning: Please select at least 1 courier so buyers can purchase from your store."}
          </span>
        </div>
      )}
    </div>
  );
}
