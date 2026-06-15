# Client User Dashboard 2026 Adoption Report

Date: 2026-06-12

## Files Read

- `client/src/App.jsx`
- `client/src/layouts/AccountLayout.jsx`
- `client/src/pages/account/AccountDashboardPage.jsx`
- `client/src/pages/account/AccountOrdersPage.jsx`
- `client/src/pages/account/AccountStoreApplicationPage.jsx`
- `client/src/pages/account/AccountStoreInvitationsPage.jsx`
- `client/src/pages/account/AccountShippingAddressPage.jsx`
- `client/src/api/storeOrders.ts`
- `client/src/api/userNotifications.ts`
- `client/src/api/userStoreApplications.ts`
- `client/src/api/userAddresses.ts`
- `client/src/api/sellerInvitations.ts`
- `client/src/auth/AuthContext.jsx`
- `client/src/components/AccountGuard.jsx`
- `client/src/components/Layout/StoreLayout.jsx`
- `client/src/components/kachabazar-demo/FloatingCartWidget.jsx`
- `client/src/utils/orderTruth.js`
- `client/src/utils/orderStatus.js`
- `client/src/utils/publicOrderReference.js`

## Files Changed

- `client/src/layouts/AccountLayout.jsx`
- `client/src/pages/account/AccountDashboardPage.jsx`
- `client/src/pages/account/AccountDashboard2026View.jsx`
- `client/src/pages/account/account-dashboard-2026.css`
- `reports/client-user-dashboard-2026-adoption-20260612-report.md`

## Data Mapping

- Buyer identity comes from the existing `AccountGuard` / `AccountLayout` outlet context.
- Orders come from `fetchStoreMyOrders()` and retain `getOrderTruthStatus()` as the order lifecycle presenter.
- Pending, processing/shipping, and completed totals use the existing truth buckets.
- Store application data comes from `getCurrentUserStoreApplication()`.
- Application and readiness badges use the existing onboarding presenters.
- Unread notifications use `fetchUserUnreadNotificationCount()`.
- Invitations use `getSellerInvitations()` and count backend-normalized actionable items.
- Saved addresses use `listAddresses()`.
- Recent orders are sorted by backend timestamps and limited to five rows.
- No new API or frontend lifecycle calculation was added.

## UI Changes

- Added the 2026 white/green dashboard view with concise order summary cards.
- Added the Start Selling card with backend-backed status, readiness, completeness, and update time.
- Added quick links for Wishlist, Addresses, Notifications, and Invitations.
- Added a responsive Recent Orders table with account detail actions.
- Added lightweight loading, empty, and non-blocking error states.
- All custom CSS uses the `tpdash2026` prefix.
- Dashboard content renders before the sidebar on mobile while the sidebar remains left-aligned on desktop.
- Header, footer, account sidebar, and the single StoreLayout floating cart remain layout-owned.

## QA Result

- `pnpm.cmd -F client build`: PASS
- `pnpm.cmd -F server build`: PASS
- Targeted ESLint invocation: no errors; repository config ignored the selected JSX files.
- Authenticated `/user/dashboard`: PASS using `superclient@local.dev`.
- Desktop render: PASS.
- Mobile render at 390px: PASS, no page-level horizontal overflow.
- CTA mapping: PASS.
- Order detail mapping to `/user/my-orders/:id`: PASS.
- Single floating cart owner: PASS.
- Smoke routes passed:
  - `/user/dashboard`
  - `/user/my-orders`
  - `/user/notifications`
  - `/user/store-invitations`
  - `/user/store-application`
  - `/`
  - `/search`
  - `/cart`
  - `/checkout`

## Known Follow-ups

- The Codex in-app browser was unavailable, so visual smoke used the installed local Playwright runtime.
- Existing buyer cart session synchronization returned `409 /api/cart/add` for a stale cart item during reload. Dashboard requests and rendering were unaffected.
- The repository currently has no buyer wishlist API/route, so Wishlist links to product search and does not display a fabricated count.
