import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { uploadSellerCategoryImage } from "../../api/sellerCategories.ts";
import {
  createSeller2026CategoryForm,
  seller2026CategoryLabels,
  slugifySeller2026Category,
  validateSeller2026CategoryForm,
} from "../../api/seller2026/categories.adapter.ts";
import { hasSeller2026Permission } from "../../api/seller2026/permissions.ts";
import { useSeller2026Categories } from "../../hooks/seller2026/useSeller2026Categories.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/SellerWorkspace2026.css";

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
}) {
  if (!open) return null;
  const isEdit = mode === "edit";
  const title = isEdit ? "Update Category" : "Add Category";
  const subtitle = isEdit ? "Edit category details and visibility." : "Create and organize your catalog.";
  const actionLabel = isEdit ? "Update Category" : "Create Category";
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
            <span>Category Name *</span>
            <input
              value={form.name}
              placeholder="Enter category name"
              onChange={(event) => {
                const name = event.target.value;
                onChange({ name, slug: form.slug || slugifySeller2026Category(name) });
              }}
            />
            {errors.name ? <small>{errors.name}</small> : null}
          </label>

          <label>
            <span>Parent Category</span>
            <select value={form.parentId} onChange={(event) => onChange({ parentId: event.target.value })}>
              {parentOptions.map((option) => <option value={option.value} key={option.value || "root"}>{option.label}</option>)}
            </select>
          </label>

          <label className={errors.description ? "has-error" : ""}>
            <span>Description</span>
            <textarea
              rows={5}
              value={form.description}
              maxLength={160}
              placeholder="Enter a short description"
              onChange={(event) => onChange({ description: event.target.value })}
            />
            <em>{form.description.length}/160</em>
            {errors.description ? <small>{errors.description}</small> : null}
          </label>

          <div className="seller2026-category-form__image">
            <span>Image</span>
            <button type="button" disabled={!canUpload || isUploading} onClick={onImageUpload}>
              {imageUrl ? <img src={imageUrl} alt="" /> : <ImageIcon size={24} />}
              <strong>{isUploading ? "Uploading image..." : "Upload an image"}</strong>
              <small>{canUpload ? "PNG, JPG or WEBP. Max 2MB" : "Not available yet"}</small>
            </button>
            {form.imageUrl ? (
              <button
                className="seller2026-category-form__remove"
                type="button"
                onClick={() => window.confirm("Remove this image from the draft?") && onChange({ imageUrl: "" })}
              >
                Remove image
              </button>
            ) : null}
          </div>

          <label>
            <span>Slug (Handle)</span>
            <div className="seller2026-category-form__slug">
              <span>/categories/</span>
              <input
                value={form.slug}
                placeholder="category-handle"
                onChange={(event) => onChange({ slug: slugifySeller2026Category(event.target.value) })}
              />
            </div>
            <small>Use lowercase letters, numbers, and hyphens.</small>
          </label>

          <div className="seller2026-category-form__visibility">
            <div>
              <strong>Visible in storefront</strong>
              <span>Category will be visible to customers.</span>
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
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="is-primary" disabled={isSubmitting}>{isSubmitting ? "Saving..." : actionLabel}</button>
        </footer>
      </form>
    </div>
  );
}

export default function Seller2026LiveCategoriesPage() {
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes } = useSellerWorkspaceRoute();
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
    const errors = validateSeller2026CategoryForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    try {
      if (modalMode === "edit" && form.id) {
        await categories.updateCategory({ id: form.id, form });
        setNotice({ type: "success", text: "Category updated" });
      } else {
        await categories.createCategory(form);
        setNotice({ type: "success", text: "Category created" });
      }
      closeModal();
      categories.clearSelection();
    } catch (error) {
      setNotice({
        type: "error",
        text: modalMode === "edit"
          ? toErrorMessage(error, "Unable to update category")
          : toErrorMessage(error, "Unable to create category"),
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
      setNotice({ type: "error", text: toErrorMessage(error, "Unable to upload image") });
    } finally {
      setUploading(false);
      setImageInputKey((current) => current + 1);
    }
  };

  const updateVisibility = async (category) => {
    if (!category.permissions.canPublish && !category.permissions.canUnpublish) return;
    try {
      await categories.updateCategoryVisibility({ id: category.id, isPublished: !category.isPublished });
      setNotice({ type: "success", text: category.isPublished ? "Category hidden" : "Category visible" });
    } catch (error) {
      setNotice({ type: "error", text: toErrorMessage(error, "Unable to update category visibility") });
    }
  };

  if (categories.isLoading) {
    return (
      <div className="seller2026-dashboard seller2026-categories">
        <div className="seller2026-skeleton seller2026-skeleton--hero" />
        <div className="seller2026-skeleton seller2026-skeleton--hero" />
        <p className="seller2026-categories__muted">Loading categories...</p>
      </div>
    );
  }

  if (categories.isError) {
    return (
      <div className="seller2026-dashboard seller2026-categories">
        <div className="seller2026-error"><AlertTriangle size={18} />Unable to load categories<button onClick={() => categories.refetch()}>Retry</button></div>
      </div>
    );
  }

  const summaryCards = [
    ["Total Categories", categories.summary.total, Layers, "mint"],
    ["Published", categories.summary.published, Check, "green"],
    ["Hidden", categories.summary.hidden, EyeOff, "slate"],
    ["Root Categories", categories.summary.rootCategories, FolderTree, "mint"],
  ];

  return (
    <div className="seller2026-dashboard seller2026-categories">
      <header className="seller2026-categories-header">
        <div>
          <h1>Categories</h1>
          <p>Organize your product catalog.</p>
        </div>
        <div className="seller2026-categories-actions">
          <button disabled title="Not available yet"><Upload size={16} />Export</button>
          <button disabled title="Not available yet"><Upload size={16} />Import</button>
          <button disabled={!categories.selectedIds.length} title={categories.selectedIds.length ? "Bulk actions are confirmation-gated." : "Select categories first"}><SlidersHorizontal size={16} />Bulk Actions</button>
          <button className="is-primary" disabled={!canCreate} title={canCreate ? "Add Category" : "Requires permission"} onClick={openCreate}><Plus size={17} />Add Category</button>
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
          <label><Search size={17} /><input placeholder="Search categories..." value={categories.filters.search} onChange={(event) => categories.setFilters({ search: event.target.value })} /></label>
          <span>Status</span>
          <select value={categories.filters.status} onChange={(event) => categories.setFilters({ status: event.target.value })}>
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <span>Visibility</span>
          <select value={categories.filters.visibility} onChange={(event) => categories.setFilters({ visibility: event.target.value })}>
            <option value="all">All Visibility</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
          <button type="button" onClick={categories.resetFilters}><RotateCcw size={16} />Reset</button>
        </div>

        {categories.filteredCategories.length === 0 ? (
          <div className="seller2026-categories-empty">
            <Layers size={30} />
            <h2>No categories yet</h2>
            <p>Create your first category to organize products.</p>
            <button type="button" disabled={!canCreate} onClick={openCreate}>Add Category</button>
          </div>
        ) : (
          <>
            <div className="seller2026-categories-grid seller2026-categories-grid--head">
              <label><input type="checkbox" checked={allPageSelected} onChange={(event) => categories.togglePageSelection(event.target.checked)} />Select</label>
              <span>Category</span>
              <span>Parent</span>
              <span>Products</span>
              <span>Visibility</span>
              <span>Updated</span>
              <span>Actions</span>
            </div>
            <div className="seller2026-categories-grid seller2026-categories-grid--body">
              {categories.categories.map((category) => {
                const parentLabel = seller2026CategoryLabels.parent(category);
                const visibleLabel = seller2026CategoryLabels.visibility(category.visibilityStatus);
                const lifecycleLabel = seller2026CategoryLabels.lifecycle(category.lifecycleStatus);
                const isVisibilityBusy = categories.visibilityCategoryId === category.id;
                return (
                  <article className="seller2026-category-row" key={category.id}>
                    <label className="seller2026-category-row__select" data-label="Select">
                      <input type="checkbox" checked={categories.selectedIds.includes(category.id)} onChange={(event) => categories.toggleSelected(category.id, event.target.checked)} />
                    </label>
                    <div className="seller2026-category-row__identity" data-label="Category">
                      <CategoryIcon category={category} />
                      <div><strong>{category.name}</strong><small>{category.description}</small></div>
                    </div>
                    <div data-label="Parent"><Pill tone={category.isRoot ? "green" : "blue"}>{parentLabel}</Pill></div>
                    <span data-label="Products">{category.productsCount}</span>
                    <div data-label="Visibility" className="seller2026-category-row__status">
                      <Pill tone={category.isPublished ? "green" : "slate"}>{visibleLabel}</Pill>
                      <small>{lifecycleLabel}</small>
                    </div>
                    <div data-label="Updated" className="seller2026-category-row__updated"><span>{category.updatedAt}</span><small>{category.updatedBy}</small></div>
                    <div className="seller2026-category-row__menu" data-label="Actions">
                      <button type="button" aria-label={`Actions for ${category.name}`}><MoreVertical size={18} /></button>
                      <div>
                        <button type="button" disabled={!category.permissions.canEdit} onClick={() => openEdit(category)}><Pencil size={14} />Edit Category</button>
                        <Link to={`${workspaceRoutes.catalog()}?category=${encodeURIComponent(category.id)}`}><Package size={14} />View Products</Link>
                        <button type="button" disabled={!canManageStatus || isVisibilityBusy} onClick={() => updateVisibility(category)}>
                          {category.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}{category.isPublished ? "Hide Category" : "Show Category"}
                        </button>
                        <button type="button" disabled title="Not available yet"><Archive size={14} />Archive</button>
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
            <span>Showing {categories.pagination.from} to {categories.pagination.to} of {categories.pagination.total} results</span>
            <div>
              <select value={categories.pagination.perPage} onChange={(event) => categories.pagination.setPerPage(Number(event.target.value))}>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
              <button disabled={categories.pagination.page <= 1} onClick={() => categories.pagination.setPage(1)}><ChevronsLeft size={15} /></button>
              <button disabled={categories.pagination.page <= 1} onClick={() => categories.pagination.setPage(categories.pagination.page - 1)}><ChevronLeft size={15} /></button>
              {Array.from({ length: Math.min(3, categories.pagination.totalPages) }, (_, index) => index + 1).map((pageNumber) => (
                <button className={pageNumber === categories.pagination.page ? "is-active" : ""} key={pageNumber} onClick={() => categories.pagination.setPage(pageNumber)}>{pageNumber}</button>
              ))}
              <button disabled={categories.pagination.page >= categories.pagination.totalPages} onClick={() => categories.pagination.setPage(categories.pagination.page + 1)}><ChevronRight size={15} /></button>
              <button disabled={categories.pagination.page >= categories.pagination.totalPages} onClick={() => categories.pagination.setPage(categories.pagination.totalPages)}><ChevronsRight size={15} /></button>
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
        parentOptions={categories.getParentOptions(form.id)}
        onChange={updateForm}
        onClose={closeModal}
        onSubmit={submitForm}
        onImageUpload={() => document.getElementById(inputId)?.click()}
        isSubmitting={categories.isCreating || Boolean(categories.updatingCategoryId)}
        isUploading={uploading}
        canUpload
      />
    </div>
  );
}
