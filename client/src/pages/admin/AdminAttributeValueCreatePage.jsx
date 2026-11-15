import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Layers,
  Plus,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import {
  createAdminAttributeValue,
  fetchAdminAttributes,
  fetchAdminAttributeValues,
} from "../../lib/adminApi.js";
import VariantInput from "../../components/admin/attributes/VariantInput.jsx";
import "./productForm2026/admin-product-form-2026.css";
import "./attributeForm2026/admin-attribute-form-2026.css";

const toText = (value) => String(value ?? "").trim();

const invalidateAttributeSurfaces = (queryClient, numericAttributeId) => {
  queryClient.invalidateQueries({ queryKey: ["admin", "attribute-values", numericAttributeId] });
  queryClient.invalidateQueries({ queryKey: ["admin", "attributes"] });
  queryClient.invalidateQueries({ queryKey: ["admin-product-attributes"] });
  queryClient.invalidateQueries({ queryKey: ["seller2026", "attributes"] });
  queryClient.invalidateQueries({ queryKey: ["seller2026", "product-editor", "attributes"] });
  queryClient.invalidateQueries({ queryKey: ["seller-attributes"] });
  queryClient.invalidateQueries({ queryKey: ["attributes"] });
  queryClient.invalidateQueries({ queryKey: ["product"] });
  queryClient.invalidateQueries({ queryKey: ["storefront", "products"] });
};

export default function AdminAttributeValueCreatePage() {
  const { t, i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");
  const { attributeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef(null);

  const numericAttributeId = Number(attributeId);

  const [singleValue, setSingleValue] = useState("");
  const [variantsList, setVariantsList] = useState([]);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  const parentAttributeQuery = useQuery({
    queryKey: ["admin", "attribute-parent", numericAttributeId],
    enabled: Number.isInteger(numericAttributeId) && numericAttributeId > 0,
    queryFn: async () => {
      const response = await fetchAdminAttributes({ page: 1, limit: 500 });
      return Array.isArray(response?.data)
        ? response.data.find((attribute) => Number(attribute.id) === numericAttributeId) || null
        : null;
    },
  });

  const valuesQuery = useQuery({
    queryKey: ["admin", "attribute-values", numericAttributeId],
    enabled: Number.isInteger(numericAttributeId) && numericAttributeId > 0,
    queryFn: () => fetchAdminAttributeValues(numericAttributeId),
  });

  const parentAttribute = parentAttributeQuery.data || null;
  const existingValues = Array.isArray(valuesQuery.data?.data) ? valuesQuery.data.data : [];

  const existingValueTexts = useMemo(
    () => new Set(existingValues.map((entry) => toText(entry.value).toLowerCase())),
    [existingValues]
  );

  const createMutation = useMutation({
    mutationFn: async (valuesToCreate) => {
      const created = [];
      for (const val of valuesToCreate) {
        const res = await createAdminAttributeValue(numericAttributeId, { value: val });
        created.push(res);
      }
      return created;
    },
    onSuccess: (data) => {
      invalidateAttributeSurfaces(queryClient, numericAttributeId);
      const count = data?.length || 1;
      toast.success(
        count > 1
          ? isId
            ? `${count} nilai variasi berhasil ditambahkan.`
            : `${count} attribute values created successfully.`
          : isId
            ? "Nilai variasi berhasil ditambahkan."
            : t("attributes.Value added successfully.", "Value added successfully.")
      );
      navigate(`/admin/catalog/attributes/${numericAttributeId}/values`, { replace: true });
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        (isId ? "Gagal menambahkan nilai atribut." : t("attributes.Failed to add value.", "Failed to add value."));
      setSubmitError(message);
    },
  });

  const handleCancel = () => {
    if (createMutation.isPending) return;
    navigate(`/admin/catalog/attributes/${numericAttributeId}/values`);
  };

  const handleSubmit = (event) => {
    event?.preventDefault();
    if (createMutation.isPending) return;

    // Collect all values to create
    const candidates = [];

    // Add chips from variantsList
    for (const v of variantsList) {
      const trimmed = toText(v);
      if (trimmed && !candidates.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        candidates.push(trimmed);
      }
    }

    // Add single value if entered and not yet in chips
    const singleTrimmed = toText(singleValue);
    if (singleTrimmed && !candidates.some((c) => c.toLowerCase() === singleTrimmed.toLowerCase())) {
      candidates.push(singleTrimmed);
    }

    if (candidates.length === 0) {
      setSubmitError(
        isId
          ? "Silakan masukkan setidaknya satu nilai atribut."
          : t("attributes.Please enter at least one attribute value.", "Please enter at least one attribute value.")
      );
      inputRef.current?.focus();
      return;
    }

    // Check for existing duplicates
    const duplicates = candidates.filter((val) => existingValueTexts.has(val.toLowerCase()));
    if (duplicates.length > 0) {
      setSubmitError(
        isId
          ? `Nilai "${duplicates.join(", ")}" sudah ada pada atribut ini.`
          : `Value "${duplicates.join(", ")}" already exists for this attribute.`
      );
      return;
    }

    setSubmitError("");
    createMutation.mutate(candidates);
  };

  const handleSingleValueKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const trimmed = toText(singleValue);
      if (!trimmed) return;
      if (existingValueTexts.has(trimmed.toLowerCase())) {
        setSubmitError(
          isId
            ? `Nilai "${trimmed}" sudah ada.`
            : `Value "${trimmed}" already exists.`
        );
        return;
      }
      if (!variantsList.some((entry) => entry.toLowerCase() === trimmed.toLowerCase())) {
        setVariantsList((prev) => [...prev, trimmed]);
      }
      setSingleValue("");
      setSubmitError("");
    }
  };

  const handleAddSingleToChips = () => {
    const trimmed = toText(singleValue);
    if (!trimmed) return;
    if (existingValueTexts.has(trimmed.toLowerCase())) {
      setSubmitError(
        isId
          ? `Nilai "${trimmed}" sudah ada.`
          : `Value "${trimmed}" already exists.`
      );
      return;
    }
    if (!variantsList.some((entry) => entry.toLowerCase() === trimmed.toLowerCase())) {
      setVariantsList((prev) => [...prev, trimmed]);
    }
    setSingleValue("");
    setSubmitError("");
    inputRef.current?.focus();
  };

  const attributeDisplayName =
    parentAttribute?.displayName || parentAttribute?.name || (numericAttributeId ? `#${numericAttributeId}` : "-");
  const optionType = toText(parentAttribute?.type || "dropdown");
  const scopeLabel = parentAttribute?.scope === "store" ? t("attributes.Store", "Store") : t("attributes.Global", "Global");
  const isPublished = Boolean(parentAttribute?.published);

  const totalCandidatesCount =
    variantsList.length + (toText(singleValue) && !variantsList.some((v) => v.toLowerCase() === toText(singleValue).toLowerCase()) ? 1 : 0);

  return (
    <div className="apf26-shell aaf26-shell">
      {/* Header */}
      <header className="apf26-header aaf26-header">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            {t("attributes.Add Attribute Value", "Add Attribute Value")}
          </h1>
          <nav className="aaf26-breadcrumb" aria-label="Breadcrumb">
            <button
              type="button"
              onClick={() => navigate("/admin/catalog/attributes")}
              className="hover:text-[#034c85] dark:hover:text-sky-400 transition"
            >
              {t("attributes.Attributes", "Attributes")}
            </button>
            <ChevronRight size={14} className="text-slate-400" />
            <button
              type="button"
              onClick={() => navigate(`/admin/catalog/attributes/${numericAttributeId}/values`)}
              className="hover:text-[#034c85] dark:hover:text-sky-400 transition"
            >
              {attributeDisplayName}
            </button>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-[#034c85] dark:text-sky-400">
              {t("attributes.Add Value", "Add Value")}
            </span>
          </nav>
        </div>

        <div className="aaf26-header-actions">
          <button
            type="button"
            className="apf26-close"
            onClick={handleCancel}
            aria-label={t("attributes.Close", "Close")}
            disabled={createMutation.isPending}
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="apf26-content aaf26-content py-6 px-4 sm:px-6">
        <div className="aaf26-layout space-y-6 max-w-3xl mx-auto">
          {/* Parent Attribute Context Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#034c85]/10 text-[#034c85] dark:bg-sky-950/50 dark:text-sky-400">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t("attributes.Catalog Attribute", "Catalog Attribute")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {isPublished ? t("attributes.Published", "Published") : t("attributes.Unpublished", "Unpublished")}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {attributeDisplayName}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold capitalize text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Layers className="h-3.5 w-3.5 text-[#034c85] dark:text-sky-400" />
                  {optionType}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {scopeLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-[#034c85]/20 bg-[#034c85]/10 px-3 py-1.5 text-xs font-bold text-[#034c85] dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-300">
                  {existingValues.length} {t("attributes.values", "values")}
                </span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isId ? "Detail Nilai Baru" : "New Value Details"}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {isId
                  ? "Tambahkan nilai variasi untuk atribut ini (misal: S, M, L, XL, atau Merah, Biru)."
                  : "Add variation values for this attribute (e.g., S, M, L, XL, or Red, Blue)."}
              </p>
            </div>

            <div className="p-6 space-y-5">
              {submitError ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              ) : null}

              {/* Single / Multiple Input */}
              <div className="space-y-2">
                <label
                  htmlFor="attribute-value-input"
                  className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                  {t("attributes.Variants", "Variants")} / {t("attributes.Value", "Value")}{" "}
                  <span className="text-rose-500">*</span>
                </label>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="attribute-value-input"
                      ref={inputRef}
                      type="text"
                      value={singleValue}
                      onChange={(e) => {
                        setSingleValue(e.target.value);
                        if (submitError) setSubmitError("");
                      }}
                      onKeyDown={handleSingleValueKeyDown}
                      disabled={createMutation.isPending}
                      placeholder={
                        isId
                          ? "Ketik nilai lalu tekan Enter atau koma (mis: XXL)..."
                          : t("attributes.Press enter to add variant", "Press enter to add variant")
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSingleToChips}
                    disabled={!toText(singleValue) || createMutation.isPending}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-[#034c85] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#fe6f05]" />
                    <span>{isId ? "Tambah" : "Add"}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isId
                    ? "Tekan Enter atau tanda koma (,) untuk menambahkan beberapa nilai sekaligus."
                    : t("attributes.Press Enter to add. Duplicates are ignored.", "Press Enter to add. Duplicates are ignored.")}
                </p>
              </div>

              {/* Tag Chips for values queue */}
              {variantsList.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {isId ? "Nilai yang Akan Ditambahkan" : "Values to Add"} ({variantsList.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setVariantsList([])}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                    >
                      {isId ? "Hapus Semua" : "Clear All"}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {variantsList.map((entry) => (
                      <span
                        key={entry}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#034c85]/20 bg-[#034c85]/10 px-3 py-1 text-xs font-bold text-[#034c85] dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-300 shadow-sm"
                      >
                        {entry}
                        <button
                          type="button"
                          onClick={() => setVariantsList((prev) => prev.filter((item) => item !== entry))}
                          disabled={createMutation.isPending}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-[#034c85]/20 dark:hover:bg-sky-400/20 transition"
                          aria-label={`Remove ${entry}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Existing Values Preview */}
              {existingValues.length > 0 ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                    {isId ? "Nilai yang Sudah Ada:" : "Existing Values in Catalog:"}
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {existingValues.map((v) => (
                      <span
                        key={v.id}
                        className="inline-block rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {v.value}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={handleCancel}
                disabled={createMutation.isPending}
                className="w-full sm:w-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t("attributes.Cancel", "Cancel")}</span>
              </button>

              <button
                type="submit"
                disabled={createMutation.isPending || totalCandidatesCount === 0}
                className="w-full sm:w-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#fe6f05] px-6 text-sm font-semibold text-white shadow-md shadow-[#fe6f05]/25 transition hover:bg-[#e05f00] focus:outline-none focus:ring-2 focus:ring-[#fe6f05]/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createMutation.isPending ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t("attributes.Saving...", "Saving...")}</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>
                      {totalCandidatesCount > 1
                        ? isId
                          ? `Simpan ${totalCandidatesCount} Nilai`
                          : `Add ${totalCandidatesCount} Values`
                        : t("attributes.Add Value", "Add Value")}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
