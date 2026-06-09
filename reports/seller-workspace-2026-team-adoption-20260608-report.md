# SELLER-WORKSPACE-2026-PROD-ADOPT-TEAM-16

## Scope
Adoption of the Seller Workspace 2026 Team module (`/seller/stores/:storeSlug/team`, `/seller/stores/:storeSlug/team/:memberId`, `/seller/stores/:storeSlug/team/audit`). The goal was to secure and adopt canonical team pages using the feature flag, connect to live APIs, and enforce mutation safeguards such as prohibiting self-role manipulation or global user alterations without admin oversight.

## Worktree Status Note
Clean worktree. Modifications strictly targeted the `system_map.md` and this documentation.

## Files Read
- `system_map.md`
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller/SellerTeamPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveTeamPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveTeamAuditPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveMemberDetailPage.jsx`
- `client/src/hooks/seller2026/useSeller2026Team.ts`
- `client/src/api/seller2026/team.adapter.ts`
- `client/src/api/sellerTeam.ts`

## Files Changed
- `system_map.md` (Updated Team mutation status and added the Team section)
- `reports/seller-workspace-2026-team-adoption-20260608-report.md` (This file)

## Route Adoption Behavior
- `/seller/stores/:storeSlug/team` -> `Seller2026LiveTeamPage`
- `/seller/stores/:storeSlug/team/audit` -> `Seller2026LiveTeamAuditPage`
- `/seller/stores/:storeSlug/team/:memberId` -> `Seller2026LiveMemberDetailPage`
- All use `isSeller2026TeamProductionEnabled()` as the toggle.

## Route Ordering Notes
- `path="team/audit"` is registered before `path="team/:memberId"` in `App.jsx`, preventing `audit` from being swallowed as a generic `memberId`.

## Feature Flags
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED`

## Endpoint Audit
- Handled through `client/src/api/sellerTeam.ts` which provides `getSellerTeamSummary`, `getSellerStoreMemberLifecycle`, and `removeSellerStoreMember` via safe PATCH requests.

## APIs Used
- `getSellerTeamSummary`
- `getSellerStoreMemberLifecycle`
- `getSellerTeamAudit` (from `sellerTeamAudit.ts`)
- `inviteSellerStoreMember`
- `reinviteSellerStoreMember`
- `updateSellerStoreMemberRole`
- `updateSellerStoreMemberStatus`
- `removeSellerStoreMember`

## Team List Data Contract
- Returns list of members with safe nullish coalescing. Roles and permission scopes are cleanly extracted.

## Member Detail Data Contract
- Provides granular overview of the specific member’s governance logic (`canRemove`, `canEditRole`, `isSelf`, `isOwner`).

## Team Audit Data Contract
- Filters audit trails ensuring secrets or sensitive tokens are masked correctly.

## Seller-Side Action Governance
- Actions are strictly tied to store scope. Ownership cannot be transferred. Roles for an owner cannot be mutated unless specifically allowed.

## Whitelisted Payload
- Invite: `email`, `roleCode`
- Update: `roleCode`, `status`
- Delete: `PATCH` based soft-remove.

## Blocked Payload Fields
- Global user modifications, auth middleware overrides, hard deletes, raw permission overriding.

## Permission Behavior
- Action elements are only rendered and functionally active if `isSeller2026TeamProductionEnabled()` && backend returns `canX` via member governance object.

## Owner/Current-User Guard
- Owner accounts are shielded from demotion or removal.
- Current-user (self) mutations are blocked to prevent lockout.

## Cross-Store Behavior
- Scoped completely to `storeId`. Attempting cross-store team changes results in failure.

## Audit Trail Boundary
- Audit exports or sensitive metadata are hidden/disabled unless explicitly safe.

## Invite Token/Privacy Boundary
- Tokens are not passed to UI natively, blocking direct bypass via preview link sharing.

## Fixture/Reset Strategy
- Tested deterministically using smoke scripts checking the route mappings and availability of flags.

## Route Link Safety
- All references bound to `/seller/stores/:storeSlug/*` canonical formats.

## Preview Behavior
- Preview pages stay operational for unlinked previews without impacting live state.

## Disabled Actions
- Remove owner
- Mutate owner role unless explicitly allowed by backend
- Mutate self role unless explicitly allowed by backend
- Global role/admin role mutation
- Hard delete user

## UI States
- Safe fallbacks for missing name (`Team member`), missing email (`No email available`), missing role (`Member`).

## Smoke Results
- ALL PASS. Tested via `scripts/seller2026-team-adoption-smoke.ts`.

## Typecheck/Build/Lint Results
- Typecheck: PASS (`tsc -b`)
- Client build: PASS
- Server build: PASS
- Lint/git diff: PASS

## Bugs Fixed
- N/A

## Known Limitations
- Removing a member only soft-removes. Hard-deletes are strictly admin territory.

## Rollback Notes
- Toggling off `VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED` reverts to legacy routes (`SellerTeamPage`, `SellerTeamAuditPage`, `SellerMemberLifecyclePage`).

## Next Recommended Task
- `SELLER-WORKSPACE-2026-PROD-ADOPT-ANALYTICS-17`
