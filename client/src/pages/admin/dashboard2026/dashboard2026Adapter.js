const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const asArray = (value) => (Array.isArray(value) ? value : []);

export const normalizeOverview = (payload) => {
  const source = payload?.data ?? payload ?? {};
  const statuses = source.statusCounts ?? source.statuses ?? {};
  const pending = asNumber(statuses.pending);
  const processing = asNumber(statuses.processing);
  const shipped = asNumber(statuses.shipped ?? statuses.shipping);
  const delivered = asNumber(statuses.delivered ?? statuses.completed);
  const cancelled = asNumber(statuses.cancelled ?? statuses.canceled);
  const total =
    asNumber(source.allTimeOrdersCount ?? statuses.total) ||
    pending + processing + shipped + delivered + cancelled;

  return {
    todayOrders: asNumber(source.todayOrdersCount ?? source.todayOrders),
    yesterdayOrders: asNumber(source.yesterdayOrdersCount ?? source.yesterdayOrders),
    todayRevenue: asNumber(source.todayRevenue),
    yesterdayRevenue: asNumber(source.yesterdayRevenue),
    monthRevenue: asNumber(source.monthRevenue ?? source.thisMonthRevenue),
    lastMonthRevenue: asNumber(source.lastMonthRevenue),
    allTimeRevenue: asNumber(source.allTimeRevenue ?? source.totalRevenue),
    activeStores: asNumber(source.activeStoresCount ?? source.activeStores),
    statuses: { total, pending, processing, shipped, delivered, cancelled },
  };
};

export const normalizeSeries = (payload) =>
  asArray(payload?.data ?? payload).map((item) => ({
    date: item?.date ?? item?.day ?? item?.label ?? "",
    sales: asNumber(item?.sales ?? item?.revenue ?? item?.value),
    orders: asNumber(item?.orders ?? item?.count),
  }));

export const normalizeBestSellers = (payload) =>
  asArray(payload?.data ?? payload)
    .map((item, index) => ({
      id: item?.productId ?? item?.id ?? `product-${index}`,
      name: String(item?.name ?? item?.productName ?? "Unnamed product"),
      quantity: asNumber(item?.soldQty ?? item?.qty ?? item?.quantity),
      revenue: asNumber(item?.revenue ?? item?.sales),
    }))
    .filter((item) => item.quantity > 0 || item.revenue > 0);

export const normalizeRecentOrders = (payload) =>
  asArray(payload?.data ?? payload).map((order, index) => ({
    id: order?.id ?? order?.orderId ?? index,
    invoiceNo: String(order?.invoiceNo ?? order?.invoice ?? order?.ref ?? "").trim(),
    customer: String(order?.customerName ?? order?.customer?.name ?? order?.customer ?? "Guest"),
    total: asNumber(order?.totalAmount ?? order?.amount ?? order?.total),
    status: String(order?.status ?? order?.rawStatus ?? "pending").toLowerCase(),
    createdAt: order?.createdAt ?? order?.orderTime ?? null,
  }));

export const calculateTrend = (current, previous) => {
  const now = asNumber(current);
  const before = asNumber(previous);
  if (before === 0) return now === 0 ? 0 : 100;
  return ((now - before) / Math.abs(before)) * 100;
};
