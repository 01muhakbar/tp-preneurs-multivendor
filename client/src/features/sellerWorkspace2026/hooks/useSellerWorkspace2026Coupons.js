import { useState, useEffect, useCallback } from "react";
import { fetchSellerWorkspace2026Coupons } from "../adapters/sellerWorkspace2026CouponsAdapter.js";
import { getCouponsFallback } from "../utils/sellerWorkspace2026Fallbacks.js";
import { deleteSellerCoupon } from "../../../api/sellerCoupons.ts";

export function useSellerWorkspace2026Coupons(storeSlug) {
  const [data, setData] = useState(getCouponsFallback());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCouponId, setSelectedCouponId] = useState(null);
  const [filters, setFilters] = useState({ search: "", scope: "all", status: "all" });

  const [actionState, setActionState] = useState({
    isUpdating: false,
    error: null,
    successMessage: null
  });

  const fetchData = useCallback(async () => {
    if (!storeSlug) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSellerWorkspace2026Coupons(storeSlug);
      setData(result);
    } catch (err) {
      console.error("Coupons Hook Error:", err);
      setError(err);
      const fallback = getCouponsFallback();
      fallback.meta.usingLiveData = false;
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteCoupon = useCallback(async (couponId) => {
    // Disabled pending confirmation and attribution validation flow.
    setActionState({ isUpdating: false, error: "Coupon mutation requires attribution validation and confirmation.", successMessage: null });
    return;
  }, []);

  return {
    data,
    loading,
    error,
    usingFallback: !data.meta.usingLiveData,
    filters,
    setFilters,
    selectedCouponId,
    setSelectedCouponId,
    refetch: fetchData,
    actions: {
      createCoupon: async () => {}, // Disabled pending form development
      updateCoupon: async () => {}, // Disabled pending form development
      archiveCoupon: async () => {}, // Disabled pending safe mutation review
      deleteCoupon
    },
    actionState
  };
}
