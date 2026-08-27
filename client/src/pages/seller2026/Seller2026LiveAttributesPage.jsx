import React, { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import { exportSellerAttributes, importSellerAttributes } from "../../api/sellerAttributes.ts";
import { seller2026AttributeLabels } from "../../api/seller2026/attributes.adapter.ts";
import { useSeller2026Attributes } from "../../hooks/seller2026/useSeller2026Attributes.ts";
import { Seller2026Shell } from "../../features/sellerWorkspace2026/components/Seller2026Shell.jsx";
import Seller2026AttributeDrawer from "../../features/sellerWorkspace2026/components/Seller2026AttributeDrawer.jsx";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/SellerWorkspace2026.css";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const statusClass = (status) => (status === "published" || status === "active" ? "published" : "draft");

export default function Seller2026LiveAttributesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const importInputRef = useRef(null);
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes } = useSellerWorkspaceRoute();
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
        toast.success("Attribute updated", { id: "seller2026-attribute-updated" });
      } else {
        await createAttribute(form);
        toast.success("Attribute created", { id: "seller2026-attribute-created" });
      }
      setDrawerOpen(false);
    } catch {
      toast.error(activeAttribute ? "Unable to update attribute" : "Unable to create attribute");
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
      toast.success("Attributes exported");
    } catch {
      toast.error("Unable to export attributes");
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
      toast.success("Attributes imported");
    } catch {
      toast.error("Unable to import attributes");
    } finally {
      setIsImporting(false);
    }
  };

  if (!canView) {
    return (
      <Seller2026Shell section="taxonomy" mode="embedded" storeContext={sellerContext}>
        <div className="seller2026-state seller2026-state--danger">
          <h1>Access Denied</h1>
          <p>Requires permission to view attributes.</p>
        </div>
      </Seller2026Shell>
    );
  }

  return (
    <Seller2026Shell section="taxonomy" mode="embedded" storeContext={sellerContext} activeNavOverride="attributes">
      <section className="seller2026-attributes" data-seller2026-live-attributes="true">
        <header className="seller2026-attributes-header">
          <div className="seller2026-header-titles">
            <h1>Attributes</h1>
            <p>Manage product attributes.</p>
          </div>
          <div className="seller2026-header-actions">
            <button className="seller2026-btn-outline" type="button" onClick={exportAttributes} disabled={isExporting}>
              <Download size={16} /> Export
            </button>
            <button className="seller2026-btn-outline" type="button" onClick={() => importInputRef.current?.click()} disabled={isImporting}>
              <Upload size={16} /> Import
            </button>
            <input ref={importInputRef} type="file" accept=".json,.csv" hidden onChange={importAttributes} />
            <button className="seller2026-btn-outline" type="button" disabled={selectedIds.length === 0} title={selectedIds.length === 0 ? "Select attributes first" : "Bulk actions"}>
              <Layers size={16} /> Bulk Actions
            </button>
            {canCreate ? (
              <button className="seller2026-btn-primary" type="button" onClick={() => { setActiveAttribute(null); setDrawerOpen(true); }}>
                <Plus size={16} /> Add Attribute
              </button>
            ) : null}
          </div>
        </header>

        <div className="seller2026-attributes-summary">
          <article className="seller2026-kpi-card">
            <div>
              <p className="seller2026-kpi-label">Total Attributes</p>
              <p className="seller2026-kpi-value">{summary.total}</p>
            </div>
            <span className="seller2026-kpi-icon icon-gray"><Tags size={24} /></span>
          </article>
          <article className="seller2026-kpi-card">
            <div>
              <p className="seller2026-kpi-label">Published</p>
              <p className="seller2026-kpi-value">{summary.published}</p>
            </div>
            <span className="seller2026-kpi-icon icon-green"><CheckCircle2 size={24} /></span>
          </article>
          <article className="seller2026-kpi-card">
            <div>
              <p className="seller2026-kpi-label">Unused</p>
              <p className="seller2026-kpi-value">{summary.unused}</p>
            </div>
            <span className="seller2026-kpi-icon icon-amber"><Circle size={24} /></span>
          </article>
          <article className="seller2026-kpi-card">
            <div>
              <p className="seller2026-kpi-label">With Values</p>
              <p className="seller2026-kpi-value">{summary.withValues}</p>
            </div>
            <span className="seller2026-kpi-icon icon-blue"><Layers size={24} /></span>
          </article>
        </div>

        <div className="seller2026-attributes-toolbar">
          <label className="seller2026-search-wrapper">
            <Search className="seller2026-search-icon" size={16} />
            <input
              aria-label="Search attributes"
              className="seller2026-search-input"
              placeholder="Search attributes..."
              value={filters.search}
              onChange={(event) => updateQuery("search", event.target.value)}
            />
          </label>
          <div className="seller2026-filters-right">
            <select className="seller2026-select-outline" aria-label="Option Type" value={filters.type} onChange={(event) => updateQuery("type", event.target.value)}>
              <option value="all">All Types</option>
              <option value="dropdown">Dropdown</option>
              <option value="radio">Radio</option>
              <option value="checkbox">Checkbox</option>
            </select>
            <select className="seller2026-select-outline" aria-label="Status" value={filters.status} onChange={(event) => updateQuery("status", event.target.value)}>
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select className="seller2026-select-outline" aria-label="Usage" value={filters.usage} onChange={(event) => updateQuery("usage", event.target.value)}>
              <option value="all">All Usage</option>
              <option value="in_use">In Use</option>
              <option value="unused">Unused</option>
              <option value="with_values">With Values</option>
              <option value="no_values">No Values</option>
            </select>
            <button className="seller2026-btn-accent" type="button">
              <Filter size={16} /> Apply
            </button>
            <button className="seller2026-btn-cancel" type="button" onClick={() => setSearchParams(new URLSearchParams())}>
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>

        <div className="seller2026-attributes-table-container">
          <table className="seller2026-table seller2026-attributes-table">
            <thead>
              <tr>
                <th>
                  <input
                    aria-label="Select visible attributes"
                    type="checkbox"
                    checked={attributes.length > 0 && attributes.every((attribute) => selectedIds.includes(attribute.id))}
                    onChange={toggleAllVisible}
                  />
                </th>
                <th>Name</th>
                <th>Display Name</th>
                <th>Option Type</th>
                <th>Values</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="seller2026-table-loading">Loading attributes...</td></tr>
              ) : isError ? (
                <tr><td colSpan={9} className="seller2026-table-error">Unable to load attributes</td></tr>
              ) : attributes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="seller2026-table-empty">
                    <h2>No attributes yet</h2>
                    <p>Create your first attribute for product options.</p>
                    {canCreate ? <button className="seller2026-btn-primary" type="button" onClick={() => { setActiveAttribute(null); setDrawerOpen(true); }}>Add Attribute</button> : null}
                  </td>
                </tr>
              ) : (
                attributes.map((attribute) => (
                  <tr key={attribute.id} className="seller2026-table-row">
                    <td data-label="Select">
                      <input
                        aria-label={`Select ${attribute.name}`}
                        type="checkbox"
                        checked={selectedIds.includes(attribute.id)}
                        onChange={() => toggleSelection(attribute.id)}
                      />
                    </td>
                    <td data-label="Name" className="seller2026-fw-500" title={attribute.name}>{attribute.name}</td>
                    <td data-label="Display Name" title={attribute.displayName}>{attribute.displayName}</td>
                    <td data-label="Option Type">
                      <span className="seller2026-pill-type">{seller2026AttributeLabels.optionType[attribute.optionType] || "Unknown"}</span>
                    </td>
                    <td data-label="Values">{attribute.valuesCount > 0 ? attribute.valuesCount : "-"}</td>
                    <td data-label="Usage">
                      <span className={`seller2026-pill-usage ${attribute.usageStatus === "in_use" ? "in-use" : "unused"}`}>
                        {seller2026AttributeLabels.usage[attribute.usageStatus]}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={`seller2026-pill-status ${statusClass(attribute.status)}`}>
                        <span className="seller2026-status-dot" />
                        {seller2026AttributeLabels.status[attribute.status]}
                      </span>
                    </td>
                    <td data-label="Updated" className="seller2026-muted">{attribute.updatedAt}</td>
                    <td data-label="Actions">
                      <div className="seller2026-row-actions">
                        <button className="seller2026-btn-action" type="button" aria-label="Edit Attribute" title="Edit Attribute" onClick={() => { setActiveAttribute(attribute); setDrawerOpen(true); }} disabled={!attribute.permissions.canEdit}>
                          <Pencil size={15} />
                        </button>
                        <Link className="seller2026-btn-action" aria-label="Manage Values" title="Manage Values" to={workspaceRoutes.attributeValues(attribute.id)}>
                          <MoreVertical size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="seller2026-pagination">
          <p className="seller2026-muted">
            Showing {pagination.start} to {pagination.end} of {pagination.total} attributes
          </p>
          <div className="seller2026-pagination-controls">
            <span>Rows per page</span>
            <select className="seller2026-select-outline" value={pagination.limit} onChange={(event) => updateQuery("limit", event.target.value)}>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <button type="button" disabled={pagination.page <= 1} onClick={() => updateQuery("page", pagination.page - 1)}>{"<"}</button>
            {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, index) => index + 1).map((page) => (
              <button key={page} type="button" className={pagination.page === page ? "active" : ""} onClick={() => updateQuery("page", page)}>
                {page}
              </button>
            ))}
            <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => updateQuery("page", pagination.page + 1)}>{">"}</button>
          </div>
        </footer>
      </section>

      <Seller2026AttributeDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        attribute={activeAttribute}
        onSave={saveAttribute}
        isSaving={isCreating || isUpdating}
      />
    </Seller2026Shell>
  );
}
