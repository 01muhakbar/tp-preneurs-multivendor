# SELLER-WORKSPACE-2026-STORE-PROFILE-DOCS-CLOSEOUT-15B

## Scope
Adoption of the Seller Workspace 2026 Store Profile module (`/seller/stores/:storeSlug/store-profile`). The goal was to redirect the canonical route to the new component (`Seller2026LiveStorefrontPage`) when feature flags are active, ensure backward compatibility for legacy flows, connect to live APIs, whitelist the mutation payload, and guarantee that strict public gate, client storefront, and team boundaries remain untouched.

## Worktree Status Note
Clean worktree. Modifications were verified in isolation. The adoption logic was primarily handled in `App.jsx`, `sellerWorkspace2026Flags.js`, and the newly created smoke testing script.

## Files Read
- `system_map.md`
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller/SellerStoreProfilePage.jsx`
- `client/src/pages/seller2026/Seller2026LiveStorefrontPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/api/seller2026/storefront.adapter.ts`
- `client/src/hooks/seller2026/useSeller2026Storefront.ts`
- `client/src/hooks/seller2026/useSeller2026UpdateStoreProfile.ts`
- `client/src/api/seller2026/storefront.mutations.ts`

## Files Changed
- `system_map.md` (Updated Store Profile mutation status and added the Store Profile section)
- `reports/seller-workspace-2026-store-profile-adoption-20260608-report.md` (This file)

## Route Adoption Behavior
- `/seller/stores/:storeSlug/store-profile` uses `Seller2026LiveStorefrontPage` if `VITE_SELLER_WORKSPACE_2026_STORE_PROFILE_ENABLED` is true.

## Legacy Redirect Behavior
- `/seller/stores/:storeSlug/profile` safely redirects to the canonical `/seller/stores/:storeSlug/store-profile` regardless of flag state.

## Feature Flags
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_STORE_PROFILE_ENABLED`

## APIs Used
- `getSellerStoreProfile`
- `getSellerWorkspaceReadiness`
- `getStorePublicIdentityBySlug`
- `getStoreMicrositeRichAboutBySlug`
- `updateSellerStoreProfile`

## Store Profile Data Contract
- Normalized through `adaptSeller2026Storefront` yielding a view model with `store`, `readiness`, `microsite`, and `theme` states. Contains logic for fallback values if data is missing.

## Seller-Side Update Governance
- Seller can update store profile fields they are authorized to modify. Verification and public publishing cannot be mutated arbitrarily by the seller.

## Whitelisted Payload
- `description`, `email`, `whatsapp`, `phone`, `websiteUrl`, `instagramUrl`, `tiktokUrl`, `addressLine1`, `addressLine2`, `city`, `province`, `postalCode`, `country`, `shippingSetup`. (Guarded by `allowedTopLevelFields` in `storefront.mutations.ts`).

## Blocked Payload Fields
- `isVerified`, `verificationStatus`, `publicStatus`, `isPublic`, `approvedBy`, `reviewedBy`, `adminStatus`, `storeId`, `ownerId`.

## Permission Behavior
- Profile is loaded if `STORE_PROFILE_READ` exists.
- Editable actions are only unlocked if `STORE_PROFILE_UPDATE` is granted.

## Cross-Store Behavior
- Store-scoped ID is injected at the route layer, protecting mutations from crossing store bounds.

## Admin Public Gate Boundary
- Remains intact. Store visibility toggle and validation must go through the admin process.

## Client Storefront Boundary
- Storefront displays whatever is authorized by the current existing live API (`getStorePublicIdentityBySlug`). Internal mutations only apply if valid for public view.

## Upload/Logo/Banner Decision
- Disabled for this phase. Pending dedicated storage validation.

## Fixture/Reset Strategy
- Validated via deterministic smoke tests rather than destructive data manipulations. Safe payloads are submitted without changing critical status bits.

## Route Link Safety
- Only canonical routes (e.g. `/seller/stores/:storeSlug/store-profile`) are linked.

## Preview Behavior
- Microsite previews are functional but do not intercept live mutations.

## Disabled Actions
- Direct verify/approve.
- Direct public publish (if admin gate is required).
- Logo/banner upload.
- Delete store or ownership transfer.

## UI States
- `Seller2026LiveStorefrontPage` safely wraps loading states, permission guard, and form elements.

## Smoke Results
- ALL PASS. See `scripts/seller2026-store-profile-adoption-smoke.ts`.

## Typecheck/Build/Lint Results
- Typecheck: PASS (`tsc -b`)
- Client build: PASS
- Server build: PASS
- Lint/git diff: PASS

## Bugs Fixed
- N/A (Integration checks verified functionality).

## Known Limitations
- Logo/banner upload relies on a legacy flow until storage boundaries are finalized.

## Rollback Notes
- Toggling off `VITE_SELLER_WORKSPACE_2026_STORE_PROFILE_ENABLED` reverts to `SellerStoreProfilePage` without data loss.

## Next Recommended Task
- `SELLER-WORKSPACE-2026-PROD-ADOPT-TEAM-16`
