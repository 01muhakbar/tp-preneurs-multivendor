import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BadgeCheck,
  Box,
  ChartNoAxesCombined,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  Link2,
  PackagePlus,
  Percent,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import { formatSeller2026Currency } from "../../api/seller2026/dashboard.adapter.ts";
import { useSeller2026Dashboard } from "../../hooks/seller2026/useSeller2026Dashboard.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/SellerWorkspace2026.css";

const toneForStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value.includes("ready") || value.includes("active")) return "success";
  if (value.includes("no product") || value.includes("update") || value.includes("high")) {
    return "warning";
  }
  if (value.includes("low")) return "info";
  return "neutral";
};

function StatusPill({ children, tone }) {
  return (
    <span className={`seller2026-pill seller2026-pill--${tone || toneForStatus(children)}`}>
      {children}
    </span>
  );
}

function SectionCard({ title, icon: Icon, meta, children, className = "" }) {
  return (
    <section className={`seller2026-card ${className}`}>
      <header className="seller2026-card__header">
        <div className="seller2026-card__title">
          {Icon ? <span className="seller2026-card__icon"><Icon size={16} /></span> : null}
          <h2>{title}</h2>
        </div>
        {meta}
      </header>
      {children}
    </section>
  );
}

function MetricCard({ label, value, note, icon: Icon, tone }) {
  return (
    <div className="seller2026-metric">
      <span className={`seller2026-metric__icon seller2026-metric__icon--${tone}`}>
        <Icon size={20} />
      </span>
      <div>
        <span className="seller2026-metric__label">{label}</span>
        <strong>{value}</strong>
        <small>{note || "vs last 7 days"}</small>
      </div>
    </div>
  );
}

function DashboardLink({ to, disabled, title, children, primary = false }) {
  const className = `seller2026-action${primary ? " seller2026-action--primary" : ""}${
    disabled ? " is-disabled" : ""
  }`;
  if (disabled) {
    return <span className={className} title={title}>{children}</span>;
  }
  return <Link className={className} to={to}>{children}</Link>;
}

function MiniChart({ labels, values }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = 4 + (index / Math.max(values.length - 1, 1)) * 92;
      const y = 88 - (Number(value || 0) / max) * 70;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="seller2026-chart" aria-label="Sales for the last 7 days">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id="seller2026-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity=".18" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="seller2026-chart__grid">
          {[18, 41, 64, 87].map((y) => <line key={y} x1="4" x2="96" y1={y} y2={y} />)}
        </g>
        <polyline className="seller2026-chart__area" points={`4,92 ${points} 96,92`} />
        <polyline className="seller2026-chart__line" points={points} />
        {values.map((value, index) => {
          const [x, y] = points.split(" ")[index].split(",");
          return <circle key={`${index}-${value}`} cx={x} cy={y} r="1.25" />;
        })}
      </svg>
      <div className="seller2026-chart__labels">
        {labels.map((label) => <span key={label}>{label}</span>)}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="seller2026-dashboard" aria-label="Loading workspace">
      <span className="sr-only">Loading workspace...</span>
      <div className="seller2026-skeleton seller2026-skeleton--hero" />
      <div className="seller2026-dashboard__two">
        <div className="seller2026-skeleton" />
        <div className="seller2026-skeleton" />
      </div>
      <div className="seller2026-dashboard__two">
        <div className="seller2026-skeleton" />
        <div className="seller2026-skeleton" />
      </div>
    </div>
  );
}

export default function Seller2026LiveDashboardPage() {
  const {
    sellerContext,
    workspaceStoreId: storeId,
    workspaceStoreSlug: storeSlug,
    workspaceRoutes,
  } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canViewStore = can("STORE_DASHBOARD_VIEW");
  const canViewOrders = can("ORDER_READ");
  const canReviewPayments = can("PAYMENT_REVIEW_READ");
  const canCreateProduct = can("CATALOG_PRODUCT_CREATE");
  const dashboardQuery = useSeller2026Dashboard(storeSlug, {
    storeId,
    enabled: canViewStore,
    sellerContext,
    canViewOrders,
  });

  if (!canViewStore) {
    return (
      <div className="seller2026-dashboard">
        <div className="seller2026-error" role="alert">
          <ShieldCheck size={18} />
          <strong>You do not have permission to view this workspace overview.</strong>
        </div>
      </div>
    );
  }
  if (dashboardQuery.isLoading) return <DashboardSkeleton />;

  const data = dashboardQuery.data;
  const store = data.store;
  const metrics = data.metrics;
  const publicStoreUrl = store.slug ? `/store/${encodeURIComponent(store.slug)}` : null;
  const attention = [
    { label: "Complete store profile", chip: "High", to: workspaceRoutes.storeProfile(), icon: Store },
    { label: "Monitor workspace snapshot", chip: "Low", to: workspaceRoutes.home(), icon: ClipboardCheck },
    { label: "Open payment review", chip: "Monitor", to: workspaceRoutes.paymentReview(), icon: WalletCards, disabled: !canReviewPayments },
    { label: "Check current orders", chip: "Monitor", to: workspaceRoutes.orders(), icon: ShoppingBag, disabled: !canViewOrders },
  ];
  const quickLinks = [
    ["Orders", workspaceRoutes.orders(), ShoppingBag, !canViewOrders],
    ["Payments", workspaceRoutes.paymentProfile(), CreditCard, false],
    ["Products", workspaceRoutes.catalog(), Box, false],
    ["Catalog", workspaceRoutes.catalog(), Tags, false],
    ["Store Profile", workspaceRoutes.storeProfile(), Store, false],
    ["Team", workspaceRoutes.team(), Users, false],
  ];

  return (
    <div className="seller2026-dashboard">
      {dashboardQuery.isError ? (
        <div className="seller2026-error" role="alert">
          <AlertTriangle size={18} />
          <strong>Unable to load workspace</strong>
          <button type="button" onClick={() => dashboardQuery.refetch()}>Retry</button>
        </div>
      ) : null}

      <div className="seller2026-dashboard__top">
        <SectionCard className="seller2026-command">
          <div className="seller2026-command__heading">
            <div>
              <div className="seller2026-command__title">
                <h1>{store.name}</h1>
                <StatusPill tone={String(store.status).toUpperCase() === "ACTIVE" ? "success" : "warning"}>
                  {String(store.status).toLowerCase().replace(/(^|_)(\w)/g, (_, space, letter) => `${space ? " " : ""}${letter.toUpperCase()}`)}
                </StatusPill>
                <StatusPill tone={store.shippingReady ? "success" : "warning"}>
                  {store.shippingReady ? "Shipping Ready" : "Shipping Setup"}
                </StatusPill>
              </div>
              <p>Command Center</p>
            </div>
            {publicStoreUrl ? (
              <Link className="seller2026-view-store" to={publicStoreUrl} target="_blank">
                View Store <ExternalLink size={15} />
              </Link>
            ) : (
              <span className="seller2026-view-store is-disabled">View Store</span>
            )}
          </div>

          <div className="seller2026-command__metrics">
            <MetricCard label="Revenue" value={metrics.revenue7dLabel} icon={CircleDollarSign} tone="violet" />
            <MetricCard label="Orders" value={metrics.orders7dLabel} icon={ShoppingBag} tone="mint" />
            <MetricCard label="Products" value={metrics.productsLabel} note={metrics.products ? "Current catalog" : "No products yet"} icon={Box} tone="orange" />
            <MetricCard label="Conversion" value={metrics.conversionLabel} icon={Percent} tone="blue" />
          </div>

          <div className="seller2026-command__actions">
            <span>Quick Actions</span>
            <DashboardLink to={workspaceRoutes.paymentReview()} disabled={!canReviewPayments} title="Payment review permission required">
              <ShieldCheck size={16} /> Review Payments
            </DashboardLink>
            <DashboardLink to={workspaceRoutes.orders()} disabled={!canViewOrders} title="Order permission required">
              <ReceiptText size={16} /> Open Orders
            </DashboardLink>
            <DashboardLink to={workspaceRoutes.productCreate()} disabled={!canCreateProduct} title="Product create permission required" primary>
              <PackagePlus size={16} /> Add Product
            </DashboardLink>
          </div>
        </SectionCard>

        <SectionCard title="Needs Attention" icon={AlertTriangle}>
          <div className="seller2026-list">
            {attention.map((item) => {
              const content = (
                <>
                  <span className="seller2026-list__icon"><item.icon size={16} /></span>
                  <span>{item.label}</span>
                  <StatusPill>{item.chip}</StatusPill>
                  <ChevronRight size={16} />
                </>
              );
              return item.disabled ? (
                <span className="seller2026-list__row is-disabled" key={item.label} title="Permission required">{content}</span>
              ) : (
                <Link className="seller2026-list__row" to={item.to} key={item.label}>{content}</Link>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="seller2026-dashboard__two">
        <SectionCard
          title="Workspace Readiness"
          icon={ShieldCheck}
          meta={<StatusPill tone="info">{data.readiness.percent}% Ready</StatusPill>}
        >
          <div className="seller2026-readiness">
            {data.readiness.items.map((item) => (
              <div className="seller2026-readiness__item" key={item.key}>
                <strong>{item.label}</strong>
                <span>{item.status}</span>
                <div className="seller2026-progress"><i style={{ width: `${item.percent}%` }} /></div>
                <small>{item.completed}/{item.total}</small>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Onboarding Checklist"
          icon={ClipboardCheck}
          meta={<span className="seller2026-card__meta">{data.checklistSummary.completed} / {data.checklistSummary.total} Completed</span>}
        >
          <div className="seller2026-checklist">
            {data.checklist.map((item) => (
              <div className="seller2026-checklist__row" key={item.key}>
                <strong>{item.label}</strong>
                <StatusPill>{item.key === "products" && item.status === "No products" ? "No products yet" : item.status}</StatusPill>
                <span>{item.completed} / {item.total}</span>
                <div className="seller2026-progress"><i style={{ width: `${item.percent}%` }} /></div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="seller2026-dashboard__content">
        <SectionCard title="Analytics" icon={ChartNoAxesCombined} meta={<span className="seller2026-select">Last 7 days</span>}>
          <div className="seller2026-analytics__metrics">
            <MetricCard label="Revenue" value={metrics.revenue7dLabel} icon={CircleDollarSign} tone="mint" />
            <MetricCard label="Orders" value={metrics.orders7dLabel} icon={ShoppingBag} tone="mint" />
            <MetricCard label="AOV" value={metrics.aovLabel} icon={Box} tone="orange" />
            <MetricCard label="Coupons" value={metrics.couponsLabel} icon={Percent} tone="violet" />
          </div>
          <MiniChart labels={data.analytics.labels} values={data.analytics.sales} />
        </SectionCard>

        <div className="seller2026-dashboard__side">
          <div className="seller2026-dashboard__side-row">
            <SectionCard title="Payments & Orders" icon={CreditCard}>
              <div className="seller2026-compact-list">
                <Link to={workspaceRoutes.paymentReview()}>
                  {data.paymentsOrders.pendingReview ? `${data.paymentsOrders.pendingReview} pending review` : "No pending review"}
                  <ChevronRight size={15} />
                </Link>
                <Link to={workspaceRoutes.orders()}>
                  {data.paymentsOrders.orders ? `${data.paymentsOrders.orders} orders` : "No orders"}
                  <ChevronRight size={15} />
                </Link>
              </div>
            </SectionCard>
            <SectionCard title="Payment Setup" icon={WalletCards} meta={<StatusPill>{data.paymentSetup.ready ? "Ready" : "Needs update"}</StatusPill>}>
              <dl className="seller2026-definition">
                <div><dt>Provider</dt><dd>{data.paymentSetup.provider}</dd></div>
                <div><dt>Type</dt><dd>{data.paymentSetup.type}</dd></div>
              </dl>
            </SectionCard>
          </div>
          <div className="seller2026-dashboard__side-row">
            <SectionCard title="Store Context" icon={Store}>
              <dl className="seller2026-definition">
                <div><dt>Role</dt><dd>{store.role}</dd></div>
                <div><dt>Scope</dt><dd>{store.slug}</dd></div>
              </dl>
            </SectionCard>
            <SectionCard title="Quick Links" icon={Link2}>
              <div className="seller2026-quick-links">
                {quickLinks.map(([label, to, Icon, disabled]) => disabled ? (
                  <span className="is-disabled" key={label}><Icon size={15} />{label}</span>
                ) : (
                  <Link to={to} key={label}><Icon size={15} />{label}</Link>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      <div className="seller2026-dashboard__bottom">
        <SectionCard title="Operational Snapshot" icon={Truck}>
          <div className="seller2026-strip">
            {[
              ["Paid Splits", data.operational.paidSplits],
              ["Processing", data.operational.processing],
              ["Completed", data.operational.completed],
              ["Waiting", data.operational.waiting],
              ["Exceptions", data.operational.exceptions],
              ["Completed Rev.", formatSeller2026Currency(data.operational.completedRevenue)],
              ["In-Flight Rev.", formatSeller2026Currency(data.operational.inFlightRevenue)],
              ["AOV", formatSeller2026Currency(data.operational.aov)],
            ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
          </div>
        </SectionCard>
        <SectionCard title="Coupon Attribution" icon={BadgeCheck}>
          <div className="seller2026-strip seller2026-strip--four">
            <div><span>Attributed Orders</span><strong>{data.couponAttribution.attributedOrders}</strong></div>
            <div><span>Attributed Discount</span><strong>{formatSeller2026Currency(data.couponAttribution.attributedDiscount)}</strong></div>
            <div><span>Coverage</span><strong>{data.couponAttribution.coverage}%</strong></div>
            <div><span>Status</span><strong>{data.couponAttribution.status}</strong></div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
