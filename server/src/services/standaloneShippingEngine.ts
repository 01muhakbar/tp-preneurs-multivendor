/**
 * Standalone Shipping Engine for TP Preneurs
 * Zero Third-Party Cost - Fully Offline & Autonomous Shipping Calculation
 */

export type ShippingCategory = "economy" | "regular" | "express" | "cargo" | "instant";
export type ShippingZoneCode = "ZONA_1" | "ZONA_2" | "ZONA_3";

export interface ShippingZoneInfo {
  zone: ShippingZoneCode;
  zoneLabel: string;
  zoneLabelEn: string;
  multiplier: number;
  cargoMultiplier: number;
}

export interface BilledWeightCalculation {
  physicalWeightKg: number;
  volumetricWeightKg: number;
  rawWeightKg: number;
  billedWeightKg: number;
  isRoundedUp: boolean;
  fraction: number;
}

export interface StandaloneCourierRate {
  courierCode: string;
  courierName: string;
  serviceCode: string;
  serviceName: string;
  category: ShippingCategory;
  categoryLabel: string;
  categoryLabelEn: string;
  shippingFee: number;
  ratePerKg: number;
  weightKg: number;
  chargedWeight: number;
  minWeight: number;
  estimate: string;
  estimateEn: string;
  zone: ShippingZoneCode;
  distanceKm?: number;
  vehicleType?: "motorcycle" | "car" | null;
}

/**
 * Normalizes location strings (city, province, district) for robust matching
 */
export const normalizeLocationName = (value: unknown): string => {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\b(kota|kabupaten|kab\.|kab|adm\.|daerah|provinsi|prov\.)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

/**
 * Calculates physical vs volumetric weight and applies the 250g tolerance rounding rule
 */
export const calculateBilledWeight = (
  physicalGrams = 0,
  volumetricKg = 0
): BilledWeightCalculation => {
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

  // Tolerance 250 grams (0.25 kg)
  // If excess gram <= 0.25 kg -> round down to integerPart
  // If excess gram > 0.25 kg -> round up to integerPart + 1
  let billedWeightKg: number;
  let isRoundedUp: boolean;

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

/**
 * Calculates volumetric weight in kg from dimensions (cm)
 */
export const calculateVolumetricWeight = (
  lengthCm = 0,
  widthCm = 0,
  heightCm = 0,
  isCargo = false
): number => {
  const l = Math.max(0, Number(lengthCm || 0));
  const w = Math.max(0, Number(widthCm || 0));
  const h = Math.max(0, Number(heightCm || 0));
  if (l <= 0 || w <= 0 || h <= 0) return 0;
  // Standard divider is 6000; cargo services often use 5000
  const divider = isCargo ? 5000 : 6000;
  return (l * w * h) / divider;
};

/**
 * Determines shipping zone by comparing store origin vs customer destination
 */
export const determineShippingZone = (
  origin?: { city?: string | null; province?: string | null },
  destination?: { city?: string | null; province?: string | null }
): ShippingZoneInfo => {
  const DEFAULT_ORIGIN_CITY = "makassar";
  const DEFAULT_ORIGIN_PROVINCE = "sulawesiselatan";

  const origCity = normalizeLocationName(origin?.city) || DEFAULT_ORIGIN_CITY;
  const origProv = normalizeLocationName(origin?.province) || DEFAULT_ORIGIN_PROVINCE;

  const destCity = normalizeLocationName(destination?.city);
  const destProv = normalizeLocationName(destination?.province);

  // If destination is not set yet, assume local intra-city default
  if (!destCity && !destProv) {
    return {
      zone: "ZONA_1",
      zoneLabel: "Intra-Kota (Lokal)",
      zoneLabelEn: "Intra-City (Local)",
      multiplier: 1.0,
      cargoMultiplier: 1.0,
    };
  }

  // Contiguous / Metro agglomeration: Makassar & Gowa
  const isMakassarMetro =
    (origCity.includes("makassar") || origCity.includes("gowa")) &&
    (destCity.includes("makassar") || destCity.includes("gowa"));

  // Zona 1: Intra-Kota (Same city / metro)
  if (destCity && (origCity === destCity || isMakassarMetro)) {
    return {
      zone: "ZONA_1",
      zoneLabel: "Intra-Kota (Lokal)",
      zoneLabelEn: "Intra-City (Local)",
      multiplier: 1.0,
      cargoMultiplier: 1.0,
    };
  }

  // Zona 2: Intra-Pulau (Same province, different city)
  if (destProv && (origProv === destProv || origProv.includes(destProv) || destProv.includes(origProv))) {
    return {
      zone: "ZONA_2",
      zoneLabel: "Intra-Pulau (Regional)",
      zoneLabelEn: "Intra-Island (Regional)",
      multiplier: 1.4,
      cargoMultiplier: 1.3,
    };
  }

  // Zona 3: Antar-Pulau (Different province / Inter-island)
  return {
    zone: "ZONA_3",
    zoneLabel: "Antar-Pulau (Nasional)",
    zoneLabelEn: "Inter-Island (National)",
    multiplier: 2.2,
    cargoMultiplier: 2.0,
  };
};

/**
 * Base tariff matrix for 6 leading couriers across 4 service tiers
 */
interface BaseTariffDefinition {
  courierCode: string;
  courierName: string;
  serviceCode: string;
  serviceName: string;
  category: ShippingCategory;
  categoryLabel: string;
  categoryLabelEn: string;
  baseRatePerKg: number;
  minWeight: number;
  minFee: number;
  estimate: string;
  estimateEn: string;
}

export const BASE_SHIPPING_TARIFFS: BaseTariffDefinition[] = [
  // 1. JNE Express
  {
    courierCode: "JNE",
    courierName: "JNE Express",
    serviceCode: "REG",
    serviceName: "REG (Reguler)",
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
    serviceName: "YES (Yakin Esok Sampai)",
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
    serviceName: "OKE (Ongkos Kirim Ekonomis)",
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
    serviceName: "JTR (JNE Trucking Kargo)",
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
    serviceName: "EZ (Reguler)",
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
    serviceCode: "SUPER",
    serviceName: "J&T Super (Kilat)",
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
    serviceName: "J&T ECO (Ekonomis)",
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
    serviceCode: "CARGO",
    serviceName: "J&T Cargo (Layanan Kargo)",
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
    serviceName: "REG (Reguler)",
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
    serviceName: "BEST (Besok Sampai Tujuan)",
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
    courierCode: "SICEPAT",
    courierName: "SiCepat Express",
    serviceCode: "HALU",
    serviceName: "HALU (Harga Mulai Lima Ribu)",
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
    serviceName: "GOKIL (Cargo Kilat)",
    category: "cargo",
    categoryLabel: "Kargo",
    categoryLabelEn: "Cargo",
    baseRatePerKg: 3500,
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
    baseRatePerKg: 9000,
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
    baseRatePerKg: 16000,
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
    baseRatePerKg: 20000,
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
    baseRatePerKg: 4000,
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
    serviceName: "ONEPACK (Kilat Esok)",
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
    courierCode: "LION",
    courierName: "Lion Parcel",
    serviceCode: "JAGOPACK",
    serviceName: "JAGOPACK (Ekonomis)",
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
    serviceName: "BIGPACK (Kargo Besar)",
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
    serviceCode: "Satria REG",
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
    serviceCode: "Satria ODS",
    serviceName: "Satria ODS (One Day Service)",
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
    courierCode: "SAPX",
    courierName: "SAPX Express",
    serviceCode: "Satria Cargo",
    serviceName: "Satria Cargo (Layanan Kargo)",
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
    serviceCode: "Regular",
    serviceName: "Anteraja Regular",
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
    courierCode: "ANTERAJA",
    courierName: "Anteraja",
    serviceCode: "Next Day",
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

/**
 * Centroid coordinates for South Sulawesi / Mamminasata districts (Offline Zero-Cost Geolocation)
 */
export const SULSEL_DISTRICT_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  // Gowa (including Kreasi Singkong store location)
  "somba opu": { lat: -5.2023, lng: 119.4561 },
  "pallangga": { lat: -5.2285, lng: 119.4472 },
  "barombong": { lat: -5.2150, lng: 119.4050 },
  "bontomarannu": { lat: -5.2100, lng: 119.5100 },
  "pattallassang (gowa)": { lat: -5.1950, lng: 119.5400 },
  "pattallassang": { lat: -5.1950, lng: 119.5400 },
  "bajeng": { lat: -5.2850, lng: 119.4450 },
  "parangloe": { lat: -5.2400, lng: 119.6800 },
  "tinggimoncong": { lat: -5.2700, lng: 119.8600 },
  "malino": { lat: -5.2550, lng: 119.8550 },

  // Makassar
  "tamalate": { lat: -5.1831, lng: 119.4150 },
  "rappocini": { lat: -5.1624, lng: 119.4362 },
  "panakkukang": { lat: -5.1486, lng: 119.4431 },
  "manggala": { lat: -5.1680, lng: 119.4880 },
  "mariso": { lat: -5.1550, lng: 119.4090 },
  "mamajang": { lat: -5.1561, lng: 119.4215 },
  "ujung pandang": { lat: -5.1345, lng: 119.4078 },
  "makassar": { lat: -5.1380, lng: 119.4200 },
  "wajo": { lat: -5.1250, lng: 119.4110 },
  "bontoala": { lat: -5.1280, lng: 119.4230 },
  "tallo": { lat: -5.1180, lng: 119.4380 },
  "ujung tanah": { lat: -5.1120, lng: 119.4180 },
  "tamalanrea": { lat: -5.1325, lng: 119.4932 },
  "biringkanaya": { lat: -5.1054, lng: 119.5167 },
  "daya": { lat: -5.1100, lng: 119.5100 },
  "sudiang": { lat: -5.0850, lng: 119.5250 },

  // Maros
  "turikale": { lat: -5.0058, lng: 119.5750 },
  "mandai": { lat: -5.0682, lng: 119.5350 },
  "moncongloe": { lat: -5.1420, lng: 119.5520 },
  "maros baru": { lat: -4.9850, lng: 119.5420 },
  "marusu": { lat: -5.0750, lng: 119.4850 },
  "tanralili": { lat: -5.0700, lng: 119.6100 },
  "bantimurung": { lat: -4.9900, lng: 119.6600 },
  "lau": { lat: -4.9600, lng: 119.5500 },
  "bontoa": { lat: -4.9100, lng: 119.5300 },

  // Takalar
  "pattallassang (takalar)": { lat: -5.4180, lng: 119.4420 },
  "polombangkeng": { lat: -5.3700, lng: 119.4700 },
  "galesong": { lat: -5.3100, lng: 119.3650 },
  "galesong utara": { lat: -5.2500, lng: 119.3800 },
  "galesong selatan": { lat: -5.3600, lng: 119.3500 },
  "sanrobone": { lat: -5.4400, lng: 119.3800 },

  // Other Sulsel Regencies
  "parepare": { lat: -4.0130, lng: 119.6250 },
  "palopo": { lat: -3.0050, lng: 120.1980 },
  "bone": { lat: -4.5450, lng: 120.3250 },
  "watampone": { lat: -4.5420, lng: 120.3280 },
  "sidrap": { lat: -3.9250, lng: 119.8800 },
  "pangkajene": { lat: -4.8350, lng: 119.5450 },
  "barru": { lat: -4.4100, lng: 119.6150 },
  "bulukumba": { lat: -5.5550, lng: 120.1900 },
  "bantaeng": { lat: -5.5450, lng: 119.9500 },
  "jeneponto": { lat: -5.6950, lng: 119.7250 },
  "sinjai": { lat: -5.1300, lng: 120.2500 },
  "soppeng": { lat: -4.3500, lng: 119.8850 },
  "sengkang": { lat: -4.1250, lng: 120.0320 },
  "pinrang": { lat: -3.7850, lng: 119.6500 },
  "enrekang": { lat: -3.5650, lng: 119.7750 },
  "makale": { lat: -3.1050, lng: 119.8620 },
  "rantepao": { lat: -2.9700, lng: 119.8980 },
  "belopa": { lat: -3.3300, lng: 120.3200 },
  "masamba": { lat: -2.5650, lng: 120.3250 },
  "malili": { lat: -2.5800, lng: 121.0950 },
  "benteng": { lat: -6.1200, lng: 120.4600 },
};

/**
 * Calculates road distance in km between two coordinate points using Haversine formula + circuity factor
 */
export const calculateHaversineRoadDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  circuityFactor = 1.30
): number => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  // Identical centroids mean same district (intra-kecamatan).
  // Return minimum intra-district delivery distance (2.5 km, bracket 0-5 km)
  if (lat1 === lat2 && lon1 === lon2) return 2.5;

  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const airDistance = R * c;

  const roadDistance = Math.max(1.5, airDistance * circuityFactor);
  return Math.round(roadDistance * 10) / 10;
};

/**
 * Resolves coordinate lat/lng from location object (explicit GPS or centroid dictionary)
 */
export const resolveCoordinates = (
  loc?: {
    city?: string | null;
    province?: string | null;
    district?: string | null;
    lat?: number | null;
    lng?: number | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null
): { lat: number; lng: number } | null => {
  if (!loc) return null;

  const directLat = Number(loc.lat ?? loc.latitude);
  const directLng = Number(loc.lng ?? loc.longitude);
  if (Number.isFinite(directLat) && Number.isFinite(directLng) && (directLat !== 0 || directLng !== 0)) {
    return { lat: directLat, lng: directLng };
  }

  const rawDistrict = normalizeLocationName(loc.district);
  if (rawDistrict) {
    for (const [key, coords] of Object.entries(SULSEL_DISTRICT_CENTROIDS)) {
      const cleanKey = normalizeLocationName(key);
      if (rawDistrict === cleanKey || rawDistrict.includes(cleanKey) || cleanKey.includes(rawDistrict)) {
        return coords;
      }
    }
  }

  const rawCity = normalizeLocationName(loc.city);
  if (rawCity) {
    if (rawCity.includes("gowa")) return SULSEL_DISTRICT_CENTROIDS["somba opu"];
    if (rawCity.includes("makassar")) return SULSEL_DISTRICT_CENTROIDS["panakkukang"];
    if (rawCity.includes("maros")) return SULSEL_DISTRICT_CENTROIDS["turikale"];
    if (rawCity.includes("takalar")) return SULSEL_DISTRICT_CENTROIDS["pattallassang (takalar)"];
    for (const [key, coords] of Object.entries(SULSEL_DISTRICT_CENTROIDS)) {
      const cleanKey = normalizeLocationName(key);
      if (rawCity === cleanKey || rawCity.includes(cleanKey) || cleanKey.includes(rawCity)) {
        return coords;
      }
    }
  }

  return null;
};

/**
 * Calculates Instant / Same Day shipping rates (GrabExpress) for local distance (Zone III Sulsel)
 */
export const getInstantShippingRates = (params: {
  distanceKm: number;
  weightKg: number;
  zone?: ShippingZoneCode;
  maxDimensions?: { length?: number | null; width?: number | null; height?: number | null } | null;
}): StandaloneCourierRate[] => {
  const { distanceKm, weightKg, zone = "ZONA_1", maxDimensions } = params;
  if (!distanceKm || distanceKm <= 0 || distanceKm > 40) return [];

  const rates: StandaloneCourierRate[] = [];
  const maxDim = Math.max(
    Number(maxDimensions?.length) || 0,
    Number(maxDimensions?.width) || 0,
    Number(maxDimensions?.height) || 0
  );

  // 1. GrabExpress Same Day (Syarat: Berat <= 7 kg, Dimensi <= 40x40x20 cm, Jarak <= 40 km)
  if (weightKg <= 7 && (maxDim === 0 || maxDim <= 40)) {
    let fee = 15000;
    if (distanceKm > 5 && distanceKm <= 10) fee = 18000;
    else if (distanceKm > 10 && distanceKm <= 15) fee = 20000;
    else if (distanceKm > 15 && distanceKm <= 25) fee = 23000;
    else if (distanceKm > 25 && distanceKm <= 40) fee = 38000;

    rates.push({
      courierCode: "GRAB",
      courierName: "GrabExpress",
      serviceCode: "SAMEDAY",
      serviceName: "GrabExpress Same Day",
      category: "instant",
      categoryLabel: "Same Day",
      categoryLabelEn: "Same Day",
      shippingFee: fee,
      ratePerKg: 0,
      weightKg,
      chargedWeight: weightKg,
      minWeight: 0.1,
      estimate: "Tiba Hari Ini (6 - 8 Jam)",
      estimateEn: "Today (6 - 8 Hours)",
      zone,
      distanceKm,
      vehicleType: "motorcycle",
    });
  }

  // 2. GrabExpress Instant Bike (Syarat: Berat <= 15 kg, Dimensi <= 50x50x50 cm, Jarak <= 35 km)
  if (weightKg <= 15 && (maxDim === 0 || maxDim <= 50) && distanceKm <= 35) {
    let fee = 14000;
    if (distanceKm > 5 && distanceKm <= 10) fee = 22000;
    else if (distanceKm > 10 && distanceKm <= 15) fee = 32000;
    else if (distanceKm > 15 && distanceKm <= 25) fee = 50000;
    else if (distanceKm > 25 && distanceKm <= 35) fee = 80000;

    rates.push({
      courierCode: "GRAB",
      courierName: "GrabExpress",
      serviceCode: "INSTANT_BIKE",
      serviceName: "GrabExpress Instant (Motor)",
      category: "instant",
      categoryLabel: "Instan",
      categoryLabelEn: "Instant",
      shippingFee: fee,
      ratePerKg: 0,
      weightKg,
      chargedWeight: weightKg,
      minWeight: 0.1,
      estimate: "1 - 2 Jam (Cepat Sampai)",
      estimateEn: "1 - 2 Hours",
      zone,
      distanceKm,
      vehicleType: "motorcycle",
    });
  }

  // 3. GrabExpress Instant Car (Syarat: Berat 15.1 - 150 kg ATAU muatan besar / jarak <= 40 km)
  if (weightKg > 15 || maxDim > 50 || distanceKm <= 40) {
    let fee = 40000;
    if (distanceKm > 5 && distanceKm <= 10) fee = 55000;
    else if (distanceKm > 10 && distanceKm <= 15) fee = 70000;
    else if (distanceKm > 15 && distanceKm <= 25) fee = 95000;
    else if (distanceKm > 25 && distanceKm <= 40) fee = 140000;

    rates.push({
      courierCode: "GRAB",
      courierName: "GrabExpress",
      serviceCode: "INSTANT_CAR",
      serviceName: "GrabExpress Instant (Mobil)",
      category: "instant",
      categoryLabel: "Instan Mobil",
      categoryLabelEn: "Instant Car",
      shippingFee: fee,
      ratePerKg: 0,
      weightKg,
      chargedWeight: weightKg,
      minWeight: 15.1,
      estimate: "1 - 3 Jam (Muatan Besar)",
      estimateEn: "1 - 3 Hours (Cargo)",
      zone,
      distanceKm,
      vehicleType: "car",
    });
  }

  return rates;
};

export interface CalculateShippingRatesParams {
  billedWeightKg: number;
  zone?: ShippingZoneCode;
  zoneMultiplier?: number;
  cargoMultiplier?: number;
  isDigital?: boolean;
  distanceKm?: number | null;
  origin?: {
    city?: string | null;
    province?: string | null;
    district?: string | null;
    lat?: number | null;
    lng?: number | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  destination?: {
    city?: string | null;
    province?: string | null;
    district?: string | null;
    lat?: number | null;
    lng?: number | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  maxDimensions?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  } | null;
}

/**
 * Calculates standalone shipping rates based on billed weight, zone, and product type
 */
export const calculateStandaloneShippingRates = (
  params: CalculateShippingRatesParams
): StandaloneCourierRate[] => {
  const {
    billedWeightKg,
    zone = "ZONA_1",
    zoneMultiplier = 1.0,
    cargoMultiplier = 1.0,
    isDigital = false,
    origin,
    destination,
    maxDimensions,
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

  const effectiveWeight = Math.max(1, Math.ceil(billedWeightKg));

  // 1. Calculate distance via Haversine if coordinates or districts are available
  let resolvedDistanceKm = Number(params.distanceKm) || 0;
  if (!resolvedDistanceKm && origin && destination) {
    const originCoords = resolveCoordinates(origin);
    const destCoords = resolveCoordinates(destination);
    if (originCoords && destCoords) {
      resolvedDistanceKm = calculateHaversineRoadDistance(
        originCoords.lat,
        originCoords.lng,
        destCoords.lat,
        destCoords.lng
      );
    }
  }

  // 2. Generate GrabExpress Instant / Same Day rates if within 40 km
  const instantRates: StandaloneCourierRate[] =
    resolvedDistanceKm > 0 && resolvedDistanceKm <= 40
      ? getInstantShippingRates({
          distanceKm: resolvedDistanceKm,
          weightKg: effectiveWeight,
          zone,
          maxDimensions,
        })
      : [];

  // 3. Generate standard expedition rates (JNE, J&T, SiCepat, Pos, Lion, SAPX, Anteraja)
  const regularRates: StandaloneCourierRate[] = BASE_SHIPPING_TARIFFS.map((t) => {
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
      distanceKm: resolvedDistanceKm > 0 ? resolvedDistanceKm : undefined,
    };
  });

  return [...instantRates, ...regularRates];
};

/**
 * Builds direct 1-click official courier tracking URL for an AWB tracking number
 */
export const buildOfficialCourierTrackingUrl = (
  courier: string,
  trackingNumber: string
): string | null => {
  if (!trackingNumber || typeof trackingNumber !== "string") return null;
  const cleanAwb = trackingNumber.trim();
  if (!cleanAwb) return null;

  // If already an absolute URL (e.g. custom seller live link), return directly
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

  // 1. JNE Express
  if (c.includes("jne")) {
    return `https://www.jne.co.id/tracking?resi=${encodeURIComponent(cleanAwb)}`;
  }

  // 2. J&T Express
  if (c.includes("j&t") || c.includes("jet") || c.includes("jnt")) {
    return `https://www.jet.co.id/track?awb=${encodeURIComponent(cleanAwb)}`;
  }

  // 3. SiCepat Express
  if (c.includes("sicepat") || c.includes("si cepat")) {
    return `https://www.sicepat.com/checkAwb?awb=${encodeURIComponent(cleanAwb)}`;
  }

  // 4. Pos Indonesia
  if (c.includes("pos") || c.includes("indonesia")) {
    return `https://www.posindonesia.co.id/id/tracking?resi=${encodeURIComponent(cleanAwb)}`;
  }

  // 5. Lion Parcel
  if (c.includes("lion")) {
    return `https://lionparcel.com/track?q=${encodeURIComponent(cleanAwb)}`;
  }

  // 6. SAPX Express
  if (c.includes("sapx") || c.includes("sap")) {
    return `https://www.sapx.id/id/tracking?awb=${encodeURIComponent(cleanAwb)}`;
  }

  // 7. Anteraja
  if (c.includes("anteraja") || c.includes("anter")) {
    return `https://anteraja.id/tracking?waybill=${encodeURIComponent(cleanAwb)}`;
  }

  // 8. GrabExpress / GoSend / Instant driver
  if (c.includes("grab")) {
    return `https://express.grab.com/id/track?id=${encodeURIComponent(cleanAwb)}`;
  }
  if (c.includes("gojek") || c.includes("gosend")) {
    return `https://www.gojek.com/id-id/gosend/track?id=${encodeURIComponent(cleanAwb)}`;
  }
  if (c.includes("maxim")) {
    return `https://taximaxim.com/id/id-ID/tracking/?order=${encodeURIComponent(cleanAwb)}`;
  }

  // WhatsApp driver phone number (e.g. 0812... or +62812...)
  const cleanPhone = cleanAwb.replace(/[\s-]/g, "");
  if (/^(08|\+62|62)\d{8,13}$/.test(cleanPhone)) {
    const waNumber = cleanPhone.startsWith("+")
      ? cleanPhone.slice(1)
      : cleanPhone.startsWith("0")
      ? `62${cleanPhone.slice(1)}`
      : cleanPhone;
    return `https://wa.me/${waNumber}`;
  }

  return null;
};
