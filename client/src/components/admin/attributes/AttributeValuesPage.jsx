import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { UiErrorState, UiSkeleton } from "../../primitives/state/index.js";
import {
  bulkDeleteAdminAttributeValues,
  deleteAdminAttributeValue,
  fetchAdminAttributes,
  fetchAdminAttributeValues,
  updateAdminAttributeValue,
} from "../../../lib/adminApi.js";
import "./admin-attributes-2026.css";

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

function ValueStatusBadge({ published }) {
  const { t } = useTranslation("admin");
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
        published
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          published ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-500"
        }`}
      />
      {published
        ? t("attributes.Inherited Published", "Inherited Published")
        : t("attributes.Inherited Unpublished", "Inherited Unpublished")}
    </span>
  );
}

function EditValueModal({
  open,
  parentAttribute,
  valueItem,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}) {
  const { t, i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");
  const [val, setVal] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && valueItem) {
      setVal(toText(valueItem.value));
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [open, valueItem]);

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = toText(val);
    if (!trimmed || isSubmitting) return;
    onSubmit?.(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={() => {
          if (!isSubmitting) onClose?.();
        }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        aria-label="Close edit value modal"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t("attributes.Edit Attribute Value", "Edit Attribute Value")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {parentAttribute?.displayName || parentAttribute?.name || ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isSubmitting) onClose?.();
            }}
            disabled={isSubmitting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div>
            <label
              htmlFor="edit-val-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
            >
              {t("attributes.Value", "Value")} <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-val-input"
              ref={inputRef}
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {t("attributes.Cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !toText(val)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#fe6f05] px-5 text-xs font-bold text-white shadow-md shadow-[#fe6f05]/20 transition hover:bg-[#e05f00] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t("attributes.Saving...", "Saving...") : t("attributes.Update Value", "Update Value")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AttributeValuesPage() {
  const { t, i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");
  const { attributeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const rowMenuRef = useRef(null);
  const bulkMenuRef = useRef(null);

  const numericAttributeId = Number(attributeId);
  const routeAttribute =
    location.state?.attribute && Number(location.state.attribute?.id) === numericAttributeId
      ? location.state.attribute
      : null;

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [notice, setNotice] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [editingItem, setEditingItem] = useState(null);
  const [editError, setEditError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);

  const parentAttributeQuery = useQuery({
    queryKey: ["admin", "attribute-parent", numericAttributeId],
    enabled: !routeAttribute && Number.isInteger(numericAttributeId) && numericAttributeId > 0,
    queryFn: async () => {
      const response = await fetchAdminAttributes({ page: 1, limit: 500 });
      return Array.isArray(response?.data)
        ? response.data.find((attribute) => Number(attribute.id) === numericAttributeId) || null
        : null;
    },
  });

  const parentAttribute = routeAttribute || parentAttributeQuery.data || null;

  const valuesQuery = useQuery({
    queryKey: ["admin", "attribute-values", numericAttributeId],
    enabled: Number.isInteger(numericAttributeId) && numericAttributeId > 0,
    queryFn: () => fetchAdminAttributeValues(numericAttributeId),
  });

  const values = Array.isArray(valuesQuery.data?.data) ? valuesQuery.data.data : [];
  const warning = valuesQuery.data?.warning || "";

  const filteredValues = useMemo(() => {
    const keyword = toText(search).toLowerCase();
    if (!keyword) return values;
    return values.filter((entry) => toText(entry?.value).toLowerCase().includes(keyword));
  }, [search, values]);

  const totalPages = Math.max(1, Math.ceil(filteredValues.length / limit));
  const paginatedValues = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredValues.slice(start, start + limit);
  }, [filteredValues, limit, page]);

  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => values.some((entry) => Number(entry.id) === Number(id)))
    );
  }, [values]);

  useEffect(() => {
    setPage((prev) => Math.min(Math.max(1, prev), totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!openMenuId) return undefined;
    const handleOutsideClick = (event) => {
      if (!rowMenuRef.current) return;
      if (!rowMenuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openMenuId]);

  useEffect(() => {
    if (!bulkMenuOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (!bulkMenuRef.current) return;
      if (!bulkMenuRef.current.contains(event.target)) {
        setBulkMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [bulkMenuOpen]);

  const updateMutation = useMutation({
    mutationFn: ({ id, value }) => updateAdminAttributeValue(id, { value }),
    onSuccess: () => {
      setEditingItem(null);
      setEditError("");
      toast.success(t("attributes.Value updated successfully.", "Value updated successfully."));
      invalidateAttributeSurfaces(queryClient, numericAttributeId);
    },
    onError: (error) => {
      setEditError(
        error?.response?.data?.message ||
        t("attributes.Failed to update value.", "Failed to update value.")
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminAttributeValue(id),
    onSuccess: () => {
      toast.success(t("attributes.Value deleted successfully.", "Value deleted successfully."));
      invalidateAttributeSurfaces(queryClient, numericAttributeId);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        t("attributes.Failed to delete value.", "Failed to delete value.")
      );
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => bulkDeleteAdminAttributeValues(ids),
    onSuccess: (result, ids) => {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      setBulkMenuOpen(false);
      const count = Number(result?.affected || ids.length || 0);
      toast.success(
        isId
          ? `${count} nilai berhasil dihapus.`
          : `${count} values deleted successfully.`
      );
      invalidateAttributeSurfaces(queryClient, numericAttributeId);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        t("attributes.Failed to delete selected values.", "Failed to delete selected values.")
      );
    },
  });

  const handleDeleteValue = (valueRow) => {
    if (!valueRow?.id) return;
    const confirmMsg = isId
      ? `Hapus nilai "${valueRow.value}"?`
      : `${t("attributes.Are you sure you want to delete value", "Are you sure you want to delete value")} "${valueRow.value}"?`;
    if (!window.confirm(confirmMsg)) return;
    deleteMutation.mutate(valueRow.id);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const confirmMsg = isId
      ? `Hapus ${selectedIds.length} nilai yang dipilih?`
      : `Delete ${selectedIds.length} selected value(s)?`;
    if (!window.confirm(confirmMsg)) return;
    bulkDeleteMutation.mutate(selectedIds);
  };

  const handleEditSubmit = (newVal) => {
    if (!editingItem?.id) return;
    updateMutation.mutate({ id: editingItem.id, value: newVal });
  };

  const allSelectedOnPage =
    paginatedValues.length > 0 &&
    paginatedValues.every((entry) => selectedIds.includes(Number(entry.id)));

  const attributeDisplayName =
    parentAttribute?.displayName || parentAttribute?.name || (numericAttributeId ? `#${numericAttributeId}` : "-");
  const optionType = toText(parentAttribute?.type || "dropdown");
  const isPublished = Boolean(parentAttribute?.published);
  const scopeLabel = parentAttribute?.scope === "store" ? t("attributes.Store", "Store") : t("attributes.Global", "Global");

  return (
    <div className="aa26-page">
      {/* Header */}
      <header className="aa26-header">
        <div className="min-w-0">
          <h1>{t("attributes.Attribute Values", "Attribute Values")}</h1>
          <nav aria-label="Breadcrumb">
            <button
              type="button"
              onClick={() => navigate("/admin/catalog/attributes")}
              className="text-[#034c85] dark:text-sky-400 hover:underline font-semibold transition"
            >
              {t("attributes.Attributes", "Attributes")}
            </button>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {attributeDisplayName}
            </span>
          </nav>
        </div>

        <div className="aa26-header__actions">
          {/* Bulk Action Menu */}
          <div className="relative" ref={bulkMenuRef}>
            <button
              type="button"
              onClick={() => setBulkMenuOpen((prev) => !prev)}
              disabled={selectedIds.length === 0 || bulkDeleteMutation.isPending}
              className="aa26-action"
            >
              <Pencil size={15} />
              <span>{t("attributes.Bulk Action", "Bulk Action")}</span>
              <ChevronDown size={14} />
            </button>

            {bulkMenuOpen ? (
              <div className="aa26-more-menu" style={{ right: 0, top: "calc(100% + 6px)", bottom: "auto" }}>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="is-danger"
                >
                  <Trash2 size={15} />
                  <span>{t("attributes.Delete Selected", "Delete Selected")} ({selectedIds.length})</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* Delete Selected Direct Button */}
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0 || bulkDeleteMutation.isPending}
            className="aa26-action aa26-action--danger"
            title={t("attributes.Delete Selected", "Delete Selected")}
          >
            <Trash2 size={15} />
            <span>
              {bulkDeleteMutation.isPending
                ? t("attributes.Deleting...", "Deleting...")
                : t("attributes.Delete", "Delete")}
            </span>
          </button>

          {/* + Add Value Button (Navigates to dedicated new page) */}
          <button
            type="button"
            onClick={() => navigate(`/admin/catalog/attributes/${numericAttributeId}/values/new`)}
            className="aa26-action aa26-action--primary"
          >
            <Plus size={16} />
            <span>{t("attributes.Add Value", "Add Value")}</span>
          </button>
        </div>
      </header>

      {/* 4 KPI Cards */}
      <section className="aa26-kpis" aria-label="Attribute Metrics">
        {/* KPI 1: Total Values */}
        <article className="aa26-kpi aa26-kpi--blue">
          <div>
            <p>{t("attributes.Total Values", "Total Values")}</p>
            <strong>{values.length}</strong>
            <span>{t("attributes.All variation values", "All variation values")}</span>
          </div>
          <span className="aa26-kpi__icon">
            <Boxes size={22} />
          </span>
        </article>

        {/* KPI 2: Status */}
        <article className="aa26-kpi aa26-kpi--green">
          <div>
            <p>{t("attributes.Status", "Status")}</p>
            <strong>
              {isPublished ? t("attributes.Published", "Published") : t("attributes.Draft", "Draft")}
            </strong>
            <span>{t("attributes.Storefront visibility", "Storefront visibility")}</span>
          </div>
          <span className="aa26-kpi__icon">
            <CheckCircle2 size={22} />
          </span>
        </article>

        {/* KPI 3: Option Type */}
        <article className="aa26-kpi aa26-kpi--orange">
          <div>
            <p>{t("attributes.Option Type", "Option Type")}</p>
            <strong className="capitalize">{optionType}</strong>
            <span>{t("attributes.Input option style", "Input option style")}</span>
          </div>
          <span className="aa26-kpi__icon">
            <SlidersHorizontal size={22} />
          </span>
        </article>

        {/* KPI 4: Scope */}
        <article className="aa26-kpi aa26-kpi--blue">
          <div>
            <p>{t("attributes.Scope", "Scope")}</p>
            <strong>{scopeLabel}</strong>
            <span>
              {parentAttribute?.scope === "store"
                ? t("attributes.Store-specific", "Store-specific")
                : t("attributes.System-wide", "System-wide")}
            </span>
          </div>
          <span className="aa26-kpi__icon">
            <Package size={22} />
          </span>
        </article>
      </section>

      {/* Search Toolbar */}
      <div className="aa26-toolbar">
        <div className="aa26-search">
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("attributes.Search by name...", "Search by name...")}
            aria-label={t("attributes.Search by name...", "Search by name...")}
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">
          <span>
            {filteredValues.length} {t("attributes.values", "values")}
          </span>
        </div>
      </div>

      {warning ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          {warning}
        </div>
      ) : null}

      {/* Loading & Error States */}
      {valuesQuery.isLoading || parentAttributeQuery.isLoading ? (
        <UiSkeleton variant="table" rows={6} />
      ) : null}

      {valuesQuery.isError ? (
        <UiErrorState
          title={t("attributes.Failed to load attribute values", "Failed to load attribute values")}
          message={t(
            "attributes.Please retry to load the latest values truth from the backend.",
            "Please retry to load the latest values truth from the backend."
          )}
          onRetry={valuesQuery.refetch}
        />
      ) : null}

      {/* Main Table Card */}
      {!valuesQuery.isLoading && !valuesQuery.isError ? (
        <div className="aa26-table-card">
          {/* Desktop Table View */}
          <div className="aa26-table-wrap hidden md:block">
            <table className="aa26-table">
              <thead>
                <tr>
                  <th className="w-12 text-center">
                    <input
                      type="checkbox"
                      checked={allSelectedOnPage}
                      onChange={() =>
                        setSelectedIds((prev) => {
                          const currentPageIds = paginatedValues
                            .map((entry) => Number(entry.id))
                            .filter(Boolean);
                          if (allSelectedOnPage) {
                            return prev.filter((id) => !currentPageIds.includes(id));
                          }
                          return Array.from(new Set([...prev, ...currentPageIds]));
                        })
                      }
                      aria-label={t("attributes.Select all attributes", "Select all attributes")}
                    />
                  </th>
                  <th style={{ width: "120px" }}>{t("attributes.ID", "ID")}</th>
                  <th>{t("attributes.Name", "Name")}</th>
                  <th style={{ width: "140px" }}>{t("attributes.Type", "Type")}</th>
                  <th style={{ width: "200px" }}>{t("attributes.Status", "Status")}</th>
                  <th style={{ width: "120px", textAlign: "right" }}>
                    {t("attributes.Actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedValues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                      {t(
                        "attributes.No values found for this attribute.",
                        "No values found for this attribute."
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedValues.map((valueRow) => {
                    const rowId = Number(valueRow.id);
                    const isDeleting =
                      deleteMutation.isPending && deleteMutation.variables === rowId;
                    const isSelected = selectedIds.includes(rowId);

                    return (
                      <tr key={rowId} className={isSelected ? "is-selected" : ""}>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(rowId)
                                  ? prev.filter((id) => Number(id) !== rowId)
                                  : [...prev, rowId]
                              )
                            }
                            aria-label={`Select ${valueRow.value}`}
                          />
                        </td>
                        <td>
                          <span className="inline-flex items-center rounded-md border border-[#034c85]/20 bg-[#034c85]/10 px-2 py-0.5 text-xs font-bold text-[#034c85] dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-300">
                            C{rowId}
                          </span>
                        </td>
                        <td>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {valueRow.value || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {optionType}
                          </span>
                        </td>
                        <td>
                          <ValueStatusBadge published={isPublished} />
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditError("");
                                setEditingItem(valueRow);
                              }}
                              className="aa26-icon-button"
                              title={t("attributes.Edit Value", "Edit Value")}
                              aria-label={`Edit ${valueRow.value}`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteValue(valueRow)}
                              disabled={isDeleting}
                              className="aa26-icon-button text-rose-600 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title={t("attributes.Delete", "Delete")}
                              aria-label={`Delete ${valueRow.value}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Feed View */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedValues.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {t(
                  "attributes.No values found for this attribute.",
                  "No values found for this attribute."
                )}
              </div>
            ) : (
              paginatedValues.map((valueRow) => {
                const rowId = Number(valueRow.id);
                const isSelected = selectedIds.includes(rowId);
                const isDeleting =
                  deleteMutation.isPending && deleteMutation.variables === rowId;

                return (
                  <article key={rowId} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            setSelectedIds((prev) =>
                              prev.includes(rowId)
                                ? prev.filter((id) => Number(id) !== rowId)
                                : [...prev, rowId]
                            )
                          }
                          aria-label={`Select ${valueRow.value}`}
                          className="h-4 w-4"
                        />
                        <span className="inline-flex items-center rounded-md border border-[#034c85]/20 bg-[#034c85]/10 px-2 py-0.5 text-xs font-bold text-[#034c85] dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-300">
                          C{rowId}
                        </span>
                        <strong className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {valueRow.value || "-"}
                        </strong>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditError("");
                            setEditingItem(valueRow);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          aria-label={`Edit ${valueRow.value}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteValue(valueRow)}
                          disabled={isDeleting}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400"
                          aria-label={`Delete ${valueRow.value}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold capitalize text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {optionType}
                      </span>
                      <ValueStatusBadge published={isPublished} />
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          <div className="aa26-pagination">
            <div className="text-xs sm:text-sm font-medium">
              {selectedIds.length} {t("attributes.of", "of")} {filteredValues.length}{" "}
              {t("attributes.row(s) selected", "row(s) selected")}.
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs sm:text-sm">
                <span>{t("attributes.Rows per page", "Rows per page")}</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {[10, 20, 50].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                {t("attributes.Page", "Page")} {page} {t("attributes.of", "of")} {totalPages}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  aria-label={t("attributes.Previous page", "Previous page")}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  aria-label={t("attributes.Next page", "Next page")}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Value Modal */}
      <EditValueModal
        open={Boolean(editingItem)}
        parentAttribute={parentAttribute}
        valueItem={editingItem}
        onClose={() => {
          if (!updateMutation.isPending) {
            setEditingItem(null);
            setEditError("");
          }
        }}
        onSubmit={handleEditSubmit}
        isSubmitting={updateMutation.isPending}
        error={editError}
      />
    </div>
  );
}
