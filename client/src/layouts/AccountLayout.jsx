import {
  NavLink,
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  Headphones,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Star,
  User,
  X,
} from "lucide-react";
import { useAccountAuth } from "../auth/authDomainHooks.js";
import { useCartStore } from "../store/cart.store.ts";
import { getStoreCustomization } from "../api/public/storeCustomizationPublic.ts";
import { normalizeDashboardSettingCopy } from "../utils/dashboardSettingCopy.js";
import { resolveAssetUrl } from "../lib/assetUrl.js";
import { fetchUserUnreadNotificationCount } from "../api/userNotifications.ts";
import ThemeToggle from "../components/store/ThemeToggle.jsx";
import "./account-layout-2026.css";

const getInitials = (value) => {
  const text = String(value || "").trim();
  if (!text) return "U";
  if (text.includes("@")) {
    return text.split("@")[0].slice(0, 2).toUpperCase();
  }
  const parts = text.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

function AccountNavList({ navItems, isCollapsed, onItemClick }) {
  return (
    <nav className="tp-account-nav" aria-label="Account navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/user/dashboard"}
          onClick={onItemClick}
          title={isCollapsed ? item.label : undefined}
          className={({ isActive }) =>
            `tp-account-nav-item ${isActive ? "tp-account-nav-item--active" : ""}`
          }
        >
          <item.Icon className="tp-account-nav-icon" aria-hidden="true" />
          <span className="tp-account-nav-label">{item.label}</span>
          {item.badge ? (
            <span className="tp-account-nav-badge" aria-label={`${item.badge} unread`}>
              {item.badge}
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}

function AccountHelpCard({ isId }) {
  return (
    <div className="tp-account-help-box">
      <div className="tp-account-help-content">
        <span className="tp-account-help-icon" aria-hidden="true">
          <Headphones />
        </span>
        <div className="tp-account-help-text">
          <strong>{isId ? "Butuh Bantuan?" : "Need Help?"}</strong>
          <span>{isId ? "Hub: +62821-8866-824" : "Hub: +62821-8866-824"}</span>
        </div>
      </div>
      <Link to="/contact-us?topic=account" className="tp-account-help-btn">
        {isId ? "Hubungi CS 24/7" : "Contact 24/7 CS"}
      </Link>
    </div>
  );
}

function AccountSidebar({
  user,
  navItems,
  isCollapsed,
  onToggleCollapse,
  onLogout,
  isLoggingOut,
  isId,
}) {
  const displayName = user?.name || user?.fullName || "Super Client";
  const email = user?.email || "superclient@local.dev";
  const initials = getInitials(displayName || email);
  const avatarSrc = resolveAssetUrl(user?.avatarUrl || user?.avatar || "");

  return (
    <aside
      className={`tp-account-sidebar ${
        isCollapsed ? "tp-account-sidebar--collapsed" : "tp-account-sidebar--expanded"
      }`}
    >
      <div className="tp-account-sidebar__header">
        <div className="tp-account-profile-summary">
          <div className="tp-account-avatar-wrap">
            <div className="tp-account-avatar">
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <span className="tp-account-status-dot" title="Active" />
          </div>
          <div className="tp-account-profile-info">
            <span className="tp-account-profile-name" title={displayName}>
              {displayName}
            </span>
            <span className="tp-account-profile-email" title={email}>
              {email}
            </span>
            <span className="tp-account-profile-badge">
              {isId ? "Member Aktif" : "Active Member"}
            </span>
          </div>
        </div>

        {/* Desktop Hamburger / Toggle Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="tp-account-hamburger-desktop"
          aria-label={
            isId
              ? isCollapsed
                ? "Perluas menu navigasi"
                : "Ciutkan menu navigasi"
              : isCollapsed
                ? "Expand navigation menu"
                : "Collapse navigation menu"
          }
          title={
            isId
              ? isCollapsed
                ? "Perluas Menu"
                : "Ciutkan Menu"
              : isCollapsed
                ? "Expand Menu"
                : "Collapse Menu"
          }
        >
          <Menu aria-hidden="true" />
        </button>
      </div>

      <AccountNavList navItems={navItems} isCollapsed={isCollapsed} />

      <AccountHelpCard isId={isId} />

      <div className="tp-account-theme-section">
        <span className="tp-account-theme-label">
          {isId ? "Tampilan" : "Appearance"}
        </span>
        <ThemeToggle variant="segmented" />
      </div>

      <button
        type="button"
        onClick={onLogout}
        disabled={isLoggingOut}
        className="tp-account-logout-btn"
        title={isId ? "Keluar dari Akun" : "Log out from account"}
      >
        <LogOut aria-hidden="true" />
        <span>
          {isId
            ? isLoggingOut
              ? "Sedang keluar..."
              : "Keluar"
            : isLoggingOut
              ? "Logging out..."
              : "Logout"}
        </span>
      </button>
    </aside>
  );
}

function AccountMobileDrawer({
  isOpen,
  onClose,
  user,
  navItems,
  onLogout,
  isLoggingOut,
  isId,
}) {
  const displayName = user?.name || user?.fullName || "Super Client";
  const email = user?.email || "superclient@local.dev";
  const initials = getInitials(displayName || email);
  const avatarSrc = resolveAssetUrl(user?.avatarUrl || user?.avatar || "");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="tp-account-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="tp-account-drawer" role="dialog" aria-modal="true">
        <div className="tp-account-drawer__head">
          <span className="tp-account-drawer__title">
            {isId ? "Menu Akun Pengguna" : "Account Menu"}
          </span>
          <button
            type="button"
            className="tp-account-drawer__close"
            onClick={onClose}
            aria-label={isId ? "Tutup menu" : "Close menu"}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="tp-account-drawer__body">
          <div className="tp-account-profile-summary mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="tp-account-avatar-wrap">
              <div className="tp-account-avatar">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={displayName} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <span className="tp-account-status-dot" />
            </div>
            <div className="tp-account-profile-info">
              <span className="tp-account-profile-name">{displayName}</span>
              <span className="tp-account-profile-email">{email}</span>
              <span className="tp-account-profile-badge">
                {isId ? "Member Aktif" : "Active Member"}
              </span>
            </div>
          </div>

          <AccountNavList
            navItems={navItems}
            isCollapsed={false}
            onItemClick={onClose}
          />

          <AccountHelpCard isId={isId} />

          <div className="tp-account-theme-section">
            <span className="tp-account-theme-label">
              {isId ? "Tampilan" : "Appearance"}
            </span>
            <ThemeToggle variant="segmented" />
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            disabled={isLoggingOut}
            className="tp-account-logout-btn"
          >
            <LogOut aria-hidden="true" />
            <span>
              {isId
                ? isLoggingOut
                  ? "Sedang keluar..."
                  : "Keluar"
                : isLoggingOut
                  ? "Logging out..."
                  : "Logout"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

export default function AccountLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useOutletContext() || {};
  const { logout } = useAccountAuth();
  const { i18n } = useTranslation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("tp_account_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [activeLang, setActiveLang] = useState(() => {
    const raw =
      localStorage.getItem("store_language") ||
      localStorage.getItem("i18nextLng") ||
      i18n.language ||
      "en";
    return String(raw).toLowerCase().startsWith("id") || String(raw).toLowerCase() === "indonesia"
      ? "id"
      : "en";
  });

  useEffect(() => {
    const handleSync = () => {
      const raw =
        localStorage.getItem("store_language") ||
        localStorage.getItem("i18nextLng") ||
        i18n.language ||
        "en";
      const next =
        String(raw).toLowerCase().startsWith("id") || String(raw).toLowerCase() === "indonesia"
          ? "id"
          : "en";
      setActiveLang(next);
    };

    const handleCustomLang = (e) => {
      if (e?.detail?.isoCode) {
        const next = String(e.detail.isoCode).toLowerCase().startsWith("id") ? "id" : "en";
        setActiveLang(next);
      } else {
        handleSync();
      }
    };

    i18n.on("languageChanged", handleSync);
    window.addEventListener("store_language_changed", handleCustomLang);
    window.addEventListener("storage", handleSync);

    return () => {
      i18n.off("languageChanged", handleSync);
      window.removeEventListener("store_language_changed", handleCustomLang);
      window.removeEventListener("storage", handleSync);
    };
  }, [i18n]);

  const isId = activeLang === "id";

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tp_account_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const unreadCountQuery = useQuery({
    queryKey: ["user", "notifications", "unread-count"],
    queryFn: () => fetchUserUnreadNotificationCount().catch(() => 0),
    staleTime: 30_000,
  });
  const unreadCount = Number(unreadCountQuery.data) || 0;

  const dashboardSettingQuery = useQuery({
    queryKey: ["store-customization", "dashboard-setting", isId ? "id" : "en"],
    queryFn: () => getStoreCustomization({ lang: isId ? "id" : "en", include: "dashboardSetting" }),
    staleTime: 60_000,
  });
  const dashboardSettingCopy = normalizeDashboardSettingCopy(
    dashboardSettingQuery.data?.customization?.dashboardSetting
  );

  const navItems = useMemo(
    () => [
      {
        to: "/user/dashboard",
        label: isId ? "Dashboard" : "Dashboard",
        Icon: LayoutDashboard,
      },
      {
        to: "/user/my-orders",
        label: isId ? "Pesanan Saya" : "My Orders",
        Icon: ClipboardList,
      },
      {
        to: "/user/notifications",
        label: isId ? "Notifikasi" : "Notifications",
        Icon: Bell,
        badge: unreadCount > 0 ? unreadCount : null,
      },
      {
        to: "/user/store-invitations",
        label: isId ? "Undangan Toko" : "Store Invitations",
        Icon: BriefcaseBusiness,
      },
      {
        to: "/user/my-reviews",
        label: isId ? "Ulasan Saya" : "My Reviews",
        Icon: Star,
      },
      {
        to: "/user/my-account",
        label: isId ? "Akun Saya" : "My Account",
        Icon: User,
      },
      {
        to: "/user/update-profile",
        label: isId ? "Perbarui Profil" : "Update Profile",
        Icon: User,
      },
      {
        to: "/user/shipping-address",
        label: isId ? "Alamat Pengiriman" : "Shipping Addresses",
        Icon: MapPin,
      },
      {
        to: "/user/change-password",
        label: isId ? "Ubah Kata Sandi" : "Change Password",
        Icon: KeyRound,
      },
    ],
    [isId, unreadCount]
  );

  const currentNavItem = useMemo(
    () => navItems.find((item) => item.to === location.pathname) || navItems[0],
    [navItems, location.pathname]
  );

  const isOrderDetailRoute = /^\/user\/my-orders\/[^/]+(?:\/payment)?$/.test(
    location.pathname
  );
  const usesStandaloneSurface =
    location.pathname === "/user/dashboard" ||
    location.pathname === "/user/my-orders" ||
    location.pathname === "/user/notifications" ||
    location.pathname === "/user/store-invitations" ||
    location.pathname === "/user/my-reviews" ||
    isOrderDetailRoute;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      if (typeof logout === "function") {
        await logout();
      }
    } finally {
      const cart = useCartStore.getState();
      cart.reset();
      cart.setMode("guest");
      try {
        sessionStorage.removeItem("cart_remote_ok");
        sessionStorage.removeItem("pending_cart_add_consumed");
      } catch {}
      navigate("/", { replace: true });
      setIsLoggingOut(false);
    }
  };

  const displayName = user?.name || user?.fullName || "Super Client";
  const initials = getInitials(displayName || user?.email || "User");
  const avatarSrc = resolveAssetUrl(user?.avatarUrl || user?.avatar || "");

  return (
    <section
      className={`tp-account-shell ${
        isCollapsed ? "tp-account-shell--collapsed" : "tp-account-shell--expanded"
      }`}
    >
      {/* Mobile Top Hamburger Bar (<1024px) */}
      <div className="tp-account-mobile-bar">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="tp-account-mobile-trigger"
          aria-label={isId ? "Buka Menu Akun" : "Open Account Menu"}
        >
          <Menu aria-hidden="true" />
          <span>{isId ? "Menu Akun" : "Account Menu"}</span>
          <span className="tp-account-mobile-active-tag">
            {currentNavItem.label}
          </span>
        </button>

        <div className="tp-account-mobile-user">
          <div className="tp-account-mobile-avatar">
            {avatarSrc ? (
              <img src={avatarSrc} alt={displayName} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <span className="tp-account-mobile-name">{displayName}</span>
        </div>
      </div>

      {/* Desktop Sidebar (>=1024px) */}
      <AccountSidebar
        user={user}
        navItems={navItems}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        isId={isId}
      />

      {/* Mobile Slide-Out Drawer */}
      <AccountMobileDrawer
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        user={user}
        navItems={navItems}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        isId={isId}
      />

      {/* Main Content View */}
      <main
        className={
          usesStandaloneSurface
            ? "min-w-0"
            : "min-w-0 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/80 shadow-sm"
        }
      >
        <Outlet context={{ user, dashboardSettingCopy, isId }} />
      </main>
    </section>
  );
}
