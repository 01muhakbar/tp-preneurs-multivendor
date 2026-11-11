import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useParams, useOutletContext, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../api/axios.ts";
import { fetchOrderCheckoutPayment } from "../../api/orderPayments.ts";
import { isOrderContractFinal } from "../../utils/orderContract.ts";
import { isSplitOperationallyFinal } from "../../utils/splitOperationalTruth.ts";
import AccountOrderDetail2026View from "./AccountOrderDetail2026View.jsx";
import { isIndonesianLanguage, normalizeOrderDetailFor2026 } from "./accountOrderDetail2026Adapter.js";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = useAuth();
  const user = auth?.user || null;
  const { dashboardSettingCopy } = useOutletContext() || {};
  const { i18n } = useTranslation();
  const [, setLangSync] = useState(0);

  const isIndo = isIndonesianLanguage(i18n);

  const duitkuReturn = searchParams.get("duitkuReturn") === "1";
  const resultCode = searchParams.get("resultCode") || searchParams.get("responseCode");
  const returnReference = searchParams.get("reference") || searchParams.get("merchantOrderId") || "";
  const isPaymentSuccessReturn = duitkuReturn && (resultCode === "00" || resultCode === "0");

  const [isSuccessModalDismissed, setIsSuccessModalDismissed] = useState(false);
  const showPaymentSuccessModal = isPaymentSuccessReturn && !isSuccessModalDismissed;

  useEffect(() => {
    const handleSync = () => setLangSync((c) => c + 1);
    i18n?.on?.("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("store_language_changed", handleSync);
    return () => {
      i18n?.off?.("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("store_language_changed", handleSync);
    };
  }, [i18n]);

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

  // Fast-polling when returning from Duitku with success to ensure webhook state syncs smoothly
  useEffect(() => {
    if (!isPaymentSuccessReturn) return;
    let pollCount = 0;
    const interval = setInterval(() => {
      pollCount += 1;
      orderQuery.refetch();
      groupedQuery.refetch();
      if (pollCount >= 6) {
        clearInterval(interval);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [isPaymentSuccessReturn]);

  // Unsuccessful return notification
  useEffect(() => {
    if (duitkuReturn && resultCode && resultCode !== "00" && resultCode !== "0") {
      toast.error(
        isIndo
          ? "Pembayaran belum terselesaikan. Anda dapat mencoba kembali melalui tombol Bayar Sekarang."
          : "Payment was not completed. You can try again using the Pay Now button."
      );
      const clean = new URLSearchParams(searchParams);
      clean.delete("duitkuReturn");
      clean.delete("resultCode");
      clean.delete("responseCode");
      setSearchParams(clean, { replace: true });
    }
  }, [duitkuReturn, resultCode, isIndo, searchParams, setSearchParams]);

  const handleCloseSuccessModal = () => {
    setIsSuccessModalDismissed(true);
    const clean = new URLSearchParams(searchParams);
    clean.delete("duitkuReturn");
    clean.delete("resultCode");
    clean.delete("responseCode");
    clean.delete("reference");
    clean.delete("merchantOrderId");
    clean.delete("statusCode");
    setSearchParams(clean, { replace: true });
  };

  const handleTrackFromSuccessModal = () => {
    handleCloseSuccessModal();
    setTimeout(() => {
      scrollToTimeline();
    }, 150);
  };

  const orderDetail = orderQuery.data?.data ?? orderQuery.data?.data?.data ?? null;
  const paymentReadModel = groupedQuery.data?.data ?? null;
  let orderDetail2026 = null;
  let adapterError = null;

  if (orderDetail) {
    try {
      orderDetail2026 = normalizeOrderDetailFor2026({
        order: orderDetail,
        payment: paymentReadModel,
        isIndo,
        isPaymentSuccessReturn,
      });
    } catch (err) {
      console.error("[AccountOrderDetailPage] adapter error", err);
      adapterError = err;
    }
  }

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

  const [isCancelling, setIsCancelling] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const handleCancelOrder = async () => {
    if (!id || isCancelling) return;
    setIsCancelling(true);
    try {
      await api.post(`/store/orders/my/${id}/cancel`);
      toast.success(isIndo ? "Pesanan berhasil dibatalkan." : "Order successfully cancelled.");
      await Promise.all([orderQuery.refetch(), groupedQuery.refetch()]);
    } catch (err) {
      console.error("[AccountOrderDetailPage] cancel error", err);
      const msg = err?.response?.data?.message || (isIndo ? "Gagal membatalkan pesanan." : "Failed to cancel order.");
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePayNow = async () => {
    if (!id || isPaying) return;
    const directUrl =
      orderDetail2026?.actionability?.payment?.url ||
      orderDetail?.paymentUrl ||
      paymentReadModel?.paymentUrl;
    if (directUrl && /^https?:\/\//i.test(directUrl)) {
      window.location.href = directUrl;
      return;
    }

    setIsPaying(true);
    try {
      const { data } = await api.post(`/store/orders/my/${id}/pay`);
      if (data?.paymentUrl && /^https?:\/\//i.test(data.paymentUrl)) {
        window.location.href = data.paymentUrl;
      } else {
        toast.error(isIndo ? "Sesi pembayaran tidak valid." : "Invalid payment session.");
      }
    } catch (err) {
      console.error("[AccountOrderDetailPage] pay error", err);
      const msg = err?.response?.data?.message || (isIndo ? "Gagal mengarahkan ke pembayaran Duitku." : "Failed to initiate payment.");
      toast.error(msg);
    } finally {
      setIsPaying(false);
    }
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
      error={invalidIdError || (orderQuery.isError ? orderQuery.error : null) || missingOrderError || adapterError}
      LinkComponent={Link}
      onPrint={handlePrint}
      onInvoice={handleInvoice}
      onTrack={handleTrack}
      onTimeline={scrollToTimeline}
      onContactSupport={handleContactSupport}
      onCancelOrder={handleCancelOrder}
      isCancelling={isCancelling}
      onPayNow={handlePayNow}
      isPaying={isPaying}
      onCopy={handleCopy}
      onRetry={handleRetry}
      rawOrder={orderDetail}
      groupedOrder={paymentReadModel}
      user={user}
      dashboardSettingCopy={dashboardSettingCopy}
      isIndo={isIndo}
      showPaymentSuccessModal={showPaymentSuccessModal}
      onCloseSuccessModal={handleCloseSuccessModal}
      onTrackFromSuccessModal={handleTrackFromSuccessModal}
      returnReference={returnReference}
      isPaymentSuccessReturn={isPaymentSuccessReturn}
    />
  );
}
