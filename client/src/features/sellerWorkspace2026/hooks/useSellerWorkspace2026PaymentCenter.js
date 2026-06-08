import { useState, useEffect, useCallback } from "react";
import { fetchSellerWorkspace2026PaymentCenter } from "../adapters/sellerWorkspace2026PaymentCenterAdapter.js";
import { getPaymentCenterFallback } from "../utils/sellerWorkspace2026Fallbacks.js";
import { reviewSellerStorePayment } from "../../../api/sellerPayments.ts";

export function useSellerWorkspace2026PaymentCenter(storeSlug) {
  const [data, setData] = useState(getPaymentCenterFallback());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

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
      const result = await fetchSellerWorkspace2026PaymentCenter(storeSlug);
      setData(result);
    } catch (err) {
      console.error("Payment Center Hook Error:", err);
      setError(err);
      const fallback = getPaymentCenterFallback();
      fallback.meta.usingLiveData = false;
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const approvePayment = useCallback(async (paymentId, note = "") => {
    if (!data.meta.usingLiveData || !data.store?.id) return;
    
    setActionState({ isUpdating: true, error: null, successMessage: null });
    // Mutation disabled for hardening
    setActionState({ isUpdating: false, error: "Payment actions require live payment review permissions and active endpoints.", successMessage: null });
    setTimeout(() => setActionState(prev => ({ ...prev, error: null })), 3000);
  }, [data, fetchData]);

  const rejectPayment = useCallback(async (paymentId, note = "") => {
    if (!data.meta.usingLiveData || !data.store?.id) return;

    setActionState({ isUpdating: true, error: null, successMessage: null });
    // Mutation disabled for hardening
    setActionState({ isUpdating: false, error: "Payment actions require live payment review permissions and active endpoints.", successMessage: null });
    setTimeout(() => setActionState(prev => ({ ...prev, error: null })), 3000);
  }, [data, fetchData]);

  return {
    data,
    loading,
    error,
    usingFallback: !data.meta.usingLiveData,
    selectedPaymentId,
    setSelectedPaymentId,
    refetch: fetchData,
    actions: {
      approvePayment,
      rejectPayment,
      requestRecheck: async () => {}, // Disabled pending backend route
      submitPaymentProfile: async () => {}, // Handled by separate page if needed, disabled here
      updatePaymentProfile: async () => {} // Handled by separate page if needed, disabled here
    },
    actionState
  };
}
