// Adapter to fetch Overview (Dashboard) data for Seller Workspace 2026 live mode
// This maps live API responses to the shape expected by the mock data used in preview.

import { getSellerWorkspaceContextBySlug } from "../../../api/sellerWorkspace.ts";
import { getSellerFinanceSummary } from "../../../api/sellerWorkspace.ts";
import { getSellerAnalyticsSummary } from "../../../api/sellerWorkspace.ts";


// Helper to map readiness checklist items to simple label/status used by UI
const mapReadiness = (readiness) => {
  if (!readiness?.checklist) return [];
  return readiness.checklist.map((item) => ({
    label: item.label,
    status: item.status?.label || item.status,
  }));
};

export const fetchSellerWorkspace2026Overview = async (storeSlug) => {
  // Fetch store context (includes store info) and finance/analytics etc.
  const context = await getSellerWorkspaceContextBySlug(storeSlug);
  const storeId = context?.store?.id ?? null;
  if (!storeId) {
    throw new Error("Unable to resolve store context.");
  }
  const [finance, analytics] = await Promise.all([
    getSellerFinanceSummary(storeId),
    getSellerAnalyticsSummary(storeId),
  ]);

  // Build a minimal data shape compatible with existing DashboardPage expectations
  const kpis = [
    { label: "Revenue", value: finance?.paymentProfileReadiness?.exists ? finance.paymentProfileReadiness.label : "-" },
    { label: "Orders", value: analytics?.orderSnapshot?.totalOrders?.toString() ?? "-" },
  ];

  const readiness = context?.readiness ? mapReadiness(context.readiness) : [];
  const readinessPercent = context?.readiness?.summary?.completionPercent ?? 0;

  const topProducts = [];
  const suborders = [];
  const traffic = [];

  return {
    kpis,
    readiness,
    readinessPercent,
    topProducts,
    suborders,
    traffic,
  };
};
