import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Grid2X2,
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
import {
  FALLBACK_PRODUCT_IMAGE,
  getProducts2026PageWindow,
} from "./adminProducts2026Adapter.js";
import "./admin-products-2026.css";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Draft" },
];

const stockOptions = [
  { value: "all", label: "All" },
  { value: "selling", label: "In Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
];

const sortOptions = [
  { value: "date_added", label: "Date Added" },
  { value: "date_updated", label: "Recently Updated" },
  { value: "price_asc", label: "Price Low to High" },
  { value: "price_desc", label: "Price High to Low" },
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
  return <span className={`ap26-status ap26-status--${statusCode}`}>{statusLabel}</span>;
}

function PublishToggle({ checked, disabled, busy, onChange }) {
  return (
    <button
      type="button"
      className={`ap26-toggle ${checked ? "is-on" : ""} ${busy ? "is-busy" : ""}`}
      aria-pressed={checked}
      aria-label={checked ? "Unpublish product" : "Publish product"}
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
  onTogglePublished,
  onDeleteProduct,
}) {
  const runAction = (handler) => {
    if (typeof handler !== "function") return;
    onClose();
    handler(product);
  };

  return (
    <div className="ap26-more-actions">
      <IconButton
        label={`More actions for ${product.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={open ? "is-active" : ""}
        onClick={onToggle}
      >
        <MoreVertical size={16} />
      </IconButton>
      {open ? (
        <div className="ap26-more-menu" role="menu" aria-label={`More actions for ${product.name}`}>
          <button
            type="button"
            role="menuitem"
            disabled={!permissions.canUpdate}
            onClick={() => runAction(onManageInventory)}
          >
            <Package size={15} />
            <span>Manage Inventory</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!permissions.canUpdate}
            onClick={() => runAction(onManageVariants)}
          >
            <Grid2X2 size={15} />
            <span>Manage Variants</span>
          </button>
          <span className="ap26-more-menu__divider" aria-hidden="true" />
          <button
            type="button"
            role="menuitem"
            disabled={disabled || !permissions.canCreate}
            onClick={() => runAction(onDuplicateProduct)}
          >
            <Copy size={15} />
            <span>Duplicate Product</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled || !permissions.canUpdate}
            onClick={() => runAction(onTogglePublished)}
          >
            <Upload size={15} />
            <span>{product.published ? "Unpublish Product" : "Publish Product"}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="is-danger"
            disabled={disabled || !permissions.canDelete}
            onClick={() => runAction(onDeleteProduct)}
          >
            <Trash2 size={15} />
            <span>Delete Product</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Pagination({ meta, onPageChange, disabled }) {
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
        Showing {pageWindow.start} to {pageWindow.end} of {pageWindow.total} products
      </p>
      <div>
        <IconButton
          label="Previous page"
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
          label="Next page"
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
  onDeleteProduct,
  onTogglePublished,
  onExport,
  onImportFile,
  onBulkAction,
  onPageChange,
}) {
  const fileInputRef = useRef(null);
  const openMenuRef = useRef(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
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
          <h1>Products</h1>
          <nav aria-label="Breadcrumb">
            <span>Catalog</span>
            <ChevronRight size={14} />
            <span>Products</span>
          </nav>
        </div>
        <div className="ap26-header__actions">
          <ActionButton icon={Download} disabled={operationState.exporting} onClick={() => onExport("json")}>
            {operationState.exporting ? "Exporting" : "Export"}
          </ActionButton>
          <ActionButton icon={Upload} disabled={operationState.importing || !permissions.canCreate} onClick={() => fileInputRef.current?.click()}>
            {operationState.importing ? "Importing" : "Import"}
          </ActionButton>
          <ActionButton
            icon={ChevronDown}
            disabled={disableMutations || !permissions.canUpdate || !anySelected}
            onClick={() => onBulkAction("publish")}
          >
            Bulk Action
          </ActionButton>
          <ActionButton
            icon={Trash2}
            tone="danger"
            disabled={disableMutations || !permissions.canDelete || !anySelected}
            onClick={() => onBulkAction("delete")}
          >
            Delete
          </ActionButton>
          <ActionButton icon={Plus} tone="primary" disabled={!permissions.canCreate} onClick={onAddProduct}>
            Add Product
          </ActionButton>
        </div>
      </section>

      <section className="ap26-kpis" aria-label="Product summary">
        <KpiCard label="Total Products" value={stats.total} helper="All products" icon={Package} tone="blue" />
        <KpiCard label="Published" value={stats.published} helper="Loaded active listings" icon={Package} tone="green" />
        <KpiCard label="Draft" value={stats.draft} helper="Loaded unpublished" icon={Pencil} tone="orange" />
        <KpiCard label="Out of Stock" value={stats.outOfStock} helper="Loaded no inventory" icon={Trash2} tone="red" />
      </section>

      <section className="ap26-toolbar">
        <label className="ap26-search">
          <Search size={20} />
          <input
            value={filters.q}
            onChange={(event) => onFilterChange({ q: event.target.value })}
            placeholder="Search by product name, SKU, or ID"
          />
        </label>
        <FieldSelect
          label="Category"
          value={filters.categoryId}
          onChange={(value) => onFilterChange({ categoryId: value })}
          options={[{ value: "all", label: "All" }, ...categories.map((category) => ({ value: category.id, label: category.name }))]}
        />
        <FieldSelect
          label="Status"
          value={filters.published}
          onChange={(value) => onFilterChange({ published: value })}
          options={statusOptions}
        />
        <FieldSelect
          label="Stock"
          value={filters.stock}
          onChange={(value) => onFilterChange({ stock: value })}
          options={stockOptions}
        />
        <button type="button" className="ap26-filter-button" onClick={() => setFiltersOpen((open) => !open)}>
          <SlidersHorizontal size={17} />
          <span>Filters</span>
        </button>
        <IconButton label="View options">
          <Grid2X2 size={18} />
        </IconButton>
        {filtersOpen ? (
          <div className="ap26-filter-drawer">
            <FieldSelect
              label="Sort"
              value={filters.sort}
              onChange={(value) => onFilterChange({ sort: value })}
              options={sortOptions}
            />
            <button type="button" onClick={onResetFilters}>
              <X size={16} />
              Reset filters
            </button>
          </div>
        ) : null}
      </section>

      {isError ? (
        <section className="ap26-state">
          <strong>Products could not be loaded.</strong>
          <p>{errorMessage}</p>
          <button type="button" onClick={onRetry}>Retry</button>
        </section>
      ) : isLoading ? (
        <ProductSkeleton />
      ) : products.length === 0 ? (
        <section className="ap26-state">
          <strong>No products found.</strong>
          <p>Adjust filters or create a new product for this catalog.</p>
          <button type="button" disabled={!permissions.canCreate} onClick={onAddProduct}>Add Product</button>
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
                <col className="ap26-col-updated" />
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
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Sale Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Published</th>
                  <th>Actions</th>
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
                      <td className="ap26-cell-product" data-label="Product">
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
                            <span>SKU: {product.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Category">{product.category}</td>
                      <td data-label="Price">{product.priceLabel}</td>
                      <td data-label="Sale Price" className={product.salePrice ? "ap26-sale-price" : ""}>{product.salePriceLabel}</td>
                      <td data-label="Stock">{product.stock}</td>
                      <td data-label="Status"><StatusBadge statusCode={product.statusCode} statusLabel={product.statusLabel} /></td>
                      <td data-label="Updated">{product.updatedLabel}</td>
                      <td data-label="Published">
                        <PublishToggle
                          checked={product.published}
                          busy={updating}
                          disabled={!permissions.canUpdate}
                          onChange={() => onTogglePublished(product)}
                        />
                      </td>
                      <td className="ap26-cell-actions" data-label="Actions">
                        <div className="ap26-row-actions">
                          <IconButton label="View product" onClick={() => onViewProduct(product)}>
                            <Eye size={16} />
                          </IconButton>
                          <IconButton label="Edit product" disabled={!permissions.canUpdate} onClick={() => onEditProduct(product)}>
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
        <span>{selectedSet.size} selected</span>
        <button type="button" disabled={!permissions.canUpdate || disableMutations} onClick={() => onBulkAction("publish")}>Publish</button>
        <button type="button" disabled={!permissions.canUpdate || disableMutations} onClick={() => onBulkAction("unpublish")}>Unpublish</button>
        <button type="button" disabled={!permissions.canDelete || disableMutations} onClick={() => onBulkAction("delete")}>Delete</button>
      </div>
    </div>
  );
}
