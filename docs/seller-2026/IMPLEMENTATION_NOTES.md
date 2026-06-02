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
- No live API fetch is connected to the preview UI yet.
- Adapter skeletons are available in `client/src/api/seller2026/`.

## Pending Backend Work
- Connect React Query hooks to existing seller APIs.
- Keep all live requests scoped by resolved store membership.
- Preserve backend checks with `requireAuth`, `requireSellerStoreAccess`, and permission guards.

## Known Limitations
- Live seller routes under `/seller/stores/:storeSlug/*` are unchanged.
- Preview pages use shared section wrappers, so several detail routes intentionally render the same domain workspace.
- Permission-aware action hiding is planned for the live integration phase.

## QA Checklist
- Verify preview pages do not render blank.
- Verify CSS does not affect `/admin/*`, `/`, `/store/:slug`, or `/user/*`.
- Verify sidebar links preserve preview routing.
- Verify dark mode toggle works and remains scoped to Seller 2026.
- Verify responsive layouts at 1440, 1280, 1024, 768, and 390 px.
- Run `npm run build` from `client`.
