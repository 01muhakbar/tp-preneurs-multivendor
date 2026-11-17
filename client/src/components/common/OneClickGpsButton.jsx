import React, { useState } from "react";
import { CheckCircle2, Loader2, MapPin, Navigation, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import {
  findNearestSulselDistrict,
  requestBrowserCoordinates,
} from "../../utils/geolocationHelper.js";

/**
 * Reusable One-Click GPS detection button & status card.
 * Works with native HTML5 W3C Geolocation API (zero third-party cost).
 */
export default function OneClickGpsButton({
  latitude = null,
  longitude = null,
  accuracy = null,
  onLocationDetected,
  onClearLocation,
  isIndo = true,
  helperText = "",
  className = "",
}) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const hasLocation =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  const handleDetect = async () => {
    setIsDetecting(true);
    setErrorMessage("");

    try {
      const coords = await requestBrowserCoordinates(isIndo);
      const nearest = findNearestSulselDistrict(coords.latitude, coords.longitude);

      onLocationDetected?.({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        nearestMatch: nearest,
      });

      if (nearest) {
        toast.success(
          isIndo
            ? `Lokasi terdeteksi: ${nearest.district}, ${nearest.city}`
            : `Location detected: ${nearest.district}, ${nearest.city}`
        );
      } else {
        toast.success(
          isIndo
            ? "Koordinat GPS perangkat berhasil diambil."
            : "Device GPS coordinates captured."
        );
      }
    } catch (err) {
      const msg =
        err?.message ||
        (isIndo
          ? "Gagal mendeteksi lokasi dari perangkat."
          : "Failed to detect location from device.");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div
      className={`rounded-xl border border-slate-700/60 bg-slate-900/60 p-3.5 text-slate-200 transition ${
        hasLocation ? "border-emerald-500/40 bg-emerald-950/15" : ""
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              hasLocation
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-[#fe6f05]/15 text-[#fe6f05]"
            }`}
          >
            {hasLocation ? (
              <CheckCircle2 size={18} />
            ) : isDetecting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Navigation size={18} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-100">
                {hasLocation
                  ? isIndo
                    ? "Titik GPS Terkunci"
                    : "GPS Location Locked"
                  : isIndo
                  ? "Deteksi Otomatis Lokasi (GPS)"
                  : "Auto-Detect Location (GPS)"}
              </span>
              {hasLocation && accuracy != null && (
                <span className="rounded bg-emerald-900/60 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/30">
                  ±{accuracy}m
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {hasLocation
                ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                : helperText ||
                  (isIndo
                    ? "Klik untuk mendeteksi koordinat & mengisi wilayah secara otomatis."
                    : "Click to detect coordinates and auto-fill region dropdowns.")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {!hasLocation ? (
            <button
              type="button"
              onClick={handleDetect}
              disabled={isDetecting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#fe6f05] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#e05e00] disabled:opacity-50"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="animate-spin" size={13} />
                  <span>{isIndo ? "Mendeteksi..." : "Detecting..."}</span>
                </>
              ) : (
                <>
                  <Navigation size={13} />
                  <span>{isIndo ? "Gunakan Lokasi Saat Ini" : "Use Current Location"}</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleDetect}
                disabled={isDetecting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
              >
                <RefreshCw size={12} className={isDetecting ? "animate-spin" : ""} />
                <span>{isIndo ? "Perbarui" : "Update"}</span>
              </button>
              {onClearLocation && (
                <button
                  type="button"
                  onClick={onClearLocation}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:underline px-1 py-1"
                >
                  {isIndo ? "Hapus" : "Clear"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mt-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded-lg p-2">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
