import { useState, useEffect, useCallback } from "react";
import { fetchSellerWorkspace2026Orders, fetchSellerWorkspace2026OrderDetail } from "../adapters/sellerWorkspace2026OrdersAdapter.js";
import { getOrdersFallback, getOrderDetailFallback } from "../utils/sellerWorkspace2026Fallbacks.js";
import { updateSellerSuborderFulfillment } from "../../../api/sellerOrders.ts";

export function useSellerWorkspace2026Orders(storeSlug) {
  const [data, setData] = useState(getOrdersFallback());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    payment: "",
    courier: "",
    channel: "",
    search: ""
  });

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
      const result = await fetchSellerWorkspace2026Orders(storeSlug, {
        fulfillmentStatus: filters.status || undefined,
        paymentStatus: filters.payment || undefined,
        keyword: filters.search || undefined
      });
      setData(result);
    } catch (err) {
      console.error("Orders Hook Error:", err);
      setError(err);
      const fallback = getOrdersFallback();
      fallback.meta.usingLiveData = false;
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [storeSlug, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null);
      return;
    }
    const loadDetail = async () => {
      setLoadingDetail(true);
      try {
        const detail = await fetchSellerWorkspace2026OrderDetail(storeSlug, selectedOrderId);
        setSelectedOrder(detail);
      } catch (err) {
        console.error("Failed to load order detail:", err);
        const fallback = getOrderDetailFallback(selectedOrderId);
        fallback.meta.usingLiveData = false;
        setSelectedOrder(fallback);
      } finally {
        setLoadingDetail(false);
      }
    };
    loadDetail();
  }, [selectedOrderId, storeSlug]);

  const updateFulfillmentStatus = useCallback(async (actionCode, extraPayload = {}) => {
    if (!selectedOrder?.meta?.usingLiveData || !selectedOrder?.storeId || !selectedOrder?.suborderId) {
      setActionState(prev => ({ ...prev, error: "Cannot perform action: Invalid order context or fallback data is active." }));
      return;
    }
    
    if (!selectedOrder.allowedActions?.includes(actionCode)) {
      setActionState(prev => ({ ...prev, error: `Action ${actionCode} is not allowed for this order's current lifecycle state.` }));
      return;
    }
    
    setActionState(prev => ({ ...prev, isUpdating: true, error: null, successMessage: null }));
    try {
      await updateSellerSuborderFulfillment(selectedOrder.storeId, selectedOrder.suborderId, {
        action: actionCode,
        ...extraPayload
      });
      
      setActionState(prev => ({ ...prev, successMessage: "Status updated successfully" }));
      
      // Refresh both list and detail
      await fetchData();
      const newDetail = await fetchSellerWorkspace2026OrderDetail(storeSlug, selectedOrderId);
      setSelectedOrder(newDetail);
      
      setTimeout(() => setActionState(prev => ({ ...prev, successMessage: null })), 3000);
    } catch (err) {
      console.error("Failed to update status:", err);
      setActionState(prev => ({ ...prev, error: err?.message || "Failed to update fulfillment status" }));
    } finally {
      setActionState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [selectedOrder, storeSlug, selectedOrderId, fetchData]);

  const updateTrackingNumber = useCallback(async (trackingNumber, courierCode, courierService) => {
    if (!trackingNumber || trackingNumber.trim() === "") {
      setActionState(prev => ({ ...prev, error: "Tracking number cannot be empty." }));
      return;
    }
    await updateFulfillmentStatus("MARK_SHIPPED", {
      trackingNumber,
      courierCode,
      courierService
    });
  }, [updateFulfillmentStatus]);

  const markReadyToShip = useCallback(async () => {
    await updateFulfillmentStatus("MARK_PROCESSING");
  }, [updateFulfillmentStatus]);

  return {
    data,
    loading,
    error,
    usingFallback: !data.meta.usingLiveData,
    filters,
    setFilters,
    selectedOrderId,
    setSelectedOrderId,
    selectedOrder,
    loadingDetail,
    refetch: fetchData,
    actions: {
      updateFulfillmentStatus,
      updateTrackingNumber,
      markReadyToShip
    },
    actionState
  };
}
