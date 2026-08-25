import { useState, useEffect, useCallback } from "react";
import { fetchSellerWorkspace2026PaymentCenter } from "../adapters/sellerWorkspace2026PaymentCenterAdapter.js";
import { getPaymentCenterFallback } from "../utils/sellerWorkspace2026Fallbacks.js";
import { reviewSellerStorePayment } from "../../../api/sellerPayments.ts";
import { listSellerWithdrawals, requestWithdrawal as apiRequestWithdrawal } from "../../../api/sellerWithdrawals.ts";

export function useSellerWorkspace2026PaymentCenter(storeSlug) {
  const [data, setData] = useState(getPaymentCenterFallback());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalMeta, setWithdrawalMeta] = useState(null);

  const [actionState, setActionState] = useState({
    isUpdating: false,
    error: null,
    successMessage: null
  });

  const fetchData = useCallback(async () => {
    if (!storeSlug) {
      const fallback = getPaymentCenterFallback();
      fallback.paymentReviews = [];
      fallback.meta.usingLiveData = false;
      fallback.meta.message = "Payment data is not available for this store yet.";
      setData(fallback);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSellerWorkspace2026PaymentCenter(storeSlug);
      setData(result || getPaymentCenterFallback());
      if (result?.store?.id) {
        const history = await listSellerWithdrawals(result.store.id).catch(() => ({ data: [] }));
        setWithdrawals(history?.data || []);
        setWithdrawalMeta(history?.meta || null);
      } else {
        setWithdrawals([]);
        setWithdrawalMeta(null);
      }
    } catch (err) {
      console.error("Payment Center Hook Error:", err);
      setError(err);
      const fallback = getPaymentCenterFallback();
      fallback.meta.usingLiveData = false;
      fallback.meta.message = err?.message || "Unable to load payment center data.";
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

  const requestWithdrawal = useCallback(async (amount) => {
    if (!data.store?.id) return;
    setActionState({ isUpdating: true, error: null, successMessage: null });
    try {
      await apiRequestWithdrawal(data.store.id, amount);
      setActionState({ isUpdating: false, error: null, successMessage: "Withdrawal requested successfully." });
      await fetchData();
      return { success: true };
    } catch (err) {
      setActionState({ isUpdating: false, error: err.response?.data?.message || "Failed to request withdrawal", successMessage: null });
      return { success: false };
    }
  }, [data, fetchData]);

  useEffect(() => {
    if (!actionState.error && !actionState.successMessage) return;
    const timer = setTimeout(() => {
      setActionState(prev => ({ ...prev, error: null, successMessage: null }));
    }, 3000);
    return () => clearTimeout(timer);
  }, [actionState.error, actionState.successMessage]);

  return {
    data,
    loading,
    error,
    usingFallback: !data.meta.usingLiveData,
    selectedPaymentId,
    setSelectedPaymentId,
    withdrawals,
    withdrawalMeta,
    refetch: fetchData,
    actions: {
      approvePayment,
      rejectPayment,
      requestWithdrawal,
      requestRecheck: async () => {}, // Disabled pending backend route
      submitPaymentProfile: async () => {}, // Handled by separate page if needed, disabled here
      updatePaymentProfile: async () => {} // Handled by separate page if needed, disabled here
    },
    actionState
  };
}
