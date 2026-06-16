# Task name

Client Storefront Notifications 2026 Redesign

# Files read

- `client/src/App.jsx`
- `client/src/layouts/AccountLayout.jsx`
- `client/src/pages/account/AccountNotificationsPage.jsx`
- `client/src/api/userNotifications.ts`
- `client/src/components/kachabazar-demo/StoreHeaderKacha.jsx`
- `client/src/components/kachabazar-demo/GreenHeaderBar.jsx`
- `client/src/components/kachabazar-demo/HeaderActions.jsx`
- `client/src/components/user/UserNotificationsPopup.jsx`
- `client/src/components/Layout/StoreLayout.jsx`
- `client/src/components/Layout/StoreLayout.css`
- `client/src/api/axios.ts`
- `client/vite.config.ts`
- `server/src/routes/public.ts`
- `server/src/controllers/user/userNotificationsController.ts`
- `server/src/services/notification.service.ts`

# Files changed

- `client/src/api/userNotifications.ts`
- `client/src/components/kachabazar-demo/HeaderActions.jsx`
- `client/src/components/store/NotificationPreviewDropdown.jsx`
- `client/src/components/store/NotificationPreviewDropdown.css`
- `client/src/pages/account/AccountNotificationsPage.jsx`
- `client/src/pages/account/AccountNotificationsPage.css`
- `client/src/utils/notificationViewModel.js`
- `server/src/routes/public.ts`
- `reports/client-storefront-notifications-2026-redesign-20260615-report.md`

# API functions used

- `fetchUserNotifications`
- `fetchUserUnreadNotificationCount`
- `markUserNotificationAsRead`
- `markUserNotificationRead` compatibility alias
- `markAllUserNotificationsRead`

# UI changes

- Rebuilt `/user/notifications` as a compact 2026 account notifications surface with English copy, scoped `.account-notifications-2026` styles, green accent, soft cards, filter tabs, action buttons, loading skeleton, empty state, error state, and pagination.
- Added shared notification normalization in `notificationViewModel.js` for defensive API payload unwrapping, kind inference, time formatting, client-side filtering, and action routing.
- Added `NotificationPreviewDropdown` under the header bell with scoped `.notification-preview-2026` styles, unread count, realtime label, mark-all-read control, four-row preview, and "View all notifications".

# Behavior changes

- `AccountNotificationsPage` now uses React Query keys `["account", "notifications", { page, limit }]` and `["account", "notifications", "unread-count"]`.
- Mark-one-read and mark-all-read invalidate the `["account", "notifications"]` query family.
- Delete/clear notification endpoints are no longer used by the redesigned page or dropdown.
- Header bell preview queries are enabled only while the dropdown is open; the badge count remains backed by unread-count.
- Order/status/payment actions route to `/user/my-orders/:id` only when a backend `orderId` is available; invitations route to `/user/store-invitations`; promotions route to `/offers`.
- Added POST route aliases for `/user/notifications/:id/read` and `/user/notifications/read-all`, while keeping existing PATCH routes for compatibility.

# Build result

- Initial `pnpm -F ...` commands were blocked by local PowerShell execution policy for `pnpm.ps1`.
- `pnpm.cmd -F client build`: PASS
- `pnpm.cmd -F server build`: PASS
- Final `pnpm.cmd -F client build`: PASS
- Vite retained the existing large chunk warning.

# Smoke result

- Public smoke with local Playwright fallback:
  - `/`: PASS, no crash, header and floating cart present.
  - `/offers`: PASS, no crash, header and floating cart present.
- Authenticated smoke using local fixture `superclient@local.dev`:
  - `/user/dashboard`: PASS, header/sidebar/floating cart present.
  - `/user/notifications`: PASS, redesigned root rendered, menu has `aria-current="page"`, no horizontal overflow.
  - `/user/my-orders`: PASS, header/sidebar/floating cart present.
  - Header bell dropdown: PASS, preview opened, "Clear all" and "View all notifications" visible.
  - Mobile `/user/notifications` at 390px: PASS, no horizontal overflow.
  - Console errors during authenticated smoke: none.

# Known caveats

- Codex in-app browser was unavailable in this session, so manual smoke used the installed local Playwright runtime.
- The local notification dataset had existing production-like rows; no dummy notification data was added.
- Loading, empty, and error states are implemented, but the authenticated local dataset was non-empty during smoke.

# Next recommendation

- Consider adding a small frontend test for `notificationViewModel.js` response-shape normalization and action resolution.
