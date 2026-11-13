import useStoreBranding from "../../hooks/useStoreBranding.js";
import { getWorkspaceLogoUrl } from "../../lib/branding.js";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import "./WorkspaceSidebarBrand.css";

export default function WorkspaceSidebarBrand({
  brandName = "TP PRENEURS",
  workspaceLabel,
  workspaceKey = "admin",
  collapsed = false,
  className = "",
  isDark: isDarkProp,
}) {
  const { branding } = useStoreBranding();
  const themeContext = useTheme();

  const isDark =
    typeof isDarkProp === "boolean"
      ? isDarkProp
      : themeContext?.resolvedTheme === "dark" ||
        (typeof document !== "undefined" &&
          (document.documentElement.classList.contains("dark") ||
            document.body?.classList.contains("dark")));

  const logoUrl =
    workspaceKey === "seller" ? branding.sellerLogoUrl : branding.adminLogoUrl;
  const logoSrc = getWorkspaceLogoUrl(workspaceKey, logoUrl);
  const resolvedBrandName = String(branding.workspaceBrandName || brandName).trim() || brandName;

  return (
    <div
      className={`workspace-sidebar-brand ${isDark ? "is-dark" : "is-light"} ${collapsed ? "is-collapsed" : ""} ${className}`.trim()}
      data-theme={isDark ? "dark" : "light"}
    >
      <span className="workspace-sidebar-brand__mark">
        <img
          src={logoSrc}
          alt={`${resolvedBrandName} ${workspaceLabel} logo`}
          className="workspace-sidebar-brand__image"
        />
      </span>
      <div className="workspace-sidebar-brand__copy">
        <span className="workspace-sidebar-brand__title">{resolvedBrandName}</span>
        <span className="workspace-sidebar-brand__subtitle">{workspaceLabel}</span>
      </div>
    </div>
  );
}
