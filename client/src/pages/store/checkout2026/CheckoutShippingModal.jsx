import React, { useState, useEffect, useMemo } from "react";
import { Check, Package, Scale, Truck, X, Zap, Clock, ShieldCheck, Box } from "lucide-react";
import {
  calculateBilledWeight,
  determineShippingZone,
  calculateStandaloneShippingRates,
} from "../../../utils/standaloneShippingEngine.js";

export const DEFAULT_COURIER_OPTIONS = [
  // 1. JNE Express
  {
    courierCode: "JNE",
    courierName: "JNE Express",
    serviceCode: "REG",
    serviceName: "Reguler (REG)",
    category: "regular",
    categoryLabel: "Reguler",
    categoryLabelEn: "Regular",
    ratePerKg: 10000,
    minWeight: 1,
    minFee: 10000,
    estimate: "1 - 3 Hari",
    estimateEn: "1 - 3 Business Days",
  },
  {
    courierCode: "JNE",
    courierName: "JNE Express",
    serviceCode: "YES",
    serviceName: "Yakin Esok Sampai (YES)",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    ratePerKg: 18000,
    minWeight: 1,
    minFee: 18000,
    estimate: "1 Hari",
    estimateEn: "1 Business Day",
  },
  {
    courierCode: "JNE",
    courierName: "JNE Express",
    serviceCode: "OKE",
    serviceName: "Ongkos Kirim Ekonomis (OKE)",
    category: "economy",
    categoryLabel: "Ekonomi",
    categoryLabelEn: "Economy",
    ratePerKg: 8000,
    minWeight: 1,
    minFee: 8000,
    estimate: "3 - 6 Hari",
    estimateEn: "3 - 6 Business Days",
  },
  {
    courierCode: "JNE",
    courierName: "JNE Express",
    serviceCode: "JTR",
    serviceName: "JNE Trucking (JTR Kargo)",
    category: "cargo",
    categoryLabel: "Kargo",
    categoryLabelEn: "Cargo",
    ratePerKg: 3500,
    minWeight: 10,
    minFee: 35000,
    estimate: "3 - 7 Hari",
    estimateEn: "3 - 7 Business Days",
  },

  // 2. J&T Express
  {
    courierCode: "JNT",
    courierName: "J&T Express",
    serviceCode: "EZ",
    serviceName: "Reguler (EZ)",
    category: "regular",
    categoryLabel: "Reguler",
    categoryLabelEn: "Regular",
    ratePerKg: 10000,
    minWeight: 1,
    minFee: 10000,
    estimate: "2 - 3 Hari",
    estimateEn: "2 - 3 Business Days",
  },
  {
    courierCode: "JNT",
    courierName: "J&T Express",
    serviceCode: "SUPER",
    serviceName: "J&T Super (Kilat)",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    ratePerKg: 18000,
    minWeight: 1,
    minFee: 18000,
    estimate: "1 - 2 Hari",
    estimateEn: "1 - 2 Business Days",
  },
  {
    courierCode: "JNT",
    courierName: "J&T Express",
    serviceCode: "ECO",
    serviceName: "J&T ECO (Ekonomis)",
    category: "economy",
    categoryLabel: "Ekonomi",
    categoryLabelEn: "Economy",
    ratePerKg: 7000,
    minWeight: 1,
    minFee: 7000,
    estimate: "3 - 7 Hari",
    estimateEn: "3 - 7 Business Days",
  },
  {
    courierCode: "JNT",
    courierName: "J&T Express",
    serviceCode: "J&T Cargo",
    serviceName: "J&T Cargo (Kargo)",
    category: "cargo",
    categoryLabel: "Kargo",
    categoryLabelEn: "Cargo",
    ratePerKg: 3000,
    minWeight: 10,
    minFee: 30000,
    estimate: "3 - 7 Hari",
    estimateEn: "3 - 7 Business Days",
  },

  // 3. SiCepat Express
  {
    courierCode: "SICEPAT",
    courierName: "SiCepat Express",
    serviceCode: "SIUNTUNG",
    serviceName: "Reguler (SIUNTUNG)",
    category: "regular",
    categoryLabel: "Reguler",
    categoryLabelEn: "Regular",
    ratePerKg: 9500,
    minWeight: 1,
    minFee: 9500,
    estimate: "1 - 3 Hari",
    estimateEn: "1 - 3 Business Days",
  },
  {
    courierCode: "SICEPAT",
    courierName: "SiCepat Express",
    serviceCode: "BEST",
    serviceName: "Besok Sampai (BEST)",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    ratePerKg: 18000,
    minWeight: 1,
    minFee: 18000,
    estimate: "1 Hari",
    estimateEn: "1 Business Day",
  },
  {
    courierCode: "SICEPAT",
    courierName: "SiCepat Express",
    serviceCode: "HALU",
    serviceName: "HALU (Hemat)",
    category: "economy",
    categoryLabel: "Ekonomi",
    categoryLabelEn: "Economy",
    ratePerKg: 7000,
    minWeight: 1,
    minFee: 7000,
    estimate: "2 - 5 Hari",
    estimateEn: "2 - 5 Business Days",
  },
  {
    courierCode: "SICEPAT",
    courierName: "SiCepat Express",
    serviceCode: "GOKIL",
    serviceName: "GOKIL (Cargo Kilat)",
    category: "cargo",
    categoryLabel: "Kargo",
    categoryLabelEn: "Cargo",
    ratePerKg: 3500,
    minWeight: 10,
    minFee: 35000,
    estimate: "2 - 5 Hari",
    estimateEn: "2 - 5 Business Days",
  },

  // 4. Pos Indonesia
  {
    courierCode: "POS",
    courierName: "Pos Indonesia",
    serviceCode: "Pos Reguler",
    serviceName: "Pos Reguler",
    category: "regular",
    categoryLabel: "Reguler",
    categoryLabelEn: "Regular",
    ratePerKg: 9000,
    minWeight: 1,
    minFee: 9000,
    estimate: "2 - 4 Hari",
    estimateEn: "2 - 4 Business Days",
  },
  {
    courierCode: "POS",
    courierName: "Pos Indonesia",
    serviceCode: "Pos Nextday",
    serviceName: "Pos Nextday (Kilat)",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    ratePerKg: 16000,
    minWeight: 1,
    minFee: 16000,
    estimate: "1 Hari",
    estimateEn: "1 Business Day",
  },
  {
    courierCode: "POS",
    courierName: "Pos Indonesia",
    serviceCode: "Pos Sameday",
    serviceName: "Pos Sameday (Hari Sama)",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    ratePerKg: 20000,
    minWeight: 1,
    minFee: 20000,
    estimate: "Hari yang Sama",
    estimateEn: "Same Day Delivery",
  },
  {
    courierCode: "POS",
    courierName: "Pos Indonesia",
    serviceCode: "Pos Jumbo",
    serviceName: "Pos Jumbo (Kargo)",
    category: "cargo",
    categoryLabel: "Kargo",
    categoryLabelEn: "Cargo",
    ratePerKg: 4000,
    minWeight: 5,
    minFee: 20000,
    estimate: "3 - 7 Hari",
    estimateEn: "3 - 7 Business Days",
  },

  // 5. Lion Parcel
  {
    courierCode: "LION",
    courierName: "Lion Parcel",
    serviceCode: "REGPACK",
    serviceName: "REGPACK (Reguler)",
    category: "regular",
    categoryLabel: "Reguler",
    categoryLabelEn: "Regular",
    ratePerKg: 9500,
    minWeight: 1,
    minFee: 9500,
    estimate: "2 - 4 Hari",
    estimateEn: "2 - 4 Business Days",
  },
  {
    courierCode: "LION",
    courierName: "Lion Parcel",
    serviceCode: "ONEPACK",
    serviceName: "ONEPACK (Kilat Esok)",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    ratePerKg: 17500,
    minWeight: 1,
    minFee: 17500,
    estimate: "1 Hari",
    estimateEn: "1 Business Day",
  },
  {
    courierCode: "LION",
    courierName: "Lion Parcel",
    serviceCode: "JAGOPACK",
    serviceName: "JAGOPACK (Ekonomis)",
    category: "economy",
    categoryLabel: "Ekonomi",
    categoryLabelEn: "Economy",
    ratePerKg: 7000,
    minWeight: 1,
    minFee: 7000,
    estimate: "2 - 7 Hari",
    estimateEn: "2 - 7 Business Days",
  },
  {
    courierCode: "LION",
    courierName: "Lion Parcel",
    serviceCode: "BIGPACK",
    serviceName: "BIGPACK (Kargo Besar)",
    category: "cargo",
    categoryLabel: "Kargo",
    categoryLabelEn: "Cargo",
    ratePerKg: 3500,
    minWeight: 10,
    minFee: 35000,
    estimate: "3 - 6 Hari",
    estimateEn: "3 - 6 Business Days",
  },

  // 6. SAPX Express
  {
    courierCode: "SAPX",
    courierName: "SAPX Express",
    serviceCode: "Satria REG",
    serviceName: "Satria REG (Reguler)",
    category: "regular",
    categoryLabel: "Reguler",
    categoryLabelEn: "Regular",
    ratePerKg: 9500,
    minWeight: 1,
    minFee: 9500,
    estimate: "2 - 4 Hari",
    estimateEn: "2 - 4 Business Days",
  },
  {
    courierCode: "SAPX",
    courierName: "SAPX Express",
    serviceCode: "Satria ODS",
    serviceName: "Satria ODS (One Day Service)",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    ratePerKg: 17000,
    minWeight: 1,
    minFee: 17000,
    estimate: "1 Hari",
    estimateEn: "1 Business Day",
  },
  {
    courierCode: "SAPX",
    courierName: "SAPX Express",
    serviceCode: "Satria Cargo",
    serviceName: "Satria Cargo (Layanan Kargo)",
    category: "cargo",
    categoryLabel: "Kargo",
    categoryLabelEn: "Cargo",
    ratePerKg: 3500,
    minWeight: 10,
    minFee: 35000,
    estimate: "3 - 7 Hari",
    estimateEn: "3 - 7 Business Days",
  },

  // 7. Anteraja
  {
    courierCode: "ANTERAJA",
    courierName: "Anteraja",
    serviceCode: "Regular",
    serviceName: "Anteraja Regular",
    category: "regular",
    categoryLabel: "Reguler",
    categoryLabelEn: "Regular",
    ratePerKg: 10000,
    minWeight: 1,
    minFee: 10000,
    estimate: "2 - 3 Hari",
    estimateEn: "2 - 3 Business Days",
  },
  {
    courierCode: "ANTERAJA",
    courierName: "Anteraja",
    serviceCode: "Next Day",
    serviceName: "Anteraja Next Day",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    ratePerKg: 18000,
    minWeight: 1,
    minFee: 18000,
    estimate: "1 Hari",
    estimateEn: "1 Business Day",
  },
  {
    courierCode: "ANTERAJA",
    courierName: "Anteraja",
    serviceCode: "Cargo",
    serviceName: "Anteraja Cargo",
    category: "cargo",
    categoryLabel: "Kargo",
    categoryLabelEn: "Cargo",
    ratePerKg: 3500,
    minWeight: 10,
    minFee: 35000,
    estimate: "3 - 6 Hari",
    estimateEn: "3 - 6 Business Days",
  },
];

export default function CheckoutShippingModal({
  isOpen,
  onClose,
  store,
  destination,
  selectedShippingOption,
  availableShippingRates = [],
  packageWeightKg = 1,
  totalWeightGrams = 1000,
  onSelectShipping,
  isIndo = true,
  formatMoney = (n) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`,
}) {
  const origin = useMemo(() => {
    const setup = store?.shippingSetup || {};
    return {
      city: setup.originCity || store?.city || store?.address?.city || "Kota Makassar",
      province: setup.originProvince || store?.province || store?.address?.province || "Sulawesi Selatan",
      district: setup.originDistrict || store?.district || store?.address?.district || "Rappocini",
      lat:
        setup.originLatitude != null && !isNaN(Number(setup.originLatitude))
          ? Number(setup.originLatitude)
          : store?.lat ?? store?.latitude ?? store?.address?.lat ?? store?.address?.latitude ?? null,
      lng:
        setup.originLongitude != null && !isNaN(Number(setup.originLongitude))
          ? Number(setup.originLongitude)
          : store?.lng ?? store?.longitude ?? store?.address?.lng ?? store?.address?.longitude ?? null,
    };
  }, [store?.shippingSetup, store?.city, store?.province, store?.district, store?.address, store?.lat, store?.latitude, store?.lng, store?.longitude]);

  const zone = useMemo(() => {
    return determineShippingZone(origin, destination);
  }, [origin, destination]);

  const billedWeightInfo = useMemo(() => {
    const pWeight = Number(totalWeightGrams) > 0 ? Number(totalWeightGrams) / 1000 : Number(packageWeightKg) || 1;
    return calculateBilledWeight(pWeight, 0, 0.25);
  }, [totalWeightGrams, packageWeightKg]);

  const effectiveWeight = billedWeightInfo.billedWeightKg;
  const [activeCategory, setActiveCategory] = useState("all");

  const rates = useMemo(() => {
    const setup = store?.shippingSetup || {};
    const engineRates = calculateStandaloneShippingRates({
      origin,
      destination,
      totalWeightGrams,
      items: store?.items || [],
      distanceKm: destination?.distanceKm,
      allowedCouriers: setup.enabledCouriers,
      allowedCategories: setup.enabledCategories,
    });

    if (Array.isArray(availableShippingRates) && availableShippingRates.length > 0) {
      const hasInstant = availableShippingRates.some((r) => r.category === "instant");
      if (hasInstant) {
        return availableShippingRates;
      }
      // If server rates only have regular couriers (e.g. preview called before address loaded),
      // merge the local instant rates if within range (<= 40 km)!
      const localInstantRates = engineRates.filter((r) => r.category === "instant");
      if (localInstantRates.length > 0) {
        return [...localInstantRates, ...availableShippingRates];
      }
      return availableShippingRates;
    }

    if (Array.isArray(engineRates) && engineRates.length > 0) {
      return engineRates;
    }
    return DEFAULT_COURIER_OPTIONS.map((opt) => {
      const isCargo = opt.category === "cargo";
      const minWeight = opt.minWeight || (isCargo ? 10 : 1);
      const chargedWeight = Math.max(minWeight, effectiveWeight);
      const calculatedFee = opt.ratePerKg * chargedWeight;
      const shippingFee = Math.max(opt.minFee || 0, calculatedFee);

      return {
        ...opt,
        shippingFee,
        weightKg: effectiveWeight,
        chargedWeight,
        minWeight,
      };
    });
  }, [availableShippingRates, origin, destination, totalWeightGrams, effectiveWeight, store?.items, store?.shippingSetup]);

  const cheapestRate = useMemo(() => {
    if (rates.length <= 1) return null;
    return rates.reduce((min, r) => (r.shippingFee < min.shippingFee ? r : min), rates[0]);
  }, [rates]);

  const fastestRate = useMemo(() => {
    if (rates.length <= 1) return null;
    const instant = rates.find((r) => r.category === "instant");
    if (instant) return instant;
    const express = rates.find((r) => r.category === "express");
    if (express) return express;
    return null;
  }, [rates]);

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

  const categories = [
    { key: "all", label: isIndo ? "Semua" : "All" },
    { key: "instant", label: isIndo ? "Instan / Same Day" : "Instant / Same Day" },
    { key: "regular", label: isIndo ? "Reguler" : "Standard" },
    { key: "express", label: isIndo ? "Kilat" : "Express" },
    { key: "economy", label: isIndo ? "Ekonomi" : "Economy" },
    { key: "cargo", label: isIndo ? "Kargo" : "Cargo" },
  ];

  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat.key] =
      cat.key === "all"
        ? rates.length
        : rates.filter((r) => (r.category || "regular") === cat.key).length;
    return acc;
  }, {});

  const filteredRates =
    activeCategory === "all"
      ? rates
      : rates.filter((r) => (r.category || "regular") === activeCategory);

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case "instant":
        return "bg-[#fe6f05]/20 text-[#fe6f05] border-[#fe6f05]/40 font-semibold";
      case "express":
        return "bg-amber-500/15 text-amber-300 border-amber-500/40";
      case "economy":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
      case "cargo":
        return "bg-purple-500/15 text-purple-300 border-purple-500/40";
      case "regular":
      default:
        return "bg-[#034c85]/40 text-blue-200 border-[#034c85]";
    }
  };

  return (
    <div className="co26-modal-overlay" onClick={onClose}>
      <div
        className="co26-modal-container max-w-xl w-full"
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
        <div className="px-4 py-2.5 bg-[#034c85]/10 border-b border-[#034c85]/30 flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
            <Scale size={16} className="text-[#fe6f05] shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">
                {isIndo ? "Berat Tagihan:" : "Billed Weight:"}
              </span>{" "}
              <strong className="text-[#fe6f05] font-bold">
                {effectiveWeight} kg
              </strong>
              {totalWeightGrams ? (
                <span className="text-slate-400 text-[11px] ml-1">
                  (Fisik: {totalWeightGrams} g)
                </span>
              ) : null}
            </div>

            {/* Tolerance badge */}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${billedWeightInfo.isWithinTolerance
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                }`}
            >
              {isIndo
                ? billedWeightInfo.isWithinTolerance
                  ? "Toleransi: ≤250g (Hemat)"
                  : "Toleransi: >250g (Bulat +1kg)"
                : billedWeightInfo.isWithinTolerance
                  ? "Tolerance: ≤250g applied"
                  : "Excess >250g rounded up"}
            </span>

            {/* Zone badge */}
            {zone && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#034c85]/25 text-blue-200 border border-[#034c85]/40">
                {isIndo ? zone.zoneNameId : zone.zoneName}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 text-right shrink-0">
            {isIndo ? "Tarif mandiri otomatis" : "Auto calculated"}
          </span>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-700/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const count = categoryCounts[cat.key] || 0;
            if (cat.key !== "all" && count === 0) return null;
            const isActive = activeCategory === cat.key;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${isActive
                    ? "bg-[#fe6f05] text-white shadow-sm shadow-[#fe6f05]/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-black/25 text-white" : "bg-slate-700 text-slate-400"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Courier Services List */}
        <div className="co26-modal-body p-4 max-h-[52vh] overflow-y-auto space-y-2.5">
          {filteredRates.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              {isIndo
                ? "Tidak ada layanan pengiriman pada kategori ini."
                : "No shipping services available for this category."}
            </div>
          ) : (
            filteredRates.map((opt) => {
              const key = buildOptionKey(opt);
              const isSelected = key === tempSelectedKey;
              const isCargo = opt.category === "cargo";
              const chargedWeight = Number(opt.chargedWeight || (isCargo ? Math.max(opt.minWeight || 10, effectiveWeight) : effectiveWeight));
              const rateFee = Number(opt.shippingFee || opt.ratePerKg * chargedWeight || 0);
              const isCheapest = cheapestRate && key === buildOptionKey(cheapestRate);
              const isFastest = fastestRate && key === buildOptionKey(fastestRate);

              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setTempSelectedKey(key)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${isSelected
                      ? "bg-[#034c85]/20 border-[#fe6f05] shadow-sm shadow-[#fe6f05]/15"
                      : "bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                >
                  {/* Left side: Radio + Details */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${isSelected
                          ? "border-[#fe6f05] bg-[#fe6f05] text-white"
                          : "border-slate-500 bg-transparent"
                        }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-200 border border-slate-600">
                          {opt.courierName || opt.courierCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getCategoryBadgeClass(
                            opt.category
                          )}`}
                        >
                          {isIndo
                            ? opt.categoryLabel || opt.category
                            : opt.categoryLabelEn || opt.category}
                        </span>
                        {isCheapest && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            💰 {isIndo ? "Termurah" : "Best Value"}
                          </span>
                        )}
                        {isFastest && !isCheapest && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#fe6f05]/20 text-[#fe6f05] border border-[#fe6f05]/40">
                            ⚡ {isIndo ? "Paling Cepat" : "Fastest"}
                          </span>
                        )}
                        <strong className="text-xs sm:text-sm text-slate-100 font-semibold truncate">
                          {opt.serviceName || opt.serviceCode}
                        </strong>
                        {opt.distanceKm ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40">
                            ~{opt.distanceKm} km
                          </span>
                        ) : null}
                        {opt.vehicleType ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {opt.vehicleType === "car" ? (isIndo ? "Mobil" : "Car") : (isIndo ? "Motor" : "Bike")}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                        <span>
                          {isIndo ? "Estimasi:" : "Est:"}{" "}
                          <span className="text-slate-300 font-medium">
                            {isIndo
                              ? opt.estimate || "2 - 3 Hari"
                              : opt.estimateEn || "2 - 3 Business Days"}
                          </span>
                        </span>
                        <span>•</span>
                        {opt.category === "instant" ? (
                          <span className="text-[#fe6f05] font-semibold">
                            {isIndo ? "Tarif Tetap Jarak" : "Fixed Distance Rate"}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {formatMoney(opt.ratePerKg || 10000)} / kg
                          </span>
                        )}
                        {isCargo && opt.minWeight ? (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-medium text-[10px]">
                              {isIndo
                                ? `Min. ${opt.minWeight} kg`
                                : `Min. ${opt.minWeight} kg`}
                            </span>
                          </>
                        ) : null}
                      </div>

                      {opt.maintenanceNotice && (
                        <div className="mt-1.5 text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1.5">
                          <span className="shrink-0 text-amber-400 font-bold">⚠️</span>
                          <span className="leading-tight">{opt.maintenanceNotice}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: Calculated Shipping Fee */}
                  <div className="text-right shrink-0">
                    <strong className="text-sm sm:text-base font-bold text-[#fe6f05] block">
                      {formatMoney(rateFee)}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">
                      {opt.category === "instant"
                        ? opt.distanceKm ? `Jarak ~${opt.distanceKm} km` : (isIndo ? "Instan" : "Instant")
                        : `(${chargedWeight} kg${isCargo && effectiveWeight < opt.minWeight ? " min" : ""})`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-700/60 flex items-center justify-between gap-2.5 bg-slate-900/70 rounded-b-2xl">
          <span className="text-xs text-slate-400 hidden sm:inline">
            {isIndo
              ? `${filteredRates.length} opsi tersedia`
              : `${filteredRates.length} options available`}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
    </div>
  );
}
