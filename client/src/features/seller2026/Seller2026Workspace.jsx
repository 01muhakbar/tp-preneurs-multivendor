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

function StorefrontPage() {
  return (
    <Shell section="storefront">
      <div className="s26-grid two">
        <Card title="Store Profile" hint="Identitas, kontak, alamat, sosial media, dan policy toko." actions={<button className="s26-btn primary">Simpan Perubahan</button>}>
          <div className="s26-grid two">
            <div className="s26-card soft"><h3>Logo Toko</h3><div className="s26-logo" style={{ marginTop: 12 }}>OS</div><p className="hint">PNG/JPG maks 2MB</p></div>
            <div className="s26-hero" style={{ minHeight: 160 }}><div><h2 style={{ fontSize: 28 }}>Alami. Sehat.<br />Untuk Hidup Lebih Baik.</h2><p>Cover banner rekomendasi 1920x600px.</p></div></div>
          </div>
          <div className="s26-form-grid" style={{ marginTop: 16 }}>
            {[["Nama Toko", "Oase Sehat Official Store"], ["Slug / URL", "oase-sehat"], ["Email", "halo@oasesehat.com"], ["WhatsApp", "+62 812-3456-7890"], ["Kategori Bisnis", "Kesehatan & Kecantikan"], ["Asal Pengiriman", "Jakarta, DKI Jakarta"]].map(([label, value]) => <div className="s26-field" key={label}><label>{label}</label><input defaultValue={value} /></div>)}
            <div className="s26-field" style={{ gridColumn: "1 / -1" }}><label>Tentang Toko</label><textarea defaultValue="Oase Sehat hadir untuk memberikan solusi kesehatan alami berkualitas untuk keluarga Indonesia." /></div>
          </div>
        </Card>
        <Card title="Microsite Preview" hint="Preview desktop dan mobile storefront publik." actions={<button className="s26-btn">Buka Microsite</button>}>
          <div className="s26-hero"><div><h2>Alami. Sehat.<br />Untuk Hidup Lebih Baik.</h2><p>Produk pilihan terbaik untuk keluarga sehat Indonesia.</p><button className="s26-btn primary">Belanja Sekarang</button></div><div style={{ fontSize: 82 }}>Leaf</div></div>
          <div className="s26-product-card-grid" style={{ marginTop: 16 }}>
            {["Kunyit Ekstrak", "Madu Hutan", "Vitamin D3", "Teh Daun Sirsak"].map((name) => <div className="s26-store-product" key={name}><div className="image">TP</div><div className="body"><strong>{name}</strong><p className="hint">Rp 95.000</p></div></div>)}
          </div>
        </Card>
      </div>
      <div className="s26-grid two">
        <Card title="Store Readiness" hint="Checklist siap launch dan verifikasi.">
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}><div className="s26-progress"><span>78%</span></div><div><strong>Siap Diluncurkan</strong><p className="hint">8 dari 12 langkah selesai.</p></div></div>
          <div className="s26-checklist">{readiness.map((item) => <div className="s26-check-row" key={item.label}><span>{item.label}</span><span className={statusClass(item.status)}>{item.status}</span></div>)}</div>
          <button className="s26-btn primary" style={{ marginTop: 16 }}>Submit untuk Review</button>
        </Card>
        <Card title="Theme & Customization" hint="Light/dark preference, warna brand, dan section microsite.">
          <div className="s26-tabs"><button className="s26-tab active">Light</button><button className="s26-tab">Dark</button></div>
          <p className="hint">Warna Brand</p><div className="s26-swatch-row" style={{ margin: "10px 0 18px" }}>{["#14532d", "#0f766e", "#a7f3d0", "#f59e0b", "#dc2626"].map((color) => <span className="s26-swatch" key={color} style={{ background: color }} />)}</div>
          {["Hero Banner", "Kategori Populer", "Produk Unggulan", "Keunggulan Toko", "Testimoni", "Tentang Kami"].map((section, index) => <div className="s26-toggle-row" key={section}><span>{section}</span><span className={`s26-switch ${index !== 5 ? "on" : ""}`} /></div>)}
        </Card>
      </div>
    </Shell>
  );
}

function ProductsPage() {
  return (
    <Shell section="products">
      <div className="s26-grid operations">
        <Card title="Products List" hint="Search, filter, bulk action, status, SKU, stok, dan performa produk." actions={<button className="s26-btn primary">+ Add Product</button>}>
          <div className="s26-tabs">{["All Products 1.248", "Draft 142", "Submitted 86", "Active 876", "Needs Revision 27", "Inactive 117"].map((tab, idx) => <button className={`s26-tab ${idx === 0 ? "active" : ""}`} key={tab}>{tab}</button>)}</div>
          <div className="s26-filter-row"><button className="s26-btn">All Categories</button><button className="s26-btn">All Status</button><button className="s26-btn">All Stock</button><button className="s26-btn">More Filters</button></div>
          <DataTable columns={["Product", "SKU", "Stock", "Price", "Sales", "Views", "Status", "Updated"]} rows={products} renderRow={(row) => <tr key={row.sku}><td><div className="s26-product-cell"><span className="s26-thumb">{row.name[0]}</span><div><strong>{row.name}</strong><div className="s26-sub">{row.category}</div></div></div></td><td>{row.sku}</td><td>{row.stock}</td><td>{row.price}</td><td>{row.sales}</td><td>{row.views}</td><td><span className={statusClass(row.status)}>{row.status}</span></td><td>{row.updated}</td></tr>} />
        </Card>
        <Card title="Product Create / Edit" hint="Multi-step product authoring dengan draft-first workflow.">
          <div className="s26-stepper">{["Basic", "Media", "Categories", "Variants", "Pricing", "Inventory", "Shipping", "SEO", "Publish"].map((s, i) => <span className={`s26-step ${i === 0 ? "active" : ""}`} key={s}>{s}</span>)}</div>
          <div className="s26-form-grid">
            <div className="s26-field"><label>Product Name *</label><input defaultValue="Hijab Voal Premium" /></div>
            <div className="s26-field"><label>SKU *</label><input defaultValue="HJP-VOAL-01-BLK" /></div>
            <div className="s26-field"><label>Product Type</label><select defaultValue="Physical"><option>Physical</option><option>Digital</option><option>Service</option></select></div>
            <div className="s26-field"><label>Brand</label><input defaultValue="Butik Nusantara" /></div>
            <div className="s26-field" style={{ gridColumn: "1 / -1" }}><label>Description</label><textarea defaultValue="Hijab voal premium berkualitas tinggi dengan jahitan rapi dan finishing yang lembut di kulit." /></div>
          </div>
          <button className="s26-btn primary" style={{ marginTop: 16 }}>Next: Media</button>
        </Card>
      </div>
      <Card title="Product Detail / Preview" hint="Gallery, performance, variants, revision notes, dan publish history.">
        <div className="s26-grid three">
          <div className="s26-card soft"><div style={{ minHeight: 260, borderRadius: 18, background: "radial-gradient(circle, #e0e7ff, #fff)", display: "grid", placeItems: "center", fontSize: 82 }}>TP</div><button className="s26-btn" style={{ width: "100%", marginTop: 12 }}>View on Storefront</button></div>
          <div><h3>Hijab Voal Premium <span className={statusClass("Active")}>Active</span></h3><p className="hint">SKU: HJP-VOAL-01-BLK</p><div className="s26-grid two" style={{ marginTop: 16 }}>{[["Price", "89.000"], ["Stock", "120"], ["Sold", "1.248"], ["Views", "8.432"]].map(([a, b]) => <div className="s26-card soft" key={a}><p className="hint">{a}</p><strong>{b}</strong></div>)}</div><p className="hint" style={{ marginTop: 14 }}>Category: Fashion / Hijab & Kerudung. Tags: Hijab, Voal, Premium, Women.</p></div>
          <div><Card title="Revision Notes" hint="Marketplace Admin meminta tambahan bahan dan foto jahitan." /><Card title="Publish History" hint="Published / Submitted / Revision Requested / Draft Created" className="soft" /></div>
        </div>
      </Card>
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
    />
  );
}

export default Seller2026Workspace;
