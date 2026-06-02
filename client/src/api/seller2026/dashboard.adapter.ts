const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const formatCurrency = (value: unknown) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number(value, 0));
const formatNumber = (value: unknown) => new Intl.NumberFormat("id-ID").format(number(value, 0));
const formatDateTime = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function adaptSellerDashboardKpi(value: unknown) {
  const source = object(value);
  return {
    label: text(source?.label || source?.name, "Metric"),
    value: source?.value ?? 0,
    change: text(source?.change || source?.deltaLabel, "0%"),
    tone: text(source?.tone, "neutral"),
  };
}

export function adaptSellerReadinessItem(value: unknown) {
  const source = object(value);
  return {
    label: text(source?.label || source?.name, "Readiness item"),
    status: text(source?.status || source?.state, "Pending"),
    completed: Boolean(source?.completed),
    score: number(source?.score, 0),
  };
}

export function adaptSellerDashboard(value: unknown) {
  const source = object(value);
  return {
    kpis: Array.isArray(source?.kpis) ? source.kpis.map(adaptSellerDashboardKpi) : [],
    readiness: Array.isArray(source?.readiness)
      ? source.readiness.map(adaptSellerReadinessItem)
      : [],
    recentSuborders: Array.isArray(source?.recentSuborders) ? source.recentSuborders : [],
    topProducts: Array.isArray(source?.topProducts) ? source.topProducts : [],
    notificationsUnread: number(source?.notificationsUnread, 0),
  };
}

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
  const context = object(sellerContext);
  const contextStore = object(context.store);
  const access = object(context.access);
  const finance = object(financeSummary);
  const analyticsSource = object(analytics);
  const readinessSource = object(readiness);
  const readinessSummary = object(readinessSource.summary);
  const revenueSnapshot = object(analyticsSource.revenueSnapshot);
  const orderSnapshot = object(analyticsSource.orderSnapshot);
  const productSnapshot = object(analyticsSource.productSnapshot);
  const paymentSummary = object(finance.eligiblePaidSubordersSummary);
  const suborderSource = object(suborders);
  const suborderItems = Array.isArray(suborderSource.items) ? suborderSource.items : [];
  const topProductItems = Array.isArray(productSnapshot.topProducts)
    ? productSnapshot.topProducts
    : [];

  return {
    store: {
      id: contextStore.id ?? null,
      name: text(contextStore.name, "Seller Workspace"),
      slug: text(contextStore.slug),
      status: text(contextStore.status, "ACTIVE"),
      roleCode: text(access.roleCode, "SELLER"),
    },
    kpis: [
      {
        label: "Paid Revenue",
        value: formatCurrency(revenueSnapshot.paidGrossAmount),
        change: text(revenueSnapshot.hint, "Live seller API"),
        tone: "indigo",
      },
      {
        label: "Total Orders",
        value: formatNumber(orderSnapshot.totalOrders),
        change: `${formatNumber(orderSnapshot.paidOrders)} paid`,
        tone: "emerald",
      },
      {
        label: "Active Products",
        value: formatNumber(productSnapshot.activeProducts),
        change: `${formatNumber(productSnapshot.reviewQueue)} in review`,
        tone: "teal",
      },
      {
        label: "Eligible Paid Gross",
        value: formatCurrency(paymentSummary.grossAmount),
        change: `${formatNumber(paymentSummary.awaitingFulfillmentCount)} awaiting fulfillment`,
        tone: "violet",
      },
    ],
    readiness: Array.isArray(readinessSource.checklist)
      ? readinessSource.checklist.map((entry) => {
          const item = object(entry);
          const status = object(item.status);
          return {
            label: text(item.label, "Readiness item"),
            status: text(status.label || status.code, "Pending"),
          };
        })
      : [],
    readinessPercent: number(readinessSummary.completionPercent, 0),
    readinessLabel: text(readinessSummary.label, "Store readiness"),
    readinessHint: text(readinessSummary.description, "Live readiness data from seller API."),
    topProducts: topProductItems.map((entry) => {
      const product = object(entry);
      return [
        text(product.name, "Unknown product"),
        formatNumber(product.qtySold),
        formatCurrency(product.revenueAmount),
        text(product.status, "unknown"),
      ];
    }),
    recentSuborders: suborderItems.slice(0, 6).map((entry) => {
      const suborder = object(entry);
      const customer = object(suborder.customer);
      const order = object(suborder.order);
      const paymentSummarySource = object(suborder.paymentSummary);
      return {
        id: text(suborder.code || suborder.suborderNo || suborder.id, "-"),
        customer: text(suborder.customerName || customer.name, "Customer"),
        status: text(
          paymentSummarySource.status || suborder.paymentStatus || suborder.fulfillmentStatus,
          "UNKNOWN"
        ),
        time: formatDateTime(suborder.createdAt || order.createdAt),
      };
    }),
    traffic: [
      ["Storefront Visible", formatNumber(productSnapshot.storefrontVisibleProducts)],
      ["Draft Products", formatNumber(productSnapshot.draftProducts)],
      ["Processing Orders", formatNumber(orderSnapshot.processingOrders)],
      ["Completed Orders", formatNumber(orderSnapshot.completedOrders)],
      ["Pending Payment", formatNumber(orderSnapshot.pendingPaymentOrders)],
    ],
  };
}
