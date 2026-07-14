import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Grid2X2,
  List,
  MoreHorizontal,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  FALLBACK_PRODUCT_IMAGE,
  getProducts2026PageWindow,
} from "./adminProducts2026Adapter.js";
import "./admin-products-2026.css";

const getStatusOptions = (t) => [
  { value: "all", label: t("products.All") },
  { value: "published", label: t("products.Published") },
  { value: "unpublished", label: t("products.Draft") },
  { value: "review_queue", label: t("products.Review Queue") },
];

const getStockOptions = (t) => [
  { value: "all", label: t("products.All") },
  { value: "selling", label: t("products.In Stock") },
  { value: "out_of_stock", label: t("products.Out of Stock") },
];

const getSortOptions = (t) => [
  { value: "date_added", label: t("products.Date Added") },
  { value: "date_updated", label: t("products.Recently Updated") },
  { value: "price_asc", label: t("products.Price Low to High") },
  { value: "price_desc", label: t("products.Price High to Low") },
];

function IconButton({ children, label, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`ap26-icon-button ${className}`.trim()}
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
    <button type="button" className={`ap26-action ap26-action--${tone}`} {...props}>
      {Icon ? <Icon size={16} /> : null}
      <span>{children}</span>
    </button>
  );
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <label className="ap26-select-field">
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
    <article className={`ap26-kpi ap26-kpi--${tone}`}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{helper}</span>
      </div>
      <span className="ap26-kpi__icon">
        <Icon size={22} />
      </span>
    </article>
  );
}

function ProductSkeleton() {
  return (
    <div className="ap26-table-card">
      <div className="ap26-skeleton-head" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="ap26-skeleton-row">
          <span />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ statusCode, statusLabel }) {
  const { t } = useTranslation("admin");
  return (
    <span className={`ap26-status ap26-status--${statusCode}`}>
      {t(`products.${statusLabel}`, statusLabel)}
    </span>
  );
}

function PublishToggle({ checked, disabled, busy, onChange }) {
  const { t } = useTranslation("admin");
  return (
    <button
      type="button"
      className={`ap26-toggle ${checked ? "is-on" : ""} ${busy ? "is-busy" : ""}`}
      aria-pressed={checked}
      aria-label={checked ? t("products.Unpublish product") : t("products.Publish product")}
      disabled={disabled || busy}
      onClick={onChange}
    >
      <span />
    </button>
  );
}

function MoreActionsMenu({
  product,
  open,
  disabled,
  permissions,
  onToggle,
  onClose,
  onManageInventory,
  onManageVariants,
  onDuplicateProduct,
  onApproveProduct,
  onRequestRevision,
  onTogglePublished,
  onDeleteProduct,
}) {
  const { t } = useTranslation("admin");
  const runAction = (handler) => {
    if (typeof handler !== "function") return;
    onClose();
    handler(product);
  };

  return (
    <div className="ap26-more-actions">
      <IconButton
        label={`${t("products.More actions for")} ${product.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={open ? "is-active" : ""}
        onClick={onToggle}
      >
        <MoreVertical size={16} />
      </IconButton>
      {open ? (
        <div className="ap26-more-menu" role="menu" aria-label={`${t("products.More actions for")} ${product.name}`}>
          <button
            type="button"
            role="menuitem"
            disabled={!permissions.canUpdate}
            onClick={() => runAction(onManageInventory)}
          >
            <Package size={15} />
            <span>{t("products.Manage Inventory")}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!permissions.canUpdate}
            onClick={() => runAction(onManageVariants)}
          >
            <Grid2X2 size={15} />
            <span>{t("products.Manage Variants")}</span>
          </button>
          <span className="ap26-more-menu__divider" aria-hidden="true" />
          {product.canApproveReview ? (
            <>
              <button
                type="button"
                role="menuitem"
                disabled={disabled || !permissions.canUpdate}
                onClick={() => runAction(onApproveProduct)}
              >
                <CheckCircle size={15} />
                <span>{t("products.Approve Product")}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={disabled || !permissions.canUpdate}
                onClick={() => runAction(onRequestRevision)}
              >
                <RotateCcw size={15} />
                <span>{t("products.Request Revision")}</span>
              </button>
              <span className="ap26-more-menu__divider" aria-hidden="true" />
            </>
          ) : null}
          <button
            type="button"
            role="menuitem"
            disabled={disabled || !permissions.canCreate || product.sellerSubmissionStatus === "submitted"}
            onClick={() => runAction(onDuplicateProduct)}
          >
            <Copy size={15} />
            <span>{t("products.Duplicate Product")}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled || !permissions.canUpdate || !product.canUseListToggle}
            onClick={() => runAction(onTogglePublished)}
          >
            <Upload size={15} />
            <span>{product.published ? t("products.Unpublish Product") : t("products.Publish Product")}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="is-danger"
            disabled={disabled || !permissions.canDelete}
            onClick={() => runAction(onDeleteProduct)}
          >
            <Trash2 size={15} />
            <span>{t("products.Delete Product")}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function BulkActionsMenu({ open, onToggle, onClose, disabled, permissions, onBulkAction }) {
  const { t } = useTranslation("admin");
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const runAction = (action) => {
    onClose();
    onBulkAction(action);
  };

  return (
    <div className="ap26-more-actions" ref={menuRef}>
      <ActionButton
        icon={ChevronDown}
        disabled={disabled || (!permissions.canUpdate && !permissions.canDelete)}
        onClick={onToggle}
      >
        {t("products.Bulk Action")}
      </ActionButton>
      {open ? (
        <div className="ap26-more-menu" role="menu" style={{ left: 0, right: 'auto', top: 'calc(100% + 4px)', bottom: 'auto', minWidth: 160, zIndex: 100 }}>
          <button
            type="button"
            role="menuitem"
            disabled={disabled || !permissions.canUpdate}
            onClick={() => runAction("publish")}
          >
            <Upload size={15} />
            <span>{t("products.Bulk Publish")}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled || !permissions.canUpdate}
            onClick={() => runAction("unpublish")}
          >
            <Download size={15} />
            <span>{t("products.Bulk Unpublish")}</span>
          </button>
          <span className="ap26-more-menu__divider" aria-hidden="true" />
          <button
            type="button"
            role="menuitem"
            className="is-danger"
            disabled={disabled || !permissions.canDelete}
            onClick={() => runAction("delete")}
          >
            <Trash2 size={15} />
            <span>{t("products.Bulk Delete")}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Pagination({ meta, onPageChange, disabled }) {
  const { t } = useTranslation("admin");
  const pageWindow = getProducts2026PageWindow(meta);
  const pages = useMemo(() => {
    const candidates = new Set([1, pageWindow.page - 1, pageWindow.page, pageWindow.page + 1, pageWindow.totalPages]);
    return Array.from(candidates)
      .filter((page) => page >= 1 && page <= pageWindow.totalPages)
      .sort((left, right) => left - right);
  }, [pageWindow.page, pageWindow.totalPages]);

  return (
    <div className="ap26-pagination">
      <p>
        {t("products.Showing")} {pageWindow.start} {t("products.to")} {pageWindow.end} {t("products.of")} {pageWindow.total} {t("products.products")}
      </p>
      <div>
        <IconButton
          label={t("products.Previous page")}
          disabled={disabled || pageWindow.page <= 1}
          onClick={() => onPageChange(pageWindow.page - 1)}
        >
          <ChevronLeft size={18} />
        </IconButton>
        {pages.map((page, index) => {
          const previous = pages[index - 1];
          const showGap = index > 0 && page - previous > 1;
          return (
            <span key={page} className="ap26-page-group">
              {showGap ? <span className="ap26-page-gap">...</span> : null}
              <button
                type="button"
                className={page === pageWindow.page ? "is-active" : ""}
                disabled={disabled || page === pageWindow.page}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            </span>
          );
        })}
        <IconButton
          label={t("products.Next page")}
          disabled={disabled || pageWindow.page >= pageWindow.totalPages}
          onClick={() => onPageChange(pageWindow.page + 1)}
        >
          <ChevronRight size={18} />
        </IconButton>
      </div>
    </div>
  );
}

export default function AdminProducts2026View({
  products,
  categories,
  filters,
  stats,
  meta,
  permissions,
  selectedIds,
  updatingIds,
  operationState,
  isLoading,
  isFetching,
  isError,
  errorMessage,
  onRetry,
  onFilterChange,
  onResetFilters,
  onSelectOne,
  onSelectAll,
  onAddProduct,
  onViewProduct,
  onEditProduct,
  onManageInventory,
  onManageVariants,
  onDuplicateProduct,
  onApproveProduct,
  onRequestRevision,
  onDeleteProduct,
  onTogglePublished,
  onExport,
  onImportFile,
  onBulkAction,
  onPageChange,
}) {
  const { t } = useTranslation("admin");
  const fileInputRef = useRef(null);
  const openMenuRef = useRef(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = products.length > 0 && products.every((product) => selectedSet.has(Number(product.id)));
  const anySelected = selectedSet.size > 0;
  const disableMutations = operationState.busy;

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
  }, [products, filters]);

  const handleImportChange = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (file) onImportFile(file);
  };

  return (
    <div className="ap26-page">
      <input ref={fileInputRef} type="file" className="ap26-file-input" accept=".json,.csv" onChange={handleImportChange} />

      <section className="ap26-header">
        <div>
          <h1>{t("products.Products")}</h1>
          <nav aria-label="Breadcrumb">
            <span>{t("products.Catalog")}</span>
            <ChevronRight size={14} />
            <span>{t("products.Products")}</span>
          </nav>
        </div>
        <div className="ap26-header__actions">
          <ActionButton icon={Download} disabled={operationState.exporting} onClick={() => onExport("json")}>
            {operationState.exporting ? t("products.Exporting") : t("products.Export")}
          </ActionButton>
          <ActionButton icon={Upload} disabled={operationState.importing || !permissions.canCreate} onClick={() => fileInputRef.current?.click()}>
            {operationState.importing ? t("products.Importing") : t("products.Import")}
          </ActionButton>
          <BulkActionsMenu
            open={bulkMenuOpen}
            disabled={disableMutations || !anySelected}
            permissions={permissions}
            onToggle={() => setBulkMenuOpen((o) => !o)}
            onClose={() => setBulkMenuOpen(false)}
            onBulkAction={onBulkAction}
          />
          <ActionButton
            icon={Trash2}
            tone="danger"
            disabled={disableMutations || !permissions.canDelete || !anySelected}
            onClick={() => onBulkAction("delete")}
          >
            {t("products.Delete")}
          </ActionButton>
          <ActionButton icon={Plus} tone="primary" disabled={!permissions.canCreate} onClick={onAddProduct}>
            {t("products.Add Product")}
          </ActionButton>
        </div>
      </section>

      <section className="ap26-kpis" aria-label="Product summary">
        <KpiCard label={t("products.Total Products")} value={stats.total} helper={t("products.All products")} icon={Package} tone="blue" />
        <KpiCard label={t("products.Published")} value={stats.published} helper={t("products.Loaded active listings")} icon={Package} tone="green" />
        <KpiCard label={t("products.Draft")} value={stats.draft} helper={t("products.Loaded unpublished")} icon={Pencil} tone="orange" />
        <KpiCard label={t("products.Review Queue")} value={stats.reviewQueue} helper={t("products.Awaiting review")} icon={ShieldCheck} tone="blue" />
      </section>

      <section className="ap26-toolbar">
        <label className="ap26-search">
          <Search size={20} />
          <input
            value={filters.q}
            onChange={(event) => onFilterChange({ q: event.target.value })}
            placeholder={t("products.Search by product name, SKU, or ID")}
          />
        </label>
        <FieldSelect
          label={t("products.Category")}
          value={filters.categoryId}
          onChange={(value) => onFilterChange({ categoryId: value })}
          options={[{ value: "all", label: t("products.All") }, ...categories.map((category) => ({ value: category.id, label: category.name }))]}
        />
        <FieldSelect
          label={t("products.Status")}
          value={filters.published}
          onChange={(value) => onFilterChange({ published: value })}
          options={getStatusOptions(t)}
        />
        <FieldSelect
          label={t("products.Stock")}
          value={filters.stock}
          onChange={(value) => onFilterChange({ stock: value })}
          options={getStockOptions(t)}
        />
        <button type="button" className="ap26-filter-button" onClick={() => setFiltersOpen((open) => !open)}>
          <SlidersHorizontal size={17} />
          <span>{t("products.More")}</span>
        </button>
        <div className="ap26-view-toggles">
          <IconButton label={t("products.Table View")} className={viewMode === "table" ? "is-active" : ""} onClick={() => setViewMode("table")}>
            <List size={18} />
          </IconButton>
          <IconButton label={t("products.Grid View")} className={viewMode === "grid" ? "is-active" : ""} onClick={() => setViewMode("grid")}>
            <Grid2X2 size={18} />
          </IconButton>
        </div>
        {filtersOpen ? (
          <div className="ap26-filter-drawer">
            <FieldSelect
              label={t("products.Sort")}
              value={filters.sort}
              onChange={(value) => onFilterChange({ sort: value })}
              options={getSortOptions(t)}
            />
            <button type="button" onClick={onResetFilters}>
              <X size={16} />
              {t("products.Reset filters")}
            </button>
          </div>
        ) : null}
      </section>

      {isError ? (
        <section className="ap26-state">
          <strong>{t("products.Products could not be loaded.")}</strong>
          <p>{errorMessage}</p>
          <button type="button" onClick={onRetry}>{t("products.Retry")}</button>
        </section>
      ) : isLoading ? (
        <ProductSkeleton />
      ) : products.length === 0 ? (
        <section className="ap26-state">
          <strong>{t("products.No products found.")}</strong>
          <p>{t("products.Adjust filters or create a new product for this catalog.")}</p>
          <button type="button" disabled={!permissions.canCreate} onClick={onAddProduct}>{t("products.Add Product")}</button>
        </section>
      ) : viewMode === "grid" ? (
        <section className={`ap26-grid-card ${isFetching ? "is-fetching" : ""}`}>
          <div className="ap26-grid-view">
            {products.map((product) => {
              const productId = Number(product.id);
              const selected = selectedSet.has(productId);
              const updating = updatingIds.includes(productId);
              
              return (
                <div key={product.id} className={`ap26-grid-item ${selected ? "is-selected" : ""}`}>
                  <div className="ap26-grid-item-header">
                    <input
                      type="checkbox"
                      aria-label={`Select ${product.name}`}
                      checked={selected}
                      onChange={() => onSelectOne(productId)}
                    />
                    <div ref={openActionMenuId === productId ? openMenuRef : null}>
                      <MoreActionsMenu
                        product={product}
                        open={openActionMenuId === productId}
                        disabled={disableMutations}
                        permissions={permissions}
                        onToggle={() =>
                          setOpenActionMenuId((current) => (current === productId ? null : productId))
                        }
                        onClose={() => setOpenActionMenuId(null)}
                        onManageInventory={onManageInventory}
                        onManageVariants={onManageVariants}
                        onDuplicateProduct={onDuplicateProduct}
                        onApproveProduct={onApproveProduct}
                        onRequestRevision={onRequestRevision}
                        onTogglePublished={onTogglePublished}
                        onDeleteProduct={onDeleteProduct}
                      />
                    </div>
                  </div>
                  
                  <div className="ap26-grid-item-image">
                    <img
                      src={product.imageUrl || FALLBACK_PRODUCT_IMAGE}
                      alt={product.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                      }}
                    />
                  </div>
                  
                  <div className="ap26-grid-item-details">
                    <strong>{product.name}</strong>
                    <span className="ap26-grid-sku">{t("products.SKU")}: {product.sku}</span>
                    <span className="ap26-grid-category">{product.category}</span>
                    
                    <div className="ap26-grid-prices">
                      <span className="ap26-grid-price">{product.priceLabel}</span>
                      {product.salePrice && <span className="ap26-grid-sale">{product.salePriceLabel}</span>}
                    </div>
                  </div>
                  
                  <div className="ap26-grid-item-footer">
                    <div className="ap26-grid-stock-status">
                      <span className="ap26-grid-stock">{t("products.Stock")}: {product.stock}</span>
                      <StatusBadge statusCode={product.statusCode} statusLabel={product.statusLabel} />
                    </div>
                    <PublishToggle
                      checked={product.published}
                      busy={updating}
                      disabled={!permissions.canUpdate || !product.canUseListToggle}
                      onChange={() => onTogglePublished(product)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination meta={meta} onPageChange={onPageChange} disabled={isFetching} />
        </section>
      ) : (
        <section className={`ap26-table-card ${isFetching ? "is-fetching" : ""}`}>
          <div className="ap26-table-scroll">
            <table className="ap26-table">
              <colgroup>
                <col className="ap26-col-select" />
                <col className="ap26-col-product" />
                <col className="ap26-col-category" />
                <col className="ap26-col-price" />
                <col className="ap26-col-sale" />
                <col className="ap26-col-stock" />
                <col className="ap26-col-status" />
                <col className="ap26-col-published" />
                <col className="ap26-col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select all visible products"
                      checked={allSelected}
                      onChange={() => onSelectAll(products.map((product) => Number(product.id)), !allSelected)}
                    />
                  </th>
                  <th>{t("products.Product")}</th>
                  <th>{t("products.Category")}</th>
                  <th>{t("products.Price")}</th>
                  <th>{t("products.Sale Price")}</th>
                  <th>{t("products.Stock")}</th>
                  <th>{t("products.Status")}</th>
                  <th>{t("products.Published")}</th>
                  <th>{t("products.Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const productId = Number(product.id);
                  const selected = selectedSet.has(productId);
                  const updating = updatingIds.includes(productId);

                  return (
                    <tr key={product.id}>
                      <td className="ap26-cell-select">
                        <input
                          type="checkbox"
                          aria-label={`Select ${product.name}`}
                          checked={selected}
                          onChange={() => onSelectOne(productId)}
                        />
                      </td>
                      <td className="ap26-cell-product" data-label={t("products.Product")}>
                        <div className="ap26-product-cell">
                          <img
                            src={product.imageUrl || FALLBACK_PRODUCT_IMAGE}
                            alt={product.name}
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                            }}
                          />
                          <div>
                            <strong>{product.name}</strong>
                            <span>{t("products.SKU")}: {product.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label={t("products.Category")}>{product.category}</td>
                      <td data-label={t("products.Price")}>{product.priceLabel}</td>
                      <td data-label={t("products.Sale Price")} className={product.salePrice ? "ap26-sale-price" : ""}>{product.salePriceLabel}</td>
                      <td data-label={t("products.Stock")}>{product.stock}</td>
                      <td data-label={t("products.Status")}><StatusBadge statusCode={product.statusCode} statusLabel={product.statusLabel} /></td>
                      <td data-label={t("products.Published")}>
                        <PublishToggle
                          checked={product.published}
                          busy={updating}
                          disabled={!permissions.canUpdate || !product.canUseListToggle}
                          onChange={() => onTogglePublished(product)}
                        />
                      </td>
                      <td className="ap26-cell-actions" data-label={t("products.Actions")}>
                        <div className="ap26-row-actions">
                          <IconButton label={t("products.View product")} onClick={() => onViewProduct(product)}>
                            <Eye size={16} />
                          </IconButton>
                          <IconButton label={t("products.Edit product")} disabled={!permissions.canUpdate} onClick={() => onEditProduct(product)}>
                            <Pencil size={16} />
                          </IconButton>
                          <div ref={openActionMenuId === productId ? openMenuRef : null}>
                            <MoreActionsMenu
                              product={product}
                              open={openActionMenuId === productId}
                              disabled={disableMutations}
                              permissions={permissions}
                              onToggle={() =>
                                setOpenActionMenuId((current) => (current === productId ? null : productId))
                              }
                              onClose={() => setOpenActionMenuId(null)}
                              onManageInventory={onManageInventory}
                              onManageVariants={onManageVariants}
                              onDuplicateProduct={onDuplicateProduct}
                              onApproveProduct={onApproveProduct}
                              onRequestRevision={onRequestRevision}
                              onTogglePublished={onTogglePublished}
                              onDeleteProduct={onDeleteProduct}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={onPageChange} disabled={isFetching} />
        </section>
      )}

      <div className="ap26-bulk-bar" data-visible={anySelected ? "true" : "false"}>
        <span>{selectedSet.size} {t("products.selected")}</span>
        <button type="button" disabled={!permissions.canUpdate || disableMutations} onClick={() => onBulkAction("publish")}>
          <Upload size={14} />
          <span>{t("products.Publish")}</span>
        </button>
        <button type="button" disabled={!permissions.canUpdate || disableMutations} onClick={() => onBulkAction("unpublish")}>
          <Download size={14} />
          <span>{t("products.Unpublish")}</span>
        </button>
        <button type="button" disabled={!permissions.canDelete || disableMutations} onClick={() => onBulkAction("delete")}>
          <Trash2 size={14} />
          <span>{t("products.Delete")}</span>
        </button>
      </div>
    </div>
  );
}
