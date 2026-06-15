import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Heart,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { formatCurrency } from "../../utils/format.js";
import { getOrderStatusBadgeClass } from "../../utils/orderStatus.js";
import { resolvePublicOrderReference } from "../../utils/publicOrderReference.js";
import "./account-dashboard-2026.css";

const money = (value) => formatCurrency(Number(value || 0));

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
  resolvePublicOrderReference(
    order?.invoiceNo,
    order?.ref,
    order?.invoice,
    order?.orderRef
  );

const BADGE_TONES = {
  stone: "tpdash2026-badge--stone",
  amber: "tpdash2026-badge--amber",
  warning: "tpdash2026-badge--amber",
  sky: "tpdash2026-badge--sky",
  emerald: "tpdash2026-badge--emerald",
  rose: "tpdash2026-badge--rose",
};

function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span
      className={`tpdash2026-badge ${
        BADGE_TONES[status.tone] || BADGE_TONES.stone
      }`}
    >
      {status.label}
    </span>
  );
}

function DashboardSkeleton({ rows = 1 }) {
  return (
    <div className="tpdash2026-skeleton" aria-label="Loading dashboard data">
      {Array.from({ length: rows }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

export default function AccountDashboard2026View({
  user,
  stats,
  recentOrders,
  onboarding,
  notificationCount,
  invitationCount,
  addressCount,
  isOrdersLoading,
  isOnboardingLoading,
  errors,
}) {
  const statCards = [
    {
      label: "Total Orders",
      value: stats.total,
      hint: "All orders",
      Icon: ShoppingBag,
      tone: "green",
    },
    {
      label: "Pending Orders",
      value: stats.pending,
      hint: "Awaiting action",
      Icon: Clock3,
      tone: "orange",
    },
    {
      label: "Processing Orders",
      value: stats.processing,
      hint: "In progress",
      Icon: Truck,
      tone: "blue",
    },
    {
      label: "Completed Orders",
      value: stats.completed,
      hint: "Done",
      Icon: CheckCircle2,
      tone: "emerald",
    },
  ];
  const quickLinks = [
    {
      label: "Wishlist",
      value: "Browse products",
      href: "/search",
      Icon: Heart,
      tone: "green",
    },
    {
      label: "Addresses",
      value: `${addressCount} saved`,
      href: "/user/shipping-address",
      Icon: MapPin,
      tone: "blue",
    },
    {
      label: "Notifications",
      value: `${notificationCount} new`,
      href: "/user/notifications",
      Icon: Bell,
      tone: "orange",
    },
    {
      label: "Invitations",
      value: `${invitationCount} invites`,
      href: "/user/store-invitations",
      Icon: Store,
      tone: "purple",
    },
  ];
  const progressTotal = onboarding.totalFields;
  const progressPercent =
    progressTotal > 0
      ? Math.min(100, Math.round((onboarding.completedFields / progressTotal) * 100))
      : 0;

  return (
    <div className="tpdash2026-root">
      <header className="tpdash2026-heading">
        <h1>Dashboard</h1>
        <p>{user?.name ? `Welcome back, ${user.name}.` : "Welcome back."}</p>
      </header>

      {errors.length > 0 ? (
        <div className="tpdash2026-alert" role="status">
          {errors.join(" ")}
        </div>
      ) : null}

      <section className="tpdash2026-stats" aria-label="Order summary">
        {statCards.map(({ label, value, hint, Icon, tone }) => (
          <article className="tpdash2026-stat" key={label}>
            <span className={`tpdash2026-icon tpdash2026-icon--${tone}`}>
              <Icon aria-hidden="true" />
            </span>
            <div>
              <p>{label}</p>
              <strong>{isOrdersLoading ? "-" : value}</strong>
              <span>{hint}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="tpdash2026-middle">
        <article className="tpdash2026-selling">
          {isOnboardingLoading ? (
            <DashboardSkeleton rows={4} />
          ) : (
            <>
              <div className="tpdash2026-selling__content">
                <div className="tpdash2026-selling__title">
                  <span className="tpdash2026-icon tpdash2026-icon--green">
                    <Store aria-hidden="true" />
                  </span>
                  <div>
                    <div className="tpdash2026-selling__badges">
                      <h2>Start Selling</h2>
                      <StatusBadge status={onboarding.applicationStatus} />
                      <StatusBadge status={onboarding.readinessStatus} />
                    </div>
                    <p>{onboarding.description}</p>
                  </div>
                </div>

                <div className="tpdash2026-progress">
                  <strong>
                    {progressTotal > 0
                      ? `${onboarding.completedFields} of ${progressTotal} fields completed`
                      : "No application started"}
                  </strong>
                  <span>
                    <i style={{ width: `${progressPercent}%` }} />
                  </span>
                </div>

                <div className="tpdash2026-actions">
                  <Link className="tpdash2026-primary-action" to="/user/store-application">
                    Continue
                    <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link className="tpdash2026-secondary-action" to="/user/store-application">
                    Details
                  </Link>
                </div>

                <div className="tpdash2026-updated">
                  <CalendarDays aria-hidden="true" />
                  {onboarding.updatedAt
                    ? `Updated ${formatDateTime(onboarding.updatedAt)}`
                    : "Ready when you are"}
                </div>
              </div>

              <div className="tpdash2026-selling__visual" aria-hidden="true">
                <span className="tpdash2026-shop-awning" />
                <Store />
                <PackageCheck />
              </div>
            </>
          )}
        </article>

        <div className="tpdash2026-quick" aria-label="Quick account links">
          {quickLinks.map(({ label, value, href, Icon, tone }) => (
            <Link className="tpdash2026-quick__item" to={href} key={label}>
              <span className={`tpdash2026-icon tpdash2026-icon--${tone}`}>
                <Icon aria-hidden="true" />
              </span>
              <strong>{label}</strong>
              <span>{value}</span>
              <em>
                View <ArrowRight aria-hidden="true" />
              </em>
            </Link>
          ))}
        </div>
      </section>

      <section className="tpdash2026-orders">
        <div className="tpdash2026-orders__heading">
          <h2>Recent Orders</h2>
          <Link to="/user/my-orders">
            View all orders <ArrowRight aria-hidden="true" />
          </Link>
        </div>

        {isOrdersLoading ? (
          <DashboardSkeleton rows={3} />
        ) : recentOrders.length === 0 ? (
          <p className="tpdash2026-empty">No recent orders yet.</p>
        ) : (
          <div className="tpdash2026-table-scroll">
            <table className="tpdash2026-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Time</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Shipping</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(({ order, truthStatus }) => {
                  const orderId = order?.id;
                  const reference = getPublicOrderRef(order);
                  const shipping =
                    order?.shipping ?? order?.shippingAmount ?? order?.deliveryFee ?? null;
                  const total = order?.totalAmount ?? order?.total ?? 0;
                  return (
                    <tr key={orderId || reference}>
                      <td>{reference || `#${orderId}`}</td>
                      <td>{formatDateTime(getOrderDateValue(order))}</td>
                      <td>{order?.paymentMethod || order?.method || "-"}</td>
                      <td>
                        <span className={getOrderStatusBadgeClass(truthStatus.bucket)}>
                          {truthStatus.label}
                        </span>
                      </td>
                      <td>{shipping == null || shipping === "" ? "-" : money(shipping)}</td>
                      <td>{money(total)}</td>
                      <td>
                        {orderId ? (
                          <Link
                            className="tpdash2026-order-action"
                            to={`/user/my-orders/${encodeURIComponent(orderId)}`}
                            aria-label={`View order ${reference || orderId}`}
                          >
                            <Eye aria-hidden="true" />
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
