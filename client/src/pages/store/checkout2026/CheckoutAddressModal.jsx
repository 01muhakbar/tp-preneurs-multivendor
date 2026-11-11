import React, { useState } from "react";
import { Check, ChevronLeft, Loader2, MapPin, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  getCityOptions,
  getDistrictOptions,
  getProvinceOptions,
} from "../../../utils/idRegions.ts";

export default function CheckoutAddressModal({
  isOpen,
  onClose,
  addresses = [],
  selectedAddressId = null,
  onSelectAddress,
  onSaveNewAddress,
  isIndo = true,
}) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New address form state
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
  const [errorMessage, setErrorMessage] = useState("");

  const provinceOptions = getProvinceOptions();
  const cityOptions = getCityOptions(province);
  const districtOptions = getDistrictOptions(province, city);

  if (!isOpen) return null;

  const handleSelect = (addr) => {
    onSelectAddress?.(addr);
    onClose();
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

    try {
      await onSaveNewAddress?.({
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
        markAs: "HOME",
        isPrimary: addresses.length === 0,
        isStore: false,
        isReturn: false,
      });

      toast.success(isIndo ? "Alamat baru berhasil ditambahkan." : "New address added.");
      setIsAddingNew(false);
      // Reset form
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
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message ||
          (isIndo ? "Gagal menyimpan alamat baru." : "Failed to save address.")
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
            {isAddingNew && (
              <button
                type="button"
                className="co26-modal-back-btn"
                onClick={() => setIsAddingNew(false)}
                aria-label="Back"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h3 className="co26-modal-title">
              {isAddingNew
                ? isIndo
                  ? "Tambah Alamat Baru"
                  : "Add New Address"
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
          {!isAddingNew ? (
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
                    onClick={() => setIsAddingNew(true)}
                  >
                    <Plus size={16} />
                    <span>{isIndo ? "Tambah Alamat Baru" : "Add New Address"}</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {addresses.map((addr) => {
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

                            <p className="co26-address-text mt-1">
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
                    onClick={() => setIsAddingNew(true)}
                  >
                    <Plus size={16} />
                    <span>{isIndo ? "Tambah Alamat Baru" : "Add New Address"}</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            /* Add New Address Form */
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
                <div>
                  <label className="co26-form-label">
                    {isIndo ? "Provinsi *" : "Province *"}
                  </label>
                  <select
                    className="co26-form-select"
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      setCity("");
                      setDistrict("");
                    }}
                    required
                  >
                    <option value="">{isIndo ? "Pilih Provinsi" : "Select Province"}</option>
                    {provinceOptions.map((opt) => {
                      const val = typeof opt === "string" ? opt : opt.value;
                      const lbl = typeof opt === "string" ? opt : opt.label;
                      return (
                        <option key={val} value={val}>
                          {lbl}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="co26-form-label">
                    {isIndo ? "Kota / Kabupaten *" : "City / Regency *"}
                  </label>
                  <select
                    className="co26-form-select"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setDistrict("");
                    }}
                    disabled={!province}
                    required
                  >
                    <option value="">{isIndo ? "Pilih Kota" : "Select City"}</option>
                    {cityOptions.map((opt) => {
                      const val = typeof opt === "string" ? opt : opt.value;
                      const lbl = typeof opt === "string" ? opt : opt.label;
                      return (
                        <option key={val} value={val}>
                          {lbl}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="co26-form-label">
                    {isIndo ? "Kecamatan *" : "Subdistrict *"}
                  </label>
                  <select
                    className="co26-form-select"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    disabled={!city}
                    required
                  >
                    <option value="">{isIndo ? "Pilih Kecamatan" : "Select District"}</option>
                    {districtOptions.map((opt) => {
                      const val = typeof opt === "string" ? opt : opt.value;
                      const lbl = typeof opt === "string" ? opt : opt.label;
                      return (
                        <option key={val} value={val}>
                          {lbl}
                        </option>
                      );
                    })}
                  </select>
                </div>
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

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="co26-btn-secondary"
                  onClick={() => setIsAddingNew(false)}
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
                  ) : isIndo ? (
                    "Simpan Alamat"
                  ) : (
                    "Save Address"
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
