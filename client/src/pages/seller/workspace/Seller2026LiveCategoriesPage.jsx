import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
  FolderTree,
  Image as ImageIcon,
  Layers,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import { uploadSellerCategoryImage } from "../../../api/sellerCategories.ts";
import {
  createSeller2026CategoryForm,
  formatSeller2026CategoryDate,
  seller2026CategoryLabels,
  slugifySeller2026Category,
  validateSeller2026CategoryForm,
} from "../../../api/seller2026/categories.adapter.ts";
import { hasSeller2026Permission } from "../../../api/seller2026/permissions.ts";
import { useSeller2026Categories } from "../../../hooks/seller2026/useSeller2026Categories.ts";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../../features/sellerWorkspace2026/SellerWorkspace2026.css";

const toErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

function Pill({ tone = "neutral", children }) {
  return <span className={`seller2026-category-pill is-${tone}`}>{children}</span>;
}

function CategoryIcon({ category }) {
  const imageUrl = resolveAssetUrl(category?.imageUrl || "");
  if (imageUrl) {
    return <img src={imageUrl} alt="" />;
  }
  const palette = ["mint", "blue", "violet", "amber"];
  const tone = palette[Math.abs(Number(category?.numericId || 0)) % palette.length];
  return <span className={`seller2026-category-icon is-${tone}`}><Layers size={19} /></span>;
}

function CategoryModal({
  open,
  mode,
  form,
  errors,
  parentOptions,
  onChange,
  onClose,
  onSubmit,
  onImageUpload,
  isSubmitting,
  isUploading,
  canUpload,
  isId = false,
}) {
  if (!open) return null;
  const isEdit = mode === "edit";
  const title = isEdit ? (isId ? "Edit Kategori" : "Edit Category") : (isId ? "Tambah Kategori" : "Add Category");
  const subtitle = isEdit
    ? (isId ? "Perbarui detail kategori." : "Update category details.")
    : (isId ? "Buat kategori katalog baru." : "Create new catalog category.");
  const actionLabel = isEdit
    ? (isId ? "Simpan Perubahan" : "Save Changes")
    : (isId ? "Tambah Kategori" : "Add Category");
  const imageUrl = resolveAssetUrl(form.imageUrl);

  return (
    <div className="seller2026-category-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
      <button className="seller2026-category-modal__backdrop" type="button" aria-label="Close modal" onClick={onClose} />
      <form className="seller2026-category-modal__panel" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <header>
          <div>
            <h2 id="category-modal-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>

        <div className="seller2026-category-form">
          <label className={errors.name ? "has-error" : ""}>
            <span>{isId ? "Nama Kategori *" : "Category Name *"}</span>
            <input
              value={form.name}
              placeholder={isId ? "Nama kategori..." : "Category name..."}
              onChange={(event) => {
                const name = event.target.value;
                onChange({ name, slug: slugifySeller2026Category(name) });
              }}
            />
            {errors.name ? <small>{errors.name}</small> : null}
          </label>

          <label>
            <span>{isId ? "Kategori Induk" : "Parent Category"}</span>
            <select value={form.parentId} onChange={(event) => onChange({ parentId: event.target.value })}>
              {parentOptions.map((option) => <option value={option.value} key={option.value || "root"}>{option.label}</option>)}
            </select>
          </label>

          <label className={errors.description ? "has-error" : ""}>
            <span>{isId ? "Deskripsi" : "Description"}</span>
            <textarea
              rows={5}
              value={form.description}
              maxLength={160}
              placeholder={isId ? "Deskripsi singkat..." : "Short description..."}
              onChange={(event) => onChange({ description: event.target.value })}
            />
            <em>{form.description.length}/160</em>
            {errors.description ? <small>{errors.description}</small> : null}
          </label>

          <div className="seller2026-category-form__image">
            <span>{isId ? "Gambar" : "Image"}</span>
            <button type="button" disabled={!canUpload || isUploading} onClick={onImageUpload}>
              {imageUrl ? <img src={imageUrl} alt="" /> : <ImageIcon size={24} />}
              <strong>{isUploading ? (isId ? "Mengunggah gambar..." : "Uploading image...") : (isId ? "Unggah gambar" : "Upload an image")}</strong>
              <small>{canUpload ? "PNG, JPG, WEBP (Maks 2MB)" : (isId ? "Belum tersedia" : "Not available")}</small>
            </button>
            {form.imageUrl ? (
              <button
                className="seller2026-category-form__remove"
                type="button"
                onClick={() => window.confirm(isId ? "Hapus gambar ini dari draf?" : "Remove this image from the draft?") && onChange({ imageUrl: "" })}
              >
                {isId ? "Hapus gambar" : "Remove image"}
              </button>
            ) : null}
          </div>

          <label>
            <span>{isId ? "Slug (Tautan)" : "Slug (Handle)"}</span>
            <div className="seller2026-category-form__slug">
              <span>/categories/</span>
              <input
                value={form.slug}
                placeholder={isId ? "tautan-kategori" : "category-handle"}
                onChange={(event) => onChange({ slug: slugifySeller2026Category(event.target.value) })}
              />
            </div>
            <small>{isId ? "Huruf kecil & tanda hubung." : "Lowercase letters and hyphens."}</small>
          </label>

          <div className="seller2026-category-form__visibility">
            <div>
              <strong>{isId ? "Tampilkan di etalase" : "Visible in storefront"}</strong>
              <span>{isId ? "Tampil di katalog pembeli." : "Visible in customer catalog."}</span>
            </div>
            <button
              type="button"
              className={`seller2026-switch${form.isPublished ? " is-on" : ""}`}
              onClick={() => onChange({ isPublished: !form.isPublished })}
            >
              <i />
            </button>
          </div>
        </div>

        <footer>
          <button type="button" onClick={onClose}>{isId ? "Batal" : "Cancel"}</button>
          <button type="submit" className="is-primary" disabled={isSubmitting}>{isSubmitting ? (isId ? "Menyimpan..." : "Saving...") : actionLabel}</button>
        </footer>
      </form>
    </div>
  );
}

export default function Seller2026LiveCategoriesPage() {
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes, isId: outletIsId = false } = useSellerWorkspaceRoute();
  const { i18n } = useTranslation();
  const isId = Boolean(outletIsId || String(i18n.language || "").toLowerCase().startsWith("id"));

  const { can, permissions, sourceAvailable } = getSeller2026PagePermissions(sellerContext);
  const canView = can("CATALOG_CATEGORY_READ");
  const canCreate = !sourceAvailable || hasSeller2026Permission(permissions, "CATALOG_CATEGORY_CREATE");
  const canUpdate = !sourceAvailable || hasSeller2026Permission(permissions, "CATALOG_CATEGORY_UPDATE");
  const canManageStatus = !sourceAvailable || hasSeller2026Permission(permissions, "CATALOG_CATEGORY_STATUS_MANAGE");
  const canArchive = !sourceAvailable || hasSeller2026Permission(permissions, "CATALOG_CATEGORY_DELETE");
  const categories = useSeller2026Categories(storeId, {
    enabled: canView,
    permissions: {
      canEdit: canUpdate,
      canPublish: canManageStatus,
      canUnpublish: canManageStatus,
      canArchive,
    },
  });
  const [notice, setNotice] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(createSeller2026CategoryForm());
  const [formErrors, setFormErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [imageInputKey, setImageInputKey] = useState(0);
  const allPageSelected = categories.categories.length > 0 && categories.categories.every((item) => categories.selectedIds.includes(item.id));

  const inputId = useMemo(() => `seller2026-category-image-${imageInputKey}`, [imageInputKey]);

  const openCreate = () => {
    setModalMode("create");
    setForm(createSeller2026CategoryForm());
    setFormErrors({});
    setNotice(null);
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setModalMode("edit");
    setForm(createSeller2026CategoryForm(category));
    setFormErrors({});
    setNotice(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormErrors({});
  };

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }));

  const submitForm = async () => {
    const errors = validateSeller2026CategoryForm(form, isId);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    try {
      if (modalMode === "edit" && form.id) {
        await categories.updateCategory({ id: form.id, form });
        setNotice({ type: "success", text: isId ? "Kategori berhasil diperbarui" : "Category updated successfully" });
      } else {
        await categories.createCategory(form);
        setNotice({ type: "success", text: isId ? "Kategori berhasil dibuat" : "Category created successfully" });
      }
      closeModal();
      categories.clearSelection();
    } catch (error) {
      setNotice({
        type: "error",
        text: modalMode === "edit"
          ? toErrorMessage(error, isId ? "Gagal memperbarui kategori" : "Unable to update category")
          : toErrorMessage(error, isId ? "Gagal membuat kategori" : "Unable to create category"),
      });
    }
  };

  const handleImageFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
      const data = await uploadSellerCategoryImage(file);
      const url = data?.data?.url || data?.url;
      if (!url) throw new Error("Upload returned no image URL.");
      updateForm({ imageUrl: url });
    } catch (error) {
      setNotice({ type: "error", text: toErrorMessage(error, isId ? "Gagal mengunggah gambar" : "Unable to upload image") });
    } finally {
      setUploading(false);
      setImageInputKey((current) => current + 1);
    }
  };

  const updateVisibility = async (category) => {
    if (!category.permissions.canPublish && !category.permissions.canUnpublish) return;
    try {
      await categories.updateCategoryVisibility({ id: category.id, isPublished: !category.isPublished });
      setNotice({
        type: "success",
        text: category.isPublished
          ? (isId ? "Kategori berhasil disembunyikan" : "Category hidden successfully")
          : (isId ? "Kategori berhasil ditampilkan" : "Category is now visible"),
      });
    } catch (error) {
      setNotice({ type: "error", text: toErrorMessage(error, isId ? "Gagal memperbarui visibilitas kategori" : "Unable to update category visibility") });
    }
  };

  if (categories.isLoading) {
    return (
      <div className="seller2026-dashboard seller2026-categories">
        <div className="seller2026-skeleton seller2026-skeleton--hero" />
        <div className="seller2026-skeleton seller2026-skeleton--hero" />
        <p className="seller2026-categories__muted">{isId ? "Memuat data kategori..." : "Loading categories..."}</p>
      </div>
    );
  }

  if (categories.isError) {
    return (
      <div className="seller2026-dashboard seller2026-categories">
        <div className="seller2026-error"><AlertTriangle size={18} />{isId ? "Gagal memuat kategori" : "Unable to load categories"}<button onClick={() => categories.refetch()}>{isId ? "Coba Lagi" : "Retry"}</button></div>
      </div>
    );
  }

  const summaryCards = [
    [isId ? "Total Kategori" : "Total Categories", categories.summary.total, Layers, "blue"],
    [isId ? "Dipublikasikan" : "Published", categories.summary.published, Check, "green"],
    [isId ? "Disembunyikan" : "Hidden", categories.summary.hidden, EyeOff, "orange"],
    [isId ? "Kategori Utama" : "Root Categories", categories.summary.rootCategories, FolderTree, "mint"],
  ];

  const bulkButtonLabel = categories.selectedIds.length
    ? (isId ? `Aksi Massal (${categories.selectedIds.length})` : `Bulk Actions (${categories.selectedIds.length})`)
    : (isId ? "Aksi Massal" : "Bulk Actions");

  return (
    <div className="seller2026-dashboard seller2026-categories">
      <header className="seller2026-categories-header">
        <div>
          <h1>{isId ? "Kategori" : "Categories"}</h1>
          <p>{isId ? "Kelola kategori produk." : "Manage product categories."}</p>
        </div>
        <div className="seller2026-categories-actions">
          <button disabled title={isId ? "Belum tersedia" : "Not available yet"}><Upload size={16} />{isId ? "Ekspor" : "Export"}</button>
          <button disabled title={isId ? "Belum tersedia" : "Not available yet"}><Upload size={16} />{isId ? "Impor" : "Import"}</button>
          <button disabled={!categories.selectedIds.length} title={categories.selectedIds.length ? (isId ? "Aksi massal membutuhkan konfirmasi." : "Bulk actions are confirmation-gated.") : (isId ? "Pilih kategori terlebih dahulu" : "Select categories first")}>
            <SlidersHorizontal size={16} />
            {bulkButtonLabel}
          </button>
          <button className="is-primary" disabled={!canCreate} title={canCreate ? (isId ? "Tambah Kategori" : "Add Category") : (isId ? "Membutuhkan izin" : "Requires permission")} onClick={openCreate}>
            <Plus size={17} />
            {isId ? "Tambah Kategori" : "Add Category"}
          </button>
        </div>
      </header>

      {notice ? (
        <div className={`seller2026-profile__notice seller2026-profile__notice--${notice.type}`}>
          {notice.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}{notice.text}
        </div>
      ) : null}

      <section className="seller2026-categories-summary">
        {summaryCards.map(([label, value, Icon, tone]) => (
          <article key={label}>
            <span className={`is-${tone}`}><Icon size={23} /></span>
            <div><small>{label}</small><strong>{value}</strong></div>
          </article>
        ))}
      </section>

      <section className="seller2026-categories-table">
        <div className="seller2026-categories-toolbar">
          <label>
            <Search size={17} />
            <input placeholder={isId ? "Cari kategori..." : "Search categories..."} value={categories.filters.search} onChange={(event) => categories.setFilters({ search: event.target.value })} />
          </label>
          <span>{isId ? "Status" : "Status"}</span>
          <select value={categories.filters.status} onChange={(event) => categories.setFilters({ status: event.target.value })}>
            <option value="all">{isId ? "Semua Status" : "All Statuses"}</option>
            <option value="published">{isId ? "Dipublikasikan" : "Published"}</option>
            <option value="draft">{isId ? "Draf" : "Draft"}</option>
          </select>
          <span>{isId ? "Visibilitas" : "Visibility"}</span>
          <select value={categories.filters.visibility} onChange={(event) => categories.setFilters({ visibility: event.target.value })}>
            <option value="all">{isId ? "Semua Visibilitas" : "All Visibility"}</option>
            <option value="visible">{isId ? "Ditampilkan" : "Visible"}</option>
            <option value="hidden">{isId ? "Disembunyikan" : "Hidden"}</option>
          </select>
          <button type="button" onClick={categories.resetFilters} title={isId ? "Reset filter pencarian" : "Reset search filters"}>
            <RotateCcw size={16} />
            {isId ? "Atur Ulang" : "Reset"}
          </button>
        </div>

        {categories.filteredCategories.length === 0 ? (
          <div className="seller2026-categories-empty">
            <Layers size={30} />
            <h2>{isId ? "Belum ada kategori" : "No categories yet"}</h2>
            <p>{isId ? "Mulai dengan membuat kategori baru." : "Start by creating a category."}</p>
            <button type="button" disabled={!canCreate} onClick={openCreate}>{isId ? "Tambah Kategori" : "Add Category"}</button>
          </div>
        ) : (
          <>
            <div className="seller2026-categories-grid seller2026-categories-grid--head">
              <label>
                <input type="checkbox" checked={allPageSelected} onChange={(event) => categories.togglePageSelection(event.target.checked)} />
                {isId ? "Pilih" : "Select"}
              </label>
              <span>{isId ? "Kategori" : "Category"}</span>
              <span>{isId ? "Induk" : "Parent"}</span>
              <span>{isId ? "Produk" : "Products"}</span>
              <span>{isId ? "Visibilitas" : "Visibility"}</span>
              <span>{isId ? "Diperbarui" : "Updated"}</span>
              <span>{isId ? "Aksi" : "Actions"}</span>
            </div>
            <div className="seller2026-categories-grid seller2026-categories-grid--body">
              {categories.categories.map((category) => {
                const parentLabel = seller2026CategoryLabels.parent(category, isId);
                const visibleLabel = seller2026CategoryLabels.visibility(category.visibilityStatus, isId);
                const lifecycleLabel = seller2026CategoryLabels.lifecycle(category.lifecycleStatus, isId);
                const isVisibilityBusy = categories.visibilityCategoryId === category.id;
                const hasDescription = category.description && category.description !== "No description" && category.description !== "Tidak ada deskripsi";
                const updatedByDisplay = category.updatedBy === "by Seller" ? (isId ? "oleh Penjual" : "by Seller") : category.updatedBy;
                const formattedDate = category.rawUpdatedAt
                  ? formatSeller2026CategoryDate(category.rawUpdatedAt, isId)
                  : category.updatedAt;

                return (
                  <article className="seller2026-category-row" key={category.id}>
                    <label className="seller2026-category-row__select" data-label={isId ? "Pilih" : "Select"}>
                      <input
                        type="checkbox"
                        checked={categories.selectedIds.includes(category.id)}
                        onChange={(event) => categories.toggleSelected(category.id, event.target.checked)}
                      />
                    </label>
                    <div className="seller2026-category-row__identity" data-label={isId ? "Kategori" : "Category"}>
                      <CategoryIcon category={category} />
                      <div>
                        <strong
                          className={category.permissions.canEdit ? "is-clickable" : ""}
                          title={category.permissions.canEdit ? (isId ? "Klik untuk mengedit kategori" : "Click to edit category") : undefined}
                          onClick={category.permissions.canEdit ? () => openEdit(category) : undefined}
                        >
                          {category.name}
                        </strong>
                        {hasDescription ? <small>{category.description}</small> : null}
                      </div>
                    </div>
                    <div data-label={isId ? "Induk" : "Parent"}>
                      <Pill tone={category.isRoot ? "blue" : "mint"}>{parentLabel}</Pill>
                    </div>
                    <span data-label={isId ? "Produk" : "Products"} style={{ fontWeight: 700, color: "var(--seller2026-text)" }}>
                      {category.productsCount}
                    </span>
                    <div data-label={isId ? "Visibilitas" : "Visibility"} className="seller2026-category-row__status">
                      <Pill tone={category.isPublished ? "green" : "orange"}>{visibleLabel}</Pill>
                      <small>{lifecycleLabel}</small>
                    </div>
                    <div data-label={isId ? "Diperbarui" : "Updated"} className="seller2026-category-row__updated">
                      <span>{formattedDate}</span>
                      <small>{updatedByDisplay}</small>
                    </div>
                    <div className="seller2026-category-row__menu" data-label={isId ? "Aksi" : "Actions"}>
                      <button type="button" aria-label={`Actions for ${category.name}`}><MoreVertical size={18} /></button>
                      <div>
                        <button type="button" disabled={!category.permissions.canEdit} onClick={() => openEdit(category)}>
                          <Pencil size={14} />
                          {isId ? "Edit Kategori" : "Edit Category"}
                        </button>
                        <Link to={`${workspaceRoutes.catalog()}?category=${encodeURIComponent(category.id)}`}>
                          <Package size={14} />
                          {isId ? "Lihat Produk" : "View Products"}
                        </Link>
                        <button type="button" disabled={!canManageStatus || isVisibilityBusy} onClick={() => updateVisibility(category)}>
                          {category.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                          {category.isPublished ? (isId ? "Sembunyikan Kategori" : "Hide Category") : (isId ? "Tampilkan Kategori" : "Show Category")}
                        </button>
                        <button type="button" disabled title={isId ? "Fitur arsip belum aktif" : "Archive not available yet"}>
                          <Archive size={14} />
                          {isId ? "Arsip" : "Archive"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {categories.filteredCategories.length > 0 ? (
          <footer className="seller2026-categories-pagination">
            <span>
              {isId
                ? `Menampilkan ${categories.pagination.from} hingga ${categories.pagination.to} dari ${categories.pagination.total} hasil`
                : `Showing ${categories.pagination.from} to ${categories.pagination.to} of ${categories.pagination.total} results`}
            </span>
            <div>
              <select value={categories.pagination.perPage} onChange={(event) => categories.pagination.setPerPage(Number(event.target.value))}>
                <option value={10}>{isId ? "10 per halaman" : "10 per page"}</option>
                <option value={20}>{isId ? "20 per halaman" : "20 per page"}</option>
                <option value={50}>{isId ? "50 per halaman" : "50 per page"}</option>
              </select>
              <button disabled={categories.pagination.page <= 1} onClick={() => categories.pagination.setPage(1)} title={isId ? "Halaman pertama" : "First page"}><ChevronsLeft size={15} /></button>
              <button disabled={categories.pagination.page <= 1} onClick={() => categories.pagination.setPage(categories.pagination.page - 1)} title={isId ? "Sebelumnya" : "Previous"}><ChevronLeft size={15} /></button>
              {Array.from({ length: Math.min(3, categories.pagination.totalPages) }, (_, index) => index + 1).map((pageNumber) => (
                <button className={pageNumber === categories.pagination.page ? "is-active" : ""} key={pageNumber} onClick={() => categories.pagination.setPage(pageNumber)}>{pageNumber}</button>
              ))}
              <button disabled={categories.pagination.page >= categories.pagination.totalPages} onClick={() => categories.pagination.setPage(categories.pagination.page + 1)} title={isId ? "Berikutnya" : "Next"}><ChevronRight size={15} /></button>
              <button disabled={categories.pagination.page >= categories.pagination.totalPages} onClick={() => categories.pagination.setPage(categories.pagination.totalPages)} title={isId ? "Halaman terakhir" : "Last page"}><ChevronsRight size={15} /></button>
            </div>
          </footer>
        ) : null}
      </section>

      <input
        id={inputId}
        key={inputId}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => handleImageFile(event.target.files?.[0])}
      />
      <CategoryModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        errors={formErrors}
        parentOptions={categories.getParentOptions(form.id, isId)}
        onChange={updateForm}
        onClose={closeModal}
        onSubmit={submitForm}
        onImageUpload={() => document.getElementById(inputId)?.click()}
        isSubmitting={categories.isCreating || Boolean(categories.updatingCategoryId)}
        isUploading={uploading}
        canUpload
        isId={isId}
      />
    </div>
  );
}
