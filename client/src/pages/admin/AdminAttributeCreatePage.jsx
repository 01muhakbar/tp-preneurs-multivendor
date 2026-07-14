import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CheckCircle2, ChevronDown, ChevronRight, X } from "lucide-react";
import { createAdminAttribute } from "../../lib/adminApi.js";
import { AttributeFormPanel } from "../../components/admin/attributes/AttributeModal.jsx";
import "./productForm2026/admin-product-form-2026.css";
import "./attributeForm2026/admin-attribute-form-2026.css";

const invalidateAttributeSurfaces = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ["admin", "attributes"] });
  queryClient.invalidateQueries({ queryKey: ["admin-product-attributes"] });
  queryClient.invalidateQueries({ queryKey: ["seller2026", "attributes"] });
  queryClient.invalidateQueries({ queryKey: ["seller2026", "product-editor", "attributes"] });
  queryClient.invalidateQueries({ queryKey: ["seller-attributes"] });
  queryClient.invalidateQueries({ queryKey: ["attributes"] });
};

export default function AdminAttributeCreatePage() {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState("en");
  const [submitError, setSubmitError] = useState("");

  const createMutation = useMutation({
    mutationFn: createAdminAttribute,
    onSuccess: () => {
      invalidateAttributeSurfaces(queryClient);
      toast.success(t("attributes.Attribute created successfully.", "Attribute created successfully."));
      navigate("/admin/catalog/attributes", { replace: true });
    },
    onError: (error) => {
      setSubmitError(error?.response?.data?.message || t("attributes.Failed to save attribute.", "Failed to save attribute."));
    },
  });

  const handleCancel = () => {
    if (createMutation.isPending) return;
    navigate("/admin/catalog/attributes");
  };

  const handleSubmit = (payload) => {
    setSubmitError("");
    createMutation.mutate(payload);
  };

  return (
    <div className="apf26-shell aaf26-shell">
      <header className="apf26-header aaf26-header">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#034c85]/15 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#034c85]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#fe6f05]" />
            {t("attributes.Catalog Attribute", "Catalog Attribute")}
          </div>
          <h1>{t("attributes.New Attribute", "New Attribute")}</h1>
          <p>{t("attributes.Name, option type, publish state, and values.", "Name, option type, publish state, and values.")}</p>
          <nav className="aaf26-breadcrumb" aria-label="Breadcrumb">
            <span>{t("attributes.Catalog", "Catalog")}</span>
            <ChevronRight size={14} />
            <span>{t("attributes.Attributes", "Attributes")}</span>
            <ChevronRight size={14} />
            <span>{t("attributes.New Attribute", "New Attribute")}</span>
          </nav>
        </div>

        <div className="aaf26-header-actions">
          <div className="relative">
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              disabled={createMutation.isPending}
              className="h-10 appearance-none rounded-lg border border-[#034c85]/20 bg-white pl-3 pr-9 text-sm font-semibold text-slate-700 focus:border-[#034c85]/60 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="en">en</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <button
            type="button"
            className="apf26-close"
            onClick={handleCancel}
            aria-label={t("attributes.Close add attribute page", "Close add attribute page")}
            disabled={createMutation.isPending}
          >
            <X size={22} />
          </button>
        </div>
      </header>

      <main className="apf26-content aaf26-content">
        <section className="aaf26-form-card">
          <AttributeFormPanel
            mode="create"
            attribute={null}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={createMutation.isPending}
            submitError={submitError}
            formId="attribute-create-form"
            bodyClassName="aaf26-form-body"
            footerClassName="aaf26-footer"
          />
        </section>
      </main>
    </div>
  );
}
