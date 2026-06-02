import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

const disabledTodoTitle = "Coming soon: backend integration is pending for this action.";

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

function StorefrontPage({ storefrontData = null, storefrontState = null, mode, storeContext }) {
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
              <button type="button" className="s26-btn primary" disabled title={disabledTodoTitle}>
                Simpan Perubahan
              </button>
            </div>
          }
        >
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
            {[
              ["Nama Toko", store.name || "Toko Kamu"],
              ["Slug / URL", store.slug || "store-slug"],
              ["Tagline", store.tagline || "Bangun brand dan jangkau lebih banyak pelanggan."],
              ["Email", store.email || "Belum diatur"],
              ["WhatsApp", store.whatsapp || "Belum diatur"],
              ["Telepon", store.phone || "Belum diatur"],
              ["Kategori Bisnis", store.businessCategory || "Storefront"],
              ["Subkategori", store.businessSubcategory || "General"],
              ["Asal Pengiriman", store.shippingOrigin || "Belum lengkap"],
            ].map(([label, value]) => <div className="s26-field" key={label}><label>{label}</label><input value={value} readOnly /></div>)}
            <div className="s26-field" style={{ gridColumn: "1 / -1" }}><label>Alamat Toko</label><input value={store.address || "Alamat toko belum lengkap."} readOnly /></div>
            <div className="s26-field" style={{ gridColumn: "1 / -1" }}><label>Tentang Toko</label><textarea value={store.description || "Bangun brand dan jangkau lebih banyak pelanggan."} readOnly /></div>
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
              <button type="button" className="s26-btn" disabled title={disabledTodoTitle}>Kelola Kebijakan</button>
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
          <button type="button" className="s26-btn primary" style={{ marginTop: 16 }} disabled={!liveReadiness.canSubmitForReview} title={disabledTodoTitle}>Submit untuk Review</button>
        </Card>
        <Card title="Theme & Customization" hint="Light/dark preference, warna brand, dan section microsite.">
          <div className="s26-tabs"><button type="button" className={`s26-tab ${theme.mode === "light" ? "active" : ""}`} disabled title={disabledTodoTitle}>Light</button><button type="button" className={`s26-tab ${theme.mode === "dark" ? "active" : ""}`} disabled title={disabledTodoTitle}>Dark</button></div>
          <p className="hint">Warna Brand</p><div className="s26-swatch-row" style={{ margin: "10px 0 18px" }}>{(theme.brandColors || ["#14532d", "#0f766e", "#a7f3d0", "#f59e0b", "#dc2626"]).map((color) => <span className="s26-swatch" key={color} style={{ background: color }} />)}</div>
          <p className="hint">Typography: {theme.typography || "Inter / System"}</p>
          {(theme.sections || []).map((section) => <div className="s26-toggle-row" key={section.key}><span>{section.label}</span><span className={`s26-switch ${section.enabled ? "on" : ""}`} title={disabledTodoTitle} /></div>)}
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
  const canCreate = productsData?.permissions?.canCreate !== false || !isLive;
  const canUpdate = productsData?.permissions?.canUpdate !== false || !isLive;
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
              <button type="button" className="s26-btn primary" disabled title="CATALOG_PRODUCT_CREATE permission is required.">+ Add Product</button>
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
                        {canUpdate ? <Link className="s26-link" to={editTo}>Edit</Link> : <span className="s26-muted-action">Edit</span>}
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
            <button type="button" className="s26-btn" disabled={isLive} title={disabledTodoTitle}>Save Draft</button>
            <button type="button" className="s26-btn primary" disabled={isLive} title={disabledTodoTitle}>Next: Media</button>
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

function TaxonomyPage() {
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

function OperationsPage() {
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

function TeamPage() {
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
  productsData = null,
  productsState = null,
  productsQuery = null,
  onProductsQueryChange = null,
  productDetailData = null,
  productDetailState = null,
  productEditorMode = null,
}) {
  const Component = useMemo(() => {
    if (section === "storefront") return StorefrontPage;
    if (section === "products") return ProductsPage;
    if (section === "taxonomy") return TaxonomyPage;
    if (section === "operations") return OperationsPage;
    if (section === "team") return TeamPage;
    return DashboardPage;
  }, [section]);
  return (
    <Component
      mode={mode}
      storeContext={storeContext}
      dashboardData={dashboardData}
      dashboardState={dashboardState}
      storefrontData={storefrontData}
      storefrontState={storefrontState}
      productsData={productsData}
      productsState={productsState}
      productsQuery={productsQuery}
      onProductsQueryChange={onProductsQueryChange}
      productDetailData={productDetailData}
      productDetailState={productDetailState}
      productEditorMode={productEditorMode}
    />
  );
}

export default Seller2026Workspace;
