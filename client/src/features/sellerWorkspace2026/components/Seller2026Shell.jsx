import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { navGroups, sellerStore } from "../../seller2026/seller2026Data.js";

// Make sure to import the CSS here if it's the root of the page
import "../../seller2026/Seller2026DesignSystem.css";

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
    active: "categories", // or coupons
    eyebrow: "Seller Workspace - Catalog Tools",
    title: "Categories, Attributes & Coupons",
    description: "Manage category assignment, attribute values, product mapping, and store-scoped promotions.",
  },
  operations: {
    active: "orders", // or payment-review, etc.
    eyebrow: "Seller Workspace - Operations",
    title: "Orders, Fulfillment & Payments",
    description: "Operational hub for suborders, fulfillment queue, payment reviews, and payment profile.",
  },
  team: {
    active: "members", // or audit, etc
    eyebrow: "Seller Workspace - Collaboration",
    title: "Team, Invitations, Audit Log & Notifications",
    description: "Manage members, roles, permissions, audit trails, invitations, and operational notifications.",
  },
};

const PREVIEW_ROUTES_BY_KEY = {
  dashboard: "/",
  "store-profile": "/store-profile",
  microsite: "/store-profile",
  products: "/catalog/products",
  categories: "/catalog/products", // fallback
  attributes: "/catalog/products", // fallback
  coupons: "/coupons",
  orders: "/orders",
  fulfillment: "/orders",
  "payment-review": "/payment-center",
  "payment-profile": "/payment-center",
  members: "/team",
  invitations: "/team",
  audit: "/team",
  notifications: "/",
  settings: "/store-profile",
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

export function Seller2026Shell({ section = "dashboard", mode = "standalone", storeContext = null, children, activeNavOverride = null }) {
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
  
  const isPreviewRoot = window.location.pathname.includes('/seller-2026-preview');
  
  const basePath = isPreviewRoot && storeSlug
    ? `/seller-2026-preview/${encodeURIComponent(storeSlug)}`
    : storeSlug
      ? `/seller/stores/${encodeURIComponent(storeSlug)}`
      : "/seller-2026";
      
  const routeMap = isPreviewRoot ? PREVIEW_ROUTES_BY_KEY : (storeSlug ? LIVE_ROUTES_BY_KEY : PREVIEW_ROUTES_BY_KEY);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("seller2026-theme", next);
      }
      return next;
    });
  };

  const activeNav = activeNavOverride || meta.active;

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
                  to={`${basePath}${routeMap[item.key] || "/"}`}
                  key={item.key}
                  className={`s26-nav-item ${item.key === activeNav ? "active" : ""}`}
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
          
          <div style={{ maxWidth: "1200px", padding: "24px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
            {children}
          </div>
          
        </main>
      </div>
    </div>
  );
}
