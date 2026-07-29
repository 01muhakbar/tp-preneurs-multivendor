import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Folder,
  FolderTree,
  Grid2X2,
  Image as ImageIcon,
  List,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  bulkAdminCategories,
  createAdminCategory,
  deleteAdminCategory,
  exportAdminCategories,
  fetchAdminCategories,
  fetchAdminCategoryStats,
  importAdminCategories,
  updateAdminCategory,
  updateAdminCategoryPublished,
  uploadAdminImage,
} from "../../lib/adminApi.js";
import CouponImportModal from "../../components/coupons/CouponImportModal.jsx";
import "./admin-categories-2026.css";

const MAX_IMPORT_FILE_SIZE = 2 * 1024 * 1024;

export const getAdminCategoryMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const text = (value) => String(value ?? "").trim();

const asNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const getParentId = (category) =>
  category?.parentId ?? category?.parent_id ?? category?.parent?.id ?? null;

export const createAdminCategoryFormState = (overrides = {}) => ({
  name: "",
  code: "",
  description: "",
  icon: "",
  parent_id: "",
  published: true,
  ...overrides,
});

export const buildAdminCategoryPayload = (form, { includeEmptyParent = false } = {}) => {
  const payload = {
    name: text(form.name),
    code: text(form.code) || undefined,
    description: text(form.description) || undefined,
    icon: text(form.icon) || undefined,
    published: Boolean(form.published),
  };
  const parentId = text(form.parent_id);
  if (parentId) {
    payload.parent_id = Number(parentId);
  } else if (includeEmptyParent) {
    payload.parent_id = null;
  }
  return payload;
};

export const invalidateAdminCategorySurfaces = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  queryClient.invalidateQueries({ queryKey: ["storeCategories"] });
  queryClient.invalidateQueries({ queryKey: ["storefront", "categories"] });
  queryClient.invalidateQueries({ queryKey: ["seller-categories"] });
  queryClient.invalidateQueries({ queryKey: ["categories"] });
};

export const isImagePath = (value) => {
  const normalized = text(value);
  return (
    normalized.startsWith("/") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("data:image/") ||
    /\.(png|jpe?g|webp|svg|gif|avif)(\?|$)/i.test(normalized)
  );
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const slugifyCategory = (category) => {
  const source = text(category?.code) || text(category?.name) || `category-${category?.id || ""}`;
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `category-${category?.id || "detail"}`;
};

const getSubcategoriesPath = (category) =>
  `/admin/catalog/categories/${encodeURIComponent(String(category.id))}/${encodeURIComponent(
    slugifyCategory(category)
  )}/subcategories`;

const downloadResponseFile = async (response, fallbackName) => {
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const disposition = response.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  const filename = filenameMatch?.[1] || fallbackName;

  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
  return filename;
};

function CategoryIcon({ category, size = "md" }) {
  const value = text(category?.icon || category?.image);
  const image = isImagePath(value);
  const box = size === "lg" ? "h-14 w-14 rounded-2xl" : "h-10 w-10 rounded-xl";
  if (image) {
    return <img src={value} alt="" className={`${box} border border-slate-200 object-cover dark:border-slate-700`} />;
  }
  if (value && value.length <= 3) {
    return (
      <span className={`${box} inline-flex items-center justify-center border border-slate-200 bg-slate-50 text-lg dark:border-slate-700 dark:bg-slate-800`}>
        {value}
      </span>
    );
  }
  return (
    <span className={`${box} inline-flex items-center justify-center border border-blue-100 bg-[#eaf3fb] text-[#034c85] dark:border-slate-700 dark:bg-slate-800 dark:text-blue-200`}>
      <ImageIcon className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
    </span>
  );
}

function StatusBadge({ published }) {
  const { t } = useTranslation("admin");
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${published
          ? "border-[#034C85] bg-[#034C85] text-white dark:border-[#034C85] dark:bg-[#034C85] dark:text-white"
          : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-white" : "bg-slate-400"}`} />
      {published ? t("categories.Active", "Active") : t("categories.Inactive", "Inactive")}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, helper, loading, tone = "blue" }) {
  return (
    <article className={`ac26-kpi ac26-kpi--${tone}`}>
      <div className="ac26-kpi__body">
        <p>{label}</p>
        {loading ? (
          <div className="ac26-kpi__skeleton" />
        ) : (
          <strong>
            {asNumber(value).toLocaleString()}
          </strong>
        )}
        <span>{helper}</span>
      </div>
      <div className="ac26-kpi__icon">
        <Icon className="h-5 w-5" />
      </div>
    </article>
  );
}

function SkeletonTable() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-0 dark:border-slate-800">
          <div className="h-4 w-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 flex-1 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

function PublishSwitch({ checked, disabled, onClick, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#034c85] focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${checked ? "bg-[#034c85]" : "bg-slate-300 dark:bg-slate-700"
        }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-0.5"
          }`}
      />
    </button>
  );
}

export function CategoryFormPanel({
  formId = "category-form",
  editing,
  form,
  setForm,
  parentOptions,
  parentOptionsLoading,
  previewImageUrl,
  imageFileName,
  uploadPending,
  uploadError,
  onFileChange,
  onCancel,
  onSubmit,
  isSubmitting,
  formError,
  nameRef,
  formClassName = "space-y-4",
  footerClassName = "pt-4",
  footerInnerClassName = "flex justify-end gap-2",
}) {
  const { t } = useTranslation("admin");
  const fallbackNameRef = useRef(null);
  const activeNameRef = nameRef || fallbackNameRef;

  return (
    <>
      <form id={formId} onSubmit={onSubmit} className={formClassName}>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("categories.General", "General")}</h3>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("categories.Name", "Name")}
              <input
                ref={activeNameRef}
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#034c85] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                placeholder={t("categories.Books", "Books")}
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("categories.Code / slug", "Code / slug")}
              <input
                value={form.code}
                onChange={(event) => {
                  const value = event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-")
                    .replace(/-+/g, "-");
                  setForm((prev) => ({ ...prev, code: value }));
                }}
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#034c85] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                placeholder={t("categories.books", "books")}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("categories.Description", "Description")}
              <textarea
                value={form.description}
                maxLength={255}
                rows={4}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-[#034c85] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                placeholder={t("categories.Describe this category", "Describe this category")}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("categories.Hierarchy", "Hierarchy")}</h3>
          <label className="mt-4 grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("categories.Parent Category", "Parent Category")}
            <select
              value={form.parent_id}
              onChange={(event) => setForm((prev) => ({ ...prev, parent_id: event.target.value }))}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#034c85] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
            >
              <option value="">{t("categories.Top level", "Top level")}</option>
              {parentOptionsLoading ? <option disabled>{t("categories.Loading parents...", "Loading parents...")}</option> : null}
              {parentOptions
                .filter((category) => !editing || Number(category.id) !== Number(editing.id))
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("categories.Media", "Media")}</h3>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
            <Upload className="h-5 w-5" />
            <span className="font-semibold">{t("categories.Upload category image", "Upload category image")}</span>
            <span className="text-xs">{t("categories.PNG, JPG, WEBP, SVG up to the upload limit", "PNG, JPG, WEBP, SVG up to the upload limit")}</span>
            <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
          </label>
          {imageFileName ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("categories.Selected:", "Selected:")} {imageFileName}</p> : null}
          {uploadPending ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("categories.Uploading image...", "Uploading image...")}</p> : null}
          {uploadError ? <p className="mt-2 text-xs text-rose-600">{uploadError}</p> : null}
          <input
            value={form.icon}
            onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
            className="mt-3 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#034c85] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
            placeholder={t("categories.Icon or image URL", "Icon or image URL")}
          />
          {previewImageUrl ? (
            <img src={previewImageUrl} alt="Category preview" className="mt-3 max-h-44 w-full rounded-xl border border-slate-200 object-contain p-2 dark:border-slate-700" />
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("categories.Published", "Published")}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {form.published ? t("categories.Eligible for public catalog visibility.", "Eligible for public catalog visibility.") : t("categories.Hidden until you publish it.", "Hidden until you publish it.")}
              </p>
            </div>
            <PublishSwitch
              checked={Boolean(form.published)}
              label={t("categories.Toggle category published state", "Toggle category published state")}
              onClick={() => setForm((prev) => ({ ...prev, published: !Boolean(prev.published) }))}
            />
          </div>
        </section>

        {formError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            {formError}
          </div>
        ) : null}
      </form>

      <div className={footerClassName}>
        <div className={footerInnerClassName}>
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            {t("categories.Cancel", "Cancel")}
          </button>
          <button type="submit" form={formId} disabled={isSubmitting} className="inline-flex h-10 items-center justify-center rounded-lg bg-[#034c85] px-4 text-sm font-semibold text-white hover:bg-[#013d70] disabled:opacity-60">
            {isSubmitting ? t("categories.Saving...", "Saving...") : editing ? t("categories.Update Category", "Update Category") : t("categories.Add Category", "Add Category")}
          </button>
        </div>
      </div>
    </>
  );
}

function CategoryDetails({ category, onClose, onEdit, onDelete, onViewSubcategories }) {
  const { t } = useTranslation("admin");
  if (!category) return null;
  const parent = category.parent?.name || category.parentName || (getParentId(category) ? `#${getParentId(category)}` : t("categories.Top level", "Top level"));
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CategoryIcon category={category} size="lg" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{t("categories.Category Details", "Category Details")}</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-slate-50">{category.name}</h2>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label={t("categories.Close details", "Close details")} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <StatusBadge published={Boolean(category.published)} />
        <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
          {parent}
        </span>
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {category.description || t("categories.No description has been added for this category yet.", "No description has been added for this category yet.")}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <dt className="text-xs text-slate-500 dark:text-slate-400">{t("categories.Code / slug", "Code / slug")}</dt>
          <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{category.code || "-"}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <dt className="text-xs text-slate-500 dark:text-slate-400">{t("categories.Products", "Products")}</dt>
          <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{asNumber(category.productCount).toLocaleString()}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <dt className="text-xs text-slate-500 dark:text-slate-400">{t("categories.Visibility", "Visibility")}</dt>
          <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{category.published ? t("categories.Public eligible", "Public eligible") : t("categories.Hidden", "Hidden")}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <dt className="text-xs text-slate-500 dark:text-slate-400">{t("categories.Updated", "Updated")}</dt>
          <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatDate(category.updatedAt)}</dd>
        </div>
      </dl>

      <div className="mt-5 grid gap-2">
        <button type="button" onClick={() => onEdit(category)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#034c85] px-4 text-sm font-semibold text-white hover:bg-[#013d70]">
          <Pencil className="h-4 w-4" />
          {t("categories.Edit", "Edit")}
        </button>
        <button type="button" onClick={() => onViewSubcategories(category)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          <FolderTree className="h-4 w-4" />
          {t("categories.View Subcategories", "View Subcategories")}
        </button>
        <button type="button" onClick={() => onDelete(category)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/70 dark:hover:bg-rose-950/30">
          <Trash2 className="h-4 w-4" />
          {t("categories.Delete", "Delete")}
        </button>
      </div>
    </aside>
  );
}

function CategoryDrawer({
  open,
  editing,
  form,
  setForm,
  parentOptions,
  parentOptionsLoading,
  previewImageUrl,
  imageFileName,
  uploadPending,
  uploadError,
  onFileChange,
  onClose,
  onSubmit,
  isSubmitting,
  formError,
}) {
  const { t } = useTranslation("admin");
  const nameRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => nameRef.current?.focus(), 50);
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isSubmitting, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40"
        aria-label={t("categories.Cancel", "Cancel")}
        onClick={onClose}
        disabled={isSubmitting}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-drawer-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#fe6f05]">
                {editing ? t("categories.Edit Mode", "Edit Mode") : t("categories.Create Mode", "Create Mode")}
              </p>
              <h2 id="category-drawer-title" className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-50">
                {editing ? t("categories.Edit Category", "Edit Category") : t("categories.Add Category", "Add Category")}
              </h2>
            </div>
            <button type="button" onClick={onClose} disabled={isSubmitting} aria-label={t("categories.Close", "Close")} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <CategoryFormPanel
          formId="category-drawer-form"
          editing={editing}
          form={form}
          setForm={setForm}
          parentOptions={parentOptions}
          parentOptionsLoading={parentOptionsLoading}
          previewImageUrl={previewImageUrl}
          imageFileName={imageFileName}
          uploadPending={uploadPending}
          uploadError={uploadError}
          onFileChange={onFileChange}
          onCancel={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          formError={formError}
          nameRef={nameRef}
          formClassName="flex-1 space-y-4 overflow-y-auto px-5 py-5"
          footerClassName="border-t border-slate-200 px-5 py-4 dark:border-slate-800"
        />
      </aside>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const { t } = useTranslation("admin");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [parentFilter, setParentFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem("admin_categories_view_mode") || "list";
    } catch {
      return "list";
    }
  });
  const changeViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("admin_categories_view_mode", mode);
    } catch { }
  };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(createAdminCategoryFormState);
  const [formError, setFormError] = useState("");
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [rowPublishingId, setRowPublishingId] = useState(null);
  const [rowDeletingId, setRowDeletingId] = useState(null);
  const [imageFileName, setImageFileName] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [uploadError, setUploadError] = useState("");
  const bulkRef = useRef(null);
  const moreButtonRef = useRef(null);
  const moreDropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    const onClick = (event) => {
      if (!bulkRef.current?.contains(event.target)) setBulkMenuOpen(false);
      if (
        !moreButtonRef.current?.contains(event.target) &&
        !moreDropdownRef.current?.contains(event.target)
      ) {
        setFiltersOpen(false);
      }
      setActionMenuId(null);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setBulkMenuOpen(false);
        setFiltersOpen(false);
        setActionMenuId(null);
      }
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (text(localPreviewUrl).startsWith("blob:")) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const published =
    statusFilter === "active" ? true : statusFilter === "draft" ? false : undefined;

  const listParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      q: debouncedSearch || undefined,
      published,
      parentsOnly: parentFilter === "parents" ? true : undefined,
      parentId: parentFilter !== "all" && parentFilter !== "parents" ? Number(parentFilter) : undefined,
    }),
    [debouncedSearch, page, pageSize, parentFilter, published]
  );

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories", listParams],
    queryFn: () => fetchAdminCategories(listParams),
    keepPreviousData: true,
  });

  const statsQuery = useQuery({
    queryKey: ["admin-categories", "stats"],
    queryFn: fetchAdminCategoryStats,
    staleTime: 60 * 1000,
  });

  const parentOptionsQuery = useQuery({
    queryKey: ["admin-categories", "parent-options"],
    queryFn: () => fetchAdminCategories({ page: 1, limit: 500 }),
    staleTime: 5 * 60 * 1000,
  });

  const invalidateCategories = () => invalidateAdminCategorySurfaces(queryClient);

  const createMutation = useMutation({
    mutationFn: createAdminCategory,
    onSuccess: () => {
      invalidateCategories();
      toast.success(t("categories.Category created.", "Category created."));
      setDrawerOpen(false);
      setEditing(null);
      setFormError("");
    },
    onError: (error) => setFormError(getAdminCategoryMessage(error, t("categories.Failed to create category.", "Failed to create category."))),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdminCategory(id, payload),
    onSuccess: (response) => {
      invalidateCategories();
      const updated = response?.data;
      if (updated && selectedCategory?.id === updated.id) setSelectedCategory(updated);
      toast.success(t("categories.Category updated.", "Category updated."));
      setDrawerOpen(false);
      setEditing(null);
      setFormError("");
    },
    onError: (error) => setFormError(getAdminCategoryMessage(error, t("categories.Failed to update category.", "Failed to update category."))),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published: nextPublished }) => updateAdminCategoryPublished(id, nextPublished),
    onSuccess: (response, variables) => {
      invalidateCategories();
      const updated = response?.data;
      if (updated && selectedCategory?.id === updated.id) setSelectedCategory(updated);
      toast.success(variables.published ? t("categories.Category published.", "Category published.") : t("categories.Category unpublished.", "Category unpublished."));
      setRowPublishingId(null);
    },
    onError: (error) => {
      toast.error(getAdminCategoryMessage(error, t("categories.Failed to update category visibility.", "Failed to update category visibility.")));
      setRowPublishingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: (_response, deletedId) => {
      invalidateCategories();
      setSelectedIds((prev) => prev.filter((id) => Number(id) !== Number(deletedId)));
      if (Number(selectedCategory?.id) === Number(deletedId)) setSelectedCategory(null);
      toast.success(t("categories.Category deleted.", "Category deleted."));
      setRowDeletingId(null);
    },
    onError: (error) => {
      toast.error(getAdminCategoryMessage(error, t("categories.Failed to delete category.", "Failed to delete category.")));
      setRowDeletingId(null);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: ({ action, ids }) => bulkAdminCategories(action, ids),
    onSuccess: (_response, variables) => {
      invalidateCategories();
      const count = variables.ids.length;
      const label =
        variables.action === "publish"
          ? t("categories.bulk published", "published")
          : variables.action === "unpublish"
            ? t("categories.bulk unpublished", "unpublished")
            : t("categories.bulk deleted", "deleted");
      if (variables.action === "delete" && selectedCategory && variables.ids.includes(selectedCategory.id)) {
        setSelectedCategory(null);
      }
      setSelectedIds([]);
      setBulkMenuOpen(false);
      toast.success(t("categories.Bulk action completed.", "{{count}} categories {{label}}.", { count, label }));
    },
    onError: (error) => toast.error(getAdminCategoryMessage(error, t("categories.Bulk action failed.", "Bulk action failed."))),
  });

  const importMutation = useMutation({
    mutationFn: importAdminCategories,
    onSuccess: (response) => {
      invalidateCategories();
      const created = asNumber(response?.data?.created ?? response?.created);
      setImportOpen(false);
      setImportError("");
      toast.success(created ? t("categories.Categories imported.", "{{count}} categories imported.", { count: created }) : t("categories.Import completed.", "Import completed."));
    },
    onError: (error) => setImportError(getAdminCategoryMessage(error, t("categories.Failed to import categories.", "Failed to import categories."))),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadAdminImage,
    onSuccess: (response) => {
      const url = response?.data?.url || response?.url;
      if (!url) {
        setUploadError(t("categories.Upload succeeded but no URL was returned.", "Upload succeeded but no URL was returned."));
        return;
      }
      setForm((prev) => ({ ...prev, icon: url }));
      setUploadError("");
      toast.success(t("categories.Category image uploaded.", "Category image uploaded."));
    },
    onError: (error) => setUploadError(getAdminCategoryMessage(error, t("categories.Failed to upload image.", "Failed to upload image."))),
  });

  const items = categoriesQuery.data?.data || [];
  const meta = categoriesQuery.data?.meta || { page: 1, limit: pageSize, total: 0, totalPages: 1 };
  const parentOptions = parentOptionsQuery.data?.data || [];
  const totalPages = Math.max(1, asNumber(meta.totalPages, 1));
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));
  const isSaving = createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;
  const previewImageUrl = localPreviewUrl || (isImagePath(form.icon) ? form.icon : "");

  useEffect(() => {
    const itemIds = new Set(items.map((item) => item.id));
    setSelectedIds((prev) => prev.filter((id) => itemIds.has(id)));
    if (selectedCategory && itemIds.has(selectedCategory.id)) {
      const fresh = items.find((item) => item.id === selectedCategory.id);
      if (fresh) setSelectedCategory(fresh);
    }
  }, [items, selectedCategory?.id]);

  const openCreate = () => {
    navigate("/admin/catalog/categories/new");
  };

  const openCreateChild = (parentCategory) => {
    const parentId = encodeURIComponent(String(parentCategory.id));
    navigate(`/admin/catalog/categories/new?parentId=${parentId}`);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({
      name: category?.name || "",
      code: category?.code || "",
      description: category?.description || "",
      icon: category?.icon || "",
      parent_id: getParentId(category) ? String(getParentId(category)) : "",
      published: Boolean(category?.published ?? true),
    });
    setFormError("");
    setImageFileName("");
    setLocalPreviewUrl("");
    setUploadError("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (isSaving) return;
    setDrawerOpen(false);
    setEditing(null);
  };

  const submitForm = (event) => {
    event.preventDefault();
    const name = text(form.name);
    if (!name) {
      setFormError(t("categories.Category name is required.", "Category name is required."));
      return;
    }
    const payload = buildAdminCategoryPayload(form, { includeEmptyParent: Boolean(editing) });
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setImageFileName(file?.name || "");
    if (!file) return;
    setLocalPreviewUrl((prev) => {
      if (text(prev).startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    uploadMutation.mutate(file);
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const response = await exportAdminCategories({
        q: debouncedSearch || undefined,
        published,
        parentsOnly: parentFilter === "parents" ? true : undefined,
        parentId: parentFilter !== "all" && parentFilter !== "parents" ? Number(parentFilter) : undefined,
        format: "csv",
      });
      const filename = await downloadResponseFile(response, "categories-export.csv");
      toast.success(t("categories.Exported filename.", "Exported {{filename}}.", { filename }));
    } catch (error) {
      toast.error(getAdminCategoryMessage(error, t("categories.Failed to export categories.", "Failed to export categories.")));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (file) => {
    if (!file) return;
    const name = String(file.name || "").toLowerCase();
    const type = String(file.type || "").toLowerCase();
    const valid = name.endsWith(".csv") || type === "text/csv" || type === "application/vnd.ms-excel";
    if (!valid) {
      setImportError(t("categories.Import only accepts CSV files.", "Import only accepts CSV files."));
      return;
    }
    if (file.size <= 0) {
      setImportError(t("categories.Choose a CSV file with category rows.", "Choose a CSV file with category rows."));
      return;
    }
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      setImportError(t("categories.Import file exceeds the 2 MB limit.", "Import file exceeds the 2 MB limit."));
      return;
    }
    setImportError("");
    importMutation.mutate(file);
  };

  const togglePublished = (category) => {
    if (!category?.id || publishMutation.isPending) return;
    setRowPublishingId(category.id);
    publishMutation.mutate({ id: category.id, published: !Boolean(category.published) });
  };

  const deleteCategory = (category) => {
    if (!category?.id) return;
    const childHint = getParentId(category)
      ? t("categories.This is a nested category.", "This is a nested category.")
      : t("categories.If this category has children or products, the backend may reject the delete.", "If this category has children or products, the backend may reject the delete.");
    if (!window.confirm(t("categories.Delete category confirmation", "Delete {{name}}? {{hint}} This action cannot be undone.", { name: category.name, hint: childHint }))) return;
    setRowDeletingId(category.id);
    deleteMutation.mutate(category.id);
  };

  const runBulkAction = (action) => {
    const ids = selectedIds.map(Number).filter((id) => Number.isFinite(id) && id > 0);
    if (ids.length === 0) {
      toast.error(t("categories.Select at least one category first.", "Select at least one category first."));
      return;
    }
    if (action === "delete" && !window.confirm(t("categories.Delete selected categories confirmation", "Delete {{count}} selected categories? This action cannot be undone.", { count: ids.length }))) {
      return;
    }
    bulkMutation.mutate({ action, ids });
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setParentFilter("all");
    setPage(1);
    setFiltersOpen(false);
  };

  const viewSubcategories = (category) => {
    if (!category?.id) return;
    navigate(getSubcategoriesPath(category));
  };

  const stats = statsQuery.data || {};
  const statsTotal = asNumber(stats.total);
  const statsActive = asNumber(stats.active);
  const statsSubcategories = asNumber(stats.subcategories);
  const statsDraft = asNumber(stats.draft);
  const filterActive = debouncedSearch || statusFilter !== "all" || parentFilter !== "all";

  return (
    <div className="ac26-page ac26-page--categories">
      <header className="ac26-header">
        <div>
          <h1>{t("categories.Categories", "Categories")}</h1>
          <nav className="ac26-breadcrumb" aria-label="Breadcrumb">
            <span>{t("categories.Catalog", "Catalog")}</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{t("categories.Categories", "Categories")}</span>
          </nav>
        </div>

        <div className="ac26-header__actions">
          <button type="button" onClick={handleExport} disabled={isExporting} className="ac26-btn ac26-btn--ghost">
            <Download className="h-3.5 w-3.5" />
            {isExporting ? t("categories.Exporting...", "Exporting...") : t("categories.Export", "Export")}
          </button>
          <button type="button" onClick={() => setImportOpen(true)} disabled={importMutation.isPending} className="ac26-btn ac26-btn--ghost">
            <Upload className="h-3.5 w-3.5" />
            {t("categories.Import", "Import")}
          </button>
          <div className="relative" ref={bulkRef}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setBulkMenuOpen((prev) => !prev);
              }}
              disabled={selectedIds.length === 0 || bulkMutation.isPending}
              className="ac26-btn ac26-btn--ghost"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              <span className="truncate">{t("categories.Bulk Action", "Bulk Action")}</span>
            </button>
            {bulkMenuOpen ? (
              <div className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => runBulkAction("publish")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Upload className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span>{t("categories.Bulk publish", "Bulk publish")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => runBulkAction("unpublish")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Download className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span>{t("categories.Bulk unpublish", "Bulk unpublish")}</span>
                </button>
                <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={() => runBulkAction("delete")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                  <span>{t("categories.Bulk delete", "Bulk delete")}</span>
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => runBulkAction("delete")}
            disabled={selectedIds.length === 0 || bulkMutation.isPending}
            className="ac26-btn ac26-btn--danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("categories.Delete", "Delete")}
          </button>
          <button type="button" onClick={openCreate} className="ac26-btn ac26-btn--primary">
            <Plus className="h-3.5 w-3.5" />
            {t("categories.Add Category", "Add Category")}
          </button>
        </div>
      </header>

      <section className="ac26-kpis">
        <KpiCard icon={Folder} label={t("categories.Total Categories", "Total Categories")} value={statsTotal} helper={t("categories.Taxonomy records", "Taxonomy records")} loading={statsQuery.isLoading} />
        <KpiCard icon={CheckCircle2} label={t("categories.Active", "Active")} value={statsActive} helper={t("categories.Visible in store", "Visible in store")} loading={statsQuery.isLoading} tone="green" />
        <KpiCard icon={FolderTree} label={t("categories.Subcategories", "Subcategories")} value={statsSubcategories} helper={t("categories.Nested paths", "Nested paths")} loading={statsQuery.isLoading} tone="orange" />
        <KpiCard icon={FileText} label={t("categories.Draft / Review", "Draft / Review")} value={statsDraft} helper={t("categories.Hidden or review", "Hidden or review")} loading={statsQuery.isLoading} tone="red" />
      </section>
      {statsQuery.isError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {t("categories.KPI stats could not be loaded. The category table is still available.", "KPI stats could not be loaded. The category table is still available.")}
        </div>
      ) : null}

      <section className="ac26-toolbar">
        <label className="ac26-search flex-1 min-w-[200px]">
          <Search className="h-4 w-4" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("categories.Search category or code...", "Search category or code...")}
          />
        </label>

        <label className="ac26-select shrink-0">
          <span>{t("categories.Parent", "Parent")}</span>
          <select
            value={parentFilter}
            onChange={(event) => {
              setParentFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">{t("categories.All", "All")}</option>
            <option value="parents">{t("categories.Top level only", "Top level only")}</option>
            {parentOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        
        <label className="ac26-select shrink-0">
          <span>{t("categories.Status", "Status")}</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">{t("categories.All", "All")}</option>
            <option value="active">{t("categories.Active", "Active")}</option>
            <option value="draft">{t("categories.Draft", "Draft")}</option>
          </select>
        </label>

        <div className="ac26-more-wrapper shrink-0">
          <button
            ref={moreButtonRef}
            type="button"
            className={`ac26-filter-button ${filtersOpen ? "is-active" : ""}`}
            onClick={() => {
              if (!filtersOpen && moreButtonRef.current) {
                const rect = moreButtonRef.current.getBoundingClientRect();
                setDropdownPos({
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right,
                });
              }
              setFiltersOpen((open) => !open);
            }}
            aria-expanded={filtersOpen}
            title={t("categories.More", "More")}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">{t("categories.More", "More")}</span>
          </button>

          {filtersOpen ? (
            <div
              ref={moreDropdownRef}
              className="ac26-filter-drawer"
              style={{
                position: "fixed",
                zIndex: 9999,
                top: dropdownPos.top,
                right: dropdownPos.right,
                left: "auto",
              }}
            >
              <div className="ac26-filter-drawer__header">
                <SlidersHorizontal className="h-4 w-4" />
                <span>{t("categories.Options", "Options")}</span>
              </div>
              <div className="ac26-filter-drawer__body">
                <button
                  type="button"
                  className="ac26-filter-drawer__item"
                  onClick={() => {
                    resetFilters();
                    setFiltersOpen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                  {t("categories.Reset filters", "Reset filters")}
                </button>
                <button
                  type="button"
                  className="ac26-filter-drawer__item"
                  onClick={() => {
                    categoriesQuery.refetch();
                    setFiltersOpen(false);
                  }}
                  disabled={categoriesQuery.isFetching}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {t("categories.Refresh categories", "Refresh categories")}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="ac26-view-toggle shrink-0" role="group" aria-label={t("categories.View mode", "View mode")}>
          <button
            type="button"
            onClick={() => changeViewMode("list")}
            className={viewMode === "list" ? "is-active" : ""}
            title={t("categories.Table View", "Table View")}
            aria-label={t("categories.Table View", "Table View")}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => changeViewMode("grid")}
            className={viewMode === "grid" ? "is-active" : ""}
            title={t("categories.Grid View", "Grid View")}
            aria-label={t("categories.Grid View", "Grid View")}
          >
            <Grid2X2 className="h-4 w-4" />
          </button>
        </div>
      </section>

      <div className={`ac26-content-grid ${selectedCategory ? "has-detail" : ""}`}>
        <section className="ac26-table-card">
          {categoriesQuery.isLoading ? (
            <SkeletonTable />
          ) : categoriesQuery.isError ? (
            <div className="p-8 text-center">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{t("categories.Unable to load categories.", "Unable to load categories.")}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{getAdminCategoryMessage(categoriesQuery.error, t("categories.Please retry the request.", "Please retry the request."))}</p>
              <button type="button" onClick={() => categoriesQuery.refetch()} className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-[#034c85] px-4 text-sm font-semibold text-white">{t("categories.Retry", "Retry")}</button>
            </div>
          ) : items.length === 0 ? (
            <div className="ac26-empty">
              <FolderTree className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">
                {filterActive ? t("categories.No categories match the current filters.", "No categories match the current filters.") : t("categories.No categories yet.", "No categories yet.")}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {filterActive ? t("categories.Reset filters or try another search.", "Reset filters or try another search.") : t("categories.Create your first product category.", "Create your first product category.")}
              </p>
              <button type="button" onClick={filterActive ? resetFilters : openCreate} className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-[#034c85] px-4 text-sm font-semibold text-white">
                {filterActive ? t("categories.Reset Filters", "Reset Filters") : t("categories.Add Category", "Add Category")}
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="ac26-grid-cards">
              {items.map((category) => {
                const parentName = category.parent?.name || category.parentName || (getParentId(category) ? `#${getParentId(category)}` : t("categories.Top level", "Top level"));
                const isPublishing = rowPublishingId === category.id && publishMutation.isPending;
                const isDeleting = rowDeletingId === category.id && deleteMutation.isPending;
                return (
                  <article
                    key={category.id}
                    className={`ac26-grid-card ${selectedCategory?.id === category.id ? "border-[#034c85] ring-2 ring-blue-100 dark:ring-blue-950" : ""}`}
                  >
                    <div>
                      <div className="ac26-grid-card__header">
                        <div className="ac26-grid-card__info">
                          <input
                            type="checkbox"
                            aria-label={`${t("categories.Select category", "Select category")} ${category.name}`}
                            checked={selectedIds.includes(category.id)}
                            onChange={(event) => {
                              setSelectedIds((prev) =>
                                event.target.checked ? [...prev, category.id] : prev.filter((id) => id !== category.id)
                              );
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-[#034c85] focus:ring-[#034c85]"
                          />
                          <CategoryIcon category={category} />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedCategory(category)}
                              className="ac26-grid-card__title hover:text-[#034c85]"
                            >
                              {category.name}
                            </button>
                            <p className="ac26-grid-card__code">{category.code || t("categories.No code", "No code")}</p>
                          </div>
                        </div>
                        <StatusBadge published={Boolean(category.published)} />
                      </div>

                      <div className="ac26-grid-card__meta">
                        <span>{t("categories.Parent:", "Parent:")} <strong>{parentName}</strong></span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {asNumber(category.productCount).toLocaleString()} {t("categories.items", "items")}
                        </span>
                      </div>
                    </div>

                    <div className="ac26-grid-card__footer">
                      <PublishSwitch
                        checked={Boolean(category.published)}
                        disabled={isPublishing}
                        onClick={() => togglePublished(category)}
                        label={`${t("categories.Toggle category published state", "Toggle category published state")} ${category.name}`}
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          aria-label={`${t("categories.View category", "View category")} ${category.name}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(category)}
                          disabled={isDeleting}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          aria-label={`${t("categories.Edit category", "Edit category")} ${category.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => viewSubcategories(category)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          title={t("categories.View Subcategories", "View Subcategories")}
                          aria-label={`${t("categories.View subcategories", "View subcategories")} ${category.name}`}
                        >
                          <FolderTree className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="ac26-table-scroll">
              <table className="ac26-table">
                <thead>
                  <tr>
                    <th className="ac26-col-check">
                      <input
                        type="checkbox"
                        aria-label={t("categories.Select all visible categories", "Select all visible categories")}
                        checked={allSelected}
                        onChange={(event) => setSelectedIds(event.target.checked ? items.map((item) => item.id) : [])}
                        className="h-4 w-4 rounded border-slate-300 text-[#034c85] focus:ring-[#034c85]"
                      />
                    </th>
                    <th>{t("categories.Category", "Category")}</th>
                    <th>{t("categories.Parent Path", "Parent Path")}</th>
                    <th>{t("categories.Products", "Products")}</th>
                    <th className="ac26-col-status">{t("categories.Status", "Status")}</th>
                    <th className="ac26-col-published">{t("categories.Published", "Published")}</th>
                    <th className="ac26-col-actions">{t("categories.Actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((category) => {
                    const parentName = category.parent?.name || category.parentName || (getParentId(category) ? `#${getParentId(category)}` : "-");
                    const isPublishing = rowPublishingId === category.id && publishMutation.isPending;
                    const isDeleting = rowDeletingId === category.id && deleteMutation.isPending;
                    return (
                      <tr key={category.id} className={selectedCategory?.id === category.id ? "is-selected" : ""}>
                        <td className="ac26-cell-check">
                          <input
                            type="checkbox"
                            aria-label={`${t("categories.Select category", "Select category")} ${category.name}`}
                            checked={selectedIds.includes(category.id)}
                            onChange={(event) => {
                              setSelectedIds((prev) =>
                                event.target.checked ? [...prev, category.id] : prev.filter((id) => id !== category.id)
                              );
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-[#034c85] focus:ring-[#034c85]"
                          />
                        </td>
                        <td data-label={t("categories.Category", "Category")} className="ac26-cell-category">
                          <div className="ac26-category-cell">
                            <CategoryIcon category={category} />
                            <div>
                              <button type="button" onClick={() => setSelectedCategory(category)}>
                                {category.name}
                              </button>
                              <p>{category.code || t("categories.No code", "No code")}</p>
                            </div>
                          </div>
                        </td>
                        <td data-label={t("categories.Parent Path", "Parent Path")}>{parentName}</td>
                        <td data-label={t("categories.Products", "Products")} className="ac26-tabular">{asNumber(category.productCount).toLocaleString()}</td>
                        <td data-label={t("categories.Status", "Status")} className="ac26-cell-status">
                          <div className="ac26-status-cell">
                            <StatusBadge published={Boolean(category.published)} />
                          </div>
                        </td>
                        <td data-label={t("categories.Published", "Published")} className="ac26-cell-published">
                          <div className="ac26-published-cell">
                            <PublishSwitch checked={Boolean(category.published)} disabled={isPublishing} onClick={() => togglePublished(category)} label={`${category.published ? t("categories.Unpublish category", "Unpublish category") : t("categories.Publish category", "Publish category")} ${category.name}`} />
                          </div>
                        </td>
                        <td data-label={t("categories.Actions", "Actions")} className="ac26-actions-cell">
                          <div>
                            <button type="button" onClick={() => setSelectedCategory(category)} aria-label={`${t("categories.View category", "View category")} ${category.name}`}>
                              <Eye className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => openEdit(category)} disabled={isDeleting} aria-label={`${t("categories.Edit category", "Edit category")} ${category.name}`}>
                              <Pencil className="h-4 w-4" />
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setActionMenuId((prev) => (prev === category.id ? null : category.id));
                                }}
                                aria-label={`${t("categories.More actions for", "More actions for")} ${category.name}`}
                                className="ac26-more-trigger"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              {actionMenuId === category.id ? (
                                <div className="ac26-action-menu absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionMenuId(null);
                                      setSelectedCategory(category);
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                    <span>{t("categories.View details", "View details")}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionMenuId(null);
                                      openEdit(category);
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    <Pencil className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                    <span>{t("categories.Edit category", "Edit category")}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionMenuId(null);
                                      viewSubcategories(category);
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    <FolderTree className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                    <span>{t("categories.View subcategories", "View subcategories")}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionMenuId(null);
                                      openCreateChild(category);
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    <Plus className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                    <span>{t("categories.Add subcategory", "Add subcategory")}</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isPublishing}
                                    onClick={() => {
                                      setActionMenuId(null);
                                      togglePublished(category);
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    <CheckCircle2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                    <span>{category.published ? t("categories.Unpublish category", "Unpublish category") : t("categories.Publish category", "Publish category")}</span>
                                  </button>
                                  <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionMenuId(null);
                                      deleteCategory(category);
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                  >
                                    <Trash2 className="h-4 w-4 text-rose-500" />
                                    <span>{isDeleting ? t("categories.Deleting...", "Deleting...") : t("categories.Delete category", "Delete category")}</span>
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <footer className="ac26-pagination">
            <p>
              {meta.total
                ? `${t("categories.Showing", "Showing")} ${(meta.page - 1) * meta.limit + 1} ${t("categories.to", "to")} ${Math.min(meta.page * meta.limit, meta.total)} ${t("categories.of", "of")} ${meta.total} ${t("categories.categories", "categories")}`
                : t("categories.Showing 0 to 0 of 0 categories", "Showing 0 to 0 of 0 categories")}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} aria-label={t("categories.Previous page", "Previous page")} className="inline-flex h-9 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#034c85] px-3 font-semibold text-white">{page}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} aria-label={t("categories.Next page", "Next page")} className="inline-flex h-9 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </section>

        {selectedCategory ? (
          <CategoryDetails
            category={selectedCategory}
            onClose={() => setSelectedCategory(null)}
            onEdit={openEdit}
            onDelete={deleteCategory}
            onViewSubcategories={viewSubcategories}
          />
        ) : null}
      </div>

      <div className="ac26-bulk-bar" data-visible={selectedIds.length > 0 ? "true" : "false"}>
        <span>{selectedIds.length} {t("categories.selected", "selected")}</span>
        <button type="button" disabled={bulkMutation.isPending} onClick={() => runBulkAction("publish")}>
          <Upload className="h-3.5 w-3.5" />
          <span>{t("categories.Publish", "Publish")}</span>
        </button>
        <button type="button" disabled={bulkMutation.isPending} onClick={() => runBulkAction("unpublish")}>
          <Download className="h-3.5 w-3.5" />
          <span>{t("categories.Unpublish", "Unpublish")}</span>
        </button>
        <button type="button" disabled={bulkMutation.isPending} onClick={() => runBulkAction("delete")}>
          <Trash2 className="h-3.5 w-3.5" />
          <span>{t("categories.Delete", "Delete")}</span>
        </button>
      </div>

      <CategoryDrawer
        open={drawerOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        parentOptions={parentOptions}
        parentOptionsLoading={parentOptionsQuery.isLoading}
        previewImageUrl={previewImageUrl}
        imageFileName={imageFileName}
        uploadPending={uploadMutation.isPending}
        uploadError={uploadError}
        onFileChange={handleFileChange}
        onClose={closeDrawer}
        onSubmit={submitForm}
        isSubmitting={isSaving}
        formError={formError}
      />

      <CouponImportModal
        open={importOpen}
        onClose={() => {
          if (importMutation.isPending) return;
          setImportError("");
          setImportOpen(false);
        }}
        onImport={handleImport}
        title={t("categories.Import categories", "Import categories")}
        description={t("categories.Upload a CSV file using the admin category export format.", "Upload a CSV file using the admin category export format.")}
        helperText={t("categories.Required header: code,name,description,icon,published,parent_code", "Required header: code,name,description,icon,published,parent_code")}
        confirmLabel={t("categories.Import Categories", "Import Categories")}
        closeLabel={t("categories.Close", "Close")}
        importingLabel={t("categories.Importing...", "Importing...")}
        accept="text/csv,.csv"
        selectPrompt={t("categories.Choose category CSV file", "Choose category CSV file")}
        isSubmitting={importMutation.isPending}
        errorMessage={importError}
      />
    </div>
  );
}
