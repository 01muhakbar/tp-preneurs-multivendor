import React, { useState, useEffect, useRef } from "react";
import { Building2, Check, Loader2, MapPin, Search, X } from "lucide-react";
import { searchAddressSuggestions } from "../../services/osmGeocodingService.js";

/**
 * AddressAutocompleteSearch Component
 * Provides live instant address search & autocomplete using OpenStreetMap / Photon.
 * 100% Free, zero third-party cost, no API keys needed.
 */
export default function AddressAutocompleteSearch({
  value = "",
  onSelectAddress,
  isIndo = true,
  placeholder = "",
  className = "",
}) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const isTypingRef = useRef(false);

  // Synchronize internal query state when the external value prop changes (e.g. edit mode, prefilled address)
  useEffect(() => {
    if (!isTypingRef.current && value !== undefined && value !== null && value !== query) {
      setQuery(value);
      setIsOpen(false);
      setSuggestions([]);
    }
  }, [value]);

  // Debounced search - ONLY triggered when the user is actively typing
  useEffect(() => {
    if (!isTypingRef.current) {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchAddressSuggestions(trimmed, 6);
        setSuggestions(results);
        if (isTypingRef.current) {
          setIsOpen(results.length > 0);
        }
      } catch (err) {
        console.error("Geocoding search failed:", err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        isTypingRef.current = false;
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (item) => {
    isTypingRef.current = false;
    setSelectedId(item.id);
    const selectedText = item.streetName || item.title || "";
    setQuery(selectedText);
    setIsOpen(false);
    setSuggestions([]);
    onSelectAddress?.(item);
  };

  const handleClear = () => {
    isTypingRef.current = false;
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setSelectedId(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <label className="block text-xs font-medium text-slate-300 mb-1.5">
        {isIndo ? "🔍 Cari Alamat / Jalan / Gedung / Toko" : "🔍 Search Address / Street / Building"}
      </label>

      <div className="relative flex items-center">
        <span className="absolute left-3 text-slate-400 pointer-events-none">
          <Search size={16} />
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            isTypingRef.current = true;
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim().length >= 3) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={
            placeholder ||
            (isIndo
              ? "Ketik nama jalan, gedung, mall, kampus... (Cth: AP Pettarani, Mall Panakkukang)"
              : "Type street, building, landmark... (e.g. AP Pettarani, Panakkukang Mall)")
          }
          className="w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-9 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 shadow-sm focus:border-[#fe6f05] focus:outline-none focus:ring-1 focus:ring-[#fe6f05] transition"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {isLoading && <Loader2 className="animate-spin text-[#fe6f05]" size={15} />}
          {!isLoading && query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-200 transition"
              title={isIndo ? "Bersihkan pencarian" : "Clear search"}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <ul
          className="absolute left-0 right-0 top-full mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/95 py-1.5 shadow-2xl backdrop-blur-md z-50 divide-y divide-slate-800/60"
          role="listbox"
        >
          {suggestions.length === 0 ? (
            <li className="px-4 py-3 text-xs text-slate-400 text-center">
              {isLoading
                ? isIndo
                  ? "Mencari lokasi di OpenStreetMap..."
                  : "Searching in OpenStreetMap..."
                : isIndo
                ? "Tidak ada hasil ditemukan. Coba ketik nama jalan atau gedung lainnya."
                : "No matching location found. Try another street or building name."}
            </li>
          ) : (
            suggestions.map((item) => {
              const isSelected = selectedId === item.id;
              const isBuilding =
                item.title?.toLowerCase().includes("mall") ||
                item.title?.toLowerCase().includes("gedung") ||
                item.title?.toLowerCase().includes("hotel") ||
                item.title?.toLowerCase().includes("universitas") ||
                item.title?.toLowerCase().includes("kampus");

              return (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item)}
                  className={`flex items-start gap-2.5 px-3.5 py-2.5 text-xs transition cursor-pointer hover:bg-slate-800/80 ${
                    isSelected ? "bg-slate-800/90 border-l-2 border-[#fe6f05]" : ""
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                      isBuilding
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-emerald-500/15 text-emerald-400"
                    }`}
                  >
                    {isBuilding ? <Building2 size={13} /> : <MapPin size={13} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-100 truncate text-[12px]">
                        {item.title}
                      </p>
                      {item.latitude != null && item.longitude != null && (
                        <span className="shrink-0 text-[10px] text-slate-400 font-mono">
                          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>

                  {isSelected && (
                    <Check size={14} className="text-[#fe6f05] shrink-0 self-center ml-1" />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
