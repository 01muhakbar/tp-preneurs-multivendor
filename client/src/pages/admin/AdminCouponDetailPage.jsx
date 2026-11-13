import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  fetchAdminCoupon,
  fetchAdminCouponMeta,
  updateAdminCoupon,
} from "../../lib/adminApi.js";
import CouponDetail2026View, {
  buildAdminCouponDetailPath,
  buildAdminCouponEditPath,
  getCouponDetailScopeKey,
} from "../../components/admin/coupons/CouponDetail2026View.jsx";
import { GENERIC_ERROR } from "../../constants/uiMessages.js";
import { invalidateAdminCouponSurfaces } from "./AdminCouponsPage.jsx";

const listPath = "/admin/catalog/coupons";

const getCouponPayload = (payload) => payload?.data?.data || payload?.data || payload || null;

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function AdminCouponDetailPage() {
  const { couponId, scopeKey } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation("admin");
  const [notice, setNotice] = useState({ type: "success", message: "" });

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

  const metaQuery = useQuery({
    queryKey: ["admin-coupon-meta"],
    queryFn: fetchAdminCouponMeta,
  });

  const coupon = useMemo(() => getCouponPayload(detailQuery.data), [detailQuery.data]);
  const storeOptions = Array.isArray(metaQuery.data?.data?.stores)
    ? metaQuery.data.data.stores
    : [];

  useEffect(() => {
    if (!coupon) return;
    const canonicalScope = getCouponDetailScopeKey(coupon);
    if (scopeKey && canonicalScope !== scopeKey) {
      navigate(buildAdminCouponDetailPath(coupon), { replace: true });
    }
  }, [coupon, navigate, scopeKey]);

  useEffect(() => {
    if (!notice?.message) return undefined;
    const timer = setTimeout(() => setNotice({ type: "success", message: "" }), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const invalidateDetail = async () => {
    await Promise.all([
      invalidateAdminCouponSurfaces(queryClient),
      queryClient.invalidateQueries({ queryKey: detailKey }),
    ]);
  };

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => updateAdminCoupon(id, { active }),
    onSuccess: async (_payload, variables) => {
      await invalidateDetail();
      setNotice({
        type: "success",
        message: variables.active
          ? t("coupons.Coupon enabled for checkout.", "Coupon enabled for checkout.")
          : t("coupons.Coupon hidden from checkout.", "Coupon hidden from checkout."),
      });
    },
    onError: (error) => {
      setNotice({
        type: "error",
        message: errorMessage(error, GENERIC_ERROR),
      });
    },
  });

  const isUpdating = toggleMutation.isPending;
  const isActive =
    typeof coupon?.active === "boolean"
      ? coupon.active
      : typeof coupon?.published === "boolean"
        ? coupon.published
        : true;

  return (
    <>
      {notice.message ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            notice.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <CouponDetail2026View
        coupon={coupon}
        loading={detailQuery.isLoading}
        error={
          detailQuery.isError
            ? errorMessage(detailQuery.error, t("coupons.Failed to load coupon details.", "Failed to load coupon details."))
            : ""
        }
        operation={{
          busy: isUpdating,
          label: toggleMutation.isPending
            ? t("coupons.Updating coupon status...", "Updating coupon status...")
            : "",
        }}
        actions={{
          onBack: () => navigate(listPath),
          onRetry: () => detailQuery.refetch(),
          onEdit: () => navigate(buildAdminCouponEditPath(coupon)),
          onToggleActive: () => {
            if (!coupon?.id || toggleMutation.isPending) return;
            toggleMutation.mutate({ id: coupon.id, active: !isActive });
          },
        }}
      />
    </>
  );
}
