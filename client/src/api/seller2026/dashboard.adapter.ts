const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

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
