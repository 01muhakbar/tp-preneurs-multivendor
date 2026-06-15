import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { fetchStoreMyOrders } from "../../api/storeOrders.ts";
import { isOrderContractFinal } from "../../utils/orderContract.ts";
import AccountOrders2026View from "./AccountOrders2026View.jsx";
import { normalizeAccountOrdersFor2026 } from "./accountOrders2026Adapter.js";

const shouldPollAccountOrders = (orders) =>
  Array.isArray(orders) &&
  orders.some((order) => {
    if (!isOrderContractFinal(order?.contract)) return true;
    return Boolean(order?.paymentEntry?.visible);
  });

export default function AccountOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPage = Number(searchParams.get("page") || 1);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const ordersQuery = useQuery({
    queryKey: ["account", "orders", "my", page],
    queryFn: () => fetchStoreMyOrders({ page }),
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const response = query.state.data;
      const rows = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      return shouldPollAccountOrders(rows) ? 15000 : false;
    },
  });
  const normalized = normalizeAccountOrdersFor2026(ordersQuery.data, { page });

  const handlePageChange = (nextPage) => {
    const targetPage = Math.min(
      Math.max(1, Number(nextPage) || 1),
      normalized.totalPages
    );
    if (targetPage === page) return;
    const params = new URLSearchParams(searchParams);
    params.set("page", String(targetPage));
    setSearchParams(params);
  };

  return (
    <AccountOrders2026View
      LinkComponent={Link}
      orders={normalized.orders}
      counts={normalized.counts}
      page={normalized.page}
      pageSize={normalized.pageSize}
      totalPages={normalized.totalPages}
      totalOrders={normalized.totalOrders}
      isLoading={ordersQuery.isLoading}
      error={ordersQuery.isError ? ordersQuery.error : null}
      onPageChange={handlePageChange}
      cartSummary={null}
    />
  );
}
