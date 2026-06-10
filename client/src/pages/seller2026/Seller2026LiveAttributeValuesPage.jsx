import React, { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Box,
  ChevronRight,
  Layers,
  ListFilter,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Tags,
} from "lucide-react";
import { seller2026AttributeLabels } from "../../api/seller2026/attributes.adapter.ts";
import { useSeller2026AttributeValues } from "../../hooks/seller2026/useSeller2026AttributeValues.ts";
import { Seller2026Shell } from "../../features/sellerWorkspace2026/components/Seller2026Shell.jsx";
import Seller2026AttributeValueDrawer from "../../features/sellerWorkspace2026/components/Seller2026AttributeValueDrawer.jsx";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/SellerWorkspace2026.css";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export default function Seller2026LiveAttributeValuesPage() {
  const { attributeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("CATALOG_ATTRIBUTE_READ");
  const canCreate = can("CATALOG_ATTRIBUTE_VALUE_CREATE");
  const canUpdate = can("CATALOG_ATTRIBUTE_VALUE_UPDATE");
  const canManageStatus = can("CATALOG_ATTRIBUTE_VALUE_STATUS_MANAGE");

  const query = {
    search: searchParams.get("q") || "",
    status: searchParams.get("status") || "all",
    usage: searchParams.get("usage") || "all",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 10),
  };

  const {
    attribute,
    values,
    summary,
    filters,
    pagination,
    isLoading,
    isError,
    createValue,
    updateValue,
    isCreating,
    isUpdating,
  } = useSeller2026AttributeValues(storeId, attributeId, query, {
    enabled: canView,
    permissions: {
      canEdit: canUpdate,
      canActivate: canManageStatus,
      canDeactivate: canManageStatus,
      canArchive: false,
    },
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeValue, setActiveValue] = useState(null);

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

  const saveValue = async (form) => {
    try {
      if (activeValue) {
        await updateValue({ valueId: activeValue.id, payload: form });
        toast.success("Value updated", { id: "seller2026-value-updated" });
      } else {
        await createValue(form);
        toast.success("Value added", { id: "seller2026-value-added" });
      }
      setDrawerOpen(false);
    } catch {
      toast.error(activeValue ? "Unable to update value" : "Unable to add value");
    }
  };

  if (!canView) {
    return (
      <Seller2026Shell section="taxonomy" mode="embedded" storeContext={sellerContext}>
        <div className="seller2026-state seller2026-state--danger">
          <h1>Access Denied</h1>
          <p>Requires permission to view attribute values.</p>
        </div>
      </Seller2026Shell>
    );
  }

  return (
    <Seller2026Shell section="taxonomy" mode="embedded" storeContext={sellerContext} activeNavOverride="attributes">
      <section className="seller2026-attributes seller2026-attribute-values" data-seller2026-live-attribute-values="true">
        <nav className="seller2026-breadcrumb" aria-label="Breadcrumb">
          <Link to={workspaceRoutes.attributes()}>Attributes</Link>
          <ChevronRight size={14} />
          <span>{attribute.displayName || "Attribute"}</span>
        </nav>

        <header className="seller2026-attributes-header">
          <div className="seller2026-header-titles">
            <h1>Attribute Values</h1>
            <p>Manage values for this attribute.</p>
          </div>
          {canCreate ? (
            <button className="seller2026-btn-primary" type="button" onClick={() => { setActiveValue(null); setDrawerOpen(true); }}>
              <Plus size={16} /> Add Value
            </button>
          ) : null}
        </header>

        <div className="seller2026-attributes-summary seller2026-attribute-values-summary">
          <article className="seller2026-kpi-card">
            <span className="seller2026-kpi-icon icon-green"><Tags size={24} /></span>
            <div>
              <p className="seller2026-kpi-label">Attribute</p>
              <p className="seller2026-kpi-value seller2026-kpi-value--text">{attribute.displayName || "-"}</p>
            </div>
          </article>
          <article className="seller2026-kpi-card">
            <span className="seller2026-kpi-icon icon-blue"><Layers size={24} /></span>
            <div>
              <p className="seller2026-kpi-label">Type</p>
              <p className="seller2026-kpi-value seller2026-kpi-value--text">
                {seller2026AttributeLabels.optionType[attribute.optionType] || "Dropdown"}
              </p>
            </div>
          </article>
          <article className="seller2026-kpi-card">
            <span className="seller2026-kpi-icon icon-amber"><ListFilter size={24} /></span>
            <div>
              <p className="seller2026-kpi-label">Active Values</p>
              <p className="seller2026-kpi-value">{summary.activeValues}</p>
            </div>
          </article>
          <article className="seller2026-kpi-card">
            <span className="seller2026-kpi-icon icon-gray"><Box size={24} /></span>
            <div>
              <p className="seller2026-kpi-label">Used by Products</p>
              <p className="seller2026-kpi-value">{summary.usedByProducts}</p>
            </div>
          </article>
        </div>

        <div className="seller2026-attributes-toolbar seller2026-attribute-values-toolbar">
          <label className="seller2026-search-wrapper">
            <Search className="seller2026-search-icon" size={16} />
            <input
              aria-label="Search values"
              className="seller2026-search-input"
              placeholder="Search values..."
              value={filters.search}
              onChange={(event) => updateQuery("search", event.target.value)}
            />
          </label>
          <div className="seller2026-filters-right">
            <select className="seller2026-select-outline" aria-label="Status" value={filters.status} onChange={(event) => updateQuery("status", event.target.value)}>
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
            <select className="seller2026-select-outline" aria-label="Usage" value={filters.usage} onChange={(event) => updateQuery("usage", event.target.value)}>
              <option value="all">Usage: All</option>
              <option value="in_use">In Use</option>
              <option value="unused">Unused</option>
            </select>
            <button className="seller2026-btn-outline" type="button" disabled title="Not available yet">
              <ListFilter size={16} />
            </button>
          </div>
        </div>

        <div className="seller2026-attributes-table-container seller2026-attribute-values-table">
          <table className="seller2026-table">
            <thead>
              <tr>
                <th>Value</th>
                <th>Label</th>
                <th>Type</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="seller2026-table-loading">Loading values...</td></tr>
              ) : isError ? (
                <tr><td colSpan={7} className="seller2026-table-error">Unable to load values</td></tr>
              ) : values.length === 0 ? (
                <tr>
                  <td colSpan={7} className="seller2026-table-empty">
                    <h2>No values yet</h2>
                    <p>Add values for this attribute.</p>
                    {canCreate ? <button className="seller2026-btn-primary" type="button" onClick={() => { setActiveValue(null); setDrawerOpen(true); }}>Add Value</button> : null}
                  </td>
                </tr>
              ) : (
                values.map((item) => (
                  <tr key={item.id} className="seller2026-table-row">
                    <td data-label="Value" className="seller2026-fw-500">{item.value}</td>
                    <td data-label="Label">{item.label || item.value}</td>
                    <td data-label="Type">
                      <span className="seller2026-pill-type">
                        {seller2026AttributeLabels.optionType[item.optionType] || "Dropdown"}
                      </span>
                    </td>
                    <td data-label="Usage">{item.usageCount}</td>
                    <td data-label="Status">
                      <div className="seller2026-value-status-stack">
                        <span className={`seller2026-pill-status ${item.isActive ? "published" : "draft"}`}>
                          <span className="seller2026-status-dot" />
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className={`seller2026-pill-status ${item.visible ? "published" : "draft"}`}>
                          <span className="seller2026-status-dot" />
                          {item.visible ? "Visible" : "Hidden"}
                        </span>
                      </div>
                    </td>
                    <td data-label="Updated" className="seller2026-muted">{item.updatedAt}</td>
                    <td data-label="Actions">
                      <div className="seller2026-row-actions">
                        <button className="seller2026-btn-action" type="button" aria-label="Edit Value" title="Edit Value" onClick={() => { setActiveValue(item); setDrawerOpen(true); }} disabled={!item.permissions.canEdit}>
                          <Pencil size={15} />
                        </button>
                        <button className="seller2026-btn-action" type="button" aria-label="Deactivate" title="Deactivate disabled" disabled>
                          <MoreVertical size={15} />
                        </button>
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
            Showing {pagination.start} to {pagination.end} of {pagination.total} values
          </p>
          <div className="seller2026-pagination-controls">
            <span>Rows per page</span>
            <select className="seller2026-select-outline" value={pagination.limit} onChange={(event) => updateQuery("limit", event.target.value)}>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <button type="button" disabled={pagination.page <= 1} onClick={() => updateQuery("page", pagination.page - 1)}>{"<"}</button>
            <button type="button" className="active">{pagination.page}</button>
            <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => updateQuery("page", pagination.page + 1)}>{">"}</button>
          </div>
        </footer>
      </section>

      <Seller2026AttributeValueDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        value={activeValue}
        attributeContext={attribute}
        onSave={saveValue}
        isSaving={isCreating || isUpdating}
      />
    </Seller2026Shell>
  );
}
