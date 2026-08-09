import { lazy } from "react";
import { Route } from "react-router-dom";

const RawSeller2026Workspace = lazy(() =>
  import("../features/seller2026/Seller2026Workspace.jsx")
);
const Seller2026ProductCatalogPreviewPage = lazy(() =>
  import("../pages/seller2026/Seller2026ProductCatalogPreviewPage.jsx")
);
const Seller2026ProductAuthoringPreviewPage = lazy(() =>
  import("../pages/seller2026/Seller2026ProductAuthoringPreviewPage.jsx")
);
const Seller2026ProductReviewDetailPreviewPage = lazy(() =>
  import("../pages/seller2026/Seller2026ProductReviewDetailPreviewPage.jsx").then((module) => ({
    default: module.Seller2026ProductReviewDetailPreviewPage,
  }))
);
const Seller2026DashboardPage = lazy(() =>
  import("../pages/seller2026/Seller2026Pages.jsx").then((module) => ({
    default: module.Seller2026DashboardPage,
  }))
);
const Seller2026StoreProfilePage = lazy(() =>
  import("../pages/seller2026/Seller2026Pages.jsx").then((module) => ({
    default: module.Seller2026StoreProfilePage,
  }))
);
const Seller2026OrdersPreviewPage = lazy(() =>
  import("../pages/seller2026/Seller2026Pages.jsx").then((module) => ({
    default: module.Seller2026OrdersPreviewPage,
  }))
);
const Seller2026PaymentCenterPreviewPage = lazy(() =>
  import("../pages/seller2026/Seller2026Pages.jsx").then((module) => ({
    default: module.Seller2026PaymentCenterPreviewPage,
  }))
);
const Seller2026CouponsPreviewPage = lazy(() =>
  import("../pages/seller2026/Seller2026Pages.jsx").then((module) => ({
    default: module.Seller2026CouponsPreviewPage,
  }))
);
const Seller2026TeamPreviewPage = lazy(() =>
  import("../pages/seller2026/Seller2026Pages.jsx").then((module) => ({
    default: module.Seller2026TeamPreviewPage,
  }))
);
const Seller2026AnalyticsSyncPreviewPage = lazy(() =>
  import("../pages/seller2026/Seller2026Pages.jsx").then((module) => ({
    default: module.Seller2026AnalyticsSyncPreviewPage,
  }))
);

export const seller2026PreviewRoutes = (
  <>
    <Route path="/seller-2026">
      <Route index element={<RawSeller2026Workspace section="dashboard" />} />
      <Route path="dashboard" element={<RawSeller2026Workspace section="dashboard" />} />
      <Route path="storefront" element={<RawSeller2026Workspace section="storefront" />} />
      <Route path="catalog/products" element={<RawSeller2026Workspace section="products" />} />
      <Route
        path="catalog/products/new"
        element={<RawSeller2026Workspace section="products" productEditorMode="create" />}
      />
      <Route
        path="catalog/products/:productId"
        element={<RawSeller2026Workspace section="products" />}
      />
      <Route
        path="catalog/products/:productId/edit"
        element={<RawSeller2026Workspace section="products" productEditorMode="edit" />}
      />
      <Route
        path="catalog/categories"
        element={<RawSeller2026Workspace section="taxonomy" catalogView="categories" />}
      />
      <Route
        path="catalog/attributes"
        element={<RawSeller2026Workspace section="taxonomy" catalogView="attributes" />}
      />
      <Route
        path="catalog/attributes/:attributeId/values"
        element={<RawSeller2026Workspace section="taxonomy" catalogView="attribute-values" />}
      />
      <Route
        path="catalog/coupons"
        element={<RawSeller2026Workspace section="taxonomy" catalogView="coupons" />}
      />
      <Route
        path="orders"
        element={<RawSeller2026Workspace section="operations" operationsView="orders" />}
      />
      <Route
        path="orders/:suborderId"
        element={<RawSeller2026Workspace section="operations" operationsView="suborder-detail" />}
      />
      <Route
        path="payment-review"
        element={<RawSeller2026Workspace section="operations" operationsView="payment-review" />}
      />
      <Route
        path="payment-profile"
        element={<RawSeller2026Workspace section="operations" operationsView="payment-profile" />}
      />
      <Route path="team" element={<RawSeller2026Workspace section="team" teamView="members" />} />
      <Route
        path="team/invitations"
        element={<RawSeller2026Workspace section="team" teamView="audit" />}
      />
      <Route path="team/audit" element={<RawSeller2026Workspace section="team" teamView="audit" />} />
      <Route
        path="team/:memberId"
        element={<RawSeller2026Workspace section="team" teamView="member-detail" />}
      />
      <Route
        path="notifications"
        element={<RawSeller2026Workspace section="team" teamView="notifications" />}
      />
    </Route>

    <Route path="/seller-2026-preview/:storeSlug">
      <Route index element={<Seller2026DashboardPage />} />
      <Route path="store-profile" element={<Seller2026StoreProfilePage />} />
      <Route path="catalog/products" element={<Seller2026ProductCatalogPreviewPage />} />
      <Route path="catalog/products/new" element={<Seller2026ProductAuthoringPreviewPage />} />
      <Route path="catalog/products/:productId" element={<Seller2026ProductReviewDetailPreviewPage />} />
      <Route path="orders" element={<Seller2026OrdersPreviewPage />} />
      <Route path="payment-center" element={<Seller2026PaymentCenterPreviewPage />} />
      <Route path="coupons" element={<Seller2026CouponsPreviewPage />} />
      <Route path="team" element={<Seller2026TeamPreviewPage />} />
      <Route path="analytics-sync" element={<Seller2026AnalyticsSyncPreviewPage />} />
    </Route>
  </>
);

export default seller2026PreviewRoutes;
