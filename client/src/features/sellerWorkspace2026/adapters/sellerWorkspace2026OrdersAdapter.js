import { getSellerStoreProfile } from "../../../api/sellerStoreProfile.ts";
import { getSellerWorkspaceContextBySlug } from "../../../api/sellerWorkspace.ts";
import { getSellerSuborders, getSellerSuborderDetail, updateSellerSuborderFulfillment } from "../../../api/sellerOrders.ts";
import { getOrdersFallback, getOrderDetailFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

const STATUS_MAP = {
  pending: "New",
  new: "New",
  unpaid: "New",
  paid: "Paid",
  payment_verified: "Paid",
  processing: "Processing",
  ready_to_ship: "Ready to Ship",
  packed: "Packed",
  shipped: "Shipped",
  in_transit: "Shipped",
  delivered: "Completed",
  completed: "Completed",
  cancelled: "Cancelled",
  returned: "Return / Refund",
  refund: "Return / Refund",
  refunded: "Return / Refund",
  failed: "Failed",
  unfulfilled: "New",
};

const PAYMENT_MAP = {
  paid: "Paid",
  pending: "Pending",
  unpaid: "Pending",
  cod: "COD",
  failed: "Failed",
  refunded: "Refunded",
  cancelled: "Failed",
  partially_paid: "Pending"
};

const mapStatus = (raw) => STATUS_MAP[raw?.toLowerCase()] || "Unknown";
const mapPaymentStatus = (raw) => PAYMENT_MAP[raw?.toLowerCase()] || "Unknown";
const getPaymentMethodLabel = (source) =>
  source?.paymentMethodLabel ||
  source?.paymentSummary?.paymentMethodLabel ||
  source?.paymentSummary?.paymentMethod ||
  source?.paymentSummary?.paymentChannel ||
  source?.paymentSummary?.paymentType ||
  source?.paymentMethod ||
  "Unknown";

export const fetchSellerWorkspace2026Orders = async (storeSlug, params = {}) => {
  try {
    const context = await getSellerWorkspaceContextBySlug(storeSlug);
    const storeProfile = context?.store
      ? {
          id: context.store.id,
          slug: context.store.slug,
          name: context.store.name,
          status: context.store.status,
        }
      : null;
    if (!storeProfile) {
      return getOrdersFallback();
    }

    const data = await getSellerSuborders(storeProfile.id, params);
    if (!data) {
      return getOrdersFallback();
    }

    const orders = data.items.map((item) => ({
      id: item.suborderId,
      orderId: item.orderId,
      suborderId: item.suborderId,
      customerName: item.buyer?.name || "Customer",
      customerPhone: item.buyer?.phone || "",
      productSummary: `${item.itemCount} items`,
      products: [],
      channel: item.checkoutMode || "Web",
      paymentStatus: mapPaymentStatus(item.paymentStatus),
      paymentMethod: getPaymentMethodLabel(item),
      fulfillmentStatus: mapStatus(item.fulfillmentStatus),
      courier: item.readModel?.parentOrder?.checkoutMode === "MULTI_STORE" ? "Platform Courier" : "Unknown",
      service: "Standard",
      trackingNumber: item.shipments?.[0]?.trackingNumber || null,
      total: item.totalAmount || 0,
      slaLabel: item.fulfillmentStatusMeta?.label || "Processing SLA",
      slaStatus: item.fulfillmentStatusMeta?.tone === "critical" ? "error" : "normal",
      orderedAt: item.createdAt,
      updatedAt: item.updatedAt || item.createdAt
    }));

    return {
      store: {
        id: storeProfile.id,
        slug: storeProfile.slug,
        name: storeProfile.name,
        status: storeProfile.status
      },
      summary: {
        newOrders: orders.filter(o => o.fulfillmentStatus === "New").length,
        processing: orders.filter(o => o.fulfillmentStatus === "Processing").length,
        readyToShip: orders.filter(o => o.fulfillmentStatus === "Ready to Ship" || o.fulfillmentStatus === "Packed").length,
        shipped: orders.filter(o => o.fulfillmentStatus === "Shipped").length,
        completed: orders.filter(o => o.fulfillmentStatus === "Completed").length,
        returns: orders.filter(o => o.fulfillmentStatus === "Return / Refund").length,
        codOrPendingPayment: orders.filter(o => o.paymentStatus === "Pending" || o.paymentStatus === "COD").length,
        overdueSla: orders.filter(o => o.slaStatus === "error").length
      },
      filters: {
        statuses: [],
        paymentStatuses: [],
        couriers: [],
        channels: []
      },
      orders,
      meta: {
        page: data.pagination?.page || 1,
        pageSize: data.pagination?.limit || 20,
        total: data.pagination?.total || orders.length,
        usingLiveData: true
      }
    };
  } catch (error) {
    console.error("Orders Adapter Error:", error);
    const fallback = getOrdersFallback();
    fallback.meta.usingLiveData = false;
    return fallback;
  }
};

export const fetchSellerWorkspace2026OrderDetail = async (storeSlug, suborderId) => {
  try {
    const storeProfile = await getSellerStoreProfile(storeSlug);
    if (!storeProfile) return getOrderDetailFallback(suborderId);

    const data = await getSellerSuborderDetail(storeProfile.id, suborderId);
    if (!data) return getOrderDetailFallback(suborderId);

    return {
      id: data.suborderId,
      orderId: data.orderId,
      suborderId: data.suborderId,
      storeId: storeProfile.id,
      customer: {
        name: data.buyer?.name || "Customer",
        phone: data.buyer?.phone || "",
        email: data.buyer?.email || ""
      },
      shippingAddress: data.shipping?.addressLine || "No Address Provided",
      products: data.items || [],
      payment: {
        status: mapPaymentStatus(data.paymentStatus),
        method: getPaymentMethodLabel(data),
        total: data.totals?.totalAmount || 0
      },
      fulfillment: {
        status: mapStatus(data.fulfillmentStatus),
        courier: data.shipments?.[0]?.courier || "Unknown",
        service: data.shipments?.[0]?.service || "Standard",
        trackingNumber: data.shipments?.[0]?.trackingNumber || null,
        slaLabel: data.fulfillmentStatusMeta?.label || "Processing",
        slaStatus: data.fulfillmentStatusMeta?.tone === "critical" ? "error" : "normal"
      },
      timeline: data.shipments?.[0]?.trackingEvents?.map(e => ({
        key: e.id || Math.random().toString(),
        label: e.description || "Updated",
        timestamp: e.date
      })) || [],
      notes: data.readModel?.operationalNote || "",
      allowedActions: data.governance?.fulfillment?.availableActions?.filter(a => a.enabled).map(a => a.code) || [],
      meta: {
        usingLiveData: true
      }
    };
  } catch (error) {
    console.error("OrderDetail Adapter Error:", error);
    const fallback = getOrderDetailFallback(suborderId);
    fallback.meta.usingLiveData = false;
    return fallback;
  }
};

export const updateSellerWorkspace2026FulfillmentStatus = async ({ storeSlug, suborderId, action }) => {
  const storeProfile = await getSellerStoreProfile(storeSlug);
  if (!storeProfile) throw new Error("Store profile not found");
  
  return updateSellerSuborderFulfillment(storeProfile.id, suborderId, {
    action
  });
};

export const updateSellerWorkspace2026TrackingNumber = async ({ storeSlug, suborderId, trackingNumber, courierCode }) => {
  const storeProfile = await getSellerStoreProfile(storeSlug);
  if (!storeProfile) throw new Error("Store profile not found");
  
  return updateSellerSuborderFulfillment(storeProfile.id, suborderId, {
    action: "MARK_SHIPPED",
    trackingNumber,
    courierCode
  });
};
