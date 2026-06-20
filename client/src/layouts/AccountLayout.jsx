import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Star,
  User,
} from "lucide-react";
import { useAccountAuth } from "../auth/authDomainHooks.js";
import { useCartStore } from "../store/cart.store.ts";
import { getStoreCustomization } from "../api/public/storeCustomizationPublic.ts";
import { normalizeDashboardSettingCopy } from "../utils/dashboardSettingCopy.js";
import { resolveAssetUrl } from "../lib/assetUrl.js";
import ThemeToggle from "../components/store/ThemeToggle.jsx";

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

function AccountSidebar({ user, onLogout, isLoggingOut, dashboardSettingCopy }) {
  const displayName = user?.name || user?.fullName || "Guest User";
  const email = user?.email || "No email provided";
  const initials = getInitials(user?.name || user?.email || "User");
  const avatarSrc = resolveAssetUrl(user?.avatarUrl || user?.avatar || "");
  const copy = dashboardSettingCopy || normalizeDashboardSettingCopy({});
  const navItems = [
    {
      to: "/user/dashboard",
      label: copy.dashboard.dashboardLabel,
      Icon: LayoutDashboard,
    },
    {
      to: "/user/my-orders",
      label: copy.dashboard.myOrderValue,
      Icon: ClipboardList,
    },
    { to: "/user/notifications", label: "Notifications", Icon: Bell },
    {
      to: "/user/store-invitations",
      label: "Store Invitations",
      Icon: BriefcaseBusiness,
    },
    { to: "/user/my-reviews", label: "My Review", Icon: Star },
    {
      to: "/user/my-account",
      label: "My Account",
      Icon: User,
    },
    {
      to: "/user/update-profile",
      label: copy.updateProfile.sectionTitleValue,
      Icon: User,
    },
    {
      to: "/user/shipping-address",
      label: "Shipping Addresses",
      Icon: MapPin,
    },
    {
      to: "/user/change-password",
      label: copy.updateProfile.changePasswordLabel,
      Icon: KeyRound,
    },
  ];
  return (
    <aside className="order-2 lg:order-1 lg:sticky lg:top-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <span className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-[var(--tp-accent)] dark:border-slate-900" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{email}</p>
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/user/dashboard"}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-[var(--tp-primary-soft)] text-[var(--tp-primary)] font-semibold dark:text-sky-200"
                    : "text-slate-600 hover:bg-[var(--tp-primary-soft)] hover:text-[var(--tp-primary)] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-200",
                ].join(" ")
              }
            >
              <item.Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Appearance
          </p>
          <ThemeToggle variant="segmented" />
        </div>

        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/70 dark:text-rose-300 dark:hover:bg-rose-950/40"
        >
          <LogOut className="h-4 w-4" />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}

export default function AccountLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useOutletContext() || {};
  const { logout } = useAccountAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dashboardSettingQuery = useQuery({
    queryKey: ["store-customization", "dashboard-setting", "en"],
    queryFn: () => getStoreCustomization({ lang: "en", include: "dashboardSetting" }),
    staleTime: 60_000,
  });
  const dashboardSettingCopy = normalizeDashboardSettingCopy(
    dashboardSettingQuery.data?.customization?.dashboardSetting
  );
  const isOrderDetailRoute = /^\/user\/my-orders\/[^/]+(?:\/payment)?$/.test(
    location.pathname
  );
  const usesStandaloneSurface =
    location.pathname === "/user/dashboard" ||
    location.pathname === "/user/my-orders" ||
    location.pathname === "/user/store-invitations" ||
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
      } catch {
        // ignore storage errors
      }
      navigate("/", { replace: true });
      setIsLoggingOut(false);
    }
  };
  return (
    <section className="account-shell grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <AccountSidebar
        user={user}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        dashboardSettingCopy={dashboardSettingCopy}
      />
      <main
        className={
          usesStandaloneSurface
            ? "order-1 min-w-0 lg:order-2"
            : "order-1 min-w-0 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/80 lg:order-2"
        }
      >
        <Outlet context={{ user }} />
      </main>
    </section>
  );
}
