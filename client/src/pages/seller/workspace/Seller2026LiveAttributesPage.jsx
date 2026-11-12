import React, { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  CheckCircle2,
  Circle,
  Download,
  Filter,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Tags,
  Upload,
} from "lucide-react";
import { exportSellerAttributes, importSellerAttributes } from "../../../api/sellerAttributes.ts";
import {
  formatSeller2026AttributeDate,
  getSeller2026AttributeLabels,
} from "../../../api/seller2026/attributes.adapter.ts";
import { useSeller2026Attributes } from "../../../hooks/seller2026/useSeller2026Attributes.ts";
import { Seller2026Shell } from "../../../features/sellerWorkspace2026/components/Seller2026Shell.jsx";
import Seller2026AttributeDrawer from "../../../features/sellerWorkspace2026/components/Seller2026AttributeDrawer.jsx";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../../features/sellerWorkspace2026/SellerWorkspace2026.css";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const statusClass = (status) => (status === "published" || status === "active" ? "published" : "draft");

export default function Seller2026LiveAttributesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const importInputRef = useRef(null);
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes, isId: outletIsId = false } = useSellerWorkspaceRoute();
  const { i18n } = useTranslation();
  const isId = Boolean(outletIsId || String(i18n.language || "").toLowerCase().startsWith("id"));
  const labels = useMemo(() => getSeller2026AttributeLabels(isId), [isId]);

  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("CATALOG_ATTRIBUTE_READ");
  const canCreate = can("CATALOG_ATTRIBUTE_CREATE");
  const canUpdate = can("CATALOG_ATTRIBUTE_UPDATE");
  const canManageStatus = can("CATALOG_ATTRIBUTE_STATUS_MANAGE");
  const canDelete = can("CATALOG_ATTRIBUTE_DELETE");
  const canManageValues = can("CATALOG_ATTRIBUTE_VALUE_UPDATE");

  const query = {
    search: searchParams.get("q") || "",
    type: searchParams.get("type") || "all",
    status: searchParams.get("status") || "all",
    usage: searchParams.get("usage") || "all",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 10),
  };

  const {
    attributes,
    summary,
    filters,
    selectedIds,
    setSelectedIds,
    pagination,
    isLoading,
    isError,
    refetch,
    createAttribute,
    updateAttribute,
    isCreating,
    isUpdating,
  } = useSeller2026Attributes(storeId, query, {
    enabled: canView,
    permissions: {
      canEdit: canUpdate,
      canManageValues,
      canPublish: canManageStatus,
      canUnpublish: canManageStatus,
      canArchive: canDelete,
    },
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeAttribute, setActiveAttribute] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const updateQuery = (key, value) => {
    const next = new URLSearchParams(searchParams);
    const paramKey = key === "search" ? "q" : key;
    const normalized = String(value || "").trim();
    if (!normalized || normalized === "all" || (paramKey === "page" && Number(normalized) <= 1)) {
      next.delete(paramKey);
    } else {
      next.set(paramKey, normalized);
    }
    if (paramKey !== "page") next.delete("page");
    setSearchParams(next);
  };

  const saveAttribute = async (form) => {
    try {
      if (activeAttribute) {
        await updateAttribute({ attributeId: activeAttribute.id, payload: form });
        toast.success(isId ? "Atribut berhasil diperbarui" : "Attribute updated", { id: "seller2026-attribute-updated" });
      } else {
        await createAttribute(form);
        toast.success(isId ? "Atribut berhasil dibuat" : "Attribute created", { id: "seller2026-attribute-created" });
      }
      setDrawerOpen(false);
    } catch {
      toast.error(activeAttribute ? (isId ? "Gagal memperbarui atribut" : "Unable to update attribute") : (isId ? "Gagal membuat atribut" : "Unable to create attribute"));
    }
  };

  const toggleSelection = (attributeId) => {
    setSelectedIds((current) =>
      current.includes(attributeId)
        ? current.filter((id) => id !== attributeId)
        : [...current, attributeId]
    );
  };

  const toggleAllVisible = () => {
    const visibleIds = attributes.map((attribute) => attribute.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds(
      allSelected
        ? selectedIds.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...selectedIds, ...visibleIds]))
    );
  };

  const exportAttributes = async () => {
    if (!storeId) return;
    setIsExporting(true);
    try {
      const response = await exportSellerAttributes(storeId, { format: "csv" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "seller-attributes.csv";
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(isId ? "Atribut berhasil diekspor" : "Attributes exported");
    } catch {
      toast.error(isId ? "Gagal mengekspor atribut" : "Unable to export attributes");
    } finally {
      setIsExporting(false);
    }
  };

  const importAttributes = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !storeId) return;
    setIsImporting(true);
    try {
      await importSellerAttributes(storeId, file);
      await refetch();
      toast.success(isId ? "Atribut berhasil diimpor" : "Attributes imported");
    } catch {
      toast.error(isId ? "Gagal mengimpor atribut" : "Unable to import attributes");
    } finally {
      setIsImporting(false);
    }
  };

  if (!canView) {
    return (
      <Seller2026Shell section="taxonomy" mode="embedded" storeContext={sellerContext}>
        <div className="seller2026-state seller2026-state--danger">
          <h1>{isId ? "Akses Ditolak" : "Access Denied"}</h1>
          <p>{isId ? "Membutuhkan izin untuk melihat atribut." : "Requires permission to view attributes."}</p>
        </div>
      </Seller2026Shell>
    );
  }

  const bulkButtonLabel = selectedIds.length > 0
    ? (isId ? `Aksi Massal (${selectedIds.length})` : `Bulk Actions (${selectedIds.length})`)
    : (isId ? "Aksi Massal" : "Bulk Actions");

  return (
    <Seller2026Shell section="taxonomy" mode="embedded" storeContext={sellerContext} activeNavOverride="attributes">
      <section className="seller2026-attributes" data-seller2026-live-attributes="true">
        <header className="seller2026-attributes-header">
          <div className="seller2026-header-titles">
            <h1>{isId ? "Atribut" : "Attributes"}</h1>
            <p>{isId ? "Kelola atribut dan opsi varian produk Anda." : "Manage product attributes."}</p>
          </div>
          <div className="seller2026-header-actions">
            <button className="seller2026-btn-outline" type="button" onClick={exportAttributes} disabled={isExporting}>
              <Download size={16} /> {isId ? "Ekspor" : "Export"}
            </button>
            <button className="seller2026-btn-outline" type="button" onClick={() => importInputRef.current?.click()} disabled={isImporting}>
              <Upload size={16} /> {isId ? "Impor" : "Import"}
            </button>
            <input ref={importInputRef} type="file" accept=".json,.csv" hidden onChange={importAttributes} />
            <button className="seller2026-btn-outline" type="button" disabled={selectedIds.length === 0} title={selectedIds.length === 0 ? (isId ? "Pilih atribut terlebih dahulu" : "Select attributes first") : (isId ? "Aksi massal" : "Bulk actions")}>
              <Layers size={16} /> {bulkButtonLabel}
            </button>
            {canCreate ? (
              <button className="seller2026-btn-primary" type="button" onClick={() => { setActiveAttribute(null); setDrawerOpen(true); }}>
                <Plus size={16} /> {isId ? "Tambah Atribut" : "Add Attribute"}
              </button>
            ) : null}
          </div>
        </header>

        <div className="seller2026-attributes-summary">
          <article className="seller2026-kpi-card">
            <div>
              <p className="seller2026-kpi-label">{isId ? "Total Atribut" : "Total Attributes"}</p>
              <p className="seller2026-kpi-value">{summary.total}</p>
            </div>
            <span className="seller2026-kpi-icon icon-gray"><Tags size={24} /></span>
          </article>
          <article className="seller2026-kpi-card">
            <div>
              <p className="seller2026-kpi-label">{isId ? "Dipublikasikan" : "Published"}</p>
              <p className="seller2026-kpi-value">{summary.published}</p>
            </div>
            <span className="seller2026-kpi-icon icon-green"><CheckCircle2 size={24} /></span>
          </article>
          <article className="seller2026-kpi-card">
            <div>
              <p className="seller2026-kpi-label">{isId ? "Belum Digunakan" : "Unused"}</p>
              <p className="seller2026-kpi-value">{summary.unused}</p>
            </div>
            <span className="seller2026-kpi-icon icon-amber"><Circle size={24} /></span>
          </article>
          <article className="seller2026-kpi-card">
            <div>
              <p className="seller2026-kpi-label">{isId ? "Memiliki Nilai" : "With Values"}</p>
              <p className="seller2026-kpi-value">{summary.withValues}</p>
            </div>
            <span className="seller2026-kpi-icon icon-blue"><Layers size={24} /></span>
          </article>
        </div>

        <div className="seller2026-attributes-toolbar">
          <label className="seller2026-search-wrapper">
            <Search className="seller2026-search-icon" size={16} />
            <input
              aria-label={isId ? "Cari atribut" : "Search attributes"}
              className="seller2026-search-input"
              placeholder={isId ? "Cari atribut..." : "Search attributes..."}
              value={filters.search}
              onChange={(event) => updateQuery("search", event.target.value)}
            />
          </label>
          <div className="seller2026-filters-right">
            <select className="seller2026-select-outline" aria-label={isId ? "Tipe Opsi" : "Option Type"} value={filters.type} onChange={(event) => updateQuery("type", event.target.value)}>
              <option value="all">{isId ? "Semua Tipe" : "All Types"}</option>
              <option value="dropdown">Dropdown</option>
              <option value="radio">Radio</option>
              <option value="checkbox">{isId ? "Kotak Centang" : "Checkbox"}</option>
            </select>
            <select className="seller2026-select-outline" aria-label={isId ? "Status" : "Status"} value={filters.status} onChange={(event) => updateQuery("status", event.target.value)}>
              <option value="all">{isId ? "Semua Status" : "All Statuses"}</option>
              <option value="published">{isId ? "Dipublikasikan" : "Published"}</option>
              <option value="draft">{isId ? "Draf" : "Draft"}</option>
              <option value="active">{isId ? "Aktif" : "Active"}</option>
              <option value="inactive">{isId ? "Nonaktif" : "Inactive"}</option>
            </select>
            <select className="seller2026-select-outline" aria-label={isId ? "Penggunaan" : "Usage"} value={filters.usage} onChange={(event) => updateQuery("usage", event.target.value)}>
              <option value="all">{isId ? "Semua Penggunaan" : "All Usage"}</option>
              <option value="in_use">{isId ? "Digunakan" : "In Use"}</option>
              <option value="unused">{isId ? "Belum Digunakan" : "Unused"}</option>
              <option value="with_values">{isId ? "Memiliki Nilai" : "With Values"}</option>
              <option value="no_values">{isId ? "Tanpa Nilai" : "No Values"}</option>
            </select>
            <button className="seller2026-btn-accent" type="button" title={isId ? "Terapkan filter" : "Apply filters"}>
              <Filter size={16} /> {isId ? "Terapkan" : "Apply"}
            </button>
            <button className="seller2026-btn-cancel" type="button" onClick={() => setSearchParams(new URLSearchParams())} title={isId ? "Reset semua filter" : "Reset all filters"}>
              <RotateCcw size={16} /> {isId ? "Atur Ulang" : "Reset"}
            </button>
          </div>
        </div>

        <div className="seller2026-attributes-table-container">
          <table className="seller2026-table seller2026-attributes-table">
            <thead>
              <tr>
                <th>
                  <input
                    aria-label={isId ? "Pilih semua atribut" : "Select visible attributes"}
                    type="checkbox"
                    checked={attributes.length > 0 && attributes.every((attribute) => selectedIds.includes(attribute.id))}
                    onChange={toggleAllVisible}
                  />
                </th>
                <th>{isId ? "Nama" : "Name"}</th>
                <th>{isId ? "Nama Tampilan" : "Display Name"}</th>
                <th>{isId ? "Tipe Opsi" : "Option Type"}</th>
                <th>{isId ? "Nilai" : "Values"}</th>
                <th>{isId ? "Penggunaan" : "Usage"}</th>
                <th>{isId ? "Status" : "Status"}</th>
                <th>{isId ? "Diperbarui" : "Updated"}</th>
                <th>{isId ? "Aksi" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="seller2026-table-loading">{isId ? "Memuat data atribut..." : "Loading attributes..."}</td></tr>
              ) : isError ? (
                <tr><td colSpan={9} className="seller2026-table-error">{isId ? "Gagal memuat atribut" : "Unable to load attributes"}</td></tr>
              ) : attributes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="seller2026-table-empty">
                    <h2>{isId ? "Belum ada atribut" : "No attributes yet"}</h2>
                    <p>{isId ? "Buat atribut pertama Anda untuk mengatur opsi produk." : "Create your first attribute for product options."}</p>
                    {canCreate ? <button className="seller2026-btn-primary" type="button" onClick={() => { setActiveAttribute(null); setDrawerOpen(true); }}>{isId ? "Tambah Atribut" : "Add Attribute"}</button> : null}
                  </td>
                </tr>
              ) : (
                attributes.map((attribute) => {
                  const formattedDate = formatSeller2026AttributeDate(
                    attribute.rawUpdatedAt || attribute.updatedAt,
                    isId
                  );
                  const optionTypeLabel = labels.optionType[attribute.optionType] || attribute.optionType;
                  const usageLabel = labels.usage[attribute.usageStatus] || attribute.usageStatus;
                  const statusLabel = labels.status[attribute.status] || attribute.status;

                  return (
                    <tr key={attribute.id} className="seller2026-table-row">
                      <td data-label={isId ? "Pilih" : "Select"}>
                        <input
                          aria-label={`Select ${attribute.name}`}
                          type="checkbox"
                          checked={selectedIds.includes(attribute.id)}
                          onChange={() => toggleSelection(attribute.id)}
                        />
                      </td>
                      <td data-label={isId ? "Nama" : "Name"} className="seller2026-fw-500" title={attribute.name}>
                        <strong
                          className={attribute.permissions.canEdit ? "is-clickable" : ""}
                          title={attribute.permissions.canEdit ? (isId ? "Klik untuk mengedit atribut" : "Click to edit attribute") : undefined}
                          onClick={attribute.permissions.canEdit ? () => { setActiveAttribute(attribute); setDrawerOpen(true); } : undefined}
                        >
                          {attribute.name}
                        </strong>
                      </td>
                      <td data-label={isId ? "Nama Tampilan" : "Display Name"} title={attribute.displayName}>{attribute.displayName}</td>
                      <td data-label={isId ? "Tipe Opsi" : "Option Type"}>
                        <span className="seller2026-pill-type">{optionTypeLabel}</span>
                      </td>
                      <td data-label={isId ? "Nilai" : "Values"} style={{ fontWeight: 700 }}>
                        {attribute.valuesCount > 0 ? attribute.valuesCount : "-"}
                      </td>
                      <td data-label={isId ? "Penggunaan" : "Usage"}>
                        <span className={`seller2026-pill-usage ${attribute.usageStatus === "in_use" ? "in-use" : "unused"}`}>
                          {usageLabel}
                        </span>
                      </td>
                      <td data-label={isId ? "Status" : "Status"}>
                        <span className={`seller2026-pill-status ${statusClass(attribute.status)}`}>
                          <span className="seller2026-status-dot" />
                          {statusLabel}
                        </span>
                      </td>
                      <td data-label={isId ? "Diperbarui" : "Updated"} className="seller2026-muted">{formattedDate}</td>
                      <td data-label={isId ? "Aksi" : "Actions"}>
                        <div className="seller2026-row-actions">
                          <button
                            className="seller2026-btn-action"
                            type="button"
                            aria-label={isId ? "Edit Atribut" : "Edit Attribute"}
                            title={isId ? "Edit Atribut" : "Edit Attribute"}
                            onClick={() => { setActiveAttribute(attribute); setDrawerOpen(true); }}
                            disabled={!attribute.permissions.canEdit}
                          >
                            <Pencil size={15} />
                          </button>
                          <Link
                            className="seller2026-btn-action"
                            aria-label={isId ? "Kelola Nilai" : "Manage Values"}
                            title={isId ? "Kelola Nilai Atribut" : "Manage Values"}
                            to={workspaceRoutes.attributeValues(attribute.id)}
                          >
                            <MoreVertical size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="seller2026-pagination">
          <p className="seller2026-muted">
            {isId
              ? `Menampilkan ${pagination.start} hingga ${pagination.end} dari ${pagination.total} atribut`
              : `Showing ${pagination.start} to ${pagination.end} of ${pagination.total} attributes`}
          </p>
          <div className="seller2026-pagination-controls">
            <span>{isId ? "Baris per halaman" : "Rows per page"}</span>
            <select className="seller2026-select-outline" value={pagination.limit} onChange={(event) => updateQuery("limit", event.target.value)}>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <button type="button" disabled={pagination.page <= 1} onClick={() => updateQuery("page", pagination.page - 1)} title={isId ? "Sebelumnya" : "Previous"}>{"<"}</button>
            {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, index) => index + 1).map((page) => (
              <button key={page} type="button" className={pagination.page === page ? "active" : ""} onClick={() => updateQuery("page", page)}>
                {page}
              </button>
            ))}
            <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => updateQuery("page", pagination.page + 1)} title={isId ? "Berikutnya" : "Next"}>{">"}</button>
          </div>
        </footer>
      </section>

      <Seller2026AttributeDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        attribute={activeAttribute}
        onSave={saveAttribute}
        isSaving={isCreating || isUpdating}
        isId={isId}
      />
    </Seller2026Shell>
  );
}
