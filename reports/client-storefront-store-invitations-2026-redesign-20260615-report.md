# Client Storefront Store Invitations 2026 Redesign

## Task name

Modern 2026 redesign for Client / Storefront route `/user/store-invitations`.

## Files read

- `client/src/App.jsx`
- `client/src/layouts/AccountLayout.jsx`
- `client/src/pages/account/AccountStoreInvitationsPage.jsx`
- `client/src/pages/account/AccountNotificationsPage.jsx`
- `client/src/pages/account/AccountNotificationsPage.css`
- `client/src/pages/account/AccountDashboardPage.jsx`
- `client/src/api/axios.ts`
- `client/src/api/sellerInvitations.ts`
- `client/src/components/Layout/StoreLayout.jsx`
- `server/src/routes/seller.team.ts`
- `server/src/services/seller/teamMutations.ts`
- `client/package.json`

## Files changed

- `client/src/api/userStoreInvitations.ts`
- `client/src/utils/storeInvitationViewModel.js`
- `client/src/pages/account/AccountStoreInvitationsPage.jsx`
- `client/src/pages/account/AccountStoreInvitationsPage.css`
- `client/src/layouts/AccountLayout.jsx`
- `reports/client-storefront-store-invitations-2026-redesign-20260615-report.md`

## API functions used

- `fetchUserStoreInvitations`
  - `GET /seller/invitations`
- `acceptUserStoreInvitation`
  - `POST /seller/invitations/:memberId/accept`
- `declineUserStoreInvitation`
  - `POST /seller/invitations/:memberId/decline`

All functions use the existing axios client from `client/src/api/axios.ts`.

## UI changes

- Added a modern hero panel with store icon, title, subtitle, and invitation summary.
- Added Pending, Accepted, and Declined stat controls and tabs.
- Added Most recent and Oldest first sorting.
- Added responsive invitation cards with store, role, inviter, invitation date, state, expiration, and actions.
- Added scoped loading skeleton, error, empty, success, and mutation feedback states.
- Added an accessible decline confirmation dialog.
- Added final-state presentation for accepted and declined records.
- Added responsive layouts for desktop, tablet, and mobile.
- Kept storefront header, account sidebar, floating cart, and account route ownership in their existing layouts.

## Behavior changes

- The page now uses the stable React Query key `["account", "store-invitations"]`.
- Accept and decline invalidate account invitations plus existing seller invitation, team, and workspace-store queries.
- No optimistic updates or client-owned invitation lifecycle were added.
- Actions are globally disabled while a mutation is pending.
- Missing or invalid `memberId` values render a safe guard state and cannot call a mutation.
- Decline requires confirmation before the API call.
- Response normalization supports:
  - `{ data: [] }`
  - `{ data: { items: [] } }`
  - `{ invitations: [] }`
  - `{ memberships: [] }`
  - `{ items: [] }`

## Build result

- `pnpm.cmd -F client build`: PASS
- TypeScript project build: PASS
- Vite production build: PASS
- Targeted helper runtime assertions: PASS
- Targeted ESLint command: no errors; the repository ESLint configuration reported the JSX files as ignored.
- Server build was not required because no backend files or routes were changed.

## Smoke result

- `/`: PASS
- `/user/dashboard`: PASS
- `/user/store-invitations`: PASS
- `/user/my-orders`: PASS
- `/user/notifications`: PASS
- `/user/my-reviews`: PASS
- `/cart`: PASS
- Real pending invitation rendered with the correct store data: PASS
- Pending, Accepted, and Declined tabs: PASS
- Most recent and Oldest first selection: PASS
- Decline confirmation opens and can be cancelled without mutation: PASS
- Stubbed accept endpoint path and invalidation refetch: PASS
- Stubbed decline endpoint path, confirmation, and invalidation refetch: PASS
- Loading skeleton under delayed API response: PASS
- Error state under HTTP 500: PASS
- Desktop 1440px horizontal overflow: none
- Mobile 390px horizontal overflow: none
- New console errors: none

Artifacts:

- `.codex-artifacts/store-invitations-2026/desktop-1440.png`
- `.codex-artifacts/store-invitations-2026/mobile-390.png`
- `.codex-artifacts/store-invitations-2026/decline-confirmation.png`

## Known caveats

- The current server list query filters memberships to `INVITED`, so accepted and declined history is not returned by `GET /seller/invitations`. The frontend tabs and normalizer support those states when the API provides them, but current production data will normally leave those tabs empty after an action.
- The storefront mobile bottom navigation is fixed by the existing global layout and can cover part of a full-page screenshot while scrolling; no invitation-page overflow was detected.
- Existing Vite chunk-size warnings remain unrelated to this page.

## Next recommendation

Extend the existing invitation read contract with server-owned accepted and declined history when product requirements call for persistent history in those tabs. Keep the same normalized frontend model and avoid storing lifecycle history in the client.
