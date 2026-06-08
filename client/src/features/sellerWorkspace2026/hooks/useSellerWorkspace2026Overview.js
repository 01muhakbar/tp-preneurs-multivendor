import { useState, useEffect, useCallback } from "react";
import { fetchSellerWorkspace2026Overview } from "../adapters/sellerWorkspace2026OverviewAdapter.js";
import { getOverviewFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

/**
 * Hook to fetch Overview (Dashboard) data for a given store slug.
 * Returns { data, loading, error, usingFallback, refetch }.
 */
export function useSellerWorkspace2026Overview(storeSlug) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingFallback(false);
    try {
      const result = await fetchSellerWorkspace2026Overview(storeSlug);
      // Adapter returns fallback data directly when needed.
      // Heuristic: if result contains a `kpis` field (present in both live and fallback), but we cannot differentiate.
      // We'll assume if the adapter fell back, it used the fallback utility which we set usingFallback inside adapter.
      // Since adapters do not expose the flag, we infer fallback when the result matches the preview fallback shape.
      // For simplicity, we set usingFallback based on presence of a `readinessPercent` field which only exists in fallback.
      if (result && typeof result.readinessPercent !== "undefined") {
        setUsingFallback(true);
      }
      setData(result);
    } catch (e) {
      // On any error, use fallback data.
      setUsingFallback(true);
      setData(getOverviewFallback());
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    if (storeSlug) {
      fetchData();
    }
  }, [storeSlug, fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, usingFallback, refetch };
}
