import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderTree,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useSellerShowcases } from "../../../hooks/seller2026/useSellerShowcases.ts";
import { resolveProductImageUrl } from "../../../utils/productImage.js";
import { formatCurrency } from "../../../utils/format.js";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import "./Seller2026LiveCategoriesPage.css";

function ShowcaseModal({
  open,
  mode,
  form,
  storeProducts = [],
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  isId = true,
}) {
  const [productSearch, setProductSearch] = useState("");

  if (!open) return null;
  const isEdit = mode === "edit";
  const title = isEdit
    ? (isId ? "Edit Etalase Toko" : "Edit Store Showcase")
    : (isId ? "Tambah Etalase Baru" : "Add New Showcase");
  const subtitle = isEdit
    ? (isId ? "Perbarui nama, deskripsi, dan produk di etalase ini." : "Update showcase details and assigned products.")
    : (isId ? "Atur kelompok produk khusus untuk memikat pembeli di toko Anda." : "Create a curated collection for your storefront.");
  const actionLabel = isEdit
    ? (isId ? "Simpan Perubahan" : "Save Changes")
    : (isId ? "Simpan Etalase" : "Save Showcase");

  const selectedIds = new Set(form.productIds || []);

  const toggleProduct = (productId) => {
    const next = new Set(selectedIds);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    onChange({ productIds: Array.from(next) });
  };

  const selectAllProducts = () => {
    const allIds = storeProducts.map((p) => Number(p.id));
    onChange({ productIds: allIds });
  };

  const clearAllProducts = () => {
    onChange({ productIds: [] });
  };

  const filteredStoreProducts = storeProducts.filter((p) => {
    if (!productSearch.trim()) return true;
    const name = String(p.name || p.title || "").toLowerCase();
    return name.includes(productSearch.toLowerCase().trim());
  });

  return (
    <div className="seller2026-showcase-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="showcase-modal-title">
      <div className="seller2026-showcase-modal-panel">
        <header className="seller2026-modal-header">
          <div className="seller2026-modal-header-info">
            <h2 id="showcase-modal-title" className="seller2026-modal-title">{title}</h2>
            <p className="seller2026-modal-subtitle">{subtitle}</p>
          </div>
          <button type="button" className="seller2026-modal-btn-close" onClick={onClose} aria-label={isId ? "Tutup" : "Close"}>
            <X size={18} />
          </button>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          <div className="seller2026-modal-body">
            {/* Showcase Name */}
            <div className="seller2026-form-group">
              <label htmlFor="showcase-name-input" className="seller2026-form-label">
                <span>{isId ? "Nama Etalase *" : "Showcase Name *"}</span>
              </label>
              <input
                id="showcase-name-input"
                type="text"
                required
                className="seller2026-form-input"
                placeholder={isId ? "Contoh: Best Seller, Cemilan Renyah, Paket Hemat" : "e.g. Best Sellers, Crispy Snacks"}
                value={form.name || ""}
                onChange={(e) => onChange({ name: e.target.value })}
                autoFocus
              />
            </div>

            {/* Showcase Description */}
            <div className="seller2026-form-group">
              <label htmlFor="showcase-desc-input" className="seller2026-form-label">
                <span>{isId ? "Deskripsi Singkat (Opsional)" : "Description (Optional)"}</span>
              </label>
              <input
                id="showcase-desc-input"
                type="text"
                className="seller2026-form-input"
                placeholder={isId ? "Jelaskan keunggulan koleksi produk ini..." : "Brief description of this collection..."}
                value={form.description || ""}
                onChange={(e) => onChange({ description: e.target.value })}
              />
            </div>

            {/* Product Picker Checklist */}
            <div className="seller2026-form-group seller2026-product-picker-group">
              <div className="seller2026-product-picker-header">
                <span className="seller2026-form-label">
                  {isId ? "Pilih Produk" : "Select Products"}
                  <span style={{ marginLeft: "6px", color: "var(--ssc-accent)", fontWeight: 700 }}>
                    ({selectedIds.size} {isId ? "terpilih" : "selected"})
                  </span>
                </span>
                <div className="seller2026-product-picker-actions">
                  <button type="button" className="seller2026-btn-link-action" onClick={selectAllProducts}>
                    {isId ? "Pilih Semua" : "Select All"}
                  </button>
                  <span style={{ color: "var(--ssc-text-muted)", fontSize: "0.75rem" }}>•</span>
                  <button type="button" className="seller2026-btn-link-action" onClick={clearAllProducts} style={{ color: "var(--ssc-text-muted)" }}>
                    {isId ? "Kosongkan" : "Clear"}
                  </button>
                </div>
              </div>

              {storeProducts.length > 2 && (
                <div style={{ position: "relative", marginBottom: "6px" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--ssc-text-muted)" }} />
                  <input
                    type="text"
                    className="seller2026-form-input"
                    style={{ paddingLeft: "30px", fontSize: "0.8rem", padding: "6px 10px 6px 30px" }}
                    placeholder={isId ? "Cari produk toko..." : "Search products..."}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
              )}

              <div className="seller2026-product-picker-list">
                {filteredStoreProducts.length === 0 ? (
                  <div style={{ padding: "1.25rem", textAlign: "center", color: "var(--ssc-text-muted)", fontSize: "0.825rem" }}>
                    {storeProducts.length === 0
                      ? (isId ? "Toko belum memiliki produk aktif." : "No active products in your store.")
                      : (isId ? "Tidak ada produk yang cocok." : "No matching products found.")}
                  </div>
                ) : (
                  filteredStoreProducts.map((product) => {
                    const pId = Number(product.id);
                    const isChecked = selectedIds.has(pId);
                    const imageUrl = resolveProductImageUrl(product);
                    const price = Number(product.price ?? product.salePrice ?? 0);

                    return (
                      <div
                        key={pId}
                        className={`seller2026-product-item-row ${isChecked ? "is-selected" : ""}`}
                        onClick={() => toggleProduct(pId)}
                        role="checkbox"
                        aria-checked={isChecked}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            toggleProduct(pId);
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          className="seller2026-checkbox-custom"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div onClick
                          tabIndex={-1}
                        />
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="seller2026-product-thumb" />
                        ) : (
                          <div className="seller2026-product-thumb">
                            <Package size={18} color="var(--ssc-text-muted)" />
                          </div>
                        )}
                        <div className="seller2026-product-info">
                          <span className="seller2026-product-name" title={product.name || product.title}>
                            {product.name || product.title}
                          </span>
                          <span className="seller2026-product-sub">
                            <strong className="seller2026-product-price">{formatCurrency(price)}</strong>
                            {product.stock != null && (
                              <span className="seller2026-product-stock">· {isId ? "Stok" : "Stock"}: {product.stock}</span>
                            )}
                          </span>
                        </div>
                        {isChecked && (
                          <span className="seller2026-product-selected-check" aria-hidden="true">
                            <Check size={16} />
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Visibility Switch Card (Interactive & Accessible) */}
            <div
              className="seller2026-visibility-card"
              onClick={() => onChange({ isActive: form.isActive === false ? true : false })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onChange({ isActive: form.isActive === false ? true : false });
                }
              }}
            >
              <div className="seller2026-visibility-card-left">
                <div className="seller2026-visibility-card-icon">
                  {form.isActive !== false ? <Eye size={20} /> : <EyeOff size={20} />}
                </div>
                <div>
                  <div className="seller2026-visibility-card-title">
                    {isId ? "Tampilkan Etalase di Halaman Toko" : "Display Showcase on Storefront"}
                  </div>
                  <div className="seller2026-visibility-card-desc">
                    {form.isActive !== false
                      ? (isId ? "Etalase dapat dilihat oleh pengunjung toko Anda." : "Showcase is visible to storefront visitors.")
                      : (isId ? "Etalase disembunyikan sementara dari pembeli." : "Showcase is temporarily hidden from buyers.")}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                className="seller2026-checkbox-custom"
                checked={form.isActive !== false}
                onChange={() => {}} // handled by parent container
                tabIndex={-1}
              />
            </div>
          </div>

          <footer className="seller2026-modal-footer">
            <button type="button" className="seller2026-btn-modal-cancel" onClick={onClose}>
              {isId ? "Batal" : "Cancel"}
            </button>
            <button
              type="submit"
              className="seller2026-btn-cta-orange"
              disabled={isSubmitting || !form.name?.trim()}
            >
              {isSubmitting ? (isId ? "Menyimpan..." : "Saving...") : actionLabel}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default function Seller2026LiveCategoriesPage({ initialCreateOpen = false }) {
  const { workspaceStoreId: storeId, workspaceRoutes, isId: outletIsId, selectedLanguage } = useSellerWorkspaceRoute();
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const isId = Boolean(
    outletIsId !== undefined
      ? outletIsId
      : String(selectedLanguage?.isoCode || "").toLowerCase() === "id" ||
        String(i18n?.language || "").toLowerCase().startsWith("id") ||
        String(localStorage.getItem("seller_language") || "").toLowerCase().includes("id")
  );

  const {
    showcases,
    storeProducts,
    stats,
    filters,
    setFilters,
    createShowcase,
    updateShowcase,
    deleteShowcase,
    toggleActive,
    isMutating,
  } = useSellerShowcases(storeId);

  const [notice, setNotice] = useState(null);
  const [modalOpen, setModalOpen] = useState(initialCreateOpen || location.pathname.endsWith("/categories/new"));
  const [modalMode, setModalMode] = useState("create");
  const [form, setForm] = useState({ name: "", description: "", isActive: true, productIds: [] });

  const openCreate = () => {
    setModalMode("create");
    setForm({ name: "", description: "", isActive: true, productIds: [] });
    setNotice(null);
    setModalOpen(true);
  };

  const openEdit = (showcase) => {
    setModalMode("edit");
    setForm({
      id: showcase.id,
      name: showcase.name,
      description: showcase.description || "",
      isActive: showcase.isActive,
      productIds: showcase.productIds || [],
    });
    setNotice(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    if (location.pathname.endsWith("/categories/new")) {
      navigate(workspaceRoutes.categories(), { replace: true });
    }
  };

  const handleFormSubmit = async () => {
    if (!form.name?.trim()) return;
    try {
      if (modalMode === "edit" && form.id) {
        await updateShowcase({
          id: form.id,
          payload: {
            name: form.name.trim(),
            description: form.description?.trim() || null,
            isActive: form.isActive !== false,
            productIds: form.productIds || [],
          },
        });
        setNotice({
          type: "success",
          text: isId ? "Etalase toko berhasil diperbarui" : "Showcase updated successfully",
        });
      } else {
        await createShowcase({
          name: form.name.trim(),
          description: form.description?.trim() || null,
          isActive: form.isActive !== false,
          productIds: form.productIds || [],
        });
        setNotice({
          type: "success",
          text: isId ? "Etalase baru berhasil dibuat" : "New showcase created successfully",
        });
      }
      closeModal();
    } catch (err) {
      setNotice({
        type: "error",
        text: err?.response?.data?.message || err?.message || (isId ? "Gagal menyimpan etalase" : "Failed to save showcase"),
      });
    }
  };

  const handleToggleActive = async (showcase) => {
    try {
      await toggleActive({ id: showcase.id, isActive: !showcase.isActive });
      setNotice({
        type: "success",
        text: showcase.isActive
          ? (isId ? "Etalase berhasil disembunyikan" : "Showcase hidden")
          : (isId ? "Etalase berhasil diaktifkan" : "Showcase activated"),
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err?.message || (isId ? "Gagal mengubah status" : "Failed to update status"),
      });
    }
  };

  const handleDelete = async (showcase) => {
    if (!window.confirm(isId ? `Apakah Anda yakin ingin menghapus etalase "${showcase.name}"? (Produk tidak akan terhapus).` : `Delete showcase "${showcase.name}"? (Products will not be deleted).`)) {
      return;
    }
    try {
      await deleteShowcase(showcase.id);
      setNotice({
        type: "success",
        text: isId ? "Etalase toko berhasil dihapus" : "Showcase deleted",
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err?.message || (isId ? "Gagal menghapus etalase" : "Failed to delete showcase"),
      });
    }
  };

  const summaryCards = useMemo(
    () => [
      {
        label: isId ? "Total Etalase" : "Total Showcases",
        value: stats.total,
        Icon: FolderTree,
        tone: "blue",
      },
      {
        label: isId ? "Etalase Aktif" : "Active Showcases",
        value: stats.active,
        Icon: CheckCircle2,
        tone: "green",
      },
      {
        label: isId ? "Produk Masuk Etalase" : "Curated Items",
        value: stats.totalAssigned,
        Icon: Sparkles,
        tone: "orange",
      },
      {
        label: isId ? "Tanpa Etalase" : "Unassigned",
        value: stats.unassigned,
        Icon: Package,
        tone: "slate",
      },
    ],
    [isId, stats]
  );

  return (
    <div className="seller2026-categories-container">
      {/* Header */}
      <header className="seller2026-categories-header">
        <div className="seller2026-categories-header-left">
          <div className="seller2026-categories-eyebrow">
            <Sparkles size={13} />
            <span>{isId ? "Katalog Toko" : "Store Catalog"}</span>
          </div>
          <h1 className="seller2026-categories-title">{isId ? "Etalase Toko" : "Store Showcases"}</h1>
          <p className="seller2026-categories-desc">
            {isId
              ? "Kelola etalase produk untuk mengatur tampilan beranda dan memudahkan pembeli berbelanja."
              : "Manage curated collections to organize your storefront and boost buyer navigation."}
          </p>
        </div>
        <div className="seller2026-categories-header-actions">
          <button type="button" className="seller2026-btn-cta-orange" onClick={openCreate}>
            <Plus size={18} />
            <span>{isId ? "Tambah Etalase" : "Add Showcase"}</span>
          </button>
        </div>
      </header>

      {/* Notifications */}
      {notice && (
        <div className={`seller2026-notice-banner seller2026-notice-banner--${notice.type}`}>
          {notice.type === "success" ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <section className="seller2026-kpi-grid">
        {summaryCards.map(({ label, value, Icon, tone }) => (
          <article className="seller2026-kpi-card" key={label}>
            <div className={`seller2026-kpi-icon-wrap is-${tone}`}>
              <Icon size={22} />
            </div>
            <div className="seller2026-kpi-data">
              <span className="seller2026-kpi-label">{label}</span>
              <strong className="seller2026-kpi-value">{value}</strong>
            </div>
          </article>
        ))}
      </section>

      {/* Main Table Card */}
      <section className="seller2026-table-card">
        {/* Toolbar */}
        <div className="seller2026-toolbar">
          <div className="seller2026-toolbar-left">
            <div className="seller2026-search-box">
              <Search size={16} className="seller2026-search-icon" />
              <input
                className="seller2026-search-input"
                placeholder={isId ? "Cari etalase toko..." : "Search showcases..."}
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
            <select
              className="seller2026-select-filter"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="all">{isId ? "Semua Status" : "All Status"}</option>
              <option value="active">{isId ? "Aktif di Toko" : "Active"}</option>
              <option value="inactive">{isId ? "Disembunyikan" : "Hidden"}</option>
            </select>
          </div>
          <div>
            <button
              type="button"
              className="seller2026-btn-reset"
              onClick={() => setFilters({ search: "", status: "all" })}
              title={isId ? "Atur ulang filter" : "Reset filter"}
            >
              <RotateCcw size={14} />
              <span>{isId ? "Atur Ulang" : "Reset"}</span>
            </button>
          </div>
        </div>

        {/* Table Content or Empty State */}
        {showcases.length === 0 ? (
          <div className="seller2026-empty-state">
            <div className="seller2026-empty-icon-wrap">
              <FolderTree size={30} />
            </div>
            <h2 className="seller2026-empty-title">
              {isId ? "Belum Ada Etalase Toko" : "No Store Showcases Yet"}
            </h2>
            <p className="seller2026-empty-text">
              {isId
                ? "Kelompokkan produk Anda ke dalam etalase seperti 'Menu Favorit', 'Produk Baru', atau 'Promo Kampus' agar pembeli lebih mudah menemukan apa yang mereka cari."
                : "Curate your products into collections like 'Best Sellers' or 'New Arrivals' to help buyers find what they want faster."}
            </p>
            <button type="button" className="seller2026-btn-cta-orange" onClick={openCreate}>
              <Plus size={16} />
              <span>{isId ? "Tambah Etalase Pertama" : "Create First Showcase"}</span>
            </button>
          </div>
        ) : (
          <div className="seller2026-table-wrap">
            <table className="seller2026-table">
              <thead>
                <tr>
                  <th style={{ width: "45%" }}>{isId ? "Etalase Toko" : "Store Showcase"}</th>
                  <th style={{ width: "20%" }}>{isId ? "Produk" : "Products"}</th>
                  <th style={{ width: "20%" }}>{isId ? "Status Tampil" : "Visibility"}</th>
                  <th style={{ width: "15%", textAlign: "right" }}>{isId ? "Aksi" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {showcases.map((sc) => (
                  <tr key={sc.id}>
                    <td>
                      <div className="seller2026-td-identity">
                        <div className="seller2026-showcase-icon-badge">
                          <FolderTree size={18} />
                        </div>
                        <div className="seller2026-showcase-meta">
                          <button
                            type="button"
                            className="seller2026-showcase-title-link"
                            onClick={() => openEdit(sc)}
                            title={isId ? "Klik untuk mengedit" : "Click to edit"}
                          >
                            {sc.name}
                          </button>
                          <span className="seller2026-showcase-desc-sub">
                            {sc.description || (isId ? "Tanpa deskripsi" : "No description")}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`seller2026-pill-count ${sc.productCount > 0 ? "has-items" : ""}`}>
                        <Package size={13} />
                        <span>{sc.productCount || 0} {isId ? "Produk" : "Items"}</span>
                      </span>
                    </td>
                    <td>
                      <span className={`seller2026-status-badge ${sc.isActive ? "is-active" : "is-hidden"}`}>
                        <span className="seller2026-status-dot" />
                        <span>
                          {sc.isActive ? (isId ? "Aktif di Toko" : "Active") : (isId ? "Disembunyikan" : "Hidden")}
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="seller2026-actions-cell">
                        <button
                          type="button"
                          className="seller2026-btn-icon-action"
                          onClick={() => openEdit(sc)}
                          title={isId ? "Edit Etalase" : "Edit Showcase"}
                          aria-label={isId ? "Edit Etalase" : "Edit Showcase"}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="seller2026-btn-icon-action"
                          onClick={() => handleToggleActive(sc)}
                          title={sc.isActive ? (isId ? "Sembunyikan" : "Hide") : (isId ? "Tampilkan" : "Show")}
                          aria-label={sc.isActive ? (isId ? "Sembunyikan" : "Hide") : (isId ? "Tampilkan" : "Show")}
                        >
                          {sc.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          type="button"
                          className="seller2026-btn-icon-action is-danger"
                          onClick={() => handleDelete(sc)}
                          title={isId ? "Hapus Etalase" : "Delete Showcase"}
                          aria-label={isId ? "Hapus Etalase" : "Delete Showcase"}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modernized Showcase Modal */}
      <ShowcaseModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        storeProducts={storeProducts}
        onChange={(patch) => setForm((curr) => ({ ...curr, ...patch }))}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        isSubmitting={isMutating}
        isId={isId}
      />
    </div>
  );
}
