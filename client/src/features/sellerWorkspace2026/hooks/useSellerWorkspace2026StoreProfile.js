import { useState, useEffect, useCallback } from "react";
import { fetchSellerWorkspace2026StoreProfile, saveSellerWorkspace2026StoreProfile } from "../adapters/sellerWorkspace2026StoreProfileAdapter.js";
import { getStoreProfileFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

export function useSellerWorkspace2026StoreProfile(storeSlug) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [validation, setValidation] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingFallback(false);
    try {
      const result = await fetchSellerWorkspace2026StoreProfile(storeSlug);
      if (result && result.storefront && result.storefront.syncStatus === "preview") {
        setUsingFallback(true);
      }
      setData(result);
      setForm(result); // initialize form with fetched data
    } catch (e) {
      setUsingFallback(true);
      const fallback = getStoreProfileFallback();
      setData(fallback);
      setForm(fallback);
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

  // Derive validation state
  useEffect(() => {
    if (!form) return;
    const isIdentityComplete = Boolean(form.identity?.name);
    const isContactComplete = Boolean(form.contact?.email && form.contact?.phone);
    setValidation({
      isIdentityComplete,
      isContactComplete,
      isReady: isIdentityComplete && isContactComplete
    });
  }, [form]);

  const saveProfile = async (payloadToSave = form) => {
    if (usingFallback) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const updatedProfile = await saveSellerWorkspace2026StoreProfile({ storeSlug, form: payloadToSave });
      setData(updatedProfile);
      setForm(updatedProfile);
      setSaveResult({ success: true, message: "Profile updated successfully." });
    } catch (err) {
      setSaveResult({ success: false, message: err.message || "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  };

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { 
    data, 
    form,
    setForm,
    loading, 
    saving,
    error, 
    saveResult,
    usingFallback, 
    validation,
    saveProfile,
    refetch 
  };
}
