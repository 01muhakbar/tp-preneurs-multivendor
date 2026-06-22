import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Headphones,
  Heart,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { formatCurrency } from "../../utils/format.js";
import { resolvePublicOrderReference } from "../../utils/publicOrderReference.js";
import "./account-dashboard-2026.css";

const money = (value) => formatCurrency(Number(value || 0));
const asNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const getOrderDateValue = (order) =>
  order?.createdAt || order?.created_at || order?.orderTime || null;

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getPublicOrderRef = (order) =>
  resolvePublicOrderReference(order?.invoiceNo, order?.ref, order?.invoice, order?.orderRef);

const getOrderTone = (status) => {
  const value = `${status?.bucket || ""} ${status?.label || ""}`.toLowerCase();
  if (/fail|reject|cancel/.test(value)) return "danger";
  if (/complete|paid|deliver|approve/.test(value)) return "success";
  if (/review|pending|split|await/.test(value)) return "warning";
  if (/process|ship|submit|confirm/.test(value)) return "info";
  return "neutral";
};

function StatusPill({ label, tone = "neutral" }) {
  if (!label) return null;
  return <span className={`tp-status-pill tp-status-pill--${tone}`}>{label}</span>;
}

function DashboardSkeleton({ rows = 1 }) {
  return (
    <div className="tp-dashboard-skeleton" aria-label="Loading dashboard data" aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => <span key={index} />)}
    </div>
  );
}

function StatCard({ label, value, hint, Icon, tone, loading }) {
  return (
    <article className="tp-dashboard-stat">
      <span className={`tp-dashboard-icon tp-dashboard-icon--${tone}`}><Icon aria-hidden="true" /></span>
      <div>
        <p>{label}</p>
        <strong>{loading ? "–" : asNumber(value)}</strong>
        <span>{hint}</span>
      </div>
    </article>
  );
}

function resolveStoreActions(onboarding) {
  if (onboarding?.workspaceHref) {
    return { primary: "Open Workspace", primaryHref: onboarding.workspaceHref, secondary: "View Details" };
  }
  const status = String(onboarding?.status || "").toLowerCase();
  if (!onboarding?.hasApplication) {
    return { primary: "Start Application", primaryHref: "/user/store-application", secondary: "View Details" };
  }
  if (status === "revision_requested") {
    return { primary: onboarding?.workflow?.canResubmit ? "Review & Resubmit" : "Continue", primaryHref: "/user/store-application", secondary: "View Details" };
  }
  if (status === "draft") {
    return { primary: "Continue", primaryHref: "/user/store-application", secondary: "View Details" };
  }
  return { primary: "View Application", primaryHref: "/user/store-application", secondary: "View Details" };
}

function StoreApplicationCard({ onboarding = {}, loading }) {
  if (loading) return <article className="tp-store-card"><DashboardSkeleton rows={5} /></article>;
  const total = Math.max(0, asNumber(onboarding.totalFields));
  const completed = Math.min(total || Infinity, Math.max(0, asNumber(onboarding.completedFields)));
  const percent = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const actions = resolveStoreActions(onboarding);

  return (
    <article className="tp-store-card">
      <div className="tp-store-card__content">
        <div className="tp-store-card__heading">
          <span className="tp-dashboard-icon tp-dashboard-icon--green"><Store aria-hidden="true" /></span>
          <div>
            <div className="tp-store-card__title">
              <h2>Start Selling</h2>
              <StatusPill label={onboarding.applicationStatus?.label} tone={onboarding.applicationStatus?.tone === "rose" ? "danger" : onboarding.applicationStatus?.tone === "emerald" ? "success" : onboarding.applicationStatus?.tone === "sky" ? "info" : onboarding.applicationStatus?.tone === "warning" || onboarding.applicationStatus?.tone === "amber" ? "warning" : "neutral"} />
              <StatusPill label={onboarding.readinessStatus?.label} tone={onboarding.readinessStatus?.tone === "emerald" ? "success" : "neutral"} />
            </div>
            <p>{onboarding.description || "Complete the required details before you submit."}</p>
          </div>
        </div>

        <div className="tp-store-card__progress">
          <strong>{total ? `${completed} of ${total} fields completed` : "Ready when you are"}</strong>
          <span aria-label={`${percent}% complete`}><i style={{ width: `${percent}%` }} /></span>
        </div>

        <div className="tp-store-card__actions">
          <Link className="tp-dashboard-button tp-dashboard-button--primary" to={actions.primaryHref}>
            {actions.primary}<ArrowRight aria-hidden="true" />
          </Link>
          <Link className="tp-dashboard-button tp-dashboard-button--secondary" to="/user/store-application">
            {actions.secondary}
          </Link>
        </div>

        <div className="tp-store-card__updated">
          <CalendarDays aria-hidden="true" />
          {onboarding.updatedAt ? `Last updated ${formatDateTime(onboarding.updatedAt)}` : "No application started"}
        </div>
      </div>
      <div className="tp-store-card__visual" aria-hidden="true">
        <span className="tp-store-card__halo" />
        <span className="tp-store-card__awning" />
        <Store />
        <PackageCheck />
      </div>
    </article>
  );
}

function QuickAction({ label, value, href, Icon, tone }) {
  return (
    <Link className="tp-quick-action" to={href} aria-label={`${label}: ${value}`}>
      <span className={`tp-dashboard-icon tp-dashboard-icon--${tone}`}><Icon aria-hidden="true" /></span>
      <div><strong>{label}</strong><span>{value}</span></div>
      <em>View <ArrowRight aria-hidden="true" /></em>
    </Link>
  );
}

function RecentOrders({ orders = [], loading }) {
  return (
    <section className="tp-recent-orders" aria-labelledby="tp-recent-orders-title">
      <div className="tp-recent-orders__heading">
        <h2 id="tp-recent-orders-title">Recent Orders</h2>
        <Link to="/user/my-orders">View all orders <ArrowRight aria-hidden="true" /></Link>
      </div>
      {loading ? <DashboardSkeleton rows={3} /> : orders.length === 0 ? (
        <div className="tp-recent-orders__empty">
          <ShoppingBag aria-hidden="true" />
          <div><strong>No recent orders yet</strong><span>Your latest purchases will appear here.</span></div>
          <Link to="/shop">Start shopping <ArrowRight aria-hidden="true" /></Link>
        </div>
      ) : (
        <div className="tp-recent-orders__scroll">
          <table>
            <thead><tr><th>Order ID</th><th>Date & Time</th><th>Method</th><th>Status</th><th>Shipping</th><th>Total</th><th>Action</th></tr></thead>
            <tbody>
              {orders.map(({ order = {}, truthStatus = {} }) => {
                const orderId = order.id;
                const reference = getPublicOrderRef(order) || (orderId ? `#${orderId}` : "Order");
                const shipping = order.shipping ?? order.shippingAmount ?? order.deliveryFee ?? null;
                const total = order.totalAmount ?? order.total ?? 0;
                const detailHref = orderId ? `/user/my-orders/${encodeURIComponent(orderId)}` : null;
                return (
                  <tr key={orderId || reference}>
                    <td data-label="Order ID">{reference}</td>
                    <td data-label="Date & Time">{formatDateTime(getOrderDateValue(order))}</td>
                    <td data-label="Method">{order.paymentMethod || order.method || "–"}</td>
                    <td data-label="Status"><StatusPill label={truthStatus.label || "Pending"} tone={getOrderTone(truthStatus)} /></td>
                    <td data-label="Shipping">{shipping == null || shipping === "" ? "–" : money(shipping)}</td>
                    <td data-label="Total">{money(total)}</td>
                    <td data-label="Action">{detailHref ? <Link className="tp-recent-orders__view" to={detailHref} aria-label={`View order ${reference}`}><Eye aria-hidden="true" /></Link> : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AccountDashboard2026View({
  user,
  stats = {},
  recentOrders = [],
  onboarding = {},
  notificationCount = 0,
  invitationCount = 0,
  addressCount = 0,
  isOrdersLoading = false,
  isOnboardingLoading = false,
  errors = [],
}) {
  const name = user?.name || user?.fullName || user?.email?.split("@")[0] || "there";
  const statCards = [
    ["Total Orders", stats.total, "All orders", ShoppingBag, "green"],
    ["Pending Orders", stats.pending, "Awaiting action", Clock3, "orange"],
    ["Processing Orders", stats.processing, "In progress", Truck, "blue"],
    ["Completed Orders", stats.completed, "Done", CheckCircle2, "emerald"],
  ];
  const quickLinks = [
    ["Wishlist", "Browse saved items", "/wishlist", Heart, "green"],
    ["Addresses", addressCount ? `${addressCount} saved` : "Add address", "/user/shipping-address", MapPin, "blue"],
    ["Notifications", `${asNumber(notificationCount)} new messages`, "/user/notifications", Bell, "orange"],
    ["Invitations", `${asNumber(invitationCount)} store invites`, "/user/store-invitations", Store, "purple"],
  ];

  return (
    <div className="tp-account-dashboard-2026">
      <header className="tp-account-dashboard-2026__heading">
        <span>Account Overview</span>
        <h1>Dashboard</h1>
        <p>Welcome back, {name}. Here&apos;s what&apos;s happening with your account.</p>
      </header>

      {errors.length > 0 ? <div className="tp-account-dashboard-2026__alert" role="status">{errors.join(" ")}</div> : null}

      <section className="tp-account-dashboard-2026__stats" aria-label="Order summary">
        {statCards.map(([label, value, hint, Icon, tone]) => <StatCard key={label} label={label} value={value} hint={hint} Icon={Icon} tone={tone} loading={isOrdersLoading} />)}
      </section>

      <section className="tp-account-dashboard-2026__middle">
        <StoreApplicationCard onboarding={onboarding} loading={isOnboardingLoading} />
        <div className="tp-account-dashboard-2026__quick" aria-label="Quick account links">
          {quickLinks.map(([label, value, href, Icon, tone]) => <QuickAction key={label} label={label} value={value} href={href} Icon={Icon} tone={tone} />)}
        </div>
      </section>

      <RecentOrders orders={recentOrders} loading={isOrdersLoading} />

      <Link className="tp-account-dashboard-2026__help" to="/contact-us">
        <span className="tp-dashboard-icon tp-dashboard-icon--blue"><Headphones aria-hidden="true" /></span>
        <div><strong>Need help? +65 9988 7766</strong><span>We&apos;re available <em>24/7</em></span></div>
        <ArrowRight aria-hidden="true" />
      </Link>
    </div>
  );
}
