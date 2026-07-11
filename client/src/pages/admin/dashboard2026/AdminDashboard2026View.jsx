import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Box,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  PackageCheck,
  Percent,
  RefreshCw,
  RotateCw,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calculateTrend } from "./dashboard2026Adapter.js";
import "./admin-dashboard-2026.css";

const RANGE_OPTIONS = [
  { value: 7, label: "Last 7 Days" },
  { value: 30, label: "Last 30 Days" },
  { value: 90, label: "Last 90 Days" },
];

const PIE_COLORS = ["#095fb0", "#fe6f05", "#7c3aed", "#10b981", "#f59e0b"];

const compactNumber = (value) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    Number(value || 0)
  );

const formatPercent = (value) => `${Math.abs(Number(value || 0)).toFixed(1)}%`;

function Trend({ value, label }) {
  const positive = Number(value) >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`tp-admin-trend ${positive ? "is-positive" : "is-negative"}`}>
      <Icon aria-hidden="true" />
      <strong>{formatPercent(value)}</strong>
      <span>{label}</span>
    </span>
  );
}

function CardState({ state, empty, onRetry, children }) {
  const { t } = useTranslation("admin");
  if (state?.isPending) {
    return (
      <div className="tp-admin-loading" aria-label={t("dashboard.Loading dashboard data")}>
        <span />
        <span />
        <span />
      </div>
    );
  }
  if (state?.isError) {
    return (
      <div className="tp-admin-empty tp-admin-empty--error" role="alert">
        <Activity aria-hidden="true" />
        <p>{t("dashboard.We could not load this data.")}</p>
        <button type="button" onClick={onRetry}>{t("dashboard.Try again")}</button>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="tp-admin-empty">
        <ClipboardList aria-hidden="true" />
        <p>{t("dashboard.No data is available for this range.")}</p>
      </div>
    );
  }
  return children;
}

function ChartTooltip({ active, payload, label, metric, formatMoney }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tp-admin-chart-tooltip">
      <span>{label}</span>
      <strong>
        {metric === "sales" ? formatMoney(payload[0]?.value || 0) : `${payload[0]?.value || 0} orders`}
      </strong>
    </div>
  );
}

const normalizeStatus = (status) => {
  if (["complete", "completed", "delivered"].includes(status)) return "delivered";
  if (["shipping", "shipped"].includes(status)) return "shipped";
  if (["cancel", "canceled"].includes(status)) return "cancelled";
  return status || "pending";
};

export default function AdminDashboard2026View({
  range,
  metric,
  onRangeChange,
  onMetricChange,
  onRefresh,
  isRefreshing,
  overview,
  overviewState,
  series,
  weeklyState,
  bestSellers,
  bestSellersState,
  recentOrders,
  recentOrdersState,
  quickActions,
  formatMoney,
  formatDateTime,
}) {
  const { t } = useTranslation("admin");
  const overviewData = overview || {
    todayOrders: 0,
    yesterdayOrders: 0,
    todayRevenue: 0,
    yesterdayRevenue: 0,
    monthRevenue: 0,
    lastMonthRevenue: 0,
    allTimeRevenue: 0,
    activeStores: 0,
    statuses: {},
  };

  const selectedMetricTotal = useMemo(
    () => series.reduce((sum, item) => sum + Number(item?.[metric] || 0), 0),
    [series, metric]
  );

  const productTotal = useMemo(
    () => bestSellers.reduce((sum, item) => sum + (item.revenue || item.quantity), 0),
    [bestSellers]
  );

  const insight = useMemo(() => {
    if (series.length < 2) return 0;
    const middle = Math.floor(series.length / 2);
    const previous = series.slice(0, middle).reduce((sum, item) => sum + item.sales, 0);
    const current = series.slice(middle).reduce((sum, item) => sum + item.sales, 0);
    return calculateTrend(current, previous);
  }, [series]);

  const kpis = [
    {
      label: t("dashboard.Today Orders"),
      value: overviewData.todayOrders.toLocaleString("en-US"),
      trend: calculateTrend(overviewData.todayOrders, overviewData.yesterdayOrders),
      trendLabel: t("dashboard.vs yesterday"),
      icon: ClipboardList,
      tone: "blue",
    },
    {
      label: t("dashboard.Revenue Today"),
      value: formatMoney(overviewData.todayRevenue),
      trend: calculateTrend(overviewData.todayRevenue, overviewData.yesterdayRevenue),
      trendLabel: t("dashboard.vs yesterday"),
      icon: WalletCards,
      tone: "green",
    },
    {
      label: t("dashboard.This Month"),
      value: formatMoney(overviewData.monthRevenue),
      trend: calculateTrend(overviewData.monthRevenue, overviewData.lastMonthRevenue),
      trendLabel: t("dashboard.vs last month"),
      icon: CalendarDays,
      tone: "orange",
    },
    {
      label: t("dashboard.Pending Orders"),
      value: overviewData.statuses.pending?.toLocaleString("en-US") || "0",
      trend: 0,
      trendLabel: t("dashboard.awaiting action"),
      icon: Clock3,
      tone: "purple",
    },
    {
      label: t("dashboard.All-Time Sales"),
      value: formatMoney(overviewData.allTimeRevenue),
      trend: calculateTrend(overviewData.monthRevenue, overviewData.lastMonthRevenue),
      trendLabel: t("dashboard.monthly trend"),
      icon: TrendingUp,
      tone: "navy",
    },
  ];

  const statuses = [
    { label: t("dashboard.Total Orders"), value: overviewData.statuses.total || 0, icon: ShoppingBag, tone: "blue" },
    { label: t("dashboard.Processing"), value: overviewData.statuses.processing || 0, icon: RotateCw, tone: "orange" },
    { label: t("dashboard.Delivered"), value: overviewData.statuses.delivered || 0, icon: PackageCheck, tone: "green" },
    { label: t("dashboard.Active Stores"), value: overviewData.activeStores || 0, icon: Store, tone: "purple" },
  ];

  return (
    <div className="tp-admin-dashboard">
      <header className="tp-admin-page-header">
        <div>
          <span className="tp-admin-eyebrow">{t("sidebar.Admin Workspace")}</span>
          <h1>{t("dashboard.Dashboard Overview")}</h1>
          <p>{t("dashboard.Monitor business performance at a glance.")}</p>
        </div>
        <div className="tp-admin-header-actions">
          <label className="tp-admin-select">
            <CalendarDays aria-hidden="true" />
            <span className="sr-only">{t("dashboard.Dashboard range")}</span>
            <select value={range} onChange={(event) => onRangeChange(Number(event.target.value))}>
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{t(`dashboard.${option.label}`)}</option>
              ))}
            </select>
          </label>
          <button className="tp-admin-refresh" type="button" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={isRefreshing ? "is-spinning" : ""} aria-hidden="true" />
            <span>{isRefreshing ? t("dashboard.Refreshing") : t("dashboard.Refresh")}</span>
          </button>
        </div>
      </header>

      {overviewState.isError && (
        <div className="tp-admin-alert" role="alert">
          <span>{t("dashboard.Dashboard overview is temporarily unavailable.")}</span>
          <button type="button" onClick={() => overviewState.refetch()}>{t("dashboard.Retry")}</button>
        </div>
      )}

      <section className="tp-admin-kpi-grid" aria-label="Key performance indicators">
        {kpis.map(({ label, value, trend, trendLabel, icon: Icon, tone }) => (
          <article className={`tp-admin-kpi tp-admin-tone-${tone}`} key={label}>
            <div className="tp-admin-icon"><Icon aria-hidden="true" /></div>
            <span>{label}</span>
            {overviewState.isPending ? <i className="tp-admin-value-skeleton" /> : <strong>{value}</strong>}
            <Trend value={trend} label={trendLabel} />
            <svg className="tp-admin-sparkline" viewBox="0 0 120 24" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 19 C12 20 15 10 27 13 S42 20 53 14 70 20 82 14 100 7 120 9" />
            </svg>
          </article>
        ))}
      </section>

      <section className="tp-admin-status-strip" aria-label="Order status summary">
        {statuses.map(({ label, value, icon: Icon, tone }) => (
          <article key={label}>
            <div className={`tp-admin-icon tp-admin-tone-${tone}`}><Icon aria-hidden="true" /></div>
            <div><span>{label}</span><strong>{overviewState.isPending ? "—" : Number(value).toLocaleString("en-US")}</strong></div>
          </article>
        ))}
      </section>

      <section className="tp-admin-analytics-grid">
        <article className="tp-admin-card tp-admin-sales-card">
          <div className="tp-admin-card-header">
            <div><h2>{t("dashboard.Weekly Sales Overview")}</h2><strong>{metric === "sales" ? formatMoney(selectedMetricTotal) : `${selectedMetricTotal.toLocaleString("en-US")} orders`}</strong></div>
            <div className="tp-admin-segmented" aria-label="Chart metric">
              <button type="button" className={metric === "sales" ? "is-active" : ""} onClick={() => onMetricChange("sales")}>{t("dashboard.Sales")}</button>
              <button type="button" className={metric === "orders" ? "is-active" : ""} onClick={() => onMetricChange("orders")}>{t("dashboard.Orders")}</button>
            </div>
          </div>
          <CardState state={weeklyState} empty={!series.length} onRetry={() => weeklyState.refetch()}>
            <div className="tp-admin-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 12, right: 10, left: -12, bottom: 0 }}>
                  <defs><linearGradient id="tpSalesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#095fb0" stopOpacity={0.28}/><stop offset="100%" stopColor="#095fb0" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="var(--tp-admin-grid)" strokeDasharray="3 4" />
                  <XAxis dataKey="date" tickFormatter={(value) => formatDateTime(value, { includeTime: false })} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} />
                  <YAxis tickFormatter={compactNumber} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip metric={metric} formatMoney={formatMoney} />} />
                  <Area type="monotone" dataKey={metric} stroke="#095fb0" strokeWidth={2.5} fill="url(#tpSalesFill)" activeDot={{ r: 5, fill: "#fff", strokeWidth: 3 }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardState>
        </article>

        <article className="tp-admin-card tp-admin-products-card">
          <div className="tp-admin-card-header"><div><h2>{t("dashboard.Best Selling Products")}</h2><span>{t("dashboard.Top performers in selected range")}</span></div></div>
          <CardState state={bestSellersState} empty={!bestSellers.length} onRetry={() => bestSellersState.refetch()}>
            <div className="tp-admin-products-content">
              <div className="tp-admin-donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={bestSellers.map((item) => ({ ...item, chartValue: item.revenue || item.quantity }))} dataKey="chartValue" nameKey="name" innerRadius="68%" outerRadius="92%" paddingAngle={2} stroke="none" isAnimationActive={false}>{bestSellers.map((item, index) => <Cell key={item.id} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie></PieChart>
                </ResponsiveContainer>
                <div><span>{t("dashboard.Total Sales")}</span><strong>{formatMoney(bestSellers.reduce((sum, item) => sum + item.revenue, 0))}</strong></div>
              </div>
              <ol className="tp-admin-ranking">
                {bestSellers.map((item, index) => (
                  <li key={item.id}><i style={{ background: `${PIE_COLORS[index]}1c`, color: PIE_COLORS[index] }}>{index + 1}</i><span>{item.name}</span><strong>{item.revenue ? formatMoney(item.revenue) : `${item.quantity} ${t("dashboard.sold")}`}</strong><em>{productTotal ? `${(((item.revenue || item.quantity) / productTotal) * 100).toFixed(1)}%` : "0%"}</em></li>
                ))}
              </ol>
            </div>
          </CardState>
        </article>
      </section>

      <section className="tp-admin-operations-grid">
        <article className="tp-admin-card tp-admin-orders-card">
          <div className="tp-admin-card-header"><div><h2>{t("dashboard.Recent Orders")}</h2><span>{t("dashboard.Latest transactions across all stores")}</span></div><Link to="/admin/orders">{t("dashboard.View All Orders")} <ArrowRight aria-hidden="true" /></Link></div>
          <CardState state={recentOrdersState} empty={!recentOrders.length} onRetry={() => recentOrdersState.refetch()}>
            <div className="tp-admin-table-wrap"><table><thead><tr><th>{t("dashboard.Invoice")}</th><th>{t("dashboard.Customer")}</th><th>{t("dashboard.Total")}</th><th>{t("dashboard.Status")}</th><th>{t("dashboard.Date")}</th></tr></thead><tbody>
              {recentOrders.map((order) => { const status = normalizeStatus(order.status); return (
                <tr key={order.id}><td>{order.invoiceNo ? <Link to={`/admin/orders/${encodeURIComponent(order.invoiceNo)}`}>#{order.invoiceNo}</Link> : `#${order.id}`}</td><td>{order.customer}</td><td>{formatMoney(order.total)}</td><td><span className={`tp-admin-status tp-admin-status--${status}`}>{t(`dashboard.${status.charAt(0).toUpperCase() + status.slice(1)}`)}</span></td><td>{formatDateTime(order.createdAt)}</td></tr>
              ); })}
            </tbody></table></div>
          </CardState>
        </article>

        <aside className="tp-admin-side-stack">
          <article className="tp-admin-card tp-admin-quick-card">
            <div className="tp-admin-card-header"><div><h2>{t("dashboard.Quick Actions")}</h2><span>{t("dashboard.Common tasks and management")}</span></div></div>
            <div className="tp-admin-quick-grid">
              {quickActions.map((action) => { const Icon = action.icon === "product" ? Box : action.icon === "coupon" ? Tag : action.icon === "store" ? Store : CreditCard; return (
                <Link className={`tp-admin-quick tp-admin-tone-${action.tone}`} to={action.to} key={action.to}><div className="tp-admin-icon"><Icon aria-hidden="true" /></div><div><strong>{action.label}</strong><span>{action.description}</span></div><ArrowRight aria-hidden="true" /></Link>
              ); })}
            </div>
          </article>
          <article className="tp-admin-card tp-admin-insight">
            <div className="tp-admin-icon"><TrendingUp aria-hidden="true" /></div><div><h2>{t("dashboard.Performance Insight")}</h2><p>{t("dashboard.Sales are")}<strong>{insight >= 0 ? t("dashboard.up") : t("dashboard.down")} {formatPercent(insight)}</strong>{t("dashboard.across the selected period.")}</p></div>
          </article>
        </aside>
      </section>

      <section className="tp-admin-deep-grid">
        <article className="tp-admin-card">
          <div className="tp-admin-card-header"><div><h2>{t("dashboard.Revenue by Product")}</h2><span>{t("dashboard.Revenue contribution from leading products")}</span></div><Percent aria-hidden="true" /></div>
          <CardState state={bestSellersState} empty={!bestSellers.length} onRetry={() => bestSellersState.refetch()}>
            <div className="tp-admin-bar-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={bestSellers} layout="vertical" margin={{ left: 12, right: 18 }}><CartesianGrid horizontal={false} stroke="var(--tp-admin-grid)" /><XAxis type="number" tickFormatter={compactNumber} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => formatMoney(value)} /><Bar dataKey="revenue" fill="#095fb0" radius={[0, 7, 7, 0]} maxBarSize={14} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
          </CardState>
        </article>
        <article className="tp-admin-card tp-admin-funnel-card">
          <div className="tp-admin-card-header"><div><h2>{t("dashboard.Order Status Funnel")}</h2><span>{t("dashboard.Current all-time fulfillment distribution")}</span></div><CheckCircle2 aria-hidden="true" /></div>
          <CardState state={overviewState} empty={!overviewData.statuses.total} onRetry={() => overviewState.refetch()}>
            <div className="tp-admin-funnel">
              {[{ label: t("dashboard.Total Orders"), value: overviewData.statuses.total, tone: "blue" }, { label: t("dashboard.Processing"), value: overviewData.statuses.processing, tone: "orange" }, { label: t("dashboard.Shipped"), value: overviewData.statuses.shipped, tone: "navy" }, { label: t("dashboard.Delivered"), value: overviewData.statuses.delivered, tone: "green" }, { label: t("dashboard.Cancelled"), value: overviewData.statuses.cancelled, tone: "red" }].map((item) => (
                <div className={`tp-admin-funnel-row tp-admin-tone-${item.tone}`} key={item.label}><span>{item.label}</span><i><b style={{ width: `${Math.max(3, (item.value / overviewData.statuses.total) * 100)}%` }} /></i><strong>{Number(item.value || 0).toLocaleString("en-US")}</strong><em>{overviewData.statuses.total ? `${((item.value / overviewData.statuses.total) * 100).toFixed(1)}%` : "0%"}</em></div>
              ))}
            </div>
          </CardState>
        </article>
      </section>
    </div>
  );
}
