/**
 * Standalone Shipping Engine (Client-side helper)
 * Matches server/src/services/standaloneShippingEngine.ts exactly
 */

export const calculateBilledWeight = (physicalGrams = 0, volumetricKg = 0) => {
  const physicalWeightKg = Math.max(0, Number(physicalGrams || 0) / 1000);
  const safeVolumetricKg = Math.max(0, Number(volumetricKg || 0));
  const rawWeightKg = Math.max(physicalWeightKg, safeVolumetricKg);

  if (rawWeightKg <= 0) {
    return {
      physicalWeightKg: 0,
      volumetricWeightKg: 0,
      rawWeightKg: 0,
      billedWeightKg: 1,
      isRoundedUp: false,
      fraction: 0,
    };
  }

  if (rawWeightKg <= 1.0) {
    return {
      physicalWeightKg,
      volumetricWeightKg: safeVolumetricKg,
      rawWeightKg,
      billedWeightKg: 1,
      isRoundedUp: rawWeightKg < 1.0,
      fraction: rawWeightKg,
    };
  }

  const integerPart = Math.floor(rawWeightKg);
  const fraction = Math.round((rawWeightKg - integerPart) * 1000) / 1000;

  let billedWeightKg;
  let isRoundedUp;

  if (fraction <= 0.25) {
    billedWeightKg = Math.max(1, integerPart);
    isRoundedUp = false;
  } else {
    billedWeightKg = Math.max(1, integerPart + 1);
    isRoundedUp = true;
  }

  return {
    physicalWeightKg,
    volumetricWeightKg: safeVolumetricKg,
    rawWeightKg,
    billedWeightKg,
    isRoundedUp,
    fraction,
  };
};

export const normalizeLocationName = (value) => {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\b(kota|kabupaten|kab\.|kab|adm\.|daerah|provinsi|prov\.)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

export const determineShippingZone = (origin, destination) => {
  const DEFAULT_ORIGIN_CITY = "makassar";
  const DEFAULT_ORIGIN_PROVINCE = "sulawesiselatan";

  const origCity = normalizeLocationName(origin?.city) || DEFAULT_ORIGIN_CITY;
  const origProv = normalizeLocationName(origin?.province) || DEFAULT_ORIGIN_PROVINCE;

  const destCity = normalizeLocationName(destination?.city);
  const destProv = normalizeLocationName(destination?.province);

  if (!destCity && !destProv) {
    return {
      zone: "ZONA_1",
      zoneLabel: "Intra-Kota (Lokal)",
      zoneLabelEn: "Intra-City (Local)",
      multiplier: 1.0,
      cargoMultiplier: 1.0,
    };
  }

  const isMakassarMetro =
    (origCity.includes("makassar") || origCity.includes("gowa")) &&
    (destCity.includes("makassar") || destCity.includes("gowa"));

  if (destCity && (origCity === destCity || isMakassarMetro)) {
    return {
      zone: "ZONA_1",
      zoneLabel: "Intra-Kota (Lokal)",
      zoneLabelEn: "Intra-City (Local)",
      multiplier: 1.0,
      cargoMultiplier: 1.0,
    };
  }

  if (destProv && (origProv === destProv || origProv.includes(destProv) || destProv.includes(origProv))) {
    return {
      zone: "ZONA_2",
      zoneLabel: "Intra-Pulau (Regional)",
      zoneLabelEn: "Intra-Island (Regional)",
      multiplier: 1.4,
      cargoMultiplier: 1.3,
    };
  }

  return {
    zone: "ZONA_3",
    zoneLabel: "Antar-Pulau (Nasional)",
    zoneLabelEn: "Inter-Island (National)",
    multiplier: 2.2,
    cargoMultiplier: 2.0,
  };
};

export const buildOfficialCourierTrackingUrl = (courier, trackingNumber) => {
  if (!trackingNumber || typeof trackingNumber !== "string") return null;
  const cleanAwb = trackingNumber.trim();
  if (!cleanAwb) return null;

  if (cleanAwb.startsWith("http://") || cleanAwb.startsWith("https://")) {
    return cleanAwb;
  }

  // Reject placeholder messages
  if (
    cleanAwb.includes(" ") ||
    cleanAwb.length < 5 ||
    /menunggu|pending|assigned|belum/i.test(cleanAwb)
  ) {
    return null;
  }

  const c = String(courier || "").toLowerCase();

  if (c.includes("jne")) {
    return `https://www.jne.co.id/tracking?resi=${encodeURIComponent(cleanAwb)}`;
  }
  if (c.includes("j&t") || c.includes("jet") || c.includes("jnt")) {
    return `https://www.jet.co.id/track?awb=${encodeURIComponent(cleanAwb)}`;
  }
  if (c.includes("sicepat") || c.includes("si cepat")) {
    return `https://www.sicepat.com/checkAwb?awb=${encodeURIComponent(cleanAwb)}`;
  }
  if (c.includes("pos") || c.includes("indonesia")) {
    return `https://www.posindonesia.co.id/id/tracking?resi=${encodeURIComponent(cleanAwb)}`;
  }
  if (c.includes("lion")) {
    return `https://lionparcel.com/track?q=${encodeURIComponent(cleanAwb)}`;
  }
  if (c.includes("sapx") || c.includes("sap")) {
    return `https://www.sapx.id/id/tracking?awb=${encodeURIComponent(cleanAwb)}`;
  }
  if (c.includes("anteraja") || c.includes("anter")) {
    return `https://anteraja.id/tracking?waybill=${encodeURIComponent(cleanAwb)}`;
  }

  return null;
};

export const BASE_SHIPPING_TARIFFS = [
  // 1. JNE Express
  {
    courierCode: "JNE",
    courierName: "JNE Express",
    serviceCode: "REG",
    serviceName: "Reguler (REG)",
    category: "regular",
    categoryLabel: "Reguler",
    categoryLabelEn: "Regular",
    baseRatePerKg: 10000,
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
    baseRatePerKg: 18000,
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
    baseRatePerKg: 8000,
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
    baseRatePerKg: 3500,
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
    serviceName: "J&T EZ (Reguler)",
    category: "regular",
    categoryLabel: "Reguler",
    categoryLabelEn: "Regular",
    baseRatePerKg: 10000,
    minWeight: 1,
    minFee: 10000,
    estimate: "2 - 3 Hari",
    estimateEn: "2 - 3 Business Days",
  },
  {
    courierCode: "JNT",
    courierName: "J&T Express",
    serviceCode: "Super",
    serviceName: "J&T Super (Ekspres)",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    baseRatePerKg: 18000,
    minWeight: 1,
    minFee: 18000,
    estimate: "1 - 2 Hari",
    estimateEn: "1 - 2 Business Days",
  },
  {
    courierCode: "JNT",
    courierName: "J&T Express",
    serviceCode: "ECO",
    serviceName: "J&T ECO (Ekonomi)",
    category: "economy",
    categoryLabel: "Ekonomi",
    categoryLabelEn: "Economy",
    baseRatePerKg: 7000,
    minWeight: 1,
    minFee: 7000,
    estimate: "3 - 7 Hari",
    estimateEn: "3 - 7 Business Days",
  },
  {
    courierCode: "JNT",
    courierName: "J&T Express",
    serviceCode: "Cargo",
    serviceName: "J&T Cargo",
    category: "cargo",
    categoryLabel: "Kargo",
    categoryLabelEn: "Cargo",
    baseRatePerKg: 3000,
    minWeight: 10,
    minFee: 30000,
    estimate: "3 - 7 Hari",
    estimateEn: "3 - 7 Business Days",
  },

  // 3. SiCepat Express
  {
    courierCode: "SICEPAT",
    courierName: "SiCepat Express",
    serviceCode: "REG",
    serviceName: "SiCepat Reguler",
    category: "regular",
    categoryLabel: "Reguler",
    categoryLabelEn: "Regular",
    baseRatePerKg: 9500,
    minWeight: 1,
    minFee: 9500,
    estimate: "1 - 3 Hari",
    estimateEn: "1 - 3 Business Days",
  },
  {
    courierCode: "SICEPAT",
    courierName: "SiCepat Express",
    serviceCode: "BEST",
    serviceName: "Besok Sampai Tujuan (BEST)",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    baseRatePerKg: 18000,
    minWeight: 1,
    minFee: 18000,
    estimate: "1 Hari",
    estimateEn: "1 Business Day",
  },
  {
    courierCode: "SICEPAT",
    courierName: "SiCepat Express",
    serviceCode: "HALU",
    serviceName: "Harga Mulai Lima Ribu (HALU)",
    category: "economy",
    categoryLabel: "Ekonomi",
    categoryLabelEn: "Economy",
    baseRatePerKg: 7000,
    minWeight: 1,
    minFee: 7000,
    estimate: "2 - 5 Hari",
    estimateEn: "2 - 5 Business Days",
  },
  {
    courierCode: "SICEPAT",
    courierName: "SiCepat Express",
    serviceCode: "GOKIL",
    serviceName: "Cargo Kilat (GOKIL)",
    category: "cargo",
    categoryLabel: "Kargo",
    categoryLabelEn: "Cargo",
    baseRatePerKg: 3000,
    minWeight: 10,
    minFee: 30000,
    estimate: "2 - 5 Hari",
    estimateEn: "2 - 5 Business Days",
  },

  // 4. Pos Indonesia
  {
    courierCode: "POS",
    courierName: "Pos Indonesia",
    serviceCode: "Reguler",
    serviceName: "Pos Reguler",
    category: "regular",
    categoryLabel: "Reguler",
    categoryLabelEn: "Regular",
    baseRatePerKg: 9000,
    minWeight: 1,
    minFee: 9000,
    estimate: "2 - 4 Hari",
    estimateEn: "2 - 4 Business Days",
  },
  {
    courierCode: "POS",
    courierName: "Pos Indonesia",
    serviceCode: "Nextday",
    serviceName: "Pos Nextday",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    baseRatePerKg: 17000,
    minWeight: 1,
    minFee: 17000,
    estimate: "1 Hari",
    estimateEn: "1 Business Day",
  },
  {
    courierCode: "POS",
    courierName: "Pos Indonesia",
    serviceCode: "Jumbo",
    serviceName: "Pos Jumbo Kargo",
    category: "cargo",
    categoryLabel: "Kargo",
    categoryLabelEn: "Cargo",
    baseRatePerKg: 3500,
    minWeight: 5,
    minFee: 17500,
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
    baseRatePerKg: 9500,
    minWeight: 1,
    minFee: 9500,
    estimate: "2 - 4 Hari",
    estimateEn: "2 - 4 Business Days",
  },
  {
    courierCode: "LION",
    courierName: "Lion Parcel",
    serviceCode: "ONEPACK",
    serviceName: "ONEPACK (Overnight)",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    baseRatePerKg: 18000,
    minWeight: 1,
    minFee: 18000,
    estimate: "1 Hari",
    estimateEn: "1 Business Day",
  },
  {
    courierCode: "LION",
    courierName: "Lion Parcel",
    serviceCode: "JAGOPACK",
    serviceName: "JAGOPACK (Ekonomi)",
    category: "economy",
    categoryLabel: "Ekonomi",
    categoryLabelEn: "Economy",
    baseRatePerKg: 7000,
    minWeight: 1,
    minFee: 7000,
    estimate: "2 - 7 Hari",
    estimateEn: "2 - 7 Business Days",
  },
  {
    courierCode: "LION",
    courierName: "Lion Parcel",
    serviceCode: "BIGPACK",
    serviceName: "BIGPACK (Kargo)",
    category: "cargo",
    categoryLabel: "Kargo",
    categoryLabelEn: "Cargo",
    baseRatePerKg: 3500,
    minWeight: 10,
    minFee: 35000,
    estimate: "3 - 6 Hari",
    estimateEn: "3 - 6 Business Days",
  },

  // 6. SAPX Express
  {
    courierCode: "SAPX",
    courierName: "SAPX Express",
    serviceCode: "REG",
    serviceName: "Satria REG (Reguler)",
    category: "regular",
    categoryLabel: "Reguler",
    categoryLabelEn: "Regular",
    baseRatePerKg: 9500,
    minWeight: 1,
    minFee: 9500,
    estimate: "2 - 4 Hari",
    estimateEn: "2 - 4 Business Days",
  },
  {
    courierCode: "SAPX",
    courierName: "SAPX Express",
    serviceCode: "ODS",
    serviceName: "Satria ODS (One Day Service)",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    baseRatePerKg: 17500,
    minWeight: 1,
    minFee: 17500,
    estimate: "1 Hari",
    estimateEn: "1 Business Day",
  },
  {
    courierCode: "SAPX",
    courierName: "SAPX Express",
    serviceCode: "Cargo",
    serviceName: "Satria Cargo",
    category: "cargo",
    categoryLabel: "Kargo",
    categoryLabelEn: "Cargo",
    baseRatePerKg: 3500,
    minWeight: 10,
    minFee: 35000,
    estimate: "3 - 7 Hari",
    estimateEn: "3 - 7 Business Days",
  },

  // 7. Anteraja
  {
    courierCode: "ANTERAJA",
    courierName: "Anteraja",
    serviceCode: "REG",
    serviceName: "Anteraja Reguler",
    category: "regular",
    categoryLabel: "Reguler",
    categoryLabelEn: "Regular",
    baseRatePerKg: 10000,
    minWeight: 1,
    minFee: 10000,
    estimate: "1 - 3 Hari",
    estimateEn: "1 - 3 Business Days",
  },
  {
    courierCode: "ANTERAJA",
    courierName: "Anteraja",
    serviceCode: "NextDay",
    serviceName: "Anteraja Next Day",
    category: "express",
    categoryLabel: "Kilat",
    categoryLabelEn: "Express",
    baseRatePerKg: 18000,
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
    baseRatePerKg: 3500,
    minWeight: 10,
    minFee: 35000,
    estimate: "3 - 6 Hari",
    estimateEn: "3 - 6 Business Days",
  },
];

export const calculateStandaloneShippingRates = (params = {}) => {
  const {
    origin,
    destination,
    totalWeightGrams = 1000,
    billedWeightKg: directBilledWeight,
    isDigital = false,
  } = params;

  if (isDigital) {
    return [
      {
        courierCode: "DIGITAL",
        courierName: "Pengiriman Digital",
        serviceCode: "INSTANT",
        serviceName: "Akses Instan Otomatis",
        category: "regular",
        categoryLabel: "Instan",
        categoryLabelEn: "Instant",
        shippingFee: 0,
        ratePerKg: 0,
        weightKg: 0,
        chargedWeight: 0,
        minWeight: 0,
        estimate: "Langsung Aktif",
        estimateEn: "Instant Access",
        zone: "ZONA_1",
      },
    ];
  }

  const zoneInfo = determineShippingZone(origin, destination);
  const zone = zoneInfo.zone || "ZONA_1";
  const zoneMultiplier = zoneInfo.multiplier || 1.0;
  const cargoMultiplier = zoneInfo.cargoMultiplier || 1.0;

  const billedWeightInfo = directBilledWeight
    ? { billedWeightKg: directBilledWeight }
    : calculateBilledWeight(totalWeightGrams, 0);

  const effectiveWeight = Math.max(1, Math.ceil(billedWeightInfo.billedWeightKg || 1));

  return BASE_SHIPPING_TARIFFS.map((t) => {
    const isCargo = t.category === "cargo";
    const multiplier = isCargo ? cargoMultiplier : zoneMultiplier;
    const adjustedRatePerKg = Math.round((t.baseRatePerKg * multiplier) / 500) * 500;
    const minWeight = t.minWeight || (isCargo ? 10 : 1);
    const chargedWeight = Math.max(minWeight, effectiveWeight);
    const calculatedFee = adjustedRatePerKg * chargedWeight;
    const minFee = Math.round((t.minFee * multiplier) / 500) * 500;
    const shippingFee = Math.max(minFee, calculatedFee);

    return {
      courierCode: t.courierCode,
      courierName: t.courierName,
      serviceCode: t.serviceCode,
      serviceName: t.serviceName,
      category: t.category,
      categoryLabel: t.categoryLabel,
      categoryLabelEn: t.categoryLabelEn,
      shippingFee,
      ratePerKg: adjustedRatePerKg,
      weightKg: effectiveWeight,
      chargedWeight,
      minWeight,
      estimate: t.estimate,
      estimateEn: t.estimateEn,
      zone,
    };
  });
};
