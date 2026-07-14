import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Boxes, CheckCircle2, ChevronDown, Database, Layers3, Moon, Plus, Sun, Trash2 } from "lucide-react";
import { useAdminAuth } from "../../../auth/authDomainHooks.js";
import { UiErrorState, UiSkeleton } from "../../primitives/state/index.js";
import {
  bulkAdminAttributes,
  createAdminAttribute,
  deleteAdminAttribute,
  exportAdminAttributes,
  fetchAdminAttributes,
  importAdminAttributes,
  updateAdminAttribute,
} from "../../../lib/adminApi.js";
import AttributeModal from "./AttributeModal.jsx";
import AdminAttributes2026View from "./AdminAttributes2026View.jsx";

const defaultFilters = {
  q: "",
  type: "",
  published: "",
  scope: "",
  status: "",
  createdByRole: "",
  storeId: "",
  page: 1,
  limit: 20,
};

const DEFAULT_COLUMN_VISIBILITY = {
  id: true,
  name: true,
  displayName: true,
  optionType: true,
  scope: true,
  store: true,
  published: true,
  values: true,
  actions: true,
};

const btnBase =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#fe6f05]/25";
const btnSoft = `${btnBase} border border-slate-200 bg-white text-slate-700 hover:border-[#034c85]/30 hover:bg-[#034c85]/5`;
const btnAmber = `${btnBase} bg-[#fe6f05] text-white shadow-sm shadow-[#fe6f05]/25 hover:bg-[#e86200]`;
const btnDanger = `${btnBase} border border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70`;
const btnGreen = `${btnBase} bg-[#034c85] text-white shadow-sm shadow-[#034c85]/25 hover:bg-[#023e6d]`;

const noticeStyles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
};

const toText = (value) => String(value ?? "").trim();

export const invalidateAdminAttributeSurfaces = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ["admin", "attributes"] });
  queryClient.invalidateQueries({ queryKey: ["admin-product-attributes"] });
  queryClient.invalidateQueries({ queryKey: ["seller2026", "attributes"] });
  queryClient.invalidateQueries({ queryKey: ["seller2026", "product-editor", "attributes"] });
  queryClient.invalidateQueries({ queryKey: ["seller-attributes"] });
  queryClient.invalidateQueries({ queryKey: ["attributes"] });
};

const parseFilename = (headerValue, fallback) => {
  const match = String(headerValue || "").match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
};

const downloadResponse = async (response, fallbackName) => {
  const blob = await response.blob();
  const filename = parseFilename(
    response.headers.get("content-disposition"),
    fallbackName
  );
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

const validateImportFile = async (file) => {
  const text = await file.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : null;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Import JSON must be a non-empty array.");
  }

  items.forEach((entry, index) => {
    const name = toText(entry?.name);
    const type = toText(entry?.type).toLowerCase();
    const values = Array.isArray(entry?.values) ? entry.values : [];
    if (!name) {
      throw new Error(`Row ${index + 1} is missing name.`);
    }
    if (!["dropdown", "radio", "checkbox"].includes(type)) {
      throw new Error(`Row ${index + 1} has invalid type.`);
    }
    if (values.length === 0) {
      throw new Error(`Row ${index + 1} must include at least one value.`);
    }
  });

  return {
    count: items.length,
  };
};

export default function AttributePage() {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bulkMenuRef = useRef(null);
  const { role } = useAdminAuth();
  const isSuperAdmin =
    ["super_admin", "superadmin", "super-admin", "super admin"].includes(
      String(role || "").trim().toLowerCase()
    );

  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [selectedIds, setSelectedIds] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_COLUMN_VISIBILITY);
  const [notice, setNotice] = useState(null);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [modalState, setModalState] = useState({
    open: false,
    mode: "create",
    attribute: null,
  });
  const [modalSubmitError, setModalSubmitError] = useState("");
  const [pendingImportFile, setPendingImportFile] = useState(null);
  const [pendingImportCount, setPendingImportCount] = useState(0);
  const [exportingFormat, setExportingFormat] = useState("");
  const [visualMode, setVisualMode] = useState("light");

  const queryParams = useMemo(
    () => ({
      page: appliedFilters.page,
      limit: appliedFilters.limit,
      q: toText(appliedFilters.q) || undefined,
      type: toText(appliedFilters.type) || undefined,
      scope: toText(appliedFilters.scope) || undefined,
      status: toText(appliedFilters.status) || undefined,
      createdByRole: toText(appliedFilters.createdByRole) || undefined,
      storeId: toText(appliedFilters.storeId) || undefined,
      published:
        appliedFilters.published === ""
          ? undefined
          : appliedFilters.published === "true",
    }),
    [appliedFilters]
  );

  const queryKey = useMemo(() => ["admin", "attributes", queryParams], [queryParams]);

  const attributesQuery = useQuery({
    queryKey,
    queryFn: () => fetchAdminAttributes(queryParams),
    keepPreviousData: true,
  });

  const attributes = Array.isArray(attributesQuery.data?.data) ? attributesQuery.data.data : [];
  const meta = attributesQuery.data?.meta || {
    page: queryParams.page,
    limit: queryParams.limit,
    total: 0,
    totalPages: 1,
  };
  const warning = attributesQuery.data?.warning || "";
  const canManageAttribute = (attribute) =>
    String(attribute?.scope || "global") !== "store" || isSuperAdmin;
  const pageStats = useMemo(() => {
    const published = attributes.filter((attribute) => Boolean(attribute.published)).length;
    const global = attributes.filter((attribute) => String(attribute.scope || "global") !== "store").length;
    const store = attributes.length - global;
    const withValues = attributes.filter(
      (attribute) =>
        Number(attribute.valueCount || 0) > 0 ||
        (Array.isArray(attribute.values) && attribute.values.length > 0)
    ).length;
    return { published, global, store, withValues };
  }, [attributes]);

  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) =>
        attributes.some(
          (attribute) => Number(attribute.id) === Number(id) && canManageAttribute(attribute)
        )
      )
    );
  }, [attributes, isSuperAdmin]);

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

  const openCreateModal = () => {
    navigate("/admin/catalog/attributes/new");
  };

  const openEditModal = (attribute) => {
    setModalSubmitError("");
    setModalState({ open: true, mode: "edit", attribute });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, open: false }));
    setModalSubmitError("");
  };

  const saveMutation = useMutation({
    mutationFn: ({ mode, attributeId, payload }) =>
      mode === "edit"
        ? updateAdminAttribute(attributeId, payload)
        : createAdminAttribute(payload),
    onSuccess: (_, variables) => {
      closeModal();
      setNotice({
        type: "success",
        message:
          variables.mode === "edit"
            ? "Attribute updated successfully."
            : "Attribute created successfully.",
      });
      invalidateAdminAttributeSurfaces(queryClient);
    },
    onError: (error) => {
      setModalSubmitError(error?.response?.data?.message || "Failed to save attribute.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminAttribute(id),
    onSuccess: (result) => {
      setNotice({
        type: "success",
        message: result?.archived
          ? "Store attribute archived successfully."
          : "Attribute deleted successfully.",
      });
      invalidateAdminAttributeSurfaces(queryClient);
    },
    onError: (error) => {
      setNotice({
        type: "error",
        message: error?.response?.data?.message || "Failed to delete attribute.",
      });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: ({ action, ids }) => bulkAdminAttributes(action, ids),
    onSuccess: (_, variables) => {
      setSelectedIds([]);
      setNotice({
        type: "success",
        message:
          variables.action === "delete"
            ? "Selected attributes deleted successfully."
            : variables.action === "publish"
              ? "Selected attributes published successfully."
              : "Selected attributes unpublished successfully.",
      });
      invalidateAdminAttributeSurfaces(queryClient);
    },
    onError: (error) => {
      setNotice({
        type: "error",
        message: error?.response?.data?.message || "Failed to run bulk action.",
      });
    },
  });

  const togglePublishedMutation = useMutation({
    mutationFn: ({ id, published }) => updateAdminAttribute(id, { published }),
    onMutate: async ({ id, published }) => {
      setNotice(null);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (current) => {
        if (!current || !Array.isArray(current.data)) return current;
        return {
          ...current,
          data: current.data.map((attribute) =>
            Number(attribute.id) === Number(id)
              ? { ...attribute, published: Boolean(published) }
              : attribute
          ),
        };
      });
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      setNotice({
        type: "error",
        message: error?.response?.data?.message || "Failed to update published state.",
      });
    },
    onSettled: () => {
      invalidateAdminAttributeSurfaces(queryClient);
    },
  });

  const importMutation = useMutation({
    mutationFn: (file) => importAdminAttributes(file),
    onSuccess: (result) => {
      setPendingImportFile(null);
      setPendingImportCount(0);
      setNotice({
        type: "success",
        message: `Import completed. ${result?.data?.created || 0} created, ${
          result?.data?.updated || 0
        } updated.`,
      });
      invalidateAdminAttributeSurfaces(queryClient);
    },
    onError: (error) => {
      setNotice({
        type: "error",
        message: error?.response?.data?.message || "Failed to import attributes.",
      });
    },
  });

  const handleApplyFilters = () => {
    setAppliedFilters((prev) => ({
      ...prev,
      q: draftFilters.q,
      type: draftFilters.type,
      published: draftFilters.published,
      scope: draftFilters.scope,
      status: draftFilters.status,
      createdByRole: draftFilters.createdByRole,
      storeId: draftFilters.storeId,
      page: 1,
    }));
    setSelectedIds([]);
  };

  const handleResetFilters = () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setSelectedIds([]);
  };

  const handleToggleSelectAll = () => {
    const manageableIds = attributes
      .filter(canManageAttribute)
      .map((attribute) => Number(attribute.id))
      .filter(Boolean);
    if (
      manageableIds.length > 0 &&
      manageableIds.every((id) => selectedIds.includes(Number(id)))
    ) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(manageableIds);
  };

  const handleToggleSelectRow = (id) => {
    const numericId = Number(id);
    if (!numericId) return;
    const attribute = attributes.find((entry) => Number(entry.id) === numericId);
    if (!attribute || !canManageAttribute(attribute)) return;
    setSelectedIds((prev) =>
      prev.includes(numericId)
        ? prev.filter((entry) => Number(entry) !== numericId)
        : [...prev, numericId]
    );
  };

  const handleModalSubmit = (payload) => {
    saveMutation.mutate({
      mode: modalState.mode,
      attributeId: modalState.attribute?.id ?? null,
      payload,
    });
  };

  const handleDeleteAttribute = (attribute) => {
    if (!attribute?.id) return;
    if (!window.confirm(`${t("attributes.Delete Attribute", "Delete Attribute")}: "${attribute.name}"?`)) return;
    deleteMutation.mutate(attribute.id);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${t("attributes.Delete", "Delete")} ${selectedIds.length} ${t("attributes.Attributes", "Attributes")}?`)) return;
    bulkMutation.mutate({ action: "delete", ids: selectedIds });
  };

  const handleBulkAction = (action) => {
    if (selectedIds.length === 0) return;
    if (action === "delete") {
      handleDeleteSelected();
      return;
    }
    bulkMutation.mutate({ action, ids: selectedIds });
  };

  const handleImportFileSelect = async (file) => {
    if (!file) {
      setPendingImportFile(null);
      setPendingImportCount(0);
      return;
    }

    try {
      const validation = await validateImportFile(file);
      setPendingImportFile(file);
      setPendingImportCount(validation.count);
      setNotice({
        type: "success",
        message: `${file.name} is ready to import.`,
      });
    } catch (error) {
      setPendingImportFile(null);
      setPendingImportCount(0);
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : t("attributes.Invalid import file.", "Invalid import file."),
      });
    }
  };

  const handleImportNow = () => {
    if (!pendingImportFile || importMutation.isPending) return;
    importMutation.mutate(pendingImportFile);
  };

  const handleExport = async (format) => {
    try {
      setExportingFormat(format);
      const response = await exportAdminAttributes(format, queryParams);
      await downloadResponse(response, `attributes-export.${format}`);
      setNotice({
        type: "success",
        message: `Attribute ${String(format).toUpperCase()} export downloaded.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : t("attributes.Failed to export attributes.", "Failed to export attributes."),
      });
    } finally {
      setExportingFormat("");
    }
  };

  return (
    <>
      {notice ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            noticeStyles[notice.type] || noticeStyles.success
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <AdminAttributes2026View
        attributes={attributes}
        stats={{
          total: meta.total || attributes.length,
          published: pageStats.published,
          global: pageStats.global,
          store: pageStats.store,
        }}
        meta={meta}
        filters={appliedFilters}
        selectedIds={selectedIds}
        isLoading={attributesQuery.isLoading}
        isError={attributesQuery.isError}
        errorMessage={attributesQuery.error?.message || ""}
        canManageRow={canManageAttribute}
        onRetry={() => attributesQuery.refetch()}
        onFilterChange={(newFilter) =>
          setAppliedFilters((prev) => ({
            ...prev,
            ...newFilter,
            page: 1,
          }))
        }
        onResetFilters={handleResetFilters}
        onSelectOne={handleToggleSelectRow}
        onSelectAll={handleToggleSelectAll}
        onAddAttribute={openCreateModal}
        onEditAttribute={openEditModal}
        onManageValues={(attribute) =>
          navigate(`/admin/catalog/attributes/${encodeURIComponent(String(attribute.id))}/values`, {
            state: { attribute },
          })
        }
        onDeleteAttribute={handleDeleteAttribute}
        onTogglePublished={(attribute) =>
          togglePublishedMutation.mutate({
            id: attribute.id,
            published: !attribute.published,
          })
        }
        onExport={handleExport}
        onImportFile={(file) => importMutation.mutate(file)}
        onBulkAction={(action) => handleBulkAction(action)}
        onPageChange={(page) =>
          setAppliedFilters((prev) => ({
            ...prev,
            page: Math.max(1, Number(page) || 1),
          }))
        }
      />

      <AttributeModal
        open={modalState.open}
        mode={modalState.mode}
        attribute={modalState.attribute}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        isSubmitting={saveMutation.isPending}
        submitError={modalSubmitError}
      />
    </>
  );
}
