import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  FolderTree,
  Layers,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { useSellerShowcases } from "../../../hooks/seller2026/useSellerShowcases.ts";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import { resolveProductImageUrl } from "../../../utils/productImage.js";
import { formatCurrency } from "../../../utils/format.js";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import "../../../features/sellerWorkspace2026/SellerWorkspace2026.css";

function Pill({ tone = "neutral", children }) {
  return <span className={`seller2026-category-pill is-${tone}`}>{children}</span>;
}

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
    ? (isId ? "Perbarui nama, deskripsi, dan produk dalam etalase ini." : "Update showcase name, description, and assigned products.")
    : (isId ? "Buat pengelompokan produk baru untuk memikat pembeli." : "Create a new product showcase to organize your storefront.");
  const actionLabel = isEdit
    ? (isId ? "Simpan Perubahan" : "Save Changes")
    : (isId ? "Simpan Etalase" : "Create Showcase");

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
    <div className="seller2026-category-modal" role="dialog" aria-modal="true" aria-labelledby="showcase-modal-title">
      <button className="seller2026-category-modal__backdrop" type="button" aria-label="Close modal" onClick={onClose} />
      <form
        className="seller2026-category-modal__panel"
        style={{ maxWidth: "680px", width: "95vw" }}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <header>
          <div>
            <h2 id="showcase-modal-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="seller2026-category-form" style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "4px" }}>
          <label>
            <span>{isId ? "Nama Etalase *" : "Showcase Name *"}</span>
            <input
              type="text"
              required
              placeholder={isId ? "Contoh: Aneka Keripik Gurih, Best Seller, Paket Hemat" : "e.g. Best Sellers, Crispy Snacks"}
              value={form.name || ""}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </label>

          <label>
            <span>{isId ? "Deskripsi Singkat (Opsional)" : "Short Description (Optional)"}</span>
            <input
              type="text"
              placeholder={isId ? "Jelaskan keistimewaan koleksi produk ini..." : "Describe this collection..."}
              value={form.description || ""}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </label>

          {/* Product Checklist Section */}
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--seller2026-text, #fff)" }}>
                {isId ? "Pilih Produk untuk Etalase Ini" : "Select Products for this Showcase"}
                <span style={{ marginLeft: "6px", color: "var(--seller2026-primary, #3b82f6)", fontWeight: 700 }}>
                  ({selectedIds.size} {isId ? "produk terpilih" : "products selected"})
                </span>
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={selectAllProducts}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#38bdf8",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {isId ? "Pilih Semua" : "Select All"}
                </button>
                <span style={{ color: "#64748b" }}>•</span>
                <button
                  type="button"
                  onClick={clearAllProducts}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {isId ? "Kosongkan" : "Clear"}
                </button>
              </div>
            </div>

            {storeProducts.length > 5 && (
              <div style={{ position: "relative", marginBottom: "0.5rem" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                <input
                  type="text"
                  placeholder={isId ? "Cari produk toko..." : "Search products..."}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 10px 6px 30px",
                    fontSize: "0.8rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.2)",
                    color: "inherit",
                  }}
                />
              </div>
            )}

            <div
              style={{
                maxHeight: "220px",
                overflowY: "auto",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                padding: "6px",
                background: "rgba(15, 23, 42, 0.4)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {filteredStoreProducts.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
                  {storeProducts.length === 0
                    ? (isId ? "Toko Anda belum memiliki produk aktif." : "No active products in your store.")
                    : (isId ? "Tidak ada produk yang cocok dengan pencarian." : "No matching products found.")}
                </div>
              ) : (
                filteredStoreProducts.map((product) => {
                  const pId = Number(product.id);
                  const isChecked = selectedIds.has(pId);
                  const imageUrl = resolveProductImageUrl(product);
                  const price = Number(product.price ?? product.salePrice ?? 0);

                  return (
                    <label
                      key={pId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        background: isChecked ? "rgba(59, 130, 246, 0.12)" : "transparent",
                        border: isChecked ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid transparent",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProduct(pId)}
                        style={{ cursor: "pointer", width: "16px", height: "16px" }}
                      />
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          background: "#1e293b",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {imageUrl ? (
                          <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <Package size={16} color="#64748b" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {product.name || product.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          {formatCurrency(price)}
                          {product.stock != null && <span> · Stok: {product.stock}</span>}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "1rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.isActive !== false}
              onChange={(e) => onChange({ isActive: e.target.checked })}
              style={{ width: "18px", height: "18px" }}
            />
            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {isId ? "Tampilkan Etalase di Halaman Toko" : "Display Showcase on Storefront"}
            </span>
          </label>
        </div>

        <footer>
          <button type="button" onClick={onClose}>
            {isId ? "Batal" : "Cancel"}
          </button>
          <button type="submit" className="is-primary" disabled={isSubmitting || !form.name?.trim()}>
            {isSubmitting ? (isId ? "Menyimpan..." : "Saving...") : actionLabel}
          </button>
        </footer>
      </form>
    </div>
  );
}

export default function Seller2026LiveCategoriesPage({ initialCreateOpen = false }) {
  const { workspaceStoreId: storeId, workspaceRoutes, isId: outletIsId = false } = useSellerWorkspaceRoute();
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isId = Boolean(outletIsId || String(i18n.language || "").toLowerCase().startsWith("id"));

  const {
    showcases,
    allShowcases,
    storeProducts,
    stats,
    filters,
    setFilters,
    isLoading,
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
  const [activeMenuId, setActiveMenuId] = useState(null);

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
          text: isId ? "Etalase toko baru berhasil dibuat" : "New showcase created successfully",
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

  const summaryCards = [
    [isId ? "Total Etalase" : "Total Showcases", stats.total, Layers, "blue"],
    [isId ? "Etalase Aktif" : "Active Showcases", stats.active, Check, "green"],
    [isId ? "Produk Masuk Etalase" : "Curated Products", stats.totalAssigned, Sparkles, "mint"],
    [isId ? "Produk Tanpa Etalase" : "Uncategorized", stats.unassigned, Package, "orange"],
  ];

  return (
    <div className="seller2026-categories">
      <header className="seller2026-categories-header">
        <div>
          <h1>{isId ? "Etalase Toko" : "Store Showcases"}</h1>
          <p>
            {isId
              ? "Kelola pengelompokan produk khusus untuk beranda dan etalase toko Anda agar pembeli mudah berbelanja."
              : "Organize products into curated showcases and collections for your storefront visitors."}
          </p>
        </div>
        <div className="seller2026-categories-actions">
          <button className="is-primary" onClick={openCreate}>
            <Plus size={17} />
            {isId ? "Tambah Etalase" : "Add Showcase"}
          </button>
        </div>
      </header>

      {notice && (
        <div className={`seller2026-profile__notice seller2026-profile__notice--${notice.type}`}>
          {notice.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          {notice.text}
        </div>
      )}

      {/* KPI Cards */}
      <section className="seller2026-categories-summary">
        {summaryCards.map(([label, value, IconComponent, tone]) => (
          <article key={label}>
            <span className={`is-${tone}`}>
              <IconComponent size={23} />
            </span>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </section>

      {/* Table Section */}
      <section className="seller2026-categories-table">
        <div className="seller2026-categories-toolbar">
          <label>
            <Search size={17} />
            <input
              placeholder={isId ? "Cari etalase toko..." : "Search showcases..."}
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </label>
          <span>{isId ? "Status" : "Status"}</span>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="all">{isId ? "Semua Status" : "All Status"}</option>
            <option value="active">{isId ? "Aktif" : "Active"}</option>
            <option value="inactive">{isId ? "Nonaktif" : "Inactive"}</option>
          </select>
          <button
            type="button"
            onClick={() => setFilters({ search: "", status: "all" })}
            title={isId ? "Reset filter" : "Reset filter"}
          >
            <RotateCcw size={16} />
            {isId ? "Atur Ulang" : "Reset"}
          </button>
        </div>

        {showcases.length === 0 ? (
          <div className="seller2026-categories-empty">
            <Layers size={36} color="#64748b" />
            <h2>{isId ? "Belum ada etalase toko" : "No showcases yet"}</h2>
            <p>
              {isId
                ? "Etalase toko mempermudah pembeli menemukan produk favorit Anda (misal: 'Best Seller', 'Aneka Keripik', 'Promo Kampus')."
                : "Create showcases to help buyers navigate your products by themes and collections."}
            </p>
            <button type="button" onClick={openCreate} className="is-primary">
              <Plus size={16} />
              {isId ? "Tambah Etalase Pertama" : "Create First Showcase"}
            </button>
          </div>
        ) : (
          <>
            <div className="seller2026-categories-grid seller2026-categories-grid--head">
              <span>#</span>
              <span>{isId ? "Nama Etalase" : "Showcase Name"}</span>
              <span>{isId ? "Deskripsi" : "Description"}</span>
              <span>{isId ? "Jumlah Produk" : "Products"}</span>
              <span>{isId ? "Status Tampil" : "Visibility"}</span>
              <span>{isId ? "Aksi" : "Actions"}</span>
            </div>

            <div className="seller2026-categories-grid seller2026-categories-grid--body">
              {showcases.map((sc, idx) => (
                <article className="seller2026-category-row" key={sc.id}>
                  <div style={{ color: "#64748b", fontWeight: 700, paddingLeft: "8px" }}>
                    {idx + 1}
                  </div>

                  <div className="seller2026-category-row__identity" data-label={isId ? "Nama Etalase" : "Showcase"}>
                    <span className="seller2026-category-icon is-blue">
                      <FolderTree size={18} />
                    </span>
                    <div>
                      <strong
                        className="is-clickable"
                        onClick={() => openEdit(sc)}
                        title={isId ? "Klik untuk mengedit etalase" : "Click to edit"}
                      >
                        {sc.name}
                      </strong>
                      <small style={{ color: "#64748b" }}>slug: {sc.slug}</small>
                    </div>
                  </div>

                  <div data-label={isId ? "Deskripsi" : "Description"} style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                    {sc.description || "-"}
                  </div>

                  <div data-label={isId ? "Jumlah Produk" : "Products"}>
                    <Pill tone={sc.productCount > 0 ? "mint" : "orange"}>
                      <Package size={12} style={{ marginRight: "4px" }} />
                      {sc.productCount} {isId ? "Produk" : "Items"}
                    </Pill>
                  </div>

                  <div data-label={isId ? "Status" : "Status"} className="seller2026-category-row__status">
                    <Pill tone={sc.isActive ? "green" : "slate"}>
                      {sc.isActive ? (isId ? "Aktif di Toko" : "Active") : (isId ? "Disembunyikan" : "Hidden")}
                    </Pill>
                  </div>

                  <div className="seller2026-category-row__menu" data-label={isId ? "Aksi" : "Actions"}>
                    <button
                      type="button"
                      aria-label="Actions"
                      onClick={() => setActiveMenuId(activeMenuId === sc.id ? null : sc.id)}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeMenuId === sc.id && (
                      <div
                        style={{
                          display: "block",
                          position: "absolute",
                          right: 0,
                          top: "100%",
                          zIndex: 40,
                          background: "#0f172a",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "10px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                          padding: "6px",
                          minWidth: "160px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            openEdit(sc);
                          }}
                        >
                          <Pencil size={14} />
                          {isId ? "Edit Etalase" : "Edit Showcase"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            handleToggleActive(sc);
                          }}
                        >
                          {sc.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                          {sc.isActive
                            ? (isId ? "Sembunyikan" : "Hide")
                            : (isId ? "Tampilkan di Toko" : "Show on Store")}
                        </button>
                        <button
                          type="button"
                          style={{ color: "#ef4444" }}
                          onClick={() => {
                            setActiveMenuId(null);
                            handleDelete(sc);
                          }}
                        >
                          <Trash2 size={14} />
                          {isId ? "Hapus Etalase" : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Add / Edit Modal */}
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
