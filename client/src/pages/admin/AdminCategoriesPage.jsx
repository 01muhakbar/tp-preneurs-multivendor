import { useEffect, useMemo, useRef, useState } from "react";
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

const getMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const text = (value) => String(value ?? "").trim();

const asNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const getParentId = (category) =>
  category?.parentId ?? category?.parent_id ?? category?.parent?.id ?? null;

const isImagePath = (value) => {
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
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        published
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-200"
          : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-emerald-500" : "bg-slate-400"}`} />
      {published ? "Active" : "Draft"}
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
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#034c85] focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${
        checked ? "bg-[#034c85]" : "bg-slate-300 dark:bg-slate-700"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function CategoryDetails({ category, onClose, onEdit, onDelete, onViewSubcategories }) {
  if (!category) return null;
  const parent = category.parent?.name || category.parentName || (getParentId(category) ? `#${getParentId(category)}` : "Top level");
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CategoryIcon category={category} size="lg" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Category Details</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-slate-50">{category.name}</h2>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close details" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
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
        {category.description || "No description has been added for this category yet."}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Code / slug</dt>
          <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{category.code || "-"}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Products</dt>
          <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{asNumber(category.productCount).toLocaleString()}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Visibility</dt>
          <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{category.published ? "Public eligible" : "Hidden"}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Updated</dt>
          <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatDate(category.updatedAt)}</dd>
        </div>
      </dl>

      <div className="mt-5 grid gap-2">
        <button type="button" onClick={() => onEdit(category)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#034c85] px-4 text-sm font-semibold text-white hover:bg-[#013d70]">
          <Pencil className="h-4 w-4" />
          Edit
        </button>
        <button type="button" onClick={() => onViewSubcategories(category)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          <FolderTree className="h-4 w-4" />
          View Subcategories
        </button>
        <button type="button" onClick={() => onDelete(category)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/70 dark:hover:bg-rose-950/30">
          <Trash2 className="h-4 w-4" />
          Delete
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
        aria-label="Close category drawer"
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
                {editing ? "Edit Mode" : "Create Mode"}
              </p>
              <h2 id="category-drawer-title" className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-50">
                {editing ? "Edit Category" : "Add Category"}
              </h2>
            </div>
            <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Close" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form id="category-form" onSubmit={onSubmit} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">General</h3>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Name
                <input
                  ref={nameRef}
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#034c85] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                  placeholder="Books"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Code / slug
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
                  placeholder="books"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Description
                <textarea
                  value={form.description}
                  maxLength={255}
                  rows={4}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-[#034c85] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                  placeholder="Describe this category"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Hierarchy</h3>
            <label className="mt-4 grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Parent Category
              <select
                value={form.parent_id}
                onChange={(event) => setForm((prev) => ({ ...prev, parent_id: event.target.value }))}
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#034c85] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
              >
                <option value="">Top level</option>
                {parentOptionsLoading ? <option disabled>Loading parents...</option> : null}
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Media</h3>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
              <Upload className="h-5 w-5" />
              <span className="font-semibold">Upload category image</span>
              <span className="text-xs">PNG, JPG, WEBP, SVG up to the upload limit</span>
              <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
            </label>
            {imageFileName ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Selected: {imageFileName}</p> : null}
            {uploadPending ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Uploading image...</p> : null}
            {uploadError ? <p className="mt-2 text-xs text-rose-600">{uploadError}</p> : null}
            <input
              value={form.icon}
              onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
              className="mt-3 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#034c85] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
              placeholder="Icon or image URL"
            />
            {previewImageUrl ? (
              <img src={previewImageUrl} alt="Category preview" className="mt-3 max-h-44 w-full rounded-xl border border-slate-200 object-contain p-2 dark:border-slate-700" />
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Published</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {form.published ? "Eligible for public catalog visibility." : "Hidden until you publish it."}
                </p>
              </div>
              <PublishSwitch
                checked={Boolean(form.published)}
                label="Toggle category published state"
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

        <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" form="category-form" disabled={isSubmitting} className="inline-flex h-10 items-center justify-center rounded-lg bg-[#034c85] px-4 text-sm font-semibold text-white hover:bg-[#013d70] disabled:opacity-60">
              {isSubmitting ? "Saving..." : editing ? "Update Category" : "Add Category"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function AdminCategoriesPage() {
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
    } catch {}
  };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    icon: "",
    parent_id: "",
    published: true,
  });
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
      setActionMenuId(null);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setBulkMenuOpen(false);
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

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    queryClient.invalidateQueries({ queryKey: ["storeCategories"] });
    queryClient.invalidateQueries({ queryKey: ["storefront", "categories"] });
    queryClient.invalidateQueries({ queryKey: ["seller-categories"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const createMutation = useMutation({
    mutationFn: createAdminCategory,
    onSuccess: () => {
      invalidateCategories();
      toast.success("Category created.");
      setDrawerOpen(false);
      setEditing(null);
      setFormError("");
    },
    onError: (error) => setFormError(getMessage(error, "Failed to create category.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdminCategory(id, payload),
    onSuccess: (response) => {
      invalidateCategories();
      const updated = response?.data;
      if (updated && selectedCategory?.id === updated.id) setSelectedCategory(updated);
      toast.success("Category updated.");
      setDrawerOpen(false);
      setEditing(null);
      setFormError("");
    },
    onError: (error) => setFormError(getMessage(error, "Failed to update category.")),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published: nextPublished }) => updateAdminCategoryPublished(id, nextPublished),
    onSuccess: (response, variables) => {
      invalidateCategories();
      const updated = response?.data;
      if (updated && selectedCategory?.id === updated.id) setSelectedCategory(updated);
      toast.success(variables.published ? "Category published." : "Category unpublished.");
      setRowPublishingId(null);
    },
    onError: (error) => {
      toast.error(getMessage(error, "Failed to update category visibility."));
      setRowPublishingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: (_response, deletedId) => {
      invalidateCategories();
      setSelectedIds((prev) => prev.filter((id) => Number(id) !== Number(deletedId)));
      if (Number(selectedCategory?.id) === Number(deletedId)) setSelectedCategory(null);
      toast.success("Category deleted.");
      setRowDeletingId(null);
    },
    onError: (error) => {
      toast.error(getMessage(error, "Failed to delete category."));
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
          ? "published"
          : variables.action === "unpublish"
          ? "unpublished"
          : "deleted";
      if (variables.action === "delete" && selectedCategory && variables.ids.includes(selectedCategory.id)) {
        setSelectedCategory(null);
      }
      setSelectedIds([]);
      setBulkMenuOpen(false);
      toast.success(`${count} categor${count === 1 ? "y" : "ies"} ${label}.`);
    },
    onError: (error) => toast.error(getMessage(error, "Bulk action failed.")),
  });

  const importMutation = useMutation({
    mutationFn: importAdminCategories,
    onSuccess: (response) => {
      invalidateCategories();
      const created = asNumber(response?.data?.created ?? response?.created);
      setImportOpen(false);
      setImportError("");
      toast.success(created ? `${created} categories imported.` : "Import completed.");
    },
    onError: (error) => setImportError(getMessage(error, "Failed to import categories.")),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadAdminImage,
    onSuccess: (response) => {
      const url = response?.data?.url || response?.url;
      if (!url) {
        setUploadError("Upload succeeded but no URL was returned.");
        return;
      }
      setForm((prev) => ({ ...prev, icon: url }));
      setUploadError("");
      toast.success("Category image uploaded.");
    },
    onError: (error) => setUploadError(getMessage(error, "Failed to upload image.")),
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
    setEditing(null);
    setForm({ name: "", code: "", description: "", icon: "", parent_id: "", published: true });
    setFormError("");
    setImageFileName("");
    setLocalPreviewUrl("");
    setUploadError("");
    setDrawerOpen(true);
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
      setFormError("Category name is required.");
      return;
    }
    const payload = {
      name,
      code: text(form.code) || undefined,
      description: text(form.description) || undefined,
      icon: text(form.icon) || undefined,
      published: Boolean(form.published),
    };
    const parentId = text(form.parent_id);
    if (editing) {
      payload.parent_id = parentId ? Number(parentId) : null;
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      if (parentId) payload.parent_id = Number(parentId);
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
      toast.success(`Exported ${filename}.`);
    } catch (error) {
      toast.error(getMessage(error, "Failed to export categories."));
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
      setImportError("Import only accepts CSV files.");
      return;
    }
    if (file.size <= 0) {
      setImportError("Choose a CSV file with category rows.");
      return;
    }
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      setImportError("Import file exceeds the 2 MB limit.");
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
      ? "This is a nested category."
      : "If this category has children or products, the backend may reject the delete.";
    if (!window.confirm(`Delete ${category.name}? ${childHint} This action cannot be undone.`)) return;
    setRowDeletingId(category.id);
    deleteMutation.mutate(category.id);
  };

  const runBulkAction = (action) => {
    const ids = selectedIds.map(Number).filter((id) => Number.isFinite(id) && id > 0);
    if (ids.length === 0) {
      toast.error("Select at least one category first.");
      return;
    }
    if (action === "delete" && !window.confirm(`Delete ${ids.length} selected categories? This action cannot be undone.`)) {
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
    <div className="ac26-page">
      <header className="ac26-header">
        <div>
          <h1>Categories</h1>
          <nav className="ac26-breadcrumb" aria-label="Breadcrumb">
            <span>Catalog</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>Categories</span>
          </nav>
        </div>

        <div className="ac26-header__actions">
          <button type="button" onClick={handleExport} disabled={isExporting} className="ac26-btn ac26-btn--ghost">
            <Download className="h-3.5 w-3.5" />
            {isExporting ? "Exporting..." : "Export"}
          </button>
          <button type="button" onClick={() => setImportOpen(true)} disabled={importMutation.isPending} className="ac26-btn ac26-btn--ghost">
            <Upload className="h-3.5 w-3.5" />
            Import
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
              <span className="truncate">Bulk Action</span>
            </button>
            {bulkMenuOpen ? (
              <div className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <button type="button" onClick={() => runBulkAction("publish")} className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800">Bulk publish</button>
                <button type="button" onClick={() => runBulkAction("unpublish")} className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800">Bulk unpublish</button>
                <button type="button" onClick={() => runBulkAction("delete")} className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Bulk delete</button>
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
            Delete
          </button>
          <button type="button" onClick={openCreate} className="ac26-btn ac26-btn--primary">
            <Plus className="h-3.5 w-3.5" />
            Add Category
          </button>
        </div>
      </header>

      <section className="ac26-kpis">
        <KpiCard icon={Folder} label="Total Categories" value={statsTotal} helper="Taxonomy records" loading={statsQuery.isLoading} />
        <KpiCard icon={CheckCircle2} label="Active" value={statsActive} helper="Visible in store" loading={statsQuery.isLoading} tone="green" />
        <KpiCard icon={FolderTree} label="Subcategories" value={statsSubcategories} helper="Nested paths" loading={statsQuery.isLoading} tone="orange" />
        <KpiCard icon={FileText} label="Draft / Review" value={statsDraft} helper="Hidden or review" loading={statsQuery.isLoading} tone="red" />
      </section>
      {statsQuery.isError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          KPI stats could not be loaded. The category table is still available.
        </div>
      ) : null}

      <section className="ac26-toolbar">
        <label className="ac26-search">
          <Search className="h-4 w-4" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search category or code..."
          />
        </label>
        <div className="ac26-chip-bar">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setParentFilter("all");
              setPage(1);
            }}
            className={`ac26-chip ${statusFilter === "all" && parentFilter === "all" ? "is-active" : ""}`}
          >
            All Categories
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("active");
              setPage(1);
            }}
            className={`ac26-chip ${statusFilter === "active" ? "is-active" : ""}`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("draft");
              setPage(1);
            }}
            className={`ac26-chip ${statusFilter === "draft" ? "is-active" : ""}`}
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() => {
              setParentFilter("parents");
              setPage(1);
            }}
            className={`ac26-chip ${parentFilter === "parents" ? "is-active" : ""}`}
          >
            Top-level Only
          </button>
        </div>
        <label className="ac26-select">
          <span>Parent</span>
          <select
            value={parentFilter}
            onChange={(event) => {
              setParentFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="parents">Top level only</option>
            {parentOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="ac26-select">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
        </label>
        <div className="ac26-view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            onClick={() => changeViewMode("list")}
            className={viewMode === "list" ? "is-active" : ""}
            title="Table View"
          >
            <List className="h-4 w-4" />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() => changeViewMode("grid")}
            className={viewMode === "grid" ? "is-active" : ""}
            title="Grid View"
          >
            <Grid2X2 className="h-4 w-4" />
            <span>Grid</span>
          </button>
        </div>
        <button type="button" className="ac26-filter-button" onClick={() => setFiltersOpen((open) => !open)}>
          <SlidersHorizontal className="h-4 w-4" />
          <span>More</span>
        </button>
        {filtersOpen ? (
          <div className="ac26-filter-drawer">
            <button type="button" onClick={resetFilters}>
              <X className="h-4 w-4" />
              Reset filters
            </button>
            <button type="button" onClick={() => categoriesQuery.refetch()} disabled={categoriesQuery.isFetching}>
              <SlidersHorizontal className="h-4 w-4" />
              Refresh categories
            </button>
          </div>
        ) : null}
      </section>

      <div className={`ac26-content-grid ${selectedCategory ? "has-detail" : ""}`}>
        <section className="ac26-table-card">
          {categoriesQuery.isLoading ? (
            <SkeletonTable />
          ) : categoriesQuery.isError ? (
            <div className="p-8 text-center">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Unable to load categories.</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{getMessage(categoriesQuery.error, "Please retry the request.")}</p>
              <button type="button" onClick={() => categoriesQuery.refetch()} className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-[#034c85] px-4 text-sm font-semibold text-white">Retry</button>
            </div>
          ) : items.length === 0 ? (
            <div className="ac26-empty">
              <FolderTree className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">
                {filterActive ? "No categories match the current filters." : "No categories yet."}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {filterActive ? "Reset filters or try another search." : "Create your first product category."}
              </p>
              <button type="button" onClick={filterActive ? resetFilters : openCreate} className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-[#034c85] px-4 text-sm font-semibold text-white">
                {filterActive ? "Reset Filters" : "Add Category"}
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="ac26-grid-cards">
              {items.map((category) => {
                const parentName = category.parent?.name || category.parentName || (getParentId(category) ? `#${getParentId(category)}` : "Top level");
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
                            aria-label={`Select ${category.name}`}
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
                            <p className="ac26-grid-card__code">{category.code || "No code"}</p>
                          </div>
                        </div>
                        <StatusBadge published={Boolean(category.published)} />
                      </div>

                      <div className="ac26-grid-card__meta">
                        <span>Parent: <strong>{parentName}</strong></span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {asNumber(category.productCount).toLocaleString()} items
                        </span>
                      </div>
                    </div>

                    <div className="ac26-grid-card__footer">
                      <PublishSwitch
                        checked={Boolean(category.published)}
                        disabled={isPublishing}
                        onClick={() => togglePublished(category)}
                        label={`Toggle ${category.name}`}
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          aria-label={`View ${category.name}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(category)}
                          disabled={isDeleting}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          aria-label={`Edit ${category.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => viewSubcategories(category)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          title="View Subcategories"
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
                        aria-label="Select all visible categories"
                        checked={allSelected}
                        onChange={(event) => setSelectedIds(event.target.checked ? items.map((item) => item.id) : [])}
                        className="h-4 w-4 rounded border-slate-300 text-[#034c85] focus:ring-[#034c85]"
                      />
                    </th>
                    <th>Category</th>
                    <th>Parent Path</th>
                    <th>Products</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th className="ac26-col-actions">Actions</th>
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
                            aria-label={`Select ${category.name}`}
                            checked={selectedIds.includes(category.id)}
                            onChange={(event) => {
                              setSelectedIds((prev) =>
                                event.target.checked ? [...prev, category.id] : prev.filter((id) => id !== category.id)
                              );
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-[#034c85] focus:ring-[#034c85]"
                          />
                        </td>
                        <td data-label="Category">
                          <div className="ac26-category-cell">
                            <CategoryIcon category={category} />
                            <div>
                              <button type="button" onClick={() => setSelectedCategory(category)}>
                                {category.name}
                              </button>
                              <p>{category.code || "No code"}</p>
                            </div>
                          </div>
                        </td>
                        <td data-label="Parent">{parentName}</td>
                        <td data-label="Products" className="ac26-tabular">{asNumber(category.productCount).toLocaleString()}</td>
                        <td data-label="Status">
                          <div className="ac26-status-cell">
                            <PublishSwitch checked={Boolean(category.published)} disabled={isPublishing} onClick={() => togglePublished(category)} label={`${category.published ? "Unpublish" : "Publish"} ${category.name}`} />
                            <StatusBadge published={Boolean(category.published)} />
                          </div>
                        </td>
                        <td data-label="Updated">{formatDate(category.updatedAt)}</td>
                        <td data-label="Actions" className="ac26-actions-cell">
                          <div>
                            <button type="button" onClick={() => setSelectedCategory(category)} aria-label={`View ${category.name}`}>
                              <Eye className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => openEdit(category)} disabled={isDeleting} aria-label={`Edit ${category.name}`}>
                              <Pencil className="h-4 w-4" />
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setActionMenuId((prev) => (prev === category.id ? null : category.id));
                                }}
                                aria-label={`More actions for ${category.name}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              {actionMenuId === category.id ? (
                                <div className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-left shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                  <button type="button" onClick={() => viewSubcategories(category)} className="block w-full rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">View subcategories</button>
                                  <button type="button" onClick={() => deleteCategory(category)} className="block w-full rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                                    {isDeleting ? "Deleting..." : "Delete"}
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
                ? `Showing ${(meta.page - 1) * meta.limit + 1} to ${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total} categories`
                : "Showing 0 to 0 of 0 categories"}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} aria-label="Previous page" className="inline-flex h-9 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#034c85] px-3 font-semibold text-white">{page}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} aria-label="Next page" className="inline-flex h-9 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">
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
        <span>{selectedIds.length} selected</span>
        <button type="button" disabled={bulkMutation.isPending} onClick={() => runBulkAction("publish")}>Publish</button>
        <button type="button" disabled={bulkMutation.isPending} onClick={() => runBulkAction("unpublish")}>Unpublish</button>
        <button type="button" disabled={bulkMutation.isPending} onClick={() => runBulkAction("delete")}>Delete</button>
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
        title="Import categories"
        description="Upload a CSV file using the admin category export format."
        helperText="Required header: code,name,description,icon,published,parent_code"
        confirmLabel="Import Categories"
        accept="text/csv,.csv"
        selectPrompt="Choose category CSV file"
        isSubmitting={importMutation.isPending}
        errorMessage={importError}
      />
    </div>
  );
}
