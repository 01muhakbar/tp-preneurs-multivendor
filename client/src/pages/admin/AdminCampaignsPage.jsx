import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Image as ImageIcon,
  Layers,
  Loader2,
  Percent,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Tag,
  Ticket,
  Trash2,
  Upload,
  X,
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
    eyebrow: "PROMO & PENAWARAN SPESIAL",
    pageTitle: "Mega Offer Eksklusif",
    description:
      "Nikmati penawaran harga terbaik untuk produk kreatif dan karya inovasi mahasiswa.",
    backgroundImageDataUrl: "",
  },
  superDiscount: {
    enabled: true,
    activeCouponCode: "ALL",
  },
  dealsSection: {
    enabled: true,
    title: "Produk Promo Pilihan",
    description: "Karya inovasi dan produk edupreneur dengan diskon spesial.",
  },
};

const DEFAULT_OFFERS_EN = {
  pageHeader: {
    enabled: true,
    eyebrow: "SPECIAL OFFERS & PROMOTIONS",
    pageTitle: "Exclusive Mega Offer",
    description:
      "Enjoy the best deals on creative products and student innovation works.",
    backgroundImageDataUrl: "",
  },
  superDiscount: {
    enabled: true,
    activeCouponCode: "ALL",
  },
  dealsSection: {
    enabled: true,
    title: "Featured Promotional Deals",
    description:
      "Student innovation works and edupreneur products with exclusive discounts.",
  },
};

function Switch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      aria-label={ariaLabel}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#034c85] focus:ring-offset-2 ${
        checked ? "bg-[#034c85]" : "bg-slate-300 dark:bg-slate-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function AdminCampaignsPage() {
  const { t, i18n } = useTranslation("admin");
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // Reactive language listener
  const [, setLangTick] = useState(0);
  useEffect(() => {
    const handleSync = () => setLangTick((v) => v + 1);
    i18n?.on?.("languageChanged", handleSync);
    window.addEventListener("adminLanguageChange", handleSync);
    window.addEventListener("store_language_changed", handleSync);
    return () => {
      i18n?.off?.("languageChanged", handleSync);
      window.removeEventListener("adminLanguageChange", handleSync);
      window.removeEventListener("store_language_changed", handleSync);
    };
  }, [i18n]);

  const currentLang =
    String(i18n.language || "").toLowerCase().startsWith("id") ||
    String(localStorage.getItem("adminLanguage") || "").toLowerCase().includes('"id"')
      ? "id"
      : "en";
  const isId = currentLang === "id";

  const [activeTab, setActiveTab] = useState("setup"); // "setup" | "coupons"
  const [couponSearch, setCouponSearch] = useState("");
  const [copiedPreviewCode, setCopiedPreviewCode] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const defaultForm = isId ? DEFAULT_OFFERS_ID : DEFAULT_OFFERS_EN;
  const [form, setForm] = useState(defaultForm);

  // Fetch store customization for current language
  const customizationQuery = useQuery({
    queryKey: ["admin-store-customization", currentLang],
    queryFn: () => fetchAdminStoreCustomization(currentLang),
    staleTime: 30_000,
  });

  // Fetch platform coupons for selector and table
  const couponsQuery = useQuery({
    queryKey: ["admin-coupons-for-campaigns"],
    queryFn: () => fetchAdminCoupons({ page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  const availableCoupons = useMemo(() => {
    const raw =
      couponsQuery.data?.items ??
      couponsQuery.data?.data?.items ??
      couponsQuery.data?.data ??
      [];
    if (!Array.isArray(raw)) return [];
    return raw.filter((c) => c && c.code);
  }, [couponsQuery.data]);

  const filteredCoupons = useMemo(() => {
    if (!couponSearch.trim()) return availableCoupons;
    const q = couponSearch.toLowerCase().trim();
    return availableCoupons.filter(
      (c) =>
        c.code?.toLowerCase().includes(q) ||
        c.campaignName?.toLowerCase().includes(q)
    );
  }, [availableCoupons, couponSearch]);

  // Sync form when customization data loads or currentLang changes
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
  }, [customizationQuery.data, customizationQuery.isLoading, currentLang]);

  // Selected coupon details
  const selectedCoupon = useMemo(() => {
    if (
      !form.superDiscount.activeCouponCode ||
      form.superDiscount.activeCouponCode === "ALL"
    ) {
      return null;
    }
    return availableCoupons.find(
      (c) =>
        c.code.toUpperCase() === form.superDiscount.activeCouponCode.toUpperCase()
    );
  }, [form.superDiscount.activeCouponCode, availableCoupons]);

  // Language switch handler with full cross-app synchronization
  const handleSwitchLanguage = (lang) => {
    const nextLang = lang === "id" ? "id" : "en";
    i18n.changeLanguage(nextLang);
    const storedObj = {
      isoCode: nextLang,
      name: nextLang === "id" ? "Bahasa Indonesia" : "English",
      flag: nextLang === "id" ? "🇮🇩" : "🇺🇸",
    };
    try {
      localStorage.setItem("adminLanguage", JSON.stringify(storedObj));
      window.dispatchEvent(
        new CustomEvent("adminLanguageChange", { detail: storedObj })
      );
    } catch {}
  };

  // Restore official preset
  const handleRestoreDefaults = () => {
    const confirmed = window.confirm(
      t(
        "campaigns.Restore official TP Preneurs preset?",
        "Restore official TP Preneurs preset?"
      )
    );
    if (!confirmed) return;
    setForm(defaultForm);
    toast.success(
      t("campaigns.Preset restored", "Official preset restored.")
    );
  };

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
            backgroundImageDataUrl: String(
              form.pageHeader.backgroundImageDataUrl || ""
            ).trim(),
          },
          superDiscount: {
            enabled: Boolean(form.superDiscount.enabled),
            activeCouponCode: String(
              form.superDiscount.activeCouponCode || "ALL"
            )
              .trim()
              .toUpperCase(),
            selectionStatus:
              form.superDiscount.activeCouponCode === "ALL" ? "all" : "valid",
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

      return updateAdminStoreCustomization(currentLang, payload);
    },
    onSuccess: () => {
      toast.success(
        t(
          "campaigns.Settings saved successfully.",
          "Settings saved successfully."
        )
      );
      queryClient.invalidateQueries({ queryKey: ["admin-store-customization"] });
      queryClient.invalidateQueries({ queryKey: ["store-customization"] });
      queryClient.invalidateQueries({ queryKey: ["public-store-customization"] });
      queryClient.invalidateQueries({ queryKey: ["storefront", "customization"] });
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          t("campaigns.Failed to save settings.", "Failed to save settings.")
      );
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError(
        t(
          "campaigns.Only JPG, PNG, or WebP files are allowed.",
          "Only JPG, PNG, or WebP files are allowed."
        )
      );
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError(
        t("campaigns.Maximum image size is 2MB.", "Maximum image size is 2MB.")
      );
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((prev) => ({
        ...prev,
        pageHeader: { ...prev.pageHeader, backgroundImageDataUrl: dataUrl },
      }));
    } catch {
      setUploadError(
        t("campaigns.Failed to load image file.", "Failed to load image file.")
      );
    }
  };

  const handleCopyPreview = () => {
    const code = selectedCoupon?.code || form.superDiscount.activeCouponCode;
    if (!code || code === "ALL") return;
    navigator.clipboard?.writeText(code);
    setCopiedPreviewCode(true);
    setTimeout(() => setCopiedPreviewCode(false), 2000);
  };

  const isCampaignActive =
    form.pageHeader.enabled ||
    form.superDiscount.enabled ||
    form.dealsSection.enabled;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Link
              to="/admin/catalog/products"
              className="hover:text-[#034c85] dark:hover:text-sky-400 transition"
            >
              {t("campaigns.Catalog", "Catalog")}
            </Link>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="text-[#fe6f05] font-bold">
              {t("campaigns.Campaigns & Mega Offer", "Campaigns & Mega Offer")}
            </span>
          </nav>

          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5 sm:text-3xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#034c85]/20 bg-[#034c85]/10 text-[#034c85] dark:border-sky-500/30 dark:bg-sky-950/50 dark:text-sky-300">
              <Sparkles className="h-5 w-5" />
            </span>
            {t("campaigns.Campaigns & Mega Offer", "Campaigns & Mega Offer")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t(
              "campaigns.Manage Mega Offer promotional banner, featured vouchers, and discounted deals in storefront.",
              "Manage Mega Offer promotional banner, featured vouchers, and discounted deals in storefront."
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* External View Link */}
          <Link
            to="/offers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#034c85] hover:bg-slate-50 hover:text-[#034c85] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-[#034c85] dark:hover:text-[#38bdf8]"
            title={t("campaigns.View Live Offers", "View Live Offers")}
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#034c85] dark:text-sky-400" />
            <span>{t("campaigns.View Live Offers", "View Live Offers")}</span>
          </Link>

          {/* Restore Preset Button */}
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-500/50 dark:hover:text-amber-400"
            title={t("campaigns.Restore Defaults", "Restore Defaults")}
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">
              {t("campaigns.Restore Defaults", "Restore Defaults")}
            </span>
          </button>

          {/* Synchronized Language Switcher */}
          <div className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleSwitchLanguage("id")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                isId
                  ? "bg-[#034c85] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Globe className="h-3 w-3" />
              ID
            </button>
            <button
              type="button"
              onClick={() => handleSwitchLanguage("en")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                !isId
                  ? "bg-[#034c85] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
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
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#fe6f05] px-5 text-xs font-bold text-white shadow-md shadow-[#fe6f05]/20 transition hover:bg-[#e05e00] focus:outline-none focus:ring-2 focus:ring-[#fe6f05]/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>
              {saveMutation.isPending
                ? t("campaigns.Saving...", "Saving...")
                : t("campaigns.Save Changes", "Save Changes")}
            </span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards with Elegant Top Border Accents */}
      <section
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        aria-label="Campaign Overview"
      >
        {/* KPI 1: Campaign Status */}
        <article className="relative overflow-hidden rounded-2xl border border-slate-200 border-t-2 border-t-[#034c85] bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:border-t-[#034c85] dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("campaigns.Campaign Status", "Campaign Status")}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#034c85]/10 text-[#034c85] dark:bg-sky-950/50 dark:text-sky-300">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isCampaignActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <strong className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isCampaignActive
                ? t("campaigns.Active in Store", "Active in Store")
                : t("campaigns.Draft Mode", "Draft Mode")}
            </strong>
          </div>
        </article>

        {/* KPI 2: Hero Banner */}
        <article className="relative overflow-hidden rounded-2xl border border-slate-200 border-t-2 border-t-[#034c85] bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:border-t-[#034c85] dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("campaigns.Hero Banner", "Hero Banner")}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#034c85] dark:bg-blue-950/50 dark:text-sky-300">
              <ImageIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                form.pageHeader.enabled ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            <strong className="text-base font-bold text-slate-900 dark:text-slate-100">
              {form.pageHeader.enabled
                ? t("campaigns.Active", "Active")
                : t("campaigns.Disabled", "Disabled")}
            </strong>
          </div>
        </article>

        {/* KPI 3: Featured Voucher */}
        <article className="relative overflow-hidden rounded-2xl border border-slate-200 border-t-2 border-t-[#fe6f05] bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:border-t-[#fe6f05] dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("campaigns.Featured Voucher", "Featured Voucher")}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fe6f05]/10 text-[#fe6f05] dark:bg-orange-950/40">
              <Ticket className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 min-w-0">
            <strong className="text-base font-bold text-slate-900 dark:text-slate-100 truncate font-mono">
              {!form.superDiscount.enabled
                ? t("campaigns.Disabled", "Disabled")
                : form.superDiscount.activeCouponCode === "ALL"
                  ? isId
                    ? "Semua Kupon (ALL)"
                    : "All Coupons (ALL)"
                  : selectedCoupon?.code || form.superDiscount.activeCouponCode}
            </strong>
          </div>
        </article>

        {/* KPI 4: Deals Showcase */}
        <article className="relative overflow-hidden rounded-2xl border border-slate-200 border-t-2 border-t-emerald-500 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:border-t-emerald-500 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("campaigns.Deals Showcase", "Deals Showcase")}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Percent className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                form.dealsSection.enabled ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            <strong className="text-base font-bold text-slate-900 dark:text-slate-100">
              {form.dealsSection.enabled
                ? t("campaigns.Active", "Active")
                : t("campaigns.Disabled", "Disabled")}
            </strong>
          </div>
        </article>
      </section>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("setup")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
              activeTab === "setup"
                ? "border-[#034c85] text-[#034c85] dark:border-sky-400 dark:text-sky-300"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>{t("campaigns.Campaign Setup", "Campaign Setup")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("coupons")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
              activeTab === "coupons"
                ? "border-[#034c85] text-[#034c85] dark:border-sky-400 dark:text-sky-300"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Ticket className="h-4 w-4" />
            <span>{t("campaigns.Active Promo Coupons", "Active Promo Coupons")}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {availableCoupons.length}
            </span>
          </button>
        </div>
      </div>

      {customizationQuery.isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#034c85]" />
            <span>
              {t("campaigns.Loading campaign data...", "Loading campaign data...")}
            </span>
          </div>
        </div>
      ) : activeTab === "setup" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Configuration Form (Left - 7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Card 1: Mega Offer Hero Banner */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#034c85]/10 text-[#034c85] dark:bg-sky-950/50 dark:text-sky-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {t(
                        "campaigns.Mega Offer Banner (Hero)",
                        "Mega Offer Banner (Hero)"
                      )}
                    </h2>
                  </div>
                </div>

                <Switch
                  checked={form.pageHeader.enabled}
                  onChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      pageHeader: { ...prev.pageHeader, enabled: checked },
                    }))
                  }
                  ariaLabel="Toggle Hero Banner"
                />
              </div>

              <div className="mt-5 space-y-4">
                {/* Eyebrow badge */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t("campaigns.Eyebrow Tag", "Eyebrow Tag")}
                  </label>
                  <input
                    type="text"
                    value={form.pageHeader.eyebrow}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pageHeader: {
                          ...prev.pageHeader,
                          eyebrow: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. PROMO & PENAWARAN SPESIAL"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-[#034c85] focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Banner Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t("campaigns.Banner Title", "Banner Title")}
                  </label>
                  <input
                    type="text"
                    value={form.pageHeader.pageTitle}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pageHeader: {
                          ...prev.pageHeader,
                          pageTitle: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Mega Offer Eksklusif"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-[#034c85] focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t("campaigns.Short Description", "Short Description")}
                  </label>
                  <textarea
                    rows={2}
                    value={form.pageHeader.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pageHeader: {
                          ...prev.pageHeader,
                          description: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Dapatkan penawaran harga terbaik..."
                    className="mt-1.5 block w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-[#034c85] focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Background Image Upload & Thumbnail Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {t(
                        "campaigns.Banner Background Image",
                        "Banner Background Image"
                      )}
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">
                      1920×600 px • Max 2MB
                    </span>
                  </div>

                  {/* Thumbnail Preview if exists */}
                  {form.pageHeader.backgroundImageDataUrl ? (
                    <div className="relative mb-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50">
                      <div className="relative h-28 w-full overflow-hidden">
                        <img
                          src={form.pageHeader.backgroundImageDataUrl}
                          alt="Banner Preview"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-white">
                          <span className="font-semibold flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5 text-sky-400" />
                            {t("campaigns.Image Preview", "Image Preview")}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                pageHeader: {
                                  ...prev.pageHeader,
                                  backgroundImageDataUrl: "",
                                },
                              }))
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600/90 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-rose-700"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>{t("campaigns.Remove Image", "Remove Image")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
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
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#034c85] hover:bg-slate-50 hover:text-[#034c85] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-[#034c85] dark:hover:bg-slate-700"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#fe6f05]" />
                      <span>{t("campaigns.Upload Image", "Upload Image")}</span>
                    </button>
                  </div>

                  {uploadError ? (
                    <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                      {uploadError}
                    </p>
                  ) : null}

                  {/* Direct Image URL input */}
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
                      placeholder={t(
                        "campaigns.Or paste direct image URL",
                        "Or paste direct image URL"
                      )}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-[#034c85] focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Featured Voucher (Super Discount) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fe6f05]/10 text-[#fe6f05] dark:bg-orange-950/40">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {t(
                        "campaigns.Featured Voucher (Super Discount)",
                        "Featured Voucher (Super Discount)"
                      )}
                    </h2>
                  </div>
                </div>

                <Switch
                  checked={form.superDiscount.enabled}
                  onChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      superDiscount: { ...prev.superDiscount, enabled: checked },
                    }))
                  }
                  ariaLabel="Toggle Featured Voucher"
                />
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t(
                      "campaigns.Select Featured Coupon",
                      "Select Featured Coupon"
                    )}
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
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 outline-none transition focus:border-[#034c85] focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="ALL">
                      {t(
                        "campaigns.ALL - Display All Active Coupons",
                        "ALL - Display All Active Coupons"
                      )}
                    </option>
                    {availableCoupons.map((coupon) => (
                      <option key={coupon.id} value={coupon.code}>
                        {coupon.code} -{" "}
                        {coupon.discountType === "percent"
                          ? `${coupon.amount}% ${t("campaigns.Off", "Off")}`
                          : `${formatCurrency(coupon.amount)} ${t(
                              "campaigns.Off",
                              "Off"
                            )}`}{" "}
                        {coupon.campaignName ? `(${coupon.campaignName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Instant Coupon Detail Card */}
                {selectedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fe6f05] text-white">
                        <Tag className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                          {selectedCoupon.code}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          {selectedCoupon.discountType === "percent"
                            ? `${selectedCoupon.amount}% ${t("campaigns.Off", "Off")}`
                            : `${formatCurrency(selectedCoupon.amount)} ${t("campaigns.Off", "Off")}`}{" "}
                          • {t("campaigns.Min. spend", "Min. spend")}{" "}
                          {formatCurrency(selectedCoupon.minSpend || 0)}
                        </div>
                      </div>
                    </div>
                    <span className="rounded-md border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {isId ? "Aktif" : "Active"}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Card 3: Deals Catalog Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <Percent className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {t(
                        "campaigns.Deals Catalog Section",
                        "Deals Catalog Section"
                      )}
                    </h2>
                  </div>
                </div>

                <Switch
                  checked={form.dealsSection.enabled}
                  onChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      dealsSection: { ...prev.dealsSection, enabled: checked },
                    }))
                  }
                  ariaLabel="Toggle Deals Section"
                />
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t("campaigns.Section Title", "Section Title")}
                  </label>
                  <input
                    type="text"
                    value={form.dealsSection.title}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        dealsSection: {
                          ...prev.dealsSection,
                          title: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Produk Promo Pilihan"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-[#034c85] focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t("campaigns.Section Description", "Section Description")}
                  </label>
                  <input
                    type="text"
                    value={form.dealsSection.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        dealsSection: {
                          ...prev.dealsSection,
                          description: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Karya inovasi dan produk edupreneur..."
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-[#034c85] focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Column (Right - 5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#034c85] dark:text-sky-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {t("campaigns.Live Preview", "Live Preview")}
                  </span>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {currentLang.toUpperCase()}
                </span>
              </div>

              {/* Preview 1: Hero Banner Box */}
              <div className="mt-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {t("campaigns.Banner Header Preview", "Banner Header Preview")}
                </div>
                <div
                  className="relative overflow-hidden rounded-2xl border border-slate-800 p-5 sm:p-6 text-white shadow-lg transition"
                  style={{
                    backgroundColor: "#034c85",
                    backgroundImage: form.pageHeader.backgroundImageDataUrl
                      ? `linear-gradient(rgba(3, 76, 133, 0.88), rgba(15, 23, 42, 0.92)), url("${form.pageHeader.backgroundImageDataUrl}")`
                      : "linear-gradient(135deg, #034c85 0%, #012d50 100%)",
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
                <div className="mt-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {t(
                      "campaigns.Active Featured Coupon",
                      "Active Featured Coupon"
                    )}
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm dark:border-amber-900/40 dark:from-slate-900 dark:to-slate-850">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#fe6f05] truncate">
                          <Ticket className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {form.superDiscount.activeCouponCode === "ALL"
                              ? t(
                                  "campaigns.All Selected Items (ALL)",
                                  "All Selected Items (ALL)"
                                )
                              : selectedCoupon?.campaignName ||
                                "Special Discount"}
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-sm font-black tracking-wider text-slate-900 dark:text-slate-100">
                          {form.superDiscount.activeCouponCode === "ALL"
                            ? "ALL ITEMS"
                            : selectedCoupon?.code ||
                              form.superDiscount.activeCouponCode}
                        </div>
                        {selectedCoupon ? (
                          <div className="mt-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            {t("campaigns.Off", "Off")}{" "}
                            {selectedCoupon.discountType === "percent"
                              ? `${selectedCoupon.amount}%`
                              : formatCurrency(selectedCoupon.amount)}{" "}
                            {selectedCoupon.minSpend
                              ? `• ${t("campaigns.Min. spend", "Min. spend")} ${formatCurrency(
                                  selectedCoupon.minSpend
                                )}`
                              : ""}
                          </div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyPreview}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#034c85] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#02335a] shrink-0"
                      >
                        {copiedPreviewCode ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-300" />
                            <span>{t("campaigns.Copied", "Copied")}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>{t("campaigns.Copy", "Copy")}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Preview 3: Deals Section Preview */}
              {form.dealsSection.enabled ? (
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {t(
                      "campaigns.Deals Section Preview",
                      "Deals Section Preview"
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {form.dealsSection.title || "Koleksi Produk Diskon"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {form.dealsSection.description ||
                      "Jelajahi produk potongan harga."}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Compact Promotional Coupons Table (Zero Horizontal Scrollbar) */
        <div className="space-y-4">
          {/* Table Search & Filter Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                placeholder={
                  isId
                    ? "Cari kode kupon atau nama promo..."
                    : "Search coupon code or campaign..."
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-[#034c85] focus:bg-white focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    superDiscount: {
                      ...prev.superDiscount,
                      enabled: true,
                      activeCouponCode: "ALL",
                    },
                  }));
                  setActiveTab("setup");
                  toast.success(
                    isId
                      ? "Mega Offer diset untuk menampilkan semua kupon aktif."
                      : "Mega Offer set to display all active coupons."
                  );
                }}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
                  form.superDiscount.activeCouponCode === "ALL"
                    ? "border-[#fe6f05] bg-[#fe6f05]/10 text-[#fe6f05]"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#034c85] hover:text-[#034c85] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                <Ticket className="h-3.5 w-3.5" />
                <span>
                  {isId ? "Tampilkan Semua (ALL)" : "Show All Coupons (ALL)"}
                </span>
              </button>
            </div>
          </div>

          {/* Desktop Table: table-fixed w-full without horizontal scrollbar */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full table-fixed text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="w-4/12 px-4 py-3 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {t("campaigns.Coupon & Campaign", "Coupon & Campaign")}
                  </th>
                  <th className="w-2/12 px-4 py-3 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {t("campaigns.Discount", "Discount")}
                  </th>
                  <th className="w-2/12 px-4 py-3 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {t("campaigns.Min. Spend", "Min. Spend")}
                  </th>
                  <th className="w-2/12 px-4 py-3 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {t("campaigns.Validity", "Validity")}
                  </th>
                  <th className="w-2/12 px-4 py-3 text-right font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {t("campaigns.Action", "Action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-xs text-slate-400"
                    >
                      {t(
                        "campaigns.No active promotional coupons found.",
                        "No active promotional coupons found."
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => {
                    const isCurrent =
                      form.superDiscount.activeCouponCode?.toUpperCase() ===
                      coupon.code?.toUpperCase();

                    return (
                      <tr
                        key={coupon.id || coupon.code}
                        className={`transition hover:bg-slate-50/70 dark:hover:bg-slate-800/50 ${
                          isCurrent
                            ? "bg-[#034c85]/5 dark:bg-[#034c85]/15"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3 truncate">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#034c85]/20 bg-[#034c85]/10 text-[#034c85] dark:border-sky-500/30 dark:bg-sky-950/50 dark:text-sky-300">
                              <Ticket className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0">
                              <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {coupon.code}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {coupon.campaignName ||
                                  (isId ? "Kupon Platform" : "Platform Voucher")}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-lg border border-[#fe6f05]/30 bg-[#fe6f05]/10 px-2 py-0.5 text-xs font-bold text-[#fe6f05]">
                            {coupon.discountType === "percent"
                              ? `${coupon.amount}% ${t("campaigns.Off", "Off")}`
                              : `${formatCurrency(coupon.amount)} ${t(
                                  "campaigns.Off",
                                  "Off"
                                )}`}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                          {coupon.minSpend
                            ? formatCurrency(coupon.minSpend)
                            : isId
                              ? "Tanpa Min."
                              : "No Min."}
                        </td>

                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px]">
                          {coupon.expiresAt
                            ? new Date(coupon.expiresAt).toLocaleDateString(
                                isId ? "id-ID" : "en-US",
                                { day: "numeric", month: "short", year: "numeric" }
                              )
                            : t("campaigns.Never Expires", "Never Expires")}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>
                                {t(
                                  "campaigns.Currently Featured",
                                  "Currently Featured"
                                )}
                              </span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  superDiscount: {
                                    ...prev.superDiscount,
                                    enabled: true,
                                    activeCouponCode: coupon.code,
                                  },
                                }));
                                setActiveTab("setup");
                                toast.success(
                                  isId
                                    ? `Kupon ${coupon.code} dipilih untuk Mega Offer!`
                                    : `Coupon ${coupon.code} selected for Mega Offer!`
                                );
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#034c85] bg-white px-2.5 py-1 text-[11px] font-bold text-[#034c85] transition hover:bg-[#034c85] hover:text-white dark:border-[#034c85] dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-[#034c85]"
                            >
                              <Sparkles className="h-3 w-3" />
                              <span>
                                {t(
                                  "campaigns.Set as Featured",
                                  "Set as Featured"
                                )}
                              </span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< 768px) */}
          <div className="md:hidden space-y-3">
            {filteredCoupons.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                {t(
                  "campaigns.No active promotional coupons found.",
                  "No active promotional coupons found."
                )}
              </div>
            ) : (
              filteredCoupons.map((coupon) => {
                const isCurrent =
                  form.superDiscount.activeCouponCode?.toUpperCase() ===
                  coupon.code?.toUpperCase();

                return (
                  <div
                    key={coupon.id || coupon.code}
                    className={`rounded-2xl border p-4 shadow-sm space-y-3 transition ${
                      isCurrent
                        ? "border-[#034c85] bg-[#034c85]/5 dark:border-sky-500/40 dark:bg-[#034c85]/15"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#034c85]/10 text-[#034c85] dark:bg-sky-950/50 dark:text-sky-300">
                          <Ticket className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                            {coupon.code}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {coupon.campaignName ||
                              (isId ? "Kupon Platform" : "Platform Voucher")}
                          </div>
                        </div>
                      </div>

                      <span className="inline-flex items-center rounded-lg border border-[#fe6f05]/30 bg-[#fe6f05]/10 px-2 py-0.5 text-xs font-bold text-[#fe6f05]">
                        {coupon.discountType === "percent"
                          ? `${coupon.amount}% ${t("campaigns.Off", "Off")}`
                          : `${formatCurrency(coupon.amount)} ${t(
                              "campaigns.Off",
                              "Off"
                            )}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>
                        Min.{" "}
                        {coupon.minSpend
                          ? formatCurrency(coupon.minSpend)
                          : isId
                            ? "Tanpa Min."
                            : "No Min."}
                      </span>
                      <span>
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString(
                              isId ? "id-ID" : "en-US",
                              { day: "numeric", month: "short", year: "numeric" }
                            )
                          : t("campaigns.Never Expires", "Never Expires")}
                      </span>
                    </div>

                    <div className="pt-1">
                      {isCurrent ? (
                        <div className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-emerald-300 bg-emerald-50 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>
                            {t(
                              "campaigns.Currently Featured",
                              "Currently Featured"
                            )}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              superDiscount: {
                                ...prev.superDiscount,
                                enabled: true,
                                activeCouponCode: coupon.code,
                              },
                            }));
                            setActiveTab("setup");
                            toast.success(
                              isId
                                ? `Kupon ${coupon.code} dipilih untuk Mega Offer!`
                                : `Coupon ${coupon.code} selected for Mega Offer!`
                            );
                          }}
                          className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#034c85] py-2 text-xs font-bold text-white transition hover:bg-[#02335a]"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>
                            {t(
                              "campaigns.Set as Featured",
                              "Set as Featured"
                            )}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
