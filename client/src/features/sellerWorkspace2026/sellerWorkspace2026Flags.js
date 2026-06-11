const isEnabled = (value) => String(value || "").trim().toLowerCase() === "true";

export const isSellerWorkspace2026Enabled = () =>
  isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_ENABLED);

const isDomainEnabled = (envKey) =>
  isSellerWorkspace2026Enabled() && isEnabled(import.meta.env[envKey]);

export const sellerWorkspace2026Flags = {
  get enabled() {
    return isSellerWorkspace2026Enabled();
  },
  get dashboardEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_DASHBOARD_ENABLED);
  },
  get catalogEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED);
  },
  get productDetailEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_PRODUCT_DETAIL_ENABLED);
  },
  get authoringEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_AUTHORING_ENABLED);
  },
  get storeProfileEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_STORE_PROFILE_ENABLED);
  },
  get categoriesEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_CATEGORIES_ENABLED);
  },
  get attributesEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_ATTRIBUTES_ENABLED);
  },
  get attributeValuesEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_ATTRIBUTE_VALUES_ENABLED);
  },
  get ordersEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED);
  },
  get couponsEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED);
  },
  get teamEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED);
  },
  get teamAuditEnabled() {
    return (
      isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_TEAM_AUDIT_ENABLED) ||
      isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED)
    );
  },
  get paymentCenterEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED);
  },
  get paymentProfileEnabled() {
    return (
      isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_PAYMENT_PROFILE_ENABLED) ||
      isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED)
    );
  },
  get paymentReviewEnabled() {
    return (
      isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_PAYMENT_REVIEW_ENABLED) ||
      isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED)
    );
  },
  get notificationsEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_NOTIFICATIONS_ENABLED);
  },
  get analyticsEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_ANALYTICS_ENABLED);
  },
  get analyticsSyncEnabled() {
    return isEnabled(import.meta.env.VITE_SELLER_WORKSPACE_2026_ANALYTICS_SYNC_ENABLED);
  },
};

export const isSeller2026DashboardProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_DASHBOARD_ENABLED");

export const isSeller2026StoreProfileProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_STORE_PROFILE_ENABLED");

export const isSeller2026CatalogProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED");

export const isSeller2026ProductDetailProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_PRODUCT_DETAIL_ENABLED");

export const isSeller2026AuthoringProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_AUTHORING_ENABLED");

export const isSeller2026CategoriesProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_CATEGORIES_ENABLED");

export const isSeller2026AttributesProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_ATTRIBUTES_ENABLED");

export const isSeller2026AttributeValuesProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_ATTRIBUTE_VALUES_ENABLED");

export const isSeller2026CouponsProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED");

export const isSeller2026OrdersProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED");

export const isSeller2026PaymentCenterProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED");

export const isSeller2026PaymentProfileProductionEnabled = () =>
  isSellerWorkspace2026Enabled() && sellerWorkspace2026Flags.paymentProfileEnabled;

export const isSeller2026PaymentReviewProductionEnabled = () =>
  isSellerWorkspace2026Enabled() && sellerWorkspace2026Flags.paymentReviewEnabled;

export const isSeller2026TeamProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED");

export const isSeller2026TeamAuditProductionEnabled = () =>
  isSellerWorkspace2026Enabled() && sellerWorkspace2026Flags.teamAuditEnabled;

export const isSeller2026NotificationsProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_NOTIFICATIONS_ENABLED");

export const isSeller2026AnalyticsProductionEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_ANALYTICS_ENABLED");

export const isSeller2026AnalyticsSyncPreviewEnabled = () =>
  isDomainEnabled("VITE_SELLER_WORKSPACE_2026_ANALYTICS_SYNC_ENABLED");

export const isSeller2026AnalyticsSyncProductionEnabled =
  isSeller2026AnalyticsSyncPreviewEnabled;
