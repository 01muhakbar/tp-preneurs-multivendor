import { findNearestSulselDistrict } from "../utils/geolocationHelper.js";

const PHOTON_API_URL = "https://photon.komoot.io/api/";
const NOMINATIM_API_URL = "https://nominatim.openstreetmap.org/search";

// Approximate center of Makassar & South Sulawesi for search biasing
const SULSEL_BIAS_LAT = -5.1477;
const SULSEL_BIAS_LON = 119.4327;

/**
 * Clean and normalize a geocoding item into a structured address object.
 */
function normalizeGeocodingItem(rawItem, provider = "photon") {
  let title = "";
  let subtitle = "";
  let street = "";
  let houseNumber = "";
  let district = "";
  let city = "";
  let province = "";
  let postcode = "";
  let lat = null;
  let lng = null;

  if (provider === "photon") {
    const props = rawItem?.properties || {};
    const coords = rawItem?.geometry?.coordinates || [];
    lng = coords[0] != null ? Number(coords[0]) : null;
    lat = coords[1] != null ? Number(coords[1]) : null;

    title = props.name || props.street || "";
    street = props.street || props.name || "";
    houseNumber = props.housenumber || "";
    district = props.district || props.suburb || props.locality || "";
    city = props.city || props.county || "";
    province = props.state || "";
    postcode = props.postcode || "";

    const parts = [
      props.street && props.name !== props.street ? props.street : null,
      district,
      city,
      province,
      postcode,
    ].filter(Boolean);

    subtitle = parts.join(", ");
  } else {
    // Nominatim
    lat = rawItem?.lat != null ? Number(rawItem.lat) : null;
    lng = rawItem?.lon != null ? Number(rawItem.lon) : null;
    const addr = rawItem?.address || {};

    title =
      rawItem?.name ||
      addr.shop ||
      addr.building ||
      addr.amenity ||
      addr.road ||
      rawItem?.display_name?.split(",")?.[0] ||
      "";

    street = addr.road || addr.street || title;
    houseNumber = addr.house_number || "";
    district = addr.suburb || addr.city_district || addr.hamlet || addr.village || "";
    city = addr.city || addr.town || addr.county || "";
    province = addr.state || "";
    postcode = addr.postcode || "";

    subtitle = rawItem?.display_name || "";
  }

  // Cross-reference with our South Sulawesi regional centroid mapping for high precision
  let nearestSulsel = null;
  if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
    nearestSulsel = findNearestSulselDistrict(lat, lng);
  }

  // If in Sulsel / nearby, use canonical region names from idRegions
  const resolvedProvince = nearestSulsel ? nearestSulsel.province : province || "Sulawesi Selatan";
  const resolvedCity = nearestSulsel ? nearestSulsel.city : city || "Kota Makassar";
  const resolvedDistrict = nearestSulsel ? nearestSulsel.district : district || "";

  return {
    id: `${provider}_${lat}_${lng}_${Math.random().toString(36).slice(2, 7)}`,
    title: title || street || "Lokasi Ditemukan",
    subtitle: subtitle || `${resolvedDistrict}, ${resolvedCity}, ${resolvedProvince}`,
    streetName: street || title,
    houseNumber,
    district: resolvedDistrict,
    city: resolvedCity,
    province: resolvedProvince,
    postalCode: postcode || "90224",
    latitude: lat,
    longitude: lng,
    distanceKm: nearestSulsel?.distanceKm ?? null,
    provider,
  };
}

/**
 * Query Photon Komoot API with Sulsel location bias.
 */
async function queryPhoton(query, limit = 6) {
  const params = new URLSearchParams({
    q: query,
    lat: String(SULSEL_BIAS_LAT),
    lon: String(SULSEL_BIAS_LON),
    limit: String(limit),
  });

  const response = await fetch(`${PHOTON_API_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Photon API error: ${response.status}`);
  }

  const data = await response.json();
  const features = Array.isArray(data?.features) ? data.features : [];

  return features.map((f) => normalizeGeocodingItem(f, "photon"));
}

/**
 * Fallback to Nominatim OpenStreetMap if Photon fails.
 */
async function queryNominatim(query, limit = 6) {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    countrycodes: "id",
    limit: String(limit),
  });

  const response = await fetch(`${NOMINATIM_API_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TPPreneurs-App/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status}`);
  }

  const items = await response.json();
  return (Array.isArray(items) ? items : []).map((item) =>
    normalizeGeocodingItem(item, "nominatim")
  );
}

/**
 * Search address suggestions using Photon with automatic fallback to Nominatim.
 * Completely free, open source, zero API key required.
 *
 * @param {string} query Search keyword (street, building, landmark)
 * @param {number} [limit=6] Maximum suggestions
 * @returns {Promise<Array<{ id: string, title: string, subtitle: string, streetName: string, houseNumber: string, district: string, city: string, province: string, postalCode: string, latitude: number, longitude: number }>>}
 */
export async function searchAddressSuggestions(query, limit = 6) {
  const trimmed = String(query || "").trim();
  if (trimmed.length < 3) {
    return [];
  }

  try {
    const results = await queryPhoton(trimmed, limit);
    if (results.length > 0) {
      return results;
    }
  } catch (photonErr) {
    console.warn("[osmGeocodingService] Photon query failed, trying Nominatim fallback...", photonErr);
  }

  try {
    return await queryNominatim(trimmed, limit);
  } catch (nominatimErr) {
    console.error("[osmGeocodingService] Nominatim fallback failed:", nominatimErr);
    return [];
  }
}
