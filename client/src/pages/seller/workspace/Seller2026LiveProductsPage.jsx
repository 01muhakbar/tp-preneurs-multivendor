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
import "../../../features/sellerWorkspace2026/Seller2026Products.css";

const SELLER_PRODUCTS_I18N = {
  id: {
    title: "Produk",
    subtitle: "Kelola katalog dan ketersediaan produk toko Anda.",
    export: "Ekspor",
    exporting: "Mengekspor...",
    import: "Impor",
    importDisabled: "Impor belum diaktifkan di ruang kerja ini",
    bulkActions: "Aksi Massal",
    bulkDisabled: "Pilih produk terlebih dahulu",
    delete: "Hapus",
    addProduct: "Tambah Produk",
    kpiTotal: "Total Produk",
    kpiTotalNote: "Semua produk",
    kpiLive: "Aktif",
    kpiLiveNote: "Tampil di etalase",
    kpiDrafts: "Draf",
    kpiDraftsNote: "Belum diterbitkan",
    kpiReview: "Antrean Tinjauan",
    kpiReviewNote: "Menunggu tinjauan",
    searchPlaceholder: "Cari nama produk, SKU, atau slug...",
    allCategories: "Semua Kategori",
    allStatus: "Semua Status",
    allStock: "Semua Stok",
    inStock: "Tersedia",
    lowStock: "Stok Rendah",
    outOfStock: "Stok Habis",
    reset: "Reset",
    listView: "Tampilan Daftar",
    gridView: "Tampilan Kisi",
    thProduct: "Produk",
    thCategory: "Kategori",
    thPrice: "Harga",
    thStock: "Stok",
    thVisibility: "Visibilitas",
    thReviewStatus: "Status Tinjauan",
    thPublish: "Publikasi",
    thActions: "Aksi",
    visible: "Tampil",
    blocked: "Ditahan",
    hidden: "Tersembunyi",
    approved: "Disetujui",
    pendingReview: "Menunggu Tinjauan",
    needsRevision: "Perlu Revisi",
    notSubmitted: "Belum Diajukan",
    active: "Aktif",
    draft: "Draf",
    submitted: "Diajukan",
    inactive: "Nonaktif",
    previewProduct: "Pratinjau Produk",
    editProduct: "Edit Produk",
    viewDetails: "Lihat Detail",
    deleteProduct: "Hapus Produk",
    confirmDeleteTitle: "Konfirmasi Hapus Produk",
    confirmDeleteMsg: "Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.",
    confirmDeleteBulkMsg: "Apakah Anda yakin ingin menghapus {count} produk terpilih? Tindakan ini tidak dapat dibatalkan.",
    cancel: "Batal",
    confirmDeleteBtn: "Ya, Hapus",
    deleting: "Menghapus...",
    deleteSuccess: "Produk berhasil dihapus.",
    deleteBulkSuccess: "{count} produk berhasil dihapus.",
    deleteFailed: "Gagal menghapus produk.",
    visibilitySuccessHidden: "{name} sekarang disembunyikan dari etalase.",
    visibilitySuccessVisible: "{name} sekarang dipublikasikan ke etalase.",
    visibilityFailed: "Gagal memperbarui visibilitas produk.",
    noProductsTitle: "Belum Ada Produk",
    noProductsDesc: "Mulai tambahkan produk pertama Anda untuk mulai berjualan.",
    paginationShowing: "Menampilkan {{start}} - {{end}} dari {{total}} produk",
    pageOf: "dari {{total}}",
    perPage: "{{count}} / halaman",
    storeInactiveNotice: "Toko Anda berstatus Inactive. Produk yang diterbitkan otomatis tampil setelah aktivasi toko disetujui Admin.",
    curationNotice: "Produk yang diterbitkan sedang menunggu tinjauan kurasi Admin atau revisi.",
    viewStoreProfile: "Profil Toko",
    catalogStatus: "Status Katalog",
    selectAll: "Pilih semua produk",
    unpublishTitle: "Sembunyikan produk dari etalase",
    publishTitle: "Publikasikan produk ke etalase",
  },
  en: {
    title: "Products",
    subtitle: "Manage your product catalog and availability.",
    export: "Export",
    exporting: "Exporting...",
    import: "Import",
    importDisabled: "Import is not enabled in this workspace",
    bulkActions: "Bulk Actions",
    bulkDisabled: "Select products first",
    delete: "Delete",
    addProduct: "Add Product",
    kpiTotal: "Total Products",
    kpiTotalNote: "All products",
    kpiLive: "Live",
    kpiLiveNote: "Storefront visible",
    kpiDrafts: "Drafts",
    kpiDraftsNote: "Unpublished",
    kpiReview: "Review Queue",
    kpiReviewNote: "Awaiting review",
    searchPlaceholder: "Search by name, SKU, or slug...",
    allCategories: "All Categories",
    allStatus: "All Status",
    allStock: "All Stock",
    inStock: "In Stock",
    lowStock: "Low Stock",
    outOfStock: "Out of Stock",
    reset: "Reset",
    listView: "List View",
    gridView: "Grid View",
    thProduct: "Product",
    thCategory: "Category",
    thPrice: "Price",
    thStock: "Stock",
    thVisibility: "Visibility",
    thReviewStatus: "Review Status",
    thPublish: "Publish",
    thActions: "Actions",
    visible: "Visible",
    blocked: "Blocked",
    hidden: "Hidden",
    approved: "Approved",
    pendingReview: "Pending Review",
    needsRevision: "Needs Revision",
    notSubmitted: "Not Submitted",
    active: "Active",
    draft: "Draft",
    submitted: "Submitted",
    inactive: "Inactive",
    previewProduct: "Preview Product",
    editProduct: "Edit Product",
    viewDetails: "View Details",
    deleteProduct: "Delete Product",
    confirmDeleteTitle: "Confirm Product Deletion",
    confirmDeleteMsg: "Are you sure you want to delete this product? This action cannot be undone.",
    confirmDeleteBulkMsg: "Are you sure you want to delete {count} selected products? This action cannot be undone.",
    cancel: "Cancel",
    confirmDeleteBtn: "Yes, Delete",
    deleting: "Deleting...",
    deleteSuccess: "Product deleted successfully.",
    deleteBulkSuccess: "{count} products deleted successfully.",
    deleteFailed: "Failed to delete product.",
    visibilitySuccessHidden: "{name} is now hidden from the storefront.",
    visibilitySuccessVisible: "{name} is now published to the storefront.",
    visibilityFailed: "Unable to update product visibility.",
    noProductsTitle: "No Products Found",
    noProductsDesc: "Start adding your first product to begin selling.",
    paginationShowing: "Showing {{start}} - {{end}} of {{total}} products",
    pageOf: "of {{total}}",
    perPage: "{{count}} / page",
    storeInactiveNotice: "Your store is currently inactive. Published products will appear once store is activated by Admin.",
    curationNotice: "Published products are hidden pending Admin curation or revision.",
    viewStoreProfile: "Store Profile",
    catalogStatus: "Catalog Status",
    selectAll: "Select all products",
    unpublishTitle: "Unpublish product from storefront",
    publishTitle: "Publish product to storefront",
  },
};

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
  const submissionStatus = String(product?.submissionStatus || "none").toLowerCase();
  if (submissionStatus === "submitted" || submissionStatus === "review_queue") {
    return isId ? "Menunggu Tinjauan" : "Pending Review";
  }
  if (submissionStatus === "needs_revision") {
    return isId ? "Perlu Revisi" : "Needs Revision";
  }
  if (product?.status === "active") {
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
    case "All Categories": return "Semua Kategori";
    case "All Status": return "Semua Status";
    case "Draft": return "Draf";
    case "Review Queue": return "Antrean Tinjauan";
    case "Submitted for Review": return "Diajukan untuk Tinjauan";
    case "Active": return "Aktif";
    case "Needs Revision": return "Perlu Revisi";
    case "Inactive": return "Nonaktif";
    default: return label;
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
          background: "linear-gradient(135deg, rgba(3, 76, 133, 0.1), rgba(3, 76, 133, 0.2))",
          color: "#034c85",
          borderRadius: "8px",
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
      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
    />
  );
}

export default function Seller2026LiveProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes, isId: outletIsId = false } = useSellerWorkspaceRoute();
  const { i18n } = useTranslation();
  const isId = Boolean(outletIsId || String(i18n.language || "").toLowerCase().startsWith("id"));
  const t = isId ? SELLER_PRODUCTS_I18N.id : SELLER_PRODUCTS_I18N.en;

  const [, setTick] = useState(0);
  useEffect(() => {
    const onLanguageChange = () => setTick((v) => v + 1);
    i18n.on("languageChanged", onLanguageChange);
    window.addEventListener("languagechange", onLanguageChange);
    return () => {
      i18n.off("languageChanged", onLanguageChange);
      window.removeEventListener("languagechange", onLanguageChange);
    };
  }, [i18n]);

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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
          ? t.visibilitySuccessHidden.replace("{name}", product.name)
          : t.visibilitySuccessVisible.replace("{name}", product.name),
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: toErrorMessage(error, t.visibilityFailed),
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setNotice(null);
    try {
      if (deleteTarget.ids) {
        for (const id of deleteTarget.ids) {
          await productsQuery.deleteProduct(id);
        }
        setSelected([]);
        setNotice({
          type: "success",
          text: t.deleteBulkSuccess.replace("{count}", String(deleteTarget.ids.length)),
        });
      } else if (deleteTarget.id) {
        await productsQuery.deleteProduct(deleteTarget.id);
        setSelected((prev) => prev.filter((id) => id !== deleteTarget.id));
        setNotice({
          type: "success",
          text: t.deleteSuccess,
        });
      }
      setDeleteTarget(null);
    } catch (err) {
      setNotice({
        type: "error",
        text: toErrorMessage(err, t.deleteFailed),
      });
    } finally {
      setIsDeleting(false);
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
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="seller2026-products__actions">
          <button onClick={handleExport} disabled={exporting}>
            <Download size={16} />
            {exporting ? t.exporting : t.export}
          </button>
          <button disabled title={t.importDisabled}>
            <Upload size={16} />
            {t.import}
          </button>
          <button
            disabled={!selected.length}
            title={selected.length ? (isId ? "Aksi massal tersedia" : "Bulk actions available") : t.bulkDisabled}
          >
            <Archive size={16} />
            {t.bulkActions}
          </button>
          <button
            className="is-danger"
            disabled={!selected.length || !data.permissions.canDelete || isDeleting}
            onClick={() => {
              if (selected.length > 0) {
                setDeleteTarget({ ids: selected, count: selected.length });
              }
            }}
            title={selected.length ? (isId ? "Hapus produk terpilih" : "Delete selected products") : t.bulkDisabled}
          >
            <Trash2 size={16} />
            {isDeleting ? t.deleting : t.delete}
          </button>
          {data.permissions.canCreate ? (
            <Link className="is-primary" to={workspaceRoutes.productCreate()}>
              <Plus size={16} />
              {t.addProduct}
            </Link>
          ) : null}
        </div>
      </header>

      <section className="seller2026-product-kpis">
        {[
          [t.kpiTotal, data.summary.total, t.kpiTotalNote, Box, "blue"],
          [t.kpiLive, data.summary.storefrontVisible, t.kpiLiveNote, CheckCircle2, "green"],
          [t.kpiDrafts, data.summary.draft, t.kpiDraftsNote, FileClock, "amber"],
          [t.kpiReview, data.summary.pendingReview, t.kpiReviewNote, ShieldCheck, "navy"],
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
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={18} style={{ color: "#fe6f05", flexShrink: 0 }} />
            <span>
              {isStoreInactive ? t.storeInactiveNotice : t.curationNotice}
            </span>
          </div>
          {isStoreInactive ? (
            <Link
              to={workspaceRoutes.storeProfile ? workspaceRoutes.storeProfile() : `/seller/stores/${sellerContext?.storeSlug || "sweet-flower"}/store-profile`}
              style={{
                background: "#034c85",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: "8px",
                fontWeight: 650,
                textDecoration: "none",
                fontSize: "12.5px",
                whiteSpace: "nowrap",
              }}
            >
              {t.viewStoreProfile}
            </Link>
          ) : (
            <Link
              to={workspaceRoutes.catalog ? workspaceRoutes.catalog() : `/seller/stores/${sellerContext?.storeSlug || "sweet-flower"}/catalog/products`}
              style={{
                background: "#034c85",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: "8px",
                fontWeight: 650,
                textDecoration: "none",
                fontSize: "12.5px",
                whiteSpace: "nowrap",
              }}
            >
              {t.catalogStatus}
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
              placeholder={t.searchPlaceholder}
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
            <option value="all">{t.allStock}</option>
            <option value="in_stock">{t.inStock}</option>
            <option value="low_stock">{t.lowStock}</option>
            <option value="out_of_stock">{t.outOfStock}</option>
          </select>
          <button type="button" onClick={() => setSearchParams({})}>
            <RefreshCw size={16} />
            {t.reset}
          </button>
          <div className="seller2026-products__view">
            <button
              type="button"
              className={view === "list" ? "is-active" : ""}
              onClick={() => setView("list")}
              aria-label={t.listView}
              title={t.listView}
            >
              <List size={17} />
            </button>
            <button
              type="button"
              className={view === "grid" ? "is-active" : ""}
              onClick={() => setView("grid")}
              aria-label={t.gridView}
              title={t.gridView}
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
                  ? (isId ? "Anda tidak memiliki izin publikasi" : "You do not have publish permission")
                  : reviewLocked
                    ? (isId ? "Menunggu proses kurasi Admin" : "Awaiting Admin review")
                    : product.status !== "active"
                      ? (isId ? "Perlu persetujuan Admin sebelum publikasi" : "Admin approval required")
                      : product.isPublished
                        ? t.unpublishTitle
                        : t.publishTitle;

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
                      <small style={{ color: "var(--prod-muted)", fontSize: "11.5px" }}>{product.sku || product.slug}</small>

                      <div className="seller2026-product-card__price-row">
                        {product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.price) ? (
                          <>
                            <strong style={{ color: "#fe6f05", fontSize: "15px", fontWeight: 750 }}>
                              {currency(product.salePrice)}
                            </strong>
                            <span style={{ textDecoration: "line-through", color: "var(--prod-muted)", fontSize: "12px" }}>
                              {currency(product.price)}
                            </span>
                          </>
                        ) : (
                          <strong style={{ fontSize: "15px", fontWeight: 700, color: "var(--prod-text)" }}>
                            {currency(product.price)}
                          </strong>
                        )}
                      </div>

                      <div className="seller2026-product-card__stock-row">
                        <span style={{ fontSize: "12.5px", color: "var(--prod-muted)" }}>{isId ? "Stok:" : "Stock:"}</span>
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
                        <small style={{ fontSize: "12px", color: "var(--prod-muted)", fontWeight: 500 }}>
                          {product.isPublished ? (isId ? "Etalase" : "Live") : (isId ? "Nonaktif" : "Off")}
                        </small>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Link
                          className="seller2026-icon-button"
                          to={workspaceRoutes.productDetail(product.id)}
                          title={t.previewProduct}
                          aria-label={isId ? `Pratinjau ${product.name}` : `Preview ${product.name}`}
                        >
                          <Eye size={15} />
                        </Link>
                        {data.permissions.canUpdate ? (
                          <Link
                            className="seller2026-icon-button"
                            to={workspaceRoutes.productEdit(product.id)}
                            title={t.editProduct}
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
                    aria-label={t.selectAll}
                  />
                  <span>{t.thProduct}</span>
                  <span>{t.thCategory}</span>
                  <span>{t.thPrice}</span>
                  <span>{t.thStock}</span>
                  <span>{t.thVisibility}</span>
                  <span>{t.thReviewStatus}</span>
                  <span style={{ textAlign: "center" }}>{t.thPublish}</span>
                  <span style={{ textAlign: "right" }}>{t.thActions}</span>
                </div>
                {visibleProducts.map((product) => {
                  const inventory = inventoryLabel(product.stock, isId);
                  const visibility = product.visibility === "storefront_visible"
                    ? t.visible
                    : product.visibility === "published_blocked"
                      ? t.blocked
                      : t.hidden;
                  const review = reviewStatusLabel(product, isId);
                  const reviewLocked = product.submissionStatus === "submitted" || product.submissionStatus === "needs_revision";
                  const publishDisabled = !data.permissions.canPublish || product.status !== "active" || reviewLocked || productsQuery.isPublishing;
                  const publishTitle = !data.permissions.canPublish
                    ? (isId ? "Anda tidak memiliki izin publikasi" : "You do not have publish permission")
                    : reviewLocked
                      ? (isId ? "Menunggu proses kurasi Admin" : "Awaiting Admin review")
                      : product.status !== "active"
                        ? (isId ? "Perlu persetujuan Admin sebelum publikasi" : "Admin approval required")
                        : product.isPublished
                          ? t.unpublishTitle
                          : t.publishTitle;

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

                      <div className="seller2026-product-row__cell" data-label={t.thCategory}>
                        <span className="seller2026-product-row__val">{product.category || "-"}</span>
                      </div>

                      <div className="seller2026-product-row__cell" data-label={t.thPrice}>
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

                      <div className="seller2026-product-row__cell" data-label={t.thStock}>
                        <div className="seller2026-stock-group">
                          <strong className="seller2026-stock-qty">{product.stock ?? 0}</strong>
                          <Pill>{inventory}</Pill>
                        </div>
                      </div>

                      <div
                        className="seller2026-product-row__cell"
                        data-label={t.thVisibility}
                        title={
                          product.visibility === "published_blocked"
                            ? isStoreInactive
                              ? t.storeInactiveNotice
                              : t.curationNotice
                            : undefined
                        }
                      >
                        <Pill>{visibility}</Pill>
                      </div>

                      <div className="seller2026-product-row__cell" data-label={t.thReviewStatus}>
                        <Pill>{review}</Pill>
                      </div>

                      <div className="seller2026-product-row__cell seller2026-product-row__cell--center" data-label={t.thPublish}>
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
                          title={t.previewProduct}
                          aria-label={isId ? `Pratinjau ${product.name}` : `Preview ${product.name}`}
                        >
                          <Eye size={16} />
                        </Link>
                        {data.permissions.canUpdate ? (
                          <Link
                            className="seller2026-icon-button"
                            to={workspaceRoutes.productEdit(product.id)}
                            title={t.editProduct}
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
                                {t.viewDetails}
                              </Link>
                              {data.permissions.canUpdate ? (
                                <Link
                                  to={workspaceRoutes.productEdit(product.id)}
                                  onClick={() => setActiveMenuId(null)}
                                >
                                  <Pencil size={14} />
                                  {t.editProduct}
                                </Link>
                              ) : null}
                              {data.permissions.canDelete ? (
                                <button
                                  type="button"
                                  className="is-delete"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setDeleteTarget({ id: product.id, name: product.name });
                                  }}
                                >
                                  <Trash2 size={14} />
                                  {t.deleteProduct}
                                </button>
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
            <PackagePlus size={44} />
            <h2>{t.noProductsTitle}</h2>
            <p>{t.noProductsDesc}</p>
            {data.permissions.canCreate ? (
              <Link to={workspaceRoutes.productCreate()}>{t.addProduct}</Link>
            ) : null}
          </div>
        )}

        {data.pagination.total ? (
          <footer className="seller2026-products__pagination">
            <span>
              {t.paginationShowing
                .replace("{{start}}", String(start))
                .replace("{{end}}", String(end))
                .replace("{{total}}", String(data.pagination.total))}
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
              <span>{t.pageOf.replace("{{total}}", String(data.pagination.totalPages))}</span>
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
              <option value="10">{t.perPage.replace("{{count}}", "10")}</option>
              <option value="20">{t.perPage.replace("{{count}}", "20")}</option>
              <option value="50">{t.perPage.replace("{{count}}", "50")}</option>
            </select>
          </footer>
        ) : null}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteTarget ? (
        <div className="seller2026-confirm-overlay" onClick={() => !isDeleting && setDeleteTarget(null)}>
          <div className="seller2026-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="seller2026-confirm-dialog__header">
              <AlertTriangle size={22} />
              <h3>{t.confirmDeleteTitle}</h3>
            </div>
            <div className="seller2026-confirm-dialog__body">
              <p>
                {deleteTarget.ids
                  ? t.confirmDeleteBulkMsg.replace("{count}", String(deleteTarget.ids.length))
                  : t.confirmDeleteMsg}
              </p>
            </div>
            <div className="seller2026-confirm-dialog__footer">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="is-delete"
                disabled={isDeleting}
                onClick={confirmDelete}
              >
                {isDeleting ? t.deleting : t.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
