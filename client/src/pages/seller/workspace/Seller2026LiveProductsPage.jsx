import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { exportSellerProducts } from "../../../api/sellerProducts.ts";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import { useSeller2026Products } from "../../../hooks/seller2026/useSeller2026Products.ts";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../../features/sellerWorkspace2026/SellerWorkspace2026.css";

const readNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

const currency = (value) =>
  `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(value || 0))}`;

const lifecycleLabel = (status, isId = false) => {
  if (isId) {
    return (
      {
        active: "Aktif",
        draft: "Draf",
        submitted: "Diajukan",
        needs_revision: "Perlu Revisi",
        inactive: "Nonaktif",
      }[status] || "Draf"
    );
  }
  return (
    {
      active: "Active",
      draft: "Draft",
      submitted: "Submitted",
      needs_revision: "Needs Revision",
      inactive: "Inactive",
    }[status] || "Draft"
  );
};

const reviewStatusLabel = (product, isId = false) => {
  const submissionStatus = String(product.submissionStatus || "none").toLowerCase();
  if (submissionStatus === "submitted" || submissionStatus === "review_queue") {
    return isId ? "Menunggu Tinjauan" : "Pending Review";
  }
  if (submissionStatus === "needs_revision") {
    return isId ? "Perlu Revisi" : "Needs Revision";
  }
  if (product.status === "active") {
    return isId ? "Disetujui" : "Approved";
  }
  return isId ? "Belum Diajukan" : "Not Submitted";
};

const tone = (label) => {
  const value = String(label).toLowerCase();
  if (["active", "aktif", "approved", "disetujui", "visible", "tampil", "in stock", "tersedia"].some((item) => value.includes(item))) {
    return "success";
  }
  if (["draft", "draf", "low stock", "stok rendah", "revision", "revisi"].some((item) => value.includes(item))) {
    return "warning";
  }
  if (["submitted", "pending", "menunggu", "diajukan"].some((item) => value.includes(item))) {
    return "info";
  }
  return "neutral";
};

const inventoryStateKey = (stock) => (stock <= 0 ? "out_of_stock" : stock <= 10 ? "low_stock" : "in_stock");

const inventoryLabel = (stock, isId = false) => {
  if (stock <= 0) return isId ? "Stok Habis" : "Out of Stock";
  if (stock <= 10) return isId ? "Stok Rendah" : "Low Stock";
  return isId ? "Tersedia" : "In Stock";
};

const translateFilterLabel = (label, isId = false) => {
  if (!isId) {
    switch (label) {
      case "Semua Kategori": return "All Categories";
      case "Semua Status": return "All Status";
      case "Draf": return "Draft";
      case "Antrean Tinjauan": return "Review Queue";
      case "Diajukan untuk Tinjauan": return "Submitted for Review";
      case "Aktif": return "Active";
      case "Perlu Revisi": return "Needs Revision";
      case "Nonaktif": return "Inactive";
      default: return label;
    }
  }
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
  return (
    <div className="seller2026-dashboard seller2026-products" aria-label={isId ? "Memuat daftar produk" : "Loading products"}>
      <div className="seller2026-skeleton" />
      <div className="seller2026-skeleton seller2026-skeleton--hero" />
    </div>
  );
}

function SellerProductThumbnail({ product }) {
  const candidates = useMemo(() => {
    const list = [
      product?.imageUrl,
      product?.thumbnailUrl,
      product?.thumbnail,
      product?.image,
      product?.promoImagePath,
      product?.mediaPreviewUrl,
      ...(product?.imageUrls || []),
      ...(product?.imagePaths || []),
    ]
      .filter(Boolean)
      .map((src) => resolveAssetUrl(src));
    return Array.from(new Set(list));
  }, [product]);

  const [index, setIndex] = useState(0);

  if (candidates.length === 0 || index >= candidates.length) {
    return (
      <span
        className="seller2026-product-thumb-fallback"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))",
          color: "#94a3b8",
          borderRadius: "6px",
        }}
        title={product?.name || "Product"}
      >
        <Box size={20} />
      </span>
    );
  }

  return (
    <img
      src={candidates[index]}
      alt={product?.name || ""}
      onError={() => setIndex((prev) => prev + 1)}
      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }}
    />
  );
}

export default function Seller2026LiveProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes, isId: outletIsId = false } = useSellerWorkspaceRoute();
  const { i18n } = useTranslation();
  const isId = Boolean(outletIsId || String(i18n.language || "").toLowerCase().startsWith("id"));
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("CATALOG_PRODUCT_READ");
  const isStoreInactive = String(sellerContext?.store?.status || "").toUpperCase() === "INACTIVE";

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
      canPublish: can("CATALOG_PRODUCT_PUBLISH"),
    },
  });

  const [selected, setSelected] = useState([]);
  const [view, setView] = useState("list");
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const data = productsQuery.data;

  useEffect(() => {
    if (!activeMenuId) return;
    const handleDocumentClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleDocumentClick);
    return () => window.removeEventListener("click", handleDocumentClick);
  }, [activeMenuId]);

  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      const param = key === "search" ? "q" : key;
      if (!value || value === "all" || (param === "page" && Number(value) === 1) || (param === "limit" && Number(value) === 10)) {
        next.delete(param);
      } else {
        next.set(param, String(value));
      }
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

  if (!canView) {
    return (
      <div className="seller2026-dashboard">
        <div className="seller2026-error">
          <ShieldCheck size={18} />
          {isId ? "Anda tidak memiliki izin untuk melihat produk." : "You do not have permission to view products."}
        </div>
      </div>
    );
  }

  if (productsQuery.isLoading) return <ProductSkeleton isId={isId} />;
  if (productsQuery.isError) {
    return (
      <div className="seller2026-dashboard">
        <div className="seller2026-error">
          {isId ? "Gagal memuat produk." : "Unable to load products."}
          <button onClick={productsQuery.refetch}>{isId ? "Coba Lagi" : "Retry"}</button>
        </div>
      </div>
    );
  }

  const allSelected = visibleProducts.length > 0 && visibleProducts.every((item) => selected.includes(item.id));
  const start = data.pagination.total ? (data.pagination.page - 1) * data.pagination.limit + 1 : 0;
  const end = Math.min(data.pagination.page * data.pagination.limit, data.pagination.total);

  return (
    <div className="seller2026-dashboard seller2026-products">
      <header className="seller2026-products__header">
        <div>
          <h1>{isId ? "Produk" : "Products"}</h1>
          <p>{isId ? "Kelola katalog dan ketersediaan produk toko Anda." : "Manage your product catalog and availability."}</p>
        </div>
        <div className="seller2026-products__actions">
          <button onClick={handleExport} disabled={exporting}>
            <Download size={16} />
            {exporting ? (isId ? "Mengekspor..." : "Exporting...") : (isId ? "Ekspor" : "Export")}
          </button>
          <button disabled title={isId ? "Impor belum diaktifkan di ruang kerja ini" : "Import is not enabled in this workspace"}>
            <Upload size={16} />
            {isId ? "Impor" : "Import"}
          </button>
          <button
            disabled={!selected.length}
            title={selected.length ? (isId ? "Pengajuan massal tersedia di aksi tinjauan" : "Bulk submission is available from review actions") : (isId ? "Pilih produk terlebih dahulu" : "Select products first")}
          >
            <Archive size={16} />
            {isId ? "Aksi Massal" : "Bulk Actions"}
          </button>
          <button className="is-danger" disabled>
            <Trash2 size={16} />
            {isId ? "Hapus" : "Delete"}
          </button>
          {data.permissions.canCreate ? (
            <Link className="is-primary" to={workspaceRoutes.productCreate()}>
              <Plus size={16} />
              {isId ? "Tambah Produk" : "Add Product"}
            </Link>
          ) : null}
        </div>
      </header>

      <section className="seller2026-product-kpis">
        {[
          [isId ? "Total Produk" : "Total Products", data.summary.total, isId ? "Semua produk" : "All products", Box, "blue"],
          [isId ? "Aktif" : "Live", data.summary.storefrontVisible, isId ? "Tampil di etalase" : "Storefront visible", CheckCircle2, "green"],
          [isId ? "Draf" : "Drafts", data.summary.draft, isId ? "Belum diterbitkan" : "Unpublished", FileClock, "amber"],
          [isId ? "Antrean Tinjauan" : "Review Queue", data.summary.pendingReview, isId ? "Menunggu tinjauan" : "Awaiting review", ShieldCheck, "navy"],
        ].map(([label, value, note, Icon, color]) => (
          <div className="seller2026-product-kpi" key={label}>
            <span className={`is-${color}`}>
              <Icon size={20} />
            </span>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
              <em>{note}</em>
            </div>
          </div>
        ))}
      </section>

      {notice ? (
        <div className={`seller2026-profile__notice seller2026-profile__notice--${notice.type}`}>
          {notice.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          {notice.text}
        </div>
      ) : null}

      {Boolean(data.summary.publishedBlocked > 0 || visibleProducts.some((p) => p.visibility === "published_blocked")) ? (
        <div
          className="seller2026-profile__notice seller2026-profile__notice--warning"
          style={{
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            borderLeft: "4px solid #fe6f05",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={18} style={{ color: "#fe6f05", flexShrink: 0 }} />
            <span>
              {isStoreInactive
                ? (isId
                    ? "Toko Anda saat ini berstatus Inactive (Menunggu persetujuan aktivasi Admin). Produk yang sudah Anda terbitkan akan otomatis tampil di etalase publik setelah status toko diaktifkan oleh Admin."
                    : "Your store is currently inactive (awaiting Admin activation). Published products will automatically appear in the public storefront once your store is activated by Admin.")
                : (isId
                    ? "Produk yang sudah Anda terbitkan belum tampil di etalase publik karena sedang menunggu tinjauan kurasi Admin atau memerlukan revisi."
                    : "Your published products are currently hidden from the public storefront because they are awaiting Admin review or require revisions.")}
            </span>
          </div>
          {isStoreInactive ? (
            <Link
              to={workspaceRoutes.storeProfile ? workspaceRoutes.storeProfile() : `/seller/stores/${sellerContext?.storeSlug || "sweet-flower"}/store-profile`}
              style={{
                background: "#fe6f05",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: "6px",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              {isId ? "Lihat Profil Toko" : "View Store Profile"}
            </Link>
          ) : (
            <Link
              to={workspaceRoutes.catalog ? workspaceRoutes.catalog() : `/seller/stores/${sellerContext?.storeSlug || "sweet-flower"}/catalog/products`}
              style={{
                background: "#fe6f05",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: "6px",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              {isId ? "Status Katalog" : "Catalog Status"}
            </Link>
          )}
        </div>
      ) : null}

      <section className="seller2026-products__catalog">
        <div className="seller2026-products-toolbar">
          <label>
            <Search size={17} />
            <input
              value={query.search}
              onChange={(event) => updateQuery({ search: event.target.value, page: 1 })}
              placeholder={isId ? "Cari nama produk, SKU, atau slug..." : "Search by name, SKU, or slug..."}
            />
          </label>
          <select value={query.category} onChange={(event) => updateQuery({ category: event.target.value, page: 1 })}>
            {data.filters.categories.map((item) => (
              <option value={item.value} key={item.value}>
                {translateFilterLabel(item.label, isId)}
              </option>
            ))}
          </select>
          <select value={query.status} onChange={(event) => updateQuery({ status: event.target.value, page: 1 })}>
            {data.filters.statuses.map((item) => (
              <option value={item.value} key={item.value}>
                {translateFilterLabel(item.label, isId)}
              </option>
            ))}
          </select>
          <select value={query.stock} onChange={(event) => updateQuery({ stock: event.target.value, page: 1 })}>
            <option value="all">{isId ? "Semua Stok" : "All Stock"}</option>
            <option value="in_stock">{isId ? "Tersedia" : "In Stock"}</option>
            <option value="low_stock">{isId ? "Stok Rendah" : "Low Stock"}</option>
            <option value="out_of_stock">{isId ? "Stok Habis" : "Out of Stock"}</option>
          </select>
          <button type="button" onClick={() => setSearchParams({})}>
            <RefreshCw size={16} />
            {isId ? "Reset" : "Reset"}
          </button>
          <div className="seller2026-products__view">
            <button
              type="button"
              className={view === "list" ? "is-active" : ""}
              onClick={() => setView("list")}
              aria-label={isId ? "Tampilan Daftar" : "List view"}
              title={isId ? "Tampilan Daftar" : "List view"}
            >
              <List size={17} />
            </button>
            <button
              type="button"
              className={view === "grid" ? "is-active" : ""}
              onClick={() => setView("grid")}
              aria-label={isId ? "Tampilan Kisi" : "Grid view"}
              title={isId ? "Tampilan Kisi" : "Grid view"}
            >
              <Grid2X2 size={17} />
            </button>
          </div>
        </div>

        {visibleProducts.length ? (
          view === "grid" ? (
            <div className="seller2026-products-grid">
              {visibleProducts.map((product) => {
                const inventory = inventoryLabel(product.stock, isId);
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
                  <article className="seller2026-product-card" key={product.id}>
                    <div className="seller2026-product-card__thumb-wrap">
                      <SellerProductThumbnail product={product} />
                      <div className="seller2026-product-card__badges">
                        <Pill>{lifecycleLabel(product.status, isId)}</Pill>
                        <Pill>{review}</Pill>
                      </div>
                    </div>

                    <div className="seller2026-product-card__body">
                      <div className="seller2026-product-card__category">{product.category || "-"}</div>
                      <Link
                        to={workspaceRoutes.productDetail(product.id)}
                        className="seller2026-product-card__title"
                        title={product.name}
                      >
                        {product.name}
                      </Link>
                      <small style={{ color: "var(--seller2026-muted)", fontSize: "11.5px" }}>{product.sku || product.slug}</small>

                      <div className="seller2026-product-card__price-row">
                        {product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.price) ? (
                          <>
                            <strong style={{ color: "#fe6f05", fontSize: "15px", fontWeight: 750 }}>
                              {currency(product.salePrice)}
                            </strong>
                            <span style={{ textDecoration: "line-through", color: "var(--seller2026-muted)", fontSize: "12px" }}>
                              {currency(product.price)}
                            </span>
                          </>
                        ) : (
                          <strong style={{ fontSize: "15px", fontWeight: 700, color: "var(--seller2026-text)" }}>
                            {currency(product.price)}
                          </strong>
                        )}
                      </div>

                      <div className="seller2026-product-card__stock-row">
                        <span style={{ fontSize: "12.5px", color: "var(--seller2026-muted)" }}>{isId ? "Stok:" : "Stock:"}</span>
                        <strong style={{ fontSize: "13px" }}>{product.stock ?? 0}</strong>
                        <Pill>{inventory}</Pill>
                      </div>
                    </div>

                    <footer className="seller2026-product-card__footer">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          className={`seller2026-switch${product.isPublished ? " is-on" : ""}`}
                          disabled={publishDisabled}
                          title={publishTitle}
                          aria-label={
                            isId
                              ? `${product.isPublished ? "Sembunyikan" : "Publikasikan"} ${product.name}`
                              : `${product.isPublished ? "Unpublish" : "Publish"} ${product.name}`
                          }
                          aria-pressed={Boolean(product.isPublished)}
                          onClick={() => handlePublish(product)}
                        >
                          <i />
                        </button>
                        <small style={{ fontSize: "12px", color: "var(--seller2026-muted)", fontWeight: 500 }}>
                          {product.isPublished ? (isId ? "Etalase" : "Live") : (isId ? "Nonaktif" : "Off")}
                        </small>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Link
                          className="seller2026-icon-button"
                          to={workspaceRoutes.productDetail(product.id)}
                          title={isId ? "Pratinjau Produk" : "Preview Product"}
                          aria-label={isId ? `Pratinjau ${product.name}` : `Preview ${product.name}`}
                        >
                          <Eye size={15} />
                        </Link>
                        {data.permissions.canUpdate ? (
                          <Link
                            className="seller2026-icon-button"
                            to={workspaceRoutes.productEdit(product.id)}
                            title={isId ? "Edit Produk" : "Edit Product"}
                            aria-label={isId ? `Edit ${product.name}` : `Edit ${product.name}`}
                          >
                            <Pencil size={14} />
                          </Link>
                        ) : null}
                      </div>
                    </footer>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="seller2026-products-table-wrap">
              <div className="seller2026-products-table">
                <div className="seller2026-products-table__head">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) => toggleAll(event.target.checked)}
                    aria-label={isId ? "Pilih semua produk" : "Select all products"}
                  />
                  <span>{isId ? "Produk" : "Product"}</span>
                  <span>{isId ? "Kategori" : "Category"}</span>
                  <span>{isId ? "Harga" : "Price"}</span>
                  <span>{isId ? "Stok" : "Stock"}</span>
                  <span>{isId ? "Visibilitas" : "Visibility"}</span>
                  <span>{isId ? "Status Tinjauan" : "Review Status"}</span>
                  <span style={{ textAlign: "center" }}>{isId ? "Publikasi" : "Publish"}</span>
                  <span style={{ textAlign: "right" }}>{isId ? "Aksi" : "Actions"}</span>
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
                      <input
                        type="checkbox"
                        checked={selected.includes(product.id)}
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id)
                          )
                        }
                        aria-label={isId ? `Pilih ${product.name}` : `Select ${product.name}`}
                      />
                      <div className="seller2026-product-row__identity">
                        <div>
                          <SellerProductThumbnail product={product} />
                        </div>
                        <div className="seller2026-product-row__info">
                          <Link
                            to={workspaceRoutes.productDetail(product.id)}
                            className="seller2026-product-row__title"
                            title={product.name}
                          >
                            {product.name}
                          </Link>
                          <small className="seller2026-product-row__slug">{product.sku || product.slug}</small>
                          <div className="seller2026-product-row__badge">
                            <Pill>{lifecycleLabel(product.status, isId)}</Pill>
                          </div>
                        </div>
                      </div>

                      <div className="seller2026-product-row__cell" data-label={isId ? "Kategori" : "Category"}>
                        <span className="seller2026-product-row__val">{product.category || "-"}</span>
                      </div>

                      <div className="seller2026-product-row__cell" data-label={isId ? "Harga" : "Price"}>
                        {product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.price) ? (
                          <div className="seller2026-price-group">
                            <span className="seller2026-price-group__sale">
                              {currency(product.salePrice)}
                            </span>
                            <span className="seller2026-price-group__original">
                              {currency(product.price)}
                            </span>
                          </div>
                        ) : (
                          <strong className="seller2026-price-group__regular">
                            {currency(product.price)}
                          </strong>
                        )}
                      </div>

                      <div className="seller2026-product-row__cell" data-label={isId ? "Stok" : "Stock"}>
                        <div className="seller2026-stock-group">
                          <strong className="seller2026-stock-qty">{product.stock ?? 0}</strong>
                          <Pill>{inventory}</Pill>
                        </div>
                      </div>

                      <div
                        className="seller2026-product-row__cell"
                        data-label={isId ? "Visibilitas" : "Visibility"}
                        title={
                          product.visibility === "published_blocked"
                            ? isStoreInactive
                              ? isId
                                ? "Produk diterbitkan namun etalase publik ditahan karena status toko belum diaktifkan oleh Admin"
                                : "Published but hidden from public storefront because store is not yet active"
                              : isId
                                ? "Produk diterbitkan namun etalase publik ditahan menunggu tinjauan Admin"
                                : "Published but hidden from public storefront pending Admin review"
                            : undefined
                        }
                      >
                        <Pill>{visibility}</Pill>
                      </div>

                      <div className="seller2026-product-row__cell" data-label={isId ? "Status Tinjauan" : "Review Status"}>
                        <Pill>{review}</Pill>
                      </div>

                      <div className="seller2026-product-row__cell seller2026-product-row__cell--center" data-label={isId ? "Publikasi" : "Publish"}>
                        <button
                          type="button"
                          className={`seller2026-switch${product.isPublished ? " is-on" : ""}`}
                          disabled={publishDisabled}
                          title={publishTitle}
                          aria-label={
                            isId
                              ? `${product.isPublished ? "Sembunyikan" : "Publikasikan"} ${product.name}`
                              : `${product.isPublished ? "Unpublish" : "Publish"} ${product.name}`
                          }
                          aria-pressed={Boolean(product.isPublished)}
                          onClick={() => handlePublish(product)}
                        >
                          <i />
                        </button>
                      </div>

                      <div className="seller2026-product-row__actions-cell">
                        <Link
                          className="seller2026-icon-button"
                          to={workspaceRoutes.productDetail(product.id)}
                          title={isId ? "Pratinjau Produk" : "Preview Product"}
                          aria-label={isId ? `Pratinjau ${product.name}` : `Preview ${product.name}`}
                        >
                          <Eye size={16} />
                        </Link>
                        {data.permissions.canUpdate ? (
                          <Link
                            className="seller2026-icon-button"
                            to={workspaceRoutes.productEdit(product.id)}
                            title={isId ? "Edit Produk" : "Edit Product"}
                            aria-label={isId ? `Edit ${product.name}` : `Edit ${product.name}`}
                          >
                            <Pencil size={15} />
                          </Link>
                        ) : null}
                        <div className={`seller2026-product-row__menu${activeMenuId === product.id ? " is-open" : ""}`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId((prev) => (prev === product.id ? null : product.id));
                            }}
                            aria-label={isId ? `Aksi untuk ${product.name}` : `Actions for ${product.name}`}
                          >
                            <MoreHorizontal size={17} />
                          </button>
                          {activeMenuId === product.id ? (
                            <div className="seller2026-product-dropdown-menu">
                              <Link
                                to={workspaceRoutes.productDetail(product.id)}
                                onClick={() => setActiveMenuId(null)}
                              >
                                <Eye size={14} />
                                {isId ? "Lihat Detail" : "View Details"}
                              </Link>
                              {data.permissions.canUpdate ? (
                                <Link
                                  to={workspaceRoutes.productEdit(product.id)}
                                  onClick={() => setActiveMenuId(null)}
                                >
                                  <Pencil size={14} />
                                  {isId ? "Edit Produk" : "Edit Product"}
                                </Link>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          <div className="seller2026-products__empty">
            <PackagePlus size={38} />
            <h2>{isId ? "Belum ada produk" : "No products yet"}</h2>
            <p>{isId ? "Buat produk pertama Anda untuk mulai berjualan." : "Create your first product to start selling."}</p>
            {data.permissions.canCreate ? (
              <Link to={workspaceRoutes.productCreate()}>{isId ? "Tambah Produk" : "Add Product"}</Link>
            ) : null}
          </div>
        )}

        {data.pagination.total ? (
          <footer className="seller2026-products__pagination">
            <span>
              {isId
                ? `Menampilkan ${start} hingga ${end} dari ${data.pagination.total} produk`
                : `Showing ${start} to ${end} of ${data.pagination.total} products`}
            </span>
            <div>
              <button
                type="button"
                disabled={data.pagination.page <= 1}
                onClick={() => updateQuery({ page: data.pagination.page - 1 })}
                aria-label={isId ? "Halaman sebelumnya" : "Previous page"}
              >
                <ChevronLeft size={16} />
              </button>
              <strong>{data.pagination.page}</strong>
              <span>{isId ? `dari ${data.pagination.totalPages}` : `of ${data.pagination.totalPages}`}</span>
              <button
                type="button"
                disabled={data.pagination.page >= data.pagination.totalPages}
                onClick={() => updateQuery({ page: data.pagination.page + 1 })}
                aria-label={isId ? "Halaman berikutnya" : "Next page"}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <select
              value={data.pagination.limit}
              onChange={(event) => updateQuery({ limit: event.target.value, page: 1 })}
              aria-label={isId ? "Jumlah produk per halaman" : "Products per page"}
            >
              <option value="10">{isId ? "10 / halaman" : "10 / page"}</option>
              <option value="20">{isId ? "20 / halaman" : "20 / page"}</option>
              <option value="50">{isId ? "50 / halaman" : "50 / page"}</option>
            </select>
          </footer>
        ) : null}
      </section>
    </div>
  );
}
