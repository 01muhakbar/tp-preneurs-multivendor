import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ChevronRight, FolderTree, X } from "lucide-react";
import {
  createAdminCategory,
  fetchAdminCategories,
  uploadAdminImage,
} from "../../lib/adminApi.js";
import {
  buildAdminCategoryPayload,
  CategoryFormPanel,
  createAdminCategoryFormState,
  getAdminCategoryMessage,
  invalidateAdminCategorySurfaces,
  isImagePath,
} from "./AdminCategoriesPage.jsx";
import "./productForm2026/admin-product-form-2026.css";
import "./categoryForm2026/admin-category-form-2026.css";

const text = (value) => String(value ?? "").trim();

export default function AdminCategoryCreatePage() {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const nameRef = useRef(null);
  const parentId = text(searchParams.get("parentId"));
  const [form, setForm] = useState(() =>
    createAdminCategoryFormState({ parent_id: parentId })
  );
  const [formError, setFormError] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setForm((prev) => ({ ...prev, parent_id: parentId }));
  }, [parentId]);

  useEffect(() => {
    return () => {
      if (text(localPreviewUrl).startsWith("blob:")) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const parentOptionsQuery = useQuery({
    queryKey: ["admin-categories", "parent-options"],
    queryFn: () => fetchAdminCategories({ page: 1, limit: 500 }),
    staleTime: 5 * 60 * 1000,
  });

  const parentOptions = parentOptionsQuery.data?.data || [];
  const selectedParent = useMemo(
    () => parentOptions.find((category) => String(category.id) === String(form.parent_id)),
    [form.parent_id, parentOptions]
  );
  const previewImageUrl = localPreviewUrl || (isImagePath(form.icon) ? form.icon : "");

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
    onError: (error) =>
      setUploadError(getAdminCategoryMessage(error, t("categories.Failed to upload image.", "Failed to upload image."))),
  });

  const createMutation = useMutation({
    mutationFn: createAdminCategory,
    onSuccess: () => {
      invalidateAdminCategorySurfaces(queryClient);
      toast.success(t("categories.Category created.", "Category created."));
      navigate("/admin/catalog/categories", { replace: true });
    },
    onError: (error) =>
      setFormError(getAdminCategoryMessage(error, t("categories.Failed to create category.", "Failed to create category."))),
  });

  const isSubmitting = createMutation.isPending || uploadMutation.isPending;

  const handleCancel = () => {
    if (isSubmitting) return;
    navigate("/admin/catalog/categories");
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

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!text(form.name)) {
      setFormError(t("categories.Category name is required.", "Category name is required."));
      return;
    }
    setFormError("");
    createMutation.mutate(buildAdminCategoryPayload(form));
  };

  return (
    <div className="apf26-shell acf26-shell">
      <header className="apf26-header">
        <div>
          <h1>{t("categories.Add Category", "Add Category")}</h1>
          <p>{t("categories.Create Mode", "Create Mode")}</p>
          <nav className="acf26-breadcrumb" aria-label="Breadcrumb">
            <span>{t("categories.Catalog", "Catalog")}</span>
            <ChevronRight size={14} />
            <span>{t("categories.Categories", "Categories")}</span>
            <ChevronRight size={14} />
            <span>{t("categories.Add Category", "Add Category")}</span>
          </nav>
        </div>
        <button
          type="button"
          className="apf26-close"
          onClick={handleCancel}
          aria-label={t("categories.Close add category page", "Close add category page")}
          disabled={isSubmitting}
        >
          <X size={22} />
        </button>
      </header>

      <main className="apf26-content acf26-content">
        <div className="acf26-layout">
          <section className="acf26-form-card">
            <div className="acf26-section-title">
              <span>
                <FolderTree size={18} />
              </span>
              <div>
                <h2>{t("categories.Category Information", "Category Information")}</h2>
                <p>{selectedParent ? selectedParent.name : t("categories.Top level", "Top level")}</p>
              </div>
            </div>
            <CategoryFormPanel
              formId="category-create-form"
              editing={null}
              form={form}
              setForm={setForm}
              parentOptions={parentOptions}
              parentOptionsLoading={parentOptionsQuery.isLoading}
              previewImageUrl={previewImageUrl}
              imageFileName={imageFileName}
              uploadPending={uploadMutation.isPending}
              uploadError={uploadError}
              onFileChange={handleFileChange}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              formError={formError}
              nameRef={nameRef}
              formClassName="acf26-form-body"
              footerClassName="acf26-footer"
            />
          </section>
        </div>
      </main>
    </div>
  );
}
