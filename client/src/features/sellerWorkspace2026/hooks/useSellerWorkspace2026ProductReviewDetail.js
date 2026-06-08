import { useState, useEffect, useCallback } from "react";
import { fetchSellerWorkspace2026ProductReviewDetail } from "../adapters/sellerWorkspace2026ProductReviewDetailAdapter.js";
import { getProductReviewDetailFallback } from "../utils/sellerWorkspace2026Fallbacks.js";
import {
  submitSellerProductDraftForReview,
  updateSellerProductDraft,
  duplicateSellerProduct
} from "../../../api/sellerProducts.ts";

export function useSellerWorkspace2026ProductReviewDetail(storeSlug, productId) {
  const [data, setData] = useState(getProductReviewDetailFallback(productId));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionState, setActionState] = useState({
    isSubmitting: false,
    isSaving: false,
    isDuplicating: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!storeSlug || !productId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSellerWorkspace2026ProductReviewDetail(storeSlug, productId);
      setData(result);
    } catch (err) {
      console.error("useSellerWorkspace2026ProductReviewDetail error:", err);
      setError(err);
      const fallback = getProductReviewDetailFallback(productId);
      fallback.meta.usingLiveData = false;
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [storeSlug, productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveChanges = useCallback(async (payload) => {
    if (!data.meta.usingLiveData || !data.store.id) return;
    setActionState(prev => ({ ...prev, isSaving: true, error: null }));
    try {
      await updateSellerProductDraft(data.store.id, productId, payload);
      await fetchData();
    } catch (err) {
      setActionState(prev => ({ ...prev, error: err }));
    } finally {
      setActionState(prev => ({ ...prev, isSaving: false }));
    }
  }, [data, productId, fetchData]);

  const submitForReview = useCallback(async () => {
    if (!data.meta.usingLiveData || !data.store.id) return;
    setActionState(prev => ({ ...prev, isSubmitting: true, error: null }));
    try {
      await submitSellerProductDraftForReview(data.store.id, productId);
      await fetchData();
    } catch (err) {
      setActionState(prev => ({ ...prev, error: err }));
    } finally {
      setActionState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [data, productId, fetchData]);

  const duplicateProduct = useCallback(async () => {
    if (!data.meta.usingLiveData || !data.store.id) return;
    setActionState(prev => ({ ...prev, isDuplicating: true, error: null }));
    try {
      const duplicated = await duplicateSellerProduct(data.store.id, productId);
      return duplicated;
    } catch (err) {
      setActionState(prev => ({ ...prev, error: err }));
      throw err;
    } finally {
      setActionState(prev => ({ ...prev, isDuplicating: false }));
    }
  }, [data, productId]);

  return {
    data,
    loading,
    error,
    usingFallback: !data.meta.usingLiveData,
    refetch: fetchData,
    actions: {
      saveChanges,
      submitForReview,
      resubmitForReview: submitForReview,
      duplicateProduct
    },
    actionState
  };
}
