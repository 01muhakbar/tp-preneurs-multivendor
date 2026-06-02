import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SELLER_2026_MUTATIONS } from "../../api/seller2026/mutation-flags.ts";
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
    description: "Ringkasan performa toko, readiness, analytics, order terbaru, dan payout dalam satu tempat.",
  },
  storefront: {
    active: "store-profile",
    eyebrow: "Seller Workspace - Storefront",
    title: "Store Profile, Microsite & Brand Control",
    description: "Kelola identitas toko, preview microsite publik, kesiapan launch, dan tema brand.",
  },
  products: {
    active: "products",
    eyebrow: "Seller Workspace - Catalog",
    title: "Product Catalog & Authoring",
    description: "Daftar produk, form product create/edit, detail produk, variant, revision notes, dan publish history.",
  },
  taxonomy: {
    active: "categories",
    eyebrow: "Seller Workspace - Catalog Tools",
    title: "Categories, Attributes & Coupons",
    description: "Kelola category assignment, attribute values, mapping produk, dan promo store-scoped.",
  },
  operations: {
    active: "orders",
    eyebrow: "Seller Workspace - Operations",
    title: "Orders, Fulfillment & Payments",
    description: "Hub operasional untuk suborder, fulfillment queue, payment review, dan payment profile.",
  },
  team: {
    active: "members",
    eyebrow: "Seller Workspace - Collaboration",
    title: "Team, Invitations, Audit Log & Notifications",
    description: "Kelola anggota, role, permission, audit trail, undangan, dan notifikasi operasional.",
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

function Shell({ section = "dashboard", mode = "standalone", storeContext = null, children }) {
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
                <span className="s26-pill">2026 UI</span>
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

const disabledTodoTitle = "Integrasi upload/publishing belum diaktifkan.";

const permissionTitle = "Anda tidak memiliki permission untuk aksi ini.";
const mutationPendingTitle = "Integrasi aksi ini belum diaktifkan.";

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
    errors.email = "Format email tidak valid.";
  }
  if (form.whatsapp && !phonePattern.test(form.whatsapp)) {
    errors.whatsapp = "Format WhatsApp tidak valid atau terlalu pendek.";
  }
  if (form.phone && !phonePattern.test(form.phone)) {
    errors.phone = "Format telepon tidak valid atau terlalu pendek.";
  }
  if (form.shippingOriginPhone && !phonePattern.test(form.shippingOriginPhone)) {
    errors.shippingOriginPhone = "Format telepon asal pengiriman tidak valid.";
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
    errors.description = "Tentang toko maksimal 4000 karakter.";
  }
  if (form.postalCode && !/^[A-Z0-9\- ]{3,32}$/i.test(form.postalCode)) {
    errors.postalCode = "Format kode pos tidak valid.";
  }
  if (form.shippingOriginPostalCode && !/^[A-Z0-9\- ]{3,32}$/i.test(form.shippingOriginPostalCode)) {
    errors.shippingOriginPostalCode = "Format kode pos asal pengiriman tidak valid.";
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
  title = "Akses dibatasi",
  message = "Anda tidak memiliki permission untuk melihat halaman ini.",
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
              <p className="hint">{dashboardData?.readinessHint || "Toko sudah siap untuk ditingkatkan."}</p>
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
        <Card title="Top Products" hint="Produk dengan revenue terbaik minggu ini.">
          <DataTable columns={["Produk", "Terjual", "Revenue", "Status"]} rows={effectiveTopProducts} renderRow={(row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td style={{ color: "var(--seller-emerald)", fontWeight: 800 }}>{row[3]}</td></tr>} />
        </Card>
        <Card title="Recent Suborders" hint="Suborder terbaru dari semua channel.">
          <DataTable columns={["Suborder", "Customer", "Status", "Waktu"]} rows={effectiveSuborders} renderRow={(row) => <tr key={row.id}><td>{row.id}</td><td>{row.customer}</td><td><span className={statusClass(row.status)}>{row.status}</span></td><td>{row.time}</td></tr>} />
        </Card>
      </div>
      <div className="s26-grid three">
        {[["Tambah Produk", "Buat produk baru atau import CSV"], ["Kelola Pesanan", "Buka fulfillment queue"], ["Cek Pembayaran", "Review proof dan payout"]].map(([a, b]) => <Card key={a} title={a} hint={b}><button className="s26-btn primary">Buka</button></Card>)}
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
    saveStatus: "Identitas, kontak, alamat, sosial media, dan policy toko.",
  };
  const store = storefrontData?.store || previewStore;
  const serverForm = useMemo(() => storeProfileFormFromStore(store), [storefrontData?.store]);
  const [profileForm, setProfileForm] = useState(serverForm);
  const [submitStatus, setSubmitStatus] = useState({ type: "idle", message: "" });
  const liveReadiness = storefrontData?.readiness || {};
  const microsite = storefrontData?.microsite || {
    heroTitle: "Alami. Sehat.",
    heroSubtitle: "Produk pilihan terbaik untuk keluarga sehat Indonesia.",
    heroCtaLabel: "Belanja Sekarang",
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
      { key: "categories", label: "Kategori Populer", enabled: true },
      { key: "featured", label: "Produk Unggulan", enabled: true },
      { key: "benefits", label: "Keunggulan Toko", enabled: true },
      { key: "testimonials", label: "Testimoni", enabled: true },
      { key: "about", label: "Tentang Kami", enabled: false },
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
      ? "Tidak ada perubahan untuk disimpan."
      : !isProfileValid
        ? "Perbaiki field yang belum valid."
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
      setSubmitStatus({ type: "success", message: "Profil toko berhasil diperbarui." });
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: error?.response?.data?.message || error?.message || "Profil toko gagal diperbarui.",
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
            ? "Selesai"
            : item.status === "missing"
              ? "Belum"
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
    : (isLive ? ["Produk Unggulan", "Produk Baru", "Produk Populer", "Pilihan Toko"] : ["Kunyit Ekstrak", "Madu Hutan", "Vitamin D3", "Teh Daun Sirsak"]).map((name, index) => ({
        id: `fallback-${index}`,
        name,
        imageUrl: null,
        price: 0,
        badge: "Preview",
      }));

  return (
    <Shell section="storefront" mode={mode} storeContext={storeContext}>
      {storefrontState?.isError ? (
        <Card
          title="Store profile data unavailable"
          hint="Live store profile could not load completely. Safe fallback data remains visible below."
          actions={<button type="button" className="s26-btn" onClick={storefrontState?.refetch}>Retry</button>}
        />
      ) : null}
      <div className="s26-grid two">
        <Card
          title="Store Profile"
          hint={isLive ? store.saveStatus : "Identitas, kontak, alamat, sosial media, dan policy toko."}
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
                {isSubmittingProfile ? "Menyimpan..." : "Simpan Perubahan"}
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
              {storefrontMutation.error?.message || "Profil toko gagal diperbarui."}
            </div>
          ) : null}
          <div className="s26-grid two">
            <div className="s26-card soft">
              <h3>Logo Toko</h3>
              {store.logoUrl ? (
                <img className="s26-logo-preview" src={store.logoUrl} alt={`${store.name} logo`} />
              ) : (
                <div className="s26-logo" style={{ marginTop: 12 }}>{(store.name || "TK").slice(0, 2).toUpperCase()}</div>
              )}
              <p className="hint">PNG/JPG maks 2MB</p>
              <button type="button" className="s26-btn" disabled title={disabledTodoTitle}>Ubah Logo</button>
            </div>
            <div className="s26-hero s26-cover-preview" style={store.coverUrl ? { backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, .76), rgba(5, 150, 105, .58)), url(${store.coverUrl})` } : { minHeight: 160 }}>
              <div><h2 style={{ fontSize: 28 }}>{store.name || "Alami. Sehat."}</h2><p>{store.tagline || "Cover banner rekomendasi 1920x600px."}</p></div>
              <button type="button" className="s26-btn" disabled title={disabledTodoTitle}>Ubah Banner</button>
            </div>
          </div>
          <div className="s26-form-grid" style={{ marginTop: 16 }}>
            <div className="s26-field">
              <label>Nama Toko</label>
              <input value={profileForm.name || "Toko Kamu"} readOnly title="Nama toko masih admin-governed pada fase ini." />
            </div>
            <div className="s26-field">
              <label>Slug / URL</label>
              <input value={profileForm.slug || "store-slug"} readOnly title="Slug tidak diedit pada fase mutation ini." />
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
              <label>Tentang Toko</label>
              <textarea
                value={profileForm.description}
                readOnly={!canUpdateProfile}
                disabled={isSubmittingProfile}
                onChange={(event) => setProfileField("description", event.target.value)}
              />
              {validationErrors.description ? <small className="s26-field-error">{validationErrors.description}</small> : null}
            </div>
            <div className="s26-field">
              <label>Kategori Bisnis</label>
              <input value={store.businessCategory || "Storefront"} readOnly title="Kategori bisnis belum didukung endpoint seller profile update." />
            </div>
            <div className="s26-field">
              <label>Subkategori</label>
              <input value={store.businessSubcategory || "General"} readOnly title="Subkategori belum didukung endpoint seller profile update." />
            </div>
            {[
              ["Nama Kontak Pengiriman", "shippingOriginContactName"],
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
                {(store.socials?.length ? store.socials : [{ channel: "Social", value: "Belum diatur" }]).map((item) => (
                  <div className="s26-check-row" key={`${item.channel}-${item.value}`}><span>{item.channel}</span><strong>{item.value}</strong></div>
                ))}
              </div>
            </div>
            <div className="s26-card soft">
              <h3>Ringkasan Kebijakan</h3>
              <div className="s26-checklist">
                {policyItems.map((item) => <div className="s26-check-row" key={item.label}><span>{item.label}</span><span className={statusClass(item.status === "complete" ? "Active" : "Belum")}>{item.status}</span></div>)}
              </div>
              <button type="button" className="s26-btn" disabled title={actionTitle(seller2026Permissions, "STORE_PROFILE_UPDATE", "storefront")}>Kelola Kebijakan</button>
            </div>
          </div>
        </Card>
        <Card title="Microsite Preview" hint="Preview desktop dan mobile storefront publik." actions={<a className="s26-btn" href={previewHref} target="_blank" rel="noreferrer">Buka Microsite</a>}>
          <div className="s26-hero"><div><h2>{microsite.heroTitle || "Alami. Sehat."}</h2><p>{microsite.heroSubtitle || "Produk pilihan terbaik untuk pelanggan toko."}</p><a className="s26-btn primary" href={previewHref} target="_blank" rel="noreferrer">{microsite.heroCtaLabel || "Belanja Sekarang"}</a></div><div style={{ fontSize: 42 }}>{store.logoUrl ? <img className="s26-hero-logo" src={store.logoUrl} alt="" /> : "Store"}</div></div>
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
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}><div className="s26-progress" style={{ "--s26-progress": `${liveReadiness.percent ?? 78}%` }}><span>{storefrontState?.isLoading ? "..." : `${liveReadiness.percent ?? 78}%`}</span></div><div><strong>{liveReadiness.percent >= 100 ? "Siap Diluncurkan" : "Perlu Dilengkapi"}</strong><p className="hint">{liveReadiness.completed ?? 8} selesai, {liveReadiness.missing ?? 0} perlu dilengkapi.</p></div></div>
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

function ProductsPage({
  productsData = null,
  productsState = null,
  productsQuery = null,
  onProductsQueryChange = null,
  productDetailData = null,
  productDetailState = null,
  productEditorMode = null,
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
  const canCreate = !isLive || canUseAction(seller2026Permissions, "CATALOG_PRODUCT_CREATE", "products");
  const canUpdate = !isLive || canUseAction(seller2026Permissions, "CATALOG_PRODUCT_UPDATE", "products");
  const createTitle = isLive ? actionTitle(seller2026Permissions, "CATALOG_PRODUCT_CREATE", "products") : undefined;
  const updateTitle = isLive ? actionTitle(seller2026Permissions, "CATALOG_PRODUCT_UPDATE", "products") : undefined;
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
      name: "Hijab Voal Premium",
      sku: "HJP-VOAL-01-BLK",
      status: "active",
      price: 89000,
      stock: 120,
      sold: 1248,
      views: 8432,
      category: "Fashion / Hijab & Kerudung",
      tags: ["Hijab", "Voal", "Premium", "Women"],
      description: "Hijab voal premium berkualitas tinggi dengan jahitan rapi dan finishing yang lembut di kulit.",
      gallery: [],
    },
    revisionNotes: [{ message: "Marketplace Admin meminta tambahan bahan dan foto jahitan." }],
    publishHistory: [{ label: "Published" }, { label: "Submitted" }, { label: "Revision Requested" }],
  };
  const detailView = isLive ? detail : previewDetail;
  const pagination = productsData?.pagination || { page: 1, totalPages: 1, total: tableRows.length, limit: 10 };
  const editorTitle = productEditorMode === "edit" ? "Product Edit Shell" : "Product Create Shell";
  const shouldShowList = !productDetailState?.view && !productEditorMode;
  const shouldShowDetail = productDetailState?.view === "detail" || !isLive;
  const shouldShowEditor = Boolean(productEditorMode) || !isLive;

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
          hint="Search, filter, bulk action, status, SKU, stok, dan performa produk."
          actions={
            canCreate ? (
              <Link className="s26-btn primary" to={addProductTo}>+ Add Product</Link>
            ) : (
              <button type="button" className="s26-btn primary" disabled title={createTitle}>+ Add Product</button>
            )
          }
        >
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
            <button type="button" className="s26-btn" disabled title={disabledTodoTitle}>Bulk Actions</button>
            <button type="button" className="s26-btn" disabled title={disabledTodoTitle}>More Filters</button>
          </div>
          {productsState?.isLoading ? <p className="hint">Loading products...</p> : null}
          {!productsState?.isLoading && tableRows.length === 0 ? (
            <div className="s26-empty">
              <strong>Belum ada produk</strong>
              <p>Tambahkan produk pertama untuk mulai menjual di toko ini.</p>
            </div>
          ) : (
            <DataTable
              columns={["", "Product", "SKU", "Stock", "Price", "Sales", "Views", "Status", "Updated", "Actions"]}
              rows={tableRows}
              renderRow={(row) => {
                const rowStatus = isLive ? productStatusLabel(row.status) : row.status;
                const detailTo = storeSlug ? `${basePath}/catalog/products/${encodeURIComponent(String(row.id))}` : "/seller-2026/products";
                const editTo = storeSlug ? `${detailTo}/edit` : "/seller-2026/products";
                return (
                  <tr key={row.id || row.sku}>
                    <td><input type="checkbox" aria-label={`Select ${row.name}`} disabled title={disabledTodoTitle} /></td>
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
                        <button type="button" className="s26-muted-action" disabled title={actionTitle(seller2026Permissions, "CATALOG_PRODUCT_DELETE", "products")}>Delete</button>
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
        <Card title={isLive ? editorTitle : "Product Create / Edit"} hint="Multi-step product authoring dengan draft-first workflow.">
          <div className="s26-stepper">{["Basic", "Media", "Categories", "Variants", "Pricing", "Inventory", "Shipping", "SEO", "Publish"].map((s, i) => <span className={`s26-step ${i === 0 ? "active" : ""}`} key={s}>{s}</span>)}</div>
          <div className="s26-form-grid">
            <div className="s26-field"><label>Product Name *</label><input defaultValue={isLive ? editorProduct?.name || "" : "Hijab Voal Premium"} readOnly={isLive} /></div>
            <div className="s26-field"><label>SKU *</label><input defaultValue={isLive ? editorProduct?.sku || "" : "HJP-VOAL-01-BLK"} readOnly={isLive} /></div>
            <div className="s26-field"><label>Product Type</label><select defaultValue="Physical"><option>Physical</option><option>Digital</option><option>Service</option></select></div>
            <div className="s26-field"><label>Brand</label><input defaultValue={isLive ? editorProduct?.brand || "" : "Butik Nusantara"} readOnly={isLive} /></div>
            <div className="s26-field" style={{ gridColumn: "1 / -1" }}><label>Description</label><textarea defaultValue={isLive ? editorProduct?.description || "" : "Hijab voal premium berkualitas tinggi dengan jahitan rapi dan finishing yang lembut di kulit."} readOnly={isLive} /></div>
          </div>
          {isLive ? <p className="hint" style={{ marginTop: 14 }}>Product mutation integration is pending. This screen is currently a UI shell.</p> : null}
          <div className="s26-filter-row" style={{ marginTop: 16, marginBottom: 0 }}>
            <button type="button" className="s26-btn" disabled={isLive} title={actionTitle(seller2026Permissions, productEditorMode === "edit" ? "CATALOG_PRODUCT_UPDATE" : "CATALOG_PRODUCT_CREATE", "products")}>Save Draft</button>
            <button type="button" className="s26-btn primary" disabled={isLive} title={actionTitle(seller2026Permissions, "CATALOG_PRODUCT_SUBMIT", "products")}>Next: Media</button>
          </div>
        </Card>
      ) : null}
      {shouldShowDetail ? (
      <Card title="Product Detail / Preview" hint="Gallery, performance, variants, revision notes, dan publish history.">
        {productDetailState?.isError ? (
          <div className="s26-empty">
            <strong>Product detail unavailable</strong>
            <p>Detail produk tidak dapat dimuat saat ini.</p>
            <button type="button" className="s26-btn" onClick={productDetailState?.refetch}>Retry</button>
          </div>
        ) : null}
        {productDetailState?.isLoading ? <p className="hint">Loading product detail...</p> : null}
        <div className="s26-grid three">
          <div className="s26-card soft"><div className="s26-product-gallery">{detailView?.product.gallery?.[0] ? <img src={detailView.product.gallery[0]} alt="" /> : productInitial(detailView?.product.name || "P")}</div><button type="button" className="s26-btn" style={{ width: "100%", marginTop: 12 }} disabled={isLive} title={disabledTodoTitle}>View on Storefront</button></div>
          <div><h3>{detailView?.product.name || "Product detail"} <span className={statusClass(productStatusLabel(detailView?.product.status))}>{productStatusLabel(detailView?.product.status)}</span></h3><p className="hint">SKU: {detailView?.product.sku || "-"}</p><div className="s26-grid two" style={{ marginTop: 16 }}>{[["Price", formatRupiah(detailView?.product.price)], ["Stock", detailView?.product.stock || 0], ["Sold", detailView?.product.sold || 0], ["Views", detailView?.product.views || 0]].map(([a, b]) => <div className="s26-card soft" key={a}><p className="hint">{a}</p><strong>{b}</strong></div>)}</div><p className="hint" style={{ marginTop: 14 }}>Category: {detailView?.product.category || "Uncategorized"}. Tags: {(detailView?.product.tags || []).join(", ") || "No tags"}.</p><p className="hint" style={{ marginTop: 14 }}>{detailView?.product.description || "Product description is not available yet."}</p></div>
          <div>
            <Card title="Revision Notes" hint={detailView?.revisionNotes.length ? detailView.revisionNotes.map((note) => note.message).join(" | ") : "No revision notes."} />
            <Card title="Publish History" hint={detailView?.publishHistory.length ? detailView.publishHistory.map((item) => item.label).join(" / ") : "No publish history yet."} className="soft" />
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
  mode,
  storeContext,
  seller2026Permissions,
}) {
  const { storeSlug } = useParams();
  const [couponDrawerOpen, setCouponDrawerOpen] = useState(false);
  const isLive = Boolean(catalogData || catalogState);
  const basePath = storeSlug ? `/seller/stores/${encodeURIComponent(storeSlug)}` : "/seller-2026";
  const queryChange = (next) => onCatalogQueryChange?.(next);
  const searchValue = catalogQuery?.search || "";

  if (isLive && catalogView === "categories") {
    const categoryRows = catalogData?.categories || [];
    return (
      <Shell section="taxonomy" mode={mode} storeContext={storeContext}>
        {catalogState?.isError ? <Card title="Categories unavailable" hint="Live categories could not load." actions={<button type="button" className="s26-btn" onClick={catalogState?.refetch}>Retry</button>} /> : null}
        <Card title="Categories" hint="Category tree, assignment rate, product count, dan recommended categories." actions={<button type="button" className="s26-btn primary" disabled title={disabledTodoTitle}>+ Add Category</button>}>
          <div className="s26-grid three" style={{ marginBottom: 14 }}>
            <CatalogKpi label="Total Categories" value={catalogData?.summary?.totalCategories || 0} />
            <CatalogKpi label="Products Assigned" value={catalogData?.summary?.totalProducts || 0} />
            <CatalogKpi label="Assigned Rate" value={`${catalogData?.summary?.assignedRate || 0}%`} />
          </div>
          <div className="s26-filter-row">
            <input className="s26-search" aria-label="Search categories" placeholder="Search category" value={searchValue} onChange={(event) => queryChange({ search: event.target.value })} />
            <button type="button" className="s26-btn" disabled title={disabledTodoTitle}>Bulk Actions</button>
          </div>
          {catalogState?.isLoading ? <p className="hint">Loading categories...</p> : null}
          {!catalogState?.isLoading && categoryRows.length === 0 ? (
            <div className="s26-empty"><strong>Belum ada kategori yang tersedia untuk toko ini.</strong><p>Category assignment akan muncul setelah data tersedia.</p></div>
          ) : (
            <DataTable columns={["Category", "Products", "Assigned Rate", "Status", "Actions"]} rows={categoryRows} renderRow={(row) => <tr key={row.id}><td><strong>{row.level ? `${"  ".repeat(row.level)}${row.name}` : row.name}</strong><div className="s26-sub">Parent: {row.parentId || "-"}</div></td><td>{row.productCount}</td><td>{row.assignedRate || 0}%</td><td><span className={statusClass(row.status === "active" ? "Active" : "Inactive")}>{row.status}</span></td><td><button type="button" className="s26-btn" disabled title={actionTitle(seller2026Permissions, "CATALOG_CATEGORY_READ", "catalog")}>Edit</button></td></tr>} />
          )}
        </Card>
        <Card title="Recommended Categories" hint="Rekomendasi aman dari adapter, kosong jika API belum menyediakan data.">
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
    return (
      <Shell section="taxonomy" mode={mode} storeContext={storeContext}>
        {catalogState?.isError ? <Card title="Attributes unavailable" hint="Live attributes could not load." actions={<button type="button" className="s26-btn" onClick={catalogState?.refetch}>Retry</button>} /> : null}
        <Card title="Attributes" hint="Variant/general attributes, usage count, values, dan status." actions={<button type="button" className="s26-btn primary" disabled title={actionTitle(seller2026Permissions, "CATALOG_ATTRIBUTE_READ", "catalog")}>+ Add Attribute</button>}>
          <div className="s26-grid four" style={{ marginBottom: 14 }}>
            <CatalogKpi label="Total Attributes" value={catalogData?.summary?.total || 0} />
            <CatalogKpi label="Active" value={catalogData?.summary?.active || 0} />
            <CatalogKpi label="Used in Products" value={catalogData?.summary?.usedInProducts || 0} />
            <CatalogKpi label="Variant Attributes" value={catalogData?.summary?.variantAttributes || 0} />
          </div>
          <div className="s26-filter-row">
            <input className="s26-search" aria-label="Search attributes" placeholder="Search attributes" value={searchValue} onChange={(event) => queryChange({ search: event.target.value, page: 1 })} />
            <select className="s26-control" aria-label="Filter attribute type" value={catalogQuery?.type || "all"} onChange={(event) => queryChange({ type: event.target.value, page: 1 })}><option value="all">All Types</option><option value="variant">Variant</option><option value="general">General</option></select>
            <select className="s26-control" aria-label="Filter attribute status" value={catalogQuery?.status || "all"} onChange={(event) => queryChange({ status: event.target.value, page: 1 })}><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          </div>
          {catalogState?.isLoading ? <p className="hint">Loading attributes...</p> : null}
          {!catalogState?.isLoading && attributeRows.length === 0 ? (
            <div className="s26-empty"><strong>No attributes available.</strong><p>Attribute definitions will appear once the catalog is configured.</p></div>
          ) : (
            <DataTable columns={["Attribute", "Type", "Usage", "Values", "Status", "Actions"]} rows={attributeRows} renderRow={(row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.type}</td><td>{row.usageCount}</td><td>{row.valuesCount}</td><td><span className={statusClass(row.status === "active" ? "Active" : "Inactive")}>{row.status}</span></td><td><Link className="s26-link" to={`${basePath}/catalog/attributes/${encodeURIComponent(String(row.id))}/values`}>Values</Link></td></tr>} />
          )}
        </Card>
        <div className="s26-grid two">
          <Card title="Insights" hint="Variant vs general summary for repeated catalog work." />
          <Card title="Mutation Safety" hint="Create, edit, delete, and bulk actions are disabled until lifecycle and permissions are fully wired." />
        </div>
      </Shell>
    );
  }

  if (isLive && catalogView === "attribute-values") {
    const valueRows = catalogData?.values || [];
    return (
      <Shell section="taxonomy" mode={mode} storeContext={storeContext}>
        {catalogState?.isError ? <Card title="Attribute values unavailable" hint="Attribute tidak ditemukan atau tidak tersedia untuk toko ini." actions={<button type="button" className="s26-btn" onClick={catalogState?.refetch}>Retry</button>} /> : null}
        <Card title={`Attributes > ${catalogData?.attribute?.name || "Attribute"}`} hint="Swatch, sort order, product usage, mapped SKU, dan status." actions={<button type="button" className="s26-btn primary" disabled title={actionTitle(seller2026Permissions, "CATALOG_ATTRIBUTE_READ", "catalog")}>+ Add Value</button>}>
          {!catalogState?.isLoading && !catalogData?.attribute ? <div className="s26-empty"><strong>Attribute tidak ditemukan atau tidak tersedia untuk toko ini.</strong><p>Pastikan attribute masih tersedia untuk store ini.</p></div> : null}
          {catalogData?.attribute ? <div className="s26-filter-row"><span className={statusClass(catalogData.attribute.status === "active" ? "Active" : "Inactive")}>{catalogData.attribute.status}</span><span className="s26-pill">{catalogData.attribute.type}</span><span className="s26-pill">{catalogData.attribute.usageCount} usage</span></div> : null}
          <div className="s26-filter-row">
            <input className="s26-search" aria-label="Search attribute values" placeholder="Search values" value={searchValue} onChange={(event) => queryChange({ search: event.target.value, page: 1 })} />
            <select className="s26-control" aria-label="Filter value status" value={catalogQuery?.status || "all"} onChange={(event) => queryChange({ status: event.target.value, page: 1 })}><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          </div>
          {catalogState?.isLoading ? <p className="hint">Loading values...</p> : null}
          {!catalogState?.isLoading && catalogData?.attribute && valueRows.length === 0 ? <div className="s26-empty"><strong>No values available.</strong><p>Attribute values will appear after they are configured.</p></div> : null}
          {valueRows.length ? <DataTable columns={["Sort", "Value", "Swatch", "Usage", "Mapped SKU", "Status", "Actions"]} rows={valueRows} renderRow={(row) => <tr key={row.id}><td>{row.sortOrder}</td><td>{row.label}</td><td>{row.swatch ? <span className="s26-swatch" style={{ background: row.swatch, width: 26, height: 26 }} /> : "-"}</td><td>{row.productUsage}</td><td>{row.mappedSkus}</td><td><span className={statusClass(row.status === "active" ? "Active" : "Inactive")}>{row.status}</span></td><td><button type="button" className="s26-btn" disabled title={actionTitle(seller2026Permissions, "CATALOG_ATTRIBUTE_READ", "catalog")}>Edit</button></td></tr>} /> : null}
        </Card>
        <div className="s26-grid two">
          <Card title="Value Insights" hint="Top values by usage and mapping quality will appear when data is available." />
          <Card title="Mutation Safety" hint="Create, edit, delete value actions are disabled until backend lifecycle is confirmed." />
        </div>
      </Shell>
    );
  }

  if (isLive && catalogView === "coupons") {
    const couponRows = catalogData?.coupons || [];
    return (
      <Shell section="taxonomy" mode={mode} storeContext={storeContext}>
        {catalogState?.isError ? <Card title="Coupons unavailable" hint="Live coupons could not load." actions={<button type="button" className="s26-btn" onClick={catalogState?.refetch}>Retry</button>} /> : null}
        <Card title="Coupons" hint="Store-scoped promo, validity, usage, dan status." actions={<button type="button" className="s26-btn primary" onClick={() => setCouponDrawerOpen(true)} disabled={!canUseAction(seller2026Permissions, "COUPON_CREATE", "catalog")} title={actionTitle(seller2026Permissions, "COUPON_CREATE", "catalog")}>Create Coupon</button>}>
          <div className="s26-grid four" style={{ marginBottom: 14 }}>
            <CatalogKpi label="Total Coupons" value={catalogData?.summary?.total || 0} />
            <CatalogKpi label="Active" value={catalogData?.summary?.active || 0} />
            <CatalogKpi label="Redemptions" value={catalogData?.summary?.redemptions || 0} />
            <CatalogKpi label="Discount Given" value={formatRupiah(catalogData?.summary?.discountGiven || 0)} />
          </div>
          <div className="s26-filter-row">
            <input className="s26-search" aria-label="Search coupons" placeholder="Search coupon code" value={searchValue} onChange={(event) => queryChange({ search: event.target.value, page: 1 })} />
            <select className="s26-control" aria-label="Filter coupon status" value={catalogQuery?.status || "all"} onChange={(event) => queryChange({ status: event.target.value, page: 1 })}><option value="all">All Status</option><option value="active">Active</option><option value="expired">Expired</option><option value="paused">Paused</option><option value="scheduled">Scheduled</option><option value="inactive">Inactive</option></select>
            <select className="s26-control" aria-label="Filter coupon type" value={catalogQuery?.type || "all"} onChange={(event) => queryChange({ type: event.target.value, page: 1 })}><option value="all">All Types</option><option value="percentage">Percentage</option><option value="fixed">Fixed</option><option value="free_shipping">Free Shipping</option></select>
          </div>
          {catalogState?.isLoading ? <p className="hint">Loading coupons...</p> : null}
          {!catalogState?.isLoading && couponRows.length === 0 ? <div className="s26-empty"><strong>No coupons available.</strong><p>Create coupon UI is available as a safe shell when permission allows it.</p></div> : null}
          {couponRows.length ? <DataTable columns={["Code", "Type", "Discount", "Minimum Spend", "Validity", "Usage", "Status", "Actions"]} rows={couponRows} renderRow={(row) => <tr key={row.id}><td><strong>{row.code}</strong></td><td>{row.type}</td><td>{row.discountLabel}</td><td>{formatRupiah(row.minimumSpend)}</td><td>{row.validityLabel}</td><td>{row.usageLabel}</td><td><span className={statusClass(row.status)}>{row.status}</span></td><td><button type="button" className="s26-btn" disabled title={actionTitle(seller2026Permissions, "COUPON_UPDATE", "catalog")}>Edit</button></td></tr>} /> : null}
        </Card>
        {couponDrawerOpen ? (
          <Card title="Create Coupon" hint="Coupon creation integration is pending.">
            <div className="s26-form-grid">
              <div className="s26-field"><label>Coupon Code</label><input readOnly value="" placeholder="STORE2026" /></div>
              <div className="s26-field"><label>Type</label><select disabled><option>Percentage</option><option>Fixed</option><option>Free Shipping</option></select></div>
              <div className="s26-field"><label>Discount</label><input readOnly value="" placeholder="10" /></div>
              <div className="s26-field"><label>Minimum Spend</label><input readOnly value="" placeholder="100000" /></div>
            </div>
            <p className="hint" style={{ marginTop: 14 }}>Coupon creation integration is pending.</p>
            <div className="s26-filter-row" style={{ marginTop: 16, marginBottom: 0 }}><button type="button" className="s26-btn" onClick={() => setCouponDrawerOpen(false)}>Close</button><button type="button" className="s26-btn primary" disabled title={actionTitle(seller2026Permissions, "COUPON_CREATE", "catalog")}>Create Coupon</button></div>
          </Card>
        ) : null}
      </Shell>
    );
  }

  return (
    <Shell section="taxonomy">
      <div className="s26-grid two">
        <Card title="Categories" hint="Category tree, product count, dan assignment rate." actions={<button className="s26-btn primary">+ Add Category</button>}>
          <DataTable columns={["Category", "Products", "Assigned"]} rows={categories} renderRow={(row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td></tr>} />
          <MiniChart />
        </Card>
        <Card title="Attributes" hint="Variant/general attributes dan usage count." actions={<button className="s26-btn primary">+ Add Attribute</button>}>
          <DataTable columns={["Attribute", "Type", "Usage", "Values", "Status"]} rows={attributes} renderRow={(row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td><span className={statusClass(row[4])}>{row[4]}</span></td></tr>} />
        </Card>
      </div>
      <div className="s26-grid two">
        <Card title="Attribute Values - Color" hint="Swatch, sort order, product mapping, dan active state.">
          <DataTable columns={["Sort", "Value", "Swatch", "Usage", "Mapped SKU", "Status"]} rows={[[1, "Red", "#ef4444", 512, 642, "Active"], [2, "Navy Blue", "#1e3a8a", 389, 498, "Active"], [3, "Black", "#111827", 365, 472, "Active"], [4, "White", "#ffffff", 321, 412, "Active"], [5, "Beige", "#f5deb3", 298, 376, "Active"]]} renderRow={(row) => <tr key={row[1]}><td>{row[0]}</td><td>{row[1]}</td><td><span className="s26-swatch" style={{ background: row[2], width: 26, height: 26 }} /></td><td>{row[3]}</td><td>{row[4]}</td><td><span className={statusClass(row[5])}>{row[5]}</span></td></tr>} />
        </Card>
        <Card title="Coupons" hint="Store-scoped promo dengan create drawer dan batas penggunaan." actions={<button className="s26-btn primary">Create Coupon</button>}>
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
        <Card title="All Orders / Fulfillment Queue" hint="Store-owned suborders, payment state, fulfillment state, and shipping movement." actions={<button type="button" className="s26-btn" disabled title={actionTitle(seller2026Permissions, "ORDER_READ", "orders")}>Export</button>}>
          <div className="s26-tabs">{tabs.map(([value, label]) => <button type="button" className={`s26-tab ${(operationsQuery?.status || "all") === value ? "active" : ""}`} key={value} onClick={() => queryChange({ status: value, page: 1 })}>{label}</button>)}</div>
          <div className="s26-filter-row">
            <input className="s26-search" aria-label="Search order, customer, suborder, or invoice" placeholder="Search order, customer, suborder, or invoice" value={searchValue} onChange={(event) => queryChange({ search: event.target.value, page: 1 })} />
            <select className="s26-control" aria-label="Filter order status" value={operationsQuery?.status || "all"} onChange={(event) => queryChange({ status: event.target.value, page: 1 })}><option value="all">All Status</option><option value="unpaid">Unpaid</option><option value="pending_confirmation">Pending Confirmation</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select>
            <input className="s26-control" type="date" aria-label="Date from" value={operationsQuery?.dateFrom || ""} onChange={(event) => queryChange({ dateFrom: event.target.value, page: 1 })} />
            <input className="s26-control" type="date" aria-label="Date to" value={operationsQuery?.dateTo || ""} onChange={(event) => queryChange({ dateTo: event.target.value, page: 1 })} />
            <button type="button" className="s26-btn" disabled title={disabledTodoTitle}>More Filters</button>
          </div>
          {operationsState?.isLoading ? <p className="hint">Loading orders...</p> : null}
          {!operationsState?.isLoading && rows.length === 0 ? <div className="s26-empty"><strong>Belum ada pesanan untuk toko ini.</strong><p>Pesanan store-scoped akan muncul setelah checkout berhasil.</p></div> : null}
          {rows.length ? <DataTable columns={["Date", "Invoice / Suborder", "Customer", "Phone", "Channel", "Shipping", "Total", "Status", "Actions"]} rows={rows} renderRow={(row) => <tr key={row.id}><td>{row.orderDate || "-"}</td><td><strong>{row.invoiceNo}</strong><div className="s26-sub">{row.suborderNo}</div></td><td>{row.customerName}</td><td>{row.customerPhone || "-"}</td><td>{row.channel || "-"}</td><td>{row.shippingMethod || "-"}</td><td>{formatRupiah(row.total)}</td><td><span className={statusClass(row.status)}>{row.status}</span></td><td><Link className="s26-link" to={`${basePath}/orders/${encodeURIComponent(String(row.id))}`}>Detail</Link></td></tr>} /> : null}
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
    return (
      <Shell section="operations" mode={mode} storeContext={storeContext}>
        {operationsState?.isError ? <Card title="Suborder unavailable" hint="Suborder tidak ditemukan atau tidak tersedia untuk toko ini." actions={<button type="button" className="s26-btn" onClick={operationsState?.refetch}>Retry</button>} /> : null}
        <Card title="Suborder Detail" hint="Customer, shipping, items, packing status, timeline, and internal notes." actions={<Link className="s26-btn" to={`${basePath}/orders`}>Back to Orders</Link>}>
          {operationsState?.isLoading ? <p className="hint">Loading suborder...</p> : null}
          {!operationsState?.isLoading && !detail?.suborder ? <div className="s26-empty"><strong>Suborder tidak ditemukan atau tidak tersedia untuk toko ini.</strong><p>Pastikan suborder masih berada dalam scope toko aktif.</p></div> : null}
          {detail?.suborder ? (
            <>
              <h3>{detail.suborder.suborderNo} <span className={statusClass(detail.suborder.status)}>{detail.suborder.status}</span></h3>
              <p className="hint">Invoice {detail.suborder.invoiceNo} - {detail.suborder.orderDate || "-"} - {detail.suborder.channel || "Store"}</p>
              <div className="s26-grid three" style={{ marginTop: 16 }}>
                <div className="s26-card soft"><h3>Customer & Shipping</h3><p className="hint">{detail.customer?.name || "Customer"}<br />{detail.customer?.phone || "-"}<br />{detail.customer?.address || "-"}</p>{detail.customer?.note ? <p className="hint">Note: {detail.customer.note}</p> : null}</div>
                <div className="s26-card soft"><h3>Shipping Method</h3><p className="hint">{detail.shipping?.method || "Not assigned"}<br />Tracking: {detail.shipping?.trackingNo || "-"}<br />Estimate: {detail.shipping?.estimate || "-"}</p></div>
                <div className="s26-card soft"><h3>Cost Summary</h3><p className="hint">Subtotal {formatRupiah(detail.totals.subtotal)}<br />Shipping {formatRupiah(detail.totals.shippingFee)}<br />Service {formatRupiah(detail.totals.serviceFee)}<br />Discount {formatRupiah(detail.totals.discount)}</p><strong>{formatRupiah(detail.totals.total)}</strong></div>
              </div>
              <div style={{ marginTop: 16 }}><DataTable columns={["Product", "Variant", "Qty", "Price", "Subtotal"]} rows={detail.items} renderRow={(row) => <tr key={row.id}><td>{row.productName}</td><td>{row.variantLabel || "-"}</td><td>{row.quantity}</td><td>{formatRupiah(row.price)}</td><td>{formatRupiah(row.subtotal)}</td></tr>} /></div>
              <div className="s26-filter-row" style={{ marginTop: 16 }}><button type="button" className="s26-btn primary" disabled title={actionTitle(seller2026Permissions, "ORDER_FULFILLMENT_UPDATE", "orders")}>Pack Order</button><button type="button" className="s26-btn" disabled title={actionTitle(seller2026Permissions, "ORDER_FULFILLMENT_UPDATE", "orders")}>Print Label</button><button type="button" className="s26-btn" disabled title={actionTitle(seller2026Permissions, "ORDER_FULFILLMENT_UPDATE", "orders")}>Mark Shipped</button><button type="button" className="s26-btn" disabled title={actionTitle(seller2026Permissions, "ORDER_FULFILLMENT_UPDATE", "orders")}>Update Tracking</button></div>
            </>
          ) : null}
        </Card>
        {detail?.suborder ? <div className="s26-grid two"><Card title="Shipment Timeline" hint={detail.timeline.length ? detail.timeline.map((item) => item.label).join(" / ") : "No shipment timeline yet."} /><Card title="Internal Notes" hint="Save internal note integration is pending." /></div> : null}
      </Shell>
    );
  }

  if (isLive && operationsView === "payment-review") {
    const rows = operationsData?.payments || [];
    const selected = operationsData?.selectedPayment || null;
    return (
      <Shell section="operations" mode={mode} storeContext={storeContext}>
        {operationsState?.isError ? <Card title="Payment review unavailable" hint="Live payment review data could not load." actions={<button type="button" className="s26-btn" onClick={operationsState?.refetch}>Retry</button>} /> : null}
        <div className="s26-grid two">
          <Card title="Payment Review" hint="Proof, customer reference, amount, and review status." actions={<button type="button" className="s26-btn" disabled title={actionTitle(seller2026Permissions, "PAYMENT_REVIEW_READ", "payments")}>Export</button>}>
            <div className="s26-grid four" style={{ marginBottom: 14 }}>
              <CatalogKpi label="Pending" value={operationsData?.summary?.totalPending || 0} />
              <CatalogKpi label="Amount" value={formatRupiah(operationsData?.summary?.totalAmount || 0)} />
              <CatalogKpi label="Approved" value={operationsData?.summary?.approvedToday || 0} />
              <CatalogKpi label="Rejected" value={operationsData?.summary?.rejectedToday || 0} />
            </div>
            <div className="s26-filter-row"><input className="s26-search" aria-label="Search payments" placeholder="Search payment, invoice, customer" value={searchValue} onChange={(event) => queryChange({ search: event.target.value, page: 1 })} /><select className="s26-control" aria-label="Filter payment status" value={operationsQuery?.status || "all"} onChange={(event) => queryChange({ status: event.target.value, page: 1 })}><option value="all">Pending Confirmation</option><option value="PAID">Paid</option><option value="REJECTED">Rejected</option><option value="UNPAID">Unpaid</option></select></div>
            {operationsState?.isLoading ? <p className="hint">Loading payment review...</p> : null}
            {!operationsState?.isLoading && rows.length === 0 ? <div className="s26-empty"><strong>Belum ada pembayaran yang perlu direview.</strong><p>Payment proof akan muncul jika ada pembayaran pending.</p></div> : null}
            {rows.length ? <DataTable columns={["Payment", "Invoice", "Customer", "Amount", "Method", "Status", "Risk"]} rows={rows} renderRow={(row) => <tr key={row.id}><td><strong>{row.paymentNo}</strong><div className="s26-sub">{row.receivedAt || "-"}</div></td><td>{row.invoiceNo || "-"}</td><td>{row.customerName || "-"}</td><td>{formatRupiah(row.amount)}</td><td>{row.method || "-"}</td><td><span className={statusClass(row.status)}>{row.status}</span></td><td>{row.riskLabel || "unknown"}</td></tr>} /> : null}
          </Card>
          <Card title="Selected Payment Detail" hint="Transaction breakdown, proof preview, risk checklist, and audit timeline." actions={<><button type="button" className="s26-btn success" disabled title={actionTitle(seller2026Permissions, "PAYMENT_REVIEW_READ", "payments")}>Mark Safe</button><button type="button" className="s26-btn danger" disabled title={actionTitle(seller2026Permissions, "PAYMENT_REVIEW_READ", "payments")}>Reject / Refund</button></>}>
            {selected ? (
              <>
                <div className="s26-card soft"><h3>Payment Proof</h3>{selected.proofUrl ? <img className="s26-logo-preview" src={selected.proofUrl} alt="" /> : <p className="hint">No payment proof image available.</p>}</div>
                <div className="s26-checklist">{selected.breakdown.map((item) => <div className="s26-check-row" key={item.label}><span>{item.label}</span><strong>{typeof item.value === "number" ? formatRupiah(item.value) : item.value}</strong></div>)}</div>
                <div className="s26-checklist">{selected.riskChecks.map((item) => <div className="s26-check-row" key={item.label}><span>{item.label}</span><span className={statusClass(item.status)}>{item.status}</span></div>)}</div>
              </>
            ) : <div className="s26-empty"><strong>No payment selected.</strong><p>Payment detail appears after pending payment data is available.</p></div>}
          </Card>
        </div>
      </Shell>
    );
  }

  if (isLive && operationsView === "payment-profile") {
    const profile = operationsData;
    return (
      <Shell section="operations" mode={mode} storeContext={storeContext}>
        {operationsState?.isError ? <Card title="Payment profile unavailable" hint="Live payment profile could not load." actions={<button type="button" className="s26-btn" onClick={operationsState?.refetch}>Retry</button>} /> : null}
        <Card title="Payment Profile" hint="QRIS, payout profile, verification documents, and admin review timeline." actions={<button type="button" className="s26-btn primary" disabled title={actionTitle(seller2026Permissions, "STORE_PAYMENT_PROFILE_SUBMIT", "payments")}>Submit / Update Profile</button>}>
          <div className="s26-grid four" style={{ marginBottom: 14 }}>
            <CatalogKpi label="Status" value={profile?.status || "INACTIVE"} />
            <CatalogKpi label="Available Balance" value={formatRupiah(profile?.balances?.available || 0)} />
            <CatalogKpi label="Hold Balance" value={formatRupiah(profile?.balances?.hold || 0)} />
            <CatalogKpi label="Last Payout" value={formatRupiah(profile?.balances?.lastPayoutAmount || 0)} />
          </div>
          {operationsState?.isLoading ? <p className="hint">Loading payment profile...</p> : null}
          <div className="s26-grid three">
            {(profile?.methods || []).length ? profile.methods.map((method) => <div className="s26-card soft" key={`${method.type}-${method.label}`}><h3>{method.label}</h3><p className="hint">{method.type}<br />{method.accountName || method.accountNoMasked || "No account detail"}</p><span className={statusClass(method.status)}>{method.status}</span></div>) : <div className="s26-empty"><strong>No payment method configured.</strong><p>QRIS or bank transfer details will appear after setup.</p></div>}
            <div className="s26-card soft"><h3>Payout Account</h3>{profile?.payoutAccount ? <p className="hint">{profile.payoutAccount.bankName}<br />{profile.payoutAccount.accountNoMasked}<br />{profile.payoutAccount.accountName}</p> : <p className="hint">No payout account configured.</p>}<span className={statusClass(profile?.payoutAccount?.status || "UNKNOWN")}>{profile?.payoutAccount?.status || "UNKNOWN"}</span></div>
          </div>
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
        <Card title="Payment Review" hint="Proof, risk check, breakdown, dan audit timeline." actions={<><button className="s26-btn success">Tandai Aman</button><button className="s26-btn danger">Tolak & Refund</button></>}>
          <div className="s26-grid three">
            <div className="s26-card soft"><h3>Payment Proof</h3><div style={{ padding: 28, borderRadius: 18, background: "#eff6ff", textAlign: "center" }}>m-BCA<br /><strong>Transfer Berhasil</strong><br />Rp 201.000</div></div>
            <div className="s26-card soft"><h3>Transaction Breakdown</h3><p className="hint">Total Order Rp 201.000<br />Payment Method Bank Transfer (BCA)<br />Match Score 95%</p></div>
            <div className="s26-card soft"><h3>Risk & Fraud Check</h3><p className="hint">Low Risk: pass<br />Nominal sesuai: pass<br />Rekening tujuan sesuai: pass</p></div>
          </div>
        </Card>
        <Card title="Payment Profile" hint="QRIS, bank transfer, payout, dokumen, dan verifikasi.">
          <div className="s26-grid three">
            <div className="s26-card soft"><h3>QRIS</h3><p className="hint">Terima pembayaran instan</p><span className={statusClass("Active")}>AKTIF</span></div>
            <div className="s26-card soft"><h3>Rekening Payout</h3><p className="hint">BCA 123-456-7890<br />TP PRENEURS BATIK STORE</p><span className={statusClass("Active")}>VERIFIED</span></div>
            <div className="s26-card soft"><h3>Dokumen</h3><p className="hint">KTP, NPWP, Rekening Koran, Selfie KTP</p><span className={statusClass("Pending")}>PENDING</span></div>
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
  mode,
  storeContext,
  seller2026Permissions,
}) {
  const { storeSlug } = useParams();
  const isLive = Boolean(teamData || teamState);
  const basePath = storeSlug ? `/seller/stores/${encodeURIComponent(storeSlug)}` : "/seller-2026";
  const queryChange = (next) => onTeamQueryChange?.(next);
  const searchValue = teamQuery?.search || "";

  if (isLive && teamView === "members") {
    const rows = teamData?.members || [];
    const summary = teamData?.summary || {};
    const roles = teamData?.roles || [];

    return (
      <Shell section="team" mode={mode} storeContext={storeContext}>
        {teamState?.isError ? <Card title="Team unavailable" hint="Live team members could not load." actions={<button type="button" className="s26-btn" onClick={teamState?.refetch}>Retry</button>} /> : null}
        <Card title="Team Members" hint="Role, permission summary, last active, and status." actions={<button type="button" className="s26-btn primary" disabled title={actionTitle(seller2026Permissions, "TEAM_INVITE", "team")}>+ Invite Member</button>}>
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
          {!teamState?.isLoading && rows.length === 0 ? <div className="s26-empty"><strong>Belum ada anggota tim untuk toko ini.</strong><p>Anggota dan undangan store-scoped akan muncul setelah ditambahkan.</p></div> : null}
          {rows.length ? <DataTable columns={["Member", "Role", "Permissions", "Last Active", "Status", "Actions"]} rows={rows} renderRow={(row) => <tr key={row.id}><td><div className="s26-product-cell"><span className="s26-thumb">{(row.name || "T")[0]}</span><div><strong>{row.name}</strong><div className="s26-sub">{row.email}</div></div></div></td><td>{row.roleName}</td><td>{row.permissionSummary}</td><td>{row.lastActiveAt || "-"}</td><td><span className={statusClass(row.status)}>{row.status}</span></td><td><div className="s26-row-actions"><Link className="s26-link" to={`${basePath}/team/${encodeURIComponent(String(row.id))}`}>Detail</Link><button type="button" className="s26-muted-action" disabled title={actionTitle(seller2026Permissions, "TEAM_REMOVE", "team")}>Remove</button></div></td></tr>} /> : null}
        </Card>
      </Shell>
    );
  }

  if (isLive && teamView === "member-detail") {
    const member = teamData?.member || null;
    return (
      <Shell section="team" mode={mode} storeContext={storeContext}>
        {teamState?.isError ? <Card title="Member unavailable" hint="Member tidak ditemukan atau tidak tersedia untuk toko ini." actions={<button type="button" className="s26-btn" onClick={teamState?.refetch}>Retry</button>} /> : null}
        <Card title="Member Detail / Role Editor" hint="Store-scoped permission toggles and access summary." actions={<Link className="s26-btn" to={`${basePath}/team`}>Back to Team</Link>}>
          {teamState?.isLoading ? <p className="hint">Loading member...</p> : null}
          {!teamState?.isLoading && !member ? <div className="s26-empty"><strong>Member tidak ditemukan atau tidak tersedia untuk toko ini.</strong><p>Pastikan member masih berada dalam scope toko aktif.</p></div> : null}
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
                <select id="s26-member-role" className="s26-control" value={member.roleName} disabled title={actionTitle(seller2026Permissions, "TEAM_ROLE_UPDATE", "team")}>
                  <option>{member.roleName}</option>
                  {(teamData?.roles || []).map((role) => <option key={role.id}>{role.name}</option>)}
                </select>
                <div style={{ marginTop: 14 }}>
                  {(teamData?.permissions || []).map((permission) => <div className="s26-toggle-row" key={permission.key}><span><strong>{permission.key}</strong><span className="s26-sub">{permission.description || permission.label}</span></span><span className={`s26-switch ${permission.enabled ? "on" : ""}`} title={actionTitle(seller2026Permissions, "TEAM_ROLE_UPDATE", "team")} /></div>)}
                </div>
                <button type="button" className="s26-btn primary" style={{ marginTop: 16 }} disabled title={actionTitle(seller2026Permissions, "TEAM_ROLE_UPDATE", "team")}>Save Changes</button>
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
            {!teamState?.isLoading && invitations.length === 0 ? <div className="s26-empty"><strong>Belum ada invitation untuk toko ini.</strong><p>Undangan pending akan muncul di sini.</p></div> : null}
            {invitations.length ? <DataTable columns={["Invitee", "Role", "Invited By", "Date", "Status", "Actions"]} rows={invitations} renderRow={(row) => <tr key={row.id}><td><strong>{row.name}</strong><div className="s26-sub">{row.email}</div></td><td>{row.roleName}</td><td>{row.invitedBy}</td><td>{row.invitedAt || "-"}</td><td><span className={statusClass(row.status)}>{row.status}</span></td><td><div className="s26-row-actions"><button type="button" className="s26-muted-action" disabled title={actionTitle(seller2026Permissions, "TEAM_INVITE", "team")}>Resend</button><button type="button" className="s26-muted-action" disabled title={actionTitle(seller2026Permissions, "TEAM_INVITE", "team")}>Cancel</button></div></td></tr>} /> : null}
          </Card>
          <Card title="Invite Member Form" hint="Team invitation integration is pending.">
            <div className="s26-form-grid">
              <label><span>Full Name</span><input className="s26-control" placeholder="Nama anggota" disabled /></label>
              <label><span>Email Address</span><input className="s26-control" placeholder="email@domain.com" disabled /></label>
              <label><span>Role</span><select className="s26-control" disabled><option>Select role</option></select></label>
              <label><span>Store Access</span><input className="s26-control" value="Current store only" disabled readOnly /></label>
            </div>
            <label style={{ display: "block", marginTop: 12 }}><span>Custom Message</span><textarea className="s26-control" rows={3} placeholder="Pesan undangan" disabled /></label>
            <button type="button" className="s26-btn primary" style={{ marginTop: 14 }} disabled title={actionTitle(seller2026Permissions, "TEAM_INVITE", "team")}>Send Invitation</button>
          </Card>
        </div>
        <Card title="Audit Log" hint="Team role, invitation, lifecycle, and permission activity.">
          <div className="s26-filter-row">
            <input className="s26-search" aria-label="Filter audit member" placeholder="Filter member or target" value={teamQuery?.member || ""} onChange={(event) => queryChange({ member: event.target.value, page: 1 })} />
            <select className="s26-control" aria-label="Filter audit action" value={teamQuery?.action || "all"} onChange={(event) => queryChange({ action: event.target.value, page: 1 })}><option value="all">All Actions</option><option value="MEMBER_INVITED">Member Invited</option><option value="ROLE_UPDATED">Role Updated</option><option value="MEMBER_REMOVED">Member Removed</option></select>
            <input className="s26-control" type="date" aria-label="Audit date from" value={teamQuery?.dateFrom || ""} onChange={(event) => queryChange({ dateFrom: event.target.value, page: 1 })} />
            <input className="s26-control" type="date" aria-label="Audit date to" value={teamQuery?.dateTo || ""} onChange={(event) => queryChange({ dateTo: event.target.value, page: 1 })} />
          </div>
          {!teamState?.isLoading && auditRows.length === 0 ? <div className="s26-empty"><strong>Belum ada invitation atau audit log untuk toko ini.</strong><p>Aktivitas team akan muncul setelah ada perubahan akses.</p></div> : null}
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

    return (
      <Shell section="team" mode={mode} storeContext={storeContext}>
        {teamState?.isError ? <Card title="Notifications unavailable" hint="Live notifications could not load." actions={<button type="button" className="s26-btn" onClick={teamState?.refetch}>Retry</button>} /> : null}
        <div className="s26-grid two">
          <Card title="Notifications Center" hint="Priority filters, categories, unread state, and operational alerts." actions={<button type="button" className="s26-btn" disabled title={actionTitle(seller2026Permissions, "NOTIFICATION_READ", "notifications")}>Mark all as read</button>}>
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
            {teamState?.isLoading ? <p className="hint">Loading notifications...</p> : null}
            {!teamState?.isLoading && rows.length === 0 ? <div className="s26-empty"><strong>Belum ada notifikasi untuk toko ini.</strong><p>Notifikasi store-scoped akan muncul saat ada event operasional.</p></div> : null}
            {rows.length ? <DataTable columns={["Notification", "Category", "Priority", "Time", "State"]} rows={rows} renderRow={(row) => <tr key={row.id}><td><strong>{row.title}</strong><div className="s26-sub">{row.message || "-"}</div></td><td>{row.category}</td><td><span className={statusClass(row.priority)}>{row.priority}</span></td><td>{row.createdAt || "-"}</td><td>{row.unread ? "Unread" : "Read"}</td></tr>} /> : null}
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
        <Card title="Team Members" hint="Role, permission summary, last active, dan status." actions={<button className="s26-btn primary">+ Invite Member</button>}>
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
        <Card title="Invitations & Audit Log" hint="Pending invitations dan log aktivitas penting.">
          <DataTable columns={["Time", "Member", "Action", "Target", "Details"]} rows={[["24 Mei 2026 09:41", "Budi Herman", "Updated Role", "Rizky Pratama", "Support Staff to Order Manager"], ["24 Mei 2026 09:15", "Dewi Lestari", "Invited Member", "Rina Oktaviani", "Payment Reviewer"], ["23 Mei 2026 16:32", "Siti Aisyah", "Created Product", "Batik Mega Mendung", "SKU: BAT-MEG-001"]]} renderRow={(row) => <tr key={row.join("-")}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>} />
        </Card>
        <Card title="Notifications Center" hint="Priority, kategori, unread badge, dan aksi mark all as read." actions={<button className="s26-btn">Mark all as read</button>}>
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
  catalogView = "overview",
  catalogData = null,
  catalogState = null,
  catalogQuery = null,
  onCatalogQueryChange = null,
  operationsView = "overview",
  operationsData = null,
  operationsState = null,
  operationsQuery = null,
  onOperationsQueryChange = null,
  teamView = "overview",
  teamData = null,
  teamState = null,
  teamQuery = null,
  onTeamQueryChange = null,
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

  if (isRestricted) {
    return (
      <Shell section={section} mode={mode} storeContext={storeContext}>
        <Seller2026RestrictedState
          title="Akses dibatasi"
          message={`Anda tidak memiliki permission ${requiredPermission} untuk melihat halaman ini.`}
        />
      </Shell>
    );
  }

  return (
    <Component
      mode={mode}
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
      catalogView={catalogView}
      catalogData={catalogData}
      catalogState={catalogState}
      catalogQuery={catalogQuery}
      onCatalogQueryChange={onCatalogQueryChange}
      operationsView={operationsView}
      operationsData={operationsData}
      operationsState={operationsState}
      operationsQuery={operationsQuery}
      onOperationsQueryChange={onOperationsQueryChange}
      teamView={teamView}
      teamData={teamData}
      teamState={teamState}
      teamQuery={teamQuery}
      onTeamQueryChange={onTeamQueryChange}
      seller2026Permissions={seller2026Permissions}
    />
  );
}

export default Seller2026Workspace;
