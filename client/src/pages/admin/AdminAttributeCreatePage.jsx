import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ChevronRight, X } from "lucide-react";
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
