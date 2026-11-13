import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import {
  fetchAdminCoupon,
  fetchAdminCouponMeta,
  updateAdminCoupon,
} from "../../lib/adminApi.js";
import EditCouponFormPanel from "../../components/admin/coupons/EditCouponFormPanel.jsx";
import { invalidateAdminCouponSurfaces } from "./AdminCouponsPage.jsx";
import {
  buildAdminCouponDetailPath,
  getCouponDetailScopeKey,
} from "../../components/admin/coupons/CouponDetail2026View.jsx";
import "./couponForm2026/admin-coupon-form-2026.css";

const getCouponPayload = (payload) => payload?.data?.data || payload?.data || payload || null;

export default function AdminCouponEditPage() {
  const { couponId, scopeKey } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation("admin");
  const isId = Boolean(i18n.language?.toLowerCase().startsWith("id"));

  const [submitError, setSubmitError] = useState("");

  const detailKey = useMemo(
    () => ["admin-coupons", "detail", String(couponId || "")],
    [couponId]
  );

  const detailQuery = useQuery({
    queryKey: detailKey,
    queryFn: () => fetchAdminCoupon(couponId),
    enabled: Boolean(couponId),
    retry: 1,
  });

  const couponMetaQuery = useQuery({
    queryKey: ["admin-coupon-meta"],
    queryFn: () => fetchAdminCouponMeta(),
  });

  const coupon = useMemo(() => getCouponPayload(detailQuery.data), [detailQuery.data]);

  // Optional: keep URL canonical if scopeKey is present
  useEffect(() => {
    if (!coupon || !scopeKey) return;
    const canonicalScope = getCouponDetailScopeKey(coupon);
    if (scopeKey !== canonicalScope) {
      navigate(`/admin/catalog/coupons/${couponId}/${canonicalScope}/edit`, { replace: true });
    }
  }, [coupon, couponId, navigate, scopeKey]);

  const updateMutation = useMutation({
    mutationFn: (payload) => updateAdminCoupon(couponId, payload),
    onSuccess: async () => {
      await Promise.all([
        invalidateAdminCouponSurfaces(queryClient),
        queryClient.invalidateQueries({ queryKey: detailKey }),
      ]);
      toast.success(
        isId ? "Kupon berhasil diperbarui." : t("coupons.Coupon updated.", "Coupon updated.")
      );
      navigate("/admin/catalog/coupons", { replace: true });
    },
    onError: (error) => {
      setSubmitError(
        error?.response?.data?.message ||
          error?.message ||
          (isId ? "Gagal memperbarui kupon." : t("coupons.Failed to update coupon.", "Failed to update coupon."))
      );
    },
  });

  const storeOptions = Array.isArray(couponMetaQuery.data?.data?.stores)
    ? couponMetaQuery.data.data.stores
    : [];

  const handleCancel = () => {
    if (updateMutation.isPending) return;
    navigate("/admin/catalog/coupons");
  };

  const handleSubmit = (payload) => {
    setSubmitError("");
    updateMutation.mutate(payload);
  };

  return (
    <div className="acf26-shell">
      {/* Header & Breadcrumb */}
      <header className="acf26-header">
        <div className="acf26-header-titles">
          <h1>
            {coupon?.code
              ? `${isId ? "Edit Kupon:" : "Edit Coupon:"} ${coupon.code}`
              : isId
                ? "Edit Kupon"
                : "Edit Coupon"}
          </h1>
          <nav className="acf26-breadcrumb" aria-label="Breadcrumb">
            <span>{isId ? "Katalog" : "Catalog"}</span>
            <ChevronRight size={13} />
            <span>{isId ? "Kupon" : "Coupons"}</span>
            <ChevronRight size={13} />
            <span className="acf26-breadcrumb-current">
              {isId ? "Edit Kupon" : "Edit Coupon"}
            </span>
          </nav>
        </div>

        <button
          type="button"
          className="acf26-back-btn"
          onClick={handleCancel}
          disabled={updateMutation.isPending}
        >
          <ArrowLeft size={16} />
          <span>{isId ? "Kembali ke Kupon" : "Back to Coupons"}</span>
        </button>
      </header>

      {/* Content Area */}
      <main className="acf26-content">
        {detailQuery.isLoading ? (
          <div className="acf26-form-card flex min-h-[360px] flex-col items-center justify-center p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#034c85] dark:text-sky-400 mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {isId ? "Memuat data kupon..." : "Loading coupon details..."}
            </p>
          </div>
        ) : detailQuery.isError || !coupon ? (
          <div className="acf26-form-card flex min-h-[360px] flex-col items-center justify-center p-12 text-center">
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-4">
              {detailQuery.error?.response?.data?.message ||
                (isId ? "Kupon tidak ditemukan atau gagal dimuat." : "Coupon not found or failed to load.")}
            </p>
            <button
              type="button"
              onClick={() => detailQuery.refetch()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#034c85] px-4 py-2 text-xs font-bold text-white hover:bg-[#023863] transition"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{isId ? "Coba Lagi" : "Retry"}</span>
            </button>
          </div>
        ) : (
          <section className="acf26-form-card">
            <EditCouponFormPanel
              coupon={coupon}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              isSubmitting={updateMutation.isPending}
              error={submitError}
              storeOptions={storeOptions}
            />
          </section>
        )}
      </main>
    </div>
  );
}
