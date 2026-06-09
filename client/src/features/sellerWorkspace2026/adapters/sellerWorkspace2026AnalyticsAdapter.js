import { getSellerAnalyticsSummary } from "../../../api/sellerWorkspace.ts";

const numberOrZero = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const textOrFallback = (value, fallback = "") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numberOrZero(value));

const mapSignals = (analytics) => {
  const insights = Array.isArray(analytics?.insights) ? analytics.insights : [];
  const readinessSignals = Array.isArray(analytics?.couponAttributionReadiness?.signals)
    ? analytics.couponAttributionReadiness.signals
    : [];

  return [
    ...insights.map((entry) => ({
      label: textOrFallback(entry?.label, "Analytics signal"),
      description: textOrFallback(entry?.description, "No additional detail."),
      tone: textOrFallback(entry?.tone, "stone"),
    })),
    ...readinessSignals.map((entry) => ({
      label: textOrFallback(entry?.label, "Readiness signal"),
      description: textOrFallback(entry?.description, "No additional detail."),
      tone: textOrFallback(entry?.status, "UNKNOWN").toLowerCase(),
    })),
  ];
};

export const adaptSellerWorkspace2026Analytics = (analytics) => {
  const orderSnapshot = analytics?.orderSnapshot || {};
  const revenueSnapshot = analytics?.revenueSnapshot || {};
  const productSnapshot = analytics?.productSnapshot || {};
  const couponSnapshot = analytics?.couponSnapshot || {};
  const readiness = analytics?.couponAttributionReadiness || {};
  const boundaries = analytics?.boundaries || {};
  const topProducts = Array.isArray(productSnapshot?.topProducts)
    ? productSnapshot.topProducts
    : [];

  return {
    store: analytics?.store || null,
    isEmpty:
      numberOrZero(orderSnapshot.totalOrders) === 0 &&
      numberOrZero(revenueSnapshot.paidGrossAmount) === 0 &&
      topProducts.length === 0,
    overview: [
      {
        label: "Paid Revenue",
        value: formatCurrency(revenueSnapshot.paidGrossAmount),
        detail: textOrFallback(revenueSnapshot.hint, "Store-scoped paid gross amount."),
      },
      {
        label: "Total Orders",
        value: numberOrZero(orderSnapshot.totalOrders).toLocaleString("en-US"),
        detail: textOrFallback(orderSnapshot.hint, "Orders visible to this seller workspace."),
      },
      {
        label: "Average Order Value",
        value: formatCurrency(revenueSnapshot.averageOrderValue),
        detail: "Calculated from existing paid order data.",
      },
      {
        label: "Storefront Products",
        value: numberOrZero(productSnapshot.storefrontVisibleProducts).toLocaleString("en-US"),
        detail: "Read-only count from existing product visibility data.",
      },
    ],
    salesSummary: {
      paidOrders: numberOrZero(orderSnapshot.paidOrders),
      processingOrders: numberOrZero(orderSnapshot.processingOrders),
      completedOrders: numberOrZero(orderSnapshot.completedOrders),
      pendingPaymentOrders: numberOrZero(orderSnapshot.pendingPaymentOrders),
      exceptionOrders: numberOrZero(orderSnapshot.exceptionOrders),
      processingGrossAmount: formatCurrency(revenueSnapshot.processingGrossAmount),
      completedGrossAmount: formatCurrency(revenueSnapshot.completedGrossAmount),
      boundaryNote: textOrFallback(revenueSnapshot.boundaryNote, boundaries.adminAuthority),
    },
    productPerformance: topProducts.map((product) => ({
      productId: product.productId,
      name: textOrFallback(product.name, "Unknown product"),
      status: textOrFallback(product.status, "UNKNOWN").toUpperCase(),
      quantitySold: numberOrZero(product.qtySold),
      revenue: formatCurrency(product.revenueAmount),
      storefrontVisible: Boolean(product.storefrontVisible),
    })),
    trafficSnapshot: {
      totalProducts: numberOrZero(productSnapshot.totalProducts),
      activeProducts: numberOrZero(productSnapshot.activeProducts),
      draftProducts: numberOrZero(productSnapshot.draftProducts),
      reviewQueue: numberOrZero(productSnapshot.reviewQueue),
      note:
        textOrFallback(productSnapshot.hint) ||
        "Traffic metrics are limited to existing public-safe product and order signals.",
    },
    storefrontReadiness: {
      label: textOrFallback(readiness.label, "Read-only baseline"),
      summary:
        textOrFallback(readiness.summary) ||
        "Storefront readiness is shown for review only. Seller analytics cannot publish or change public visibility.",
      recommendedNextStep: textOrFallback(
        readiness.recommendedNextStep,
        "Continue using existing Admin-approved public workflows."
      ),
      boundaryNote:
        textOrFallback(readiness.boundaryNote) ||
        textOrFallback(boundaries.storefrontBoundary, "Client storefront remains public-safe read-only."),
    },
    couponSnapshot: {
      totalCoupons: numberOrZero(couponSnapshot.totalCoupons),
      activeCoupons: numberOrZero(couponSnapshot.activeCoupons),
      discountedOrders: numberOrZero(couponSnapshot.discountedOrders),
      discountedPaidOrders: numberOrZero(couponSnapshot.discountedPaidOrders),
      boundaryNote: textOrFallback(couponSnapshot.boundaryNote),
    },
    recentSignals: mapSignals(analytics),
    syncNotes: [
      "Analytics is read-only and uses existing seller summary APIs.",
      "Unavailable until storefront sync workflow is validated.",
      "Admin remains final authority for public visibility and approval workflows.",
    ],
  };
};

export const fetchSellerWorkspace2026Analytics = async (storeId) => {
  const analytics = await getSellerAnalyticsSummary(storeId);
  return adaptSellerWorkspace2026Analytics(analytics);
};
