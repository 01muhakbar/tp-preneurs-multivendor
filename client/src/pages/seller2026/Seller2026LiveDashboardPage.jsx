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

function MetricCard({ label, value, note, icon: Icon, tone, isId = false }) {
  return (
    <div className="seller2026-metric">
      <span className={`seller2026-metric__icon seller2026-metric__icon--${tone}`}>
        <Icon size={20} />
      </span>
      <div>
        <span className="seller2026-metric__label">{label}</span>
        <strong>{value}</strong>
        <small>{note || (isId ? "vs 7 hari lalu" : "vs last 7 days")}</small>
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

function MiniChart({ labels, values, isId = false }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = 4 + (index / Math.max(values.length - 1, 1)) * 92;
      const y = 88 - (Number(value || 0) / max) * 70;
      return `${x},${y}`;
    })
    .join(" ");

  const translateDateLabel = (label) => {
    if (!isId || !label) return label;
    return String(label)
      .replace(/\bMay\b/g, "Mei")
      .replace(/\bAug\b/g, "Ags")
      .replace(/\bOct\b/g, "Okt")
      .replace(/\bDec\b/g, "Des");
  };

  return (
    <div className="seller2026-chart" aria-label={isId ? "Penjualan 7 hari terakhir" : "Sales for the last 7 days"}>
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
        {labels.map((label) => <span key={label}>{translateDateLabel(label)}</span>)}
      </div>
    </div>
  );
}

function DashboardSkeleton({ isId = false }) {
  return (
    <div className="seller2026-dashboard" aria-label={isId ? "Memuat ruang kerja" : "Loading workspace"}>
      <span className="sr-only">{isId ? "Memuat ruang kerja..." : "Loading workspace..."}</span>
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

function translateDashboardItem(label, isId) {
  if (!isId) return label;
  switch (label) {
    case "Store Profile":
      return "Profil Toko";
    case "Shipping Setup":
      return "Pengaturan Pengiriman";
    case "Payment Setup":
      return "Pengaturan Pembayaran";
    case "Products":
      return "Produk";
    default:
      return label;
  }
}

function translateStatusLabel(status, isId) {
  if (!isId) return status;
  switch (status) {
    case "Ready":
      return "Siap";
    case "Needs update":
      return "Perlu diperbarui";
    case "No products":
    case "No products yet":
      return "Belum ada produk";
    default:
      return status;
  }
}

export default function Seller2026LiveDashboardPage() {
  const {
    sellerContext,
    workspaceStoreId: storeId,
    workspaceStoreSlug: storeSlug,
    workspaceRoutes,
    isId = false,
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
          <strong>
            {isId
              ? "Anda tidak memiliki izin untuk melihat ringkasan ruang kerja ini."
              : "You do not have permission to view this workspace overview."}
          </strong>
        </div>
      </div>
    );
  }
  if (dashboardQuery.isLoading) return <DashboardSkeleton isId={isId} />;

  const data = dashboardQuery.data;
  const store = data.store;
  const metrics = data.metrics;
  const publicStoreUrl = store.slug ? `/store/${encodeURIComponent(store.slug)}` : null;
  const attention = [
    { label: isId ? "Lengkapi profil toko" : "Complete store profile", chip: isId ? "Tinggi" : "High", to: workspaceRoutes.storeProfile(), icon: Store },
    { label: isId ? "Pantau ringkasan ruang kerja" : "Monitor workspace snapshot", chip: isId ? "Rendah" : "Low", to: workspaceRoutes.home(), icon: ClipboardCheck },
    { label: isId ? "Buka tinjauan pembayaran" : "Open payment review", chip: isId ? "Pantau" : "Monitor", to: workspaceRoutes.paymentReview(), icon: WalletCards, disabled: !canReviewPayments },
    { label: isId ? "Periksa pesanan terkini" : "Check current orders", chip: isId ? "Pantau" : "Monitor", to: workspaceRoutes.orders(), icon: ShoppingBag, disabled: !canViewOrders },
  ];
  const quickLinks = [
    [isId ? "Pesanan" : "Orders", workspaceRoutes.orders(), ShoppingBag, !canViewOrders],
    [isId ? "Pembayaran" : "Payments", workspaceRoutes.paymentProfile(), CreditCard, false],
    [isId ? "Produk" : "Products", workspaceRoutes.catalog(), Box, false],
    [isId ? "Katalog" : "Catalog", workspaceRoutes.catalog(), Tags, false],
    [isId ? "Profil Toko" : "Store Profile", workspaceRoutes.storeProfile(), Store, false],
    [isId ? "Tim" : "Team", workspaceRoutes.team(), Users, false],
  ];

  return (
    <div className="seller2026-dashboard">
      {dashboardQuery.isError ? (
        <div className="seller2026-error" role="alert">
          <AlertTriangle size={18} />
          <strong>{isId ? "Gagal memuat ruang kerja" : "Unable to load workspace"}</strong>
          <button type="button" onClick={() => dashboardQuery.refetch()}>
            {isId ? "Coba Lagi" : "Retry"}
          </button>
        </div>
      ) : null}

      <div className="seller2026-dashboard__top">
        <SectionCard className="seller2026-command">
          <div className="seller2026-command__heading">
            <div>
              <div className="seller2026-command__title">
                <h1>{store.name}</h1>
                <StatusPill tone={String(store.status).toUpperCase() === "ACTIVE" ? "success" : "warning"}>
                  {String(store.status).toUpperCase() === "ACTIVE"
                    ? (isId ? "Aktif" : "Active")
                    : String(store.status).toLowerCase().replace(/(^|_)(\w)/g, (_, space, letter) => `${space ? " " : ""}${letter.toUpperCase()}`)}
                </StatusPill>
                <StatusPill tone={store.shippingReady ? "success" : "warning"}>
                  {store.shippingReady
                    ? (isId ? "Siap Kirim" : "Shipping Ready")
                    : (isId ? "Atur Pengiriman" : "Shipping Setup")}
                </StatusPill>
              </div>
              <p>{isId ? "Pusat Kendali" : "Command Center"}</p>
            </div>
            {publicStoreUrl ? (
              <Link className="seller2026-view-store" to={publicStoreUrl} target="_blank">
                {isId ? "Lihat Toko" : "View Store"} <ExternalLink size={15} />
              </Link>
            ) : (
              <span className="seller2026-view-store is-disabled">
                {isId ? "Lihat Toko" : "View Store"}
              </span>
            )}
          </div>

          <div className="seller2026-command__metrics">
            <MetricCard label={isId ? "Pendapatan" : "Revenue"} value={metrics.revenue7dLabel} icon={CircleDollarSign} tone="violet" isId={isId} />
            <MetricCard label={isId ? "Pesanan" : "Orders"} value={metrics.orders7dLabel} icon={ShoppingBag} tone="mint" isId={isId} />
            <MetricCard label={isId ? "Produk" : "Products"} value={metrics.productsLabel} note={metrics.products ? (isId ? "Katalog saat ini" : "Current catalog") : (isId ? "Belum ada produk" : "No products yet")} icon={Box} tone="orange" isId={isId} />
            <MetricCard label={isId ? "Konversi" : "Conversion"} value={metrics.conversionLabel} icon={Percent} tone="blue" isId={isId} />
          </div>

          <div className="seller2026-command__actions">
            <span>{isId ? "Aksi Cepat" : "Quick Actions"}</span>
            <DashboardLink to={workspaceRoutes.paymentReview()} disabled={!canReviewPayments} title={isId ? "Izin tinjau pembayaran diperlukan" : "Payment review permission required"}>
              <ShieldCheck size={16} /> {isId ? "Tinjau Pembayaran" : "Review Payments"}
            </DashboardLink>
            <DashboardLink to={workspaceRoutes.orders()} disabled={!canViewOrders} title={isId ? "Izin pesanan diperlukan" : "Order permission required"}>
              <ReceiptText size={16} /> {isId ? "Buka Pesanan" : "Open Orders"}
            </DashboardLink>
            <DashboardLink to={workspaceRoutes.productCreate()} disabled={!canCreateProduct} title={isId ? "Izin buat produk diperlukan" : "Product create permission required"} primary>
              <PackagePlus size={16} /> {isId ? "Tambah Produk" : "Add Product"}
            </DashboardLink>
          </div>
        </SectionCard>

        <SectionCard title={isId ? "Perlu Perhatian" : "Needs Attention"} icon={AlertTriangle}>
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
                <span className="seller2026-list__row is-disabled" key={item.label} title={isId ? "Izin diperlukan" : "Permission required"}>{content}</span>
              ) : (
                <Link className="seller2026-list__row" to={item.to} key={item.label}>{content}</Link>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="seller2026-dashboard__two">
        <SectionCard
          title={isId ? "Kesiapan Ruang Kerja" : "Workspace Readiness"}
          icon={ShieldCheck}
          meta={<StatusPill tone="info">{data.readiness.percent}% {isId ? "Siap" : "Ready"}</StatusPill>}
        >
          <div className="seller2026-readiness">
            {data.readiness.items.map((item) => (
              <div className="seller2026-readiness__item" key={item.key}>
                <strong>{translateDashboardItem(item.label, isId)}</strong>
                <span>{translateStatusLabel(item.status, isId)}</span>
                <div className="seller2026-progress"><i style={{ width: `${item.percent}%` }} /></div>
                <small>{item.completed}/{item.total}</small>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={isId ? "Daftar Periksa Onboarding" : "Onboarding Checklist"}
          icon={ClipboardCheck}
          meta={<span className="seller2026-card__meta">{data.checklistSummary.completed} / {data.checklistSummary.total} {isId ? "Selesai" : "Completed"}</span>}
        >
          <div className="seller2026-checklist">
            {data.checklist.map((item) => (
              <div className="seller2026-checklist__row" key={item.key}>
                <strong>{translateDashboardItem(item.label, isId)}</strong>
                <StatusPill>{translateStatusLabel(item.key === "products" && item.status === "No products" ? "No products yet" : item.status, isId)}</StatusPill>
                <span>{item.completed} / {item.total}</span>
                <div className="seller2026-progress"><i style={{ width: `${item.percent}%` }} /></div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="seller2026-dashboard__content">
        <SectionCard title={isId ? "Analitik" : "Analytics"} icon={ChartNoAxesCombined} meta={<span className="seller2026-select">{isId ? "7 hari terakhir" : "Last 7 days"}</span>}>
          <div className="seller2026-analytics__metrics">
            <MetricCard label={isId ? "Pendapatan" : "Revenue"} value={metrics.revenue7dLabel} icon={CircleDollarSign} tone="mint" isId={isId} />
            <MetricCard label={isId ? "Pesanan" : "Orders"} value={metrics.orders7dLabel} icon={ShoppingBag} tone="mint" isId={isId} />
            <MetricCard label="AOV" value={metrics.aovLabel} icon={Box} tone="orange" isId={isId} />
            <MetricCard label={isId ? "Kupon" : "Coupons"} value={metrics.couponsLabel} icon={Percent} tone="violet" isId={isId} />
          </div>
          <MiniChart labels={data.analytics.labels} values={data.analytics.sales} isId={isId} />
        </SectionCard>

        <div className="seller2026-dashboard__side">
          <div className="seller2026-dashboard__side-row">
            <SectionCard title={isId ? "Pembayaran & Pesanan" : "Payments & Orders"} icon={CreditCard}>
              <div className="seller2026-compact-list">
                <Link to={workspaceRoutes.paymentReview()}>
                  {data.paymentsOrders.pendingReview
                    ? (isId ? `${data.paymentsOrders.pendingReview} menunggu tinjauan` : `${data.paymentsOrders.pendingReview} pending review`)
                    : (isId ? "Tidak ada yang menunggu tinjauan" : "No pending review")}
                  <ChevronRight size={15} />
                </Link>
                <Link to={workspaceRoutes.orders()}>
                  {data.paymentsOrders.orders
                    ? (isId ? `${data.paymentsOrders.orders} pesanan` : `${data.paymentsOrders.orders} orders`)
                    : (isId ? "Belum ada pesanan" : "No orders")}
                  <ChevronRight size={15} />
                </Link>
              </div>
            </SectionCard>
            <SectionCard title={isId ? "Pengaturan Pembayaran" : "Payment Setup"} icon={WalletCards} meta={<StatusPill>{translateStatusLabel(data.paymentSetup.ready ? "Ready" : "Needs update", isId)}</StatusPill>}>
              <dl className="seller2026-definition">
                <div><dt>{isId ? "Penyedia" : "Provider"}</dt><dd>{data.paymentSetup.provider === "Not configured" && isId ? "Belum dikonfigurasi" : data.paymentSetup.provider}</dd></div>
                <div><dt>{isId ? "Tipe" : "Type"}</dt><dd>{data.paymentSetup.type === "Not configured" && isId ? "Belum dikonfigurasi" : data.paymentSetup.type}</dd></div>
              </dl>
            </SectionCard>
          </div>
          <div className="seller2026-dashboard__side-row">
            <SectionCard title={isId ? "Konteks Toko" : "Store Context"} icon={Store}>
              <dl className="seller2026-definition">
                <div><dt>{isId ? "Peran" : "Role"}</dt><dd>{store.role === "SELLER" && isId ? "PENJUAL" : store.role}</dd></div>
                <div><dt>{isId ? "Cakupan" : "Scope"}</dt><dd>{store.slug}</dd></div>
              </dl>
            </SectionCard>
            <SectionCard title={isId ? "Tautan Cepat" : "Quick Links"} icon={Link2}>
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
        <SectionCard title={isId ? "Ringkasan Operasional" : "Operational Snapshot"} icon={Truck}>
          <div className="seller2026-strip">
            {[
              [isId ? "Dana Terbagi" : "Paid Splits", data.operational.paidSplits],
              [isId ? "Diproses" : "Processing", data.operational.processing],
              [isId ? "Selesai" : "Completed", data.operational.completed],
              [isId ? "Menunggu" : "Waiting", data.operational.waiting],
              [isId ? "Kendala" : "Exceptions", data.operational.exceptions],
              [isId ? "Pendapatan Selesai" : "Completed Rev.", formatSeller2026Currency(data.operational.completedRevenue)],
              [isId ? "Pendapatan Dalam Proses" : "In-Flight Rev.", formatSeller2026Currency(data.operational.inFlightRevenue)],
              ["AOV", formatSeller2026Currency(data.operational.aov)],
            ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
          </div>
        </SectionCard>
        <SectionCard title={isId ? "Atribusi Kupon" : "Coupon Attribution"} icon={BadgeCheck}>
          <div className="seller2026-strip seller2026-strip--four">
            <div><span>{isId ? "Pesanan Teratribusi" : "Attributed Orders"}</span><strong>{data.couponAttribution.attributedOrders}</strong></div>
            <div><span>{isId ? "Diskon Teratribusi" : "Attributed Discount"}</span><strong>{formatSeller2026Currency(data.couponAttribution.attributedDiscount)}</strong></div>
            <div><span>{isId ? "Cakupan" : "Coverage"}</span><strong>{data.couponAttribution.coverage}%</strong></div>
            <div><span>Status</span><strong>{data.couponAttribution.status === "Monitor" && isId ? "Pantau" : data.couponAttribution.status === "No activity" && isId ? "Belum ada aktivitas" : data.couponAttribution.status}</strong></div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
