import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSeller2026Orders } from "../../../hooks/seller2026/useSeller2026Orders.ts";
import { downloadCsvFile } from "../../../utils/exportFiles.js";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import SellerOrders2026View from "../../../features/sellerWorkspace2026/orders/SellerOrders2026View.jsx";

const EXPORT_COLUMNS = [
  { key: "order", label: "Order" },
  { key: "buyer", label: "Buyer" },
  { key: "items", label: "Items" },
  { key: "payment", label: "Payment" },
  { key: "fulfillment", label: "Fulfillment" },
  { key: "total", label: "Total" },
  { key: "updated", label: "Updated" },
];

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export default function Seller2026LiveOrdersPage() {
  const { i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [, setLangSyncCounter] = useState(0);

  useEffect(() => {
    const handleSync = () => setLangSyncCounter((c) => c + 1);
    i18n.on("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      i18n.off("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [i18n]);

  const isIndo = (() => {
    const lang = (i18n.language || "").toLowerCase();
    if (lang.startsWith("id")) return true;
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(
          window.localStorage.getItem("seller_language") || "null"
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
      const storeLang = window.localStorage.getItem("store_language") || "";
      if (
        storeLang.toLowerCase().includes("indonesia") ||
        storeLang.toLowerCase() === "id"
      ) {
        return true;
      }
    }
    return false;
  })();

  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("ORDER_READ");
  const canFulfill = can("ORDER_FULFILLMENT_UPDATE");
  
  const query = {
    search: searchParams.get("q") || "",
    status: searchParams.get("status") || "all",
    paymentStatus: searchParams.get("paymentStatus") || "all",
    fulfillmentStatus: searchParams.get("fulfillmentStatus") || "all",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    channel: searchParams.get("channel") || "all",
    shippingMethod: searchParams.get("shippingMethod") || "all",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 10),
  };

  const orders = useSeller2026Orders(storeId, query, {
    enabled: canView,
    permissions: { canFulfill },
  });

  const [view, setView] = useState("table");
  const [notice, setNotice] = useState(null);

  // If redirected with openDetailId, route to dedicated link page
  useEffect(() => {
    if (location.state?.openDetailId) {
      navigate(workspaceRoutes.orderDetail(location.state.openDetailId), { replace: true });
    }
  }, [location.state?.openDetailId, navigate, workspaceRoutes]);

  const changeQuery = (patch) => {
    const next = new URLSearchParams(searchParams);
    const values = { ...patch, ...(Object.prototype.hasOwnProperty.call(patch, "page") ? {} : { page: 1 }) };
    Object.entries(values).forEach(([key, value]) => {
      const paramKey = key === "search" ? "q" : key;
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "all" ||
        (paramKey === "page" && Number(value) <= 1) ||
        (paramKey === "limit" && Number(value) === 10)
      ) {
        next.delete(paramKey);
      } else {
        next.set(paramKey, String(value));
      }
    });
    setSearchParams(next);
  };

  const rows = orders.data?.suborders || [];
  
  const summaryAmounts = useMemo(() => ({
    pending: rows
      .filter((order) => order.statusBucket === "unpaid" || ["UNPAID", "PENDING_CONFIRMATION", "PARTIALLY_PAID"].includes(order.paymentStatus))
      .reduce((sum, order) => sum + (Number(order.totalAmount || order.total || 0)), 0),
    packing: rows
      .filter((order) => order.statusBucket === "to_pack" || order.status === "PROCESSING" || (order.paymentStatus === "PAID" && !["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.fulfillmentStatus)))
      .reduce((sum, order) => sum + (Number(order.totalAmount || order.total || 0)), 0),
    transit: rows
      .filter((order) => order.statusBucket === "shipping" || order.fulfillmentStatus === "SHIPPED" || order.status === "SHIPPED")
      .reduce((sum, order) => sum + (Number(order.totalAmount || order.total || 0)), 0),
    delivered: rows
      .filter((order) => order.statusBucket === "completed" || order.fulfillmentStatus === "DELIVERED" || order.status === "DELIVERED")
      .reduce((sum, order) => sum + (Number(order.totalAmount || order.total || 0)), 0),
  }), [rows]);

  const exportOrders = () => {
    downloadCsvFile(
      EXPORT_COLUMNS,
      rows.map((order) => ({
        order: order.orderNumber,
        buyer: order.customerName,
        items: order.itemsCount,
        payment: order.paymentLabel,
        fulfillment: order.fulfillmentLabel,
        total: order.totalAmount,
        updated: order.updatedLabel,
      })),
      `seller-orders-${new Date().toISOString().slice(0, 10)}.csv`
    );
    setNotice({
      type: "success",
      text: isIndo
        ? `${rows.length} pesanan berhasil diekspor.`
        : `${rows.length} visible order(s) exported.`,
    });
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
    setNotice(null);
  };

  const copyOrderNumber = async (orderNumber) => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setNotice({
        type: "success",
        text: isIndo ? `${orderNumber} berhasil disalin.` : `${orderNumber} copied.`,
      });
    } catch {
      setNotice({
        type: "error",
        text: isIndo
          ? "Gagal menyalin nomor pesanan."
          : "Unable to copy order number.",
      });
    }
  };

  // Navigates directly to dedicated link page for the order
  const handleViewInvoice = (id) => {
    navigate(workspaceRoutes.orderDetail(id));
  };

  return (
    <SellerOrders2026View
      orders={orders}
      query={query}
      changeQuery={changeQuery}
      view={view}
      setView={setView}
      notice={notice}
      summaryAmounts={summaryAmounts}
      exportOrders={exportOrders}
      resetFilters={resetFilters}
      copyOrderNumber={copyOrderNumber}
      handleViewInvoice={handleViewInvoice}
      isLoading={orders.isLoading}
      isError={orders.isError}
      error={orders.error}
      refetch={orders.refetch}
    />
  );
}
