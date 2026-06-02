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
- `/seller/stores/:storeSlug/catalog/products`
- `/seller/stores/:storeSlug/catalog/products/new`
- `/seller/stores/:storeSlug/catalog/products/:productId`
- `/seller/stores/:storeSlug/catalog/products/:productId/edit`
- `/seller/stores/:storeSlug/catalog/categories`
- `/seller/stores/:storeSlug/catalog/attributes`
- `/seller/stores/:storeSlug/catalog/attributes/:attributeId/values`
- `/seller/stores/:storeSlug/catalog/coupons`
- `/seller/stores/:storeSlug/orders`
- `/seller/stores/:storeSlug/orders/:suborderId`
- `/seller/stores/:storeSlug/payment-review`
- `/seller/stores/:storeSlug/payment-profile`
- `/seller/stores/:storeSlug/team`
- `/seller/stores/:storeSlug/team/:memberId`
- `/seller/stores/:storeSlug/team/audit`
- `/seller/stores/:storeSlug/notifications`

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
- Live products use existing seller product APIs through `useSeller2026Products` and `useSeller2026ProductDetail`.
- Live catalog tools use existing seller categories, attributes, attribute values, and coupons APIs through `useSeller2026Categories`, `useSeller2026Attributes`, `useSeller2026AttributeValues`, and `useSeller2026Coupons`.
- Live orders and payments use existing seller suborder, payment review, and payment profile APIs through `useSeller2026Orders`, `useSeller2026SuborderDetail`, `useSeller2026PaymentReview`, and `useSeller2026PaymentProfile`.
- Live team and notifications use existing seller team, audit, and notification APIs through `useSeller2026Team`, `useSeller2026MemberDetail`, `useSeller2026TeamAudit`, and `useSeller2026Notifications`.
- Adapter skeletons are available in `client/src/api/seller2026/`.

## Pending Backend Work
- Connect React Query hooks to existing seller APIs.
- Keep all live requests scoped by resolved store membership.
- Preserve backend checks with `requireAuth`, `requireSellerStoreAccess`, and permission guards.

## Known Limitations
- Live seller dashboard, store profile, product catalog, catalog tools, orders/payments, team, audit, and notifications routes have been adopted.
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

## Live Route Adoption - Products

### Routes Adopted
- `/seller/stores/:storeSlug/catalog/products`
- `/seller/stores/:storeSlug/catalog/products/new`
- `/seller/stores/:storeSlug/catalog/products/:productId`
- `/seller/stores/:storeSlug/catalog/products/:productId/edit`

### Files Added
- `client/src/pages/seller2026/Seller2026LiveProductsPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveProductDetailPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveProductEditorPage.jsx`
- `client/src/hooks/seller2026/useSeller2026Products.ts`
- `client/src/hooks/seller2026/useSeller2026ProductDetail.ts`

### Files Changed
- `client/src/App.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `client/src/api/seller2026/products.adapter.ts`

### APIs Used
- `getSellerProducts`
- `getSellerProductDetail`
- `getSellerProductAuthoringMeta`

### Adapter Mapping
- `adaptSeller2026Products` maps list items, summary counters, category filters, pagination, and permission flags into the Seller 2026 products view model.
- `adaptSeller2026ProductDetail` maps product detail, gallery, variants, performance, revision notes, and publish history into a detail view model.
- Live fallback data is empty and generic; preview-only demo products remain scoped to `/seller-2026/products`.

### Still Mocked / Fallback
- Empty products render a safe "Belum ada produk" state.
- Product create/edit routes currently render a local UI shell.
- Product detail safely falls back to generic labels if optional fields are unavailable.

### Disabled Unsafe Mutations
- Create product submit.
- Update product submit.
- Delete product.
- Submit product for review.
- Publish/unpublish.

### Pending Work
- Real create/update product API integration.
- Media upload integration.
- Variant persistence.
- Inventory adjustment workflow.
- SEO persistence.
- Publish/revision lifecycle wiring.

## Live Route Adoption - Catalog Tools

### Routes Adopted
- `/seller/stores/:storeSlug/catalog/categories`
- `/seller/stores/:storeSlug/catalog/attributes`
- `/seller/stores/:storeSlug/catalog/attributes/:attributeId/values`
- `/seller/stores/:storeSlug/catalog/coupons`

### Files Added
- `client/src/pages/seller2026/Seller2026LiveCategoriesPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveAttributesPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveAttributeValuesPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveCouponsPage.jsx`
- `client/src/hooks/seller2026/useSeller2026Categories.ts`
- `client/src/hooks/seller2026/useSeller2026Attributes.ts`
- `client/src/hooks/seller2026/useSeller2026AttributeValues.ts`
- `client/src/hooks/seller2026/useSeller2026Coupons.ts`

### Files Changed
- `client/src/App.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `client/src/api/seller2026/catalog.adapter.ts`

### APIs Used
- `getSellerCategories`
- `getSellerAttributes`
- `getSellerAttributeValues`
- `listSellerCoupons`

### Adapter Mapping
- `adaptSeller2026Categories` maps category list responses into summary, category tree rows, and safe recommended category placeholders.
- `adaptSeller2026Attributes` maps attributes into KPI summary and table rows.
- `adaptSeller2026AttributeValues` maps attribute metadata and values into the values workspace.
- `adaptSeller2026Coupons` maps store coupons into KPI summary, table rows, status chips, and permission flags.

### Still Mocked / Fallback
- Recommended categories remain empty unless the API supplies them.
- Coupon create drawer is UI-only.
- Empty live responses render generic empty states and do not reuse preview category/coupon demo rows.

### Disabled Unsafe Mutations
- Create/edit/delete category.
- Create/edit/delete attribute.
- Create/edit/delete attribute value.
- Create/update/delete coupon.

### Pending Work
- Category mutation integration.
- Attribute mutation integration.
- Coupon mutation integration.
- Coupon validation rules.
- Product-category assignment refinement.

## Live Route Adoption - Orders, Fulfillment & Payments

### Routes Adopted
- `/seller/stores/:storeSlug/orders`
- `/seller/stores/:storeSlug/orders/:suborderId`
- `/seller/stores/:storeSlug/payment-review`
- `/seller/stores/:storeSlug/payment-profile`

### Files Added
- `client/src/pages/seller2026/Seller2026LiveOrdersPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveSuborderDetailPage.jsx`
- `client/src/pages/seller2026/Seller2026LivePaymentReviewPage.jsx`
- `client/src/pages/seller2026/Seller2026LivePaymentProfilePage.jsx`
- `client/src/hooks/seller2026/useSeller2026Orders.ts`
- `client/src/hooks/seller2026/useSeller2026SuborderDetail.ts`
- `client/src/hooks/seller2026/useSeller2026PaymentReview.ts`
- `client/src/hooks/seller2026/useSeller2026PaymentProfile.ts`
- `client/src/api/seller2026/orders-payments.adapter.ts`

### Files Changed
- `client/src/App.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`

### APIs Used
- `getSellerSuborders`
- `getSellerSuborderDetail`
- `getSellerPaymentReviewSuborders`
- `getSellerPaymentProfile`

### Adapter Mapping
- `adaptSeller2026Orders` maps store-owned suborders into fulfillment queue rows, summary counters, and pagination.
- `adaptSeller2026SuborderDetail` maps suborder detail into customer, shipping, items, totals, and timeline sections.
- `adaptSeller2026PaymentReview` maps payment review suborders into review list rows and selected payment detail.
- `adaptSeller2026PaymentProfile` maps active snapshot and pending request data into profile status, methods, documents, and verification timeline.

### Still Mocked / Fallback
- Empty live responses render generic empty states and do not reuse preview order/payment demo rows.
- Payment risk checks fall back to unknown/manual review states when API risk data is not available.
- Balances and payout history currently use safe zero fallbacks until a payout ledger API is wired.

### Disabled Unsafe Mutations
- Pack order.
- Print label.
- Mark shipped.
- Update tracking.
- Save internal note.
- Approve payment.
- Reject payment.
- Refund payment.
- Submit payment profile.
- Upload payment documents.
- Change payout account.

### Pending Work
- Fulfillment mutation integration.
- Shipment label integration.
- Tracking update integration.
- Payment proof review lifecycle.
- Payment profile submit/update flow.
- Payout history integration.

## Live Route Adoption - Team, Invitations, Audit Log & Notifications

### Routes Adopted
- `/seller/stores/:storeSlug/team`
- `/seller/stores/:storeSlug/team/:memberId`
- `/seller/stores/:storeSlug/team/audit`
- `/seller/stores/:storeSlug/notifications`

### Files Added
- `client/src/pages/seller2026/Seller2026LiveTeamPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveMemberDetailPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveTeamAuditPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveNotificationsPage.jsx`
- `client/src/hooks/seller2026/useSeller2026Team.ts`
- `client/src/hooks/seller2026/useSeller2026MemberDetail.ts`
- `client/src/hooks/seller2026/useSeller2026TeamAudit.ts`
- `client/src/hooks/seller2026/useSeller2026Notifications.ts`

### Files Changed
- `client/src/App.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/api/seller2026/team.adapter.ts`
- `client/src/api/seller2026/notifications.adapter.ts`

### APIs Used
- `getSellerTeamSummary`
- `getSellerStoreMemberLifecycle`
- `getSellerTeamAudit`
- `getSellerNotifications`

### Adapter Mapping
- `adaptSeller2026Team` maps team summary, members, roles, member status, and permission summary into the members workspace.
- `adaptSeller2026MemberDetail` maps member lifecycle data into profile, role selector, permission toggles, store access, and grouped permission summary.
- `adaptSeller2026TeamAudit` maps invitation-like members and audit log payload into pending invitations, audit rows, and pagination.
- `adaptSeller2026Notifications` maps notification list payload into summary counters, category counts, priority labels, unread state, and notification rows.

### Still Mocked / Fallback
- Preview route `/seller-2026/team` still uses demo bundle data.
- Empty live team, audit, and notification responses render generic empty states and do not reuse preview team/notification demo rows.
- Store access list remains empty unless the member lifecycle API supplies it.

### Disabled Unsafe Mutations
- Invite member.
- Resend invitation.
- Cancel invitation.
- Update member role.
- Remove member.
- Reset password.
- Mark notifications as read.
- Delete notification.

### Pending Work
- Team invitation mutation integration.
- Role update mutation integration.
- Member removal flow.
- Audit log filter refinement.
- Notification read/delete flow.
- Real-time notification integration.

## Hardening Audit & Production Readiness Pass

### Files Added
- `docs/seller-2026/HARDENING_AUDIT.md`
- `client/src/api/seller2026/mutation-flags.ts`

### Files Changed
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `client/src/features/seller2026/Seller2026Workspace.jsx`

### Summary
- Audited live route consistency for every Seller 2026 route under `/seller/stores/:storeSlug/*`.
- Confirmed preview routes under `/seller-2026/*` remain intact.
- Confirmed live pages use `mode="embedded"` and do not render a second Seller 2026 sidebar.
- Scoped Seller 2026 design tokens to `.s26-app` instead of global `:root`.
- Added explicit mutation readiness flags with all risky Seller 2026 mutations disabled.
- Documented preview leakage, dummy data, storeSlug navigation, mutation safety, adapter fallback, CSS scope, and responsive smoke results.

## Permission Enforcement Pass

### Files Added
- `client/src/api/seller2026/permissions.ts`
- `client/src/pages/seller2026/seller2026PagePermissions.js`
- `docs/seller-2026/PERMISSION_MATRIX.md`

### Files Changed
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `client/src/pages/seller2026/Seller2026Live*Page.jsx`

### Summary
- Added normalized Seller 2026 permission helpers and preview-only full permission constants.
- Live page hooks now use normalized permission checks instead of raw `permissionKeys` reads.
- `Seller2026Workspace` now performs route-level restricted-state rendering when permission source is available.
- Risky action buttons combine permission checks with mutation readiness flags and remain disabled in this phase.
- Permission matrix documents route permissions, action permissions, mutation flags, aliases, known gaps, and next mutation integration phases.

## QA Checklist
- Verify preview pages do not render blank.
- Verify CSS does not affect `/admin/*`, `/`, `/store/:slug`, or `/user/*`.
- Verify sidebar links preserve preview routing.
- Verify dark mode toggle works and remains scoped to Seller 2026.
- Verify responsive layouts at 1440, 1280, 1024, 768, and 390 px.
- Run `npm run build` from `client`.
