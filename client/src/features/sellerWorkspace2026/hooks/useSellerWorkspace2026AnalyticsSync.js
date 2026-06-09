import { useState, useEffect, useCallback } from "react";
import { fetchSellerWorkspace2026AnalyticsSync } from "../adapters/sellerWorkspace2026AnalyticsSyncAdapter.js";
import { getAnalyticsSyncFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

export function useSellerWorkspace2026AnalyticsSync(storeSlug) {
  const [data, setData] = useState(getAnalyticsSyncFallback());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);

  const [actionState, setActionState] = useState({
    isUpdating: false,
    error: null,
    successMessage: null
  });

  const fetchData = useCallback(async () => {
    if (!storeSlug) {
      const fallback = getAnalyticsSyncFallback();
      fallback.meta.usingLiveData = false;
      fallback.meta.message = "Analytics data is not available for this store yet.";
      setData(fallback);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSellerWorkspace2026AnalyticsSync(storeSlug);
      setData(result);
    } catch (err) {
      console.error("Analytics Sync Hook Error:", err);
      setError(err);
      const fallback = getAnalyticsSyncFallback();
      fallback.meta.usingLiveData = false;
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshPreview = async () => {
    await fetchData();
  };

  return {
    data,
    loading,
    error,
    usingFallback: !data.meta.usingLiveData,
    selectedProductId,
    setSelectedProductId,
    refetch: fetchData,
    actions: {
      refreshPreview,
      syncNow: async () => {
        setActionState({ isUpdating: false, error: "Storefront sync actions will be connected after public visibility workflow validation.", successMessage: null });
        setTimeout(() => setActionState(prev => ({ ...prev, error: null })), 3000);
      },
      rebuildIndex: async () => {
        setActionState({ isUpdating: false, error: "Storefront sync actions will be connected after public visibility workflow validation.", successMessage: null });
        setTimeout(() => setActionState(prev => ({ ...prev, error: null })), 3000);
      },
      publishStorefront: async () => {
        setActionState({ isUpdating: false, error: "Storefront sync actions will be connected after public visibility workflow validation.", successMessage: null });
        setTimeout(() => setActionState(prev => ({ ...prev, error: null })), 3000);
      }
    },
    actionState
  };
}
