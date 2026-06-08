import { useState, useEffect, useCallback, useRef } from "react";
import { fetchSellerWorkspace2026ProductCatalog } from "../adapters/sellerWorkspace2026ProductCatalogAdapter.js";
import { getProductCatalogFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

/**
 * Hook: Product Catalog data for Seller Workspace 2026 preview layer.
 *
 * @param {string} storeSlug  - The store slug from the preview route (:storeSlug).
 * @param {object} initialFilters - Optional initial filter values.
 *
 * Returns:
 *   { data, loading, error, usingFallback, filters, setFilters, refetch }
 *
 * NOTE: Filtering is applied client-side in the preview layer.
 * The adapter already passes filters to the API when possible.
 * If the API does not support a given filter parameter, filtering
 * falls back to frontend-only filtering on the mapped product list.
 */
export function useSellerWorkspace2026ProductCatalog(storeSlug, initialFilters = {}) {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Filters: used for both API query params and client-side filtering
  const [filters, setFilters] = useState({
    keyword: "",
    status: "",
    submissionStatus: "",
    visibilityState: "",
    sort: "",
    page: 1,
    limit: 20,
    ...initialFilters,
  });

  // Track mounted state to avoid setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!storeSlug) return;

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
      setUsingFallback(false);
    }

    try {
      const result = await fetchSellerWorkspace2026ProductCatalog(storeSlug, filters);

      if (!mountedRef.current) return;

      if (!result || !result.meta?.usingLiveData) {
        // Adapter returned fallback
        setUsingFallback(true);
        setRawData(result ?? getProductCatalogFallback());
      } else {
        setUsingFallback(false);
        setRawData(result);
      }
    } catch (e) {
      if (!mountedRef.current) return;
      setUsingFallback(true);
      setRawData(getProductCatalogFallback());
      setError(e);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [storeSlug, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Client-side filtering for the preview layer
  // When API supports the filter param, these will be redundant (harmless).
  // When API does not, this ensures the UI is still responsive to filter changes.
  // ---------------------------------------------------------------------------
  const applyClientFilters = (products) => {
    if (!Array.isArray(products)) return [];
    let result = products;

    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title ?? "").toLowerCase().includes(kw) ||
          (p.sku ?? "").toLowerCase().includes(kw)
      );
    }

    if (filters.status) {
      const target = filters.status === "active"
        ? "Published"
        : filters.status === "inactive"
        ? "Hidden"
        : "Draft";
      result = result.filter((p) => p.status === target);
    }

    if (filters.submissionStatus) {
      const rsMap = {
        none: "Not Submitted",
        submitted: "In Review",
        needs_revision: "Revision Required",
      };
      const target = rsMap[filters.submissionStatus];
      if (target) {
        result = result.filter((p) => p.reviewStatus === target);
      }
    }

    return result;
  };

  // Build the public data shape
  const data = rawData
    ? {
        ...rawData,
        products: applyClientFilters(rawData.products),
      }
    : null;

  return {
    data,
    loading,
    error,
    usingFallback,
    filters,
    setFilters,
    refetch,
  };
}
