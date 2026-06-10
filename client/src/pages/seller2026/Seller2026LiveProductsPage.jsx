import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Archive,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileClock,
  Grid2X2,
  List,
  MoreHorizontal,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { exportSellerProducts } from "../../api/sellerProducts.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { useSeller2026Products } from "../../hooks/seller2026/useSeller2026Products.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/SellerWorkspace2026.css";

const readNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};
const currency = (value) =>
  `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
const lifecycleLabel = (status) =>
  ({ active: "Active", draft: "Draft", submitted: "Submitted for Review", needs_revision: "Needs Revision", inactive: "Archived" }[status] || "Draft");
const tone = (label) => {
  const value = String(label).toLowerCase();
  if (["active", "approved", "visible", "in stock"].some((item) => value.includes(item))) return "success";
  if (["draft", "low stock", "revision"].some((item) => value.includes(item))) return "warning";
  if (["submitted", "pending"].some((item) => value.includes(item))) return "info";
  return "neutral";
};
const inventoryLabel = (stock) => stock <= 0 ? "Out of Stock" : stock <= 10 ? "Low Stock" : "In Stock";

function Pill({ children }) {
  return <span className={`seller2026-pill seller2026-pill--${tone(children)}`}>{children}</span>;
}

function ProductSkeleton() {
  return <div className="seller2026-dashboard seller2026-products"><div className="seller2026-skeleton" /><div className="seller2026-skeleton seller2026-skeleton--hero" /></div>;
}

export default function Seller2026LiveProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("CATALOG_PRODUCT_READ");
  const query = {
    search: searchParams.get("q") || "",
    status: searchParams.get("status") || "all",
    category: searchParams.get("category") || "all",
    stock: searchParams.get("stock") || "all",
    page: readNumber(searchParams.get("page"), 1),
    limit: readNumber(searchParams.get("limit"), 10),
  };
  const productsQuery = useSeller2026Products(storeId, query, {
    enabled: canView,
    permissions: {
      canCreate: can("CATALOG_PRODUCT_CREATE"),
      canUpdate: can("CATALOG_PRODUCT_UPDATE"),
      canDelete: can("CATALOG_PRODUCT_DELETE"),
      canSubmit: can("CATALOG_PRODUCT_SUBMIT"),
    },
  });
  const [selected, setSelected] = useState([]);
  const [view, setView] = useState("list");
  const [exporting, setExporting] = useState(false);
  const data = productsQuery.data;
  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      const param = key === "search" ? "q" : key;
      if (!value || value === "all" || (param === "page" && Number(value) === 1) || (param === "limit" && Number(value) === 10)) next.delete(param);
      else next.set(param, String(value));
    });
    setSearchParams(next);
  };
  const visibleProducts = useMemo(() => {
    if (query.stock === "all") return data.products;
    return data.products.filter((product) => {
      const state = inventoryLabel(product.stock).toLowerCase().replaceAll(" ", "_");
      return state === query.stock;
    });
  }, [data.products, query.stock]);
  const toggleAll = (checked) => setSelected(checked ? visibleProducts.map((item) => item.id) : []);
  const handleExport = async () => {
    if (!storeId) return;
    setExporting(true);
    try {
      const result = await exportSellerProducts(storeId, {
        ids: selected.map(Number).filter(Boolean),
        format: "csv",
      });
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (!canView) return <div className="seller2026-dashboard"><div className="seller2026-error"><ShieldCheck size={18} />You do not have permission to view products.</div></div>;
  if (productsQuery.isLoading) return <ProductSkeleton />;
  if (productsQuery.isError) return <div className="seller2026-dashboard"><div className="seller2026-error">Unable to load products.<button onClick={productsQuery.refetch}>Retry</button></div></div>;

  const allSelected = visibleProducts.length > 0 && visibleProducts.every((item) => selected.includes(item.id));
  const start = data.pagination.total ? (data.pagination.page - 1) * data.pagination.limit + 1 : 0;
  const end = Math.min(data.pagination.page * data.pagination.limit, data.pagination.total);

  return (
    <div className="seller2026-dashboard seller2026-products">
      <header className="seller2026-products__header">
        <div><h1>Products</h1><p>Manage your product catalog and availability.</p></div>
        <div className="seller2026-products__actions">
          <button onClick={handleExport} disabled={exporting}><Download size={16} />{exporting ? "Exporting..." : "Export"}</button>
          <button disabled title="Import is not enabled in this workspace"><Upload size={16} />Import</button>
          <button disabled={!selected.length} title={selected.length ? "Bulk submission is available from review actions" : "Select products first"}><Archive size={16} />Bulk Actions</button>
          <button className="is-danger" disabled><Trash2 size={16} />Delete</button>
          {data.permissions.canCreate ? <Link className="is-primary" to={workspaceRoutes.productCreate()}><Plus size={16} />Add Product</Link> : null}
        </div>
      </header>

      <section className="seller2026-product-kpis">
        {[
          ["Total Products", data.summary.total, "All products", Box, "blue"],
          ["Live", data.summary.active, "Published", CheckCircle2, "green"],
          ["Drafts", data.summary.draft, "Unpublished", FileClock, "amber"],
          ["Review Queue", data.summary.pendingReview, "Awaiting review", ShieldCheck, "blue"],
        ].map(([label, value, note, Icon, color]) => (
          <div className="seller2026-product-kpi" key={label}>
            <span className={`is-${color}`}><Icon size={20} /></span><div><small>{label}</small><strong>{value}</strong><em>{note}</em></div>
          </div>
        ))}
      </section>

      <section className="seller2026-products__catalog">
        <div className="seller2026-products-toolbar">
          <label><Search size={17} /><input value={query.search} onChange={(event) => updateQuery({ search: event.target.value, page: 1 })} placeholder="Search by name, SKU, or slug..." /></label>
          <select value={query.category} onChange={(event) => updateQuery({ category: event.target.value, page: 1 })}>{data.filters.categories.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select>
          <select value={query.status} onChange={(event) => updateQuery({ status: event.target.value, page: 1 })}>{data.filters.statuses.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select>
          <select value={query.stock} onChange={(event) => updateQuery({ stock: event.target.value, page: 1 })}><option value="all">All Stock</option><option value="in_stock">In Stock</option><option value="low_stock">Low Stock</option><option value="out_of_stock">Out of Stock</option></select>
          <button onClick={() => setSearchParams({})}><RefreshCw size={16} />Reset</button>
          <div className="seller2026-products__view"><button className={view === "list" ? "is-active" : ""} onClick={() => setView("list")}><List size={17} /></button><button className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")}><Grid2X2 size={17} /></button></div>
        </div>

        {visibleProducts.length ? (
          <div className={`seller2026-products-table seller2026-products-table--${view}`}>
            <div className="seller2026-products-table__head">
              <input type="checkbox" checked={allSelected} onChange={(event) => toggleAll(event.target.checked)} />
              {["Product", "Category", "Price", "Sale Price", "Stock", "Inventory", "Visibility", "Review Status", "Preview", "Publish", "Actions"].map((item) => <span key={item}>{item}</span>)}
            </div>
            {visibleProducts.map((product) => {
              const inventory = inventoryLabel(product.stock);
              const visibility = product.isPublished || product.visibility?.includes("visible") ? "Visible" : "Hidden";
              const review = product.submissionStatus === "submitted" || product.submissionStatus === "review_queue" ? "Pending" : product.status === "active" ? "Approved" : "Not submitted";
              return (
                <article className="seller2026-product-row" key={product.id}>
                  <input type="checkbox" checked={selected.includes(product.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id))} />
                  <div className="seller2026-product-row__identity">
                    <div>{product.thumbnailUrl ? <img src={resolveAssetUrl(product.thumbnailUrl)} alt="" /> : <Box size={20} />}</div>
                    <span><strong>{product.name}</strong><small>{product.slug || product.sku}</small></span><Pill>{lifecycleLabel(product.status)}</Pill>
                  </div>
                  <span data-label="Category">{product.category}</span>
                  <span data-label="Price">{currency(product.price)}</span>
                  <span className="is-sale" data-label="Sale Price">{product.salePrice ? currency(product.salePrice) : "-"}</span>
                  <span data-label="Stock">{product.stock}</span>
                  <span data-label="Inventory"><Pill>{inventory}</Pill></span>
                  <span data-label="Visibility"><Pill>{visibility}</Pill></span>
                  <span data-label="Review Status"><Pill>{review}</Pill></span>
                  <Link className="seller2026-icon-button" to={workspaceRoutes.productDetail(product.id)} aria-label={`Preview ${product.name}`}><Eye size={17} /></Link>
                  <button className={`seller2026-switch${product.isPublished ? " is-on" : ""}`} disabled title="Publishing remains approval controlled"><i /></button>
                  <div className="seller2026-product-row__menu">
                    <button aria-label={`Actions for ${product.name}`}><MoreHorizontal size={18} /></button>
                    <div><Link to={workspaceRoutes.productDetail(product.id)}>View Details</Link>{data.permissions.canUpdate ? <Link to={workspaceRoutes.productEdit(product.id)}>Edit Product</Link> : null}<span>Duplicate unavailable</span><span>Archive unavailable</span></div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="seller2026-products__empty"><PackagePlus size={38} /><h2>No products yet</h2><p>Create your first product to start selling.</p>{data.permissions.canCreate ? <Link to={workspaceRoutes.productCreate()}>Add Product</Link> : null}</div>
        )}

        {data.pagination.total ? (
          <footer className="seller2026-products__pagination">
            <span>Showing {start} to {end} of {data.pagination.total} products</span>
            <div><button disabled={data.pagination.page <= 1} onClick={() => updateQuery({ page: data.pagination.page - 1 })}><ChevronLeft size={16} /></button><strong>{data.pagination.page}</strong><span>of {data.pagination.totalPages}</span><button disabled={data.pagination.page >= data.pagination.totalPages} onClick={() => updateQuery({ page: data.pagination.page + 1 })}><ChevronRight size={16} /></button></div>
            <select value={data.pagination.limit} onChange={(event) => updateQuery({ limit: event.target.value, page: 1 })}><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select>
          </footer>
        ) : null}
      </section>
    </div>
  );
}
