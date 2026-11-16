import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { fetchStoreMyOrders } from "../../api/storeOrders.ts";
import { isOrderContractFinal } from "../../utils/orderContract.ts";
import AccountOrders2026View from "./AccountOrders2026View.jsx";
import { isIndonesianLanguage, normalizeAccountOrdersFor2026 } from "./accountOrders2026Adapter.js";

const shouldPollAccountOrders = (orders) =>
  Array.isArray(orders) &&
  orders.some((order) => {
    if (!isOrderContractFinal(order?.contract)) return true;
    return Boolean(order?.paymentEntry?.visible);
  });

export default function AccountOrdersPage() {
  const { i18n } = useTranslation();
  const [, setLangSync] = useState(0);

  useEffect(() => {
    const handleSync = () => {
      setLangSync((prev) => prev + 1);
    };

    i18n?.on?.("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("store_language_changed", handleSync);
    return () => {
      i18n?.off?.("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("store_language_changed", handleSync);
    };
  }, [i18n]);

  const isIndo = isIndonesianLanguage(i18n);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const VALID_TABS = useMemo(
    () => ["all", "unpaid", "to_pack", "shipping", "completed", "returns", "cancelled"],
    []
  );

  const rawUrlTab = searchParams.get("tab")?.toLowerCase();
  const rawStateTab = location.state?.tab || location.state?.fromTab;
  let rawSessionTab = null;
  try {
    rawSessionTab = sessionStorage.getItem("tp_my_orders_last_tab");
  } catch (_) {}

  const activeTab = VALID_TABS.includes(rawUrlTab)
    ? rawUrlTab
    : VALID_TABS.includes(rawStateTab)
      ? rawStateTab
      : VALID_TABS.includes(rawSessionTab)
        ? rawSessionTab
        : "all";

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
  const normalized = normalizeAccountOrdersFor2026(ordersQuery.data, { page, isIndo });

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

  const handleTabChange = (nextTab) => {
    const targetTab = VALID_TABS.includes(nextTab) ? nextTab : "all";
    try {
      sessionStorage.setItem("tp_my_orders_last_tab", targetTab);
    } catch (_) {}
    const params = new URLSearchParams(searchParams);
    if (targetTab && targetTab !== "all") {
      params.set("tab", targetTab);
    } else {
      params.delete("tab");
    }
    params.set("page", "1");
    setSearchParams(params, { replace: true });
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
      isIndo={isIndo}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      cartSummary={null}
    />
  );
}
