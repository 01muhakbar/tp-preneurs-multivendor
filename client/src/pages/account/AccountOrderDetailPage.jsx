import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios.ts";
import { fetchOrderCheckoutPayment } from "../../api/orderPayments.ts";
import { isOrderContractFinal } from "../../utils/orderContract.ts";
import { isSplitOperationallyFinal } from "../../utils/splitOperationalTruth.ts";
import AccountOrderDetail2026View from "./AccountOrderDetail2026View.jsx";
import { normalizeOrderDetailFor2026 } from "./accountOrderDetail2026Adapter.js";

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

  const handlePrint = () => window.print();
  const handleViewInvoice = () => {
    document
      .getElementById("tpo2026-order-summary")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const handleContactSupport = () => navigate("/contact-us");
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
      onViewInvoice={handleViewInvoice}
      onContactSupport={handleContactSupport}
    />
  );
}
