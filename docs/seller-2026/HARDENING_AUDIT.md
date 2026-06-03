# Seller Workspace 2026 Hardening Audit

## Scope
- Audited Seller Workspace 2026 preview and live adoption routes.
- Preview routes under `/seller-2026/*` are retained as visual regression playgrounds.
- Live routes under `/seller/stores/:storeSlug/*` remain wrapped by the existing `SellerLayout`.
- This pass does not enable create/update/delete, fulfillment, payment review, or team mutations. Notification read-state mutations are enabled in a later scoped pass.

## Route Map
- `/seller/stores/:storeSlug/dashboard` -> `Seller2026LiveDashboardPage`
- `/seller/stores/:storeSlug/store-profile` -> `Seller2026LiveStorefrontPage`
- `/seller/stores/:storeSlug/microsite-preview` -> `Seller2026LiveStorefrontPage`
- `/seller/stores/:storeSlug/catalog/products` -> `Seller2026LiveProductsPage`
- `/seller/stores/:storeSlug/catalog/products/new` -> `Seller2026LiveProductEditorPage`
- `/seller/stores/:storeSlug/catalog/products/:productId` -> `Seller2026LiveProductDetailPage`
- `/seller/stores/:storeSlug/catalog/products/:productId/edit` -> `Seller2026LiveProductEditorPage`
- `/seller/stores/:storeSlug/catalog/categories` -> `Seller2026LiveCategoriesPage`
- `/seller/stores/:storeSlug/catalog/attributes` -> `Seller2026LiveAttributesPage`
- `/seller/stores/:storeSlug/catalog/attributes/:attributeId/values` -> `Seller2026LiveAttributeValuesPage`
- `/seller/stores/:storeSlug/catalog/coupons` -> `Seller2026LiveCouponsPage`
- `/seller/stores/:storeSlug/orders` -> `Seller2026LiveOrdersPage`
- `/seller/stores/:storeSlug/orders/:suborderId` -> `Seller2026LiveSuborderDetailPage`
- `/seller/stores/:storeSlug/payment-review` -> `Seller2026LivePaymentReviewPage`
- `/seller/stores/:storeSlug/payment-profile` -> `Seller2026LivePaymentProfilePage`
- `/seller/stores/:storeSlug/team` -> `Seller2026LiveTeamPage`
- `/seller/stores/:storeSlug/team/audit` -> `Seller2026LiveTeamAuditPage`
- `/seller/stores/:storeSlug/team/:memberId` -> `Seller2026LiveMemberDetailPage`
- `/seller/stores/:storeSlug/notifications` -> `Seller2026LiveNotificationsPage`

## Route Consistency Check
- `team/audit` is declared before `team/:memberId`.
- `catalog/products/new` is declared before `catalog/products/:productId`.
- `catalog/products/:productId/edit` is declared before `catalog/products/:productId`.
- Legacy redirect routes for old seller catalog/profile paths remain in place.

## Preview Leakage Check
- Search: `/seller-2026` in `client/src` and `docs/seller-2026`.
- Result: preview paths are limited to preview route config, docs, and standalone fallback links used when no `storeSlug` exists.
- Live pages and hooks do not hardcode `/seller-2026/*`.
- Embedded live sidebar uses `SellerLayout`; the Seller 2026 internal sidebar is hidden.

## Dummy Data Leakage Check
- Search terms: `Oase Sehat`, `Hijab Voal`, `Batik Nusantara`, `Dewi Lestari`, `Budi Santoso`, `Kemeja Batik`, `WELCOME10`.
- Result: demo names remain in preview data and non-live fallback sections only.
- Live hooks/adapters/pages use API data or generic fallback/empty states such as `Belum ada produk`, `Belum ada pesanan`, `Belum ada anggota tim`, and `Data belum tersedia`.

## Embedded Layout Check
- All `Seller2026Live*Page` components pass `mode="embedded"` to `Seller2026Workspace`.
- `Seller2026Workspace` hides the internal Seller 2026 sidebar and topbar in embedded mode.
- Smoke tests covered live guarded routes without detecting blank or fatal rendering.

## StoreSlug Navigation Check
- Live navigation inside `Seller2026Workspace` builds paths from `useParams().storeSlug`.
- Hardcoded live store examples such as `/seller/stores/demo-store/*` are not present in source; `demo-store` appears only in local smoke commands.
- Existing route helper `useSellerWorkspaceRoute` continues to resolve `workspaceStoreId`, `workspaceStoreSlug`, and store-scoped route builders for live pages.

## Mutation Safety Check
- `SELLER_2026_MUTATIONS` centralizes mutation readiness; `storeProfileUpdate`, `productDraftSave`, and notification read-state mutations are currently enabled.
- Product mutations disabled: create/submit/publish/delete/save draft/media upload/inventory adjustment.
- Catalog mutations disabled: create/edit/delete category, attribute, attribute value, and coupon.
- Orders/payments mutations disabled: pack order, print label, mark shipped, update tracking, save internal note, approve payment, reject payment, refund payment, submit payment profile, upload payment documents, change payout account.
- Team mutations disabled: invite member, resend invitation, cancel invitation, update role, remove member, reset password.
- Notification mutations enabled: mark one notification as read and mark all seller notifications as read.
- Notification mutations disabled: delete notification, create notification, admin notification read state, and real-time push actions.

## Adapter Fallback Check
- Reviewed Seller 2026 adapters in `client/src/api/seller2026`.
- Empty arrays fall back to `[]`.
- Numeric fields fall back to `0`.
- Unknown statuses normalize to safe values such as `unknown`, `inactive`, `draft`, or `UNKNOWN`.
- UI view-model adapters isolate raw API payloads from Seller 2026 components.

## Loading, Error, Empty, and Not Found Check
- Live list routes expose loading, error, retry, and empty states.
- Invalid detail routes render safe not-found states for product detail, attribute values, suborder detail, and member detail.
- Guarded live routes without a session are expected to show auth/session-required UI rather than blank screens.

## CSS Scope Check
- Seller 2026 styles are colocated at `client/src/features/seller2026/Seller2026DesignSystem.css`.
- CSS now includes a scope guard comment.
- Design tokens are scoped to `.s26-app` instead of `:root`.
- No global selectors such as `button`, `table`, `input`, `body`, `.card`, `.sidebar`, or `.layout` were found in Seller 2026 CSS.

## Responsive Smoke Check
- Desktop: 1440x900 passed.
- Tablet: 768x1024 passed.
- Mobile: 390x844 passed.
- Groups covered: dashboard, store profile, products, catalog tools, orders/payments, team/notifications, and preview entry routes.
- Assertions: nonblank page, no fatal console error, no fatal horizontal overflow, expected heading/auth guard visible.

## Verification
- `npm.cmd run build` passed.
- Targeted ESLint for Seller 2026 TS files passed.
- Current ESLint config ignores Seller 2026 `.jsx` files; this remains documented as existing config behavior.
- Playwright smoke passed for preview and live guarded routes.

## Known Issues
- Seller 2026 `.jsx` files are ignored by current ESLint config.
- Repo-wide lint debt remains outside this hardening scope.
- Mutations remain disabled except the low-risk store profile update, product draft save, and seller notification read-state flows.
- Some preview detail routes share the same domain workspace shell by design.

## Next Recommended Phase
- Add explicit permission-enforcement UX per action group.
- Integrate mutations by domain, starting with the lowest-risk draft-only flows.
- Add API contract tests for each Seller 2026 adapter.
- Add persistent Playwright smoke coverage to CI once test authentication fixtures are available.
- Continue backend store-scope verification for every seller mutation endpoint.

## Permission Enforcement Addendum
- Added `client/src/api/seller2026/permissions.ts` for normalized permission reads, aliases, route checks, and action checks.
- Added `docs/seller-2026/PERMISSION_MATRIX.md`.
- Live Seller 2026 pages now use normalized permission checks before enabling data hooks.
- `Seller2026Workspace` renders a scoped restricted state when permission source exists and route permission is missing.
- Mutation flags remain disabled and continue to gate all risky actions after permission checks.

## Store Profile Mutation Addendum
- Enabled only `SELLER_2026_MUTATIONS.storeProfileUpdate`.
- Store profile update requires `STORE_PROFILE_UPDATE`, aliased to backend `STORE_EDIT`.
- Live store profile submits a whitelisted payload to `PATCH /api/seller/stores/:storeId/store-profile`.
- Backend safety check confirmed `requireSellerStoreAccess(["STORE_EDIT"])`, strict payload schema, and read-only field rejection.
- Logo/banner upload, theme persistence, policy editor, and submit-for-review remain disabled.
- Preview route `/seller-2026/storefront` remains mock-only.

## Product Draft Mutation Addendum
- Enabled `SELLER_2026_MUTATIONS.productDraftSave`.
- Create draft requires `CATALOG_PRODUCT_CREATE`, aliased to backend `PRODUCT_CREATE`.
- Update draft requires `CATALOG_PRODUCT_UPDATE`, aliased to backend `PRODUCT_EDIT`.
- Live product editor submits a whitelisted payload to seller draft endpoints.
- Backend safety check confirmed store-scoped create/update routes and draft-safe create defaults.
- Submit review, publish/unpublish, delete, media upload, and variant persistence remain disabled.

## Notification Read Mutation Addendum
- Enabled `SELLER_2026_MUTATIONS.notifications`.
- Mark one/all read requires `NOTIFICATION_READ`, aliased to backend `STORE_VIEW`.
- Live notifications route uses store-scoped seller notification endpoints.
- Backend service scope was reviewed: mutations filter by seller audience, authenticated user id, and store id.
- SellerLayout notification dropdown queries are invalidated after Seller 2026 read mutations.
- Notification delete, admin notification state, and real-time push integration remain disabled.

## Coupon Lifecycle Mutation Addendum
- Enabled `SELLER_2026_MUTATIONS.coupons`.
- Create coupon requires `COUPON_CREATE`.
- Edit coupon requires `COUPON_UPDATE`, aliased to backend `COUPON_EDIT`.
- Activate/deactivate requires `COUPON_STATUS_MANAGE`.
- Archive requires `COUPON_DELETE`, aliased to backend `COUPON_STATUS_MANAGE`.
- Live coupons route uses existing store-scoped seller coupon endpoints.
- Backend scope was reviewed: create forces `scopeType: "STORE"` and the resolved `storeId`; edit/delete find coupons by store scope before mutation.
- UI payloads are whitelisted in `client/src/api/seller2026/coupons.mutations.ts`.
- Hard delete, duplicate, import/export, and banner upload remain disabled.
- Preview route `/seller-2026/catalog-tools` remains mock-only.
