# Seller Workspace 2026 Notification Mutation Report

Date: 2026-06-03

## Scope
- Enabled live Seller 2026 notification read-state mutations.
- Covered `/seller/stores/:storeSlug/notifications`.
- Kept preview routes `/seller-2026/*` mock-only.
- Did not change backend schema, auth/session behavior, admin notifications, public storefront, or canonical route definitions.

## Enabled
- Mark one seller notification as read.
- Mark all seller notifications as read.
- Refetch Seller 2026 notification list and unread count.
- Invalidate existing SellerLayout notification dropdown queries.

## Store Scope
- Frontend resolves `storeId` from live seller workspace context.
- Backend seller notification routes use `requireSellerStoreAccess(["STORE_VIEW"])`.
- Backend service filters by seller metadata scope: `audience: "SELLER"`, authenticated `userId`, and `storeId`.

## Files Changed
- `client/src/hooks/seller2026/useSeller2026Notifications.ts`
- `client/src/api/seller2026/mutation-flags.ts`
- `client/src/api/seller2026/notifications.mutations.ts`
- `client/src/hooks/seller2026/useSeller2026NotificationMutations.ts`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/pages/seller2026/Seller2026LiveNotificationsPage.jsx`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `docs/seller-2026/MUTATION_INTEGRATION.md`
- `docs/seller-2026/PERMISSION_MATRIX.md`
- `docs/seller-2026/HARDENING_AUDIT.md`
- `docs/seller-2026/IMPLEMENTATION_NOTES.md`
- `system_map.md`

## Still Disabled
- Delete notification.
- Create notification.
- Admin notification read state.
- Real-time notification push subscriptions.

## Verification
- `pnpm.cmd exec tsx scripts/seller2026-auth-fixture-live-smoke.ts` passed.
- `pnpm.cmd -F client exec tsc -b` passed.
- `pnpm.cmd -F client build` passed.
- `pnpm.cmd -F client exec eslint src/features/seller2026 src/pages/seller2026 src/hooks/seller2026 src/api/seller2026 src/routes/seller2026RouteConfig.jsx` passed with one existing config warning: `src/routes/seller2026RouteConfig.jsx` is ignored by current ESLint config.
- Smoke mutation assertion: unread count changed `2 -> 1` after mark-one-read and `1 -> 0` after mark-all-read.

## Notes
- Live notification pagination now sends `offset` and `limit` to match the existing seller notifications API.
- Smoke fixture now creates two unread seller notifications so single-read and read-all mutations both assert count changes.
