import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useSeller2026Orders } from "../../hooks/seller2026/useSeller2026Orders.ts";
import { useSeller2026SuborderDetail } from "../../hooks/seller2026/useSeller2026SuborderDetail.ts";
import { buildSellerSuborderFulfillmentPayload2026 } from "./sellerSuborderDetail2026Adapter.js";
import { downloadCsvFile } from "../../utils/exportFiles.js";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import SellerOrders2026View from "../../features/sellerWorkspace2026/orders/SellerOrders2026View.jsx";
import SellerOrderDetailDrawer2026 from "../../features/sellerWorkspace2026/orders/detail-drawer/SellerOrderDetailDrawer2026.jsx";

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

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function Seller2026LiveOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const location = useLocation();
  const [view, setView] = useState("table");
  const [selectedOrderId, setSelectedOrderId] = useState(location.state?.openDetailId || null);
  const [notice, setNotice] = useState(null);

  const detailQuery = useSeller2026SuborderDetail(storeId, selectedOrderId, {
    enabled: canView && Boolean(selectedOrderId),
    permissions: { canFulfill },
  });

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
      .filter((order) => ["UNPAID", "PENDING_CONFIRMATION", "PARTIALLY_PAID"].includes(order.paymentStatus))
      .reduce((sum, order) => sum + order.totalAmount, 0),
    packing: rows
      .filter((order) => order.fulfillmentStatus === "PROCESSING")
      .reduce((sum, order) => sum + order.totalAmount, 0),
    transit: rows
      .filter((order) => order.fulfillmentStatus === "SHIPPED")
      .reduce((sum, order) => sum + order.totalAmount, 0),
    delivered: rows
      .filter((order) => order.fulfillmentStatus === "DELIVERED")
      .reduce((sum, order) => sum + order.totalAmount, 0),
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
    setNotice({ type: "success", text: `${rows.length} visible order(s) exported.` });
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
    setNotice(null);
  };

  const copyOrderNumber = async (orderNumber) => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setNotice({ type: "success", text: `${orderNumber} copied.` });
    } catch {
      setNotice({ type: "error", text: "Unable to copy order number." });
    }
  };

  const closeOrderDetail = () => {
    if (detailQuery.updatingStatusId) return;
    setSelectedOrderId(null);
  };

  // handleCopyReference removed

  const handlePrintLabel = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleMessageBuyer = (customer) => {
    if (customer?.phone && customer.phone !== "Not set") {
      const cleanPhone = customer.phone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanPhone}`, "_blank");
    } else if (customer?.email) {
      window.open(`mailto:${customer.email}`, "_blank");
    } else {
      setNotice({
        type: "error",
        text: "Buyer contact info is unavailable.",
      });
    }
  };

  const handleViewInvoice = (id) => {
    setSelectedOrderId(id);
  };

  const handleFulfillmentAction = async (action, draft = {}) => {
    if (action === "REVIEW_PAYMENT") {
      const orderRef = detailQuery.data?.suborder?.orderNumber || detailQuery.data?.suborder?.invoiceNo || "";
      navigate(`${workspaceRoutes.paymentReview()}?q=${orderRef}`);
      return;
    }

    if (!selectedOrderId || !canFulfill || detailQuery.updatingStatusId) return;
    try {
      const payload = Object.keys(draft).length 
        ? buildSellerSuborderFulfillmentPayload2026(action, draft)
        : { action };
      
      await detailQuery.updateFulfillmentStatus({ payload });
      await Promise.all([
        orders.refetch(),
        detailQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["seller2026", "dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["seller", "notifications", storeId] }),
      ]);
      setNotice({ type: "success", text: "Order fulfillment updated." });
    } catch (mutationError) {
      setNotice({
        type: "error",
        text: errorMessage(mutationError, "Unable to update fulfillment."),
      });
    }
  };

  return (
    <>
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
      {selectedOrderId ? (
        <SellerOrderDetailDrawer2026
          orderData={detailQuery.data}
          storeId={storeId}
          isLoading={detailQuery.isLoading}
          error={detailQuery.isError ? detailQuery.error : null}
          isUpdating={Boolean(detailQuery.updatingStatusId)}
          onClose={closeOrderDetail}
          onCopyReference={copyOrderNumber}
          onPrintLabel={handlePrintLabel}
          onMessageBuyer={handleMessageBuyer}
          onViewInvoice={() => navigate(workspaceRoutes.orderDetail(selectedOrderId))}
          onFulfillmentAction={handleFulfillmentAction}
        />
      ) : null}
    </>
  );
}
