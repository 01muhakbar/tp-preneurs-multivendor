import React, { useState, useEffect, useRef, useMemo } from "react";
import { Check, ChevronDown, ChevronLeft, Loader2, MapPin, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  getCityOptions,
  getDistrictOptions,
  getProvinceOptions,
} from "../../../utils/idRegions.ts";

function SearchableRegionSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "",
  disabled = false,
  disabledPlaceholder = "",
  required = false,
  isIndo = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal query with incoming value
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Handle outside click to close dropdown and normalize
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        const trimmed = query.trim();
        if (!trimmed) {
          if (value) onChange("");
          setQuery("");
        } else {
          // Check if typed query matches an option (case-insensitive)
          const match = options.find((opt) => {
            const str = typeof opt === "string" ? opt : opt?.value || opt?.label || "";
            return str.toLowerCase() === trimmed.toLowerCase();
          });
          if (match) {
            const val = typeof match === "string" ? match : match.value;
            if (val !== value) onChange(val);
            setQuery(val);
          } else if (value) {
            // Revert back to selected value
            setQuery(value);
          } else {
            if (trimmed !== value) onChange(trimmed);
          }
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, query, value, options, onChange]);

  // Filter options based on typed query
  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const lower = query.toLowerCase().trim();
    return options.filter((opt) => {
      const text = typeof opt === "string" ? opt : opt?.label || opt?.value || "";
      return text.toLowerCase().includes(lower);
    });
  }, [options, query]);

  const handleSelect = (opt) => {
    const val = typeof opt === "string" ? opt : opt.value;
    if (val !== value) {
      onChange(val);
    }
    setQuery(val);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (value) onChange("");
    setQuery("");
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      } else if (query.trim()) {
        if (query.trim() !== value) onChange(query.trim());
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery(value || "");
    }
  };

  return (
    <div
      ref={containerRef}
      className={`co26-searchable-container ${isOpen ? "z-30" : "z-10"}`}
    >
      <label className="co26-form-label">{label}</label>
      <div className="co26-searchable-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className={`co26-form-input pr-12 ${
            disabled ? "opacity-50 cursor-not-allowed bg-slate-900/80" : ""
          }`}
          placeholder={disabled ? disabledPlaceholder || placeholder : placeholder}
          value={disabled ? "" : query}
          onChange={(e) => {
            const q = e.target.value;
            setQuery(q);
            setIsOpen(true);
            if (!q.trim()) {
              onChange("");
            }
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required && !value}
        />

        <div className="co26-searchable-icons">
          {!disabled && (query || value) && (
            <button
              type="button"
              className="co26-searchable-clear-btn"
              onClick={handleClear}
              title={isIndo ? "Hapus" : "Clear"}
              aria-label="Clear"
            >
              <X size={12} />
            </button>
          )}
          <button
            type="button"
            className="co26-searchable-chevron-btn"
            onClick={() => {
              if (!disabled) setIsOpen((prev) => !prev);
            }}
            tabIndex={-1}
            aria-label="Toggle dropdown"
          >
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 text-slate-400 ${
                isOpen ? "rotate-180 text-[#fe6f05]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <ul
          className="co26-searchable-dropdown"
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filteredOptions.length === 0 ? (
            <li className="co26-searchable-empty">
              {isIndo
                ? "Tidak ada hasil ditemukan. Anda dapat mengetik manual."
                : "No matching results found. You can type manually."}
            </li>
          ) : (
            filteredOptions.map((opt) => {
              const val = typeof opt === "string" ? opt : opt.value;
              const lbl = typeof opt === "string" ? opt : opt.label;
              const isSelected =
                value && String(value).toLowerCase() === String(val).toLowerCase();

              return (
                <li
                  key={val}
                  role="option"
                  aria-selected={isSelected}
                  className={`co26-searchable-item ${isSelected ? "is-selected" : ""}`}
                  onClick={() => handleSelect(opt)}
                >
                  <span className="truncate">{lbl}</span>
                  {isSelected && (
                    <Check size={14} className="text-[#fe6f05] shrink-0 ml-auto" />
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

export default function CheckoutAddressModal({
  isOpen,
  onClose,
  addresses = [],
  selectedAddressId = null,
  onSelectAddress,
  onSaveNewAddress,
  onUpdateAddress,
  isIndo = true,
}) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [streetName, setStreetName] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [building, setBuilding] = useState("");
  const [otherDetails, setOtherDetails] = useState("");
  const [markAs, setMarkAs] = useState("HOME");
  const [isPrimary, setIsPrimary] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const provinceOptions = useMemo(
    () => getProvinceOptions(province),
    [province]
  );
  const cityOptions = useMemo(
    () => getCityOptions(province, city),
    [province, city]
  );
  const districtOptions = useMemo(
    () => getDistrictOptions(province, city, district),
    [province, city, district]
  );

  if (!isOpen) return null;

  const isFormOpen = isAddingNew || Boolean(editingAddress);
  const formTitle = editingAddress
    ? isIndo
      ? "Ubah Alamat"
      : "Edit Address"
    : isIndo
      ? "Tambah Alamat Baru"
      : "Add New Address";

  const handleSelect = (addr) => {
    onSelectAddress?.(addr);
    onClose();
  };

  const handleStartNew = () => {
    setEditingAddress(null);
    setIsAddingNew(true);
    setFullName("");
    setPhoneNumber("");
    setProvince("");
    setCity("");
    setDistrict("");
    setPostalCode("");
    setStreetName("");
    setHouseNumber("");
    setBuilding("");
    setOtherDetails("");
    setMarkAs("HOME");
    setIsPrimary(addresses.length === 0);
    setErrorMessage("");
  };

  const handleStartEdit = (addr) => {
    setIsAddingNew(false);
    setEditingAddress(addr);
    setFullName(addr.fullName || "");
    setPhoneNumber(addr.phoneNumber || "");
    setProvince(addr.province || "");
    setCity(addr.city || "");
    setDistrict(addr.district || "");
    setPostalCode(addr.postalCode || "");
    setStreetName(addr.streetName || "");
    setHouseNumber(addr.houseNumber || "");
    setBuilding(addr.building || "");
    setOtherDetails(addr.otherDetails || "");
    setMarkAs(addr.markAs || "HOME");
    setIsPrimary(Boolean(addr.isPrimary));
    setErrorMessage("");
  };

  const handleCloseForm = () => {
    setIsAddingNew(false);
    setEditingAddress(null);
    setErrorMessage("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim() || !province || !city || !district || !streetName.trim()) {
      setErrorMessage(
        isIndo
          ? "Mohon lengkapi data penerima dan alamat pengiriman."
          : "Please complete recipient name, phone, and address details."
      );
      return;
    }

    const resolvedPostal = postalCode.trim() || "90224";
    if (!/^\d{5}$/.test(resolvedPostal)) {
      setErrorMessage(
        isIndo
          ? "Kode pos harus terdiri dari 5 digit angka."
          : "Postal code must be 5 digits."
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const payload = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      province,
      city,
      district,
      postalCode: resolvedPostal,
      streetName: streetName.trim(),
      houseNumber: houseNumber.trim() || "-",
      building: building.trim() || null,
      otherDetails: otherDetails.trim() || null,
      markAs,
      isPrimary: Boolean(isPrimary),
      isStore: false,
      isReturn: false,
    };

    try {
      if (editingAddress) {
        await onUpdateAddress?.(editingAddress.id, payload);
        toast.success(isIndo ? "Alamat berhasil diperbarui." : "Address updated successfully.");
      } else {
        await onSaveNewAddress?.(payload);
        toast.success(isIndo ? "Alamat baru berhasil ditambahkan." : "New address added.");
      }
      handleCloseForm();
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message ||
          (isIndo ? "Gagal menyimpan alamat." : "Failed to save address.")
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="co26-modal-overlay" onClick={onClose}>
      <div
        className="co26-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="co26-modal-header">
          <div className="flex items-center gap-2">
            {isFormOpen && (
              <button
                type="button"
                className="co26-modal-back-btn"
                onClick={handleCloseForm}
                aria-label="Back"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h3 className="co26-modal-title">
              {isFormOpen
                ? formTitle
                : isIndo
                  ? "Pilih Alamat"
                  : "Select Delivery Address"}
            </h3>
          </div>
          <button
            type="button"
            className="co26-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="co26-modal-body">
          {!isFormOpen ? (
            <div className="space-y-3">
              {addresses.length === 0 ? (
                <div className="co26-modal-empty">
                  <MapPin className="co26-modal-empty-icon" size={32} />
                  <p>
                    {isIndo
                      ? "Belum ada alamat tersimpan. Silakan tambahkan alamat pengiriman Anda."
                      : "No saved addresses yet. Please add a shipping address."}
                  </p>
                  <button
                    type="button"
                    className="co26-btn-add-address mt-3"
                    onClick={handleStartNew}
                  >
                    <Plus size={16} />
                    <span>{isIndo ? "Tambah Alamat Baru" : "Add New Address"}</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {(Array.isArray(addresses) ? addresses : []).filter(Boolean).map((addr) => {
                      const isSelected =
                        selectedAddressId && Number(selectedAddressId) === Number(addr.id);

                      const fullAddrString = [
                        addr.streetName,
                        addr.houseNumber && addr.houseNumber !== "-" ? `No. ${addr.houseNumber}` : null,
                        addr.building,
                        addr.district,
                        addr.city,
                        addr.province,
                        addr.postalCode,
                      ]
                        .map((p) => (typeof p === "string" ? p.trim() : typeof p === "number" ? String(p) : ""))
                        .filter(Boolean)
                        .join(", ");

                      return (
                        <div
                          key={addr.id}
                          className={`co26-address-card ${isSelected ? "is-selected" : ""}`}
                          onClick={() => handleSelect(addr)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="co26-address-radio">
                            <span className={`co26-radio-dot ${isSelected ? "is-checked" : ""}`}>
                              {isSelected && <span className="co26-radio-inner" />}
                            </span>
                          </div>

                          <div className="co26-address-info">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <strong className="text-slate-100 font-bold text-sm">
                                  {addr.fullName}
                                </strong>
                                <span className="text-slate-400 text-xs">
                                  ({addr.phoneNumber})
                                </span>
                                {addr.isPrimary && (
                                  <span className="co26-badge-default">
                                    {isIndo ? "Utama" : "Default"}
                                  </span>
                                )}
                                {addr.markAs && (
                                  <span className="co26-badge-type">
                                    {addr.markAs === "HOME"
                                      ? isIndo
                                        ? "Rumah"
                                        : "Home"
                                      : isIndo
                                        ? "Kantor"
                                        : "Office"}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                className="co26-address-btn-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(addr);
                                }}
                              >
                                {isIndo ? "Ubah" : "Edit"}
                              </button>
                            </div>

                            <p className="co26-address-text mt-1.5">
                              {fullAddrString}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="co26-btn-add-address w-full mt-3"
                    onClick={handleStartNew}
                  >
                    <Plus size={16} />
                    <span>{isIndo ? "Tambah Alamat Baru" : "Add New Address"}</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            /* Add / Edit Address Form */
            <form onSubmit={handleSave} className="space-y-3.5">
              {errorMessage && (
                <div className="co26-modal-error">{errorMessage}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="co26-form-label">
                    {isIndo ? "Nama Lengkap Penerima *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    className="co26-form-input"
                    placeholder={isIndo ? "Contoh: Muhammad Akbar" : "e.g. John Doe"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="co26-form-label">
                    {isIndo ? "Nomor Telepon *" : "Phone Number *"}
                  </label>
                  <input
                    type="tel"
                    className="co26-form-input"
                    placeholder={isIndo ? "Contoh: 081234567890" : "e.g. 081234567890"}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SearchableRegionSelect
                  label={isIndo ? "Provinsi *" : "Province *"}
                  placeholder={isIndo ? "Ketik / pilih provinsi" : "Type / select province"}
                  value={province}
                  options={provinceOptions}
                  onChange={(val) => {
                    if (val !== province) {
                      setProvince(val);
                      setCity("");
                      setDistrict("");
                    }
                  }}
                  required
                  isIndo={isIndo}
                />
                <SearchableRegionSelect
                  label={isIndo ? "Kota / Kabupaten *" : "City / Regency *"}
                  placeholder={isIndo ? "Ketik / pilih kota" : "Type / select city"}
                  disabledPlaceholder={isIndo ? "Pilih provinsi dahulu" : "Select province first"}
                  value={city}
                  options={cityOptions}
                  onChange={(val) => {
                    if (val !== city) {
                      setCity(val);
                      setDistrict("");
                    }
                  }}
                  disabled={!province}
                  required
                  isIndo={isIndo}
                />
                <SearchableRegionSelect
                  label={isIndo ? "Kecamatan *" : "Subdistrict *"}
                  placeholder={isIndo ? "Ketik / pilih kecamatan" : "Type / select district"}
                  disabledPlaceholder={isIndo ? "Pilih kota dahulu" : "Select city first"}
                  value={district}
                  options={districtOptions}
                  onChange={(val) => {
                    if (val !== district) {
                      setDistrict(val);
                    }
                  }}
                  disabled={!city}
                  required
                  isIndo={isIndo}
                />
              </div>

              <div>
                <label className="co26-form-label">
                  {isIndo ? "Alamat Lengkap / Nama Jalan *" : "Street Address *"}
                </label>
                <textarea
                  rows={2}
                  className="co26-form-textarea"
                  placeholder={
                    isIndo
                      ? "Nama jalan, RT/RW, Blok, Patokan lingkungan"
                      : "Street name, neighborhood, block"
                  }
                  value={streetName}
                  onChange={(e) => setStreetName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="co26-form-label">
                    {isIndo ? "Kode Pos" : "Postal Code"}
                  </label>
                  <input
                    type="text"
                    className="co26-form-input"
                    placeholder="90224"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="co26-form-label">
                    {isIndo ? "Detail Lainnya (Opsional)" : "Other Details (Optional)"}
                  </label>
                  <input
                    type="text"
                    className="co26-form-input"
                    placeholder={isIndo ? "Warna pagar / nomor rumah" : "e.g. Unit 3B"}
                    value={otherDetails}
                    onChange={(e) => setOtherDetails(e.target.value)}
                  />
                </div>
              </div>

              {/* Label Rumah/Kantor & Jadikan Utama */}
              <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-medium">
                    {isIndo ? "Label Alamat:" : "Address Label:"}
                  </span>
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs rounded-md border transition ${
                      markAs === "HOME"
                        ? "border-[#fe6f05] bg-[#fe6f05]/15 text-[#fe6f05] font-bold"
                        : "border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                    onClick={() => setMarkAs("HOME")}
                  >
                    {isIndo ? "Rumah" : "Home"}
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs rounded-md border transition ${
                      markAs === "OFFICE"
                        ? "border-[#fe6f05] bg-[#fe6f05]/15 text-[#fe6f05] font-bold"
                        : "border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                    onClick={() => setMarkAs("OFFICE")}
                  >
                    {isIndo ? "Kantor" : "Office"}
                  </button>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="rounded border-slate-700 text-[#fe6f05] focus:ring-[#fe6f05]"
                  />
                  <span>{isIndo ? "Atur sebagai Alamat Utama" : "Set as Default Address"}</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="co26-btn-secondary"
                  onClick={handleCloseForm}
                  disabled={isSaving}
                >
                  {isIndo ? "Batal" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="co26-btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : editingAddress ? (
                    isIndo ? "Simpan Perubahan" : "Save Changes"
                  ) : (
                    isIndo ? "Simpan Alamat" : "Save Address"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
