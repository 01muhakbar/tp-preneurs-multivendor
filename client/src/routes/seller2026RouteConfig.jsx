import { Route } from "react-router-dom";
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
export const seller2026PreviewRoutes = (
  <Route path="/seller-2026">
    <Route index element={<Seller2026DashboardPage />} />
    <Route path="dashboard" element={<Seller2026DashboardPage />} />
    <Route path="storefront" element={<Seller2026StorefrontPage />} />
    <Route path="products" element={<Seller2026ProductsPage />} />
    <Route path="catalog-tools" element={<Seller2026CategoriesPage />} />
    <Route path="orders-payments" element={<Seller2026OrdersPage />} />
    <Route path="catalog/products" element={<Seller2026ProductsPage />} />
    <Route path="catalog/categories" element={<Seller2026CategoriesPage />} />
    <Route path="catalog/attributes" element={<Seller2026AttributesPage />} />
    <Route path="catalog/attributes/:attributeId/values" element={<Seller2026AttributeValuesPage />} />
    <Route path="catalog/coupons" element={<Seller2026CouponsPage />} />
    <Route path="orders" element={<Seller2026OrdersPage />} />
    <Route path="orders/:suborderId" element={<Seller2026OrderDetailPage />} />
    <Route path="payment-review" element={<Seller2026PaymentReviewPage />} />
    <Route path="payment-profile" element={<Seller2026PaymentProfilePage />} />
    <Route path="team" element={<Seller2026TeamPage />} />
    <Route path="team/audit" element={<Seller2026AuditLogPage />} />
    <Route path="team/invitations" element={<Seller2026InvitationsPage />} />
    <Route path="team/:memberId" element={<Seller2026MemberDetailPage />} />
    <Route path="notifications" element={<Seller2026NotificationsPage />} />
  </Route>
);

export default seller2026PreviewRoutes;
