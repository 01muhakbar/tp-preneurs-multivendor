import Seller2026Workspace from "../../features/sellerWorkspace2026/Seller2026Workspace.jsx";

export function Seller2026DashboardPage() {
  return <Seller2026Workspace section="dashboard" />;
}

export function Seller2026StorefrontPage() {
  return <Seller2026Workspace section="storefront" />;
}

/** Explicit alias for /seller-2026-preview/:storeSlug/store-profile.
 *  Uses section="storefront" which maps to useSellerWorkspace2026StoreProfile in the preview wrapper.
 */
export function Seller2026StoreProfilePage({ productionMode = false }) {
  return <Seller2026Workspace section="storefront" productionMode={productionMode} />;
}

export function Seller2026ProductsPage() {
  return <Seller2026Workspace section="products" />;
}

export function Seller2026CategoriesPage() {
  return <Seller2026Workspace section="taxonomy" />;
}

export function Seller2026AttributesPage() {
  return <Seller2026Workspace section="taxonomy" />;
}

export function Seller2026AttributeValuesPage() {
  return <Seller2026Workspace section="taxonomy" />;
}

export function Seller2026CouponsPage() {
  return <Seller2026Workspace section="taxonomy" />;
}

export function Seller2026OrdersPage() {
  return <Seller2026Workspace section="operations" />;
}

export function Seller2026OrderDetailPage() {
  return <Seller2026Workspace section="operations" />;
}

export function Seller2026PaymentReviewPage() {
  return <Seller2026Workspace section="operations" />;
}

export function Seller2026PaymentProfilePage() {
  return <Seller2026Workspace section="operations" />;
}

export function Seller2026TeamPage() {
  return <Seller2026Workspace section="team" />;
}

export function Seller2026MemberDetailPage() {
  return <Seller2026Workspace section="team" />;
}

export function Seller2026InvitationsPage() {
  return <Seller2026Workspace section="team" />;
}

export function Seller2026AuditLogPage() {
  return <Seller2026Workspace section="team" />;
}

export function Seller2026NotificationsPage() {
  return <Seller2026Workspace section="team" />;
}

export default Seller2026DashboardPage;

export * from "./Seller2026OrdersPreviewPage.jsx";

export * from "./Seller2026PaymentCenterPreviewPage.jsx";

export * from "./Seller2026CouponsPreviewPage.jsx";

export * from "./Seller2026TeamPreviewPage.jsx";

export * from "./Seller2026AnalyticsSyncPreviewPage.jsx";

export { default as Seller2026LiveReviewsPage } from "./Seller2026LiveProductReviewsPage.jsx";
