import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  ImagePlus,
  Loader2,
  Percent,
  RefreshCw,
  Store,
  Tag,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { uploadAdminImage } from "../../../lib/adminApi.js";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import { GENERIC_ERROR } from "../../../constants/uiMessages.js";

const toNumber = (value) => {
  const numeric = Number(String(value ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const revokeObjectUrl = (value) => {
  if (typeof value === "string" && value.startsWith("blob:")) {
    URL.revokeObjectURL(value);
  }
};

const toDateInput = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const deriveActive = (coupon) => {
  if (typeof coupon?.active === "boolean") return coupon.active;
  if (typeof coupon?.published === "boolean") return coupon.published;
  return true;
};

export default function EditCouponFormPanel({
  coupon,
  onCancel,
  onSubmit,
  isSubmitting = false,
  error = "",
  storeOptions = [],
}) {
  const { t, i18n } = useTranslation("admin");
  const isId = Boolean(i18n.language?.toLowerCase().startsWith("id"));

  const [scopeType, setScopeType] = useState("PLATFORM");
  const [storeId, setStoreId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [amount, setAmount] = useState("");
  const [minSpend, setMinSpend] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [active, setActive] = useState(true);
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [bannerFileName, setBannerFileName] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!coupon) return;
    revokeObjectUrl(bannerPreview);
    setScopeType(coupon?.governance?.scopeType || coupon?.scopeType || "PLATFORM");
    setStoreId(String(coupon?.governance?.storeId ?? coupon?.storeId ?? ""));
    setCampaignName(String(coupon?.campaignName || coupon?.name || coupon?.code || "").trim());
    setCode(String(coupon?.code || "").trim().toUpperCase());
    setDiscountType(coupon.discountType || "percent");
    setAmount(String(coupon.amount ?? ""));
    setMinSpend(String(coupon.minSpend ?? ""));
    setStartDate(toDateInput(coupon.startDate || coupon.startsAt || coupon.createdAt));
    setEndDate(toDateInput(coupon.endDate || coupon.expiresAt || coupon.endsAt));
    setActive(deriveActive(coupon));
    setBannerImageUrl(String(coupon?.bannerImageUrl || ""));
    setBannerPreview("");
    setBannerFileName("");
    setBannerUploading(false);
    setBannerUploadError("");
    setValidationError("");
  }, [coupon]);

  useEffect(() => {
    return () => {
      revokeObjectUrl(bannerPreview);
    };
  }, [bannerPreview]);

  const discountInputAffix = useMemo(() => {
    if (discountType === "fixed") {
      return { prefix: "Rp", suffix: "" };
    }
    return { prefix: "", suffix: "%" };
  }, [discountType]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setBannerUploadError(
        isId
          ? "Format file harus berupa gambar (JPG, PNG, atau WebP)."
          : "File must be an image (JPG, PNG, or WebP)."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setBannerUploadError(
        isId ? "Ukuran gambar maksimal 5MB." : "Image size must not exceed 5MB."
      );
      return;
    }

    revokeObjectUrl(bannerPreview);
    const localPreviewUrl = URL.createObjectURL(file);
    setValidationError("");
    setBannerUploadError("");
    setBannerFileName(file.name);
    setBannerPreview(localPreviewUrl);
    setBannerImageUrl("");
    setBannerUploading(true);

    try {
      const uploaded = await uploadAdminImage(file);
      const uploadedUrl = String(uploaded?.url || "").trim();
      if (!uploadedUrl) {
        throw new Error("Upload did not return an image URL.");
      }
      revokeObjectUrl(localPreviewUrl);
      setBannerPreview("");
      setBannerImageUrl(uploadedUrl);
    } catch (err) {
      setBannerUploadError(
        err?.response?.data?.message ||
          err?.message ||
          (isId ? "Gagal mengunggah banner." : "Failed to upload banner image.")
      );
    } finally {
      setBannerUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveBanner = () => {
    revokeObjectUrl(bannerPreview);
    setValidationError("");
    setBannerUploadError("");
    setBannerFileName("");
    setBannerPreview("");
    setBannerImageUrl("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsedAmount = toNumber(amount);
    const parsedMinSpend = toNumber(minSpend);
    const normalizedCampaignName = String(campaignName || "").trim();
    const normalizedCode = String(code || "").trim().toUpperCase().replace(/\s+/g, "");

    if (bannerUploading) {
      setValidationError(
        isId
          ? "Tunggu proses unggah banner selesai sebelum memperbarui kupon."
          : "Wait for the banner image upload to finish before saving."
      );
      return;
    }

    if (!normalizedCode) {
      setValidationError(
        isId ? "Kode kupon wajib diisi." : "Campaign Code is required."
      );
      return;
    }

    if (scopeType === "STORE" && !storeId) {
      setValidationError(
        isId
          ? "Toko wajib dipilih untuk kupon dengan cakupan toko."
          : "Store is required for store-scoped coupons."
      );
      return;
    }

    if (discountType === "percent" && (parsedAmount <= 0 || parsedAmount > 100)) {
      setValidationError(
        isId
          ? "Diskon persentase harus bernilai antara 1% sampai 100%."
          : "Percent discount must be between 1 and 100."
      );
      return;
    }

    if (discountType === "fixed" && parsedAmount <= 0) {
      setValidationError(
        isId
          ? "Nominal diskon harus lebih besar dari Rp 0."
          : "Discount must be greater than 0."
      );
      return;
    }

    if (parsedMinSpend < 0) {
      setValidationError(
        isId
          ? "Minimal belanja tidak boleh kurang dari 0."
          : "Minimum Amount must be greater than or equal to 0."
      );
      return;
    }

    if (startDate && endDate) {
      const parsedStart = new Date(startDate);
      const parsedEnd = new Date(`${endDate}T23:59:59`);
      if (parsedEnd < parsedStart) {
        setValidationError(
          isId
            ? "Tanggal berakhir tidak boleh mendahului tanggal mulai."
            : "End Date must be greater than or equal to Start Date."
        );
        return;
      }
    }

    setValidationError("");
    onSubmit?.({
      campaignName: normalizedCampaignName || normalizedCode,
      code: normalizedCode,
      scopeType,
      storeId: scopeType === "STORE" ? Number(storeId) : null,
      discountType,
      amount: parsedAmount,
      minSpend: parsedMinSpend,
      active: Boolean(active),
      bannerImageUrl: bannerImageUrl || null,
      startsAt: startDate ? new Date(`${startDate}T00:00:00`).toISOString() : null,
      expiresAt: endDate ? new Date(`${endDate}T23:59:59`).toISOString() : null,
    });
  };

  const bannerPreviewSrc = bannerPreview || resolveAssetUrl(bannerImageUrl);
  const activeError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="acf26-form">
      <div className="acf26-form-body">
        {/* Error Notification */}
        {activeError ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{activeError}</span>
          </div>
        ) : null}

        {/* Section 1: Campaign Identity */}
        <section className="acf26-section">
          <div className="acf26-section-head">
            <h3>
              <Tag className="h-4 w-4 text-[#034c85] dark:text-sky-400" />
              <span>{isId ? "Identitas Kupon" : "Coupon Identity"}</span>
            </h3>
            <span>
              {isId
                ? "Tentukan kode kupon, nama promosi, dan target toko."
                : "Define coupon code, promotion label, and scope."}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="coupon-scope">
                {isId ? "Cakupan Promosi" : "Promotion Scope"}
              </label>
              <select
                id="coupon-scope"
                value={scopeType}
                onChange={(e) => {
                  setValidationError("");
                  const nextScope = e.target.value;
                  setScopeType(nextScope);
                  if (nextScope !== "STORE") setStoreId("");
                }}
                disabled={isSubmitting}
                className="acf26-select"
              >
                <option value="PLATFORM">
                  {isId ? "Platform / Global (Semua Toko)" : "Platform / Global (All Stores)"}
                </option>
                <option value="STORE">
                  {isId ? "Toko Tertentu (Store-scoped)" : "Store-scoped"}
                </option>
              </select>
            </div>

            {scopeType === "STORE" ? (
              <div>
                <label htmlFor="coupon-store">
                  {isId ? "Toko Terkait" : "Linked Store"}
                </label>
                <select
                  id="coupon-store"
                  value={storeId}
                  onChange={(e) => {
                    setValidationError("");
                    setStoreId(e.target.value);
                  }}
                  disabled={isSubmitting}
                  className="acf26-select"
                  required
                >
                  <option value="">
                    {isId ? "-- Pilih Toko Penjual --" : "-- Select Seller Store --"}
                  </option>
                  {storeOptions.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.slug ? `(${st.slug})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label htmlFor="coupon-code">
                {isId ? "Kode Kupon" : "Campaign Code"}
              </label>
              <input
                id="coupon-code"
                type="text"
                value={code}
                placeholder="DISKON50"
                onChange={(e) => {
                  setValidationError("");
                  setCode(e.target.value.toUpperCase().replace(/\s+/g, ""));
                }}
                disabled={isSubmitting}
                className="acf26-input uppercase tracking-wider font-bold"
                required
              />
            </div>

            <div>
              <label htmlFor="coupon-name">
                {isId ? "Nama Promosi" : "Campaign Name"}
              </label>
              <input
                id="coupon-name"
                type="text"
                value={campaignName}
                placeholder={code || (isId ? "Contoh: Promo Gajian" : "e.g. Payday Special")}
                onChange={(e) => {
                  setValidationError("");
                  setCampaignName(e.target.value);
                }}
                disabled={isSubmitting}
                className="acf26-input font-medium"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Discount Rules */}
        <section className="acf26-section">
          <div className="acf26-section-head">
            <h3>
              <Percent className="h-4 w-4 text-[#fe6f05]" />
              <span>{isId ? "Pengaturan Diskon" : "Discount Setup"}</span>
            </h3>
            <span>
              {isId
                ? "Tentukan besaran potongan harga dan syarat minimal belanja."
                : "Configure discount value and minimum spend threshold."}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label>{isId ? "Tipe Diskon" : "Discount Type"}</label>
              <div className="acf26-segmented">
                <button
                  type="button"
                  onClick={() => {
                    setValidationError("");
                    setDiscountType("percent");
                  }}
                  disabled={isSubmitting}
                  className={`acf26-segment-btn ${discountType === "percent" ? "is-active" : ""}`}
                >
                  {isId ? "Persentase (%)" : "Percent (%)"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValidationError("");
                    setDiscountType("fixed");
                  }}
                  disabled={isSubmitting}
                  className={`acf26-segment-btn ${discountType === "fixed" ? "is-active" : ""}`}
                >
                  {isId ? "Nominal Tetap (Rp)" : "Fixed Amount (Rp)"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="coupon-amount">
                  {discountType === "percent"
                    ? isId
                      ? "Besaran Diskon (%)"
                      : "Discount Percentage (%)"
                    : isId
                      ? "Potongan Harga (Rp)"
                      : "Discount Amount (Rp)"}
                </label>
                <div className="relative">
                  {discountInputAffix.prefix ? (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {discountInputAffix.prefix}
                    </span>
                  ) : null}
                  <input
                    id="coupon-amount"
                    type="number"
                    min="1"
                    max={discountType === "percent" ? "100" : undefined}
                    step="1"
                    value={amount}
                    placeholder="0"
                    onChange={(e) => {
                      setValidationError("");
                      setAmount(e.target.value);
                    }}
                    disabled={isSubmitting}
                    className={`acf26-input font-bold ${
                      discountInputAffix.prefix ? "pl-9" : ""
                    } ${discountInputAffix.suffix ? "pr-8" : ""}`}
                    required
                  />
                  {discountInputAffix.suffix ? (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {discountInputAffix.suffix}
                    </span>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="coupon-min-spend">
                  {isId ? "Minimal Belanja (Rp)" : "Minimum Spend (Rp)"}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    id="coupon-min-spend"
                    type="number"
                    min="0"
                    step="1"
                    value={minSpend}
                    placeholder="0"
                    onChange={(e) => {
                      setValidationError("");
                      setMinSpend(e.target.value);
                    }}
                    disabled={isSubmitting}
                    className="acf26-input pl-9 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Validity & Status */}
        <section className="acf26-section">
          <div className="acf26-section-head">
            <h3>
              <Calendar className="h-4 w-4 text-[#034c85] dark:text-sky-400" />
              <span>{isId ? "Periode & Status Kupon" : "Validity & Status"}</span>
            </h3>
            <span>
              {isId
                ? "Atur masa berlaku kupon dan status aktif untuk checkout."
                : "Set campaign validity window and checkout publication state."}
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="coupon-start-date">
                  {isId ? "Tanggal Mulai" : "Start Date"}
                </label>
                <input
                  id="coupon-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setValidationError("");
                    setStartDate(e.target.value);
                  }}
                  disabled={isSubmitting}
                  className="acf26-input"
                />
              </div>

              <div>
                <label htmlFor="coupon-end-date">
                  {isId ? "Tanggal Berakhir" : "End Date"}
                </label>
                <input
                  id="coupon-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setValidationError("");
                    setEndDate(e.target.value);
                  }}
                  disabled={isSubmitting}
                  className="acf26-input"
                />
              </div>
            </div>

            {/* Published Switch */}
            <div className="acf26-toggle-card">
              <div>
                <p className="title">
                  {isId ? "Terbitkan Kupon" : "Publish Coupon"}
                </p>
                <p className="desc">
                  {isId
                    ? "Aktifkan kupon agar dapat langsung digunakan oleh pembeli saat checkout."
                    : "Make this coupon immediately available for buyers at checkout."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => setActive((prev) => !prev)}
                disabled={isSubmitting}
                className={`acf26-switch ${active ? "is-active" : ""}`}
              >
                <span className="acf26-switch-thumb" />
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: Banner Image */}
        <section className="acf26-section">
          <div className="acf26-section-head">
            <h3>
              <ImagePlus className="h-4 w-4 text-[#fe6f05]" />
              <span>{isId ? "Gambar Banner Kupon" : "Coupon Banner Image"}</span>
            </h3>
            <span>
              {isId
                ? "Gambar opsional untuk kartu promosi kupon pada storefront."
                : "Optional banner image displayed on storefront promo widgets."}
            </span>
          </div>

          <div>
            <label className="acf26-upload-zone">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
                disabled={isSubmitting || bannerUploading}
              />
              {bannerPreviewSrc ? (
                <div className="space-y-3">
                  <div className="acf26-upload-preview">
                    <img src={bannerPreviewSrc} alt="Coupon banner preview" />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                      {bannerFileName || (isId ? "Banner tersimpan" : "Stored coupon banner")}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveBanner();
                        }}
                        disabled={isSubmitting || bannerUploading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/40 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{isId ? "Hapus Banner" : "Remove"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="acf26-upload-icon">
                    {bannerUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <UploadCloud className="h-5 w-5" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {bannerUploading
                      ? isId
                        ? "Mengunggah gambar banner..."
                        : "Uploading banner image..."
                      : isId
                        ? "Klik atau seret gambar banner ke sini"
                        : "Click or drag banner image here"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    PNG, JPG, WEBP • {isId ? "Maksimal 5MB" : "Max 5MB"}
                  </p>
                </div>
              )}
            </label>

            {bannerUploadError ? (
              <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                {bannerUploadError}
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <footer className="acf26-footer">
        <div className="acf26-footer-inner">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="acf26-btn-cancel"
          >
            {isId ? "Batal" : "Cancel"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || bannerUploading}
            className="acf26-btn-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isId ? "Menyimpan..." : "Updating..."}</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>{isId ? "Simpan Perubahan" : "Update Coupon"}</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </form>
  );
}

