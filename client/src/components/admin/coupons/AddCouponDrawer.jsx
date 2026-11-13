import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import { uploadAdminImage } from "../../../lib/adminApi.js";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import { GENERIC_ERROR } from "../../../constants/uiMessages.js";

const initialForm = {
  language: "en",
  campaignName: "",
  code: "",
  scopeType: "PLATFORM",
  storeId: "",
  startDate: "",
  endDate: "",
  discountType: "percent",
  amount: "",
  minSpend: "",
  active: true,
  bannerImageUrl: "",
};

const toNumber = (value) => {
  const numeric = Number(String(value ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const revokeObjectUrl = (value) => {
  if (typeof value === "string" && value.startsWith("blob:")) {
    URL.revokeObjectURL(value);
  }
};

const sectionCardClass = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

function CouponDrawerSectionHeader({ eyebrow, title, description, meta, compact = false }) {
  if (compact) {
    return (
      <div className="acf26-section-head">
        <h3>{title}</h3>
        {description ? <span>{description}</span> : null}
      </div>
    );
  }

  return (
    <div className="mb-3 flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#fe6f05]">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {description ? <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      {meta ? (
        <span className="inline-flex items-center rounded-full border border-[#034c85]/20 bg-[#034c85]/10 px-3 py-1 text-[11px] font-semibold text-[#034c85] dark:text-sky-300">
          {meta}
        </span>
      ) : null}
    </div>
  );
}

export function AddCouponFormPanel({
  onCancel = () => {},
  onSubmit,
  isSubmitting,
  error,
  storeOptions = [],
  resetSignal,
  showHeader = true,
  formId,
  formClassName = "flex min-h-0 flex-1 flex-col",
  bodyClassName = "flex-1 space-y-4 overflow-y-auto px-6 py-5",
  footerClassName = "sticky bottom-0 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur",
  headerClassName = "border-b border-slate-200 px-6 py-5",
  closeAriaLabel = "Close drawer",
  compact = false,
  showLanguageField = true,
}) {
  const { t } = useTranslation("admin");
  const [form, setForm] = useState(initialForm);
  const [bannerFileName, setBannerFileName] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    revokeObjectUrl(bannerPreview);
    setForm(initialForm);
    setBannerFileName("");
    setBannerPreview("");
    setBannerUploading(false);
    setBannerUploadError("");
    setValidationError("");
  }, [resetSignal]);

  useEffect(() => {
    return () => {
      revokeObjectUrl(bannerPreview);
    };
  }, [bannerPreview]);

  const submitError = validationError || error || "";

  const discountInputAffix = useMemo(() => {
    if (form.discountType === "fixed") {
      return {
        prefix: "Rp",
        suffix: "",
      };
    }
    return {
      prefix: "",
      suffix: "%",
    };
  }, [form.discountType]);

  const setField = (patch) => {
    setValidationError("");
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    revokeObjectUrl(bannerPreview);
    const localPreviewUrl = URL.createObjectURL(file);
    setValidationError("");
    setBannerUploadError("");
    setBannerFileName(file.name);
    setBannerPreview(localPreviewUrl);
    setField({ bannerImageUrl: "" });
    setBannerUploading(true);
    try {
      const uploaded = await uploadAdminImage(file);
      const uploadedUrl = String(uploaded?.url || "").trim();
      if (!uploadedUrl) {
        throw new Error("Upload response did not include an image URL.");
      }
      revokeObjectUrl(localPreviewUrl);
      setBannerPreview("");
      setField({ bannerImageUrl: uploadedUrl });
    } catch (uploadError) {
      setBannerUploadError(
        uploadError?.response?.data?.message ||
          uploadError?.message ||
          "Failed to upload banner image."
      );
    } finally {
      setBannerUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveBanner = () => {
    revokeObjectUrl(bannerPreview);
    setBannerFileName("");
    setBannerPreview("");
    setBannerUploadError("");
    setField({ bannerImageUrl: "" });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const campaignName = form.campaignName.trim();
    const code = form.code.trim().toUpperCase();
    const amount = toNumber(form.amount);
    const minSpend = toNumber(form.minSpend);
    const hasStartDate = Boolean(form.startDate);
    const hasEndDate = Boolean(form.endDate);

    if (!campaignName && !code) {
      setValidationError(
        t("coupons.Campaign Name or Campaign Code is required.", "Campaign Name or Campaign Code is required.")
      );
      return;
    }
    if (bannerUploading) {
      setValidationError(
        t("coupons.Wait for the banner image upload to finish before saving.", "Wait for the banner image upload to finish before saving.")
      );
      return;
    }
    if (bannerPreview && !form.bannerImageUrl) {
      setValidationError(
        t("coupons.Banner upload failed. Re-upload the image before saving this coupon.", "Banner upload failed. Re-upload the image before saving this coupon.")
      );
      return;
    }
    if (!code) {
      setValidationError(
        t("coupons.Campaign Code is required.", "Campaign Code is required.")
      );
      return;
    }
    if (form.scopeType === "STORE" && !form.storeId) {
      setValidationError(
        t("coupons.Store is required for store-scoped coupons.", "Store is required for store-scoped coupons.")
      );
      return;
    }
    if (form.discountType === "percent" && (amount < 0 || amount > 100)) {
      setValidationError(
        t("coupons.Percent discount must be between 0 and 100.", "Percent discount must be between 0 and 100.")
      );
      return;
    }
    if (form.discountType === "fixed" && amount < 0) {
      setValidationError(
        t("coupons.Discount must be greater than or equal to 0.", "Discount must be greater than or equal to 0.")
      );
      return;
    }
    if (amount <= 0) {
      setValidationError(
        t("coupons.Discount must be greater than 0.", "Discount must be greater than 0.")
      );
      return;
    }
    if (minSpend < 0) {
      setValidationError(
        t("coupons.Minimum Amount must be greater than or equal to 0.", "Minimum Amount must be greater than or equal to 0.")
      );
      return;
    }
    if (hasStartDate && hasEndDate && new Date(form.endDate) < new Date(form.startDate)) {
      setValidationError(
        t("coupons.End Date must be greater than or equal to Start Date.", "End Date must be greater than or equal to Start Date.")
      );
      return;
    }

    onSubmit({
      campaignName: campaignName || code,
      code,
      scopeType: form.scopeType,
      storeId: form.scopeType === "STORE" ? Number(form.storeId) : null,
      startDate: hasStartDate ? form.startDate : null,
      startsAt: hasStartDate ? new Date(`${form.startDate}T00:00:00`).toISOString() : null,
      discountType: form.discountType,
      amount,
      minSpend,
      active: Boolean(form.active),
      expiresAt: hasEndDate ? new Date(`${form.endDate}T23:59:59`).toISOString() : null,
      bannerImageUrl: form.bannerImageUrl || null,
    });
  };

  const bannerPreviewSrc = bannerPreview || resolveAssetUrl(form.bannerImageUrl);
  const cardClass = compact ? "acf26-section" : sectionCardClass;
  const inputFocusClass = " focus:border-[#034c85] focus:ring-2 focus:ring-[#034c85]/10";
  const activeSegmentClass = "bg-[#034c85] text-white shadow-sm";
  const inactiveSegmentClass = "text-slate-600 hover:text-[#034c85]";
  const toggleActiveClass = "bg-[#034c85]";
  const uploadAccentClass = "bg-[#034c85]/10 text-[#034c85]";

  return (
    <>
        {showHeader ? (
        <header className={headerClassName}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                {t("coupons.Admin / Coupons / Add", "Admin / Coupons / Add")}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                {t("coupons.Add Coupon", "Add Coupon")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t("coupons.Create campaign codes, discount setup, and validity period.", "Create campaign codes, discount setup, and validity period.")}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-[#034c85]/20 bg-[#034c85]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#034c85]">
                  {t("coupons.Create Mode", "Create Mode")}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {form.discountType === "percent" ? "Percent discount" : "Fixed discount"}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {form.active ? "Publish on save" : "Save inactive"}
                </span>
              </div>
            </div>
              <button
                type="button"
              onClick={() => !isSubmitting && onCancel()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              aria-label={closeAriaLabel}
                disabled={isSubmitting}
              >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        ) : null}

        <form id={formId} onSubmit={handleSubmit} className={formClassName}>
          <div className={bodyClassName}>
            <section className={cardClass}>
              <CouponDrawerSectionHeader
                eyebrow={compact ? "" : "Basic Info"}
                title={compact ? t("coupons.Campaign Identity", "Campaign Identity") : "Define campaign identity first"}
                description={compact ? t("coupons.Define campaign code, name, and target scope.", "Define campaign code, name, and target scope.") : "Set the code, scope, and campaign label that admin will recognize during checkout reviews."}
                meta={compact ? "" : (form.code ? `${form.scopeType} / ${form.code}` : `${form.scopeType} / Code pending`)}
                compact={compact}
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {showLanguageField ? (
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Language
                    </label>
                    <select
                      value={form.language}
                      onChange={(event) => setField({ language: event.target.value })}
                      className={`h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none${inputFocusClass}`}
                    >
                      <option value="en">English</option>
                      <option value="id">Bahasa Indonesia</option>
                    </select>
                  </div>
                ) : null}
                <div className={showLanguageField ? "" : "sm:col-span-2"}>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("coupons.Scope", "Scope")}
                  </label>
                  <select
                    value={form.scopeType}
                    onChange={(event) =>
                      setField({
                        scopeType: event.target.value,
                        storeId: event.target.value === "STORE" ? form.storeId : "",
                      })
                    }
                    className={`h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none${inputFocusClass}`}
                    disabled={isSubmitting}
                  >
                    <option value="PLATFORM">{t("coupons.Platform / Global", "Platform / Global")}</option>
                    <option value="STORE">{t("coupons.Store-scoped", "Store-scoped")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("coupons.Campaign Code", "Campaign Code")}
                  </label>
                  <input
                    value={form.code}
                    onChange={(event) =>
                      setField({ code: event.target.value.toUpperCase().replace(/\s+/g, "") })
                    }
                    placeholder="WEEKEND25"
                    className={`h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm uppercase text-slate-700 dark:text-slate-200 focus:outline-none${inputFocusClass}`}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {form.scopeType === "STORE" ? (
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t("coupons.Linked Store", "Linked Store")}
                    </label>
                    <select
                      value={form.storeId}
                      onChange={(event) => setField({ storeId: event.target.value })}
                      className={`h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none${inputFocusClass}`}
                      disabled={isSubmitting}
                      required
                    >
                      <option value="">{t("coupons.Select store", "Select store")}</option>
                      {storeOptions.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                          {store.slug ? ` (${store.slug})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("coupons.Campaign Name", "Campaign Name")}
                  </label>
                  <input
                    value={form.campaignName}
                    onChange={(event) => setField({ campaignName: event.target.value })}
                    placeholder="Weekend Grocery Sale"
                    className={`h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none${inputFocusClass}`}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <CouponDrawerSectionHeader
                eyebrow={compact ? "" : "Discount Setup"}
                title={compact ? t("coupons.Discount & Condition", "Discount & Condition") : "Group discount value with order threshold"}
                description={compact ? t("coupons.Configure discount value and order requirements.", "Configure discount value and order requirements.") : "Keep discount type, amount, and minimum order together so the promotion rule stays easy to review."}
                meta={compact ? "" : (form.discountType === "percent" ? "Percent mode" : "Fixed mode")}
                compact={compact}
              />
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("coupons.Discount Type", "Discount Type")}
                  </label>
                  <div className={compact ? "acf26-segmented" : "grid grid-cols-2 gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-1"}>
                    <button
                      type="button"
                      onClick={() => setField({ discountType: "percent" })}
                      className={compact ? `acf26-segment-btn ${form.discountType === "percent" ? "is-active" : ""}` : `h-10 rounded-lg text-sm font-semibold transition ${
                        form.discountType === "percent"
                          ? activeSegmentClass
                          : inactiveSegmentClass
                      }`}
                      disabled={isSubmitting}
                    >
                      {t("coupons.Percent", "Percent")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setField({ discountType: "fixed" })}
                      className={compact ? `acf26-segment-btn ${form.discountType === "fixed" ? "is-active" : ""}` : `h-10 rounded-lg text-sm font-semibold transition ${
                        form.discountType === "fixed"
                          ? activeSegmentClass
                          : inactiveSegmentClass
                      }`}
                      disabled={isSubmitting}
                    >
                      {t("coupons.Fixed", "Fixed")}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t("coupons.Discount", "Discount")}
                    </label>
                    <div className="relative">
                      {discountInputAffix.prefix ? (
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 dark:text-slate-400">
                          {discountInputAffix.prefix}
                        </span>
                      ) : null}
                      <input
                        type="number"
                        min={0}
                        max={form.discountType === "percent" ? 100 : undefined}
                        step="1"
                        value={form.amount}
                        onChange={(event) => setField({ amount: event.target.value })}
                        className={`h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 focus:outline-none${inputFocusClass} ${
                          discountInputAffix.prefix ? "pl-10 pr-3" : "pl-3 pr-10"
                        }`}
                        disabled={isSubmitting}
                        required
                      />
                      {discountInputAffix.suffix ? (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 dark:text-slate-400">
                          {discountInputAffix.suffix}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t("coupons.Minimum Amount", "Minimum Amount")}
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.minSpend}
                        onChange={(event) => setField({ minSpend: event.target.value })}
                        className={`h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none${inputFocusClass}`}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/40 px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                  {t("coupons.Set a minimum order only when needed.", "Set a minimum order only when needed.")}
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <CouponDrawerSectionHeader
                eyebrow={compact ? "" : "Validity"}
                title={compact ? t("coupons.Validity & Status", "Validity & Status") : "Confirm active window and storefront visibility"}
                description={compact ? t("coupons.Set the active period and storefront visibility.", "Set the active period and storefront visibility.") : "Review the campaign schedule and decide whether checkout should see it immediately after save."}
                meta={compact ? "" : (form.endDate ? `Ends ${form.endDate}` : "No expiry yet")}
                compact={compact}
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("coupons.Start Date", "Start Date")}
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setField({ startDate: event.target.value })}
                    className={`h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none${inputFocusClass}`}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("coupons.End Date", "End Date")}
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) => setField({ endDate: event.target.value })}
                    className={`h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none${inputFocusClass}`}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {compact ? (
                <div className="acf26-toggle-card mt-4">
                  <div>
                    <p className="title">{t("coupons.Published", "Published")}</p>
                    <p className="desc">{t("coupons.Enable coupon for checkout immediately", "Enable coupon for checkout immediately")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setField({ active: !form.active })}
                    disabled={isSubmitting}
                    className={`acf26-switch ${form.active ? "is-active" : ""}`}
                    aria-label={t("coupons.Published", "Published")}
                  >
                    <span className="acf26-switch-thumb" />
                  </button>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t("coupons.Published", "Published")}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t("coupons.Enable coupon for checkout immediately", "Enable coupon for checkout immediately")}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setField({ active: !form.active })}
                      disabled={isSubmitting}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        form.active ? toggleActiveClass : "bg-slate-300 dark:bg-slate-700"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                      aria-label="Toggle published"
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                          form.active ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {!compact ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1">
                  {form.startDate ? `Starts ${form.startDate}` : "Start date optional"}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1">
                  {form.scopeType === "STORE" ? "Seller-owned / admin-governed" : "Admin-owned global"}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1">
                  {form.endDate ? `Ends ${form.endDate}` : "End date optional"}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1">
                  {form.active ? "Visible after save" : "Hidden after save"}
                </span>
              </div>
              ) : null}
            </section>

            <section className={cardClass}>
              <CouponDrawerSectionHeader
                eyebrow={compact ? "" : "Media"}
                title={compact ? t("coupons.Coupon Banner", "Coupon Banner") : "Banner"}
                description={compact ? t("coupons.Upload a campaign banner image for promotions.", "Upload a campaign banner image for promotions.") : "Upload a campaign banner and save its shared media URL to this coupon."}
                compact={compact}
              />
              <div className="mt-4">
                <label className={compact ? "acf26-upload-zone" : `block cursor-pointer rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 transition hover:border-[#034c85]`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isSubmitting || bannerUploading}
                  />
                  {bannerPreviewSrc ? (
                    <div className="space-y-3">
                      <div className={compact ? "acf26-upload-preview" : "relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100/80 aspect-[16/5] sm:aspect-[16/4]"}>
                        <img
                          src={bannerPreviewSrc}
                          alt="Coupon banner preview"
                          className={compact ? "" : "absolute inset-0 h-full w-full object-contain"}
                        />
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-left">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {bannerFileName || "Uploaded coupon banner"}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {bannerUploading
                              ? t("coupons.Uploading banner image...", "Uploading banner image...")
                              : form.bannerImageUrl
                                ? t("coupons.Banner uploaded and ready to save.", "Banner uploaded and ready to save.")
                                : t("coupons.Upload did not finish. Select the image again before saving.", "Upload did not finish. Select the image again before saving.")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleRemoveBanner();
                          }}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          disabled={isSubmitting || bannerUploading}
                        >
                          {t("coupons.Remove", "Remove")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
                      <span className={compact ? "acf26-upload-icon" : `inline-flex h-10 w-10 items-center justify-center rounded-full ${uploadAccentClass}`}>
                        <ImagePlus className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                          {bannerUploading ? t("coupons.Uploading banner image...", "Uploading banner image...") : t("coupons.Upload banner image", "Upload banner image")}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          PNG, JPG, WebP (Max 5MB)
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
              {bannerUploadError ? (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {bannerUploadError}
                </div>
              ) : null}
            </section>

            {submitError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {submitError || GENERIC_ERROR}
              </div>
            ) : null}
          </div>

          <footer className={footerClassName}>
            {compact ? (
              <div className="acf26-footer-inner">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="acf26-btn-cancel"
                >
                  {t("coupons.Cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="acf26-btn-submit"
                >
                  {isSubmitting ? t("coupons.Adding...", "Adding...") : t("coupons.Create Coupon", "Create Coupon")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-xs text-slate-500">
                  <p>
                    {form.code
                      ? `${form.code} will be saved as a ${form.discountType === "percent" ? "percentage" : "fixed"} campaign.`
                      : "Review campaign code, discount rule, and validity before saving this coupon."}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:min-w-[280px]">
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 px-4 text-sm font-semibold"
                  >
                    {t("coupons.Cancel", "Cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#034c85] hover:bg-[#023863] px-4 text-sm font-semibold text-white transition shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? t("coupons.Adding...", "Adding...") : t("coupons.Add Coupon", "Add Coupon")}
                  </button>
                </div>
              </div>
            )}
          </footer>
        </form>
    </>
  );
}

export default function AddCouponDrawer({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  storeOptions = [],
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45"
        onClick={() => !isSubmitting && onClose()}
        aria-label="Close add coupon drawer"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col border-l border-slate-200 bg-white shadow-2xl">
        <AddCouponFormPanel
          onCancel={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error={error}
          storeOptions={storeOptions}
          resetSignal={open}
        />
      </aside>
    </div>
  );
}
