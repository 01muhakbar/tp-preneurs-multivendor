import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  Box,
  Check,
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
const lifecycleLabel = (status, isId = false) => {
  if (isId) {
    return ({ active: "Aktif", draft: "Draf", submitted: "Diajukan untuk Tinjauan", needs_revision: "Perlu Revisi", inactive: "Diarsipkan" }[status] || "Draf");
  }
  return ({ active: "Active", draft: "Draft", submitted: "Submitted for Review", needs_revision: "Needs Revision", inactive: "Archived" }[status] || "Draft");
};
const reviewStatusLabel = (product, isId = false) => {
  const submissionStatus = String(product.submissionStatus || "none").toLowerCase();
  if (submissionStatus === "submitted" || submissionStatus === "review_queue") return isId ? "Menunggu Tinjauan" : "Pending Review";
  if (submissionStatus === "needs_revision") return isId ? "Perlu Revisi" : "Needs Revision";
  if (product.status === "active") return isId ? "Disetujui" : "Approved";
  return isId ? "Belum Diajukan" : "Not Submitted";
};
const tone = (label) => {
  const value = String(label).toLowerCase();
  if (["active", "aktif", "approved", "disetujui", "visible", "tampil", "in stock", "tersedia"].some((item) => value.includes(item))) return "success";
  if (["draft", "draf", "low stock", "stok rendah", "revision", "revisi"].some((item) => value.includes(item))) return "warning";
  if (["submitted", "pending", "menunggu", "diajukan"].some((item) => value.includes(item))) return "info";
  return "neutral";
};
const inventoryStateKey = (stock) => stock <= 0 ? "out_of_stock" : stock <= 10 ? "low_stock" : "in_stock";
const inventoryLabel = (stock, isId = false) => {
  if (stock <= 0) return isId ? "Stok Habis" : "Out of Stock";
  if (stock <= 10) return isId ? "Stok Rendah" : "Low Stock";
  return isId ? "Tersedia" : "In Stock";
};
const translateFilterLabel = (label, isId = false) => {
  if (!isId) return label;
  switch (label) {
    case "All Categories":
      return "Semua Kategori";
    case "All Status":
      return "Semua Status";
    case "Draft":
      return "Draf";
    case "Review Queue":
      return "Antrean Tinjauan";
    case "Submitted for Review":
      return "Diajukan untuk Tinjauan";
    case "Active":
      return "Aktif";
    case "Needs Revision":
      return "Perlu Revisi";
    case "Inactive":
      return "Nonaktif";
    default:
      return label;
  }
};
const toErrorMessage = (error, fallback) =>
  String(error?.response?.data?.message || error?.message || fallback);

function Pill({ children }) {
  return <span className={`seller2026-pill seller2026-pill--${tone(children)}`}>{children}</span>;
}

function ProductSkeleton({ isId = false }) {
  return <div className="seller2026-dashboard seller2026-products" aria-label={isId ? "Memuat daftar produk" : "Loading products"}><div className="seller2026-skeleton" /><div className="seller2026-skeleton seller2026-skeleton--hero" /></div>;
}

export default function Seller2026LiveProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes, isId = false } = useSellerWorkspaceRoute();
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
  const [notice, setNotice] = useState(null);
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
    return data.products.filter((product) => inventoryStateKey(product.stock) === query.stock);
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
  const handlePublish = async (product) => {
    setNotice(null);
    try {
      await productsQuery.setProductPublished({
        productId: product.id,
        published: !product.isPublished,
      });
      setNotice({
        type: "success",
        text: product.isPublished
          ? (isId
              ? `${product.name} sekarang disembunyikan dari etalase.`
              : `${product.name} is now hidden from the storefront.`)
          : (isId
              ? `${product.name} sekarang dipublikasikan ke etalase.`
              : `${product.name} is now published to the storefront.`),
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: toErrorMessage(error, isId ? "Gagal memperbarui visibilitas produk." : "Unable to update product visibility."),
      });
    }
  };

  if (!canView) return <div className="seller2026-dashboard"><div className="seller2026-error"><ShieldCheck size={18} />{isId ? "Anda tidak memiliki izin untuk melihat produk." : "You do not have permission to view products."}</div></div>;
  if (productsQuery.isLoading) return <ProductSkeleton isId={isId} />;
  if (productsQuery.isError) return <div className="seller2026-dashboard"><div className="seller2026-error">{isId ? "Gagal memuat produk." : "Unable to load products."}<button onClick={productsQuery.refetch}>{isId ? "Coba Lagi" : "Retry"}</button></div></div>;

  const allSelected = visibleProducts.length > 0 && visibleProducts.every((item) => selected.includes(item.id));
  const start = data.pagination.total ? (data.pagination.page - 1) * data.pagination.limit + 1 : 0;
  const end = Math.min(data.pagination.page * data.pagination.limit, data.pagination.total);

  return (
    <div className="seller2026-dashboard seller2026-products">
      <header className="seller2026-products__header">
        <div><h1>{isId ? "Produk" : "Products"}</h1><p>{isId ? "Kelola katalog dan ketersediaan produk toko Anda." : "Manage your product catalog and availability."}</p></div>
        <div className="seller2026-products__actions">
          <button onClick={handleExport} disabled={exporting}><Download size={16} />{exporting ? (isId ? "Mengekspor..." : "Exporting...") : (isId ? "Ekspor" : "Export")}</button>
          <button disabled title={isId ? "Impor belum diaktifkan di ruang kerja ini" : "Import is not enabled in this workspace"}><Upload size={16} />{isId ? "Impor" : "Import"}</button>
          <button disabled={!selected.length} title={selected.length ? (isId ? "Pengajuan massal tersedia di aksi tinjauan" : "Bulk submission is available from review actions") : (isId ? "Pilih produk terlebih dahulu" : "Select products first")}><Archive size={16} />{isId ? "Aksi Massal" : "Bulk Actions"}</button>
          <button className="is-danger" disabled><Trash2 size={16} />{isId ? "Hapus" : "Delete"}</button>
          {data.permissions.canCreate ? <Link className="is-primary" to={workspaceRoutes.productCreate()}><Plus size={16} />{isId ? "Tambah Produk" : "Add Product"}</Link> : null}
        </div>
      </header>

      <section className="seller2026-product-kpis">
        {[
          [isId ? "Total Produk" : "Total Products", data.summary.total, isId ? "Semua produk" : "All products", Box, "blue"],
          [isId ? "Aktif" : "Live", data.summary.storefrontVisible, isId ? "Tampil di etalase" : "Storefront visible", CheckCircle2, "green"],
          [isId ? "Draf" : "Drafts", data.summary.draft, isId ? "Belum diterbitkan" : "Unpublished", FileClock, "amber"],
          [isId ? "Antrean Tinjauan" : "Review Queue", data.summary.pendingReview, isId ? "Menunggu tinjauan" : "Awaiting review", ShieldCheck, "blue"],
        ].map(([label, value, note, Icon, color]) => (
          <div className="seller2026-product-kpi" key={label}>
            <span className={`is-${color}`}><Icon size={20} /></span><div><small>{label}</small><strong>{value}</strong><em>{note}</em></div>
          </div>
        ))}
      </section>

      {notice ? (
        <div className={`seller2026-profile__notice seller2026-profile__notice--${notice.type}`}>
          {notice.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}{notice.text}
        </div>
      ) : null}

      <section className="seller2026-products__catalog">
        <div className="seller2026-products-toolbar">
          <label><Search size={17} /><input value={query.search} onChange={(event) => updateQuery({ search: event.target.value, page: 1 })} placeholder={isId ? "Cari berdasarkan nama, SKU, atau slug..." : "Search by name, SKU, or slug..."} /></label>
          <select value={query.category} onChange={(event) => updateQuery({ category: event.target.value, page: 1 })}>{data.filters.categories.map((item) => <option value={item.value} key={item.value}>{translateFilterLabel(item.label, isId)}</option>)}</select>
          <select value={query.status} onChange={(event) => updateQuery({ status: event.target.value, page: 1 })}>{data.filters.statuses.map((item) => <option value={item.value} key={item.value}>{translateFilterLabel(item.label, isId)}</option>)}</select>
          <select value={query.stock} onChange={(event) => updateQuery({ stock: event.target.value, page: 1 })}><option value="all">{isId ? "Semua Stok" : "All Stock"}</option><option value="in_stock">{isId ? "Tersedia" : "In Stock"}</option><option value="low_stock">{isId ? "Stok Rendah" : "Low Stock"}</option><option value="out_of_stock">{isId ? "Stok Habis" : "Out of Stock"}</option></select>
          <button onClick={() => setSearchParams({})}><RefreshCw size={16} />{isId ? "Reset" : "Reset"}</button>
          <div className="seller2026-products__view"><button className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} aria-label={isId ? "Tampilan Daftar" : "List view"}><List size={17} /></button><button className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")} aria-label={isId ? "Tampilan Kisi" : "Grid view"}><Grid2X2 size={17} /></button></div>
        </div>

        {visibleProducts.length ? (
          <div className={`seller2026-products-table seller2026-products-table--${view}`}>
            <div className="seller2026-products-table__head">
              <input type="checkbox" checked={allSelected} onChange={(event) => toggleAll(event.target.checked)} />
              {(isId
                ? ["Produk", "Kategori", "Harga", "Harga Diskon", "Stok", "Inventaris", "Visibilitas", "Status Tinjauan", "Pratinjau", "Publikasi", "Aksi"]
                : ["Product", "Category", "Price", "Sale Price", "Stock", "Inventory", "Visibility", "Review Status", "Preview", "Publish", "Actions"]
              ).map((item) => <span key={item}>{item}</span>)}
            </div>
            {visibleProducts.map((product) => {
              const inventory = inventoryLabel(product.stock, isId);
              const visibility = product.visibility === "storefront_visible"
                ? (isId ? "Tampil" : "Visible")
                : product.visibility === "published_blocked"
                  ? (isId ? "Diblokir" : "Blocked")
                  : (isId ? "Tersembunyi" : "Hidden");
              const review = reviewStatusLabel(product, isId);
              const reviewLocked = product.submissionStatus === "submitted" || product.submissionStatus === "needs_revision";
              const publishDisabled = !data.permissions.canPublish || product.status !== "active" || reviewLocked || productsQuery.isPublishing;
              const publishTitle = !data.permissions.canPublish
                ? (isId ? "Anda tidak memiliki izin untuk mempublikasikan produk" : "You do not have permission to publish products")
                : reviewLocked
                  ? (isId ? "Selesaikan proses tinjauan admin sebelum mengubah visibilitas" : "Complete the admin review flow before changing visibility")
                  : product.status !== "active"
                    ? (isId ? "Persetujuan admin diperlukan sebelum mempublikasikan" : "Admin approval is required before publishing")
                    : product.isPublished
                      ? (isId ? "Sembunyikan produk" : "Unpublish product")
                      : (isId ? "Publikasikan produk" : "Publish product");
              return (
                <article className="seller2026-product-row" key={product.id}>
                  <input type="checkbox" checked={selected.includes(product.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id))} />
                  <div className="seller2026-product-row__identity">
                    <div>{product.thumbnailUrl ? <img src={resolveAssetUrl(product.thumbnailUrl)} alt="" /> : <Box size={20} />}</div>
                    <span><strong>{product.name}</strong><small>{product.slug || product.sku}</small></span><Pill>{lifecycleLabel(product.status, isId)}</Pill>
                  </div>
                  <span data-label={isId ? "Kategori" : "Category"}>{product.category}</span>
                  <span data-label={isId ? "Harga" : "Price"}>{currency(product.price)}</span>
                  <span className="is-sale" data-label={isId ? "Harga Diskon" : "Sale Price"}>{product.salePrice ? currency(product.salePrice) : "-"}</span>
                  <span data-label={isId ? "Stok" : "Stock"}>{product.stock}</span>
                  <span data-label={isId ? "Inventaris" : "Inventory"}><Pill>{inventory}</Pill></span>
                  <span data-label={isId ? "Visibilitas" : "Visibility"}><Pill>{visibility}</Pill></span>
                  <span data-label={isId ? "Status Tinjauan" : "Review Status"}><Pill>{review}</Pill></span>
                  <Link className="seller2026-icon-button" to={workspaceRoutes.productDetail(product.id)} aria-label={isId ? `Pratinjau ${product.name}` : `Preview ${product.name}`}><Eye size={17} /></Link>
                  <button
                    className={`seller2026-switch${product.isPublished ? " is-on" : ""}`}
                    disabled={publishDisabled}
                    title={publishTitle}
                    aria-label={isId ? `${product.isPublished ? "Sembunyikan" : "Publikasikan"} ${product.name}` : `${product.isPublished ? "Unpublish" : "Publish"} ${product.name}`}
                    aria-pressed={Boolean(product.isPublished)}
                    onClick={() => handlePublish(product)}
                  ><i /></button>
                  <div className="seller2026-product-row__menu">
                    <button aria-label={isId ? `Aksi untuk ${product.name}` : `Actions for ${product.name}`}><MoreHorizontal size={18} /></button>
                    <div><Link to={workspaceRoutes.productDetail(product.id)}>{isId ? "Lihat Detail" : "View Details"}</Link>{data.permissions.canUpdate ? <Link to={workspaceRoutes.productEdit(product.id)}>{isId ? "Edit Produk" : "Edit Product"}</Link> : null}<span>{isId ? "Duplikasi tidak tersedia" : "Duplicate unavailable"}</span><span>{isId ? "Arsipkan tidak tersedia" : "Archive unavailable"}</span></div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="seller2026-products__empty"><PackagePlus size={38} /><h2>{isId ? "Belum ada produk" : "No products yet"}</h2><p>{isId ? "Buat produk pertama Anda untuk mulai berjualan." : "Create your first product to start selling."}</p>{data.permissions.canCreate ? <Link to={workspaceRoutes.productCreate()}>{isId ? "Tambah Produk" : "Add Product"}</Link> : null}</div>
        )}

        {data.pagination.total ? (
          <footer className="seller2026-products__pagination">
            <span>{isId ? `Menampilkan ${start} hingga ${end} dari ${data.pagination.total} produk` : `Showing ${start} to ${end} of ${data.pagination.total} products`}</span>
            <div><button disabled={data.pagination.page <= 1} onClick={() => updateQuery({ page: data.pagination.page - 1 })}><ChevronLeft size={16} /></button><strong>{data.pagination.page}</strong><span>{isId ? `dari ${data.pagination.totalPages}` : `of ${data.pagination.totalPages}`}</span><button disabled={data.pagination.page >= data.pagination.totalPages} onClick={() => updateQuery({ page: data.pagination.page + 1 })}><ChevronRight size={16} /></button></div>
            <select value={data.pagination.limit} onChange={(event) => updateQuery({ limit: event.target.value, page: 1 })}><option value="10">{isId ? "10 / halaman" : "10 / page"}</option><option value="20">{isId ? "20 / halaman" : "20 / page"}</option><option value="50">{isId ? "50 / halaman" : "50 / page"}</option></select>
          </footer>
        ) : null}
      </section>
    </div>
  );
}
