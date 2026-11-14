import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  createAdminCoupon,
  fetchAdminCouponMeta,
} from "../../lib/adminApi.js";
import { AddCouponFormPanel } from "../../components/admin/coupons/AddCouponDrawer.jsx";
import { invalidateAdminCouponSurfaces } from "./AdminCouponsPage.jsx";
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
    <div className="acf26-shell">
      <header className="acf26-header">
        <div className="acf26-header-titles">
          <h1>{t("coupons.Add Coupon", "Add Coupon")}</h1>
          <nav className="acf26-breadcrumb" aria-label="Breadcrumb">
            <span>{t("coupons.Catalog", "Catalog")}</span>
            <ChevronRight size={13} />
            <span>{t("coupons.Coupons", "Coupons")}</span>
            <ChevronRight size={13} />
            <span className="acf26-breadcrumb-current">
              {t("coupons.Add Coupon", "Add Coupon")}
            </span>
          </nav>
        </div>

        <button
          type="button"
          className="acf26-back-btn"
          onClick={handleCancel}
          disabled={createMutation.isPending}
        >
          <ArrowLeft size={16} />
          <span>{t("coupons.Back to Coupons", "Back to Coupons")}</span>
        </button>
      </header>

      <main className="acf26-content">
        <div className="acf26-layout">
          <AddCouponFormPanel
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
            error={submitError}
            storeOptions={storeOptions}
            resetSignal="coupon-create-page"
            showHeader={false}
            formId="coupon-create-form"
            layoutMode="page"
            compact={true}
            showLanguageField={false}
            footerClassName="acf26-footer"
          />
        </div>
      </main>
    </div>
  );
}
