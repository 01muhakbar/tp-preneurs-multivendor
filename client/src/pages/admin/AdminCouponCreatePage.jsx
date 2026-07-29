import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ChevronRight, X } from "lucide-react";
import {
  createAdminCoupon,
  fetchAdminCouponMeta,
} from "../../lib/adminApi.js";
import { AddCouponFormPanel } from "../../components/admin/coupons/AddCouponDrawer.jsx";
import { invalidateAdminCouponSurfaces } from "./AdminCouponsPage.jsx";
import "./productForm2026/admin-product-form-2026.css";
import "./couponForm2026/admin-coupon-form-2026.css";

export default function AdminCouponCreatePage() {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState("");

  const couponMetaQuery = useQuery({
    queryKey: ["admin-coupon-meta"],
    queryFn: () => fetchAdminCouponMeta(),
  });

  const createMutation = useMutation({
    mutationFn: createAdminCoupon,
    onSuccess: async () => {
      await invalidateAdminCouponSurfaces(queryClient);
      toast.success(t("coupons.Coupon created.", "Coupon created."));
      navigate("/admin/catalog/coupons", { replace: true });
    },
    onError: (error) => {
      setSubmitError(
        error?.response?.data?.message ||
          t("coupons.Failed to create coupon.", "Failed to create coupon.")
      );
    },
  });

  const storeOptions = Array.isArray(couponMetaQuery.data?.data?.stores)
    ? couponMetaQuery.data.data.stores
    : [];

  const handleCancel = () => {
    if (createMutation.isPending) return;
    navigate("/admin/catalog/coupons");
  };

  const handleSubmit = (payload) => {
    setSubmitError("");
    createMutation.mutate(payload);
  };

  return (
    <div className="apf26-shell acf26-shell">
      <header className="apf26-header acf26-header">
        <div className="min-w-0">
          <h1>{t("coupons.Add Coupon", "Add Coupon")}</h1>
          <nav className="acf26-breadcrumb" aria-label="Breadcrumb">
            <span>{t("coupons.Catalog", "Catalog")}</span>
            <ChevronRight size={14} />
            <span>{t("coupons.Coupons", "Coupons")}</span>
            <ChevronRight size={14} />
            <span>{t("coupons.Add Coupon", "Add Coupon")}</span>
          </nav>
        </div>

        <div className="acf26-header-actions">
          <button
            type="button"
            className="apf26-close"
            onClick={handleCancel}
            aria-label={t("coupons.Close add coupon page", "Close add coupon page")}
            disabled={createMutation.isPending}
          >
            <X size={22} />
          </button>
        </div>
      </header>

      <main className="apf26-content acf26-content">
        <section className="acf26-form-card">
          <AddCouponFormPanel
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
            error={submitError}
            storeOptions={storeOptions}
            resetSignal="coupon-create-page"
            showHeader={false}
            formId="coupon-create-form"
            formClassName="acf26-form"
            bodyClassName="acf26-form-body"
            footerClassName="acf26-footer"
            compact
            showLanguageField={false}
          />
        </section>
      </main>
    </div>
  );
}
