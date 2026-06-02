# Seller Workspace 2026 Implementation Notes

## Implemented Routes
- `/seller-2026`
- `/seller-2026/dashboard`
- `/seller-2026/storefront`
- `/seller-2026/products`
- `/seller-2026/catalog-tools`
- `/seller-2026/orders-payments`
- `/seller-2026/catalog/products`
- `/seller-2026/catalog/categories`
- `/seller-2026/catalog/attributes`
- `/seller-2026/catalog/attributes/:attributeId/values`
- `/seller-2026/catalog/coupons`
- `/seller-2026/orders`
- `/seller-2026/orders/:suborderId`
- `/seller-2026/payment-review`
- `/seller-2026/payment-profile`
- `/seller-2026/team`
- `/seller-2026/team/:memberId`
- `/seller-2026/team/invitations`
- `/seller-2026/team/audit`
- `/seller-2026/notifications`
- `/seller/stores/:storeSlug/dashboard`
- `/seller/stores/:storeSlug/store-profile`
- `/seller/stores/:storeSlug/microsite-preview`

## Components Added
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `client/src/features/seller2026/seller2026Data.js`
- `client/src/pages/seller2026/*`
- `client/src/routes/seller2026RouteConfig.jsx`

## CSS Scope
- Prefix: `.s26-`
- CSS is imported by `Seller2026Workspace.jsx`, not globally in `main.jsx`.
- Dark mode is scoped with `.s26-app.s26-dark` and persisted via `localStorage` key `seller2026-theme`.

## Mock Data Still Used
- All preview route content uses `client/src/features/seller2026/seller2026Data.js`.
- Forms, tables, and action buttons are visual-only in the preview route.

## API Integrated
- Preview routes still use mock data from the slicing bundle.
- Live dashboard uses existing seller workspace APIs through `useSeller2026Dashboard`.
- Live store profile uses existing seller profile/readiness APIs through `useSeller2026Storefront`.
- Adapter skeletons are available in `client/src/api/seller2026/`.

## Pending Backend Work
- Connect React Query hooks to existing seller APIs.
- Keep all live requests scoped by resolved store membership.
- Preserve backend checks with `requireAuth`, `requireSellerStoreAccess`, and permission guards.

## Known Limitations
- Live seller dashboard and store profile have been adopted; other live seller routes are unchanged.
- Preview pages use shared section wrappers, so several detail routes intentionally render the same domain workspace.
- Permission-aware action hiding is planned for the live integration phase.

## Live Route Adoption - Storefront / Store Profile

### Route Adopted
- `/seller/stores/:storeSlug/store-profile`
- `/seller/stores/:storeSlug/microsite-preview`

### Files Added
- `client/src/pages/seller2026/Seller2026LiveStorefrontPage.jsx`
- `client/src/hooks/seller2026/useSeller2026Storefront.ts`

### Files Changed
- `client/src/App.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `client/src/api/seller2026/storefront.adapter.ts`

### APIs Used
- `getSellerStoreProfile`
- `getSellerWorkspaceReadiness`
- `getStorePublicIdentityBySlug`
- `getStoreMicrositeRichAboutBySlug`

### Adapter Mapping
- `adaptSeller2026Storefront` maps store profile, readiness, public identity, and rich-about data into a Seller 2026 storefront view model.
- Live fallbacks use store context/profile fields and generic labels, not preview brand mock data.

### Still Mocked / Fallback
- Theme customization is UI-only.
- Homepage section toggles are UI-only.
- Featured products fall back to safe placeholder cards until a public-safe product source is wired.
- Submit review, logo/banner upload, policy management, and save mutation controls are disabled in the 2026 live UI.

### Pending Work
- Update store profile mutation integration.
- Logo/banner upload integration.
- Theme customization persistence.
- Microsite section persistence.
- Submit for review integration.

## QA Checklist
- Verify preview pages do not render blank.
- Verify CSS does not affect `/admin/*`, `/`, `/store/:slug`, or `/user/*`.
- Verify sidebar links preserve preview routing.
- Verify dark mode toggle works and remains scoped to Seller 2026.
- Verify responsive layouts at 1440, 1280, 1024, 768, and 390 px.
- Run `npm run build` from `client`.
