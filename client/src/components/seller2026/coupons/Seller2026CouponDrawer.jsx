import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, X } from "lucide-react";
import { uploadSellerCouponBannerImage } from "../../../api/sellerCoupons.ts";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";

const emptyForm = {
  campaignName: "",
  code: "",
  startsAt: "",
  expiresAt: "",
  discountType: "fixed",
  amount: "",
  minSpend: "",
  usageLimit: "",
  audience: "all",
  notes: "",
  active: true,
  bannerImageUrl: "",
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const createForm = (coupon, canManageStatus) => coupon ? {
  ...emptyForm,
  campaignName: coupon.title || coupon.name || coupon.code || "",
  code: coupon.code || "",
  startsAt: toDateInput(coupon.startsAt),
  expiresAt: toDateInput(coupon.expiresAt),
  discountType: coupon.discountType === "percent" ? "percent" : "fixed",
  amount: coupon.amount ? String(coupon.amount) : "",
  minSpend: coupon.minSpend ? String(coupon.minSpend) : "",
  usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
  active: Boolean(coupon.active),
  bannerImageUrl: coupon.bannerImageUrl || "",
} : {
  ...emptyForm,
  active: Boolean(canManageStatus),
};

const validateFile = (file, isId) => {
  if (!["image/png", "image/jpeg"].includes(file?.type)) {
    return isId ? "Banner harus berformat PNG atau JPG." : "Banner must be a PNG or JPG image.";
  }
  if (file.size > 2 * 1024 * 1024) {
    return isId ? "Ukuran banner maksimal 2MB." : "Banner image must be 2MB or smaller.";
  }
  return "";
};

export default function Seller2026CouponDrawer({
  open,
  coupon,
  canManageStatus,
  isSubmitting,
  isId: propIsId,
  onClose,
  onSubmit,
}) {
  const { i18n } = useTranslation();
  const isId = propIsId !== undefined ? Boolean(propIsId) : String(i18n?.language || "").toLowerCase().startsWith("id");
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(() => createForm(coupon, canManageStatus));
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(createForm(coupon, canManageStatus));
    setErrors({});
    setUploading(false);
    setSubmitError("");
  }, [canManageStatus, coupon, open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting && !uploading) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose, open, uploading]);

  if (!open) return null;

  const isEdit = Boolean(coupon?.id);
  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
  };

  const uploadBanner = async (file) => {
    if (!file) return;
    const fileError = validateFile(file, isId);
    if (fileError) {
      setErrors((current) => ({ ...current, bannerImageUrl: fileError }));
      return;
    }
    setUploading(true);
    setErrors((current) => ({ ...current, bannerImageUrl: "" }));
    try {
      const url = await uploadSellerCouponBannerImage(file);
      updateField("bannerImageUrl", url);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        bannerImageUrl: error?.response?.data?.message || error?.message || (isId ? "Gagal mengunggah banner." : "Unable to upload banner."),
      }));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const validate = () => {
    const next = {};
    const campaignName = form.campaignName.trim();
    const code = form.code.trim();
    const amount = Number(form.amount);
    const minSpend = Number(form.minSpend || 0);

    if (!campaignName) {
      next.campaignName = isId ? "Nama kampanye wajib diisi." : "Campaign Name is required.";
    }
    if (!code) {
      next.code = isId ? "Kode kupon wajib diisi." : "Campaign Code is required.";
    } else if (/\s/.test(code)) {
      next.code = isId ? "Kode kupon tidak boleh ada spasi." : "Campaign Code cannot contain spaces.";
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      next.amount = isId ? "Diskon harus lebih dari 0." : "Discount must be greater than 0.";
    } else if (form.discountType === "percent" && amount > 100) {
      next.amount = isId ? "Persentase diskon maksimal 100%." : "Percentage must be between 1 and 100.";
    }
    if (!Number.isFinite(minSpend) || minSpend < 0) {
      next.minSpend = isId ? "Minimal belanja harus 0 atau lebih." : "Minimum Amount must be 0 or greater.";
    }
    if (form.startsAt && form.expiresAt && new Date(form.expiresAt) < new Date(form.startsAt)) {
      next.expiresAt = isId ? "Tanggal berakhir harus setelah tanggal mulai." : "End date must be on or after the start date.";
    }
    if (uploading) {
      next.bannerImageUrl = isId ? "Tunggu proses unggah banner selesai." : "Wait for the banner upload to finish.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitError("");
    try {
      await onSubmit({
        campaignName: form.campaignName.trim(),
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        amount: Number(form.amount),
        minSpend: Number(form.minSpend || 0),
        active: canManageStatus ? Boolean(form.active) : Boolean(coupon?.active),
        bannerImageUrl: form.bannerImageUrl || null,
        startsAt: form.startsAt ? new Date(`${form.startsAt}T00:00:00`).toISOString() : null,
        expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
      });
    } catch (error) {
      setSubmitError(error?.message || (isId ? "Gagal menyimpan kupon." : "Unable to save coupon."));
    }
  };

  const bannerUrl = resolveAssetUrl(form.bannerImageUrl);
  const blocked = isSubmitting || uploading;

  return (
    <div className="s26-coupon-drawer" role="dialog" aria-modal="true" aria-labelledby="s26-coupon-drawer-title">
      <button className="s26-coupon-drawer__backdrop" type="button" aria-label={isId ? "Tutup drawer kupon" : "Close coupon drawer"} disabled={blocked} onClick={onClose} />
      <form className="s26-coupon-drawer__panel" noValidate onSubmit={handleSubmit}>
        <header>
          <div>
            <h2 id="s26-coupon-drawer-title">{isEdit ? (isId ? "Edit Kupon" : "Edit Coupon") : (isId ? "Tambah Kupon" : "Add Coupon")}</h2>
            <p>{isEdit ? (isId ? "Perbarui informasi kupon diskon toko." : "Update this store discount campaign.") : (isId ? "Buat kupon diskon baru untuk toko Anda." : "Create a new discount coupon for your store.")}</p>
          </div>
          <button type="button" aria-label={isId ? "Tutup drawer" : "Close drawer"} disabled={blocked} onClick={onClose}><X size={20} /></button>
        </header>

        <div className="s26-coupon-drawer__body">
          <section className="s26-coupon-banner">
            <div>
              <strong>{isId ? "Banner Kupon" : "Coupon Banner"} <span>({isId ? "opsional" : "optional"})</span></strong>
              <small>{isId ? "Mendukung file PNG / JPG (Maks 2MB)." : "PNG/JPG files are supported (Max 2MB)."}</small>
            </div>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" hidden onChange={(event) => uploadBanner(event.target.files?.[0])} />
            <button
              type="button"
              className={errors.bannerImageUrl ? "has-error" : ""}
              disabled={blocked}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                uploadBanner(event.dataTransfer.files?.[0]);
              }}
            >
              {bannerUrl ? <img src={bannerUrl} alt="Coupon banner preview" /> : <ImagePlus size={38} />}
              <strong>{uploading ? (isId ? "Mengunggah gambar..." : "Uploading image...") : bannerUrl ? (isId ? "Ganti gambar banner" : "Replace banner image") : (isId ? "Tarik & lepas gambar banner di sini" : "Drag and drop an image here")}</strong>
              <span>{bannerUrl ? (isId ? "Klik untuk mengganti gambar" : "Click to browse for a replacement") : (isId ? "atau klik untuk memilih file" : "or click to browse")}</span>
              <small>{isId ? "Rekomendasi rasio 16:9 (1200 x 628px)" : "Recommended 1200 x 628px (16:9)"}</small>
            </button>
            {bannerUrl ? <button type="button" className="s26-coupon-banner__remove" disabled={blocked} onClick={() => updateField("bannerImageUrl", "")}>{isId ? "Hapus banner" : "Remove banner"}</button> : null}
            {errors.bannerImageUrl ? <em>{errors.bannerImageUrl}</em> : null}
          </section>

          <div className="s26-coupon-form-grid">
            <label className={errors.campaignName ? "has-error" : ""}>
              <span>{isId ? "Nama Kampanye *" : "Campaign Name *"}</span>
              <input value={form.campaignName} disabled={blocked} placeholder={isId ? "Masukkan nama kampanye" : "Enter campaign name"} onChange={(event) => updateField("campaignName", event.target.value)} />
              {errors.campaignName ? <em>{errors.campaignName}</em> : null}
            </label>
            <label className={errors.code ? "has-error" : ""}>
              <span>{isId ? "Kode Kupon *" : "Campaign Code *"}</span>
              <input value={form.code} disabled={blocked} placeholder={isId ? "KODE KUPON" : "CAMPAIGN CODE"} onChange={(event) => updateField("code", event.target.value.toUpperCase().replace(/\s+/g, ""))} />
              {errors.code ? <em>{errors.code}</em> : null}
            </label>

            <fieldset className="s26-coupon-validity">
              <legend>{isId ? "Periode Kupon" : "Coupon Validity"}</legend>
              <label><span>{isId ? "Tanggal Mulai" : "Start Date"}</span><input type="date" value={form.startsAt} disabled={blocked} onChange={(event) => updateField("startsAt", event.target.value)} /></label>
              <label className={errors.expiresAt ? "has-error" : ""}><span>{isId ? "Tanggal Berakhir" : "End Date"}</span><input type="date" value={form.expiresAt} disabled={blocked} onChange={(event) => updateField("expiresAt", event.target.value)} />{errors.expiresAt ? <em>{errors.expiresAt}</em> : null}</label>
            </fieldset>

            <div className="s26-coupon-form-field">
              <span>{isId ? "Tipe Diskon" : "Discount Type"}</span>
              <div className="s26-coupon-segmented">
                <button type="button" className={form.discountType === "fixed" ? "is-active" : ""} disabled={blocked} onClick={() => updateField("discountType", "fixed")}>{isId ? "Nominal Tetap" : "Fixed"}</button>
                <button type="button" className={form.discountType === "percent" ? "is-active" : ""} disabled={blocked} onClick={() => updateField("discountType", "percent")}>{isId ? "Persentase" : "Percentage"}</button>
              </div>
            </div>
            <label className={errors.amount ? "has-error" : ""}>
              <span>{isId ? "Nilai Diskon *" : "Discount *"}</span>
              <div className="s26-coupon-affix"><b>{form.discountType === "fixed" ? "Rp" : "%"}</b><input type="number" min="0" max={form.discountType === "percent" ? 100 : undefined} value={form.amount} disabled={blocked} placeholder="0" onChange={(event) => updateField("amount", event.target.value)} /></div>
              <small>{form.discountType === "fixed" ? (isId ? "Nominal potongan harga" : "Fixed discount amount") : (isId ? "Persentase diskon 1-100%" : "Value from 1 to 100%")}</small>
              {errors.amount ? <em>{errors.amount}</em> : null}
            </label>
            <label className={errors.minSpend ? "has-error" : ""}>
              <span>{isId ? "Minimal Belanja" : "Minimum Spend"}</span>
              <div className="s26-coupon-affix"><b>Rp</b><input type="number" min="0" value={form.minSpend} disabled={blocked} placeholder="0" onChange={(event) => updateField("minSpend", event.target.value)} /></div>
              {errors.minSpend ? <em>{errors.minSpend}</em> : null}
            </label>
            <label>
              <span>{isId ? "Target Pelanggan" : "Audience / Scope"}</span>
              <select value={form.audience} disabled={blocked} onChange={(event) => updateField("audience", event.target.value)}>
                <option value="all">{isId ? "Semua Produk · Semua Pelanggan" : "All Products · All Customers"}</option>
              </select>
            </label>
            <label>
              <span>{isId ? "Batas Penggunaan" : "Usage Limit"}</span>
              <input type="number" min="0" value={form.usageLimit} disabled={blocked} placeholder={isId ? "Kosongkan jika tanpa batas" : "Leave empty for unlimited"} onChange={(event) => updateField("usageLimit", event.target.value)} />
            </label>
            <div className="s26-coupon-form-field">
              <span>{isId ? "Status Kupon" : "Status"}</span>
              <div className="s26-coupon-segmented">
                <button type="button" className={form.active ? "is-active" : ""} disabled={blocked || !canManageStatus} onClick={() => updateField("active", true)}>{isId ? "Aktif" : "Active"}</button>
                <button type="button" className={!form.active ? "is-active" : ""} disabled={blocked || !canManageStatus} onClick={() => updateField("active", false)}>{isId ? "Nonaktif" : "Inactive"}</button>
              </div>
            </div>
            <label className="is-full">
              <span>{isId ? "Catatan Internal (opsional)" : "Notes (optional)"}</span>
              <textarea rows={3} value={form.notes} disabled={blocked} placeholder={isId ? "Tambahkan catatan internal bila perlu..." : "Add notes for internal reference..."} onChange={(event) => updateField("notes", event.target.value)} />
            </label>
          </div>

          {submitError ? <div className="s26-coupon-form-error">{submitError}</div> : null}
        </div>

        <footer>
          <button type="button" disabled={blocked} onClick={onClose}>{isId ? "Batal" : "Cancel"}</button>
          <button type="submit" className="is-primary" disabled={blocked}>{isSubmitting ? (isId ? "Menyimpan..." : "Saving...") : isEdit ? (isId ? "Simpan Perubahan" : "Update Coupon") : (isId ? "Buat Kupon" : "Create Coupon")}</button>
        </footer>
      </form>
    </div>
  );
}
