import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchSellerWorkspace2026ProductAuthoringContext,
  saveProductDraft,
  submitProductForReview
} from "../adapters/sellerWorkspace2026ProductAuthoringAdapter.js";
import { getProductAuthoringFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

/**
 * Hook: Product Authoring data for Seller Workspace 2026 preview layer.
 *
 * @param {string} storeSlug  - The store slug from the preview route (:storeSlug).
 * @param {string} productId  - Optional productId if in edit mode.
 */
export function useSellerWorkspace2026ProductAuthoring(storeSlug, productId = null) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [validation, setValidation] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [error, setError] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

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
      const result = await fetchSellerWorkspace2026ProductAuthoringContext(storeSlug);

      if (!mountedRef.current) return;

      if (!result || result.meta?.usingLiveData === false) {
        setUsingFallback(true);
        const fallback = result || getProductAuthoringFallback();
        setData(fallback);
        setForm(fallback.form);
        setValidation(fallback.validation);
      } else {
        setUsingFallback(false);
        setData(result);
        setForm(result.form);
        setValidation(result.validation);
      }
    } catch (e) {
      if (!mountedRef.current) return;
      setUsingFallback(true);
      const fallback = getProductAuthoringFallback();
      setData(fallback);
      setForm(fallback.form);
      setValidation(fallback.validation);
      setError(e);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [storeSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const saveDraft = useCallback(async () => {
    if (!data?.store?.id || usingFallback) return;

    if (mountedRef.current) {
      setSaving(true);
      setSaveResult(null);
    }

    try {
      const result = await saveProductDraft({ storeId: data.store.id, form, productId: data.meta.productId });
      if (mountedRef.current) {
        setSaveResult({ success: true, data: result });
        // Assume API returns saved product data, including ID
        if (result?.productId) {
            setData(prev => ({
                ...prev,
                meta: {
                    ...prev.meta,
                    productId: result.productId,
                    status: result.status || "draft"
                },
                validation: {
                    ...prev.validation,
                    canSubmitReview: true // Ensure validation allows submit
                }
            }));
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setSaveResult({ success: false, error: err });
      }
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  }, [data, form, usingFallback]);

  const submitForReview = useCallback(async () => {
    if (!data?.store?.id || !data?.meta?.productId || usingFallback) return;

    if (mountedRef.current) {
      setSubmitting(true);
      setSubmitResult(null);
    }

    try {
      const result = await submitProductForReview({ storeId: data.store.id, productId: data.meta.productId });
      if (mountedRef.current) {
        setSubmitResult({ success: true, data: result });
        setData(prev => ({
            ...prev,
            meta: {
                ...prev.meta,
                reviewStatus: result.reviewStatus || "submitted"
            }
        }));
      }
    } catch (err) {
      if (mountedRef.current) {
        setSubmitResult({ success: false, error: err });
      }
    } finally {
      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  }, [data, usingFallback]);

  return {
    data,
    form,
    setForm,
    loading,
    saving,
    submitting,
    error,
    saveResult,
    submitResult,
    usingFallback,
    validation,
    saveDraft,
    submitForReview,
    refetch,
  };
}
