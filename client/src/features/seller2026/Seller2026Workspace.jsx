import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SELLER_2026_MUTATIONS } from "../../api/seller2026/mutation-flags.ts";
import { getSeller2026ProductReadiness } from "../../api/seller2026/product-readiness.ts";
import { useSeller2026TeamMutations } from "../../hooks/seller2026/useSeller2026TeamMutations.ts";
import { getDisabledReasonForRemoval, getDisabledReasonForRoleChange } from "../../api/seller2026/team.hierarchy.ts";
import {
  SELLER_2026_PREVIEW_PERMISSIONS,
  canUseSeller2026Action,
  hasSeller2026Permission,
  hasSeller2026PermissionSource,
  normalizeSeller2026Permissions,
} from "../../api/seller2026/permissions.ts";
import {
  attributes,
  categories,
  coupons,
  kpis,
  members,
  navGroups,
  notifications,
  orders,
  products,
  readiness,
  sellerStore,
  suborders,
  topProducts,
} from "./seller2026Data.js";
import "./Seller2026DesignSystem.css";

const SECTION_META = {
  dashboard: {
    active: "dashboard",
    eyebrow: "Seller Workspace - Dashboard",
    title: "Dashboard & Growth Command Center",
    description: "Store performance summary, readiness, analytics, recent orders, and payouts in one place.",
  },
  storefront: {
    active: "store-profile",
    eyebrow: "Seller Workspace - Storefront",
    title: "Store Profile, Microsite & Brand Control",
    description: "Manage store identity, preview public microsite, launch readiness, and brand themes.",
  },
  products: {
    active: "products",
    eyebrow: "Seller Workspace - Catalog",
    title: "Product Catalog & Authoring",
    description: "Product list, product create/edit forms, product detail, variants, revision notes, and publish history.",
  },
  taxonomy: {
    active: "categories",
    eyebrow: "Seller Workspace - Catalog Tools",
    title: "Categories, Attributes & Coupons",
    description: "Manage category assignment, attribute values, product mapping, and store-scoped promotions.",
  },
  operations: {
    active: "orders",
    eyebrow: "Seller Workspace - Operations",
    title: "Orders, Fulfillment & Payments",
    description: "Operational hub for suborders, fulfillment queues, payment review, and payment profile.",
  },
  team: {
    active: "members",
    eyebrow: "Seller Workspace - Collaboration",
    title: "Team, Invitations, Audit Log & Notifications",
    description: "Manage members, roles, permissions, audit trails, invitations, and operational notifications.",
  },
};

const statusClass = (value = "") => `s26-status ${String(value).split(/\s|_/)[0]}`;

const PREVIEW_ROUTES_BY_KEY = {
  dashboard: "/dashboard",
  "store-profile": "/storefront",
  microsite: "/storefront",
  products: "/catalog/products",
  categories: "/catalog/categories",
  attributes: "/catalog/attributes",
  coupons: "/catalog/coupons",
  orders: "/orders",
  fulfillment: "/orders",
  "payment-review": "/payment-review",
  "payment-profile": "/payment-profile",
  members: "/team",
  invitations: "/team/invitations",
  audit: "/team/audit",
  notifications: "/notifications",
  settings: "/storefront",
};

const LIVE_ROUTES_BY_KEY = {
  dashboard: "/dashboard",
  "store-profile": "/store-profile",
  microsite: "/store-profile",
  products: "/catalog/products",
  categories: "/catalog/categories",
  attributes: "/catalog/attributes",
  coupons: "/catalog/coupons",
  orders: "/orders",
  fulfillment: "/orders",
  "payment-review": "/payment-review",
  "payment-profile": "/payment-profile",
  members: "/team",
  invitations: "/team",
  audit: "/team/audit",
  notifications: "/notifications",
  settings: "/settings",
};

function Shell({ section = "dashboard", mode = "standalone", productionMode = false, storeContext = null, children }) {
  const { storeSlug } = useParams();
  const initialTheme =
    typeof window !== "undefined" && window.localStorage.getItem("seller2026-theme") === "dark"
      ? "dark"
      : "light";
  const [theme, setTheme] = useState(initialTheme);
  const meta = SECTION_META[section] || SECTION_META.dashboard;
  const isDark = theme === "dark";
  const store = storeContext?.store || sellerStore;
  const isEmbedded = mode === "embedded";
  const basePath = storeSlug
    ? `/seller/stores/${encodeURIComponent(storeSlug)}`
    : "/seller-2026";
  const routeMap = storeSlug ? LIVE_ROUTES_BY_KEY : PREVIEW_ROUTES_BY_KEY;

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("seller2026-theme", next);
      }
      return next;
    });
  };

  return (
    <div className={`s26-app ${isDark ? "s26-dark" : ""} ${isEmbedded ? "s26-app-embedded" : ""}`}>
      <div className="s26-shell">
        {isEmbedded ? null : <aside className="s26-sidebar">
          <div className="s26-brand">
            <div className="s26-logo">TP</div>
            <div>
              <h2>TP Preneurs</h2>
              <p>Seller Workspace 2026</p>
            </div>
          </div>
          <div className="s26-store-switcher">
            <span>{store.name || sellerStore.name}</span>
            <span aria-hidden="true">v</span>
          </div>
          {navGroups.map((group) => (
            <div className="s26-nav-section" key={group.title}>
              <p className="s26-nav-title">{group.title}</p>
              {group.items.map((item) => (
                <Link
                  to={`${basePath}${routeMap[item.key] || "/dashboard"}`}
                  key={item.key}
                  className={`s26-nav-item ${item.key === meta.active ? "active" : ""}`}
                >
                  <span className="s26-nav-dot" />
                  <span>{item.label}</span>
                  {item.badge ? <span className="s26-badge">{item.badge}</span> : null}
                </Link>
              ))}
            </div>
          ))}
        </aside>}

        <main className="s26-main">
          {isEmbedded ? null : <header className="s26-topbar">
            <div>
              <p className="s26-eyebrow">{meta.eyebrow}</p>
              <div className="s26-title-row">
                <h1>{meta.title}</h1>
                {!productionMode && <span className="s26-pill">2026 UI</span>}
              </div>
              <p className="s26-topbar-desc">{meta.description}</p>
            </div>
            <div className="s26-actions">
              <input className="s26-search" aria-label="Search seller workspace" placeholder="Search anything..." />
              <button type="button" className="s26-control">{sellerStore.dateRange}</button>
              <button type="button" className="s26-theme" aria-label="Toggle dark mode" onClick={toggleTheme}>
                {isDark ? "Dark" : "Light"}
              </button>
              <button type="button" className="s26-control" aria-label="Open notifications">Notifications 12</button>
              <div className="s26-avatar" title={sellerStore.owner}>{sellerStore.avatar}</div>
            </div>
          </header>}
          {children}
        </main>
      </div>
    </div>
  );
}

function Card({ title, hint, children, className = "", actions = null }) {
  return (
    <section className={`s26-card ${className}`}>
      {(title || actions) ? (
        <div className="s26-card-head">
          <div>
            {title ? <h3>{title}</h3> : null}
            {hint ? <p className="hint">{hint}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function StatCard({ item }) {
  return (
    <Card>
      <p className="hint">{item.label}</p>
      <div className="s26-stat-value">{item.value}</div>
      <div className="s26-stat-change">Up {item.change}</div>
      <div className="s26-spark" />
    </Card>
  );
}

function MiniChart() {
  return (
    <div className="s26-chart">
      <div className="s26-chart-grid" />
      <div className="s26-line one" />
      <div className="s26-line two" />
      <div className="s26-chart-tooltip">
        <strong>22 Mei 2026</strong>
        <div>Revenue Rp 22.450.000</div>
        <div>Orders 224</div>
      </div>
    </div>
  );
}

function DataTable({ columns, rows, renderRow }) {
  return (
    <div className="s26-table-wrap">
      <table className="s26-table">
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>{rows.map((row, index) => renderRow(row, index))}</tbody>
      </table>
    </div>
  );
}

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const disabledTodoTitle = "Upload and publishing integration is not enabled yet.";
const productPublishDisabledTitle = "Publishing is managed through Admin approval.";
const productArchiveDisabledTitle = "Archive is unavailable until product lifecycle safeguards are validated.";
const productDuplicateDisabledTitle = "Duplicate is unavailable until the product duplication API is validated.";
const productMediaDisabledTitle = "Media upload is unavailable until storage validation is complete.";
const productVariantDisabledTitle = "Variant editing is unavailable until variant inventory mapping is validated.";
const productBulkDisabledTitle = "Bulk product actions are unavailable until product lifecycle safeguards are validated.";

const permissionTitle = "You do not have permission to use this action.";
const mutationPendingTitle = "This action integration is not enabled yet.";
const categoryBulkDisabledTitle = "Bulk actions are disabled pending governance review.";
const categoryImportDisabledTitle = "Import is not available yet.";
const categoryExportDisabledTitle = "Export is not available yet.";
const attributeDeleteDisabledTitle = "Delete is disabled pending destructive review.";
const attributeBulkDisabledTitle = "Bulk actions are disabled pending governance review.";
const attributeImportDisabledTitle = "Import is not available yet.";
const attributeExportDisabledTitle = "Export is not available yet.";
const attributeValueBulkDisabledTitle = "Bulk value actions are disabled pending governance review.";
const attributeValueMediaDisabledTitle = "Image upload is disabled until storage validation is complete.";
const attributeValueMetadataDisabledTitle = "Description and color are read-only until the value metadata API is available.";
const couponBulkDisabledTitle = "Bulk coupon actions are disabled pending governance review.";
const couponDuplicateDisabledTitle = "Duplicate coupon is disabled pending API review.";
const couponBannerDisabledTitle = "Coupon banner upload is disabled until storage validation is complete.";
const couponMetadataDisabledTitle = "Description and usage limits are read-only until the coupon metadata API is available.";

const getSeller2026ErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const actionTitle = (permissions, permission, mutationFeature) => {
  if (!hasSeller2026Permission(permissions, permission)) return permissionTitle;
  return SELLER_2026_MUTATIONS[mutationFeature] ? undefined : mutationPendingTitle;
};

const canUseAction = (permissions, permission, mutationFeature) =>
  canUseSeller2026Action({
    permissions,
    permission,
    mutationEnabled: Boolean(SELLER_2026_MUTATIONS[mutationFeature]),
  });

const storeProfileFields = [
  "description",
  "email",
  "whatsapp",
  "phone",
  "websiteUrl",
  "instagramUrl",
  "tiktokUrl",
  "addressLine1",
  "addressLine2",
  "city",
  "province",
  "postalCode",
  "country",
  "shippingOriginContactName",
  "shippingOriginPhone",
  "shippingOriginAddressLine1",
  "shippingOriginAddressLine2",
  "shippingOriginDistrict",
  "shippingOriginCity",
  "shippingOriginProvince",
  "shippingOriginPostalCode",
  "shippingOriginCountry",
  "shippingPickupNotes",
];

const textValue = (value) => String(value ?? "").trim();

const storeProfileFormFromStore = (store) => {
  const source = store?.editableProfile || {};
  return {
    name: textValue(source.name || store?.name),
    slug: textValue(source.slug || store?.slug),
    description: textValue(source.description || store?.description),
    email: textValue(source.email || store?.email),
    whatsapp: textValue(source.whatsapp || store?.whatsapp),
    phone: textValue(source.phone || store?.phone),
    websiteUrl: textValue(source.websiteUrl),
    instagramUrl: textValue(source.instagramUrl),
    tiktokUrl: textValue(source.tiktokUrl),
    addressLine1: textValue(source.addressLine1),
    addressLine2: textValue(source.addressLine2),
    city: textValue(source.city),
    province: textValue(source.province),
    postalCode: textValue(source.postalCode),
    country: textValue(source.country),
    shippingOriginContactName: textValue(source.shippingOriginContactName),
    shippingOriginPhone: textValue(source.shippingOriginPhone),
    shippingOriginAddressLine1: textValue(source.shippingOriginAddressLine1),
    shippingOriginAddressLine2: textValue(source.shippingOriginAddressLine2),
    shippingOriginDistrict: textValue(source.shippingOriginDistrict),
    shippingOriginCity: textValue(source.shippingOriginCity),
    shippingOriginProvince: textValue(source.shippingOriginProvince),
    shippingOriginPostalCode: textValue(source.shippingOriginPostalCode),
    shippingOriginCountry: textValue(source.shippingOriginCountry),
    shippingPickupNotes: textValue(source.shippingPickupNotes),
  };
};

const optionalText = (value) => {
  const normalized = textValue(value);
  return normalized || null;
};

const validateStoreProfileForm = (form) => {
  const errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[0-9+().\-\s]{6,64}$/;
  const urlPattern = /^https?:\/\/.+/i;

  if (form.email && !emailPattern.test(form.email)) {
    errors.email = "Email format is invalid.";
  }
  if (form.whatsapp && !phonePattern.test(form.whatsapp)) {
    errors.whatsapp = "WhatsApp format is invalid or too short.";
  }
  if (form.phone && !phonePattern.test(form.phone)) {
    errors.phone = "Phone format is invalid or too short.";
  }
  if (form.shippingOriginPhone && !phonePattern.test(form.shippingOriginPhone)) {
    errors.shippingOriginPhone = "Shipping origin phone format is invalid.";
  }
  if (form.websiteUrl && !urlPattern.test(form.websiteUrl)) {
    errors.websiteUrl = "Website harus memakai URL http/https.";
  }
  if (form.instagramUrl && !/^https?:\/\/([^/]+\.)?instagram\.com\//i.test(form.instagramUrl)) {
    errors.instagramUrl = "Instagram harus memakai URL instagram.com.";
  }
  if (form.tiktokUrl && !/^https?:\/\/([^/]+\.)?tiktok\.com\//i.test(form.tiktokUrl)) {
    errors.tiktokUrl = "TikTok harus memakai URL tiktok.com.";
  }
  if (form.description && form.description.length > 4000) {
    errors.description = "Store description must be 4000 characters or fewer.";
  }
  if (form.postalCode && !/^[A-Z0-9\- ]{3,32}$/i.test(form.postalCode)) {
    errors.postalCode = "Postal code format is invalid.";
  }
  if (form.shippingOriginPostalCode && !/^[A-Z0-9\- ]{3,32}$/i.test(form.shippingOriginPostalCode)) {
    errors.shippingOriginPostalCode = "Shipping origin postal code format is invalid.";
  }

  return errors;
};

const buildStoreProfileUpdatePayload = (form) => ({
  description: optionalText(form.description),
  email: optionalText(form.email),
  whatsapp: optionalText(form.whatsapp),
  phone: optionalText(form.phone),
  websiteUrl: optionalText(form.websiteUrl),
  instagramUrl: optionalText(form.instagramUrl),
  tiktokUrl: optionalText(form.tiktokUrl),
  addressLine1: optionalText(form.addressLine1),
  addressLine2: optionalText(form.addressLine2),
  city: optionalText(form.city),
  province: optionalText(form.province),
  postalCode: optionalText(form.postalCode),
  country: optionalText(form.country),
  shippingSetup: {
    originContactName: optionalText(form.shippingOriginContactName),
    originPhone: optionalText(form.shippingOriginPhone),
    originAddressLine1: optionalText(form.shippingOriginAddressLine1),
    originAddressLine2: optionalText(form.shippingOriginAddressLine2),
    originDistrict: optionalText(form.shippingOriginDistrict),
    originCity: optionalText(form.shippingOriginCity),
    originProvince: optionalText(form.shippingOriginProvince),
    originPostalCode: optionalText(form.shippingOriginPostalCode),
    originCountry: optionalText(form.shippingOriginCountry),
    pickupNotes: optionalText(form.shippingPickupNotes),
  },
});

const emptyProductDraftForm = {
  name: "",
  sku: "",
  description: "",
  categoryIdsText: "",
  tagsText: "",
  price: "0",
  compareAtPrice: "",
  stock: "0",
  seoTitle: "",
  seoDescription: "",
};

const productDraftFormFromDetail = (detail) => {
  const draft = detail?.editableDraft || {};
  return {
    name: textValue(draft.name),
    sku: textValue(draft.sku),
    description: textValue(draft.description),
    categoryIdsText: Array.isArray(draft.categoryIds) ? draft.categoryIds.join(", ") : "",
    tagsText: Array.isArray(draft.tags) ? draft.tags.join(", ") : "",
    price: String(draft.price ?? 0),
    compareAtPrice: draft.compareAtPrice ? String(draft.compareAtPrice) : "",
    stock: String(draft.stock ?? 0),
    seoTitle: textValue(draft.seoTitle),
    seoDescription: textValue(draft.seoDescription),
  };
};

const parseDraftNumber = (value) => {
  const normalized = textValue(value);
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const parseDraftInteger = (value) => {
  const parsed = parseDraftNumber(value);
  if (typeof parsed === "undefined" || Number.isNaN(parsed)) return parsed;
  return Math.floor(parsed);
};

const parseCsvText = (value) =>
  textValue(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const parseCategoryIds = (value) =>
  parseCsvText(value)
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry) && entry > 0);

const validateProductDraftForm = (form) => {
  const errors = {};
  const price = parseDraftNumber(form.price);
  const compareAtPrice = parseDraftNumber(form.compareAtPrice);
  const stock = parseDraftInteger(form.stock);

  if (textValue(form.name).length < 2) {
    errors.name = "Product name must be at least 2 characters.";
  }
  if (form.sku && form.sku.length > 100) {
    errors.sku = "SKU must be 100 characters or fewer.";
  }
  if (form.description && form.description.length > 4000) {
    errors.description = "Description must be 4000 characters or fewer.";
  }
  if (typeof price === "undefined" || Number.isNaN(price) || price < 0) {
    errors.price = "Price must be a number greater than or equal to 0.";
  }
  if (typeof compareAtPrice !== "undefined") {
    if (Number.isNaN(compareAtPrice) || compareAtPrice < 0) {
      errors.compareAtPrice = "Compare-at price must be a number greater than or equal to 0.";
    } else if (compareAtPrice > 0 && typeof price === "number" && compareAtPrice >= price) {
      errors.compareAtPrice = "Compare-at price must be lower than the base price.";
    }
  }
  if (typeof stock === "undefined" || Number.isNaN(stock) || stock < 0) {
    errors.stock = "Stock must be an integer greater than or equal to 0.";
  }
  if (parseCsvText(form.tagsText).some((tag) => tag.length > 80)) {
    errors.tagsText = "Each tag must be 80 characters or fewer.";
  }
  if (parseCsvText(form.categoryIdsText).some((entry) => !Number.isInteger(Number(entry)) || Number(entry) <= 0)) {
    errors.categoryIdsText = "Category IDs must be positive numbers separated by commas.";
  }
  if (form.seoTitle.length > 160) {
    errors.seoTitle = "SEO title must be 160 characters or fewer.";
  }
  if (form.seoDescription.length > 320) {
    errors.seoDescription = "SEO description must be 320 characters or fewer.";
  }

  return errors;
};

const buildProductDraftPayload = (form) => ({
  name: textValue(form.name),
  sku: optionalText(form.sku),
  description: optionalText(form.description),
  categoryIds: parseCategoryIds(form.categoryIdsText),
  tags: parseCsvText(form.tagsText),
  price: parseDraftNumber(form.price) ?? 0,
  compareAtPrice: parseDraftNumber(form.compareAtPrice) ?? null,
  stock: parseDraftInteger(form.stock) ?? 0,
  seoTitle: optionalText(form.seoTitle),
  seoDescription: optionalText(form.seoDescription),
});

const routePermissionFor = ({ section, catalogView, operationsView, teamView }) => {
  if (section === "dashboard") return "STORE_DASHBOARD_VIEW";
  if (section === "storefront") return "STORE_PROFILE_READ";
  if (section === "products") return "CATALOG_PRODUCT_READ";
  if (section === "taxonomy") {
    if (catalogView === "coupons") return "COUPON_READ";
    if (catalogView === "attributes" || catalogView === "attribute-values") return "CATALOG_ATTRIBUTE_READ";
    return "CATALOG_CATEGORY_READ";
  }
  if (section === "operations") {
    if (operationsView === "payment-review") return "PAYMENT_REVIEW_READ";
    if (operationsView === "payment-profile") return "STORE_PAYMENT_PROFILE_READ";
    return "ORDER_READ";
  }
  if (section === "team") {
    if (teamView === "audit") return "TEAM_AUDIT_READ";
    if (teamView === "notifications") return "NOTIFICATION_READ";
    return "TEAM_READ";
  }
  return null;
};

function Seller2026RestrictedState({
  title = "Access Restricted",
  message = "You do not have permission to view this page.",
}) {
  return (
    <div className="s26-state s26-state-restricted">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

function DashboardPage({ dashboardData = null, dashboardState = null, mode, storeContext }) {
  const effectiveKpis = dashboardData?.kpis?.length ? dashboardData.kpis : kpis;
  const effectiveReadiness = dashboardData?.readiness?.length ? dashboardData.readiness : readiness;
  const effectiveTopProducts = dashboardData?.topProducts?.length
    ? dashboardData.topProducts
    : topProducts;
  const effectiveSuborders = dashboardData?.recentSuborders?.length
    ? dashboardData.recentSuborders
    : suborders;
  const effectiveTraffic = dashboardData?.traffic?.length
    ? dashboardData.traffic
    : [["Organic Search", "42,1%"], ["Direct", "24,7%"], ["Social Media", "16,3%"], ["Marketplace", "11,9%"], ["Other", "5,0%"]];
  const readinessPercent = Number(dashboardData?.readinessPercent ?? 78);
  const isLoading = Boolean(dashboardState?.isLoading);
  const isError = Boolean(dashboardState?.isError);

  return (
    <Shell section="dashboard" mode={mode} storeContext={storeContext}>
      {isError ? (
        <Card
          title="Dashboard data unavailable"
          hint="Seller 2026 dashboard could not load live data. Preview fallback remains visible below."
          actions={<button type="button" className="s26-btn" onClick={dashboardState?.refetch}>Retry</button>}
        />
      ) : null}
      <div className="s26-grid kpi">{effectiveKpis.map((item) => <StatCard item={{ ...item, change: isLoading ? "Loading..." : item.change }} key={item.label} />)}</div>
      <div className="s26-grid dashboard">
        <Card title="Store Readiness" hint="Lengkapi checklist sebelum scale penjualan.">
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div className="s26-progress" style={{ "--s26-progress": `${readinessPercent}%` }}><span>{isLoading ? "..." : `${readinessPercent}%`}</span></div>
            <div>
              <strong>{dashboardData?.readinessLabel || "Good progress!"}</strong>
              <p className="hint">{dashboardData?.readinessHint || "Store is ready to scale."}</p>
            </div>
          </div>
          <div className="s26-checklist">
            {effectiveReadiness.map((item) => <div className="s26-check-row" key={item.label}><span>{item.label}</span><span className={statusClass(item.status)}>{item.status}</span></div>)}
          </div>
        </Card>
        <Card title="Sales Analytics" hint="Revenue dan order harian."><MiniChart /></Card>
        <Card title="Traffic by Channel" hint="Sumber traffic microsite.">
          <div className="s26-donut"><span>Live<br />Seller<br />Signals</span></div>
          <div className="s26-checklist">
            {effectiveTraffic.map(([a, b]) => <div className="s26-check-row" key={a}><span>{a}</span><strong>{b}</strong></div>)}
          </div>
        </Card>
      </div>
      <div className="s26-grid two">
        <Card title="Top Products" hint="Products with the best revenue this week.">
          <DataTable columns={["Produk", "Terjual", "Revenue", "Status"]} rows={effectiveTopProducts} renderRow={(row, index) => <tr key={`${row[0]}-${index}`}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td style={{ color: "var(--seller-emerald)", fontWeight: 800 }}>{row[3]}</td></tr>} />
        </Card>
        <Card title="Recent Suborders" hint="Suborder terbaru dari semua channel.">
          <DataTable columns={["Suborder", "Customer", "Status", "Waktu"]} rows={effectiveSuborders} renderRow={(row, index) => <tr key={`${row.id}-${index}`}><td>{row.id}</td><td>{row.customer}</td><td><span className={statusClass(row.status)}>{row.status}</span></td><td>{row.time}</td></tr>} />
        </Card>
      </div>
      <div className="s26-grid three">
        {[["Add Product", "Create a new product or import CSV"], ["Manage Orders", "Open the fulfillment queue"], ["Check Payments", "Review proof and payouts"]].map(([a, b]) => <Card key={a} title={a} hint={b}><button className="s26-btn primary">Open</button></Card>)}
      </div>
    </Shell>
  );
}

function StorefrontPage({
  storefrontData = null,
  storefrontState = null,
  storefrontMutation = null,
  mode,
  storeContext,
  seller2026Permissions,
  productionMode = false,
}) {
  const isLive = Boolean(storefrontData);
  const previewStore = {
    name: "Oase Sehat Official Store",
    slug: "oase-sehat",
    tagline: "Produk pilihan terbaik untuk keluarga sehat Indonesia.",
    email: "halo@oasesehat.com",
    whatsapp: "+62 812-3456-7890",
    phone: "+62 812-3456-7890",
    businessCategory: "Kesehatan & Kecantikan",
    businessSubcategory: "Herbal & Wellness",
    address: "Jakarta, DKI Jakarta",
    shippingOrigin: "Jakarta, DKI Jakarta",
    description: "Oase Sehat hadir untuk memberikan solusi kesehatan alami berkualitas untuk keluarga Indonesia.",
    policies: [
      { label: "Store description", status: "complete" },
      { label: "Contact details", status: "complete" },
      { label: "Shipping origin", status: "complete" },
    ],
    socials: [{ channel: "Instagram", value: "@oasesehat" }],
    saveStatus: "Identity, contacts, addresses, social media, and store policies.",
  };
  const store = storefrontData?.store || previewStore;
  const serverForm = useMemo(() => storeProfileFormFromStore(store), [storefrontData?.store]);
  const [profileForm, setProfileForm] = useState(serverForm);
  const [submitStatus, setSubmitStatus] = useState({ type: "idle", message: "" });
  const liveReadiness = storefrontData?.readiness || {};
  const microsite = storefrontData?.microsite || {
    heroTitle: "Alami. Sehat.",
    heroSubtitle: "Produk pilihan terbaik untuk keluarga sehat Indonesia.",
    heroCtaLabel: "Shop Now",
    categories: [
      { id: "herbal", name: "Herbal" },
      { id: "vitamin", name: "Vitamin" },
      { id: "tea", name: "Teh" },
    ],
  };
  const theme = storefrontData?.theme || {
    mode: "light",
    brandColors: ["#14532d", "#0f766e", "#a7f3d0", "#f59e0b", "#dc2626"],
    typography: "Inter / System",
    sections: [
      { key: "hero", label: "Hero Banner", enabled: true },
      { key: "categories", label: "Popular Categories", enabled: true },
      { key: "featured", label: "Featured Products", enabled: true },
      { key: "benefits", label: "Store Benefits", enabled: true },
      { key: "testimonials", label: "Testimonials", enabled: true },
      { key: "about", label: "About Us", enabled: false },
    ],
  };
  const previewHref = store.slug ? `/store/${encodeURIComponent(store.slug)}` : "#";
  const validationErrors = useMemo(() => validateStoreProfileForm(profileForm), [profileForm]);
  const isDirty = useMemo(
    () => storeProfileFields.some((field) => profileForm[field] !== serverForm[field]),
    [profileForm, serverForm]
  );
  const canUpdateProfile = Boolean(storefrontMutation?.canUpdate);
  const isSubmittingProfile = Boolean(storefrontMutation?.isSubmitting);
  const isProfileValid = Object.keys(validationErrors).length === 0;
  const saveDisabled =
    !isLive || !canUpdateProfile || !isDirty || !isProfileValid || isSubmittingProfile;
  const saveTitle = !canUpdateProfile
    ? actionTitle(seller2026Permissions, "STORE_PROFILE_UPDATE", "storeProfileUpdate")
    : !isDirty
      ? "No changes to save."
      : !isProfileValid
        ? "Fix invalid fields."
        : undefined;
  const setProfileField = (field, value) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
    setSubmitStatus({ type: "idle", message: "" });
  };
  const resetProfileForm = () => {
    setProfileForm(serverForm);
    setSubmitStatus({ type: "idle", message: "" });
  };
  const submitProfileForm = async () => {
    if (!storefrontMutation?.submit || saveDisabled) return;
    setSubmitStatus({ type: "idle", message: "" });
    try {
      await storefrontMutation.submit(buildStoreProfileUpdatePayload(profileForm));
      setSubmitStatus({ type: "success", message: "Store profile successfully updated." });
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: error?.response?.data?.message || error?.message || "Store profile could not be updated.",
      });
    }
  };

  useEffect(() => {
    setProfileForm(serverForm);
  }, [serverForm]);

  const readinessItems = liveReadiness.checklist?.length
    ? liveReadiness.checklist.map((item) => ({
        label: item.label,
        status:
          item.status === "complete"
            ? "Completed"
            : item.status === "missing"
              ? "Pending"
              : "Dalam Proses",
      }))
    : readiness;
  const policyItems = store.policies?.length
    ? store.policies
    : [
        { label: "Store description", status: "missing" },
        { label: "Contact details", status: "missing" },
      ];
  const benefits = microsite.benefits?.length
    ? microsite.benefits
    : [
        { label: "Brand ready", description: "Preview microsite siap direview." },
        { label: "Safe preview", description: "Tidak menampilkan data internal seller." },
      ];
  const featuredProducts = microsite.featuredProducts?.length
    ? microsite.featuredProducts
    : (isLive ? ["Featured Products", "New Arrivals", "Popular Products", "Store Choice"] : ["Turmeric Extract", "Forest Honey", "Vitamin D3", "Soursop Leaf Tea"]).map((name, index) => ({
        id: `fallback-${index}`,
        name,
        imageUrl: null,
        price: 0,
        badge: "Preview",
      }));

  const mediaUploadTitle = productionMode ? "Media upload will be connected after storage validation." : disabledTodoTitle;

  return (
    <Shell section="storefront" mode={mode} productionMode={productionMode} storeContext={storeContext}>
      {storefrontState?.isError ? (
        <Card
          title="Store profile data unavailable"
          hint={productionMode ? "Live store profile data is unavailable. Showing fallback data." : "Live store profile could not load completely. Safe fallback data remains visible below."}
          actions={<button type="button" className="s26-btn" onClick={storefrontState?.refetch}>Retry</button>}
        />
      ) : null}
      <div className="s26-grid two">
        <Card
          title="Store Profile"
          hint={isLive ? store.saveStatus : "Identity, contacts, addresses, social media, and store policies."}
          actions={
            <div className="s26-filter-row" style={{ marginBottom: 0 }}>
              <a className="s26-btn" href={previewHref} target="_blank" rel="noreferrer">
                Preview Microsite
              </a>
              {isLive ? (
                <button
                  type="button"
                  className="s26-btn"
                  disabled={!isDirty || isSubmittingProfile}
                  onClick={resetProfileForm}
                >
                  Reset
                </button>
              ) : null}
              <button
                type="button"
                className="s26-btn primary"
                disabled={saveDisabled}
                title={isLive ? saveTitle : disabledTodoTitle}
                onClick={submitProfileForm}
              >
                {isSubmittingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          }
        >
          {submitStatus.type !== "idle" ? (
            <div className={`s26-alert ${submitStatus.type === "success" ? "success" : "error"}`}>
              {submitStatus.message}
            </div>
          ) : null}
          {storefrontMutation?.error && submitStatus.type !== "error" ? (
            <div className="s26-alert error">
              {storefrontMutation.error?.message || "Store profile could not be updated."}
            </div>
          ) : null}
          <div className="s26-grid two">
            <div className="s26-card soft">
              <h3>Store Logo</h3>
              {store.logoUrl ? (
                <img className="s26-logo-preview" src={store.logoUrl} alt={`${store.name} logo`} />
              ) : (
                <div className="s26-logo" style={{ marginTop: 12 }}>{(store.name || "TK").slice(0, 2).toUpperCase()}</div>
              )}
              <p className="hint">PNG/JPG maks 2MB</p>
              <button type="button" className="s26-btn" disabled title={mediaUploadTitle}>Ubah Logo</button>
            </div>
            <div className="s26-hero s26-cover-preview" style={store.coverUrl ? { backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, .76), rgba(5, 150, 105, .58)), url(${store.coverUrl})` } : { minHeight: 160 }}>
              <div><h2 style={{ fontSize: 28 }}>{store.name || "Alami. Sehat."}</h2><p>{store.tagline || "Cover banner rekomendasi 1920x600px."}</p></div>
              <button type="button" className="s26-btn" disabled title={mediaUploadTitle}>Ubah Banner</button>
            </div>
          </div>
          <div className="s26-form-grid" style={{ marginTop: 16 }}>
            <div className="s26-field">
              <label>Store Name</label>
              <input value={profileForm.name || "Your Store"} readOnly title={productionMode ? "Slug and domain changes require verification." : "Store name remains admin-governed in this phase."} />
            </div>
            <div className="s26-field">
              <label>Slug / URL</label>
              <input value={profileForm.slug || "store-slug"} readOnly title={productionMode ? "Slug and domain changes require verification." : "Slug is not editable in this mutation phase."} />
            </div>
            {[
              ["Email", "email", "email"],
              ["WhatsApp", "whatsapp", "text"],
              ["Telepon", "phone", "text"],
              ["Website", "websiteUrl", "url"],
              ["Instagram URL", "instagramUrl", "url"],
              ["TikTok URL", "tiktokUrl", "url"],
              ["Address Line 1", "addressLine1", "text"],
              ["Address Line 2", "addressLine2", "text"],
              ["Kota", "city", "text"],
              ["Provinsi", "province", "text"],
              ["Kode Pos", "postalCode", "text"],
              ["Negara", "country", "text"],
            ].map(([label, field, type]) => (
              <div className="s26-field" key={field}>
                <label>{label}</label>
                <input
                  type={type}
                  value={profileForm[field]}
                  readOnly={!canUpdateProfile}
                  disabled={isSubmittingProfile}
                  onChange={(event) => setProfileField(field, event.target.value)}
                />
                {validationErrors[field] ? <small className="s26-field-error">{validationErrors[field]}</small> : null}
              </div>
            ))}
            <div className="s26-field" style={{ gridColumn: "1 / -1" }}>
              <label>About Store</label>
              <textarea
                value={profileForm.description}
                readOnly={!canUpdateProfile}
                disabled={isSubmittingProfile}
                onChange={(event) => setProfileField("description", event.target.value)}
              />
              {validationErrors.description ? <small className="s26-field-error">{validationErrors.description}</small> : null}
            </div>
            <div className="s26-field">
              <label>Business Category</label>
              <input value={store.businessCategory || "Storefront"} readOnly title="Business category is not supported by the seller profile update endpoint yet." />
            </div>
            <div className="s26-field">
              <label>Subcategory</label>
              <input value={store.businessSubcategory || "General"} readOnly title="Subcategory is not supported by the seller profile update endpoint yet." />
            </div>
            {[
              ["Shipping Contact Name", "shippingOriginContactName"],
              ["Telepon Pengiriman", "shippingOriginPhone"],
              ["Alamat Pengiriman 1", "shippingOriginAddressLine1"],
              ["Alamat Pengiriman 2", "shippingOriginAddressLine2"],
              ["Kecamatan/Distrik", "shippingOriginDistrict"],
              ["Kota Pengiriman", "shippingOriginCity"],
              ["Provinsi Pengiriman", "shippingOriginProvince"],
              ["Kode Pos Pengiriman", "shippingOriginPostalCode"],
              ["Negara Pengiriman", "shippingOriginCountry"],
            ].map(([label, field]) => (
              <div className="s26-field" key={field}>
                <label>{label}</label>
                <input
                  value={profileForm[field]}
                  readOnly={!canUpdateProfile}
                  disabled={isSubmittingProfile}
                  onChange={(event) => setProfileField(field, event.target.value)}
                />
                {validationErrors[field] ? <small className="s26-field-error">{validationErrors[field]}</small> : null}
              </div>
            ))}
            <div className="s26-field" style={{ gridColumn: "1 / -1" }}>
              <label>Catatan Pickup</label>
              <textarea
                value={profileForm.shippingPickupNotes}
                readOnly={!canUpdateProfile}
                disabled={isSubmittingProfile}
                onChange={(event) => setProfileField("shippingPickupNotes", event.target.value)}
              />
            </div>
          </div>
          <div className="s26-grid two" style={{ marginTop: 16 }}>
            <div className="s26-card soft">
              <h3>Media Sosial</h3>
              <div className="s26-checklist">
                {(store.socials?.length ? store.socials : [{ channel: "Social", value: "Not configured" }]).map((item) => (
                  <div className="s26-check-row" key={`${item.channel}-${item.value}`}><span>{item.channel}</span><strong>{item.value}</strong></div>
                ))}
              </div>
            </div>
            <div className="s26-card soft">
              <h3>Policy Summary</h3>
              <div className="s26-checklist">
                {policyItems.map((item) => <div className="s26-check-row" key={item.label}><span>{item.label}</span><span className={statusClass(item.status === "complete" ? "Active" : "Pending")}>{item.status}</span></div>)}
              </div>
              <button type="button" className="s26-btn" disabled title={actionTitle(seller2026Permissions, "STORE_PROFILE_UPDATE", "storefront")}>Manage Policy</button>
            </div>
          </div>
        </Card>
        <Card title="Microsite Preview" hint="Preview public desktop and mobile storefront." actions={<a className="s26-btn" href={previewHref} target="_blank" rel="noreferrer">Open Microsite</a>}>
          <div className="s26-hero"><div><h2>{microsite.heroTitle || "Natural. Healthy."}</h2><p>{microsite.heroSubtitle || "The best products for our customers."}</p><a className="s26-btn primary" href={previewHref} target="_blank" rel="noreferrer">{microsite.heroCtaLabel || "Shop Now"}</a></div><div style={{ fontSize: 42 }}>{store.logoUrl ? <img className="s26-hero-logo" src={store.logoUrl} alt="" /> : "Store"}</div></div>
          <div className="s26-benefit-grid">
            {benefits.map((item) => <div className="s26-card soft" key={item.label}><strong>{item.label}</strong><p className="hint">{item.description}</p></div>)}
          </div>
          <div className="s26-tabs" style={{ marginTop: 16 }}>
            {(microsite.categories || []).map((category) => <button type="button" className="s26-tab" key={category.id}>{category.name}</button>)}
          </div>
          <div className="s26-product-card-grid" style={{ marginTop: 16 }}>
            {featuredProducts.map((product) => <div className="s26-store-product" key={product.id}><div className="image">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : "TP"}</div><div className="body"><strong>{product.name}</strong><p className="hint">{product.price ? formatRupiah(product.price) : product.badge || "Preview"}</p></div></div>)}
          </div>
          <div className="s26-phone" style={{ margin: "18px auto 0" }}>
            <div className="s26-hero"><div><h2>{microsite.heroTitle || store.name || "Toko Kamu"}</h2><p>{store.tagline || "Mobile preview"}</p></div></div>
          </div>
        </Card>
      </div>
      <div className="s26-grid two">
        <Card title="Store Readiness" hint="Checklist siap launch dan verifikasi.">
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}><div className="s26-progress" style={{ "--s26-progress": `${liveReadiness.percent ?? 78}%` }}><span>{storefrontState?.isLoading ? "..." : `${liveReadiness.percent ?? 78}%`}</span></div><div><strong>{liveReadiness.percent >= 100 ? "Ready to Launch" : "Needs Completion"}</strong><p className="hint">{liveReadiness.completed ?? 8} completed, {liveReadiness.missing ?? 0} needs completion.</p></div></div>
          <div className="s26-checklist">{readinessItems.map((item) => <div className="s26-check-row" key={item.label}><span>{item.label}</span><span className={statusClass(item.status)}>{item.status}</span></div>)}</div>
          <div className="s26-checklist" style={{ marginTop: 16 }}>{(liveReadiness.verifications || []).map((item) => <div className="s26-check-row" key={item.label}><span>{item.label}</span><span className={statusClass(item.status === "verified" ? "Active" : item.status)}>{item.status}</span></div>)}</div>
          <button type="button" className="s26-btn primary" style={{ marginTop: 16 }} disabled title={actionTitle(seller2026Permissions, "STORE_PROFILE_UPDATE", "storefront")}>Submit untuk Review</button>
        </Card>
        <Card title="Theme & Customization" hint="Light/dark preference, warna brand, dan section microsite.">
          <div className="s26-tabs"><button type="button" className={`s26-tab ${theme.mode === "light" ? "active" : ""}`} disabled title={actionTitle(seller2026Permissions, "STORE_PROFILE_UPDATE", "storefront")}>Light</button><button type="button" className={`s26-tab ${theme.mode === "dark" ? "active" : ""}`} disabled title={actionTitle(seller2026Permissions, "STORE_PROFILE_UPDATE", "storefront")}>Dark</button></div>
          <p className="hint">Warna Brand</p><div className="s26-swatch-row" style={{ margin: "10px 0 18px" }}>{(theme.brandColors || ["#14532d", "#0f766e", "#a7f3d0", "#f59e0b", "#dc2626"]).map((color) => <span className="s26-swatch" key={color} style={{ background: color }} />)}</div>
          <p className="hint">Typography: {theme.typography || "Inter / System"}</p>
          {(theme.sections || []).map((section) => <div className="s26-toggle-row" key={section.key}><span>{section.label}</span><span className={`s26-switch ${section.enabled ? "on" : ""}`} title={actionTitle(seller2026Permissions, "STORE_PROFILE_UPDATE", "storefront")} /></div>)}
        </Card>
      </div>
    </Shell>
  );
}

const productStatusLabel = (status = "draft") => {
  const labels = {
    draft: "Draft",
    submitted: "Submitted",
    active: "Active",
    needs_revision: "Needs Revision",
    inactive: "Inactive",
  };
  return labels[status] || "Draft";
};

const productInitial = (name = "P") => String(name || "P").trim().charAt(0).toUpperCase() || "P";

function ProductReadinessChecklist({ readiness }) {
  if (!readiness) return null;
  return (
    <div className="s26-card soft">
      <h3>Review Readiness</h3>
      <p className="hint">Complete the required fields before submitting this product for admin review.</p>
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <div className="s26-progress" style={{ "--s26-progress": `${readiness.score}%` }}>
          <span>{readiness.score}%</span>
        </div>
        <div>
          <strong>{readiness.ready ? "Ready to submit" : "Needs attention"}</strong>
          <p className="hint">
            {readiness.blockingItems.length
              ? `${readiness.blockingItems.length} required item${readiness.blockingItems.length === 1 ? "" : "s"} need attention.`
              : "Required checks are complete."}
          </p>
        </div>
      </div>
      <div className="s26-checklist" aria-label="Product Review Readiness">
        {readiness.items.map((entry) => (
          <div className="s26-check-row" key={entry.key}>
            <span>
              <strong>{entry.label}</strong>
              <span className="s26-sub">{entry.severity === "error" ? "Required" : "Recommended"} - {entry.helper}</span>
            </span>
            <span className={statusClass(entry.passed ? "Active" : entry.severity === "error" ? "Needs" : "Pending")}>
              {entry.passed ? "Ready" : entry.severity === "error" ? "Required" : "Recommended"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsPage({
  productsData = null,
  productsState = null,
  productsQuery = null,
  onProductsQueryChange = null,
  productDetailData = null,
  productDetailState = null,
  productEditorMode = null,
  productDraftMutation = null,
  productsMutation = null,
  mode,
  storeContext,
  seller2026Permissions,
}) {
  const { storeSlug } = useParams();
  const isLive = Boolean(productsData || productsState || productDetailState || productEditorMode);
  const basePath = storeSlug ? `/seller/stores/${encodeURIComponent(storeSlug)}` : "/seller-2026";
  const addProductTo = storeSlug ? `${basePath}/catalog/products/new` : "/seller-2026/products";
  const currentStatus = productsQuery?.status || "all";
  const currentCategory = productsQuery?.category || "all";
  const currentSearch = productsQuery?.search || "";
  const summary = productsData?.summary || {};
  const liveProducts = productsData?.products || [];
  const tableRows = isLive ? liveProducts : products;
  const canCreate = !isLive || hasSeller2026Permission(seller2026Permissions, "CATALOG_PRODUCT_CREATE");
  const canUpdate = !isLive || canUseAction(seller2026Permissions, "CATALOG_PRODUCT_UPDATE", "productDraftSave");
  const canSubmitProductReview = !isLive || canUseAction(seller2026Permissions, "CATALOG_PRODUCT_SUBMIT", "productSubmitReview");
  const createTitle = isLive && !canCreate ? permissionTitle : undefined;
  const updateTitle = isLive ? actionTitle(seller2026Permissions, "CATALOG_PRODUCT_UPDATE", "productDraftSave") : undefined;
  const submitReviewTitle = isLive ? actionTitle(seller2026Permissions, "CATALOG_PRODUCT_SUBMIT", "productSubmitReview") : undefined;
  const queryChange = (next) => onProductsQueryChange?.(next);
  const tabs = isLive
    ? [
        ["all", `All Products ${summary.total || 0}`],
        ["draft", `Draft ${summary.draft || 0}`],
        ["submitted", `Submitted ${summary.submitted || 0}`],
        ["active", `Active ${summary.active || 0}`],
        ["needs_revision", `Needs Revision ${summary.needsRevision || 0}`],
        ["inactive", `Inactive ${summary.inactive || 0}`],
      ]
    : ["All Products 1.248", "Draft 142", "Submitted 86", "Active 876", "Needs Revision 27", "Inactive 117"].map((label, index) => [index === 0 ? "all" : label, label]);
  const editorProduct = productDetailData?.product || null;
  const detail = productDetailData;
  const previewDetail = {
    product: {
      name: "Premium Cotton Scarf",
      sku: "PCS-COTTON-01-BLK",
      status: "active",
      price: 89000,
      stock: 120,
      sold: 1248,
      views: 8432,
      category: "Fashion / Accessories",
      tags: ["Scarf", "Cotton", "Premium", "Women"],
      description: "Premium cotton scarf with clean stitching and soft finishing for daily wear.",
      gallery: [],
    },
    revisionNotes: [{ message: "Marketplace Admin requested material details and stitching photos." }],
    publishHistory: [{ label: "Published" }, { label: "Submitted" }, { label: "Revision Requested" }],
  };
  const detailView = isLive ? detail : previewDetail;
  const pagination = productsData?.pagination || { page: 1, totalPages: 1, total: tableRows.length, limit: 10 };
  const editorTitle = productEditorMode === "edit" ? "Product Edit Shell" : "Product Create Shell";
  const shouldShowList = !productDetailState?.view && !productEditorMode;
  const shouldShowDetail = productDetailState?.view === "detail" || !isLive;
  const shouldShowEditor = Boolean(productEditorMode) || !isLive;
  const serverProductDraftForm = useMemo(
    () =>
      productEditorMode === "edit"
        ? productDraftFormFromDetail(productDetailData)
        : { ...emptyProductDraftForm },
    [productDetailData?.editableDraft, productEditorMode]
  );
  const [productDraftForm, setProductDraftForm] = useState(serverProductDraftForm);
  const [productDraftStatus, setProductDraftStatus] = useState({ type: "idle", message: "" });
  const [productSubmitStatus, setProductSubmitStatus] = useState({ type: "idle", message: "" });
  const productDraftErrors = useMemo(
    () => validateProductDraftForm(productDraftForm),
    [productDraftForm]
  );
  const productDraftDirty = useMemo(
    () =>
      Object.keys(emptyProductDraftForm).some(
        (field) => productDraftForm[field] !== serverProductDraftForm[field]
      ),
    [productDraftForm, serverProductDraftForm]
  );
  const productDraftValid = Object.keys(productDraftErrors).length === 0;
  const canSaveProductDraft = Boolean(productDraftMutation?.canSave);
  const isSavingProductDraft = Boolean(productDraftMutation?.isSubmitting);
  const isSubmittingProductReview = Boolean(productsMutation?.isSubmittingReview);
  const saveProductDraftDisabled =
    !isLive || !canSaveProductDraft || !productDraftDirty || !productDraftValid || isSavingProductDraft;
  const saveProductDraftTitle = !canSaveProductDraft
    ? actionTitle(
        seller2026Permissions,
        productEditorMode === "edit" ? "CATALOG_PRODUCT_UPDATE" : "CATALOG_PRODUCT_CREATE",
        "productDraftSave"
      )
    : !productDraftDirty
      ? "There are no changes to save."
      : !productDraftValid
        ? "Fix invalid fields before saving."
        : undefined;
  const productDraftReadiness = useMemo(
    () =>
      getSeller2026ProductReadiness({
        name: productDraftForm.name,
        productType: "Physical",
        price: productDraftForm.price,
        stock: productDraftForm.stock,
        categoryIds: productDraftForm.categoryIdsText,
        description: productDraftForm.description,
        productId: editorProduct?.id,
        productEligible: Boolean(editorProduct?.canSubmitReview),
        submitPermission: canSubmitProductReview,
        saving: isSavingProductDraft,
        dirty: productDraftDirty,
        eligibilityReason: editorProduct?.submitReviewReason,
      }),
    [
      canSubmitProductReview,
      editorProduct?.canSubmitReview,
      editorProduct?.id,
      editorProduct?.submitReviewReason,
      isSavingProductDraft,
      productDraftDirty,
      productDraftForm,
    ]
  );
  const productDetailReadiness = useMemo(
    () =>
      getSeller2026ProductReadiness({
        name: detailView?.product?.name,
        productType: "Physical",
        price: detailView?.product?.price,
        stock: detailView?.product?.stock,
        categoryLabel: detailView?.product?.category,
        description: detailView?.product?.description,
        productId: detailView?.product?.id,
        productEligible: Boolean(detailView?.product?.canSubmitReview),
        submitPermission: canSubmitProductReview,
        saving: isSubmittingProductReview,
        dirty: false,
        eligibilityReason: detailView?.product?.submitReviewReason,
      }),
    [
      canSubmitProductReview,
      detailView?.product,
      isSubmittingProductReview,
    ]
  );
  const setProductDraftField = (field, value) => {
    setProductDraftForm((current) => ({ ...current, [field]: value }));
    setProductDraftStatus({ type: "idle", message: "" });
    setProductSubmitStatus({ type: "idle", message: "" });
  };
  const resetProductDraftForm = () => {
    setProductDraftForm(serverProductDraftForm);
    setProductDraftStatus({ type: "idle", message: "" });
    setProductSubmitStatus({ type: "idle", message: "" });
  };
  const submitProductDraftForm = async () => {
    if (!productDraftMutation?.submit || saveProductDraftDisabled) return;
    setProductDraftStatus({ type: "idle", message: "" });
    try {
      await productDraftMutation.submit(buildProductDraftPayload(productDraftForm));
      setProductDraftStatus({
        type: "success",
        message:
          productEditorMode === "edit"
            ? "Product draft updated."
            : "Product draft created.",
      });
    } catch (error) {
      setProductDraftStatus({
        type: "error",
        message: error?.response?.data?.message || error?.message || "Product draft failed to save.",
      });
    }
  };
  const submitProductReview = async (product, options = {}) => {
    const productId = product?.id || product?.productId || editorProduct?.id;
    if (!productsMutation?.submitReview || !productId) return null;
    setProductSubmitStatus({ type: "idle", message: "" });
    try {
      await productsMutation.submitReview({ productId });
      productsState?.refetch?.();
      productDetailState?.refetch?.();
      setProductSubmitStatus({
        type: "success",
        message: options.message || "Product submitted for review.",
      });
      return productId;
    } catch (error) {
      setProductSubmitStatus({
        type: "error",
        message: error?.message || "Unable to submit this product for review. Please check the product details and try again.",
      });
      return null;
    }
  };
  const submitCurrentDraftForReview = async () => {
    if (!canSubmitProductReview || isSubmittingProductReview) return;
    if (productDraftDirty) {
      setProductSubmitStatus({
        type: "error",
        message: "Save this draft before submitting it for review.",
      });
      return;
    }
    if (!productDraftReadiness.ready) {
      setProductSubmitStatus({
        type: "error",
        message: productDraftReadiness.blockingItems[0]?.helper || "Complete required readiness checks before submitting for review.",
      });
      return;
    }
    await submitProductReview(editorProduct, {
      message: "Product submitted for review.",
    });
  };

  useEffect(() => {
    setProductDraftForm(serverProductDraftForm);
  }, [serverProductDraftForm]);

  return (
    <Shell section="products" mode={mode} storeContext={storeContext}>
      {productsState?.isError ? (
        <Card
          title="Products data unavailable"
          hint="Live product catalog could not load. No demo product data is shown on this live route."
          actions={<button type="button" className="s26-btn" onClick={productsState?.refetch}>Retry</button>}
        />
      ) : null}
      {shouldShowList ? (
        <Card
          title="Products / Product Catalog"
          hint="Search, filter, bulk action, status, SKU, stock, and product performance."
          actions={
            canCreate ? (
              <Link className="s26-btn primary" to={addProductTo} aria-label="Add Product">+ Add Product</Link>
            ) : (
              <button type="button" className="s26-btn primary" disabled title={createTitle}>+ Add Product</button>
            )
          }
        >
          {productSubmitStatus.type !== "idle" ? (
            <div className={`s26-alert ${productSubmitStatus.type === "success" ? "success" : "error"}`}>
              {productSubmitStatus.message}
            </div>
          ) : null}
          <div className="s26-tabs">
            {tabs.map(([value, label], index) => (
              <button
                type="button"
                className={`s26-tab ${(isLive ? currentStatus === value : index === 0) ? "active" : ""}`}
                key={label}
                onClick={() => isLive && queryChange({ status: value, page: 1 })}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="s26-filter-row">
            <input
              className="s26-search"
              aria-label="Search product, SKU, or category"
              placeholder="Search product, SKU, or category"
              value={isLive ? currentSearch : ""}
              onChange={(event) => queryChange({ search: event.target.value, page: 1 })}
              readOnly={!isLive}
            />
            <select
              className="s26-control"
              aria-label="Filter by category"
              value={currentCategory}
              onChange={(event) => queryChange({ category: event.target.value, page: 1 })}
            >
              {(productsData?.filters?.categories || [{ value: "all", label: "All Categories" }]).map((category) => (
                <option value={category.value} key={category.value}>{category.label}</option>
              ))}
            </select>
            <select
              className="s26-control"
              aria-label="Filter by status"
              value={currentStatus}
              onChange={(event) => queryChange({ status: event.target.value, page: 1 })}
            >
              {(productsData?.filters?.statuses || [{ value: "all", label: "All Status" }]).map((status) => (
                <option value={status.value} key={status.value}>{status.label}</option>
              ))}
            </select>
            <button type="button" className="s26-btn" disabled title={productBulkDisabledTitle}>Bulk Actions</button>
            <button type="button" className="s26-btn" disabled title={disabledTodoTitle}>More Filters</button>
          </div>
          {productsState?.isLoading ? <p className="hint">Loading products...</p> : null}
          {!productsState?.isLoading && tableRows.length === 0 ? (
            <div className="s26-empty">
              <strong>No products yet</strong>
              <p>Add the first product to start selling in this store.</p>
            </div>
          ) : (
            <DataTable
              columns={["", "Product", "SKU", "Stock", "Price", "Sales", "Views", "Status", "Updated", "Actions"]}
              rows={tableRows}
              renderRow={(row) => {
                const rowStatus = isLive ? productStatusLabel(row.status) : row.status;
                const detailTo = storeSlug ? `${basePath}/catalog/products/${encodeURIComponent(String(row.id))}` : "/seller-2026/products";
                const editTo = storeSlug ? `${detailTo}/edit` : "/seller-2026/products";
                const rowReadiness = getSeller2026ProductReadiness({
                  name: row.name,
                  productType: "Physical",
                  price: row.price,
                  stock: row.stock,
                  categoryLabel: row.category,
                  productId: row.id,
                  productEligible: Boolean(row.canSubmitReview),
                  submitPermission: canSubmitProductReview,
                  saving: isSubmittingProductReview,
                  dirty: false,
                  eligibilityReason: row.submitReviewReason,
                });
                return (
                  <tr key={row.id || row.sku}>
                    <td><input type="checkbox" aria-label={`Select ${row.name}`} disabled title={productBulkDisabledTitle} /></td>
                    <td>
                      <div className="s26-product-cell">
                        <span className="s26-thumb">{row.thumbnailUrl ? <img src={row.thumbnailUrl} alt="" /> : productInitial(row.name)}</span>
                        <div><strong>{row.name}</strong><div className="s26-sub">{row.category}</div></div>
                      </div>
                    </td>
                    <td>{row.sku}</td>
                    <td>{row.stock}</td>
                    <td>{isLive ? formatRupiah(row.price) : row.price}</td>
                    <td>{row.sales}</td>
                    <td>{row.views}</td>
                    <td><span className={statusClass(rowStatus)}>{rowStatus}</span></td>
                    <td>{isLive ? (row.updatedAt || "-") : row.updated}</td>
                    <td>
                      <div className="s26-row-actions">
                        <Link className="s26-link" to={detailTo}>Detail</Link>
                        {canUpdate ? <Link className="s26-link" to={editTo}>Edit</Link> : <button type="button" className="s26-muted-action" disabled title={updateTitle}>Edit</button>}
                        <button
                          type="button"
                          className="s26-muted-action"
                          disabled={
                            !canSubmitProductReview ||
                            !rowReadiness.ready ||
                            isSubmittingProductReview
                          }
                          title={
                            !rowReadiness.ready
                              ? rowReadiness.blockingItems[0]?.helper || row.submitReviewReason || "Only draft products can be submitted for review."
                              : submitReviewTitle
                          }
                          onClick={() => submitProductReview(row)}
                        >
                          {productsMutation?.submittingReviewProductId === row.id ? "Submitting..." : "Submit Review"}
                        </button>
                        <button type="button" className="s26-muted-action" disabled title={productArchiveDisabledTitle}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              }}
            />
          )}
          {isLive ? (
            <div className="s26-pagination">
              <span>Page {pagination.page} of {pagination.totalPages} - {pagination.total} products</span>
              <div className="s26-filter-row" style={{ marginBottom: 0 }}>
                <button type="button" className="s26-btn" disabled={pagination.page <= 1} onClick={() => queryChange({ page: pagination.page - 1 })}>Previous</button>
                <button type="button" className="s26-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => queryChange({ page: pagination.page + 1 })}>Next</button>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}
      {shouldShowEditor ? (
        <Card title={isLive ? editorTitle : "Product Create / Edit"} hint="Multi-step product authoring with a draft-first workflow.">
          <div className="s26-stepper">{["Basic", "Media", "Categories", "Variants", "Pricing", "Inventory", "Shipping", "SEO", "Publish"].map((s, i) => <span className={`s26-step ${i === 0 ? "active" : ""}`} key={s}>{s}</span>)}</div>
          {productDraftStatus.type !== "idle" ? (
            <div className={`s26-alert ${productDraftStatus.type === "success" ? "success" : "error"}`}>
              {productDraftStatus.message}
            </div>
          ) : null}
          {productSubmitStatus.type !== "idle" ? (
            <div className={`s26-alert ${productSubmitStatus.type === "success" ? "success" : "error"}`}>
              {productSubmitStatus.message}
            </div>
          ) : null}
          {productDraftMutation?.error && productDraftStatus.type !== "error" ? (
            <div className="s26-alert error">
              {productDraftMutation.error?.message || "Product draft failed to save."}
            </div>
          ) : null}
          <div className="s26-form-grid">
            <div className="s26-field">
              <label>Product Name *</label>
              <input
                value={isLive ? productDraftForm.name : "Premium Cotton Scarf"}
                readOnly={!isLive || !canSaveProductDraft}
                disabled={isSavingProductDraft}
                onChange={(event) => setProductDraftField("name", event.target.value)}
              />
              {productDraftErrors.name ? <small className="s26-field-error">{productDraftErrors.name}</small> : null}
            </div>
            <div className="s26-field">
              <label>SKU</label>
              <input
                value={isLive ? productDraftForm.sku : "PCS-COTTON-01-BLK"}
                readOnly={!isLive || !canSaveProductDraft}
                disabled={isSavingProductDraft}
                onChange={(event) => setProductDraftField("sku", event.target.value)}
              />
              {productDraftErrors.sku ? <small className="s26-field-error">{productDraftErrors.sku}</small> : null}
            </div>
            <div className="s26-field">
              <label>Product Type</label>
              <select defaultValue="Physical" disabled title="Only physical product draft save is enabled in this phase."><option>Physical</option><option>Digital</option><option>Service</option></select>
            </div>
            <div className="s26-field">
              <label>Brand</label>
              <input defaultValue={isLive ? editorProduct?.brand || "" : "Seller Brand"} readOnly disabled title="Brand persistence is not enabled in this draft-save phase." />
            </div>
            <div className="s26-field">
              <label>Price</label>
              <input
                type="number"
                min="0"
                value={isLive ? productDraftForm.price : "89000"}
                readOnly={!isLive || !canSaveProductDraft}
                disabled={isSavingProductDraft}
                onChange={(event) => setProductDraftField("price", event.target.value)}
              />
              {productDraftErrors.price ? <small className="s26-field-error">{productDraftErrors.price}</small> : null}
            </div>
            <div className="s26-field">
              <label>Sale Price</label>
              <input
                type="number"
                min="0"
                value={isLive ? productDraftForm.compareAtPrice : ""}
                readOnly={!isLive || !canSaveProductDraft}
                disabled={isSavingProductDraft}
                onChange={(event) => setProductDraftField("compareAtPrice", event.target.value)}
              />
              {productDraftErrors.compareAtPrice ? <small className="s26-field-error">{productDraftErrors.compareAtPrice}</small> : null}
            </div>
            <div className="s26-field">
              <label>Stock</label>
              <input
                type="number"
                min="0"
                step="1"
                value={isLive ? productDraftForm.stock : "120"}
                readOnly={!isLive || !canSaveProductDraft}
                disabled={isSavingProductDraft}
                onChange={(event) => setProductDraftField("stock", event.target.value)}
              />
              {productDraftErrors.stock ? <small className="s26-field-error">{productDraftErrors.stock}</small> : null}
            </div>
            <div className="s26-field">
              <label>Category IDs</label>
              <input
                value={isLive ? productDraftForm.categoryIdsText : "1, 2"}
                readOnly={!isLive || !canSaveProductDraft}
                disabled={isSavingProductDraft}
                onChange={(event) => setProductDraftField("categoryIdsText", event.target.value)}
                placeholder="Example: 1, 2"
              />
              {productDraftErrors.categoryIdsText ? <small className="s26-field-error">{productDraftErrors.categoryIdsText}</small> : null}
            </div>
            <div className="s26-field">
              <label>Tags</label>
              <input
                value={isLive ? productDraftForm.tagsText : "scarf, cotton"}
                readOnly={!isLive || !canSaveProductDraft}
                disabled={isSavingProductDraft}
                onChange={(event) => setProductDraftField("tagsText", event.target.value)}
                placeholder="Separate with commas"
              />
              {productDraftErrors.tagsText ? <small className="s26-field-error">{productDraftErrors.tagsText}</small> : null}
            </div>
            <div className="s26-field" style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <textarea
                value={isLive ? productDraftForm.description : "Premium product with clean finishing and customer-ready details."}
                readOnly={!isLive || !canSaveProductDraft}
                disabled={isSavingProductDraft}
                onChange={(event) => setProductDraftField("description", event.target.value)}
              />
              {productDraftErrors.description ? <small className="s26-field-error">{productDraftErrors.description}</small> : null}
            </div>
            <div className="s26-field">
              <label>SEO Title</label>
              <input
                value={isLive ? productDraftForm.seoTitle : ""}
                readOnly={!isLive || !canSaveProductDraft}
                disabled={isSavingProductDraft}
                onChange={(event) => setProductDraftField("seoTitle", event.target.value)}
              />
              {productDraftErrors.seoTitle ? <small className="s26-field-error">{productDraftErrors.seoTitle}</small> : null}
            </div>
            <div className="s26-field">
              <label>SEO Description</label>
              <input
                value={isLive ? productDraftForm.seoDescription : ""}
                readOnly={!isLive || !canSaveProductDraft}
                disabled={isSavingProductDraft}
                onChange={(event) => setProductDraftField("seoDescription", event.target.value)}
              />
              {productDraftErrors.seoDescription ? <small className="s26-field-error">{productDraftErrors.seoDescription}</small> : null}
            </div>
          </div>
          {isLive ? <ProductReadinessChecklist readiness={productDraftReadiness} /> : null}
          {isLive ? (
            <div className="s26-card soft" style={{ marginTop: 16 }}>
              <h3>Authoring Guardrails</h3>
              <p className="hint">Draft save and admin review submission are enabled. Publishing stays under Admin approval.</p>
              <div className="s26-filter-row" style={{ marginBottom: 0 }}>
                <button type="button" className="s26-btn" disabled title={productMediaDisabledTitle}>Upload Media</button>
                <button type="button" className="s26-btn" disabled title={productVariantDisabledTitle}>Edit Variants</button>
                <button type="button" className="s26-btn" disabled title={productPublishDisabledTitle}>Publish Product</button>
                <button type="button" className="s26-btn" disabled title={productDuplicateDisabledTitle}>Duplicate Product</button>
                <button type="button" className="s26-btn" disabled title={productArchiveDisabledTitle}>Archive Product</button>
              </div>
            </div>
          ) : null}
          <div className="s26-filter-row" style={{ marginTop: 16, marginBottom: 0 }}>
            {isLive ? <button type="button" className="s26-btn" disabled={!productDraftDirty || isSavingProductDraft} onClick={resetProductDraftForm}>Reset</button> : null}
            <button type="button" className="s26-btn" disabled={saveProductDraftDisabled} title={isLive ? saveProductDraftTitle : disabledTodoTitle} onClick={submitProductDraftForm}>{isSavingProductDraft ? "Saving..." : productEditorMode === "edit" ? "Save Changes" : "Save Draft"}</button>
            <button
              type="button"
              className="s26-btn primary"
              disabled={
                !isLive ||
                !canSubmitProductReview ||
                isSavingProductDraft ||
                isSubmittingProductReview ||
                !productDraftReadiness.ready
              }
              title={
                !productDraftReadiness.ready
                  ? productDraftReadiness.blockingItems[0]?.helper || "Complete required readiness checks before submitting for review."
                  : submitReviewTitle
              }
              onClick={submitCurrentDraftForReview}
            >
              {isSubmittingProductReview ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </Card>
      ) : null}
      {shouldShowDetail ? (
      <Card title="Product Detail / Preview" hint="Gallery, performance, variants, revision notes, and publish history.">
        {productDetailState?.isError ? (
          <div className="s26-empty">
            <strong>Product detail unavailable</strong>
            <p>Product detail cannot be loaded right now.</p>
            <button type="button" className="s26-btn" onClick={productDetailState?.refetch}>Retry</button>
          </div>
        ) : null}
        {productDetailState?.isLoading ? <p className="hint">Loading product detail...</p> : null}
        {productSubmitStatus.type !== "idle" ? (
          <div className={`s26-alert ${productSubmitStatus.type === "success" ? "success" : "error"}`}>
            {productSubmitStatus.message}
          </div>
        ) : null}
        <div className="s26-grid three">
          <div className="s26-card soft"><div className="s26-product-gallery">{detailView?.product.gallery?.[0] ? <img src={detailView.product.gallery[0]} alt="" /> : productInitial(detailView?.product.name || "P")}</div><button type="button" className="s26-btn" style={{ width: "100%", marginTop: 12 }} disabled={isLive} title={isLive ? "Public storefront preview is unavailable until Admin approval publishes this product." : disabledTodoTitle}>View on Storefront</button></div>
          <div><h3>{detailView?.product.name || "Product detail"} <span className={statusClass(productStatusLabel(detailView?.product.status))}>{productStatusLabel(detailView?.product.status)}</span></h3><p className="hint">SKU: {detailView?.product.sku || "-"}</p><div className="s26-grid two" style={{ marginTop: 16 }}>{[["Price", formatRupiah(detailView?.product.price)], ["Stock", detailView?.product.stock || 0], ["Sold", detailView?.product.sold || 0], ["Views", detailView?.product.views || 0]].map(([a, b]) => <div className="s26-card soft" key={a}><p className="hint">{a}</p><strong>{b}</strong></div>)}</div><p className="hint" style={{ marginTop: 14 }}>Category: {detailView?.product.category || "Uncategorized"}. Tags: {(detailView?.product.tags || []).join(", ") || "No tags"}.</p><p className="hint" style={{ marginTop: 14 }}>{detailView?.product.description || "Product description is not available yet."}</p></div>
          <div>
            <Card title="Revision Notes" hint={detailView?.revisionNotes.length ? detailView.revisionNotes.map((note) => note.message).join(" | ") : "No revision notes."} />
            <Card title="Publish History" hint={detailView?.publishHistory.length ? detailView.publishHistory.map((item) => item.label).join(" / ") : "No publish history yet."} className="soft" />
            {isLive ? <ProductReadinessChecklist readiness={productDetailReadiness} /> : null}
            {isLive ? (
              <button
                type="button"
                className="s26-btn primary"
                style={{ marginTop: 12, width: "100%" }}
                disabled={
                  !canSubmitProductReview ||
                  !productDetailReadiness.ready ||
                  isSubmittingProductReview
                }
                title={
                  !productDetailReadiness.ready
                    ? productDetailReadiness.blockingItems[0]?.helper || "Complete required readiness checks before submitting for review."
                    : submitReviewTitle
                }
                onClick={() => submitProductReview(detailView?.product)}
              >
                {isSubmittingProductReview ? "Submitting..." : "Submit Review"}
              </button>
            ) : null}
          </div>
        </div>
      </Card>
      ) : null}
    </Shell>
  );
}

function CatalogKpi({ label, value }) {
  return (
    <div className="s26-card soft">
      <p className="hint">{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function TaxonomyPage({
  catalogView = "overview",
  catalogData = null,
  catalogState = null,
  catalogQuery = null,
  onCatalogQueryChange = null,
  catalogMutation = null,
  mode,
  storeContext,
  seller2026Permissions,
}) {
  const { storeSlug } = useParams();
  const [couponDrawerOpen, setCouponDrawerOpen] = useState(false);
  const [couponEditing, setCouponEditing] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "percent",
    amount: "",
    minSpend: "0",
    usageLimit: "",
    startsAt: "",
    expiresAt: "",
    active: true,
  });
  const [couponMutationStatus, setCouponMutationStatus] = useState({ type: "idle", message: "" });
  const [couponArchiveCandidate, setCouponArchiveCandidate] = useState(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryEditing, setCategoryEditing] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    parentId: "",
    isPublished: true,
  });
  const [categoryMutationStatus, setCategoryMutationStatus] = useState({ type: "idle", message: "" });
  const [attributeModalOpen, setAttributeModalOpen] = useState(false);
  const [attributeEditing, setAttributeEditing] = useState(null);
  const [attributeForm, setAttributeForm] = useState({
    name: "",
    description: "",
    type: "dropdown",
    initialValues: "Default",
    published: true,
  });
  const [attributeMutationStatus, setAttributeMutationStatus] = useState({ type: "idle", message: "" });
  const [attributeValueModalOpen, setAttributeValueModalOpen] = useState(false);
  const [attributeValueEditing, setAttributeValueEditing] = useState(null);
  const [attributeValueForm, setAttributeValueForm] = useState({
    label: "",
    value: "",
    description: "",
    color: "",
  });
  const [attributeValueMutationStatus, setAttributeValueMutationStatus] = useState({ type: "idle", message: "" });
  const isLive = Boolean(catalogData || catalogState);
  const basePath = storeSlug ? `/seller/stores/${encodeURIComponent(storeSlug)}` : "/seller-2026";
  const queryChange = (next) => onCatalogQueryChange?.(next);
  const searchValue = catalogQuery?.search || "";
  const resetCategoryForm = (category = null) => {
    setCategoryEditing(category);
    setCategoryForm({
      name: category?.name || "",
      description: category?.description === "No description available." ? "" : category?.description || "",
      parentId: category?.parentId ? String(category.parentId) : "",
      isPublished: Boolean(category?.isPublished ?? true),
    });
    setCategoryMutationStatus({ type: "idle", message: "" });
  };
  const openCategoryCreate = () => {
    resetCategoryForm(null);
    setCategoryModalOpen(true);
  };
  const openCategoryEdit = (category) => {
    resetCategoryForm(category);
    setCategoryModalOpen(true);
  };
  const setCategoryField = (field, value) => {
    setCategoryForm((current) => ({ ...current, [field]: value }));
    setCategoryMutationStatus({ type: "idle", message: "" });
  };
  const categoryErrors = useMemo(() => {
    const errors = {};
    if (!categoryForm.name.trim()) errors.name = "Category name is required.";
    if (categoryForm.name.trim().length > 120) errors.name = "Category name must be 120 characters or fewer.";
    if (categoryForm.description.trim().length > 255) {
      errors.description = "Description must be 255 characters or fewer.";
    }
    return errors;
  }, [categoryForm]);
  const categoryFormValid = Object.keys(categoryErrors).length === 0;
  const isCategoryMutating =
    Boolean(catalogMutation?.creatingCategory) ||
    Boolean(catalogMutation?.updatingCategoryId) ||
    Boolean(catalogMutation?.statusChangingCategoryId);
  const submitCategoryForm = async () => {
    if (!categoryFormValid || !catalogMutation) return;
    const isEdit = Boolean(categoryEditing?.id);
    const submit = isEdit ? catalogMutation.updateCategory : catalogMutation.createCategory;
    if (!submit) return;

    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim() || undefined,
      parentId: Number(categoryForm.parentId || 0) || null,
    };
    if (!isEdit) {
      payload.isPublished = Boolean(categoryForm.isPublished);
    }

    setCategoryMutationStatus({ type: "idle", message: "" });
    try {
      if (isEdit) {
        await submit({ categoryId: categoryEditing.id, payload });
      } else {
        await submit(payload);
      }
      setCategoryMutationStatus({
        type: "success",
        message: isEdit ? "Category updated." : "Category created.",
      });
      setCategoryModalOpen(false);
      setCategoryEditing(null);
      setCategoryForm({ name: "", description: "", parentId: "", isPublished: true });
      catalogState?.refetch?.();
    } catch (error) {
      setCategoryMutationStatus({
        type: "error",
        message: getSeller2026ErrorMessage(error, isEdit ? "Category update failed." : "Category creation failed."),
      });
    }
  };
  const runCategoryStatusAction = async (row) => {
    if (!catalogMutation?.setCategoryPublished || !row?.id) return;
    setCategoryMutationStatus({ type: "idle", message: "" });
    try {
      await catalogMutation.setCategoryPublished({
        categoryId: row.id,
        isPublished: !row.isPublished,
      });
      setCategoryMutationStatus({
        type: "success",
        message: row.isPublished ? "Category unpublished." : "Category published.",
      });
      catalogState?.refetch?.();
    } catch (error) {
      setCategoryMutationStatus({
        type: "error",
        message: getSeller2026ErrorMessage(error, "Category status update failed."),
      });
    }
  };
  const resetAttributeForm = (attribute = null) => {
    setAttributeEditing(attribute);
    setAttributeForm({
      name: attribute?.rawName || attribute?.name || "",
      description: attribute?.description === "No description available." ? "" : attribute?.description || "",
      type: ["dropdown", "radio", "checkbox"].includes(attribute?.type) ? attribute.type : "dropdown",
      initialValues: "Default",
      published: Boolean(attribute?.isPublished ?? true),
    });
    setAttributeMutationStatus({ type: "idle", message: "" });
  };
  const openAttributeCreate = () => {
    resetAttributeForm(null);
    setAttributeModalOpen(true);
  };
  const openAttributeEdit = (attribute) => {
    resetAttributeForm(attribute);
    setAttributeModalOpen(true);
  };
  const setAttributeField = (field, value) => {
    setAttributeForm((current) => ({ ...current, [field]: value }));
    setAttributeMutationStatus({ type: "idle", message: "" });
  };
  const attributeErrors = useMemo(() => {
    const errors = {};
    const values = attributeForm.initialValues
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (!attributeForm.name.trim()) errors.name = "Attribute name is required.";
    if (attributeForm.name.trim().length > 120) errors.name = "Attribute name must be 120 characters or fewer.";
    if (!["dropdown", "radio", "checkbox"].includes(attributeForm.type)) errors.type = "Attribute type is required.";
    if (!attributeEditing && values.length === 0) errors.initialValues = "Add at least one initial value.";
    if (attributeForm.description.trim().length > 255) errors.description = "Description must be 255 characters or fewer.";
    return errors;
  }, [attributeEditing, attributeForm]);
  const attributeFormValid = Object.keys(attributeErrors).length === 0;
  const isAttributeMutating =
    Boolean(catalogMutation?.creatingAttribute) ||
    Boolean(catalogMutation?.updatingAttributeId) ||
    Boolean(catalogMutation?.statusChangingAttributeId);
  const submitAttributeForm = async () => {
    if (!attributeFormValid || !catalogMutation) return;
    const isEdit = Boolean(attributeEditing?.id);
    const submit = isEdit ? catalogMutation.updateAttribute : catalogMutation.createAttribute;
    if (!submit) return;

    const payload = {
      name: attributeForm.name.trim(),
      displayName: attributeForm.description.trim() || attributeForm.name.trim(),
      type: attributeForm.type,
    };
    if (!isEdit) {
      payload.values = attributeForm.initialValues
        .split(/\r?\n|,/)
        .map((value) => value.trim())
        .filter(Boolean);
      payload.published = Boolean(attributeForm.published);
    }

    setAttributeMutationStatus({ type: "idle", message: "" });
    try {
      if (isEdit) {
        await submit({ attributeId: attributeEditing.id, payload });
      } else {
        await submit(payload);
      }
      setAttributeMutationStatus({
        type: "success",
        message: isEdit ? "Attribute updated." : "Attribute created.",
      });
      setAttributeModalOpen(false);
      setAttributeEditing(null);
      setAttributeForm({ name: "", description: "", type: "dropdown", initialValues: "Default", published: true });
      catalogState?.refetch?.();
    } catch (error) {
      setAttributeMutationStatus({
        type: "error",
        message: getSeller2026ErrorMessage(error, isEdit ? "Attribute update failed." : "Attribute creation failed."),
      });
    }
  };
  const runAttributeStatusAction = async (row) => {
    if (!catalogMutation?.setAttributePublished || !row?.id) return;
    setAttributeMutationStatus({ type: "idle", message: "" });
    try {
      await catalogMutation.setAttributePublished({
        attributeId: row.id,
        published: !row.isPublished,
      });
      setAttributeMutationStatus({
        type: "success",
        message: row.isPublished ? "Attribute unpublished." : "Attribute published.",
      });
      catalogState?.refetch?.();
    } catch (error) {
      setAttributeMutationStatus({
        type: "error",
        message: getSeller2026ErrorMessage(error, "Attribute status update failed."),
      });
    }
  };
  const resetAttributeValueForm = (value = null) => {
    setAttributeValueEditing(value);
    setAttributeValueForm({
      label: value?.label || value?.value || "",
      value: value?.value || value?.label || "",
      description: value?.description === "No description available." ? "" : value?.description || "",
      color: value?.color || value?.swatch || "",
    });
    setAttributeValueMutationStatus({ type: "idle", message: "" });
  };
  const openAttributeValueCreate = () => {
    resetAttributeValueForm(null);
    setAttributeValueModalOpen(true);
  };
  const openAttributeValueEdit = (value) => {
    resetAttributeValueForm(value);
    setAttributeValueModalOpen(true);
  };
  const setAttributeValueField = (field, value) => {
    setAttributeValueForm((current) => ({ ...current, [field]: value }));
    setAttributeValueMutationStatus({ type: "idle", message: "" });
  };
  const attributeValueErrors = useMemo(() => {
    const errors = {};
    if (!attributeValueForm.label.trim() && !attributeValueForm.value.trim()) {
      errors.label = "Value label is required.";
    }
    if (attributeValueForm.label.trim().length > 120) errors.label = "Value label must be 120 characters or fewer.";
    if (attributeValueForm.value.trim().length > 120) errors.value = "Value must be 120 characters or fewer.";
    if (attributeValueForm.description.trim().length > 255) {
      errors.description = "Description must be 255 characters or fewer.";
    }
    return errors;
  }, [attributeValueForm]);
  const attributeValueFormValid = Object.keys(attributeValueErrors).length === 0;
  const isAttributeValueMutating =
    Boolean(catalogMutation?.creatingAttributeValue) ||
    Boolean(catalogMutation?.updatingAttributeValueId);
  const submitAttributeValueForm = async () => {
    if (!attributeValueFormValid || !catalogMutation) return;
    const isEdit = Boolean(attributeValueEditing?.id);
    const submit = isEdit ? catalogMutation.updateAttributeValue : catalogMutation.createAttributeValue;
    if (!submit) return;

    const canonicalValue = attributeValueForm.value.trim() || attributeValueForm.label.trim();
    const payload = { value: canonicalValue };

    setAttributeValueMutationStatus({ type: "idle", message: "" });
    try {
      if (isEdit) {
        await submit({ valueId: attributeValueEditing.id, payload });
      } else {
        await submit(payload);
      }
      setAttributeValueMutationStatus({
        type: "success",
        message: isEdit ? "Value updated." : "Value created.",
      });
      setAttributeValueModalOpen(false);
      setAttributeValueEditing(null);
      setAttributeValueForm({ label: "", value: "", description: "", color: "" });
      catalogState?.refetch?.();
    } catch (error) {
      setAttributeValueMutationStatus({
        type: "error",
        message: getSeller2026ErrorMessage(error, isEdit ? "Value update failed." : "Value creation failed."),
      });
    }
  };
  const resetCouponForm = (coupon = null) => {
    setCouponEditing(coupon);
    setCouponForm({
      code: coupon?.code || "",
      name: coupon?.title || coupon?.name || "",
      description: coupon?.description === "No description available." ? "" : coupon?.description || "",
      discountType: coupon?.discountType || "percent",
      amount: coupon?.amount ? String(coupon.amount) : "",
      minSpend: String(coupon?.minSpend ?? coupon?.minimumSpend ?? 0),
      usageLimit: coupon?.usageLimit ? String(coupon.usageLimit) : "",
      startsAt: coupon?.startsAt ? String(coupon.startsAt).slice(0, 16) : "",
      expiresAt: coupon?.expiresAt ? String(coupon.expiresAt).slice(0, 16) : "",
      active: coupon?.active ?? true,
    });
    setCouponMutationStatus({ type: "idle", message: "" });
  };
  const openCouponCreate = () => {
    resetCouponForm(null);
    setCouponDrawerOpen(true);
  };
  const openCouponEdit = (coupon) => {
    resetCouponForm(coupon);
    setCouponDrawerOpen(true);
  };
  const setCouponField = (field, value) => {
    setCouponForm((current) => ({ ...current, [field]: value }));
    setCouponMutationStatus({ type: "idle", message: "" });
  };
  const couponErrors = useMemo(() => {
    const errors = {};
    if (!couponForm.code.trim()) errors.code = "Coupon code is required.";
    if (!couponForm.name.trim()) errors.name = "Coupon title is required.";
    if (couponForm.description.trim().length > 255) errors.description = "Description must be 255 characters or fewer.";
    if (!["percent", "fixed"].includes(couponForm.discountType)) errors.discountType = "Discount type is required.";
    const amount = Number(couponForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) errors.amount = "Discount value must be greater than 0.";
    if (couponForm.discountType === "percent" && amount > 100) errors.amount = "Percentage discount cannot exceed 100.";
    const minSpend = Number(couponForm.minSpend || 0);
    if (!Number.isFinite(minSpend) || minSpend < 0) errors.minSpend = "Minimum spend must be zero or greater.";
    if (couponForm.usageLimit) {
      const usageLimit = Number(couponForm.usageLimit);
      if (!Number.isFinite(usageLimit) || usageLimit < 0) errors.usageLimit = "Usage limit must be zero or greater.";
    }
    if (couponForm.startsAt && couponForm.expiresAt && new Date(couponForm.expiresAt).getTime() < new Date(couponForm.startsAt).getTime()) {
      errors.expiresAt = "End date must be after start date.";
    }
    return errors;
  }, [couponForm]);
  const couponFormValid = Object.keys(couponErrors).length === 0;
  const submitCouponForm = async () => {
    if (!couponFormValid || !catalogMutation) return;
    const isEdit = Boolean(couponEditing?.id);
    const submit = isEdit ? catalogMutation.updateCoupon : catalogMutation.createCoupon;
    if (!submit) return;
    setCouponMutationStatus({ type: "idle", message: "" });
    try {
      const payload = {
        code: couponForm.code,
        campaignName: couponForm.name,
        discountType: couponForm.discountType,
        amount: couponForm.amount,
        minSpend: couponForm.minSpend,
        active: couponForm.active,
        startsAt: couponForm.startsAt,
        expiresAt: couponForm.expiresAt,
      };
      if (isEdit) {
        await submit({ couponId: couponEditing.id, payload });
      } else {
        await submit(payload);
      }
      setCouponMutationStatus({ type: "success", message: isEdit ? "Coupon updated." : "Coupon created." });
      setCouponDrawerOpen(false);
      setCouponEditing(null);
      setCouponForm({ code: "", name: "", description: "", discountType: "percent", amount: "", minSpend: "0", usageLimit: "", startsAt: "", expiresAt: "", active: true });
      catalogState?.refetch?.();
    } catch (error) {
      setCouponMutationStatus({
        type: "error",
        message: error?.message || "Coupon mutation failed.",
      });
    }
  };
  const runCouponStatusAction = async (action, successMessage) => {
    if (!action) return;
    setCouponMutationStatus({ type: "idle", message: "" });
    try {
      await action();
      setCouponMutationStatus({ type: "success", message: successMessage });
      catalogState?.refetch?.();
    } catch (error) {
      setCouponMutationStatus({ type: "error", message: error?.message || "Coupon mutation failed." });
    }
  };
  const openCouponArchiveConfirm = (coupon) => {
    if (!coupon?.id) return;
    setCouponArchiveCandidate(coupon);
    setCouponMutationStatus({ type: "idle", message: "" });
  };
  const closeCouponArchiveConfirm = () => {
    setCouponArchiveCandidate(null);
  };
  const confirmCouponArchive = async () => {
    const couponId = couponArchiveCandidate?.id;
    if (!couponId) return;
    await runCouponStatusAction(() => catalogMutation?.deleteOrArchiveCoupon(couponId), "Coupon archived.");
    setCouponArchiveCandidate(null);
  };

  if (isLive && catalogView === "categories") {
    const categoryRows = catalogData?.categories || [];
    const summary = catalogData?.summary || {};
    const canCreateCategory = Boolean(catalogMutation?.canCreateCategory);
    const canUpdateCategory = Boolean(catalogMutation?.canUpdateCategory);
    const canManageCategoryStatus = Boolean(catalogMutation?.canManageCategoryStatus);
    const parentCategoryOptions = categoryRows.filter((row) => !categoryEditing?.id || row.id !== categoryEditing.id);
    return (
      <Shell section="taxonomy" mode={mode} storeContext={storeContext}>
        {catalogState?.isError ? <Card title="Categories could not be loaded" hint="Store-scoped categories are temporarily unavailable." actions={<button type="button" className="s26-btn" onClick={catalogState?.refetch}>Try again</button>} /> : null}
        <Card
          title="Categories"
          hint="Organize products with store-scoped live category data."
          actions={<button type="button" className="s26-btn primary" onClick={openCategoryCreate} disabled={!canCreateCategory || isCategoryMutating} title={canCreateCategory ? undefined : permissionTitle}>Create Category</button>}
        >
          <div data-seller2026-live-categories="true" className="s26-grid five" style={{ marginBottom: 14 }}>
            <CatalogKpi label="Total" value={summary.total || summary.totalCategories || 0} />
            <CatalogKpi label="Published" value={summary.published || 0} />
            <CatalogKpi label="Draft" value={summary.draft || 0} />
            <CatalogKpi label="Empty" value={summary.empty || 0} />
            <CatalogKpi label="Needs Attention" value={summary.needsAttention || 0} />
          </div>
          <div className="s26-filter-row">
            <input className="s26-search" aria-label="Search categories" placeholder="Search categories" value={searchValue} onChange={(event) => queryChange({ search: event.target.value })} />
            <Link className="s26-btn" to={`${basePath}/catalog/products`}>View Products</Link>
            <button type="button" className="s26-btn" disabled title={categoryExportDisabledTitle}>Export</button>
            <button type="button" className="s26-btn" disabled title={categoryImportDisabledTitle}>Import</button>
            <button type="button" className="s26-btn" disabled title={categoryBulkDisabledTitle}>Bulk Actions</button>
          </div>
          {categoryMutationStatus.message ? <p className={categoryMutationStatus.type === "error" ? "s26-field-error" : "hint"}>{categoryMutationStatus.message}</p> : null}
          {catalogState?.isLoading ? <p className="hint">Loading categories...</p> : null}
          {!catalogState?.isLoading && categoryRows.length === 0 ? (
            <div className="s26-empty"><strong>No categories yet</strong><p>Create categories to organize your products.</p></div>
          ) : (
            <DataTable columns={["Category", "Slug", "Products", "Status", "Last Updated", "Actions"]} rows={categoryRows} renderRow={(row) => <tr key={row.id}><td><div className="s26-product-cell">{row.image ? <span className="s26-thumb"><img src={row.image} alt={row.name} /></span> : <span className="s26-thumb">{String(row.name || "C").slice(0, 1).toUpperCase()}</span>}<div><strong>{row.level ? `${"  ".repeat(row.level)}${row.name}` : row.name}</strong><div className="s26-sub">{row.description || "No description available."}</div></div></div></td><td><span className="s26-sub">{row.slug}</span></td><td>{row.productCount}</td><td><span className={statusClass(row.status === "active" ? "Active" : row.statusLabel || "Needs review")}>{row.statusLabel || row.status}</span></td><td>{row.updatedAt || "Recently"}</td><td><div className="s26-row-actions"><Link className="s26-link" to={`${basePath}${row.canonicalHref || `/catalog/products?category=${encodeURIComponent(String(row.id))}`}`}>Products</Link><button type="button" className="s26-muted-action" disabled={!canUpdateCategory || isCategoryMutating} title={canUpdateCategory ? undefined : permissionTitle} onClick={() => openCategoryEdit(row)}>Edit</button><button type="button" className="s26-muted-action" disabled={!canManageCategoryStatus || isCategoryMutating} title={canManageCategoryStatus ? undefined : permissionTitle} onClick={() => runCategoryStatusAction(row)}>{catalogMutation?.statusChangingCategoryId === row.id ? "Saving..." : row.isPublished ? "Unpublish" : "Publish"}</button></div></td></tr>} />
          )}
        </Card>
        {categoryModalOpen ? (
          <div className="s26-modal-backdrop" role="presentation">
            <section className="s26-modal" role="dialog" aria-modal="true" aria-labelledby="s26-category-modal-title">
              <div className="s26-card-head">
                <div>
                  <h3 id="s26-category-modal-title">{categoryEditing ? "Update Category" : "Add Category"}</h3>
                  <p className="hint">Store scope is resolved from the active seller workspace.</p>
                </div>
                <button type="button" className="s26-btn" onClick={() => { setCategoryModalOpen(false); resetCategoryForm(null); }} disabled={isCategoryMutating} aria-label="Close category modal">Close</button>
              </div>
              <div className="s26-form-grid">
                <div className="s26-field"><label htmlFor="s26-category-name">Category Name</label><input id="s26-category-name" value={categoryForm.name} onChange={(event) => setCategoryField("name", event.target.value)} placeholder="Category name" disabled={isCategoryMutating} />{categoryErrors.name ? <span className="s26-field-error">{categoryErrors.name}</span> : null}</div>
                <div className="s26-field"><label htmlFor="s26-category-parent">Parent Category</label><select id="s26-category-parent" value={categoryForm.parentId} onChange={(event) => setCategoryField("parentId", event.target.value)} disabled={isCategoryMutating}><option value="">Root category</option>{parentCategoryOptions.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></div>
                <div className="s26-field s26-field-span-2"><label htmlFor="s26-category-description">Description</label><textarea id="s26-category-description" value={categoryForm.description} onChange={(event) => setCategoryField("description", event.target.value)} placeholder="Optional category description" disabled={isCategoryMutating} />{categoryErrors.description ? <span className="s26-field-error">{categoryErrors.description}</span> : null}</div>
                {!categoryEditing ? <label className="s26-toggle-row" htmlFor="s26-category-published"><span>Published</span><input id="s26-category-published" type="checkbox" checked={categoryForm.isPublished} onChange={(event) => setCategoryField("isPublished", event.target.checked)} disabled={isCategoryMutating || !canManageCategoryStatus} /></label> : <div className="s26-toggle-row"><span>Published</span><span className="hint">Use the row status action.</span></div>}
                <div className="s26-upload-guard"><strong>Category Image</strong><p>{catalogMutation?.categoryUploadDisabledReason || "Category image upload is disabled until storage validation is complete."}</p><button type="button" className="s26-btn" disabled>Upload Image</button></div>
              </div>
              {categoryMutationStatus.message ? <p className={categoryMutationStatus.type === "error" ? "s26-field-error" : "hint"} style={{ marginTop: 14 }}>{categoryMutationStatus.message}</p> : null}
              <div className="s26-filter-row" style={{ marginTop: 16, marginBottom: 0 }}>
                <button type="button" className="s26-btn" onClick={() => { setCategoryModalOpen(false); resetCategoryForm(null); }} disabled={isCategoryMutating}>Cancel</button>
                <button type="button" className="s26-btn primary" onClick={submitCategoryForm} disabled={!categoryFormValid || isCategoryMutating || (categoryEditing ? !canUpdateCategory : !canCreateCategory)}>{isCategoryMutating ? "Saving..." : categoryEditing ? "Update Category" : "Add Category"}</button>
              </div>
            </section>
          </div>
        ) : null}
        <Card title="Category Suggestions" hint="Local suggestions stay empty unless the API provides signals.">
          {(catalogData?.recommendedCategories || []).length === 0 ? <div className="s26-empty"><strong>No recommended categories yet.</strong><p>Recommendations will appear once catalog signals are available.</p></div> : null}
          <div className="s26-grid three">
            {(catalogData?.recommendedCategories || []).map((item) => <div className="s26-card soft" key={item.id}><strong>{item.name}</strong><p className="hint">{item.path || "No path"} - {item.productCount || 0} products</p></div>)}
          </div>
        </Card>
      </Shell>
    );
  }

  if (isLive && catalogView === "attributes") {
    const attributeRows = catalogData?.attributes || [];
    const summary = catalogData?.summary || {};
    const canCreateAttribute = Boolean(catalogMutation?.canCreateAttribute);
    const canUpdateAttribute = Boolean(catalogMutation?.canUpdateAttribute);
    const canManageAttributeStatus = Boolean(catalogMutation?.canManageAttributeStatus);
    return (
      <Shell section="taxonomy" mode={mode} storeContext={storeContext}>
        {catalogState?.isError ? <Card title="Attributes could not be loaded" hint="Store-scoped attributes are temporarily unavailable." actions={<button type="button" className="s26-btn" onClick={catalogState?.refetch}>Try again</button>} /> : null}
        <Card title="Attributes" hint="Define product options and specifications with live store-scoped data." actions={<button type="button" className="s26-btn primary" onClick={openAttributeCreate} disabled={!canCreateAttribute || isAttributeMutating} title={canCreateAttribute ? undefined : permissionTitle}>Add Attribute</button>}>
          <div data-seller2026-live-attributes="true" className="s26-grid five" style={{ marginBottom: 14 }}>
            <CatalogKpi label="Total" value={summary.total || 0} />
            <CatalogKpi label="Published" value={summary.published || 0} />
            <CatalogKpi label="Draft" value={summary.draft || 0} />
            <CatalogKpi label="Filterable" value={summary.filterable || 0} />
            <CatalogKpi label="Without Values" value={summary.withoutValues || 0} />
          </div>
          <div className="s26-filter-row">
            <input className="s26-search" aria-label="Search attributes" placeholder="Search attributes" value={searchValue} onChange={(event) => queryChange({ search: event.target.value, page: 1 })} />
            <select className="s26-control" aria-label="Filter attribute type" value={catalogQuery?.type || "all"} onChange={(event) => queryChange({ type: event.target.value, page: 1 })}><option value="all">All Types</option><option value="dropdown">Dropdown</option><option value="radio">Radio</option><option value="checkbox">Checkbox</option></select>
            <select className="s26-control" aria-label="Filter attribute status" value={catalogQuery?.status || "all"} onChange={(event) => queryChange({ status: event.target.value, page: 1 })}><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
            <Link className="s26-btn" to={`${basePath}/catalog/products`}>View Products</Link>
            <button type="button" className="s26-btn" disabled title={attributeExportDisabledTitle}>Export</button>
            <button type="button" className="s26-btn" disabled title={attributeImportDisabledTitle}>Import</button>
            <button type="button" className="s26-btn" disabled title={attributeBulkDisabledTitle}>Bulk Actions</button>
          </div>
          {attributeMutationStatus.message ? <p className={attributeMutationStatus.type === "error" ? "s26-field-error" : "hint"}>{attributeMutationStatus.message}</p> : null}
          {catalogState?.isLoading ? <p className="hint">Loading attributes...</p> : null}
          {!catalogState?.isLoading && attributeRows.length === 0 ? (
            <div className="s26-empty"><strong>No attributes yet</strong><p>Create attributes to describe product options and specifications.</p></div>
          ) : (
            <DataTable columns={["Attribute", "Slug", "Type", "Values", "Required", "Filterable", "Status", "Last Updated", "Actions"]} rows={attributeRows} renderRow={(row) => <tr key={row.id}><td><div><strong>{row.name}</strong><div className="s26-sub">{row.description || "No description available."}</div></div></td><td><span className="s26-sub">{row.slug}</span></td><td><span className="s26-pill">{row.type}</span></td><td>{row.valuesCount}</td><td>{row.isRequired ? "Yes" : "No"}</td><td>{row.isFilterable ? "Yes" : "No"}</td><td><span className={statusClass(row.statusLabel || (row.status === "active" ? "Published" : "Draft"))}>{row.statusLabel || row.status}</span></td><td>{row.updatedAt || "Recently"}</td><td><div className="s26-row-actions"><Link className="s26-link" to={`${basePath}${row.canonicalValuesHref || `/catalog/attributes/${encodeURIComponent(String(row.id))}/values`}`}>Manage Values</Link><button type="button" className="s26-muted-action" disabled={!canUpdateAttribute || isAttributeMutating || row.managedByAdmin} title={row.managedByAdmin ? "Managed by Admin" : canUpdateAttribute ? undefined : permissionTitle} onClick={() => openAttributeEdit(row)}>Edit</button><button type="button" className="s26-muted-action" disabled={!canManageAttributeStatus || isAttributeMutating || row.managedByAdmin} title={row.managedByAdmin ? "Managed by Admin" : canManageAttributeStatus ? undefined : permissionTitle} onClick={() => runAttributeStatusAction(row)}>{catalogMutation?.statusChangingAttributeId === row.id ? "Saving..." : row.isPublished ? "Unpublish" : "Publish"}</button><button type="button" className="s26-muted-action" disabled title={attributeDeleteDisabledTitle}>Delete</button></div></td></tr>} />
          )}
        </Card>
        {attributeModalOpen ? (
          <div className="s26-modal-backdrop" role="presentation">
            <section className="s26-modal" role="dialog" aria-modal="true" aria-labelledby="s26-attribute-modal-title">
              <div className="s26-card-head">
                <div>
                  <h3 id="s26-attribute-modal-title">{attributeEditing ? "Update Attribute" : "Add Attribute"}</h3>
                  <p className="hint">Store scope is resolved from the active seller workspace.</p>
                </div>
                <button type="button" className="s26-btn" onClick={() => { setAttributeModalOpen(false); resetAttributeForm(null); }} disabled={isAttributeMutating} aria-label="Close attribute modal">Close</button>
              </div>
              <div className="s26-form-grid">
                <div className="s26-field"><label htmlFor="s26-attribute-name">Attribute Name</label><input id="s26-attribute-name" value={attributeForm.name} onChange={(event) => setAttributeField("name", event.target.value)} placeholder="Attribute name" disabled={isAttributeMutating} />{attributeErrors.name ? <span className="s26-field-error">{attributeErrors.name}</span> : null}</div>
                <div className="s26-field"><label htmlFor="s26-attribute-type">Type</label><select id="s26-attribute-type" value={attributeForm.type} onChange={(event) => setAttributeField("type", event.target.value)} disabled={isAttributeMutating}><option value="dropdown">Dropdown</option><option value="radio">Radio</option><option value="checkbox">Checkbox</option></select>{attributeErrors.type ? <span className="s26-field-error">{attributeErrors.type}</span> : null}</div>
                <div className="s26-field s26-field-span-2"><label htmlFor="s26-attribute-description">Description</label><textarea id="s26-attribute-description" value={attributeForm.description} onChange={(event) => setAttributeField("description", event.target.value)} placeholder="Optional attribute description" disabled={isAttributeMutating} />{attributeErrors.description ? <span className="s26-field-error">{attributeErrors.description}</span> : null}</div>
                {!attributeEditing ? <div className="s26-field s26-field-span-2"><label htmlFor="s26-attribute-values">Initial Values</label><textarea id="s26-attribute-values" value={attributeForm.initialValues} onChange={(event) => setAttributeField("initialValues", event.target.value)} placeholder="Default, Small, Medium" disabled={isAttributeMutating} />{attributeErrors.initialValues ? <span className="s26-field-error">{attributeErrors.initialValues}</span> : null}</div> : <div className="s26-upload-guard"><strong>Attribute Values</strong><p>Value lifecycle is handled from Manage Values and remains deferred to the next adoption task.</p><Link className="s26-btn" to={`${basePath}/catalog/attributes/${encodeURIComponent(String(attributeEditing.id))}/values`}>Manage Values</Link></div>}
                {!attributeEditing ? <label className="s26-toggle-row" htmlFor="s26-attribute-published"><span>Published</span><input id="s26-attribute-published" type="checkbox" checked={attributeForm.published} onChange={(event) => setAttributeField("published", event.target.checked)} disabled={isAttributeMutating || !canManageAttributeStatus} /></label> : <div className="s26-toggle-row"><span>Published</span><span className="hint">Use the row status action.</span></div>}
                <div className="s26-upload-guard"><strong>Advanced Flags</strong><p>Required, filterable, sort order, delete, bulk, import, and export remain disabled until backend governance is reviewed.</p><button type="button" className="s26-btn" disabled>Advanced Controls</button></div>
              </div>
              {attributeMutationStatus.message ? <p className={attributeMutationStatus.type === "error" ? "s26-field-error" : "hint"} style={{ marginTop: 14 }}>{attributeMutationStatus.message}</p> : null}
              <div className="s26-filter-row" style={{ marginTop: 16, marginBottom: 0 }}>
                <button type="button" className="s26-btn" onClick={() => { setAttributeModalOpen(false); resetAttributeForm(null); }} disabled={isAttributeMutating}>Cancel</button>
                <button type="button" className="s26-btn primary" onClick={submitAttributeForm} disabled={!attributeFormValid || isAttributeMutating || (attributeEditing ? !canUpdateAttribute : !canCreateAttribute)}>{isAttributeMutating ? "Saving..." : attributeEditing ? "Update Attribute" : "Add Attribute"}</button>
              </div>
            </section>
          </div>
        ) : null}
        <div className="s26-grid two">
          <Card title="Values Boundary" hint="Manage Values links are canonical; value lifecycle mutations are deferred to Attribute Values task 10." />
          <Card title="Mutation Safety" hint="Create, update, and publish status are guarded. Delete, bulk, import, and export stay disabled." />
        </div>
      </Shell>
    );
  }

  if (isLive && catalogView === "attribute-values") {
    const valueRows = catalogData?.values || [];
    const summary = catalogData?.summary || {};
    const attribute = catalogData?.attribute;
    const canCreateAttributeValue = Boolean(catalogMutation?.canCreateAttributeValue);
    const canUpdateAttributeValue = Boolean(catalogMutation?.canUpdateAttributeValue);
    const attributeValueStatusTitle =
      catalogMutation?.attributeValueStatusDisabledReason ||
      "Publish controls are disabled until value status governance is reviewed.";
    const attributeValueDeleteTitle =
      catalogMutation?.attributeValueDeleteDisabledReason ||
      "Delete is disabled pending destructive review.";
    return (
      <Shell section="taxonomy" mode={mode} storeContext={storeContext}>
        {catalogState?.isError ? <Card title="Attribute values could not be loaded" hint="Store-scoped attribute values are temporarily unavailable." actions={<button type="button" className="s26-btn" onClick={catalogState?.refetch}>Try again</button>} /> : null}
        <Card
          title="Attribute Values"
          hint={attribute ? `${attribute.name} values are scoped to this seller store.` : "Manage store-scoped values for a canonical attribute."}
          actions={<button type="button" className="s26-btn primary" onClick={openAttributeValueCreate} disabled={!attribute || !canCreateAttributeValue || isAttributeValueMutating} title={!canCreateAttributeValue ? permissionTitle : undefined}>Add Value</button>}
        >
          <div data-seller2026-live-attribute-values="true" className="s26-grid five" style={{ marginBottom: 14 }}>
            <CatalogKpi label="Total" value={summary.total || 0} />
            <CatalogKpi label="Published" value={summary.published || 0} />
            <CatalogKpi label="Draft" value={summary.draft || 0} />
            <CatalogKpi label="Empty" value={summary.empty || 0} />
            <CatalogKpi label="Needs Attention" value={summary.needsAttention || 0} />
          </div>
          {!catalogState?.isLoading && !attribute ? <div className="s26-empty"><strong>Attribute was not found or is not available for this store.</strong><p>Make sure the attribute is still available for the active store.</p></div> : null}
          {attribute ? (
            <div className="s26-filter-row">
              <Link className="s26-btn" to={`${basePath}${attribute.canonicalAttributesHref || "/catalog/attributes"}`}>Back to Attributes</Link>
              <span className={statusClass(attribute.status === "active" ? "Published" : "Draft")}>{attribute.statusLabel || attribute.status}</span>
              <span className="s26-pill">{attribute.type}</span>
              <span className="s26-pill">{attribute.usageCount || 0} usage</span>
            </div>
          ) : null}
          <div className="s26-filter-row">
            <input className="s26-search" aria-label="Search attribute values" placeholder="Search values" value={searchValue} onChange={(event) => queryChange({ search: event.target.value, page: 1 })} />
            <select className="s26-control" aria-label="Filter value status" value={catalogQuery?.status || "all"} onChange={(event) => queryChange({ status: event.target.value, page: 1 })}><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
            <button type="button" className="s26-btn" disabled title={attributeValueBulkDisabledTitle}>Bulk Values</button>
          </div>
          {attributeValueMutationStatus.message ? <p className={attributeValueMutationStatus.type === "error" ? "s26-field-error" : "hint"}>{attributeValueMutationStatus.message}</p> : null}
          {catalogState?.isLoading ? <p className="hint">Loading attribute values...</p> : null}
          {!catalogState?.isLoading && attribute && valueRows.length === 0 ? <div className="s26-empty"><strong>No values yet</strong><p>Create values to use this attribute in products.</p></div> : null}
          {valueRows.length ? <DataTable columns={["Label", "Value", "Slug", "Color", "Products", "Status", "Last Updated", "Actions"]} rows={valueRows} renderRow={(row) => <tr key={row.id}><td><strong>{row.label}</strong><div className="s26-sub">{row.description || "No description available."}</div></td><td>{row.value || row.label}</td><td><span className="s26-sub">{row.slug}</span></td><td>{row.color || row.swatch ? <span className="s26-swatch" title={row.color || row.swatch} style={{ background: row.color || row.swatch, width: 26, height: 26 }} /> : "-"}</td><td>{row.productUsage || row.productsCount || 0}</td><td><span className={statusClass(row.statusLabel || (row.status === "active" ? "Published" : "Draft"))}>{row.statusLabel || row.status}</span></td><td>{row.updatedAt || "Recently"}</td><td><div className="s26-row-actions"><button type="button" className="s26-muted-action" disabled={!canUpdateAttributeValue || isAttributeValueMutating} title={canUpdateAttributeValue ? undefined : permissionTitle} onClick={() => openAttributeValueEdit(row)}>{catalogMutation?.updatingAttributeValueId === row.id ? "Saving..." : "Edit"}</button><button type="button" className="s26-muted-action" disabled title={attributeValueStatusTitle}>{row.isPublished ? "Unpublish" : "Publish"}</button><button type="button" className="s26-muted-action" disabled title={attributeValueDeleteTitle}>Delete</button></div></td></tr>} /> : null}
        </Card>
        {attributeValueModalOpen ? (
          <div className="s26-modal-backdrop" role="presentation">
            <section className="s26-modal" role="dialog" aria-modal="true" aria-labelledby="s26-attribute-value-modal-title">
              <div className="s26-card-head">
                <div>
                  <h3 id="s26-attribute-value-modal-title">{attributeValueEditing ? "Update Value" : "Add Value"}</h3>
                  <p className="hint">{attribute?.name || "Attribute"} value changes are saved to the existing seller API.</p>
                </div>
                <button type="button" className="s26-btn" onClick={() => { setAttributeValueModalOpen(false); resetAttributeValueForm(null); }} disabled={isAttributeValueMutating} aria-label="Close value modal">Close</button>
              </div>
              <div className="s26-form-grid">
                <div className="s26-field"><label htmlFor="s26-attribute-value-label">Label</label><input id="s26-attribute-value-label" value={attributeValueForm.label} onChange={(event) => setAttributeValueField("label", event.target.value)} placeholder="Value label" disabled={isAttributeValueMutating} />{attributeValueErrors.label ? <span className="s26-field-error">{attributeValueErrors.label}</span> : null}</div>
                <div className="s26-field"><label htmlFor="s26-attribute-value-value">Value</label><input id="s26-attribute-value-value" value={attributeValueForm.value} onChange={(event) => setAttributeValueField("value", event.target.value)} placeholder="Stored value" disabled={isAttributeValueMutating} />{attributeValueErrors.value ? <span className="s26-field-error">{attributeValueErrors.value}</span> : null}</div>
                <div className="s26-field s26-field-span-2"><label htmlFor="s26-attribute-value-description">Description</label><textarea id="s26-attribute-value-description" value={attributeValueForm.description} onChange={(event) => setAttributeValueField("description", event.target.value)} placeholder="Read-only until metadata API is available" disabled title={attributeValueMetadataDisabledTitle} />{attributeValueErrors.description ? <span className="s26-field-error">{attributeValueErrors.description}</span> : null}</div>
                <div className="s26-field"><label htmlFor="s26-attribute-value-color">Color</label><input id="s26-attribute-value-color" value={attributeValueForm.color} onChange={(event) => setAttributeValueField("color", event.target.value)} placeholder="#111827" disabled title={attributeValueMetadataDisabledTitle} /></div>
                <div className="s26-upload-guard"><strong>Value Image</strong><p>{attributeValueMediaDisabledTitle}</p><button type="button" className="s26-btn" disabled>Upload Image</button></div>
                <div className="s26-upload-guard"><strong>Status and Delete</strong><p>{attributeValueStatusTitle} Delete remains disabled because unused values may be hard-deleted.</p><button type="button" className="s26-btn" disabled>Advanced Lifecycle</button></div>
              </div>
              {attributeValueMutationStatus.message ? <p className={attributeValueMutationStatus.type === "error" ? "s26-field-error" : "hint"} style={{ marginTop: 14 }}>{attributeValueMutationStatus.message}</p> : null}
              <div className="s26-filter-row" style={{ marginTop: 16, marginBottom: 0 }}>
                <button type="button" className="s26-btn" onClick={() => { setAttributeValueModalOpen(false); resetAttributeValueForm(null); }} disabled={isAttributeValueMutating}>Cancel</button>
                <button type="button" className="s26-btn primary" onClick={submitAttributeValueForm} disabled={!attributeValueFormValid || isAttributeValueMutating || (attributeValueEditing ? !canUpdateAttributeValue : !canCreateAttributeValue)}>{isAttributeValueMutating ? "Saving..." : attributeValueEditing ? "Update Value" : "Add Value"}</button>
              </div>
            </section>
          </div>
        ) : null}
        <div className="s26-grid two">
          <Card title="Value Insights" hint="Top values by usage and mapping quality will appear when data is available." />
          <Card title="Mutation Safety" hint="Create and update use existing live APIs. Publish and delete stay disabled with explicit reasons." />
        </div>
      </Shell>
    );
  }

  if (isLive && catalogView === "coupons") {
    const couponRows = catalogData?.coupons || [];
    const summary = catalogData?.summary || {};
    const canCreateCoupon = Boolean(catalogMutation?.canCreate);
    const canUpdateCoupon = Boolean(catalogMutation?.canUpdate);
    const canManageCouponStatus = Boolean(catalogMutation?.canManageStatus);
    const canArchiveCoupon = Boolean(catalogMutation?.canDelete);
    const isCouponMutating =
      Boolean(catalogMutation?.creating) ||
      Boolean(catalogMutation?.updatingId) ||
      Boolean(catalogMutation?.statusChangingId) ||
      Boolean(catalogMutation?.deletingId);
    return (
      <Shell section="taxonomy" mode={mode} storeContext={storeContext}>
        {catalogState?.isError ? <Card title="Coupons could not be loaded" hint="Store-scoped coupons are temporarily unavailable." actions={<button type="button" className="s26-btn" onClick={catalogState?.refetch}>Try again</button>} /> : null}
        <Card title="Coupons" hint="Manage store promotions with live store-scoped coupon data." actions={<button type="button" className="s26-btn primary" onClick={openCouponCreate} disabled={!canCreateCoupon || isCouponMutating} title={canCreateCoupon ? undefined : actionTitle(seller2026Permissions, "COUPON_CREATE", "coupons")}>Add Coupon</button>}>
          <div data-seller2026-live-coupons="true" className="s26-grid five" style={{ marginBottom: 14 }}>
            <CatalogKpi label="Total" value={summary.total || 0} />
            <CatalogKpi label="Active" value={summary.active || 0} />
            <CatalogKpi label="Inactive" value={summary.inactive || 0} />
            <CatalogKpi label="Expired" value={summary.expired || 0} />
            <CatalogKpi label="Scheduled" value={summary.scheduled || 0} />
          </div>
          <div className="s26-filter-row">
            <input className="s26-search" aria-label="Search coupons" placeholder="Search coupon code" value={searchValue} onChange={(event) => queryChange({ search: event.target.value, page: 1 })} />
            <select className="s26-control" aria-label="Filter coupon status" value={catalogQuery?.status || "all"} onChange={(event) => queryChange({ status: event.target.value, page: 1 })}><option value="all">All Status</option><option value="active">Active</option><option value="expired">Expired</option><option value="paused">Paused</option><option value="scheduled">Scheduled</option><option value="inactive">Inactive</option></select>
            <select className="s26-control" aria-label="Filter coupon type" value={catalogQuery?.type || "all"} onChange={(event) => queryChange({ type: event.target.value, page: 1 })}><option value="all">All Types</option><option value="percentage">Percentage</option><option value="fixed">Fixed</option><option value="free_shipping">Free Shipping</option></select>
            <Link className="s26-btn" to={`${basePath}/catalog/products`}>View Products</Link>
            <button type="button" className="s26-btn" disabled title={couponBulkDisabledTitle}>Bulk Actions</button>
          </div>
          {catalogState?.isLoading ? <p className="hint">Loading coupons...</p> : null}
          {couponMutationStatus.message ? <p className={couponMutationStatus.type === "error" ? "s26-field-error" : "hint"}>{couponMutationStatus.message}</p> : null}
          {!catalogState?.isLoading && couponRows.length === 0 ? <div className="s26-empty"><strong>No coupons yet</strong><p>Create coupons to offer store promotions.</p></div> : null}
          {couponRows.length ? (
            <DataTable
              columns={["Code", "Title", "Discount", "Minimum Order", "Usage", "Status", "Validity", "Scope", "Last Updated", "Actions"]}
              rows={couponRows}
              renderRow={(row) => {
                const platformTitle = "Platform coupons cannot be managed from Seller Workspace.";
                const archiveTitle = !row.isStoreScoped
                  ? platformTitle
                  : canArchiveCoupon
                    ? "Archive deactivates this store coupon."
                    : "You do not have permission to archive coupons.";
                return (
                  <tr key={row.id}>
                    <td><strong>{row.code}</strong></td>
                    <td><strong>{row.title || row.name}</strong><div className="s26-sub">{row.description || "No description available."}</div></td>
                    <td>{row.discountLabel}</td>
                    <td>{formatRupiah(row.minimumOrderAmount ?? row.minimumSpend)}</td>
                    <td>{row.usageLabel}</td>
                    <td><span className={statusClass(row.status)}>{row.status}</span></td>
                    <td>{row.validityLabel}</td>
                    <td>{row.scopeLabel || "Store coupon"}</td>
                    <td>{row.updatedAt || "Recently"}</td>
                    <td>
                      <div className="s26-row-actions">
                        <button type="button" className="s26-muted-action" disabled={!canUpdateCoupon || !row.canEdit || isCouponMutating} title={!row.isStoreScoped ? platformTitle : canUpdateCoupon ? undefined : actionTitle(seller2026Permissions, "COUPON_UPDATE", "coupons")} onClick={() => openCouponEdit(row)}>{catalogMutation?.updatingId === row.id ? "Saving..." : "Edit"}</button>
                        <button type="button" className="s26-muted-action" disabled={!canManageCouponStatus || !row.canManageStatus || isCouponMutating} title={!row.isStoreScoped ? platformTitle : canManageCouponStatus ? undefined : actionTitle(seller2026Permissions, "COUPON_STATUS_MANAGE", "coupons")} onClick={() => runCouponStatusAction(() => catalogMutation?.changeCouponStatus({ couponId: row.id, active: !row.active }), row.active ? "Coupon deactivated." : "Coupon activated.")}>{catalogMutation?.statusChangingId === row.id ? "Saving..." : row.active ? "Deactivate" : "Activate"}</button>
                        <button type="button" className="s26-muted-action" disabled={!canArchiveCoupon || !row.canArchive || isCouponMutating || !row.active} title={archiveTitle} onClick={() => openCouponArchiveConfirm(row)}>{catalogMutation?.deletingId === row.id ? "Archiving..." : "Archive"}</button>
                        <button type="button" className="s26-muted-action" disabled title={couponDuplicateDisabledTitle}>Duplicate</button>
                      </div>
                    </td>
                  </tr>
                );
              }}
            />
          ) : null}
        </Card>
        {couponArchiveCandidate ? (
          <div className="s26-modal-backdrop" role="presentation">
            <section className="s26-modal" role="dialog" aria-modal="true" aria-labelledby="s26-coupon-archive-title">
              <div className="s26-card-head">
                <div>
                  <h3 id="s26-coupon-archive-title">Archive coupon?</h3>
                  <p className="hint">This will make the coupon unavailable for future checkout use. Existing order history will not be changed.</p>
                </div>
                <button type="button" className="s26-btn" onClick={closeCouponArchiveConfirm} disabled={isCouponMutating} aria-label="Close archive confirmation">Close</button>
              </div>
              <div className="s26-upload-guard">
                <strong>{couponArchiveCandidate.code || "Coupon"}</strong>
                <p>Archive keeps the record for audit history and sets the coupon inactive.</p>
              </div>
              <div className="s26-filter-row" style={{ marginTop: 16, marginBottom: 0 }}>
                <button type="button" className="s26-btn" onClick={closeCouponArchiveConfirm} disabled={isCouponMutating}>Cancel</button>
                <button type="button" className="s26-btn primary" onClick={confirmCouponArchive} disabled={isCouponMutating}>{isCouponMutating ? "Archiving..." : "Archive Coupon"}</button>
              </div>
            </section>
          </div>
        ) : null}
        {couponDrawerOpen ? (
          <Card title={couponEditing ? "Update Coupon" : "Add Coupon"} hint="Store scope is resolved from the active seller workspace.">
            <div className="s26-form-grid">
              <div className="s26-field"><label htmlFor="s26-coupon-code">Code</label><input id="s26-coupon-code" value={couponForm.code} onChange={(event) => setCouponField("code", event.target.value.toUpperCase())} placeholder="STORE2026" disabled={isCouponMutating} />{couponErrors.code ? <span className="s26-field-error">{couponErrors.code}</span> : null}</div>
              <div className="s26-field"><label htmlFor="s26-coupon-name">Title</label><input id="s26-coupon-name" value={couponForm.name} onChange={(event) => setCouponField("name", event.target.value)} placeholder="Store campaign" disabled={isCouponMutating} />{couponErrors.name ? <span className="s26-field-error">{couponErrors.name}</span> : null}</div>
              <div className="s26-field s26-field-span-2"><label htmlFor="s26-coupon-description">Description</label><textarea id="s26-coupon-description" value={couponForm.description} onChange={(event) => setCouponField("description", event.target.value)} placeholder="Read-only until metadata API is available" disabled title={couponMetadataDisabledTitle} />{couponErrors.description ? <span className="s26-field-error">{couponErrors.description}</span> : null}</div>
              <div className="s26-field"><label htmlFor="s26-coupon-type">Discount Type</label><select id="s26-coupon-type" value={couponForm.discountType} onChange={(event) => setCouponField("discountType", event.target.value)} disabled={isCouponMutating}><option value="percent">Percentage</option><option value="fixed">Fixed</option></select>{couponErrors.discountType ? <span className="s26-field-error">{couponErrors.discountType}</span> : null}</div>
              <div className="s26-field"><label htmlFor="s26-coupon-amount">Discount Value</label><input id="s26-coupon-amount" type="number" min="1" value={couponForm.amount} onChange={(event) => setCouponField("amount", event.target.value)} placeholder="10" disabled={isCouponMutating} />{couponErrors.amount ? <span className="s26-field-error">{couponErrors.amount}</span> : null}</div>
              <div className="s26-field"><label htmlFor="s26-coupon-min-spend">Minimum Order</label><input id="s26-coupon-min-spend" type="number" min="0" value={couponForm.minSpend} onChange={(event) => setCouponField("minSpend", event.target.value)} placeholder="100000" disabled={isCouponMutating} />{couponErrors.minSpend ? <span className="s26-field-error">{couponErrors.minSpend}</span> : null}</div>
              <div className="s26-field"><label htmlFor="s26-coupon-usage-limit">Usage Limit</label><input id="s26-coupon-usage-limit" type="number" min="0" value={couponForm.usageLimit} onChange={(event) => setCouponField("usageLimit", event.target.value)} placeholder="Read-only" disabled title={couponMetadataDisabledTitle} />{couponErrors.usageLimit ? <span className="s26-field-error">{couponErrors.usageLimit}</span> : null}</div>
              <div className="s26-field"><label htmlFor="s26-coupon-starts">Starts At</label><input id="s26-coupon-starts" type="datetime-local" value={couponForm.startsAt} onChange={(event) => setCouponField("startsAt", event.target.value)} disabled={isCouponMutating} /></div>
              <div className="s26-field"><label htmlFor="s26-coupon-ends">Expires At</label><input id="s26-coupon-ends" type="datetime-local" value={couponForm.expiresAt} onChange={(event) => setCouponField("expiresAt", event.target.value)} disabled={isCouponMutating} />{couponErrors.expiresAt ? <span className="s26-field-error">{couponErrors.expiresAt}</span> : null}</div>
              <label className="s26-toggle-row" htmlFor="s26-coupon-active"><span>Active</span><input id="s26-coupon-active" type="checkbox" checked={couponForm.active} onChange={(event) => setCouponField("active", event.target.checked)} disabled={isCouponMutating || !canManageCouponStatus} /></label>
              <div className="s26-upload-guard"><strong>Coupon Banner</strong><p>{couponBannerDisabledTitle}</p><button type="button" className="s26-btn" disabled>Upload Banner</button></div>
            </div>
            {couponMutationStatus.message ? <p className={couponMutationStatus.type === "error" ? "s26-field-error" : "hint"} style={{ marginTop: 14 }}>{couponMutationStatus.message}</p> : null}
            <div className="s26-filter-row" style={{ marginTop: 16, marginBottom: 0 }}><button type="button" className="s26-btn" onClick={() => { setCouponDrawerOpen(false); resetCouponForm(null); }} disabled={isCouponMutating}>Close</button><button type="button" className="s26-btn primary" disabled={!couponFormValid || isCouponMutating || (couponEditing ? !canUpdateCoupon : !canCreateCoupon)} title={couponEditing ? actionTitle(seller2026Permissions, "COUPON_UPDATE", "coupons") : actionTitle(seller2026Permissions, "COUPON_CREATE", "coupons")} onClick={submitCouponForm}>{isCouponMutating ? "Saving..." : couponEditing ? "Update Coupon" : "Add Coupon"}</button></div>
          </Card>
        ) : null}
      </Shell>
    );
  }

  return (
    <Shell section="taxonomy">
      <div className="s26-grid two">
        <Card title="Categories" hint="Category tree, product count, and assignment rate." actions={<button className="s26-btn primary">+ Add Category</button>}>
          <DataTable columns={["Category", "Products", "Assigned"]} rows={categories} renderRow={(row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td></tr>} />
          <MiniChart />
        </Card>
        <Card title="Attributes" hint="Variant/general attributes and usage count." actions={<button className="s26-btn primary">+ Add Attribute</button>}>
          <DataTable columns={["Attribute", "Type", "Usage", "Values", "Status"]} rows={attributes} renderRow={(row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td><span className={statusClass(row[4])}>{row[4]}</span></td></tr>} />
        </Card>
      </div>
      <div className="s26-grid two">
        <Card title="Attribute Values - Color" hint="Swatch, sort order, product mapping, and active state.">
          <DataTable columns={["Sort", "Value", "Swatch", "Usage", "Mapped SKU", "Status"]} rows={[[1, "Red", "#ef4444", 512, 642, "Active"], [2, "Navy Blue", "#1e3a8a", 389, 498, "Active"], [3, "Black", "#111827", 365, 472, "Active"], [4, "White", "#ffffff", 321, 412, "Active"], [5, "Beige", "#f5deb3", 298, 376, "Active"]]} renderRow={(row) => <tr key={row[1]}><td>{row[0]}</td><td>{row[1]}</td><td><span className="s26-swatch" style={{ background: row[2], width: 26, height: 26 }} /></td><td>{row[3]}</td><td>{row[4]}</td><td><span className={statusClass(row[5])}>{row[5]}</span></td></tr>} />
        </Card>
        <Card title="Coupons" hint="Store-scoped promo with create drawer and usage limits." actions={<button className="s26-btn primary">Create Coupon</button>}>
          <div className="s26-grid three" style={{ marginBottom: 14 }}>{[["Total Coupons", "48"], ["Active", "18"], ["Redemptions", "1.842"]].map(([a, b]) => <div className="s26-card soft" key={a}><p className="hint">{a}</p><strong>{b}</strong></div>)}</div>
          <DataTable columns={["Code", "Type", "Discount", "Usage", "Status"]} rows={coupons} renderRow={(row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[4]}</td><td><span className={statusClass(row[5])}>{row[5]}</span></td></tr>} />
        </Card>
      </div>
    </Shell>
  );
}

function OperationsPage({
  operationsView = "overview",
  operationsData = null,
  operationsState = null,
  operationsMutation = null,
  operationsQuery = null,
  onOperationsQueryChange = null,
  mode,
  storeContext,
  seller2026Permissions,
}) {
  const { storeSlug } = useParams();
  const isLive = Boolean(operationsData || operationsState);
  const basePath = storeSlug ? `/seller/stores/${encodeURIComponent(storeSlug)}` : "/seller-2026";
  const queryChange = (next) => onOperationsQueryChange?.(next);
  const searchValue = operationsQuery?.search || "";
  const [fulfillmentStatus, setFulfillmentStatus] = useState({ type: "idle", message: "" });
  const [trackingForm, setTrackingForm] = useState({
    trackingNumber: "",
    courierCode: "",
    courierService: "",
  });
  const [paymentReviewForm, setPaymentReviewForm] = useState({
    note: "",
    reason: "",
  });
  const [paymentReviewStatus, setPaymentReviewStatus] = useState({ type: "idle", message: "" });
  const [paymentProfileFormOpen, setPaymentProfileFormOpen] = useState(false);
  const [paymentProfileFormTouched, setPaymentProfileFormTouched] = useState(false);
  const [paymentProfileForm, setPaymentProfileForm] = useState({
    accountName: "",
    merchantName: "",
    merchantId: "",
    qrisImageUrl: "",
    qrisPayload: "",
    instructionText: "",
    sellerNote: "",
  });
  const [paymentProfileStatus, setPaymentProfileStatus] = useState({ type: "idle", message: "" });
  const canFulfillOrders = Boolean(operationsMutation?.canFulfill);
  const isFulfillmentPending = Boolean(operationsMutation?.updatingStatusId);
  const canReviewPayments = Boolean(operationsMutation?.canReview);
  const isPaymentReviewPending = Boolean(operationsMutation?.approvingId || operationsMutation?.rejectingId || operationsMutation?.isMutating);
  const canSubmitPaymentProfile = Boolean(operationsMutation?.canSubmitPaymentProfile);
  const isPaymentProfileSubmitting = Boolean(operationsMutation?.submittingPaymentProfile);
  useEffect(() => {
    if (operationsView !== "payment-profile" || paymentProfileFormTouched) return;
    const draft = operationsData?.requestDraft || {};
    setPaymentProfileForm({
      accountName: draft.accountName || "",
      merchantName: draft.merchantName || "",
      merchantId: draft.merchantId || "",
      qrisImageUrl: draft.qrisImageUrl || "",
      qrisPayload: draft.qrisPayload || "",
      instructionText: draft.instructionText || "",
      sellerNote: draft.sellerNote || "",
    });
  }, [operationsView, operationsData?.requestDraft, paymentProfileFormTouched]);
  const fulfillmentActionTitle = canFulfillOrders
    ? undefined
    : actionTitle(seller2026Permissions, "ORDER_FULFILLMENT_UPDATE", "orders");
  const runFulfillmentAction = async (suborderId, action, extraPayload = {}) => {
    if (!suborderId || !action?.code || !operationsMutation?.updateFulfillmentStatus || isFulfillmentPending) return;
    setFulfillmentStatus({ type: "idle", message: "" });
    try {
      await operationsMutation.updateFulfillmentStatus({
        suborderId,
        payload: {
          action: action.code,
          ...extraPayload,
        },
      });
      setFulfillmentStatus({ type: "success", message: `${action.label || "Fulfillment status"} updated.` });
      setTrackingForm({ trackingNumber: "", courierCode: "", courierService: "" });
      operationsState?.refetch?.();
    } catch (error) {
      setFulfillmentStatus({
        type: "error",
        message: error?.message || "Fulfillment update failed.",
      });
    }
  };
  const firstEnabledAction = (actions = []) => actions.find((action) => action?.enabled !== false) || null;
  const allowedSellerOrderAction = (actions = []) =>
    actions.find(
      (action) =>
        (action?.code === "MARK_PROCESSING" ||
          action?.code === "MARK_SHIPPED" ||
          action?.code === "MARK_DELIVERED") &&
        action?.enabled !== false
    ) || null;
  const runPaymentReviewAction = async (selectedPayment, action) => {
    if (!selectedPayment?.id || isPaymentReviewPending) return;
    const selectedCanReview = Boolean(canReviewPayments && selectedPayment.canReview);
    if (!selectedCanReview) {
      setPaymentReviewStatus({
        type: "error",
        message: selectedPayment.reviewReason || operationsData?.governance?.note || "Payment is not eligible for seller review.",
      });
      return;
    }
    if (action === "REJECT" && !paymentReviewForm.reason.trim()) {
      setPaymentReviewStatus({ type: "error", message: "Reason is required before rejecting a payment." });
      return;
    }
    setPaymentReviewStatus({ type: "idle", message: "" });
    try {
      if (action === "APPROVE") {
        await operationsMutation?.approvePayment?.({
          paymentId: selectedPayment.id,
          payload: { note: paymentReviewForm.note },
        });
        setPaymentReviewStatus({ type: "success", message: "Payment approved." });
      } else if (action === "REJECT") {
        await operationsMutation?.rejectPayment?.({
          paymentId: selectedPayment.id,
          payload: { reason: paymentReviewForm.reason, note: paymentReviewForm.reason },
        });
        setPaymentReviewStatus({ type: "success", message: "Payment rejected." });
      }
      setPaymentReviewForm({ note: "", reason: "" });
      operationsState?.refetch?.();
    } catch (error) {
      setPaymentReviewStatus({
        type: "error",
        message: error?.message || "Payment review mutation failed.",
      });
    }
  };
  const setPaymentProfileField = (field, value) => {
    setPaymentProfileFormTouched(true);
    setPaymentProfileForm((current) => ({ ...current, [field]: value }));
  };
  const paymentProfileFormValid =
    paymentProfileForm.accountName.trim() &&
    paymentProfileForm.merchantName.trim() &&
    paymentProfileForm.qrisImageUrl.trim();
  const submitPaymentProfileRequest = async () => {
    if (!operationsMutation?.submitPaymentProfileRequest || isPaymentProfileSubmitting) return;
    setPaymentProfileStatus({ type: "idle", message: "" });
    try {
      await operationsMutation.submitPaymentProfileRequest(paymentProfileForm);
      setPaymentProfileStatus({
        type: "success",
        message: "Payment profile request submitted for admin review.",
      });
      setPaymentProfileFormOpen(false);
      setPaymentProfileFormTouched(false);
      operationsState?.refetch?.();
    } catch (error) {
      setPaymentProfileStatus({
        type: "error",
        message: error?.message || "Payment profile request failed.",
      });
    }
  };

  if (isLive && operationsView === "orders") {
    const rows = operationsData?.suborders || [];
    const summary = operationsData?.summary || {};
    const pagination = operationsData?.pagination || { page: 1, totalPages: 0, total: 0 };
    const tabs = [
      ["all", `All Orders ${summary.total || 0}`],
      ["unpaid", `Unpaid ${summary.unpaid || 0}`],
      ["pending_confirmation", `Pending Confirmation ${summary.pendingConfirmation || 0}`],
      ["processing", `Processing ${summary.processing || 0}`],
      ["shipped", `Shipped ${summary.shipped || 0}`],
      ["delivered", `Delivered ${summary.delivered || 0}`],
    ];

    return (
      <Shell section="operations" mode={mode} storeContext={storeContext}>
        {operationsState?.isError ? <Card title="Orders unavailable" hint="Live orders could not load." actions={<button type="button" className="s26-btn" onClick={operationsState?.refetch}>Retry</button>} /> : null}
        <div data-seller2026-live-orders="true" className="s26-grid six" style={{ marginBottom: 14 }}>
          <CatalogKpi label="Total orders" value={summary.total || 0} />
          <CatalogKpi label="Pending" value={summary.paymentPending || summary.pending || 0} />
          <CatalogKpi label="Processing" value={summary.processing || 0} />
          <CatalogKpi label="Shipped" value={summary.shipped || 0} />
          <CatalogKpi label="Delivered" value={summary.delivered || 0} />
          <CatalogKpi label="Needs attention" value={summary.needsAttention || 0} />
        </div>
        <Card title="Orders" hint="Live store-owned suborders with read-only payment status and guarded fulfillment actions." actions={<button type="button" className="s26-btn" disabled title="Export is disabled pending operations review.">Export</button>}>
          <div className="s26-tabs">{tabs.map(([value, label]) => <button type="button" className={`s26-tab ${(operationsQuery?.status || "all") === value ? "active" : ""}`} key={value} onClick={() => queryChange({ status: value, page: 1 })}>{label}</button>)}</div>
          <div className="s26-filter-row">
            <input className="s26-search" aria-label="Search order, customer, suborder, or invoice" placeholder="Search order, customer, suborder, or invoice" value={searchValue} onChange={(event) => queryChange({ search: event.target.value, page: 1 })} />
            <select className="s26-control" aria-label="Filter fulfillment status" value={operationsQuery?.fulfillmentStatus || "all"} onChange={(event) => queryChange({ fulfillmentStatus: event.target.value, status: "all", page: 1 })}><option value="all">All fulfillment</option><option value="UNFULFILLED">Pending</option><option value="PROCESSING">Processing</option><option value="SHIPPED">Shipped</option><option value="DELIVERED">Delivered</option><option value="CANCELLED">Cancelled</option></select>
            <select className="s26-control" aria-label="Filter payment status" value={operationsQuery?.paymentStatus || "all"} onChange={(event) => queryChange({ paymentStatus: event.target.value, status: "all", page: 1 })}><option value="all">All payment</option><option value="UNPAID">Unpaid</option><option value="PENDING_CONFIRMATION">Pending confirmation</option><option value="PAID">Paid</option><option value="FAILED">Failed</option><option value="EXPIRED">Expired</option><option value="CANCELLED">Cancelled</option></select>
            <input className="s26-control" type="date" aria-label="Date from" value={operationsQuery?.dateFrom || ""} onChange={(event) => queryChange({ dateFrom: event.target.value, page: 1 })} />
            <input className="s26-control" type="date" aria-label="Date to" value={operationsQuery?.dateTo || ""} onChange={(event) => queryChange({ dateTo: event.target.value, page: 1 })} />
            <button type="button" className="s26-btn" disabled title={disabledTodoTitle}>More Filters</button>
          </div>
          {operationsState?.isLoading ? <p className="hint">Loading orders...</p> : null}
          {fulfillmentStatus.message ? <p className={fulfillmentStatus.type === "error" ? "s26-field-error" : "hint"}>{fulfillmentStatus.message}</p> : null}
          {!operationsState?.isLoading && rows.length === 0 ? <div className="s26-empty"><strong>No orders are available for this store yet.</strong><p>Store-scoped orders will appear after checkout succeeds.</p></div> : null}
          {rows.length ? <DataTable columns={["Date", "Order", "Customer", "Items", "Total", "Payment", "Fulfillment", "Actions"]} rows={rows} renderRow={(row) => {
            const action = allowedSellerOrderAction(row.fulfillmentActions);
            return <tr key={row.id}><td>{row.orderDate || "Recently"}</td><td><strong>{row.orderNumber || row.invoiceNo}</strong><div className="s26-sub">{row.suborderNo}</div></td><td>{row.customerName}<div className="s26-sub">{row.customerEmail || row.customerPhone || "-"}</div></td><td>{row.itemsCount || 0}</td><td>{formatRupiah(row.totalAmount || row.total)}</td><td><span className={statusClass(row.paymentStatus)}>{row.paymentStatus || "Needs review"}</span><div className="s26-sub">Read-only</div></td><td><span className={statusClass(row.fulfillmentStatus || row.status)}>{row.fulfillmentStatus || row.status}</span></td><td><div className="s26-row-actions"><Link className="s26-link" to={`${basePath}/orders/${encodeURIComponent(String(row.suborderId || row.id))}`}>View detail</Link>{action ? <button type="button" className="s26-muted-action" disabled={!canFulfillOrders || isFulfillmentPending} title={fulfillmentActionTitle} onClick={() => runFulfillmentAction(row.suborderId || row.id, action)}>{isFulfillmentPending ? "Updating..." : action.label}</button> : <span className="hint">No action</span>}</div></td></tr>;
          }} /> : null}
          <div className="s26-pagination">
            <span>Page {pagination.page} of {pagination.totalPages} - {pagination.total} suborders</span>
            <div className="s26-filter-row" style={{ marginBottom: 0 }}>
              <button type="button" className="s26-btn" disabled={pagination.page <= 1} onClick={() => queryChange({ page: pagination.page - 1 })}>Previous</button>
              <button type="button" className="s26-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => queryChange({ page: pagination.page + 1 })}>Next</button>
            </div>
          </div>
        </Card>
      </Shell>
    );
  }

  if (isLive && operationsView === "suborder-detail") {
    const detail = operationsData;
    const detailActions = detail?.suborder?.fulfillmentActions || [];
    const packAction = detailActions.find((action) => action.code === "MARK_PROCESSING");
    const shipAction = detailActions.find((action) => action.code === "MARK_SHIPPED");
    const deliverAction = detailActions.find((action) => action.code === "MARK_DELIVERED");
    return (
      <Shell section="operations" mode={mode} storeContext={storeContext}>
        {operationsState?.isError ? <Card title="Suborder unavailable" hint="Suborder was not found or is not available for this store." actions={<button type="button" className="s26-btn" onClick={operationsState?.refetch}>Retry</button>} /> : null}
        <Card title="Order Details" hint="Store-scoped order detail with read-only payment state." actions={<Link className="s26-btn" to={`${basePath}/orders`}>Back to Orders</Link>}>
          {operationsState?.isLoading ? <p className="hint">Loading suborder...</p> : null}
          {!operationsState?.isLoading && !detail?.suborder ? <div className="s26-empty"><strong>Order details could not be loaded</strong><p>Make sure the suborder is still within the active store scope.</p></div> : null}
          {detail?.suborder ? (
            <div data-seller2026-live-order-detail="true">
              <h3>{detail.suborder.orderNumber || detail.suborder.suborderNo} <span className={statusClass(detail.suborder.status)}>{detail.suborder.status}</span></h3>
              <p className="hint">Invoice {detail.suborder.invoiceNo} - {detail.suborder.orderDate || "-"} - {detail.suborder.channel || "Store"}</p>
              <div className="s26-grid three" style={{ marginTop: 16 }}>
                <div className="s26-card soft"><h3>Customer & Shipping</h3><p className="hint">{detail.customer?.name || "Customer"}<br />{detail.customer?.phone || "-"}<br />{detail.customer?.address || "-"}</p>{detail.customer?.note ? <p className="hint">Note: {detail.customer.note}</p> : null}</div>
                <div className="s26-card soft"><h3>Shipping</h3><p className="hint">{detail.shipping?.method || "Not assigned"}<br />Tracking: {detail.shipping?.trackingNo || "No tracking number yet."}<br />Courier: {detail.shipping?.courier || "-"}</p></div>
                <div className="s26-card soft"><h3>Payment</h3><p className="hint">Status: {detail.payment?.status || detail.suborder.paymentStatus}<br />Method: {detail.payment?.method || "-"}<br />Proof: {detail.payment?.proof || "No payment proof available."}</p><strong>Read-only</strong></div>
                <div className="s26-card soft"><h3>Cost Summary</h3><p className="hint">Subtotal {formatRupiah(detail.totals.subtotal)}<br />Shipping {formatRupiah(detail.totals.shippingFee)}<br />Service {formatRupiah(detail.totals.serviceFee)}<br />Discount {formatRupiah(detail.totals.discount)}</p><strong>{formatRupiah(detail.totals.total)}</strong></div>
              </div>
              <div style={{ marginTop: 16 }}><DataTable columns={["Product", "Variant", "Qty", "Price", "Subtotal"]} rows={detail.items} renderRow={(row) => <tr key={row.id}><td>{row.productName}</td><td>{row.variantLabel || "-"}</td><td>{row.quantity}</td><td>{formatRupiah(row.price)}</td><td>{formatRupiah(row.subtotal)}</td></tr>} /></div>
              {fulfillmentStatus.message ? <p className={fulfillmentStatus.type === "error" ? "s26-field-error" : "hint"} style={{ marginTop: 14 }}>{fulfillmentStatus.message}</p> : null}
              <div className="s26-card soft" style={{ marginTop: 16 }}>
                <h3>Fulfillment Status</h3>
                <p className="hint">Payment status stays read-only. Seller actions only update this store-scoped suborder fulfillment state.</p>
                <div className="s26-form-grid">
                  <div className="s26-field"><label htmlFor="s26-tracking-number">Tracking Number</label><input id="s26-tracking-number" value={trackingForm.trackingNumber} onChange={(event) => setTrackingForm((current) => ({ ...current, trackingNumber: event.target.value }))} placeholder="RESI-123456" disabled title="Tracking update is unavailable until shipping persistence is validated." /></div>
                  <div className="s26-field"><label htmlFor="s26-courier-code">Shipping Provider</label><input id="s26-courier-code" value={trackingForm.courierCode} onChange={(event) => setTrackingForm((current) => ({ ...current, courierCode: event.target.value.toUpperCase() }))} placeholder="JNE" disabled title="Tracking update is unavailable until shipping persistence is validated." /></div>
                  <div className="s26-field"><label htmlFor="s26-courier-service">Courier Service</label><input id="s26-courier-service" value={trackingForm.courierService} onChange={(event) => setTrackingForm((current) => ({ ...current, courierService: event.target.value }))} placeholder="REG" disabled title="Tracking update is unavailable until shipping persistence is validated." /></div>
                </div>
              </div>
              <div className="s26-filter-row" style={{ marginTop: 16 }}><button type="button" className="s26-btn primary" disabled={!packAction || !canFulfillOrders || isFulfillmentPending} title={packAction ? fulfillmentActionTitle : "Packing is not available for this status."} onClick={() => runFulfillmentAction(detail.suborder.id, packAction)}>{isFulfillmentPending ? "Updating..." : "Mark as Packed"}</button><button type="button" className="s26-btn" disabled title="Print receipt/label endpoint needs backend review.">Print Receipt</button><button type="button" className="s26-btn primary" disabled={!shipAction || !canFulfillOrders || isFulfillmentPending} title={shipAction ? fulfillmentActionTitle : "Mark shipped is not available for this status."} onClick={() => runFulfillmentAction(detail.suborder.id, shipAction)}>{isFulfillmentPending ? "Updating..." : "Mark as Shipped"}</button><button type="button" className="s26-btn primary" disabled={!deliverAction || !canFulfillOrders || isFulfillmentPending} title={deliverAction ? fulfillmentActionTitle : "Mark delivered is not available for this status."} onClick={() => runFulfillmentAction(detail.suborder.id, deliverAction)}>{isFulfillmentPending ? "Updating..." : "Mark Delivered"}</button></div>
            </div>
          ) : null}
        </Card>
        {detail?.suborder ? <div className="s26-grid two"><Card title="Shipment Timeline" hint={detail.timeline.length ? detail.timeline.map((item) => item.label).join(" / ") : "No shipment timeline yet."} /><Card title="Internal Notes" hint="Save internal note integration is pending." /></div> : null}
      </Shell>
    );
  }

  if (isLive && operationsView === "payment-review") {
    const rows = operationsData?.payments || [];
    const selected = operationsData?.selectedPayment || null;
    const selectedCanReview = Boolean(canReviewPayments && selected?.canReview);
    const paymentActionTitle = selectedCanReview
      ? undefined
      : selected?.reviewReason || operationsData?.governance?.note || actionTitle(seller2026Permissions, "PAYMENT_REVIEW_READ", "payments");
    return (
      <Shell section="operations" mode={mode} storeContext={storeContext}>
        {operationsState?.isError ? <Card title="Payment review unavailable" hint="Live payment review data could not load." actions={<button type="button" className="s26-btn" onClick={operationsState?.refetch}>Retry</button>} /> : null}
        <div data-seller2026-live-payment-review="true" className="s26-grid two">
          <Card title="Payment Review" hint="Proof, customer reference, amount, and review status." actions={<button type="button" className="s26-btn" disabled title={actionTitle(seller2026Permissions, "PAYMENT_REVIEW_READ", "payments")}>Export</button>}>
            <div className="s26-grid four" style={{ marginBottom: 14 }}>
              <CatalogKpi label="Pending" value={operationsData?.summary?.totalPending || 0} />
              <CatalogKpi label="Amount" value={formatRupiah(operationsData?.summary?.totalAmount || 0)} />
              <CatalogKpi label="Approved" value={operationsData?.summary?.approvedToday || 0} />
              <CatalogKpi label="Rejected" value={operationsData?.summary?.rejectedToday || 0} />
            </div>
            <div className="s26-filter-row"><input className="s26-search" aria-label="Search payments" placeholder="Search payment, invoice, customer" value={searchValue} onChange={(event) => queryChange({ search: event.target.value, page: 1 })} /><select className="s26-control" aria-label="Filter payment status" value={operationsQuery?.status || "all"} onChange={(event) => queryChange({ status: event.target.value, page: 1 })}><option value="all">Pending Confirmation</option><option value="PAID">Paid</option><option value="REJECTED">Rejected</option><option value="UNPAID">Unpaid</option></select></div>
            {operationsState?.isLoading ? <p className="hint">Loading payment review...</p> : null}
            {paymentReviewStatus.message ? <p className={paymentReviewStatus.type === "error" ? "s26-field-error" : "hint"}>{paymentReviewStatus.message}</p> : null}
            {!operationsState?.isLoading && rows.length === 0 ? <div className="s26-empty"><strong>No payments need review.</strong><p>Payment proof appears when a pending payment is available.</p></div> : null}
            {rows.length ? <DataTable columns={["Payment", "Invoice", "Customer", "Amount", "Method", "Status", "Risk"]} rows={rows} renderRow={(row) => <tr key={row.id}><td><strong>{row.paymentNo}</strong><div className="s26-sub">{row.receivedAt || "-"}</div></td><td>{row.invoiceNo || "-"}</td><td>{row.customerName || "-"}</td><td>{formatRupiah(row.amount)}</td><td>{row.method || "-"}</td><td><span className={statusClass(row.status)}>{row.status}</span></td><td>{row.riskLabel || "unknown"}</td></tr>} /> : null}
          </Card>
          <Card title="Selected Payment Detail" hint="Transaction breakdown, proof preview, verification checklist, and seller review decision." actions={<><button type="button" className="s26-btn success" disabled={!selectedCanReview || isPaymentReviewPending} title={paymentActionTitle} onClick={() => runPaymentReviewAction(selected, "APPROVE")}>{operationsMutation?.approvingId === selected?.id ? "Approving..." : "Approve Payment"}</button><button type="button" className="s26-btn danger" disabled={!selectedCanReview || isPaymentReviewPending || !paymentReviewForm.reason.trim()} title={!paymentReviewForm.reason.trim() ? "Reason is required before rejecting a payment." : paymentActionTitle} onClick={() => runPaymentReviewAction(selected, "REJECT")}>{operationsMutation?.rejectingId === selected?.id ? "Rejecting..." : "Reject Payment"}</button><button type="button" className="s26-btn" disabled title="No seller request-clarification endpoint is available yet.">Request Clarification</button></>}>
            {selected ? (
              <div data-seller2026-live-order-detail="true">
                <div className="s26-card soft"><h3>Review Proof</h3>{selected.proofUrl ? <img className="s26-logo-preview" src={selected.proofUrl} alt="" /> : <p className="hint">No payment proof image available.</p>}{selected.buyerNote ? <p className="hint">Buyer Note: {selected.buyerNote}</p> : null}{selected.reviewReason && !selected.canReview ? <p className="hint">{selected.reviewReason}</p> : null}</div>
                <div className="s26-checklist">{selected.breakdown.map((item) => <div className="s26-check-row" key={item.label}><span>{item.label}</span><strong>{typeof item.value === "number" ? formatRupiah(item.value) : item.value}</strong></div>)}</div>
                <div className="s26-checklist" aria-label="Verification Checklist">{selected.riskChecks.map((item) => <div className="s26-check-row" key={item.label}><span>{item.label}</span><span className={statusClass(item.status)}>{item.status}</span></div>)}</div>
                <div className="s26-form-grid" style={{ marginTop: 14 }}>
                  <div className="s26-field"><label htmlFor="s26-payment-reviewer-note">Reviewer Note</label><textarea id="s26-payment-reviewer-note" value={paymentReviewForm.note} maxLength={2000} onChange={(event) => setPaymentReviewForm((current) => ({ ...current, note: event.target.value }))} placeholder="Optional note for approved proof." disabled={!selectedCanReview || isPaymentReviewPending} /></div>
                  <div className="s26-field"><label htmlFor="s26-payment-reject-reason">Reason</label><textarea id="s26-payment-reject-reason" value={paymentReviewForm.reason} maxLength={2000} onChange={(event) => setPaymentReviewForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Required before rejecting payment proof." disabled={!selectedCanReview || isPaymentReviewPending} />{!paymentReviewForm.reason.trim() ? <span className="hint">Reason is required for Reject Payment.</span> : null}</div>
                </div>
                <p className="hint" style={{ marginTop: 12 }}>{operationsData?.governance?.note || "Seller review updates only this store-scoped payment proof. Order payment status remains read-only from the order page."}</p>
              </div>
            ) : <div className="s26-empty"><strong>No payment selected.</strong><p>Payment detail appears after pending payment data is available.</p></div>}
          </Card>
        </div>
      </Shell>
    );
  }

  if (isLive && operationsView === "payment-profile") {
    const profile = operationsData;
    const profileActionTitle = canSubmitPaymentProfile
      ? undefined
      : profile?.governance?.isReviewLocked
        ? "The latest payment profile request is already under admin review."
        : actionTitle(seller2026Permissions, "STORE_PAYMENT_PROFILE_SUBMIT", "payments");
    return (
      <Shell section="operations" mode={mode} storeContext={storeContext}>
        {operationsState?.isError ? <Card title="Payment profile unavailable" hint="Live payment profile could not load." actions={<button type="button" className="s26-btn" onClick={operationsState?.refetch}>Retry</button>} /> : null}
        <Card title="Payment Profile" hint="QRIS destination, request status, verification documents, and admin review timeline." actions={<button type="button" className="s26-btn primary" disabled={!canSubmitPaymentProfile || isPaymentProfileSubmitting} title={profileActionTitle} onClick={() => { setPaymentProfileFormOpen(true); setPaymentProfileStatus({ type: "idle", message: "" }); }}>Submit / Update Profile</button>}>
          <div className="s26-grid four" style={{ marginBottom: 14 }}>
            <CatalogKpi label="Status" value={profile?.status || "INACTIVE"} />
            <CatalogKpi label="Request" value={profile?.requestStatus?.label || "No request"} />
            <CatalogKpi label="Available Balance" value={formatRupiah(profile?.balances?.available || 0)} />
            <CatalogKpi label="Hold Balance" value={formatRupiah(profile?.balances?.hold || 0)} />
          </div>
          {operationsState?.isLoading ? <p className="hint">Loading payment profile...</p> : null}
          {paymentProfileStatus.message ? <p className={paymentProfileStatus.type === "error" ? "s26-field-error" : "hint"}>{paymentProfileStatus.message}</p> : null}
          <div className="s26-grid three">
            {(profile?.methods || []).length ? profile.methods.map((method) => <div className="s26-card soft" key={`${method.type}-${method.label}`}><h3>{method.label}</h3><p className="hint">{method.type}<br />{method.accountName || method.accountNoMasked || "No account detail"}</p><span className={statusClass(method.status)}>{method.status}</span></div>) : <div className="s26-empty"><strong>No payment method configured.</strong><p>QRIS or bank transfer details will appear after setup.</p></div>}
            <div className="s26-card soft"><h3>Payout Account</h3>{profile?.payoutAccount ? <p className="hint">{profile.payoutAccount.bankName}<br />{profile.payoutAccount.accountNoMasked}<br />{profile.payoutAccount.accountName}</p> : <p className="hint">No payout account configured.</p>}<span className={statusClass(profile?.payoutAccount?.status || "UNKNOWN")}>{profile?.payoutAccount?.status || "UNKNOWN"}</span></div>
            <div className="s26-card soft"><h3>Request Governance</h3><p className="hint">{profile?.requestStatus?.description || profile?.governance?.note || "Seller changes are submitted as admin-reviewed requests."}</p><span className={statusClass(profile?.requestStatus?.code || "UNKNOWN")}>{profile?.requestStatus?.code || "UNKNOWN"}</span></div>
          </div>
          {paymentProfileFormOpen ? (
            <div className="s26-card soft" style={{ marginTop: 16 }}>
              <h3>Payment Profile Request</h3>
              <p className="hint">Seller requests do not approve, activate, deactivate, or execute payouts. Admin remains the final reviewer.</p>
              <div className="s26-form-grid">
                <div className="s26-field"><label htmlFor="s26-payment-account-name">Account Owner Name</label><input id="s26-payment-account-name" value={paymentProfileForm.accountName} onChange={(event) => setPaymentProfileField("accountName", event.target.value)} disabled={isPaymentProfileSubmitting} />{!paymentProfileForm.accountName.trim() ? <span className="s26-field-error">Account owner name is required.</span> : null}</div>
                <div className="s26-field"><label htmlFor="s26-payment-merchant-name">Merchant Name</label><input id="s26-payment-merchant-name" value={paymentProfileForm.merchantName} onChange={(event) => setPaymentProfileField("merchantName", event.target.value)} disabled={isPaymentProfileSubmitting} />{!paymentProfileForm.merchantName.trim() ? <span className="s26-field-error">Merchant name is required.</span> : null}</div>
                <div className="s26-field"><label htmlFor="s26-payment-merchant-id">QRIS Identifier</label><input id="s26-payment-merchant-id" value={paymentProfileForm.merchantId} onChange={(event) => setPaymentProfileField("merchantId", event.target.value)} disabled={isPaymentProfileSubmitting} /></div>
                <div className="s26-field"><label htmlFor="s26-payment-qris-image">QRIS Image URL</label><input id="s26-payment-qris-image" value={paymentProfileForm.qrisImageUrl} onChange={(event) => setPaymentProfileField("qrisImageUrl", event.target.value)} disabled={isPaymentProfileSubmitting} />{!paymentProfileForm.qrisImageUrl.trim() ? <span className="s26-field-error">QRIS image URL is required.</span> : null}</div>
                <div className="s26-field"><label htmlFor="s26-payment-qris-payload">QRIS Payload</label><textarea id="s26-payment-qris-payload" value={paymentProfileForm.qrisPayload} onChange={(event) => setPaymentProfileField("qrisPayload", event.target.value)} disabled={isPaymentProfileSubmitting} /></div>
                <div className="s26-field"><label htmlFor="s26-payment-instruction">Payment Instructions</label><textarea id="s26-payment-instruction" value={paymentProfileForm.instructionText} onChange={(event) => setPaymentProfileField("instructionText", event.target.value)} disabled={isPaymentProfileSubmitting} /></div>
                <div className="s26-field"><label htmlFor="s26-payment-seller-note">Seller Note</label><textarea id="s26-payment-seller-note" value={paymentProfileForm.sellerNote} maxLength={4000} onChange={(event) => setPaymentProfileField("sellerNote", event.target.value)} disabled={isPaymentProfileSubmitting} /></div>
                <div className="s26-card soft"><h3>Documents Upload</h3><p className="hint">Document upload is disabled until a dedicated seller payment-profile document endpoint is confirmed.</p><button type="button" className="s26-btn" disabled title="Payment profile document upload endpoint needs backend review.">Upload Documents</button></div>
              </div>
              <div className="s26-filter-row" style={{ marginTop: 16, marginBottom: 0 }}><button type="button" className="s26-btn" disabled={isPaymentProfileSubmitting} onClick={() => setPaymentProfileFormOpen(false)}>Close</button><button type="button" className="s26-btn primary" disabled={!paymentProfileFormValid || !canSubmitPaymentProfile || isPaymentProfileSubmitting} title={profileActionTitle} onClick={submitPaymentProfileRequest}>{isPaymentProfileSubmitting ? "Submitting..." : "Submit Request"}</button></div>
            </div>
          ) : null}
        </Card>
        <div className="s26-grid two">
          <Card title="Documents & Verification" hint="KTP/NIK, NPWP, bank or QRIS documents.">{(profile?.documents || []).length ? <div className="s26-checklist">{profile.documents.map((item) => <div className="s26-check-row" key={item.label}><span>{item.label}</span><span className={statusClass(item.status)}>{item.status}</span></div>)}</div> : <div className="s26-empty"><strong>No documents available.</strong><p>Verification documents are not configured yet.</p></div>}</Card>
          <Card title="Verification Timeline" hint={(profile?.timeline || []).length ? profile.timeline.map((item) => item.label).join(" / ") : "No verification timeline yet."} />
        </div>
      </Shell>
    );
  }

  return (
    <Shell section="operations">
      <div className="s26-grid operations">
        <Card title="All Orders / Fulfillment Queue" hint="Status operational per suborder dan channel." actions={<button className="s26-btn">Export</button>}>
          <div className="s26-tabs">{["All Orders 1.248", "Unpaid 82", "Pending 156", "Processing 210", "Shipped 624", "Delivered 1.234"].map((tab, idx) => <button className={`s26-tab ${idx === 0 ? "active" : ""}`} key={tab}>{tab}</button>)}</div>
          <DataTable columns={["Date", "Invoice / Suborder", "Customer", "Channel", "Shipping", "Total", "Status"]} rows={orders} renderRow={(row) => <tr key={row.suborder}><td>{row.date}</td><td><strong>{row.invoice}</strong><div className="s26-sub">{row.suborder}</div></td><td>{row.customer}</td><td>{row.channel}</td><td>{row.ship}</td><td>{row.total}</td><td><span className={statusClass(row.status)}>{row.status}</span></td></tr>} />
        </Card>
        <Card title="Suborder Detail" hint="Customer, items, packing status, timeline, dan action.">
          <h3>SUB-02431-01 <span className={statusClass("PENDING_CONFIRMATION")}>PENDING_CONFIRMATION</span></h3>
          <div className="s26-grid two" style={{ marginTop: 16 }}>
            <div className="s26-card soft"><h3>Customer & Shipping</h3><p className="hint">Budi Santoso<br />Jl. Melati No.45, Bandung<br />J&T Express 2-3 hari</p></div>
            <div className="s26-card soft"><h3>Order Items</h3><p className="hint">Kemeja Batik Parang x1 - Rp159.000<br />Totebag Batik Tulis x1 - Rp30.000</p><strong>Total Rp 201.000</strong></div>
          </div>
          <div className="s26-filter-row" style={{ marginTop: 16 }}><button className="s26-btn primary">Siapkan & Pack</button><button className="s26-btn">Print Label</button><button className="s26-btn">Mark as Shipped</button></div>
        </Card>
      </div>
      <div className="s26-grid two">
        <Card title="Payment Review" hint="Proof, risk check, breakdown, and audit timeline." actions={<><button className="s26-btn success">Mark Safe</button><button className="s26-btn danger">Reject</button></>}>
          <div className="s26-grid three">
            <div className="s26-card soft"><h3>Payment Proof</h3><div style={{ padding: 28, borderRadius: 18, background: "#eff6ff", textAlign: "center" }}>m-BCA<br /><strong>Transfer Successful</strong><br />Rp 201.000</div></div>
            <div className="s26-card soft"><h3>Transaction Breakdown</h3><p className="hint">Total Order Rp 201.000<br />Payment Method Bank Transfer (BCA)<br />Match Score 95%</p></div>
            <div className="s26-card soft"><h3>Risk & Fraud Check</h3><p className="hint">Low Risk: pass<br />Amount match: pass<br />Destination account match: pass</p></div>
          </div>
        </Card>
        <Card title="Payment Profile" hint="QRIS, bank transfer, payout, documents, and verification.">
          <div className="s26-grid three">
            <div className="s26-card soft"><h3>QRIS</h3><p className="hint">Accept instant payments</p><span className={statusClass("Active")}>ACTIVE</span></div>
            <div className="s26-card soft"><h3>Payout Account</h3><p className="hint">BCA 123-456-7890<br />TP PRENEURS BATIK STORE</p><span className={statusClass("Active")}>VERIFIED</span></div>
            <div className="s26-card soft"><h3>Documents</h3><p className="hint">ID card, tax number, bank statement, selfie with ID</p><span className={statusClass("Pending")}>PENDING</span></div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}

function TeamPage({
  teamView = "overview",
  teamData = null,
  teamState = null,
  teamQuery = null,
  onTeamQueryChange = null,
  notificationMutation = null,
  mode,
  storeContext,
  seller2026Permissions,
  teamMutations = null,
}) {
  const { storeSlug } = useParams();
  const isLive = Boolean(teamData || teamState);
  const basePath = storeSlug ? `/seller/stores/${encodeURIComponent(storeSlug)}` : "/seller-2026";
  const queryChange = (next) => onTeamQueryChange?.(next);
  const searchValue = teamQuery?.search || "";
  const [notificationActionStatus, setNotificationActionStatus] = useState({ type: "idle", message: "" });
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);
  const [inviteForm, setInviteForm] = useState({ email: "", roleCode: "" });
  const canMutateNotifications = Boolean(notificationMutation?.canMutate);
  const isNotificationMutationPending =
    Boolean(notificationMutation?.isMarkingRead) || Boolean(notificationMutation?.isMarkingAllRead);
  const notificationActionTitle = canMutateNotifications
    ? undefined
    : actionTitle(seller2026Permissions, "NOTIFICATION_READ", "notifications");
  const runNotificationAction = async (action, successMessage) => {
    if (!action || isNotificationMutationPending) return;
    notificationMutation?.reset?.();
    setNotificationActionStatus({ type: "idle", message: "" });
    try {
      await action();
      setNotificationActionStatus({ type: "success", message: successMessage });
    } catch (error) {
      setNotificationActionStatus({
        type: "error",
        message: error?.message || "Notification action failed.",
      });
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!teamMutations?.remove) return;
    if (!window.confirm("Are you sure you want to remove this member? This will revoke their access to this store immediately.")) return;
    try {
      await teamMutations.remove.mutateAsync(memberId);
      alert("Member access removed successfully.");
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to remove member.");
    }
  };

  const handleRoleChange = async () => {
    if (!roleChangeTarget || !teamMutations?.updateRole || !teamData?.member?.id) return;
    try {
      await teamMutations.updateRole.mutateAsync({ memberId: teamData.member.id, roleCode: roleChangeTarget });
      alert("Member role updated successfully.");
      setRoleChangeTarget(null);
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to update member role.");
    }
  };

  const handleInviteSubmit = async () => {
    if (!teamMutations?.invite || !inviteForm.email || !inviteForm.roleCode) return;
    try {
      await teamMutations.invite.mutateAsync({ email: inviteForm.email, roleCode: inviteForm.roleCode });
      alert("Invitation sent successfully.");
      setInviteForm({ email: "", roleCode: "" });
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to send invitation.");
    }
  };

  const handleReinvite = async (memberId, roleCode) => {
    if (!teamMutations?.reinvite) return;
    try {
      await teamMutations.reinvite.mutateAsync({ memberId, roleCode });
      alert("Invitation resent successfully.");
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to resend invitation.");
    }
  };

  const handleCancelInvite = async (memberId) => {
    if (!teamMutations?.remove) return;
    if (!window.confirm("Are you sure you want to cancel this invitation?")) return;
    try {
      await teamMutations.remove.mutateAsync(memberId);
      alert("Invitation cancelled successfully.");
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to cancel invitation.");
    }
  };

  if (isLive && teamView === "members") {
    const rows = teamData?.members || [];
    const summary = teamData?.summary || {};
    const roles = teamData?.roles || [];

    return (
      <Shell section="team" mode={mode} storeContext={storeContext}>
        {teamState?.isError ? <Card title="Team unavailable" hint="Live team members could not load." actions={<button type="button" className="s26-btn" onClick={teamState?.refetch}>Retry</button>} /> : null}
        <Card title="Team Members" hint="Role, permission summary, last active, and status." actions={!actionTitle(seller2026Permissions, "TEAM_INVITE", "team") ? <Link className="s26-btn primary" to={`${basePath}/team/audit`}>+ Invite Member</Link> : <button type="button" className="s26-btn primary" disabled title={actionTitle(seller2026Permissions, "TEAM_INVITE", "team")}>+ Invite Member</button>}>
          <div className="s26-grid four" style={{ marginBottom: 14 }}>
            <CatalogKpi label="Members" value={summary.totalMembers || 0} />
            <CatalogKpi label="Active" value={summary.activeMembers || 0} />
            <CatalogKpi label="Invitations" value={summary.pendingInvitations || 0} />
            <CatalogKpi label="Roles" value={summary.totalRoles || 0} />
          </div>
          <div className="s26-filter-row">
            <input className="s26-search" aria-label="Search team members" placeholder="Search member, email, or role" value={searchValue} onChange={(event) => queryChange({ search: event.target.value, page: 1 })} />
            <select className="s26-control" aria-label="Filter member role" value={teamQuery?.role || "all"} onChange={(event) => queryChange({ role: event.target.value, page: 1 })}>
              <option value="all">All Roles</option>
              {roles.map((role) => <option value={role.name} key={role.id}>{role.name}</option>)}
            </select>
            <select className="s26-control" aria-label="Filter member status" value={teamQuery?.status || "all"} onChange={(event) => queryChange({ status: event.target.value, page: 1 })}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="invited">Invited</option>
            </select>
            <Link className="s26-btn" to={`${basePath}/team/audit`}>Audit Log</Link>
          </div>
          {teamState?.isLoading ? <p className="hint">Loading team members...</p> : null}
          {!teamState?.isLoading && rows.length === 0 ? <div className="s26-empty"><strong>No team members are available for this store yet.</strong><p>Store-scoped members and invitations will appear after they are added.</p></div> : null}
          {rows.length ? <DataTable columns={["Member", "Role", "Permissions", "Last Active", "Status", "Actions"]} rows={rows} renderRow={(row) => {
            const finalRemoveReason = getDisabledReasonForRemoval(teamData?.currentAccess, row) || actionTitle(seller2026Permissions, "TEAM_REMOVE", "team");
            return <tr key={row.id}><td><div className="s26-product-cell"><span className="s26-thumb">{(row.name || "T")[0]}</span><div><strong>{row.name}</strong><div className="s26-sub">{row.email}</div></div></div></td><td>{row.roleName}</td><td>{row.permissionSummary}</td><td>{row.lastActiveAt || "-"}</td><td><span className={statusClass(row.status)}>{row.status}</span></td><td><div className="s26-row-actions"><Link className="s26-link" to={`${basePath}/team/${encodeURIComponent(String(row.id))}`}>Detail</Link><button type="button" className="s26-muted-action" disabled={!!finalRemoveReason} title={finalRemoveReason} onClick={() => handleRemoveMember(row.id)}>Remove</button></div></td></tr>;
          }} /> : null}
        </Card>
      </Shell>
    );
  }

  if (isLive && teamView === "member-detail") {
    const member = teamData?.member || null;
    return (
      <Shell section="team" mode={mode} storeContext={storeContext}>
        {teamState?.isError ? <Card title="Member unavailable" hint="Member was not found or is not available for this store." actions={<button type="button" className="s26-btn" onClick={teamState?.refetch}>Retry</button>} /> : null}
        <Card title="Member Detail / Role Editor" hint="Store-scoped permission toggles and access summary." actions={<Link className="s26-btn" to={`${basePath}/team`}>Back to Team</Link>}>
          {teamState?.isLoading ? <p className="hint">Loading member...</p> : null}
          {!teamState?.isLoading && !member ? <div className="s26-empty"><strong>Member was not found or is not available for this store.</strong><p>Make sure the member is still within the active store scope.</p></div> : null}
          {member ? (
            <div className="s26-grid two">
              <div className="s26-card soft">
                <div className="s26-avatar">{(member.name || "TM").split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
                <h3 style={{ marginTop: 12 }}>{member.name}</h3>
                <p className="hint">{member.roleName}<br />{member.email}<br />{member.phone || "No phone number"}</p>
                <span className={statusClass(member.status)}>{member.status}</span>
                <p className="hint" style={{ marginTop: 12 }}>Joined: {member.joinedAt || "-"}<br />Last active: {member.lastActiveAt || "-"}</p>
              </div>
              <div>
                <label className="s26-field-label" htmlFor="s26-member-role">Role</label>
                <select id="s26-member-role" className="s26-control" 
                  value={roleChangeTarget || member.roleCode || member.roleName} 
                  disabled={!!getDisabledReasonForRoleChange(teamData?.currentAccess, member) || !teamMutations?.updateRole} 
                  title={getDisabledReasonForRoleChange(teamData?.currentAccess, member) || actionTitle(seller2026Permissions, "TEAM_ROLE_UPDATE", "team")}
                  onChange={(e) => setRoleChangeTarget(e.target.value)}
                >
                  <option value={member.roleCode || member.roleName}>{member.roleName}</option>
                  {(teamData?.roles || []).filter(r => r.code !== member.roleCode).map((role) => <option value={role.code} key={role.id}>{role.name}</option>)}
                </select>
                <div style={{ marginTop: 14 }}>
                  {(teamData?.permissions || []).map((permission) => <div className="s26-toggle-row" key={permission.key}><span><strong>{permission.key}</strong><span className="s26-sub">{permission.description || permission.label}</span></span><span className={`s26-switch ${permission.enabled ? "on" : ""}`} title="Permissions are managed via Roles in this phase." /></div>)}
                </div>
                <button type="button" className="s26-btn primary" style={{ marginTop: 16 }} 
                  disabled={!roleChangeTarget || !!getDisabledReasonForRoleChange(teamData?.currentAccess, member, roleChangeTarget)} 
                  title={getDisabledReasonForRoleChange(teamData?.currentAccess, member, roleChangeTarget) || actionTitle(seller2026Permissions, "TEAM_ROLE_UPDATE", "team")}
                  onClick={handleRoleChange}
                >
                  {teamMutations?.updateRole?.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : null}
        </Card>
        {member ? <div className="s26-grid two"><Card title="Store Access" hint={(teamData?.storeAccess || []).length ? "Store access is scoped and read-only in this phase." : "No additional store access data is available."}>{(teamData?.storeAccess || []).map((access) => <div className="s26-toggle-row" key={access.id}><span>{access.name}</span><span className={`s26-switch ${access.enabled ? "on" : ""}`} /></div>)}</Card><Card title="Permission Summary" hint="Grouped permission overview.">{(teamData?.permissionSummary || []).map((item) => <div className="s26-check-row" key={item.group}><span>{item.group}</span><strong>{item.granted}/{item.total}</strong></div>)}</Card></div> : null}
      </Shell>
    );
  }

  if (isLive && teamView === "audit") {
    const invitations = teamData?.invitations || [];
    const auditRows = teamData?.auditLogs || [];
    const pagination = teamData?.pagination || { page: 1, totalPages: 0, total: 0 };

    return (
      <Shell section="team" mode={mode} storeContext={storeContext}>
        {teamState?.isError ? <Card title="Audit unavailable" hint="Live invitations or audit log could not load." actions={<button type="button" className="s26-btn" onClick={teamState?.refetch}>Retry</button>} /> : null}
        <div className="s26-grid two">
          <Card title="Pending Invitations" hint="Invitee, role, inviter, date, and lifecycle status." actions={<button type="button" className="s26-btn primary" disabled title={actionTitle(seller2026Permissions, "TEAM_INVITE", "team")}>Invite Member</button>}>
            {teamState?.isLoading ? <p className="hint">Loading invitations...</p> : null}
            {!teamState?.isLoading && invitations.length === 0 ? <div className="s26-empty"><strong>No invitations are available for this store yet.</strong><p>Pending invitations will appear here.</p></div> : null}
            {invitations.length ? <DataTable columns={["Invitee", "Role", "Invited By", "Date", "Status", "Actions"]} rows={invitations} renderRow={(row) => <tr key={row.id}><td><strong>{row.name}</strong><div className="s26-sub">{row.email}</div></td><td>{row.roleName}</td><td>{row.invitedBy}</td><td>{row.invitedAt || "-"}</td><td><span className={statusClass(row.status)}>{row.status}</span></td><td><div className="s26-row-actions"><button type="button" className="s26-muted-action" disabled={!!actionTitle(seller2026Permissions, "TEAM_INVITE", "team") || !teamMutations?.reinvite} title={actionTitle(seller2026Permissions, "TEAM_INVITE", "team")} onClick={() => handleReinvite(row.id, row.roleCode)}>Resend</button><button type="button" className="s26-muted-action" disabled={!!actionTitle(seller2026Permissions, "TEAM_INVITE", "team") || !teamMutations?.remove} title={actionTitle(seller2026Permissions, "TEAM_INVITE", "team")} onClick={() => handleCancelInvite(row.id)}>Cancel</button></div></td></tr>} /> : null}
          </Card>
          <Card title="Invite Member Form" hint="Send store invitation via email.">
            <div className="s26-form-grid">
              <label><span>Email Address</span><input className="s26-control" placeholder="email@domain.com" disabled={!!actionTitle(seller2026Permissions, "TEAM_INVITE", "team")} value={inviteForm.email} onChange={(e) => setInviteForm(prev => ({...prev, email: e.target.value}))} /></label>
              <label><span>Role</span><select className="s26-control" disabled={!!actionTitle(seller2026Permissions, "TEAM_INVITE", "team")} value={inviteForm.roleCode} onChange={(e) => setInviteForm(prev => ({...prev, roleCode: e.target.value}))}>
                <option value="">Select role</option>
                {(teamData?.roles || []).map((role) => <option value={role.code} key={role.id}>{role.name}</option>)}
              </select></label>
              <label><span>Store Access</span><input className="s26-control" value="Current store only" disabled readOnly /></label>
            </div>
            <button type="button" className="s26-btn primary" style={{ marginTop: 14 }} disabled={!inviteForm.email || !inviteForm.roleCode || !!actionTitle(seller2026Permissions, "TEAM_INVITE", "team")} title={actionTitle(seller2026Permissions, "TEAM_INVITE", "team")} onClick={handleInviteSubmit}>{teamMutations?.invite?.isPending ? "Sending..." : "Send Invitation"}</button>
          </Card>
        </div>
        <Card title="Audit Log" hint="Team role, invitation, lifecycle, and permission activity.">
          <div className="s26-filter-row">
            <input className="s26-search" aria-label="Filter audit member" placeholder="Filter member or target" value={teamQuery?.member || ""} onChange={(event) => queryChange({ member: event.target.value, page: 1 })} />
            <select className="s26-control" aria-label="Filter audit action" value={teamQuery?.action || "all"} onChange={(event) => queryChange({ action: event.target.value, page: 1 })}><option value="all">All Actions</option><option value="MEMBER_INVITED">Member Invited</option><option value="ROLE_UPDATED">Role Updated</option><option value="MEMBER_REMOVED">Member Removed</option></select>
            <input className="s26-control" type="date" aria-label="Audit date from" value={teamQuery?.dateFrom || ""} onChange={(event) => queryChange({ dateFrom: event.target.value, page: 1 })} />
            <input className="s26-control" type="date" aria-label="Audit date to" value={teamQuery?.dateTo || ""} onChange={(event) => queryChange({ dateTo: event.target.value, page: 1 })} />
          </div>
          {!teamState?.isLoading && auditRows.length === 0 ? <div className="s26-empty"><strong>No invitations or audit logs are available for this store yet.</strong><p>Team activity will appear after access changes are recorded.</p></div> : null}
          {auditRows.length ? <DataTable columns={["Time", "Member", "Action", "Target", "Details", "IP Address"]} rows={auditRows} renderRow={(row) => <tr key={row.id}><td>{row.time || "-"}</td><td>{row.memberName}</td><td>{row.action}</td><td>{row.target}</td><td>{row.details || "-"}</td><td>{row.ipAddress || "-"}</td></tr>} /> : null}
          <div className="s26-pagination">
            <span>Page {pagination.page} of {pagination.totalPages} - {pagination.total} logs</span>
            <div className="s26-filter-row" style={{ marginBottom: 0 }}>
              <button type="button" className="s26-btn" disabled={pagination.page <= 1} onClick={() => queryChange({ page: pagination.page - 1 })}>Previous</button>
              <button type="button" className="s26-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => queryChange({ page: pagination.page + 1 })}>Next</button>
            </div>
          </div>
        </Card>
      </Shell>
    );
  }

  if (isLive && teamView === "notifications") {
    const rows = teamData?.notifications || [];
    const categories = teamData?.categories || [];
    const summary = teamData?.summary || {};
    const categoryLabels = categories.reduce((accumulator, category) => {
      accumulator[category.key] = category.label;
      return accumulator;
    }, {});
    const formatNotificationLabel = (value) =>
      String(value || "Info")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());

    return (
      <Shell section="team" mode={mode} storeContext={storeContext}>
        {teamState?.isError ? <Card title="Notifications could not be loaded" hint="Store-scoped notifications are temporarily unavailable." actions={<button type="button" className="s26-btn" onClick={teamState?.refetch}>Try again</button>} /> : null}
        <div className="s26-grid two">
          <Card title="Notifications Center" hint="Priority filters, categories, unread state, and operational alerts." actions={<button type="button" className="s26-btn" disabled={!canMutateNotifications || isNotificationMutationPending || summary.unread <= 0} title={notificationActionTitle} onClick={() => runNotificationAction(notificationMutation?.markAllRead, "All notifications marked as read.")}>{notificationMutation?.isMarkingAllRead ? "Marking..." : "Mark all as read"}</button>}>
            <div className="s26-grid five" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
              <CatalogKpi label="All" value={summary.all || 0} />
              <CatalogKpi label="Unread" value={summary.unread || 0} />
              <CatalogKpi label="Critical" value={summary.critical || 0} />
              <CatalogKpi label="Important" value={summary.important || 0} />
              <CatalogKpi label="Info" value={summary.info || 0} />
            </div>
            <div className="s26-filter-row">
              <input className="s26-search" aria-label="Search notifications" placeholder="Search notifications" value={searchValue} onChange={(event) => queryChange({ search: event.target.value, page: 1 })} />
              <select className="s26-control" aria-label="Filter notification priority" value={teamQuery?.priority || "all"} onChange={(event) => queryChange({ priority: event.target.value, page: 1 })}><option value="all">All Priority</option><option value="critical">Critical</option><option value="important">Important</option><option value="info">Info</option><option value="low">Low</option></select>
              <select className="s26-control" aria-label="Filter notification category" value={teamQuery?.category || "all"} onChange={(event) => queryChange({ category: event.target.value, page: 1 })}>{categories.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}</select>
              <select className="s26-control" aria-label="Filter unread notifications" value={teamQuery?.unread || "all"} onChange={(event) => queryChange({ unread: event.target.value, page: 1 })}><option value="all">All Read State</option><option value="true">Unread</option><option value="false">Read</option></select>
            </div>
            {teamState?.isLoading ? (
              <div className="s26-notification-list">
                {[1, 2, 3, 4].map((i) => (
                  <article className="s26-notification-item read" key={`skeleton-${i}`} style={{ opacity: 0.6, animation: "s26-pulse 1.5s infinite ease-in-out" }}>
                    <div className="s26-notification-dot" aria-hidden="true" style={{ background: "var(--s26-border)" }} />
                    <div className="s26-notification-body">
                      <div className="s26-notification-head">
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ height: 16, width: "50%", background: "var(--s26-muted)", borderRadius: 4 }} />
                          <div style={{ height: 14, width: "80%", background: "var(--s26-border)", borderRadius: 4 }} />
                        </div>
                        <div style={{ height: 24, width: 80, background: "var(--s26-border)", borderRadius: 12 }} />
                      </div>
                      <div className="s26-notification-meta" style={{ marginTop: 12 }}>
                        <div style={{ height: 14, width: 60, background: "var(--s26-border)", borderRadius: 4 }} />
                        <div style={{ height: 14, width: 60, background: "var(--s26-border)", borderRadius: 4 }} />
                        <div style={{ height: 14, width: 80, background: "var(--s26-border)", borderRadius: 4 }} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            {notificationActionStatus.message ? <p className={notificationActionStatus.type === "error" ? "s26-field-error" : "hint"}>{notificationActionStatus.message}</p> : null}
            {!teamState?.isLoading && !teamState?.isError && rows.length === 0 ? <div className="s26-empty" style={{ padding: "40px 20px" }}><strong>No notifications found</strong><p>Try adjusting your search or priority filters.</p></div> : null}
            {rows.length > 0 && !teamState?.isLoading && !teamState?.isError ? (
              <div className="s26-notification-list">
                {rows.map((row) => (
                  <article className={`s26-notification-item ${row.unread ? "unread" : "read"}`} key={row.id}>
                    <div className="s26-notification-dot" aria-hidden="true" />
                    <div className="s26-notification-body">
                      <div className="s26-notification-head">
                        <div>
                          <strong>{row.title}</strong>
                          <p>{row.message || "No details available."}</p>
                        </div>
                        <span className={statusClass(row.status)}>{formatNotificationLabel(row.status)}</span>
                      </div>
                      <div className="s26-notification-meta">
                        <span>{categoryLabels[row.category] || formatNotificationLabel(row.category)}</span>
                        <span>{formatNotificationLabel(row.priority)}</span>
                        <span>{row.createdAt || "Recently"}</span>
                      </div>
                    </div>
                    <div className="s26-notification-actions">
                      {row.canonicalHref ? <Link className="s26-link" to={row.canonicalHref}>{row.actionLabel || "Open"}</Link> : null}
                      <button type="button" className="s26-muted-action" disabled={!row.unread || !canMutateNotifications || isNotificationMutationPending} title={row.unread ? notificationActionTitle : "Notification is already read."} onClick={() => runNotificationAction(() => notificationMutation?.markRead(row.id), "Notification marked as read.")}>{notificationMutation?.isMarkingRead ? "Marking..." : row.unread ? "Mark as read" : "Read"}</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </Card>
          <Card title="Categories" hint="Notification grouping by operational domain.">
            <div className="s26-checklist">{categories.map((category) => <button type="button" className="s26-check-row" key={category.key} onClick={() => queryChange({ category: category.key, page: 1 })}><span>{category.label}</span><strong>{category.count}</strong></button>)}</div>
          </Card>
        </div>
      </Shell>
    );
  }

  return (
    <Shell section="team">
      <div className="s26-grid two">
        <Card title="Team Members" hint="Role, permission summary, last active, and status." actions={<button className="s26-btn primary">+ Invite Member</button>}>
          <div className="s26-grid four" />
          <DataTable columns={["Member", "Role", "Permissions", "Last Active", "Status"]} rows={members} renderRow={(row) => <tr key={row[0]}><td><div className="s26-product-cell"><span className="s26-thumb">{row[0][0]}</span><strong>{row[0]}</strong></div></td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td><span className={statusClass(row[4])}>{row[4]}</span></td></tr>} />
        </Card>
        <Card title="Member Detail / Role Editor" hint="Store-scoped permission toggles.">
          <div className="s26-grid two">
            <div className="s26-card soft"><div className="s26-avatar">BH</div><h3 style={{ marginTop: 12 }}>Budi Herman</h3><p className="hint">Store Admin<br />budi.herman@batiknusantara.co.id</p><span className={statusClass("Active")}>Active</span></div>
            <div>{["STORE_PROFILE_UPDATE", "CATALOG_PRODUCT_CREATE", "ORDER_READ", "PAYMENT_REVIEW_READ", "TEAM_INVITE"].map((perm, index) => <div className="s26-toggle-row" key={perm}><span>{perm}</span><span className={`s26-switch ${index < 4 ? "on" : ""}`} /></div>)}</div>
          </div>
          <button className="s26-btn primary" style={{ marginTop: 16 }}>Save Changes</button>
        </Card>
      </div>
      <div className="s26-grid two">
        <Card title="Invitations & Audit Log" hint="Pending invitations and important activity logs.">
          <DataTable columns={["Time", "Member", "Action", "Target", "Details"]} rows={[["24 Mei 2026 09:41", "Budi Herman", "Updated Role", "Rizky Pratama", "Support Staff to Order Manager"], ["24 Mei 2026 09:15", "Dewi Lestari", "Invited Member", "Rina Oktaviani", "Payment Reviewer"], ["23 Mei 2026 16:32", "Siti Aisyah", "Created Product", "Batik Mega Mendung", "SKU: BAT-MEG-001"]]} renderRow={(row) => <tr key={row.join("-")}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>} />
        </Card>
        <Card title="Notifications Center" hint="Priority, category, unread badge, and mark-all-as-read action." actions={<button className="s26-btn">Mark all as read</button>}>
          <div className="s26-grid four" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>{[["All", "124"], ["Unread", "12"], ["Critical", "3"], ["Important", "18"]].map(([a, b]) => <div className="s26-card soft" key={a}><p className="hint">{a}</p><strong>{b}</strong></div>)}</div>
          <DataTable columns={["Notification", "Category", "Priority", "Time"]} rows={notifications} renderRow={(row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td><span className={statusClass(row[2])}>{row[2]}</span></td><td>{row[3]}</td></tr>} />
        </Card>
      </div>
    </Shell>
  );
}

export function Seller2026Workspace({
  section = "dashboard",
  mode = "standalone",
  productionMode = false,
  storeContext = null,
  dashboardData = null,
  dashboardState = null,
  storefrontData = null,
  storefrontState = null,
  storefrontMutation = null,
  productsData = null,
  productsState = null,
  productsQuery = null,
  onProductsQueryChange = null,
  productDetailData = null,
  productDetailState = null,
  productEditorMode = null,
  productDraftMutation = null,
  productsMutation = null,
  catalogView = "overview",
  catalogData = null,
  catalogState = null,
  catalogQuery = null,
  onCatalogQueryChange = null,
  catalogMutation = null,
  operationsView = "overview",
  operationsData = null,
  operationsState = null,
  operationsMutation = null,
  operationsQuery = null,
  onOperationsQueryChange = null,
  teamView = "overview",
  teamData = null,
  teamState = null,
  teamQuery = null,
  onTeamQueryChange = null,
  notificationMutation = null,
}) {
  const seller2026Permissions = useMemo(() => {
    if (mode !== "embedded") return new Set(SELLER_2026_PREVIEW_PERMISSIONS);
    return normalizeSeller2026Permissions(storeContext);
  }, [mode, storeContext]);
  const permissionSourceAvailable = mode === "embedded" && hasSeller2026PermissionSource(storeContext);
  const requiredPermission = routePermissionFor({
    section,
    catalogView,
    operationsView,
    teamView,
  });
  const isRestricted =
    permissionSourceAvailable &&
    requiredPermission &&
    !hasSeller2026Permission(seller2026Permissions, requiredPermission);
  const Component = useMemo(() => {
    if (section === "storefront") return StorefrontPage;
    if (section === "products") return ProductsPage;
    if (section === "taxonomy") return TaxonomyPage;
    if (section === "operations") return OperationsPage;
    if (section === "team") return TeamPage;
    return DashboardPage;
  }, [section]);

  const teamMutations = useSeller2026TeamMutations(storeContext?.store?.id);

  if (isRestricted) {
    return (
      <Shell section={section} mode={mode} storeContext={storeContext}>
        <Seller2026RestrictedState
          title="Access Restricted"
          message={`You do not have permission ${requiredPermission} to view this page.`}
        />
      </Shell>
    );
  }

  return (
    <Component
      mode={mode}
      productionMode={productionMode}
      storeContext={storeContext}
      dashboardData={dashboardData}
      dashboardState={dashboardState}
      storefrontData={storefrontData}
      storefrontState={storefrontState}
      storefrontMutation={storefrontMutation}
      productsData={productsData}
      productsState={productsState}
      productsQuery={productsQuery}
      onProductsQueryChange={onProductsQueryChange}
      productDetailData={productDetailData}
      productDetailState={productDetailState}
      productEditorMode={productEditorMode}
      productDraftMutation={productDraftMutation}
      productsMutation={productsMutation}
      catalogView={catalogView}
      catalogData={catalogData}
      catalogState={catalogState}
      catalogQuery={catalogQuery}
      onCatalogQueryChange={onCatalogQueryChange}
      catalogMutation={catalogMutation}
      operationsView={operationsView}
      operationsData={operationsData}
      operationsState={operationsState}
      operationsMutation={operationsMutation}
      operationsQuery={operationsQuery}
      onOperationsQueryChange={onOperationsQueryChange}
      teamView={teamView}
      teamData={teamData}
      teamState={teamState}
      teamQuery={teamQuery}
      onTeamQueryChange={onTeamQueryChange}
      notificationMutation={notificationMutation}
      seller2026Permissions={seller2026Permissions}
      teamMutations={teamMutations}
    />
  );
}

export default Seller2026Workspace;
