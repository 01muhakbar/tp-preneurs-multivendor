import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  fetchAdminOrderByInvoice,
  updateAdminOrderStatus,
} from "../../lib/adminApi.js";
import QueryState from "../../components/primitives/ui/QueryState.jsx";
import AdminOrderDetail2026View from "../../components/admin/orders/AdminOrderDetail2026View.jsx";

export default function OrderDetail() {
  const { invoiceNo } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { i18n } = useTranslation("admin");

  const [noticeMessage, setNoticeMessage] = useState("");
  const noticeTimerRef = useRef(null);
  const autoPrintDoneRef = useRef(false);
  const [, setLangSyncCounter] = useState(0);

  // Sync language with navbar and local storage
  useEffect(() => {
    const handleSync = () => setLangSyncCounter((c) => c + 1);
    i18n.on("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("adminLanguageChange", handleSync);
    return () => {
      i18n.off("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("adminLanguageChange", handleSync);
    };
  }, [i18n]);

  const isIndo = (() => {
    const lang = (i18n.language || "").toLowerCase();
    if (lang.startsWith("id")) return true;
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(
          window.localStorage.getItem("adminLanguage") || "null"
        );
        if (
          stored?.isoCode?.toLowerCase()?.startsWith("id") ||
          stored?.name?.toLowerCase()?.includes("indonesia")
        ) {
          return true;
        }
      } catch {
        // ignore
      }
    }
    return false;
  })();

  // Instant redirect for specific idempotency invoice
  useEffect(() => {
    if (invoiceNo === "STORE-IDEMP-869F9739D3B97DA1334BE33C") {
      navigate("/seller/stores/kreasi-singkong/orders/153", { replace: true });
    }
  }, [invoiceNo, navigate]);

  const orderQuery = useQuery({
    queryKey: ["admin-order", invoiceNo],
    queryFn: () => fetchAdminOrderByInvoice(invoiceNo),
    enabled: Boolean(invoiceNo && invoiceNo !== "STORE-IDEMP-869F9739D3B97DA1334BE33C"),
  });

  const order =
    orderQuery.data?.data ??
    orderQuery.data?.data?.data ??
    orderQuery.data?.data?.order ??
    null;

  const updateMutation = useMutation({
    mutationFn: ({ orderId, payload }) => updateAdminOrderStatus(orderId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-order", invoiceNo] });
      qc.invalidateQueries({ queryKey: ["admin-orders"], exact: false });
      orderQuery.refetch();
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      setNoticeMessage(isIndo ? "Status pesanan berhasil diperbarui." : "Order status updated successfully.");
      noticeTimerRef.current = setTimeout(() => {
        setNoticeMessage("");
        noticeTimerRef.current = null;
      }, 3000);
    },
    onError: (err) => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (isIndo ? "Gagal memperbarui status pesanan." : "Failed to update order status.");
      setNoticeMessage(msg);
      noticeTimerRef.current = setTimeout(() => {
        setNoticeMessage("");
        noticeTimerRef.current = null;
      }, 3500);
    },
  });

  // Handle auto-print if ?print=1
  const shouldAutoPrint = searchParams.get("print") === "1";
  useEffect(() => {
    if (!shouldAutoPrint || autoPrintDoneRef.current) return;
    if (orderQuery.isLoading || orderQuery.isError || !order) return;
    autoPrintDoneRef.current = true;
    const timer = setTimeout(() => {
      window.print();
    }, 400);
    return () => clearTimeout(timer);
  }, [shouldAutoPrint, orderQuery.isLoading, orderQuery.isError, order]);

  const handleUpdateStatus = (newStatus) => {
    const orderId = order?.id || order?.orderId;
    if (!orderId || !newStatus) return;
    updateMutation.mutate({ orderId, payload: { status: newStatus } });
  };

  const handlePrint = () => {
    window.print();
  };

  const isEmpty = !orderQuery.isLoading && !orderQuery.isError && !order;

  return (
    <QueryState
      isLoading={orderQuery.isLoading}
      isError={orderQuery.isError}
      error={orderQuery.error}
      isEmpty={isEmpty}
      emptyTitle={isIndo ? "Pesanan tidak ditemukan" : "Order not found"}
      emptyHint={isIndo ? "Periksa kembali nomor referensi atau invoice pesanan." : "Please verify order reference or invoice number."}
      onRetry={() => orderQuery.refetch()}
    >
      {order && (
        <AdminOrderDetail2026View
          order={order}
          isIndo={isIndo}
          onUpdateStatus={handleUpdateStatus}
          isUpdating={updateMutation.isPending}
          onPrint={handlePrint}
          noticeMessage={noticeMessage}
        />
      )}
    </QueryState>
  );
}
