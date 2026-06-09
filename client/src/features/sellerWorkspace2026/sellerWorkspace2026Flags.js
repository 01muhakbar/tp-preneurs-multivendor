export const sellerWorkspace2026Flags = {
  enabled: import.meta.env.VITE_SELLER_WORKSPACE_2026_ENABLED === 'true',
  dashboardEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_DASHBOARD_ENABLED === 'true',
  catalogEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED === 'true',
  productDetailEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_PRODUCT_DETAIL_ENABLED === 'true',
  authoringEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_AUTHORING_ENABLED === 'true',
  storeProfileEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_STORE_PROFILE_ENABLED === 'true',
  categoriesEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_CATEGORIES_ENABLED === 'true',
  attributesEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_ATTRIBUTES_ENABLED === 'true',
  ordersEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED === 'true',
  couponsEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED === 'true',
  teamEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED === 'true',
  paymentCenterEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED === 'true',
  paymentProfileEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_PAYMENT_PROFILE_ENABLED === 'true' ||
    import.meta.env.VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED === 'true',
  paymentReviewEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_PAYMENT_REVIEW_ENABLED === 'true' ||
    import.meta.env.VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED === 'true',
  notificationsEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_NOTIFICATIONS_ENABLED === 'true',
  analyticsSyncEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_ANALYTICS_SYNC_ENABLED === 'true',
  analyticsEnabled:
    import.meta.env.VITE_SELLER_WORKSPACE_2026_ANALYTICS_ENABLED === 'true',
};

export function isSeller2026DashboardProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.dashboardEnabled
  );
}

export function isSeller2026CatalogProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.catalogEnabled
  );
}

export function isSeller2026ProductDetailProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.productDetailEnabled
  );
}

export function isSeller2026AuthoringProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.authoringEnabled
  );
}

export function isSeller2026StoreProfileProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.storeProfileEnabled
  );
}

export function isSeller2026CategoriesProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.categoriesEnabled
  );
}

export function isSeller2026AttributesProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.attributesEnabled
  );
}

export function isSeller2026OrdersProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.ordersEnabled
  );
}

export function isSeller2026CouponsProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.couponsEnabled
  );
}

export function isSeller2026TeamProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.teamEnabled
  );
}

export function isSeller2026PaymentCenterProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.paymentCenterEnabled
  );
}

export function isSeller2026AnalyticsProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.analyticsEnabled
  );
}

export function isSeller2026PaymentProfileProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.paymentProfileEnabled
  );
}

export function isSeller2026PaymentReviewProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.paymentReviewEnabled
  );
}

export function isSeller2026NotificationsProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.notificationsEnabled
  );
}

export function isSeller2026AnalyticsSyncProductionEnabled() {
  return (
    sellerWorkspace2026Flags.enabled &&
    sellerWorkspace2026Flags.analyticsSyncEnabled
  );
}
