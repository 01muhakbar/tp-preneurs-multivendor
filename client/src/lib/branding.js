import { resolveAssetUrl } from "./assetUrl.js";

const svgToDataUri = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const createSquareFallbackLogo = (label) =>
  svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10b981" />
          <stop offset="100%" stop-color="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#brand-grad)" />
      <rect x="18" y="18" width="84" height="84" rx="22" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)" />
      <text x="60" y="71" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="3">
        TP
      </text>
    </svg>
  `);

export const CANONICAL_CLIENT_LOGO_URL =
  "/uploads/branding/branding-client-1793540221126-gw9vyrd.png";

export const BRANDING_CACHE_KEY = "tp_store_branding_cache";
export const STORE_SETTINGS_CACHE_KEY = "tp_store_settings_cache";

export const getCachedStoreBranding = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BRANDING_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const setCachedStoreBranding = (branding) => {
  if (typeof window === "undefined" || !branding || typeof branding !== "object") return;
  try {
    window.localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(branding));
  } catch {
    // ignore storage quota errors
  }
};

export const getCachedClientLogoUrl = () => {
  const cached = getCachedStoreBranding();
  return cached?.clientLogoUrl || CANONICAL_CLIENT_LOGO_URL;
};

export const getCachedStoreSettings = () => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(STORE_SETTINGS_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
};

export const setCachedStoreSettings = (settings) => {
  if (typeof window === "undefined" || !settings || typeof settings !== "object") return;
  try {
    window.localStorage.setItem(STORE_SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage quota errors
  }
};

export const DEFAULT_BRANDING_LOGOS = {
  client: CANONICAL_CLIENT_LOGO_URL,
  admin: createSquareFallbackLogo("Admin Workspace logo"),
  seller: createSquareFallbackLogo("Seller Workspace logo"),
};

export const getClientLogoUrl = (logoUrl) =>
  resolveAssetUrl(logoUrl) || resolveAssetUrl(CANONICAL_CLIENT_LOGO_URL);

export const getWorkspaceLogoUrl = (workspaceKey, logoUrl) =>
  resolveAssetUrl(logoUrl) || DEFAULT_BRANDING_LOGOS[workspaceKey] || DEFAULT_BRANDING_LOGOS.admin;

export const hasCustomBrandingLogo = (logoUrl) => Boolean(String(logoUrl || "").trim());

export const getWorkspaceBrandingKeyFromPathname = (pathname = "") =>
  String(pathname || "").startsWith("/seller") ? "seller" : "admin";

export const getWorkspaceFaviconUrl = (pathname = "", branding = {}, fallbackUrl = "") => {
  const workspaceKey = getWorkspaceBrandingKeyFromPathname(pathname);
  const logoUrl =
    workspaceKey === "seller" ? branding?.sellerLogoUrl : branding?.adminLogoUrl;

  return resolveAssetUrl(logoUrl) || getWorkspaceLogoUrl(workspaceKey, logoUrl) || fallbackUrl;
};
