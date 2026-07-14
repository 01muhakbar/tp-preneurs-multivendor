import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Grid2X2,
  ListFilter,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import "./admin-attributes-2026.css";

function IconButton({ children, label, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`aa26-icon-button ${className}`.trim()}
      title={label}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
}

function ActionButton({ children, icon: Icon, tone = "default", ...props }) {
  return (
    <button type="button" className={`aa26-action aa26-action--${tone}`} {...props}>
      {Icon ? <Icon size={16} /> : null}
      <span>{children}</span>
    </button>
  );
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <label className="aa26-select-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden="true" />
    </label>
  );
}

function KpiCard({ label, value, helper, icon: Icon, tone }) {
  return (
    <article className={`aa26-kpi aa26-kpi--${tone}`}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{helper}</span>
      </div>
      <span className="aa26-kpi__icon">
        <Icon size={22} />
      </span>
    </article>
  );
}

function AttributeSkeleton() {
  return (
    <div className="aa26-table-card">
      <div className="h-12 border-b border-slate-200 bg-slate-50/70" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex h-14 items-center gap-4 border-b border-slate-100 px-4">
          <div className="h-4 w-4 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-44 rounded bg-slate-200 animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-slate-200 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function PublishToggle({ checked, disabled, busy, onChange }) {
  const { t } = useTranslation("admin");
  return (
    <button
      type="button"
      className={`aa26-toggle ${checked ? "is-on" : ""}`}
      disabled={disabled || busy}
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      title={checked ? t("attributes.Published", "Published") : t("attributes.Unpublished", "Unpublished")}
    >
      <span />
    </button>
  );
}

function RowMoreMenu({
  attribute,
  disabled,
  open,
  onToggle,
  onEdit,
  onManageValues,
  onTogglePublished,
  onDelete,
}) {
  const { t } = useTranslation("admin");
  return (
    <div className="aa26-more-actions">
      <IconButton
        label={`${t("attributes.More actions for", "More actions for")} ${attribute.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={open ? "is-active" : ""}
        onClick={onToggle}
      >
        <MoreVertical size={16} />
      </IconButton>
      {open ? (
        <div className="aa26-more-menu" role="menu" aria-label={`${t("attributes.More actions for", "More actions for")} ${attribute.name}`}>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              onToggle();
              onEdit(attribute);
            }}
          >
            <Pencil size={15} />
            <span>{t("attributes.Edit Attribute", "Edit Attribute")}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              onToggle();
              onManageValues(attribute);
            }}
          >
            <ListFilter size={15} />
            <span>{t("attributes.Manage Values", "Manage Values")} ({attribute.valueCount || 0})</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              onToggle();
              onTogglePublished(attribute);
            }}
          >
            <CheckCircle2 size={15} />
            <span>
              {attribute.published
                ? t("attributes.Unpublish Attribute", "Unpublish Attribute")
                : t("attributes.Publish Attribute", "Publish Attribute")}
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="is-danger"
            disabled={disabled}
            onClick={() => {
              onToggle();
              onDelete(attribute);
            }}
          >
            <Trash2 size={15} />
            <span>{t("attributes.Delete Attribute", "Delete Attribute")}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function formatRelativeOrDate(dateString, isIndo) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return isIndo ? "Baru saja" : "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return isIndo ? `${diffMin} mnt lalu` : `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return isIndo ? `${diffHr} jam lalu` : `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay <= 30) return isIndo ? `${diffDay} hri lalu` : `${diffDay}d ago`;
    return date.toLocaleDateString(isIndo ? "id-ID" : "en-US", { month: "short", day: "numeric" });
  } catch {
    return "-";
  }
}

export default function AdminAttributes2026View({
  attributes,
  stats,
  meta,
  filters,
  selectedIds,
  isLoading,
  isError,
  errorMessage,
  canManageRow,
  onRetry,
  onFilterChange,
  onResetFilters,
  onSelectOne,
  onSelectAll,
  onAddAttribute,
  onEditAttribute,
  onManageValues,
  onDeleteAttribute,
  onTogglePublished,
  onExport,
  onImportFile,
  onBulkAction,
  onPageChange,
}) {
  const { t, i18n } = useTranslation("admin");
  const isIndo =
    i18n.language === "id" ||
    i18n.language === "id-ID" ||
    i18n.language?.startsWith("id") ||
    (typeof window !== "undefined" && window.localStorage.getItem("adminLanguage")?.includes("id"));

  const fileInputRef = useRef(null);
  const openMenuRef = useRef(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  const typeOptions = useMemo(
    () => [
      { value: "all", label: t("attributes.All", "All") },
      { value: "dropdown", label: t("attributes.Dropdown", "Dropdown") },
      { value: "radio", label: t("attributes.Radio", "Radio") },
      { value: "checkbox", label: t("attributes.Checkbox", "Checkbox") },
    ],
    [t]
  );

  const scopeOptions = useMemo(
    () => [
      { value: "all", label: t("attributes.All", "All") },
      { value: "global", label: t("attributes.Global", "Global") },
      { value: "store", label: t("attributes.Store", "Store") },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("attributes.All", "All") },
      { value: "active", label: t("attributes.Active", "Active") },
      { value: "archived", label: t("attributes.Archived", "Archived") },
    ],
    [t]
  );

  const createdByOptions = useMemo(
    () => [
      { value: "all", label: t("attributes.All", "All") },
      { value: "admin", label: t("attributes.Admin", "Admin") },
      { value: "seller", label: t("attributes.Seller", "Seller") },
    ],
    [t]
  );

  const sortOptions = useMemo(
    () => [
      { value: "date_added", label: t("attributes.Date Added", "Date Added") },
      { value: "date_updated", label: t("attributes.Recently Updated", "Recently Updated") },
      { value: "name_asc", label: t("attributes.Name A-Z", "Name A-Z") },
      { value: "name_desc", label: t("attributes.Name Z-A", "Name Z-A") },
    ],
    [t]
  );

  const selectedSet = useMemo(() => new Set(selectedIds || []), [selectedIds]);
  const manageableAttributes = useMemo(
    () => attributes.filter((attribute) => canManageRow(attribute)),
    [attributes, canManageRow]
  );
  const allManageableSelected =
    manageableAttributes.length > 0 &&
    manageableAttributes.every((item) => selectedSet.has(Number(item.id)));
  const anySelected = selectedSet.size > 0;

  useEffect(() => {
    if (!openActionMenuId) return undefined;
    const handlePointerDown = (event) => {
      if (openMenuRef.current?.contains(event.target)) return;
      setOpenActionMenuId(null);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpenActionMenuId(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openActionMenuId]);

  useEffect(() => {
    setOpenActionMenuId(null);
  }, [attributes, filters]);

  const handleImportChange = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (file) onImportFile?.(file);
  };

  const startIdx = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const endIdx = Math.min(meta.total, meta.page * meta.limit);

  return (
    <div className="aa26-page">
      <input
        ref={fileInputRef}
        type="file"
        className="aa26-file-input"
        accept=".json,.csv"
        onChange={handleImportChange}
      />

      <section className="aa26-header">
        <div>
          <h1>{t("attributes.Attributes", "Attributes")}</h1>
          <nav aria-label="Breadcrumb">
            <span>{t("attributes.Catalog", "Catalog")}</span>
            <ChevronRight size={14} />
            <span>{t("attributes.Attributes", "Attributes")}</span>
          </nav>
        </div>
        <div className="aa26-header__actions">
          <ActionButton icon={Download} onClick={() => onExport("json")}>
            {t("attributes.Export", "Export")}
          </ActionButton>
          <ActionButton icon={Upload} onClick={() => fileInputRef.current?.click()}>
            {t("attributes.Import", "Import")}
          </ActionButton>
          <ActionButton
            icon={ChevronDown}
            disabled={!anySelected}
            onClick={() => onBulkAction("publish")}
          >
            {t("attributes.Bulk Action", "Bulk Action")}
          </ActionButton>
          <ActionButton
            icon={Trash2}
            tone="danger"
            disabled={!anySelected}
            onClick={() => onBulkAction("delete")}
          >
            {t("attributes.Delete", "Delete")}
          </ActionButton>
          <ActionButton icon={Plus} tone="primary" onClick={onAddAttribute}>
            {t("attributes.Add Attribute", "Add Attribute")}
          </ActionButton>
        </div>
      </section>

      <section className="aa26-kpis" aria-label="Attribute summary">
        <KpiCard
          label={t("attributes.Total Attributes", "Total Attributes")}
          value={stats.total}
          helper={t("attributes.All attributes", "All attributes")}
          icon={Package}
          tone="blue"
        />
        <KpiCard
          label={t("attributes.Published", "Published")}
          value={stats.published}
          helper={t("attributes.Loaded active attributes", "Loaded active attributes")}
          icon={CheckCircle2}
          tone="green"
        />
        <KpiCard
          label={t("attributes.Global Scope", "Global Scope")}
          value={stats.global}
          helper={t("attributes.System-wide attributes", "System-wide attributes")}
          icon={SlidersHorizontal}
          tone="orange"
        />
        <KpiCard
          label={t("attributes.Store Scope", "Store Scope")}
          value={stats.store}
          helper={t("attributes.Store-specific attributes", "Store-specific attributes")}
          icon={Boxes}
          tone="red"
        />
      </section>

      <section className="aa26-toolbar">
        <label className="aa26-search">
          <Search size={20} />
          <input
            value={filters.q || ""}
            onChange={(event) => onFilterChange({ q: event.target.value })}
            placeholder={t("attributes.Search by attribute name or display name", "Search by attribute name or display name")}
          />
        </label>
        <FieldSelect
          label={t("attributes.Option Type", "Option Type")}
          value={filters.type || "all"}
          onChange={(value) => onFilterChange({ type: value === "all" ? "" : value })}
          options={typeOptions}
        />
        <FieldSelect
          label={t("attributes.Scope", "Scope")}
          value={filters.scope || "all"}
          onChange={(value) => onFilterChange({ scope: value === "all" ? "" : value })}
          options={scopeOptions}
        />
        <FieldSelect
          label={t("attributes.Status", "Status")}
          value={filters.status || "all"}
          onChange={(value) => onFilterChange({ status: value === "all" ? "" : value })}
          options={statusOptions}
        />
        <button
          type="button"
          className="aa26-filter-button"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal size={17} />
          <span>{t("attributes.Filters", "Filters")}</span>
        </button>
        <IconButton label="View options">
          <Grid2X2 size={18} />
        </IconButton>
        {filtersOpen ? (
          <div className="aa26-filter-drawer">
            <FieldSelect
              label={t("attributes.Created By", "Created By")}
              value={filters.createdByRole || "all"}
              onChange={(value) => onFilterChange({ createdByRole: value === "all" ? "" : value })}
              options={createdByOptions}
            />
            <FieldSelect
              label={t("attributes.Sort", "Sort")}
              value={filters.sort || "date_added"}
              onChange={(value) => onFilterChange({ sort: value })}
              options={sortOptions}
            />
            <button type="button" onClick={onResetFilters}>
              <X size={16} />
              {t("attributes.Reset filters", "Reset filters")}
            </button>
          </div>
        ) : null}
      </section>

      {isError ? (
        <section className="aa26-state">
          <strong>{t("attributes.Attributes could not be loaded.", "Attributes could not be loaded.")}</strong>
          <p>{errorMessage || t("attributes.Please retry to fetch the latest attributes.", "Please retry to fetch the latest attributes.")}</p>
          <button type="button" className="aa26-action aa26-action--primary" onClick={onRetry}>
            {t("attributes.Retry", "Retry")}
          </button>
        </section>
      ) : isLoading ? (
        <AttributeSkeleton />
      ) : attributes.length === 0 ? (
        <section className="aa26-state">
          <strong>{t("attributes.No attributes found.", "No attributes found.")}</strong>
          <p>{t("attributes.Create your first attribute or adjust the current search and filters.", "Create your first attribute or adjust the current search and filters.")}</p>
          <button type="button" className="aa26-action aa26-action--primary" onClick={onAddAttribute}>
            {t("attributes.Add Attribute", "Add Attribute")}
          </button>
        </section>
      ) : (
        <div className="aa26-table-card">
          <div className="aa26-table-wrap">
            <table className="aa26-table">
              <colgroup>
                <col className="aa26-col-select" />
                <col className="aa26-col-attribute" />
                <col className="aa26-col-type" />
                <col className="aa26-col-scope" />
                <col className="aa26-col-values" />
                <col className="aa26-col-status" />
                <col className="aa26-col-updated" />
                <col className="aa26-col-published" />
                <col className="aa26-col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label={t("attributes.Select all attributes", "Select all attributes")}
                      checked={allManageableSelected}
                      disabled={manageableAttributes.length === 0}
                      onChange={onSelectAll}
                    />
                  </th>
                  <th>{t("attributes.ATTRIBUTE", "ATTRIBUTE")}</th>
                  <th>{t("attributes.OPTION TYPE", "OPTION TYPE")}</th>
                  <th>{t("attributes.SCOPE", "SCOPE")}</th>
                  <th>{t("attributes.VALUES", "VALUES")}</th>
                  <th>{t("attributes.STATUS", "STATUS")}</th>
                  <th>{t("attributes.UPDATED", "UPDATED")}</th>
                  <th>{t("attributes.PUBLISHED", "PUBLISHED")}</th>
                  <th>{t("attributes.ACTIONS", "ACTIONS")}</th>
                </tr>
              </thead>
              <tbody>
                {attributes.map((attribute) => {
                  const id = Number(attribute.id);
                  const manageable = canManageRow(attribute);
                  const isStoreOwned = String(attribute.scope || "global") === "store";
                  const valueCount = Number(attribute.valueCount || 0) || (Array.isArray(attribute.values) ? attribute.values.length : 0);

                  const typeStr = String(attribute.type || "dropdown").toLowerCase();
                  const typeLabel =
                    typeStr === "dropdown" ? t("attributes.Dropdown", "Dropdown")
                    : typeStr === "radio" ? t("attributes.Radio", "Radio")
                    : typeStr === "checkbox" ? t("attributes.Checkbox", "Checkbox")
                    : String(attribute.type || "Dropdown").replace(/^[a-z]/, (c) => c.toUpperCase());

                  const statusStr = String(attribute.status || "active").toLowerCase();
                  const statusLabel =
                    statusStr === "archived" ? t("attributes.Archived", "Archived")
                    : t("attributes.Active", "Active");

                  return (
                    <tr key={attribute.id}>
                      <td>
                        <input
                          type="checkbox"
                          disabled={!manageable}
                          checked={selectedSet.has(id)}
                          onChange={() => onSelectOne(id)}
                          aria-label={`Select ${attribute.name}`}
                        />
                      </td>
                      <td>
                        <div className="aa26-attribute-cell">
                          <div>
                            <strong>{attribute.name}</strong>
                            <span>{attribute.displayName || "-"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`aa26-badge aa26-badge--${typeStr}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td>
                        <span className={`aa26-badge aa26-badge--${isStoreOwned ? "store" : "global"}`}>
                          {isStoreOwned
                            ? (attribute.storeName ? `${t("attributes.Store", "Store")}: ${attribute.storeName}` : t("attributes.Store", "Store"))
                            : t("attributes.Global", "Global")}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="aa26-values-pill"
                          onClick={() => onManageValues(attribute)}
                        >
                          <span>{valueCount} {isIndo ? "nilai" : (valueCount === 1 ? "value" : "values")}</span>
                        </button>
                      </td>
                      <td>
                        <span className={`aa26-status aa26-status--${statusStr}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td>
                        <span>{formatRelativeOrDate(attribute.updatedAt || attribute.createdAt, isIndo)}</span>
                      </td>
                      <td>
                        <PublishToggle
                          checked={Boolean(attribute.published)}
                          disabled={!manageable}
                          onChange={() => onTogglePublished(attribute)}
                        />
                      </td>
                      <td className="aa26-cell-actions">
                        <div className="aa26-row-actions" ref={openActionMenuId === id ? openMenuRef : null}>
                          <IconButton
                            label={`${t("attributes.Manage values for", "Manage values for")} ${attribute.name}`}
                            onClick={() => onManageValues(attribute)}
                          >
                            <Eye size={15} />
                          </IconButton>
                          <IconButton
                            label={`${t("attributes.Edit", "Edit")} ${attribute.name}`}
                            disabled={!manageable}
                            onClick={() => onEditAttribute(attribute)}
                          >
                            <Pencil size={15} />
                          </IconButton>
                          <RowMoreMenu
                            attribute={attribute}
                            disabled={!manageable}
                            open={openActionMenuId === id}
                            onToggle={() =>
                              setOpenActionMenuId((current) => (current === id ? null : id))
                            }
                            onEdit={onEditAttribute}
                            onManageValues={onManageValues}
                            onTogglePublished={onTogglePublished}
                            onDelete={onDeleteAttribute}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {attributes.length > 0 ? (
        <div className="aa26-pagination">
          <p>
            {isIndo
              ? `Menampilkan ${startIdx} hingga ${endIdx} dari ${meta.total} atribut`
              : `Showing ${startIdx} to ${endIdx} of ${meta.total} attributes`}
          </p>
          <div>
            <IconButton
              label="Previous page"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
            >
              <ChevronLeft size={18} />
            </IconButton>
            <span className="aa26-page-group">
              <button
                type="button"
                className="is-active"
                disabled
              >
                {meta.page}
              </button>
            </span>
            <IconButton
              label="Next page"
              disabled={meta.page >= (meta.totalPages || 1)}
              onClick={() => onPageChange(meta.page + 1)}
            >
              <ChevronRight size={18} />
            </IconButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
