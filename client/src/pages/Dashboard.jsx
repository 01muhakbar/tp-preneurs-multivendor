import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsService, orderService } from "../api/index.ts";
import { useAuth } from "../auth/useAuth.js";
import { can } from "../constants/permissions.js";
import useAdminLocale from "../hooks/useAdminLocale.js";
import AdminDashboard2026View from "./admin/dashboard2026/AdminDashboard2026View.jsx";
import {
  normalizeBestSellers,
  normalizeOverview,
  normalizeRecentOrders,
  normalizeSeries,
} from "./admin/dashboard2026/dashboard2026Adapter.js";

const getStartDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - (days - 1));
  return date.toISOString().slice(0, 10);
};

export default function Dashboard() {
  const { user } = useAuth();
  const { formatMoney, formatDateTime } = useAdminLocale();
  const [range, setRange] = useState(7);
  const [metric, setMetric] = useState("sales");

  const overviewQuery = useQuery({
    queryKey: ["admin-dashboard-2026", "overview", range],
    queryFn: () => analyticsService.getOverview(range),
    select: normalizeOverview,
  });

  const weeklyQuery = useQuery({
    queryKey: ["admin-dashboard-2026", "weekly", range, metric],
    queryFn: () => analyticsService.getWeeklySales(range),
    select: normalizeSeries,
  });

  const bestSellersQuery = useQuery({
    queryKey: ["admin-dashboard-2026", "best-sellers", range],
    queryFn: () => analyticsService.getBestSelling(range, 5),
    select: normalizeBestSellers,
  });

  const recentOrdersQuery = useQuery({
    queryKey: ["admin-dashboard-2026", "recent-orders", range],
    queryFn: () =>
      orderService.listOrders({
        page: 1,
        pageSize: 5,
        sort: "createdAt",
        order: "desc",
        startDate: getStartDate(range),
      }),
    select: normalizeRecentOrders,
  });

  const quickActions = useMemo(
    () =>
      [
        {
          label: "Add Product",
          description: "Create a new product",
          to: "/admin/catalog/products/new",
          permission: "PRODUCTS_CREATE",
          tone: "blue",
          icon: "product",
        },
        {
          label: "Add Coupon",
          description: "Create a new coupon",
          to: "/admin/catalog/coupons",
          permission: "COUPONS_CRUD",
          tone: "orange",
          icon: "coupon",
        },
        {
          label: "Review Stores",
          description: "Review store applications",
          to: "/admin/store/applications",
          permission: "STORE_APPLICATIONS_REVIEW",
          tone: "green",
          icon: "store",
        },
        {
          label: "Payment Audit",
          description: "Check payment records",
          to: "/admin/online-store/payment-audit",
          permission: "DASHBOARD_VIEW",
          tone: "purple",
          icon: "audit",
        },
      ].filter((action) => can(user, action.permission)),
    [user]
  );

  const queries = [overviewQuery, weeklyQuery, bestSellersQuery, recentOrdersQuery];
  const handleRefresh = () => Promise.all(queries.map((query) => query.refetch()));

  return (
    <AdminDashboard2026View
      range={range}
      metric={metric}
      onRangeChange={setRange}
      onMetricChange={setMetric}
      onRefresh={handleRefresh}
      isRefreshing={queries.some((query) => query.isFetching)}
      overview={overviewQuery.data}
      overviewState={overviewQuery}
      series={weeklyQuery.data || []}
      weeklyState={weeklyQuery}
      bestSellers={bestSellersQuery.data || []}
      bestSellersState={bestSellersQuery}
      recentOrders={recentOrdersQuery.data || []}
      recentOrdersState={recentOrdersQuery}
      quickActions={quickActions}
      formatMoney={formatMoney}
      formatDateTime={formatDateTime}
    />
  );
}
