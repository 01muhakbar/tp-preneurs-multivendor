import { Route } from "react-router-dom";
import Seller2026ProductCatalogPreviewPage from "../pages/seller2026/Seller2026ProductCatalogPreviewPage.jsx";
import Seller2026ProductAuthoringPreviewPage from "../pages/seller2026/Seller2026ProductAuthoringPreviewPage.jsx";
import { Seller2026ProductReviewDetailPreviewPage } from "../pages/seller2026/Seller2026ProductReviewDetailPreviewPage.jsx";
import {
  Seller2026AttributeValuesPage,
  Seller2026AttributesPage,
  Seller2026AuditLogPage,
  Seller2026CategoriesPage,
  Seller2026CouponsPage,
  Seller2026DashboardPage,
  Seller2026InvitationsPage,
  Seller2026MemberDetailPage,
  Seller2026NotificationsPage,
  Seller2026OrderDetailPage,
  Seller2026OrdersPage,
  Seller2026PaymentProfilePage,
  Seller2026PaymentReviewPage,
  Seller2026ProductsPage,
  Seller2026StoreProfilePage,
  Seller2026StorefrontPage,
  Seller2026TeamPage,
} from "../pages/seller2026/Seller2026Pages.jsx";

/**
 * Optional standalone preview routes.
 *
 * Usage inside client/src/App.jsx Routes:
 *   {seller2026PreviewRoutes}
 *
 * These routes are intentionally outside /seller/stores/:storeSlug so your live
 * SellerLayout and API-bound pages remain untouched while the slicing is reviewed.
 */

import { Seller2026OrdersPreviewPage } from "../pages/seller2026/Seller2026Pages.jsx";
import { Seller2026PaymentCenterPreviewPage } from "../pages/seller2026/Seller2026Pages.jsx";
import { Seller2026CouponsPreviewPage } from "../pages/seller2026/Seller2026Pages.jsx";
import { Seller2026TeamPreviewPage } from "../pages/seller2026/Seller2026Pages.jsx";
import { Seller2026AnalyticsSyncPreviewPage } from "../pages/seller2026/Seller2026Pages.jsx";

export const seller2026PreviewRoutes = (
  <Route path="/seller-2026-preview/:storeSlug">
    {/* Overview / Dashboard — wired to useSellerWorkspace2026Overview */}
    <Route index element={<Seller2026DashboardPage />} />
    {/* Store Profile — wired to useSellerWorkspace2026StoreProfile via section="storefront" */}
    <Route path="store-profile" element={<Seller2026StoreProfilePage />} />
    {/* Product Catalog — wired to useSellerWorkspace2026ProductCatalog */}
    <Route path="catalog/products" element={<Seller2026ProductCatalogPreviewPage />} />
    {/* Product Authoring — wired to useSellerWorkspace2026ProductAuthoring */}
    <Route path="catalog/products/new" element={<Seller2026ProductAuthoringPreviewPage />} />
    {/* Product Review Detail — wired to useSellerWorkspace2026ProductReviewDetail */}
    <Route path="catalog/products/:productId" element={<Seller2026ProductReviewDetailPreviewPage />} />
    {/* Orders Preview — wired to useSellerWorkspace2026Orders */}
    <Route path="orders" element={<Seller2026OrdersPreviewPage />} />
    {/* Payment Center Preview — wired to useSellerWorkspace2026PaymentCenter */}
    <Route path="payment-center" element={<Seller2026PaymentCenterPreviewPage />} />
    {/* Coupons Preview — wired to useSellerWorkspace2026Coupons */}
    <Route path="coupons" element={<Seller2026CouponsPreviewPage />} />
    {/* Team Preview — wired to useSellerWorkspace2026Team */}
    <Route path="team" element={<Seller2026TeamPreviewPage />} />
    {/* Analytics & Storefront Sync Preview — wired to useSellerWorkspace2026AnalyticsSync */}
    <Route path="analytics-sync" element={<Seller2026AnalyticsSyncPreviewPage />} />
  </Route>
);

export default seller2026PreviewRoutes;
