import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Layout/Sidebar.jsx";
import Navbar from "../Layout/Navbar.jsx";
import AdminSearchPalette from "../admin/AdminSearchPalette.jsx";
import ErrorBoundary from "../common/ErrorBoundary.js";
import useStoredBoolean from "../../hooks/useStoredBoolean.js";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import "../Layout/MainLayout.css";

const ADMIN_THEME_KEY = "admin_theme";
const ADMIN_SIDEBAR_COLLAPSED_KEY = "admin_sidebar_collapsed";

const readStoredTheme = () => {
  if (typeof window === "undefined") return null;
  const value = String(window.localStorage.getItem(ADMIN_THEME_KEY) || "").trim();
  return value === "dark" || value === "light" ? value : null;
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { resolvedTheme, setTheme: setGlobalTheme } = useTheme();
  const initialAdminThemeRef = useRef(readStoredTheme());

  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useStoredBoolean(
    ADMIN_SIDEBAR_COLLAPSED_KEY,
    false
  );

  // If there's a stored admin theme, apply it on mount
  useEffect(() => {
    const stored = initialAdminThemeRef.current;
    if (stored && stored !== resolvedTheme) {
      setGlobalTheme(stored);
    }
  }, [resolvedTheme, setGlobalTheme]);

  const isDark = resolvedTheme === "dark";
  const theme = resolvedTheme;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-admin-theme", theme);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setGlobalTheme(nextTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_THEME_KEY, nextTheme);
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") {
        return;
      }
      event.preventDefault();
      setSearchPaletteOpen(true);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className={`layout admin-shell ${isDark ? "admin-theme-dark dark" : "admin-theme-light"}`}
      data-admin-theme={theme}
      data-sidebar-collapsed={sidebarCollapsed ? "true" : "false"}
    >
      <Sidebar collapsed={isMobile ? false : sidebarCollapsed} mobileOpen={mobileSidebarOpen} />
      {isMobile && mobileSidebarOpen ? (
        <button
          type="button"
          className="admin-mobile-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}
      <div className="layout__content admin-content">
        <Navbar
          theme={theme}
          onToggleTheme={handleToggleTheme}
          isSidebarCollapsed={isMobile ? !mobileSidebarOpen : sidebarCollapsed}
          onToggleSidebar={() =>
            isMobile
              ? setMobileSidebarOpen((prev) => !prev)
              : setSidebarCollapsed((prev) => !prev)
          }
          isSearchPaletteOpen={searchPaletteOpen}
          onOpenSearchPalette={() => setSearchPaletteOpen(true)}
        />
        <main className="layout__page admin-page-shell">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <AdminSearchPalette
        open={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
      />
    </div>
  );
}
