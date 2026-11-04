import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Image as ImageIcon,
  Loader2,
  Percent,
  RefreshCw,
  Save,
  Sparkles,
  Tag,
  Ticket,
  Trash2,
  Upload,
} from "lucide-react";
import {
  fetchAdminCoupons,
  fetchAdminStoreCustomization,
  updateAdminStoreCustomization,
} from "../../lib/adminApi.js";
import { fileToDataUrl } from "../../utils/fileToDataUrl.js";
import { formatCurrency } from "../../utils/format.js";

const DEFAULT_OFFERS_ID = {
  pageHeader: {
    enabled: true,
    eyebrow: "MEGA OFFER & PROMO",
    pageTitle: "Mega Offer Eksklusif",
    description:
      "Dapatkan penawaran terbaik dan kupon diskon spesial untuk produk edukasi pilihan.",
    backgroundImageDataUrl: "",
  },
  superDiscount: {
    enabled: true,
    activeCouponCode: "ALL",
  },
  dealsSection: {
    enabled: true,
    title: "Koleksi Produk Diskon",
    description: "Jelajahi produk berkualitas dengan potongan harga menarik.",
  },
};

const DEFAULT_OFFERS_EN = {
  pageHeader: {
    enabled: true,
    eyebrow: "MEGA OFFER & PROMOTIONS",
    pageTitle: "Exclusive Mega Offer",
    description:
      "Discover the best limited-time deals and discount coupons for top educational products.",
    backgroundImageDataUrl: "",
  },
  superDiscount: {
    enabled: true,
    activeCouponCode: "ALL",
  },
  dealsSection: {
    enabled: true,
    title: "Special Discounted Deals",
    description: "Save big on student innovation works and digital learning products.",
  },
};

export default function AdminCampaignsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [lang, setLang] = useState("id");
  const [copiedPreviewCode, setCopiedPreviewCode] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const defaultForm = lang === "id" ? DEFAULT_OFFERS_ID : DEFAULT_OFFERS_EN;

  const [form, setForm] = useState(defaultForm);

  // Fetch admin customization for current language
  const customizationQuery = useQuery({
    queryKey: ["admin-store-customization", lang],
    queryFn: () => fetchAdminStoreCustomization(lang),
    staleTime: 30_000,
  });

  // Fetch platform coupons for selector
  const couponsQuery = useQuery({
    queryKey: ["admin-coupons-for-campaigns"],
    queryFn: () => fetchAdminCoupons({ page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  const availableCoupons = useMemo(() => {
    const raw = couponsQuery.data?.items ?? couponsQuery.data?.data?.items ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.filter((c) => c && c.code);
  }, [couponsQuery.data]);

  // Sync form when customization data loads or lang switches
  useEffect(() => {
    const remoteOffers =
      customizationQuery.data?.customization?.offers ||
      customizationQuery.data?.offers;

    if (remoteOffers) {
      setForm({
        pageHeader: {
          enabled:
            typeof remoteOffers.pageHeader?.enabled === "boolean"
              ? remoteOffers.pageHeader.enabled
              : defaultForm.pageHeader.enabled,
          eyebrow:
            remoteOffers.pageHeader?.eyebrow || defaultForm.pageHeader.eyebrow,
          pageTitle:
            remoteOffers.pageHeader?.pageTitle || defaultForm.pageHeader.pageTitle,
          description:
            remoteOffers.pageHeader?.description || defaultForm.pageHeader.description,
          backgroundImageDataUrl:
            remoteOffers.pageHeader?.backgroundImageDataUrl ||
            remoteOffers.pageHeader?.backgroundImage ||
            "",
        },
        superDiscount: {
          enabled:
            typeof remoteOffers.superDiscount?.enabled === "boolean"
              ? remoteOffers.superDiscount.enabled
              : defaultForm.superDiscount.enabled,
          activeCouponCode:
            remoteOffers.superDiscount?.activeCouponCode ||
            remoteOffers.superDiscount?.couponCode ||
            "ALL",
        },
        dealsSection: {
          enabled:
            typeof remoteOffers.dealsSection?.enabled === "boolean"
              ? remoteOffers.dealsSection.enabled
              : defaultForm.dealsSection.enabled,
          title:
            remoteOffers.dealsSection?.title || defaultForm.dealsSection.title,
          description:
            remoteOffers.dealsSection?.description || defaultForm.dealsSection.description,
        },
      });
    } else if (!customizationQuery.isLoading) {
      setForm(defaultForm);
    }
  }, [customizationQuery.data, customizationQuery.isLoading, lang]);

  // Selected coupon details for live preview
  const selectedCoupon = useMemo(() => {
    if (!form.superDiscount.activeCouponCode || form.superDiscount.activeCouponCode === "ALL") {
      return null;
    }
    return availableCoupons.find(
      (c) => c.code.toUpperCase() === form.superDiscount.activeCouponCode.toUpperCase()
    );
  }, [form.superDiscount.activeCouponCode, availableCoupons]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        offers: {
          pageHeader: {
            enabled: Boolean(form.pageHeader.enabled),
            eyebrow: String(form.pageHeader.eyebrow || "").trim(),
            pageTitle: String(form.pageHeader.pageTitle || "").trim(),
            description: String(form.pageHeader.description || "").trim(),
            backgroundImageDataUrl: String(form.pageHeader.backgroundImageDataUrl || "").trim(),
          },
          superDiscount: {
            enabled: Boolean(form.superDiscount.enabled),
            activeCouponCode: String(form.superDiscount.activeCouponCode || "ALL").trim().toUpperCase(),
            selectionStatus: form.superDiscount.activeCouponCode === "ALL" ? "all" : "valid",
            couponSnapshot: selectedCoupon
              ? {
                  code: selectedCoupon.code,
                  discountType: selectedCoupon.discountType || "percent",
                  amount: Number(selectedCoupon.amount) || 0,
                  minSpend: Number(selectedCoupon.minSpend) || 0,
                  scopeType: selectedCoupon.scopeType || "PLATFORM",
                  startsAt: selectedCoupon.startsAt || "",
                  expiresAt: selectedCoupon.expiresAt || "",
                }
              : null,
          },
          dealsSection: {
            enabled: Boolean(form.dealsSection.enabled),
            title: String(form.dealsSection.title || "").trim(),
            description: String(form.dealsSection.description || "").trim(),
          },
        },
        isPublished: true,
      };

      return updateAdminStoreCustomization(lang, payload);
    },
    onSuccess: () => {
      toast.success(
        lang === "id"
          ? "Pengaturan Campaigns & Mega Offer berhasil disimpan!"
          : "Campaigns & Mega Offer settings saved successfully!"
      );
      queryClient.invalidateQueries({ queryKey: ["admin-store-customization"] });
      queryClient.invalidateQueries({ queryKey: ["store-customization"] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === "id"
            ? "Gagal menyimpan pengaturan kampanye."
            : "Failed to save campaign settings.")
      );
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Hanya format JPG, PNG, atau WebP yang diperbolehkan.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Ukuran file maksimal 2 MB.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((prev) => ({
        ...prev,
        pageHeader: { ...prev.pageHeader, backgroundImageDataUrl: dataUrl },
      }));
    } catch {
      setUploadError("Gagal membaca file gambar.");
    }
  };

  const handleCopyPreview = () => {
    const code = selectedCoupon?.code || form.superDiscount.activeCouponCode;
    if (!code || code === "ALL") return;
    navigator.clipboard?.writeText(code);
    setCopiedPreviewCode(true);
    setTimeout(() => setCopiedPreviewCode(false), 2000);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Katalog</span>
            <span>/</span>
            <span className="text-[#fe6f05]">Campaigns & Offers</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#fe6f05]" />
            Campaigns & Mega Offer
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {lang === "id"
              ? "Kelola banner promosi Mega Offer, kupon unggulan, dan etalase diskon di halaman publik."
              : "Manage Mega Offer hero banner, featured coupons, and discounted deals in the storefront."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* External View Link */}
          <Link
            to="/offers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#034c85]" />
            <span>{lang === "id" ? "Lihat Halaman Live" : "View Live Offers"}</span>
          </Link>

          {/* Language Toggle */}
          <div className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setLang("id")}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition ${
                lang === "id"
                  ? "bg-[#034c85] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <Globe className="h-3 w-3" />
              ID
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition ${
                lang === "en"
                  ? "bg-[#034c85] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <Globe className="h-3 w-3" />
              EN
            </button>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#fe6f05] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#e05e00] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{lang === "id" ? "Simpan Perubahan" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {customizationQuery.isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#034c85]" />
            Memuat data kampanye...
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Configuration Columns (Left - 7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Card 1: Mega Offer Hero Banner */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#034c85]/10 text-[#034c85] dark:bg-[#034c85]/20 dark:text-sky-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {lang === "id" ? "Banner Mega Offer (Hero)" : "Mega Offer Hero Banner"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {lang === "id"
                        ? "Atur teks headline dan gambar latar belakang banner utama."
                        : "Configure headline text and background image for the main banner."}
                    </p>
                  </div>
                </div>

                {/* Enable toggle */}
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={form.pageHeader.enabled}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pageHeader: { ...prev.pageHeader, enabled: e.target.checked },
                      }))
                    }
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-[#034c85] peer-focus:outline-none dark:bg-slate-700"></div>
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>

              <div className="mt-4 space-y-4">
                {/* Eyebrow badge */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === "id" ? "Teks Eyebrow / Tag" : "Eyebrow / Badge Tag"}
                  </label>
                  <input
                    type="text"
                    value={form.pageHeader.eyebrow}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pageHeader: { ...prev.pageHeader, eyebrow: e.target.value },
                      }))
                    }
                    placeholder="e.g. MEGA OFFER & PROMO"
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#034c85] focus:bg-white focus:ring-1 focus:ring-[#034c85] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Judul Halaman */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === "id" ? "Judul Banner (Page Title)" : "Banner Title (Page Title)"}
                  </label>
                  <input
                    type="text"
                    value={form.pageHeader.pageTitle}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pageHeader: { ...prev.pageHeader, pageTitle: e.target.value },
                      }))
                    }
                    placeholder="e.g. Mega Offer Eksklusif"
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#034c85] focus:bg-white focus:ring-1 focus:ring-[#034c85] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Deskripsi Singkat */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === "id" ? "Deskripsi Singkat" : "Short Description"}
                  </label>
                  <textarea
                    rows={2}
                    value={form.pageHeader.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pageHeader: { ...prev.pageHeader, description: e.target.value },
                      }))
                    }
                    placeholder="e.g. Dapatkan penawaran terbaik dan kupon diskon spesial..."
                    className="mt-1.5 block w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#034c85] focus:bg-white focus:ring-1 focus:ring-[#034c85] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Background Image Upload & URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === "id" ? "Gambar Latar Banner (Opsional)" : "Banner Background Image (Optional)"}
                  </label>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {lang === "id"
                      ? "Disarankan rasio lebar (1920×600 px) dengan kontras yang baik. Maks 2MB."
                      : "Recommended wide ratio (1920×600 px). Max 2MB."}
                  </p>

                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#fe6f05]" />
                      <span>{lang === "id" ? "Unggah Gambar" : "Upload Image"}</span>
                    </button>

                    {form.pageHeader.backgroundImageDataUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            pageHeader: { ...prev.pageHeader, backgroundImageDataUrl: "" },
                          }))
                        }
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{lang === "id" ? "Hapus Gambar" : "Remove Image"}</span>
                      </button>
                    ) : null}
                  </div>

                  {uploadError ? (
                    <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                      {uploadError}
                    </p>
                  ) : null}

                  {/* Or Direct Image URL */}
                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={form.pageHeader.backgroundImageDataUrl}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          pageHeader: {
                            ...prev.pageHeader,
                            backgroundImageDataUrl: e.target.value,
                          },
                        }))
                      }
                      placeholder="Atau tempel URL gambar langsung (https://...)"
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none transition focus:border-[#034c85] focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Super Discount Active Voucher */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fe6f05]/10 text-[#fe6f05] dark:bg-[#fe6f05]/20">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {lang === "id" ? "Voucher Unggulan (Super Discount)" : "Featured Voucher (Super Discount)"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {lang === "id"
                        ? "Pilih kupon diskon platform yang ingin ditampilkan di banner penawaran."
                        : "Select platform voucher to highlight in the offers banner."}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={form.superDiscount.enabled}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        superDiscount: { ...prev.superDiscount, enabled: e.target.checked },
                      }))
                    }
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-[#fe6f05] peer-focus:outline-none dark:bg-slate-700"></div>
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === "id" ? "Pilih Kupon Unggulan" : "Select Featured Coupon"}
                  </label>
                  <select
                    value={form.superDiscount.activeCouponCode}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        superDiscount: {
                          ...prev.superDiscount,
                          activeCouponCode: e.target.value,
                        },
                      }))
                    }
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 outline-none transition focus:border-[#034c85] focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="ALL">
                      {lang === "id"
                        ? "ALL - Tampilkan Semua Voucher Aktif"
                        : "ALL - Display All Active Coupons"}
                    </option>
                    {availableCoupons.map((coupon) => (
                      <option key={coupon.id} value={coupon.code}>
                        {coupon.code} -{" "}
                        {coupon.discountType === "percent"
                          ? `Diskon ${coupon.amount}%`
                          : `Diskon ${formatCurrency(coupon.amount)}`}{" "}
                        {coupon.campaignName ? `(${coupon.campaignName})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {lang === "id"
                      ? "Kupon yang dipilih akan disorot dengan tombol salin cepat di banner penawaran."
                      : "The selected coupon will be featured with an instant copy button on the offers page."}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Deals Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <Percent className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {lang === "id" ? "Etalase Produk Promo (Deals)" : "Deals Catalog Section"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {lang === "id"
                        ? "Daftar produk dengan potongan harga otomatis dari katalog."
                        : "Display products with active discounts pulled directly from store catalog."}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={form.dealsSection.enabled}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        dealsSection: { ...prev.dealsSection, enabled: e.target.checked },
                      }))
                    }
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-emerald-600 peer-focus:outline-none dark:bg-slate-700"></div>
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === "id" ? "Judul Bagian (Section Title)" : "Section Title"}
                  </label>
                  <input
                    type="text"
                    value={form.dealsSection.title}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        dealsSection: { ...prev.dealsSection, title: e.target.value },
                      }))
                    }
                    placeholder="e.g. Koleksi Produk Diskon"
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#034c85] focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === "id" ? "Deskripsi Bagian" : "Section Description"}
                  </label>
                  <input
                    type="text"
                    value={form.dealsSection.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        dealsSection: { ...prev.dealsSection, description: e.target.value },
                      }))
                    }
                    placeholder="e.g. Jelajahi produk berkualitas dengan potongan harga menarik."
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#034c85] focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#fe6f05]" />
                    <span>
                      {lang === "id"
                        ? "Produk yang ditampilkan pada etalase ini bersumber otomatis dari data katalog yang memiliki harga sale/diskon aktif secara real-time."
                        : "Products displayed in this section are automatically queried from catalog items having active sale prices in real-time."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Column (Right - 5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#034c85] dark:text-sky-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Pratinjau Live (Offers Preview)
                  </span>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {lang.toUpperCase()}
                </span>
              </div>

              {/* Preview 1: Hero Banner Box */}
              <div className="mt-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Tampilan Header Banner
                </div>
                <div
                  className="relative overflow-hidden rounded-2xl border border-slate-800 p-6 text-white shadow-md transition"
                  style={{
                    backgroundColor: "#034c85",
                    backgroundImage: form.pageHeader.backgroundImageDataUrl
                      ? `linear-gradient(rgba(3, 76, 133, 0.85), rgba(15, 23, 42, 0.9)), url("${form.pageHeader.backgroundImageDataUrl}")`
                      : "linear-gradient(135deg, #034c85 0%, #022b4d 100%)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="relative z-10 space-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#fe6f05] backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#fe6f05] animate-pulse" />
                      {form.pageHeader.eyebrow || "MEGA OFFER"}
                    </span>
                    <h3 className="text-lg font-extrabold leading-tight sm:text-xl">
                      {form.pageHeader.pageTitle || "Mega Offer Eksklusif"}
                    </h3>
                    <p className="text-xs text-slate-200 line-clamp-2">
                      {form.pageHeader.description ||
                        "Dapatkan penawaran terbaik dan kupon diskon spesial."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview 2: Featured Voucher Ticket */}
              {form.superDiscount.enabled ? (
                <div className="mt-6">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Kupon Unggulan Aktif
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm dark:border-amber-900/40 dark:from-slate-900 dark:to-slate-850">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#fe6f05]">
                          <Ticket className="h-4 w-4" />
                          <span>
                            {form.superDiscount.activeCouponCode === "ALL"
                              ? "Semua Item Terpilih (ALL)"
                              : selectedCoupon?.campaignName || "Voucher Diskon Spesial"}
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-sm font-black tracking-wider text-slate-900 dark:text-white">
                          {form.superDiscount.activeCouponCode === "ALL"
                            ? "ALL ITEMS"
                            : selectedCoupon?.code || form.superDiscount.activeCouponCode}
                        </div>
                        {selectedCoupon ? (
                          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                            Potongan{" "}
                            {selectedCoupon.discountType === "percent"
                              ? `${selectedCoupon.amount}%`
                              : formatCurrency(selectedCoupon.amount)}{" "}
                            {selectedCoupon.minSpend
                              ? `• Min. ${formatCurrency(selectedCoupon.minSpend)}`
                              : ""}
                          </div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyPreview}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#034c85] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#02335a]"
                      >
                        {copiedPreviewCode ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-300" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Preview 3: Deals Section Preview */}
              {form.dealsSection.enabled ? (
                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Pratinjau Etalase Diskon
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {form.dealsSection.title || "Koleksi Produk Diskon"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {form.dealsSection.description || "Jelajahi produk potongan harga."}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
