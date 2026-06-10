const asText = (value: unknown, fallback = "") => String(value ?? "").trim() || fallback;
const asNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const asObject = (value: unknown): Record<string, any> =>
  value && typeof value === "object" ? (value as Record<string, any>) : {};

export const formatSeller2026Currency = (value: unknown) =>
  `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    asNumber(value)
  )}`;

const formatNumber = (value: unknown) =>
  new Intl.NumberFormat("id-ID").format(asNumber(value));

const statusLabel = (value: unknown, complete = false) => {
  const normalized = asText(value).toLowerCase();
  if (complete || ["ready", "complete", "completed", "active", "approved"].some((key) => normalized.includes(key))) {
    return "Ready";
  }
  if (normalized.includes("product") || normalized.includes("empty")) return "No products";
  return "Needs update";
};

const findChecklistItem = (items: any[], keys: string[]) =>
  items.find((entry) => {
    const haystack = `${asText(entry?.key)} ${asText(entry?.label)}`.toLowerCase();
    return keys.some((key) => haystack.includes(key));
  });

const normalizeProgress = (item: any, fallbackTotal = 1) => {
  const progress = asObject(item?.progress);
  const total = Math.max(asNumber(progress.total, fallbackTotal), 1);
  const completed = Math.min(asNumber(progress.completed, item?.isComplete ? total : 0), total);
  return { completed, total, percent: Math.round((completed / total) * 100) };
};

const lastSevenDays = () => {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return formatter.format(date);
  });
};

export function adaptSeller2026DashboardFromSummaries({
  sellerContext,
  financeSummary,
  readiness,
  analytics,
  suborders,
}: {
  sellerContext?: unknown;
  financeSummary?: unknown;
  readiness?: unknown;
  analytics?: unknown;
  suborders?: unknown;
}) {
  const context = asObject(sellerContext);
  const storeSource = asObject(context.store);
  const access = asObject(context.access);
  const finance = asObject(financeSummary);
  const analyticsSource = asObject(analytics);
  const readinessSource = asObject(readiness);
  const readinessSummary = asObject(readinessSource.summary);
  const revenue = asObject(analyticsSource.revenueSnapshot);
  const orders = asObject(analyticsSource.orderSnapshot);
  const products = asObject(analyticsSource.productSnapshot);
  const coupons = asObject(analyticsSource.couponSnapshot);
  const attribution = asObject(analyticsSource.couponAttributionSnapshot);
  const payment = asObject(finance.paymentProfileReadiness);
  const paymentProfile = asObject(payment.profile);
  const paymentReviews = asObject(finance.paymentReviewCounts);
  const eligiblePaid = asObject(finance.eligiblePaidSubordersSummary);
  const checklist = Array.isArray(readinessSource.checklist) ? readinessSource.checklist : [];
  const suborderSource = asObject(suborders);
  const suborderItems = Array.isArray(suborderSource.items) ? suborderSource.items : [];

  const profileItem = findChecklistItem(checklist, ["profile", "identity"]);
  const shippingItem = findChecklistItem(checklist, ["shipping", "origin"]);
  const paymentItem = findChecklistItem(checklist, ["payment"]);
  const productCount = asNumber(products.totalProducts);

  const profileProgress = normalizeProgress(profileItem, 4);
  const shippingProgress = normalizeProgress(shippingItem, 1);
  const paymentProgress = paymentItem
    ? normalizeProgress(paymentItem, Math.max(asNumber(payment.totalFields), 1))
    : {
        completed: asNumber(payment.completedFields),
        total: Math.max(asNumber(payment.totalFields), 1),
        percent: payment.totalFields
          ? Math.round((asNumber(payment.completedFields) / asNumber(payment.totalFields)) * 100)
          : 0,
      };
  const productProgress = {
    completed: productCount > 0 ? 1 : 0,
    total: 1,
    percent: productCount > 0 ? 100 : 0,
  };

  const readinessItems = [
    {
      key: "profile",
      label: "Store Profile",
      status: statusLabel(profileItem?.status?.label, Boolean(profileItem?.isComplete)),
      ...profileProgress,
    },
    {
      key: "shipping",
      label: "Shipping Setup",
      status: statusLabel(
        shippingItem?.status?.label || storeSource.shippingSetupStatus?.label,
        Boolean(shippingItem?.isComplete || storeSource.isShippingReady)
      ),
      ...shippingProgress,
    },
    {
      key: "payment",
      label: "Payment Setup",
      status: statusLabel(payment.label, Boolean(payment.isReady)),
      ...paymentProgress,
    },
    {
      key: "products",
      label: "Products",
      status: productCount > 0 ? "Ready" : "No products",
      ...productProgress,
    },
  ];

  const completedChecklist = readinessItems.reduce(
    (sum, item) => sum + item.completed,
    0
  );
  const totalChecklist = readinessItems.reduce((sum, item) => sum + item.total, 0);
  const paidRevenue = asNumber(revenue.paidGrossAmount);
  const totalOrders = asNumber(orders.totalOrders);
  const conversion = 0;
  const attributedOrders = asNumber(attribution.attributedSuborders);
  const discountedOrders = asNumber(attribution.coverage?.discountedSuborders);

  return {
    store: {
      id: asNumber(storeSource.id) || null,
      name: asText(storeSource.name, "Seller Workspace"),
      slug: asText(storeSource.slug, "store"),
      status: asText(storeSource.status, "ACTIVE"),
      role: asText(access.roleCode, "SELLER"),
      accessMode: asText(access.accessMode, "MEMBER"),
      shippingReady: Boolean(storeSource.isShippingReady || shippingItem?.isComplete),
      paymentReady: Boolean(payment.isReady),
    },
    metrics: {
      revenue7d: paidRevenue,
      revenue7dLabel: formatSeller2026Currency(paidRevenue),
      orders7d: totalOrders,
      orders7dLabel: formatNumber(totalOrders),
      products: productCount,
      productsLabel: formatNumber(productCount),
      conversion,
      conversionLabel: `${conversion}%`,
      aov: asNumber(revenue.averageOrderValue),
      aovLabel: formatSeller2026Currency(revenue.averageOrderValue),
      coupons: asNumber(coupons.totalCoupons),
      couponsLabel: formatNumber(coupons.totalCoupons),
    },
    readiness: {
      percent: Math.max(0, Math.min(100, asNumber(readinessSummary.completionPercent))),
      items: readinessItems,
    },
    checklist: readinessItems,
    checklistSummary: {
      completed: completedChecklist,
      total: totalChecklist,
    },
    analytics: {
      labels: lastSevenDays(),
      // The summary API has no daily time series, so avoid inventing day-level sales.
      sales: [0, 0, 0, 0, 0, 0, 0],
    },
    operational: {
      paidSplits: asNumber(eligiblePaid.count),
      processing: asNumber(orders.processingOrders),
      completed: asNumber(orders.completedOrders),
      waiting: asNumber(orders.pendingPaymentOrders),
      exceptions: asNumber(orders.exceptionOrders),
      completedRevenue: asNumber(revenue.completedGrossAmount),
      inFlightRevenue: asNumber(revenue.processingGrossAmount),
      aov: asNumber(revenue.averageOrderValue),
    },
    couponAttribution: {
      attributedOrders,
      attributedDiscount: asNumber(attribution.totalDiscountAmount),
      coverage: asNumber(attribution.coverage?.attributedCoveragePercent),
      status: attributedOrders || discountedOrders ? asText(attribution.label, "Monitor") : "No activity",
    },
    paymentSetup: {
      ready: Boolean(payment.isReady),
      provider: asText(paymentProfile.providerCode, "Not configured"),
      type: asText(paymentProfile.paymentType, "Not configured"),
    },
    paymentsOrders: {
      pendingReview: asNumber(paymentReviews.awaitingReview),
      orders: totalOrders,
    },
    recentSuborders: suborderItems.slice(0, 6),
  };
}
