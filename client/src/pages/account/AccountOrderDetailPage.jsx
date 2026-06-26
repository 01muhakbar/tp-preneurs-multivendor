import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios.ts";
import { fetchOrderCheckoutPayment } from "../../api/orderPayments.ts";
import { isOrderContractFinal } from "../../utils/orderContract.ts";
import { isSplitOperationallyFinal } from "../../utils/splitOperationalTruth.ts";
import AccountOrderDetail2026View from "./AccountOrderDetail2026View.jsx";
import { normalizeOrderDetailFor2026 } from "./accountOrderDetail2026Adapter.js";
import { useAuth } from "../../auth/useAuth.js";

const fetchOrder = async (orderId) => {
  const { data } = await api.get(`/store/orders/my/${orderId}`);
  return data;
};

const shouldPollGroupedOrder = (groupedOrder) => {
  if (!groupedOrder || typeof groupedOrder !== "object") return false;
  if (!isOrderContractFinal(groupedOrder.contract)) return true;
  const groups = Array.isArray(groupedOrder.groups) ? groupedOrder.groups : [];
  return groups.some((group) => !isSplitOperationallyFinal(group));
};

export default function AccountOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user || null;
  const orderQuery = useQuery({
    queryKey: ["account", "orders", id],
    queryFn: () => fetchOrder(id),
    enabled: Boolean(id),
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const order = query.state.data?.data ?? query.state.data?.data?.data ?? null;
      return !isOrderContractFinal(order?.contract) ? 15000 : false;
    },
  });
  const groupedQuery = useQuery({
    queryKey: ["account", "orders", "grouped", id],
    queryFn: () => fetchOrderCheckoutPayment(id),
    enabled: Boolean(id),
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const groupedOrder = query.state.data?.data ?? null;
      return shouldPollGroupedOrder(groupedOrder) ? 15000 : false;
    },
  });

  const orderDetail = orderQuery.data?.data ?? orderQuery.data?.data?.data ?? null;
  const paymentReadModel = groupedQuery.data?.data ?? null;
  const orderDetail2026 = orderDetail
    ? normalizeOrderDetailFor2026({
        order: orderDetail,
        payment: paymentReadModel,
      })
    : null;

  const scrollToTimeline = () => {
    document
      .getElementById("aod-order-timeline")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened.");
  };

  const openUrl = (url) => {
    if (!url) return false;
    if (/^https?:\/\//i.test(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    }
    navigate(url);
    return true;
  };

  const handleInvoice = (action) => {
    if (action?.url && openUrl(action.url)) {
      toast.success("Invoice opened.");
      return;
    }
    window.print();
    toast.success("Invoice print fallback opened.");
  };

  const handleTrack = (action) => {
    if (action?.url && openUrl(action.url)) {
      toast.success("Tracking opened.");
      return;
    }
    if (action?.path && openUrl(action.path)) {
      return;
    }
    scrollToTimeline();
  };

  const handleCopy = async (value, message = "Copied.") => {
    const normalized = String(value || "").trim();
    if (!normalized) return;
    try {
      await navigator.clipboard.writeText(normalized);
      toast.success(message);
    } catch {
      toast.error("Copy failed.");
    }
  };

  const handleRetry = () => {
    orderQuery.refetch();
    groupedQuery.refetch();
  };
  const handleContactSupport = () => {
    const target =
      orderDetail2026?.actionability?.contactSupport?.path ||
      `/contact-us?topic=order&ref=${encodeURIComponent(orderDetail2026?.order?.code || id || "")}`;
    navigate(target);
  };
  const invalidIdError = !id ? new Error("Invalid order id.") : null;
  const missingOrderError =
    !orderQuery.isLoading && !orderQuery.isError && id && !orderDetail
      ? new Error("Order not found.")
      : null;

  return (
    <AccountOrderDetail2026View
      orderDetail={orderDetail2026}
      isLoading={orderQuery.isLoading}
      error={invalidIdError || (orderQuery.isError ? orderQuery.error : null) || missingOrderError}
      LinkComponent={Link}
      onPrint={handlePrint}
      onInvoice={handleInvoice}
      onTrack={handleTrack}
      onTimeline={scrollToTimeline}
      onContactSupport={handleContactSupport}
      onCopy={handleCopy}
      onRetry={handleRetry}
      rawOrder={orderDetail}
      groupedOrder={paymentReadModel}
      user={user}
    />
  );
}
