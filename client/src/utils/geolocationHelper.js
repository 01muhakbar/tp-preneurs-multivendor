import { SULSEL_DISTRICT_CENTROIDS } from "./standaloneShippingEngine.js";
import { REGION_DATA } from "./idRegions.ts";

/**
 * Air distance in kilometers between two GPS points using the Haversine formula.
 */
export function calculateAirDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

let cachedDistrictLookup = null;

/**
 * Build a lookup table from lowercased district name to exact { province, city, district }
 */
export function getSulselDistrictLookup() {
  if (cachedDistrictLookup) return cachedDistrictLookup;

  const lookup = {};
  const sulsel = (REGION_DATA || []).find((p) =>
    String(p?.name || "").toLowerCase().includes("sulawesi selatan")
  );

  if (sulsel && Array.isArray(sulsel.cities)) {
    for (const city of sulsel.cities) {
      const cityName = String(city?.name || "").trim();
      const districts = Array.isArray(city?.districts) ? city.districts : [];
      for (const dist of districts) {
        const cleanName = String(dist || "").trim();
        if (cleanName) {
          lookup[cleanName.toLowerCase()] = {
            province: sulsel.name,
            city: cityName,
            district: cleanName,
          };
        }
      }
    }
  }

  cachedDistrictLookup = lookup;
  return lookup;
}

/**
 * Find the nearest South Sulawesi district from a given GPS coordinate.
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @returns {{ province: string, city: string, district: string, distanceKm: number, latitude: number, longitude: number, centroid: { lat: number, lng: number } } | null}
 */
export function findNearestSulselDistrict(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  const lookup = getSulselDistrictLookup();
  let nearestMatch = null;
  let minDistance = Infinity;

  const centroids = SULSEL_DISTRICT_CENTROIDS || {};

  for (const [rawKey, coords] of Object.entries(centroids)) {
    if (!coords || typeof coords.lat !== "number" || typeof coords.lng !== "number") {
      continue;
    }

    const dist = calculateAirDistanceKm(lat, lng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      // Remove any parenthetical specifier like "pattallassang (gowa)"
      const cleanKey = rawKey.replace(/\s*\([^)]*\)/g, "").trim().toLowerCase();
      const regionInfo = lookup[cleanKey] || {
        province: "Sulawesi Selatan",
        city: cleanKey.includes("makassar") ? "Kota Makassar" : "Kabupaten Gowa",
        district: cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1),
      };

      nearestMatch = {
        province: regionInfo.province,
        city: regionInfo.city,
        district: regionInfo.district,
        distanceKm: Math.round(minDistance * 10) / 10,
        latitude: lat,
        longitude: lng,
        centroid: coords,
      };
    }
  }

  return nearestMatch;
}

/**
 * Request high-accuracy GPS coordinates from the browser.
 * Zero-cost native W3C Geolocation API.
 * @param {boolean} [isIndo=true] Whether to return Indonesian error messages
 * @returns {Promise<{ latitude: number, longitude: number, accuracy: number }>}
 */
export function requestBrowserCoordinates(isIndo = true) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      reject(
        new Error(
          isIndo
            ? "Browser Anda tidak mendukung deteksi lokasi (Geolocation API)."
            : "Your browser does not support Geolocation API."
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 0),
        });
      },
      (error) => {
        let message = isIndo
          ? "Gagal mendeteksi lokasi saat ini."
          : "Failed to detect current location.";

        switch (error?.code) {
          case 1: // PERMISSION_DENIED
            message = isIndo
              ? "Izin akses lokasi ditolak oleh browser. Silakan aktifkan izin lokasi di peramban Anda atau pilih wilayah secara manual."
              : "Location access permission denied. Please allow location access or choose manually.";
            break;
          case 2: // POSITION_UNAVAILABLE
            message = isIndo
              ? "Informasi lokasi GPS tidak tersedia pada perangkat saat ini."
              : "GPS location information is currently unavailable on your device.";
            break;
          case 3: // TIMEOUT
            message = isIndo
              ? "Waktu permintaan akses lokasi habis (timeout). Silakan coba lagi."
              : "Location request timed out. Please try again.";
            break;
          default:
            if (error?.message) {
              message = `${message} (${error.message})`;
            }
            break;
        }

        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
