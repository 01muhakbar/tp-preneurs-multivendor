import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  ExternalLink,
  Eye,
  Image,
  Info,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
  Upload,
} from "lucide-react";
import { SELLER_2026_MUTATIONS } from "../../api/seller2026/mutation-flags.ts";
import { uploadSellerStoreProfileImage } from "../../api/sellerStoreProfile.ts";
import { hasSeller2026Permission } from "../../api/seller2026/permissions.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { useSeller2026StoreProfile } from "../../hooks/seller2026/useSeller2026StoreProfile.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getCityOptions, getDistrictOptions, getProvinceOptions } from "../../utils/idRegions.ts";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/SellerWorkspace2026.css";

const emptyToNull = (value) => String(value || "").trim() || null;
const display = (value, fallback, isId = false) =>
  String(value || "").trim() || (fallback || (isId ? "Belum diisi" : "Not provided"));

const translateProfileStatus = (status, isId = false) => {
  if (!isId) return status;
  switch (String(status).trim()) {
    case "Active":
      return "Aktif";
    case "Inactive":
      return "Nonaktif";
    case "Ready":
      return "Siap";
    case "Editable":
      return "Dapat Diedit";
    case "Read only":
      return "Hanya Baca";
    case "Public Ready":
      return "Publik Siap";
    default:
      return status;
  }
};

const translateTileLabel = (label, isId = false) => {
  if (!isId) return label;
  switch (String(label).trim()) {
    case "Public Profile":
      return "Profil Publik";
    case "Payment Setup":
      return "Pengaturan Pembayaran";
    case "Shipping Origin":
      return "Asal Pengiriman";
    case "Storefront Visibility":
      return "Visibilitas Etalase";
    default:
      return label;
  }
};

const translateTileStatus = (status, isId = false) => {
  if (!isId) return status;
  switch (String(status).trim()) {
    case "Ready":
      return "Siap";
    case "Needs info":
      return "Perlu info";
    case "Needs review":
      return "Perlu tinjauan";
    case "Unlocked":
      return "Terbuka";
    case "Locked":
      return "Terkunci";
    default:
      return status;
  }
};

const translateTileNote = (note, isId = false) => {
  if (!isId || !note) return note;
  const str = String(note).trim();
  switch (str) {
    case "Public information complete":
      return "Informasi publik lengkap";
    case "Ready for checkout":
      return "Siap untuk checkout";
    case "Pickup origin ready":
      return "Asal penjemputan siap";
    case "Visible to buyers":
      return "Tampil untuk pembeli";
    case "Activation required":
      return "Aktivasi diperlukan";
    case "Setup incomplete":
      return "Pengaturan belum lengkap";
    default:
      if (/^\d+\s+items?\s+missing$/i.test(str)) {
        return str.replace(/^(\d+)\s+items?\s+missing$/i, "$1 item belum lengkap");
      }
      return str;
  }
};

const translateMissingFieldLabel = (label, isId = false) => {
  if (!isId || !label) return label;
  switch (String(label).trim()) {
    case "Address":
      return "Alamat";
    case "Address line 2":
      return "Baris alamat 2";
    case "Banner image":
      return "Gambar banner";
    case "City":
      return "Kota";
    case "Country":
      return "Negara";
    case "Description":
      return "Deskripsi";
    case "Store email":
      return "Email toko";
    case "Instagram":
      return "Instagram";
    case "Logo image":
      return "Gambar logo";
    case "Phone":
      return "Telepon";
    case "Postal code":
      return "Kode pos";
    case "Province":
      return "Provinsi";
    case "TikTok":
      return "TikTok";
    case "Website":
      return "Situs Web";
    case "WhatsApp":
      return "WhatsApp";
    default:
      return label;
  }
};

function Pill({ children, tone = "neutral" }) {
  return <span className={`seller2026-pill seller2026-pill--${tone}`}>{children}</span>;
}

function Field({ label, multiline = false, required = false, children, ...props }) {
  return (
    <label className="seller2026-profile-field">
      <span>
        {label}
        {required && <span style={{ color: "#ef4444", fontWeight: "bold", marginLeft: "4px" }}>*</span>}
      </span>
      {children ||
        (multiline ? <textarea {...props} /> : <input {...props} />)}
    </label>
  );
}

function ProfileSkeleton({ isId = false }) {
  return (
    <div className="seller2026-dashboard seller2026-profile" aria-label={isId ? "Memuat profil toko" : "Loading store profile"}>
      <div className="seller2026-skeleton" />
      <div className="seller2026-profile__grid">
        <div className="seller2026-skeleton seller2026-skeleton--hero" />
        <div className="seller2026-skeleton seller2026-skeleton--hero" />
      </div>
    </div>
  );
}

export default function Seller2026LiveStorefrontPage() {
  const location = useLocation();
  const { storeSlug } = useParams();
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const {
    sellerContext,
    workspaceStoreId: storeId,
    workspaceStoreSlug,
    workspaceRoutes,
    refetchSellerContext,
    isId = false,
  } = useSellerWorkspaceRoute();
  const { can, permissions, sourceAvailable } = getSeller2026PagePermissions(sellerContext);
  const canView = can("STORE_PROFILE_READ");
  const canUpdate =
    sourceAvailable &&
    hasSeller2026Permission(permissions, "STORE_PROFILE_UPDATE") &&
    SELLER_2026_MUTATIONS.storeProfileUpdate;
  const profileQuery = useSeller2026StoreProfile(storeSlug || workspaceStoreSlug, storeId, {
    enabled: canView,
    canEdit: canUpdate,
    sellerContext,
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState(null);
  const [uploading, setUploading] = useState("");

  useEffect(() => {
    if (profileQuery.data?.form && (!editing || !form)) {
      setForm(profileQuery.data.form);
    }
  }, [editing, form, profileQuery.data]);

  useEffect(() => {
    if (location.hash === "#shipping-setup" && canUpdate) setEditing(true);
  }, [canUpdate, location.hash]);

  useEffect(() => {
    if (!editing || location.hash !== "#shipping-setup") return;
    const timer = window.setTimeout(
      () => document.getElementById("shipping-setup")?.scrollIntoView({ behavior: "smooth" }),
      50
    );
    return () => window.clearTimeout(timer);
  }, [editing, location.hash]);

  const data = profileQuery.data;
  const dirty = useMemo(
    () => Boolean(form && data?.form && JSON.stringify(form) !== JSON.stringify(data.form)),
    [data?.form, form]
  );
  const provinces = getProvinceOptions(form?.originProvince);
  const cities = getCityOptions(form?.originProvince, form?.originCity);
  const districts = getDistrictOptions(form?.originProvince, form?.originCity, form?.originDistrict);

  const addressProvinces = getProvinceOptions(form?.province);
  const addressCities = getCityOptions(form?.province, form?.city);
  const addressDistricts = getDistrictOptions(form?.province, form?.city, form?.district);

  const setValue = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const startEditing = () => {
    setNotice(null);
    setForm(data.form);
    setEditing(true);
  };
  const cancelEditing = () => {
    setNotice(null);
    setForm(data.form);
    setEditing(false);
  };
  const handleUpload = async (kind, file) => {
    if (!file) return;
    setUploading(kind);
    setNotice(null);
    try {
      const url = await uploadSellerStoreProfileImage(file);
      setForm((current) => ({ ...current, [`${kind}Url`]: url }));
    } catch (error) {
      setNotice({ type: "error", text: error?.message || (isId ? "Gagal mengunggah gambar." : "Image upload failed.") });
    } finally {
      setUploading("");
    }
  };
  const removeMedia = (kind) => {
    const mediaName = kind === "logo" ? (isId ? "logo" : "logo") : (isId ? "banner" : "banner");
    if (!window.confirm(isId ? `Hapus gambar ${mediaName} saat ini? Perubahan ini diterapkan setelah disimpan.` : `Remove the current ${kind} image? This change is applied after saving.`)) {
      return;
    }
    setForm((current) => ({ ...current, [`${kind}Url`]: "" }));
  };
  const handleSave = async (event) => {
    event.preventDefault();
    setNotice(null);
    try {
      await profileQuery.saveProfile({
        description: emptyToNull(form.description),
        logoUrl: emptyToNull(form.logoUrl),
        bannerUrl: emptyToNull(form.bannerUrl),
        addressLine1: emptyToNull(form.addressLine1),
        addressLine2: emptyToNull(form.addressLine2),
        district: emptyToNull(form.district),
        city: emptyToNull(form.city),
        province: emptyToNull(form.province),
        postalCode: emptyToNull(form.postalCode),
        country: emptyToNull(form.country),
        shippingSetup: {
          shippingEnabled: Boolean(form.shippingEnabled),
          originContactName: emptyToNull(form.originContactName),
          originPhone: emptyToNull(form.originPhone),
          originAddressLine1: emptyToNull(form.originAddressLine1),
          originAddressLine2: emptyToNull(form.originAddressLine2),
          originDistrict: emptyToNull(form.originDistrict),
          originCity: emptyToNull(form.originCity),
          originProvince: emptyToNull(form.originProvince),
          originPostalCode: emptyToNull(form.originPostalCode),
          originCountry: emptyToNull(form.originCountry) || "Indonesia",
          pickupNotes: emptyToNull(form.pickupNotes),
        },
      });
      await refetchSellerContext?.();
      setEditing(false);
      setNotice({ type: "success", text: isId ? "Profil toko berhasil diperbarui." : "Store profile updated successfully." });
    } catch (error) {
      const fieldErrors = error?.response?.data?.errors?.fieldErrors;
      const firstError = fieldErrors
        ? Object.values(fieldErrors).flat().find(Boolean)
        : null;
      setNotice({
        type: "error",
        text: firstError || error?.response?.data?.message || error?.message || (isId ? "Gagal menyimpan perubahan." : "Unable to save changes."),
      });
    }
  };

  if (!canView) {
    return <div className="seller2026-dashboard"><div className="seller2026-error"><ShieldCheck size={18} />{isId ? "Anda tidak memiliki izin untuk melihat profil toko ini." : "You do not have permission to view this store profile."}</div></div>;
  }
  if (profileQuery.isLoading || !data || !form) return <ProfileSkeleton isId={isId} />;
  if (profileQuery.isError) {
    return <div className="seller2026-dashboard"><div className="seller2026-error"><AlertTriangle size={18} />{isId ? "Profil toko tidak dapat dimuat." : "Store profile could not be loaded."}<button onClick={profileQuery.refetch}>{isId ? "Coba Lagi" : "Retry"}</button></div></div>;
  }

  return (
    <div className="seller2026-dashboard seller2026-profile">
      <header className="seller2026-card seller2026-profile__header">
        <div>
          <span className="seller2026-profile__eyebrow">{isId ? "Profil Toko" : "Store Profile"}</span>
          <h1>{editing ? (isId ? "Edit Detail Toko" : "Edit Store Details") : (isId ? "Profil Toko" : "Store Profile")}</h1>
          <p>{editing ? (isId ? "Perbarui info publik, kontak, alamat, dan asal pengiriman." : "Update public info, contact, address, and shipping origin.") : (isId ? "Ringkasan toko dan status konfigurasi Anda." : "Overview of your store and setup status.")}</p>
        </div>
        <div className="seller2026-profile__header-actions">
          <Pill tone="success">{translateProfileStatus(data.status, isId)}</Pill>
          <Pill tone="success">{data.readiness.percent === 100 ? (isId ? "Siap" : "Ready") : (isId ? `${data.readiness.percent}% Siap` : `${data.readiness.percent}% Ready`)}</Pill>
          {editing ? (
            <>
              <button className="seller2026-profile-button" type="button" onClick={cancelEditing}>{isId ? "Batal" : "Cancel"}</button>
              <button className="seller2026-profile-button seller2026-profile-button--primary" form="seller2026-profile-form" disabled={!dirty || profileQuery.isSaving || Boolean(uploading)}>
                <Save size={15} /> {profileQuery.isSaving ? (isId ? "Menyimpan..." : "Saving...") : (isId ? "Simpan" : "Save")}
              </button>
            </>
          ) : (
            <Pill tone="info">{canUpdate ? (isId ? "Dapat Diedit" : "Editable") : (isId ? "Hanya Baca" : "Read only")}</Pill>
          )}
        </div>
      </header>

      {notice ? (
        <div className={`seller2026-profile__notice seller2026-profile__notice--${notice.type}`} role="status">
          {notice.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          {notice.text}
        </div>
      ) : null}

      {editing ? (
        <form id="seller2026-profile-form" onSubmit={handleSave}>
          <div className="seller2026-profile__admin-note"><Info size={15} />{isId ? "Nama toko, slug, dan status dikelola oleh admin." : "Store name, slug, and status are managed by admin."}</div>
          <nav className="seller2026-profile__tabs" aria-label={isId ? "Bagian profil" : "Profile sections"}>
            {[
              ["Media", isId ? "Media" : "Media"],
              ["Store Identity", isId ? "Identitas Toko" : "Store Identity"],
              ["Owner Information", isId ? "Informasi Pemilik" : "Owner Information"],
              ["Business Details", isId ? "Detail Bisnis" : "Business Details"],
              ["Contact", isId ? "Kontak" : "Contact"],
              ["Address", isId ? "Alamat" : "Address"],
              ["Shipping", isId ? "Pengiriman" : "Shipping"],
            ].map(([idLabel, label]) => (
              <a key={idLabel} href={`#${idLabel.toLowerCase().replace(/ /g, "-")}`}>{label}</a>
            ))}
          </nav>

          <section className="seller2026-profile__media-grid" id="media">
            {[
              ["logo", isId ? "Gambar Logo" : "Logo Image", form.logoUrl, logoInputRef, Image],
              ["banner", isId ? "Gambar Banner" : "Banner Image", form.bannerUrl, bannerInputRef, Image],
            ].map(([kind, label, value, inputRef, Icon]) => (
              <div className="seller2026-card seller2026-profile__media-card" key={kind}>
                <header><strong>{label}</strong><Pill tone="success">{value ? (isId ? "Media Siap" : "Media Ready") : (isId ? "Perlu gambar" : "Needs image")}</Pill></header>
                <div className={`seller2026-profile__media-preview seller2026-profile__media-preview--${kind}`}>
                  {value ? <img src={resolveAssetUrl(value)} alt={`${data.name} ${kind}`} /> : <Icon size={28} />}
                </div>
                <Field label={`${label.replace(" Image", "").replace("Gambar ", "")} URL`} value={value} onChange={setValue(`${kind}Url`)} />
                <div className="seller2026-profile__media-actions">
                  <input ref={inputRef} hidden type="file" accept="image/*" onChange={(event) => handleUpload(kind, event.target.files?.[0])} />
                  <button className="seller2026-profile-button" type="button" onClick={() => inputRef.current?.click()} disabled={Boolean(uploading)}>
                    <Upload size={14} />{uploading === kind ? (isId ? "Mengunggah..." : "Uploading...") : (isId ? (kind === "logo" ? "Ganti Logo" : "Ganti Banner") : `Replace ${kind === "logo" ? "Logo" : "Banner"}`)}
                  </button>
                  <button className="seller2026-profile-button seller2026-profile-button--danger" type="button" onClick={() => removeMedia(kind)} disabled={!value}>
                    <Trash2 size={14} />{isId ? "Hapus" : "Remove"}
                  </button>
                </div>
              </div>
            ))}
          </section>

          <div className="seller2026-profile__form-grid">
            <section className="seller2026-card seller2026-profile__form-card" id="store-identity">
              <h2>{isId ? "Identitas Toko" : "Store Identity"}</h2>
              <Field required label={isId ? "Nama Toko" : "Store Name"} value={data.name} disabled />
              <Field required label={isId ? "Slug Toko" : "Store Slug"} value={data.slug} disabled />
              <Field required label={isId ? "Kategori Bisnis" : "Business Category"}>
                <select value={form.category} onChange={setValue("category")}>
                  <option value="">{isId ? "Pilih kategori" : "Select category"}</option>
                  {["Fashion & Apparel", "Food & Beverage", "Beauty & Personal Care", "Home & Living", "Electronics", "Services", "Other"].map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </Field>
              <Field required label={isId ? "Deskripsi Singkat" : "Short Description"} multiline rows={4} maxLength={200} value={form.description} onChange={setValue("description")} placeholder={isId ? "Jelaskan toko, produk, dan apa yang membuat brand Anda istimewa." : "Describe your store, products, and what makes your brand special."} />
            </section>
            <section className="seller2026-card seller2026-profile__form-card" id="contact">
              <h2>{isId ? "Kontak" : "Contact"}</h2>
              <div className="seller2026-profile__fields-two">
                <Field required label={isId ? "Email Toko" : "Store Email"} type="email" value={form.email} onChange={setValue("email")} />
                <Field required label={isId ? "Telepon" : "Phone"} value={form.phone} onChange={setValue("phone")} />
              </div>
              <Field label="WhatsApp" value={form.whatsapp} onChange={setValue("whatsapp")} />
              <div className="seller2026-profile__fields-two">
                <Field label="Website URL" type="url" value={form.websiteUrl} onChange={setValue("websiteUrl")} />
                <Field label="Instagram URL" type="url" value={form.instagramUrl} onChange={setValue("instagramUrl")} />
              </div>
              <Field label="TikTok URL" type="url" value={form.tiktokUrl} onChange={setValue("tiktokUrl")} />
            </section>
            <section className="seller2026-card seller2026-profile__form-card" id="address">
              <h2>{isId ? "Alamat" : "Address"}</h2>
              <div className="seller2026-profile__fields-two">
                <Field required label={isId ? "Baris Alamat 1" : "Address Line 1"} value={form.addressLine1} onChange={setValue("addressLine1")} />
                <Field label={isId ? "Baris Alamat 2" : "Address Line 2"} value={form.addressLine2} onChange={setValue("addressLine2")} placeholder={isId ? "Opsional" : "Optional"} />

                <Field required label={isId ? "Provinsi" : "Province"}>
                  <select value={form.province} onChange={(event) => setForm((current) => ({ ...current, province: event.target.value, city: "", district: "" }))}>
                    <option value="">{isId ? "Pilih provinsi" : "Select province"}</option>{addressProvinces.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field required label={isId ? "Kota/Kabupaten" : "City/Regency"}>
                  <select value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value, district: "" }))}>
                    <option value="">{isId ? "Pilih kota/kabupaten" : "Select city/regency"}</option>{addressCities.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>

                <Field required label={isId ? "Kecamatan" : "Subdistrict"}>
                  <select value={form.district} onChange={setValue("district")}>
                    <option value="">{isId ? "Pilih kecamatan" : "Select subdistrict"}</option>{addressDistricts.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label={isId ? "Kode Pos" : "Postal Code"} value={form.postalCode} onChange={setValue("postalCode")} />

                <Field required label={isId ? "Negara" : "Country"} value={form.country} onChange={setValue("country")} />
                <div />
              </div>
            </section>
          </div>

          <section className="seller2026-card seller2026-profile__form-card seller2026-profile__form-card--full" id="shipping">
            <h2>{isId ? "Asal Pengiriman" : "Shipping Origin"}</h2>
            <div className="seller2026-profile__fields-two">
              <Field label={isId ? "Mode Pengiriman" : "Shipping Mode"}>
                <select value={form.shippingEnabled ? "enabled" : "disabled"} onChange={(event) => setForm((current) => ({ ...current, shippingEnabled: event.target.value === "enabled" }))}>
                  <option value="enabled">{isId ? "Aktif" : "Enabled"}</option><option value="disabled">{isId ? "Nonaktif" : "Disabled"}</option>
                </select>
              </Field>
              <div />
              <Field required={form.shippingEnabled} label={isId ? "Provinsi Asal" : "Origin Province"}>
                <select value={form.originProvince} onChange={(event) => setForm((current) => ({ ...current, originProvince: event.target.value, originCity: "", originDistrict: "" }))}>
                  <option value="">{isId ? "Pilih provinsi" : "Select province"}</option>{provinces.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field required={form.shippingEnabled} label={isId ? "Kota/Kabupaten Asal" : "Origin City/Regency"}>
                <select value={form.originCity} onChange={(event) => setForm((current) => ({ ...current, originCity: event.target.value, originDistrict: "" }))}>
                  <option value="">{isId ? "Pilih kota/kabupaten" : "Select city/regency"}</option>{cities.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field required={form.shippingEnabled} label={isId ? "Kecamatan Asal" : "Origin Subdistrict"}>
                <select value={form.originDistrict} onChange={setValue("originDistrict")}>
                  <option value="">{isId ? "Pilih kecamatan" : "Select subdistrict"}</option>{districts.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field required={form.shippingEnabled} label={isId ? "Kode Pos Asal" : "Origin Postal Code"} value={form.originPostalCode} onChange={setValue("originPostalCode")} />
              <Field required={form.shippingEnabled} label={isId ? "Baris Alamat Asal 1" : "Origin Address Line 1"} value={form.originAddressLine1} onChange={setValue("originAddressLine1")} />
              <Field label={isId ? "Baris Alamat Asal 2" : "Origin Address Line 2"} value={form.originAddressLine2} onChange={setValue("originAddressLine2")} placeholder={isId ? "Opsional" : "Optional"} />
              <Field required={form.shippingEnabled} label={isId ? "Nama Kontak Asal" : "Origin Contact Name"} value={form.originContactName} onChange={setValue("originContactName")} />
              <Field required={form.shippingEnabled} label={isId ? "Telepon Asal" : "Origin Phone"} value={form.originPhone} onChange={setValue("originPhone")} />
              <Field required={form.shippingEnabled} label={isId ? "Negara Asal" : "Origin Country"} value={form.originCountry} onChange={setValue("originCountry")} />
              <Field label={isId ? "Catatan Penjemputan" : "Pickup Notes"} multiline rows={2} value={form.pickupNotes} onChange={setValue("pickupNotes")} />
            </div>
          </section>
        </form>
      ) : (
        <>
          <div className="seller2026-profile__grid">
            <main className="seller2026-profile__main">
              <section className="seller2026-card seller2026-profile__readiness">
                <h2>{isId ? "Kesiapan Toko" : "Store Readiness"}</h2>
                <div className="seller2026-profile__readiness-content">
                  <div className="seller2026-profile__ring" style={{ "--profile-progress": `${data.readiness.percent * 3.6}deg` }}>
                    <div><strong>{data.readiness.percent}%</strong><span>{isId ? "Siap" : "Ready"}</span></div>
                  </div>
                  <div className="seller2026-profile__readiness-copy"><strong>{data.readiness.percent === 100 ? (isId ? "Siap beroperasi!" : "Ready to go!") : (isId ? "Hampir selesai!" : "Halfway there!")}</strong><span>{data.readiness.missingCount ? (isId ? "Lengkapi item yang kurang untuk mulai beroperasi." : "Complete the missing items to go live.") : (isId ? "Profil publik Anda sudah lengkap." : "Your public profile is complete.")}</span></div>
                  <div className="seller2026-profile__readiness-tiles">
                    {data.readiness.tiles.map((tile) => (
                      <div className={`seller2026-profile__readiness-tile is-${tile.tone}`} key={tile.key}>
                        <span>{tile.key === "payment" ? <CreditCard size={17} /> : tile.key === "shipping" ? <Truck size={17} /> : tile.key === "visibility" ? <Store size={17} /> : <CircleUserRound size={17} />}</span>
                        <div><strong>{translateTileLabel(tile.label, isId)}</strong><small>{translateTileNote(tile.note, isId)}</small></div>
                        <Pill tone={tile.tone}>{translateTileStatus(tile.status, isId)}</Pill>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="seller2026-card seller2026-profile__buyer">
                <h2><Eye size={17} />{isId ? "Tampilan di Mata Pembeli" : "What Buyers See"}</h2>
                <div className="seller2026-profile__banner">
                  {data.bannerUrl ? <img src={resolveAssetUrl(data.bannerUrl)} alt={`${data.name} banner`} /> : <div><Image size={30} />{isId ? "Tambahkan gambar banner" : "Add a banner image"}</div>}
                </div>
                <div className="seller2026-profile__identity">
                  <div className="seller2026-profile__logo">{data.logoUrl ? <img src={resolveAssetUrl(data.logoUrl)} alt={`${data.name} logo`} /> : <Store size={24} />}</div>
                  <div><h3>{data.name} <Pill tone="success">{isId ? "Publik Siap" : "Public Ready"}</Pill></h3><a href={data.websiteUrl || data.publicUrl || "#"} target="_blank" rel="noreferrer">{display(data.websiteUrl, data.slug, isId)} <ExternalLink size={13} /></a></div>
                  {data.publicUrl ? <a className="seller2026-profile-button seller2026-profile-button--primary" href={data.publicUrl} target="_blank" rel="noreferrer">{isId ? "Lihat Etalase" : "View Storefront"} <ExternalLink size={14} /></a> : null}
                </div>
                <div className="seller2026-profile__buyer-details">
                  <div><strong><Mail size={15} />{isId ? "Kontak" : "Contact"}</strong><span>{display(data.contact.email, null, isId)}</span><span>{display(data.contact.phone, null, isId)}</span><span>{display(data.contact.whatsapp, null, isId)}</span></div>
                  <div><strong><MapPin size={15} />{isId ? "Lokasi" : "Location"}</strong><span>{display(data.address.formatted, null, isId)}</span></div>
                </div>
              </section>

              <section className="seller2026-card seller2026-profile__edit-callout">
                <Pencil size={18} /><div><h2>{isId ? "Edit Detail Toko" : "Edit Store Details"}</h2><p>{isId ? "Perbarui informasi publik, kontak, alamat, dan asal pengiriman Anda." : "Update your public information, contact, address, and shipping origin."}</p></div>
                <button className="seller2026-profile-button seller2026-profile-button--primary" disabled={!canUpdate} onClick={startEditing}><Pencil size={14} />{isId ? "Edit Profil" : "Edit Profile"}</button>
              </section>
            </main>

            <aside className="seller2026-profile__side">
              <section className="seller2026-card seller2026-profile__side-card">
                <h2><ShieldCheck size={18} />{isId ? "Dikelola Admin" : "Admin Managed"}</h2>
                <p>{isId ? "Nama toko, slug, dan status dikelola oleh admin." : "Store name, slug, and status are managed by admin."}</p>
                <div><Pill>{isId ? "Nama" : "Name"}</Pill><Pill>Slug</Pill><Pill>Status</Pill></div>
              </section>
              <section className="seller2026-card seller2026-profile__side-card">
                <h2><Building2 size={18} />{isId ? "Kolom yang Belum Lengkap" : "Missing Fields"}</h2>
                <div className="seller2026-profile__missing">
                  {data.readiness.missingFields.length ? data.readiness.missingFields.map((field) => <div key={field.key}><span>{translateMissingFieldLabel(field.label, isId)}</span><Pill tone="warning">{isId ? "Belum diisi" : "Missing"}</Pill></div>) : <p>{isId ? "Semua kolom publik yang wajib diisi telah lengkap." : "All required public fields are complete."}</p>}
                </div>
              </section>
              <section className="seller2026-card seller2026-profile__side-card">
                <header><h2><Truck size={18} />{isId ? "Pengaturan Pengiriman" : "Shipping Setup"}</h2><Pill tone={data.shipping.ready ? "success" : "warning"}>{translateTileStatus(data.shipping.status, isId)}</Pill></header>
                <dl>
                  <div><dt>{isId ? "Kontak Penjemputan" : "Pickup Contact"}</dt><dd>{display(data.shipping.originContactName, null, isId)}</dd></div>
                  <div><dt>{isId ? "Telepon" : "Phone"}</dt><dd>{display(data.shipping.originPhone, null, isId)}</dd></div>
                  <div><dt>{isId ? "Alamat Penjemputan" : "Pickup Address"}</dt><dd>{display(data.shipping.address, null, isId)}</dd></div>
                </dl>
                <Link to={workspaceRoutes.shippingSetup()}>{isId ? "Lihat detail pengiriman" : "View shipping details"} <ChevronRight size={16} /></Link>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
