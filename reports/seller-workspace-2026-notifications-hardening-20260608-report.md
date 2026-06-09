# Seller Workspace 2026 Notifications Hardening Report

## 1. Task Title

`SELLER-WORKSPACE-2026-PROD-HARDEN-NOTIFICATIONS-03`

## 2. Scope

Hardening canonical Seller Workspace 2026 Notifications route so it remains live, store-scoped, permission-aware, English-only, and safe for production usage where no legacy Seller notifications page exists.

## 3. Files Read

- `system_map.md`
- `reports/seller-workspace-2026-auth-smoke-20260608-report.md`
- `reports/seller-workspace-2026-auth-smoke-20260608-results.json`
- `client/src/App.jsx`
- `client/src/layouts/SellerLayout.jsx`
- `client/src/utils/sellerWorkspaceRoute.js`
- `client/src/api/sellerNotifications.ts`
- `client/src/api/seller2026/notifications.adapter.ts`
- `client/src/api/seller2026/notifications.mutations.ts`
- `client/src/hooks/seller2026/useSeller2026Notifications.ts`
- `client/src/hooks/seller2026/useSeller2026NotificationMutations.ts`
- `client/src/pages/seller2026/Seller2026LiveNotificationsPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `scripts/seller2026-auth-slicing-adoption-smoke.ts`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `server/src/routes/seller.notifications.ts`
- `server/src/services/notification.service.ts`

## 4. Files Changed

- `client/src/api/seller2026/notifications.adapter.ts`
- `client/src/hooks/seller2026/useSeller2026Notifications.ts`
- `client/src/pages/seller2026/Seller2026LiveNotificationsPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `client/src/layouts/SellerLayout.jsx`
- `scripts/seller2026-notifications-hardening-smoke.ts`
- `system_map.md`
- `reports/seller-workspace-2026-notifications-hardening-20260608-report.md`
- `reports/seller-workspace-2026-notifications-hardening-20260608-results.json`

## 5. Route Audited

- Canonical: `/seller/stores/:storeSlug/notifications`
- Preview: `/seller-2026/notifications`

Canonical route uses `Seller2026LiveNotificationsPage`, `SellerLayout` store context, and live store-scoped APIs. No mock fallback was added to canonical route.

## 6. API Endpoints Used

- `GET /api/seller/stores/:storeId/notifications`
- `GET /api/seller/stores/:storeId/notifications/unread-count`
- `PATCH /api/seller/stores/:storeId/notifications/:id/read`
- `PATCH /api/seller/stores/:storeId/notifications/read-all`

Backend guard: `requireSellerStoreAccess(["STORE_VIEW"])`.

## 7. Data Contract Normalization

Adapter now normalizes:
- `id`
- `storeId`
- `title`
- `message`
- `type`
- `severity`
- `status`
- `isRead`
- `readAt`
- `createdAt`
- `targetType`
- `targetId`
- `targetUrl`
- `actionLabel`
- `canonicalHref`
- `metadata`

Fallbacks:
- Empty title -> `Notification`
- Empty message -> `No details available.`
- Missing/invalid date -> `Recently`
- Unknown type -> `general`
- Unknown/unsafe target -> no link rendered

Raw metadata is retained in the view model for safe derivation, but not rendered as raw JSON in the UI.

## 8. Route Link Mapping

Notification links are resolved to canonical Seller Workspace routes only:
- Product -> `/seller/stores/:storeSlug/catalog/products/:productId`
- Product edit/review -> `/seller/stores/:storeSlug/catalog/products/:productId/edit`
- Order/suborder -> `/seller/stores/:storeSlug/orders/:suborderId`
- Payment review -> `/seller/stores/:storeSlug/payment-review`
- Payment profile -> `/seller/stores/:storeSlug/payment-profile`
- Coupon -> `/seller/stores/:storeSlug/catalog/coupons`
- Team/member -> `/seller/stores/:storeSlug/team/:memberId`
- Team audit -> `/seller/stores/:storeSlug/team/audit`
- Store profile -> `/seller/stores/:storeSlug/store-profile`
- Dashboard -> `/seller/stores/:storeSlug/dashboard`

External URLs, `/seller-2026`, and unknown targets are not linked.

## 9. Mutations Enabled

- Mark one notification as read.
- Mark all notifications as read.

Both mutations use store id from resolved seller context and invalidate Seller 2026/Seller notification queries after success.

## 10. Mutations Disabled

- Delete notification.
- Archive notification.
- Seller-created notification.
- Admin broadcast from Seller UI.
- Browser push notification.

## 11. Permission Behavior

The page uses `NOTIFICATION_READ` permission alias. If read permission is unavailable or backend returns 403, the page renders a permission/error-safe state and does not fall back to mock data.

## 12. Cross-Store Behavior

Smoke confirms owner of `tp-preneurs-demo-store` opening `/seller/stores/other-demo-store/notifications` receives a forbidden-safe page and no other-store notification data.

## 13. UI States

Hardened:
- Loading text.
- Empty state: `No notifications yet` and `Important store updates will appear here.`
- Error state: `Notifications could not be loaded` with `Try again`.
- Unread/read visual state.
- `Mark all as read` disabled when unread count is 0.
- `Mark as read` disabled for already-read items.
- Safe date label for invalid/missing dates.
- Long message wrapping and mobile responsive layout.
- English-only visible copy in canonical Notifications UI.

## 14. Smoke Results

Runner: `scripts/seller2026-notifications-hardening-smoke.ts`

Result artifact: `reports/seller-workspace-2026-notifications-hardening-20260608-results.json`

Summary:
- Status: PASS
- Fatal console errors: 0
- Page errors: 0
- Expected cross-store 403 console entry: safe

Owner:
- Mark one read: unread `2 -> 1`, persisted after reload.
- Mark all read: unread `2 -> 0`, persisted after reload.

Role-limited member:
- PASS, route rendered read-safe/permission-safe behavior.

Cross-store:
- PASS, forbidden-safe.

Preview:
- PASS, `/seller-2026/notifications` rendered without crash.

Regression:
- Admin `/admin/dashboard`: PASS
- Client `/` and `/store/demo-store`: PASS

## 15. Typecheck/Build/Lint Results

- `pnpm.cmd -F client exec tsc -b`: PASS
- `pnpm.cmd -F client build`: PASS
- Targeted lint: PASS with warnings that touched `.jsx` files are ignored by the active ESLint config.
- Notification smoke: PASS

## 16. Bugs Fixed

- Hardened notification DTO normalization for missing/variant backend fields.
- Added canonical notification link resolver and blocked unsafe/external/preview links.
- Fixed canonical Notifications UI empty/error copy and mobile wrapping.
- Fixed header notification route resolver to avoid unsafe direct routes.
- Added repeatable smoke for mark-one and mark-all read behavior.

## 17. Known Limitations

- Smoke uses deterministic local fixture reset to mark fixture notifications unread before mutation checks.
- Admin regression is unauthenticated guard smoke only.
- Repo-wide lint debt remains outside this task scope.

## 18. Rollback Notes

- No backend schema changes.
- No auth middleware changes.
- No Admin Workspace changes.
- No Client Storefront changes.
- No destructive notification mutations were added.
- Canonical Notifications can be reverted by backing out the frontend adapter/UI/smoke changes; backend APIs remain unchanged.

## 19. Next Recommended Task

`SELLER-WORKSPACE-2026-PROD-ADOPT-DASHBOARD-04`
