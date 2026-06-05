# TP Preneurs Multivendor System Map

## Seller Workspace Canonical Routes

Seller Workspace is store-scoped under `/seller/stores/:storeSlug` and is rendered through `client/src/layouts/SellerLayout.jsx`. The layout resolves seller session, store context, canonical store slug, permissions, navigation, theme state, and seller notifications before rendering route children.

| Area | Canonical Route | Current Component |
|---|---|---|
| Dashboard | `/seller/stores/:storeSlug` | `Seller2026LiveDashboardPage` |
| Dashboard | `/seller/stores/:storeSlug/dashboard` | `Seller2026LiveDashboardPage` |
| Store Profile | `/seller/stores/:storeSlug/store-profile` | `Seller2026LiveStorefrontPage` |
| Products | `/seller/stores/:storeSlug/catalog/products` | `Seller2026LiveProductsPage` |
| Product Create | `/seller/stores/:storeSlug/catalog/products/new` | `Seller2026LiveProductEditorPage mode=create` |
| Product Detail | `/seller/stores/:storeSlug/catalog/products/:productId` | `Seller2026LiveProductDetailPage` |
| Product Edit | `/seller/stores/:storeSlug/catalog/products/:productId/edit` | `Seller2026LiveProductEditorPage mode=edit` |
| Categories | `/seller/stores/:storeSlug/catalog/categories` | `Seller2026LiveCategoriesPage` |
| Attributes | `/seller/stores/:storeSlug/catalog/attributes` | `Seller2026LiveAttributesPage` |
| Attribute Values | `/seller/stores/:storeSlug/catalog/attributes/:attributeId/values` | `Seller2026LiveAttributeValuesPage` |
| Orders | `/seller/stores/:storeSlug/orders` | `Seller2026LiveOrdersPage` |
| Order Detail | `/seller/stores/:storeSlug/orders/:suborderId` | `Seller2026LiveSuborderDetailPage` |
| Payment Review | `/seller/stores/:storeSlug/payment-review` | `Seller2026LivePaymentReviewPage` |
| Payment Profile | `/seller/stores/:storeSlug/payment-profile` | `Seller2026LivePaymentProfilePage` |
| Coupons | `/seller/stores/:storeSlug/catalog/coupons` | `Seller2026LiveCouponsPage` |
| Team | `/seller/stores/:storeSlug/team` | `Seller2026LiveTeamPage` |
| Team Audit | `/seller/stores/:storeSlug/team/audit` | `Seller2026LiveTeamAuditPage` |
| Member Lifecycle | `/seller/stores/:storeSlug/team/:memberId` | `Seller2026LiveMemberDetailPage` |
| Notifications | `/seller/stores/:storeSlug/notifications` | `Seller2026LiveNotificationsPage` |

## Seller Workspace Legacy Redirects

| Legacy Route | Canonical Target |
|---|---|
| `/seller/stores/:storeSlug/profile` | `/seller/stores/:storeSlug/store-profile` |
| `/seller/stores/:storeSlug/catalog` | `/seller/stores/:storeSlug/catalog/products` |
| `/seller/stores/:storeSlug/catalog/new` | `/seller/stores/:storeSlug/catalog/products/new` |
| `/seller/stores/:storeSlug/catalog/:productId` | `/seller/stores/:storeSlug/catalog/products/:productId` |
| `/seller/stores/:storeSlug/catalog/:productId/edit` | `/seller/stores/:storeSlug/catalog/products/:productId/edit` |
| `/seller/stores/:storeSlug/coupons` | `/seller/stores/:storeSlug/catalog/coupons` |
| `/user/store-payment-profile` | seller payment profile handoff through account legacy route |
| `/user/store-payment-review` | seller payment review handoff through account legacy route |

## Seller Workspace API Boundaries

Seller Workspace 2026 live pages use existing store-scoped seller APIs and seller2026 adapters. Backend routes, database schema, auth middleware, permission map, Admin Workspace, and Client Storefront remain outside the Seller Workspace 2026 slicing adoption boundary unless a separate collaboration plan approves changes.

| Domain | API Modules |
|---|---|
| Dashboard / Readiness / Analytics | `sellerWorkspace.ts`, `sellerOrders.ts`, `sellerNotifications.ts` |
| Store Profile | `sellerStoreProfile.ts`, `sellerWorkspace.ts`, `sellerPaymentProfile.ts` |
| Products | `sellerProducts.ts`, `sellerCategories.ts`, `sellerAttributes.ts` |
| Categories | `sellerCategories.ts` |
| Attributes | `sellerAttributes.ts` |
| Orders | `sellerOrders.ts` |
| Payments | `sellerPayments.ts`, `sellerPaymentProfile.ts` |
| Coupons | `sellerCoupons.ts` |
| Team | `sellerTeam.ts`, `sellerTeamAudit.ts`, `sellerInvitations.ts` |
| Notifications | `sellerNotifications.ts` |

## Seller Workspace 2026 Adoption Status

- Canonical Seller Workspace routes are now mapped to Seller2026Live pages.
- Legacy redirects remain active.
- Analytics live route is not enabled yet and remains NEEDS REVIEW.
- Authenticated browser smoke is required.
- Repo-wide lint debt remains separate from this adoption.

## Seller Workspace 2026 Live Smoke Status

- Date: 2026-06-03.
- Auth/session fixture: `seller.owner@example.test` / `Password123!` as store owner, `seller.member@example.test` / `Password123!` as `ORDER_MANAGER`, `seller.other@example.test` as a separate store owner, and `seller.buyer@example.test` for order/payment proof rows.
- Store fixture: `tp-preneurs-demo-store` with active owner membership, active shipping setup, active QRIS payment profile, products, categories, store-scoped attributes/values, coupons, suborders, payment proof, audit rows, and seller notification.
- Cross-store guard fixture: `other-demo-store`; owner of `tp-preneurs-demo-store` receives forbidden access on `/seller/stores/other-demo-store`.
- Smoke runner: `pnpm exec tsx scripts/seller2026-auth-fixture-live-smoke.ts`.
- Canonical live route status: PASS for dashboard, store profile, microsite preview, product list/create/detail/edit, categories, attributes, attribute values, coupons, orders, order detail, payment review, payment profile, team, member detail, team audit, and notifications.
- Legacy redirect status: PASS for `/catalog`, `/catalog/new`, `/catalog/:productId`, `/catalog/:productId/edit`, and `/coupons`.
- API wiring status: observed 200s for seller context, workspace readiness, finance summary, analytics summary, store profile, products, product submit review, authoring meta, categories, attributes, attribute values, coupons, suborders, suborder detail, payment review/profile, team, audit, notifications, and unread count. Observed expected 403 for cross-store context.
- Runtime patch from smoke: dashboard table keys now include row index suffixes to avoid duplicate React keys when live rows use fallback `-` identifiers.
- Permission smoke status: `ORDER_MANAGER` session loads permitted read lanes; restricted team/payment-profile pages render workspace shell with page-level permission handling rather than cross-store/session failure.
- Analytics route status: still NEEDS REVIEW as a standalone Seller 2026 route; dashboard uses existing live analytics summary API.
- Validation status: `pnpm -F client exec tsc -b` PASS, `pnpm -F client build` PASS. Targeted ESLint over live seller bridge files still fails on pre-existing `@typescript-eslint/no-explicit-any` debt in `client/src/api/seller*.ts`; narrower Seller 2026 adapters/pages/hooks smoke did not expose runtime errors.

## Seller Workspace 2026 API Delta Status

- Date: 2026-06-03.
- Scope: frontend Seller 2026 adapters, permission aliases, and documentation only. Backend routes, schema, auth middleware, permission map, `App.jsx`, layout, and legacy global seller API modules were not changed in this pass.
- API delta hardening: Seller 2026 adapters now consume more of the existing live DTOs for store profile, products, orders, payments, and team member permissions; permission aliases now bridge Seller 2026 UI capability names to the existing backend permission keys.

| Area | Status | Notes |
|---|---|---|
| Dashboard | LIVE_API_CONNECTED | Uses live seller context, readiness, finance summary, analytics summary, products, orders, and notifications. Standalone analytics route remains separate. |
| Store Profile | LIVE_API_CONNECTED | Store profile adapter maps live identity, socials, logo/cover, rich-about, hours, and status fields. Rich profile layout breadth and future mutations remain review items. |
| Product Catalog | LIVE_API_CONNECTED | Product list maps live pricing, thumbnail/media preview, nested category, inventory, operational status, and submission status. |
| Product Authoring | PARTIAL_API_CONNECTED_AND_SUBMIT_READY | Basic draft save/edit and submit review are wired for persisted draft products; media, variants, direct publish/archive/delete, and bulk actions remain disabled pending canonical mutation review. |
| Product Detail | LIVE_API_CONNECTED | Detail adapter maps live descriptions, media gallery, category/default assignment, pricing, tags, submission status, and revision notes. |
| Product Edit | PARTIAL_API_CONNECTED_AND_SUBMIT_READY | Existing draft fields are wired through live product detail/update paths; submit review uses the store-scoped backend route. Rich media/variant/direct publish controls remain disabled. |
| Categories | LIVE_API_CONNECTED | Existing live category APIs are used. |
| Attributes | LIVE_API_CONNECTED | Existing live attribute and value APIs are used. |
| Orders | LIVE_API_CONNECTED | Order rows map live read model status, payment state, totals, customer, and fulfillment fields. |
| Order Detail | LIVE_API_CONNECTED | Detail maps live seller-scope read model totals, status, payment state, items, and shipping/payment fields. |
| Payment Review | LIVE_API_CONNECTED_AND_MUTATION_READY | Read view uses live payment review suborders and proof fields; approve/reject use the existing store-scoped seller review route when backend governance exposes `canReview`. Request clarification/refund/dispute remain disabled. |
| Payment Profile | LIVE_API_CONNECTED_AND_REQUEST_READY | Adapter maps active snapshot, pending request, readiness, QRIS status, verification fields, and request governance. Seller can submit a store-scoped request for admin review; approval/activation/payout remain disabled. |
| Coupons | LIVE_API_CONNECTED | Coupon read/list lane uses existing live API; create/edit/delete lifecycle controls remain disabled pending mutation review. |
| Team | LIVE_API_CONNECTED | Team list and member detail use live team APIs. UI permissions now recognize legacy backend permission keys through Seller 2026 aliases. |
| Member Lifecycle | LIVE_API_CONNECTED | Member lifecycle endpoint is reachable in smoke; destructive/status/role mutations remain guarded by permission and mutation flags. |
| Team Audit | LIVE_API_CONNECTED | Live audit rows render through the canonical team audit route. Export remains disabled pending API review. |
| Notifications | LIVE_API_CONNECTED | Notifications, unread count, mark-one-read, and mark-all-read use existing store-scoped live APIs. Delete/admin/push notification mutations remain disabled. |
| Analytics | NEEDS_REVIEW | No standalone Seller 2026 analytics route is enabled; dashboard continues to use live analytics summary API. |
| Preview routes under `/seller-2026` | MOCK_ONLY | Preview/slicing routes intentionally remain mock-only and outside the live canonical workspace. |

## Seller Workspace 2026 Mutation Status

- Date: 2026-06-03.
- Scope: frontend Seller 2026 mutation review and enablement only. Backend routes/schema/auth/permission model, canonical routes, Admin Workspace, and Client Storefront were not changed.
- Enablement decision: only notification mark-read mutations were enabled in this pass because they have clear store-scoped endpoints, clear `STORE_VIEW` backend guard, a Seller 2026 permission alias through `NOTIFICATION_READ`, idempotent behavior, and deterministic smoke fixture coverage.

| Area | Mutation | Status | Notes |
|---|---|---|---|
| Product | Save draft/create draft/basic edit | WIRED_AND_TESTED | Existing Seller 2026 draft save remains wired via store-scoped product draft APIs and smoke route coverage. |
| Product Catalog | Add Product CTA | FIXED_AND_TESTED | Navigates to canonical `/seller/stores/:storeSlug/catalog/products/new` when the seller has `CATALOG_PRODUCT_CREATE`; product lifecycle mutations remain separately guarded. |
| Product | Submit review | WIRED_AND_TESTED | Existing store-scoped endpoint is wired for persisted draft products only; no payload is sent and direct publish remains disabled. |
| Product | Submit readiness checklist | WIRED_AND_TESTED | Required readiness blockers gate submit review; category and description are recommended warnings until backend requires them. |
| Product | English copy harmonization | FIXED_AND_TESTED | Product authoring/edit/detail/list copy touched by Seller 2026 submit review is English-only. |
| Product | Duplicate | DISABLED_PENDING_API | Endpoint exists; UI action remains disabled until confirmation/refetch and disposable fixture path are added. |
| Product | Archive/delete | DISABLED_PENDING_API | Endpoint exists and may archive referenced products; keep disabled until UI confirmation and fixture safety are explicit. |
| Product | Publish/unpublish | DISABLED_PENDING_PERMISSION_REVIEW | Backend can block direct publish when admin approval is required; Seller 2026 UI keeps direct publish disabled. |
| Product | Media/variants | DISABLED_PENDING_API | Upload and variant contracts exist in older flows, but Seller 2026 payload/UI lifecycle is not fully wired. |
| Order | Fulfillment/status update | DISABLED_PENDING_API | Store-scoped endpoint exists, but shipment mutation rollout and transition payload need a focused UI workflow before enabling. |
| Order | Bulk fulfillment / bulk delete | NEEDS_BACKEND_REVIEW | Bulk delete exists but is destructive; no Seller 2026 bulk fulfillment UI was enabled. |
| Order | Print/download receipt or label | NEEDS_BACKEND_REVIEW | No clear Seller 2026 store-scoped print/download endpoint was confirmed. |
| Payment Review | Approve/reject | WIRED_AND_TESTED | Store-scoped endpoint exists; backend limits mutation to owner/admin roles and proof/payment pending state. UI requires backend `canReview` governance. |
| Payment Review | Request clarification / dispute / note update | NEEDS_BACKEND_REVIEW | No distinct store-scoped Seller 2026 endpoint was confirmed; request clarification remains disabled. |
| Payment Profile | Submit/update profile request | WIRED_AND_TESTED | Store-scoped endpoint exists; UI submits whitelisted request fields for admin review. Direct approval/activation/payout/document upload remain disabled. |
| Coupon | Create/edit/status/delete | DISABLED_PENDING_API | Store-scoped endpoints exist; UI form/lifecycle remains guarded pending validation and disposable fixture flow. |
| Coupon | Duplicate | NEEDS_BACKEND_REVIEW | No clear duplicate coupon endpoint was confirmed. |
| Team | Invite/resend/change role/change status/remove | DISABLED_PENDING_PERMISSION_REVIEW | Endpoints and backend guards exist; UI forms/actions remain disabled until self-remove, role hierarchy, and fixture rollback are fully tested. |
| Notification | Mark one as read | WIRED_AND_TESTED | Store-scoped endpoint is wired in Seller 2026 UI and smoke-tested with fixture notification `200`. |
| Notification | Mark all as read | WIRED_AND_TESTED | Store-scoped endpoint is wired in Seller 2026 UI and smoke-tested with fixture store `200`. |
| Team Audit | Export | NEEDS_BACKEND_REVIEW | Audit list API exists; no clear export endpoint was confirmed, so export stays disabled. |

## Seller Workspace 2026 Coupon Lifecycle Mutation Status

- Date: 2026-06-03.
- Scope: frontend Seller 2026 coupon lifecycle wiring only. Backend routes, schema, auth middleware, permission map, Admin Workspace, and Client Storefront were not changed.
- Route: `/seller/stores/:storeSlug/catalog/coupons`.

| Mutation | Status | Endpoint | Permission | Notes |
|---|---|---|---|---|
| Create coupon | WIRED_AND_TESTED | `POST /api/seller/stores/:storeId/coupons` | `COUPON_CREATE` | Payload is whitelisted and backend forces store scope. |
| Edit coupon | WIRED_AND_TESTED | `PATCH /api/seller/stores/:storeId/coupons/:couponId` | `COUPON_UPDATE` -> `COUPON_EDIT` | Updates supported fields only. |
| Activate/deactivate | WIRED_AND_TESTED | `PATCH /api/seller/stores/:storeId/coupons/:couponId` | `COUPON_STATUS_MANAGE` | Uses `{ active }` and backend status permission check. |
| Archive coupon | WIRED_AND_TESTED_AS_DEACTIVATE | `DELETE /api/seller/stores/:storeId/coupons/:couponId` | `COUPON_DELETE` -> `COUPON_STATUS_MANAGE` | Existing backend delete route deactivates the store coupon; UI labels this as archive. |
| Hard delete | DISABLED | n/a | n/a | No Seller 2026 hard-delete action is exposed. |

## Seller Workspace 2026 Order Fulfillment Mutation Status

- Date: 2026-06-03.
- Scope: frontend Seller 2026 order fulfillment wiring only. Backend routes, schema, auth middleware, permission map, Admin Workspace, payment review flow, and Client Storefront were not changed.
- Routes: `/seller/stores/:storeSlug/orders` and `/seller/stores/:storeSlug/orders/:suborderId`.

| Mutation | Status | Endpoint | Permission | Notes |
|---|---|---|---|---|
| Mark packed | WIRED_AND_TESTED | `PATCH /api/seller/stores/:storeId/suborders/:suborderId/fulfillment` | `ORDER_FULFILLMENT_UPDATE` -> `ORDER_FULFILLMENT_MANAGE` | Uses backend action `MARK_PROCESSING` when governance exposes it. |
| Mark shipped | WIRED_AND_TESTED | `PATCH /api/seller/stores/:storeId/suborders/:suborderId/fulfillment` | `ORDER_FULFILLMENT_UPDATE` -> `ORDER_FULFILLMENT_MANAGE` | Uses backend action `MARK_SHIPPED`. |
| Mark delivered | WIRED_READY | `PATCH /api/seller/stores/:storeId/suborders/:suborderId/fulfillment` | `ORDER_FULFILLMENT_UPDATE` -> `ORDER_FULFILLMENT_MANAGE` | Enabled only when backend governance exposes `MARK_DELIVERED`. |
| Tracking/resi update | DISABLED_PENDING_API | n/a | n/a | Backend route accepts tracking fields, but current smoke read model remains legacy fallback/no persisted shipment tracking. |
| Payment status mutation | DISABLED | n/a | n/a | Seller 2026 order pages keep payment state read-only. |
| Bulk fulfillment / bulk delete | DISABLED_PENDING_REVIEW | n/a | n/a | Existing destructive/bulk flows need separate review before UI exposure. |
| Print receipt / label | DISABLED_PENDING_API | n/a | n/a | No Seller 2026 store-scoped print endpoint was wired in this pass. |

Notification mutation smoke assertion: fixture unread count changed `2 -> 1` after mark-one-read and `1 -> 0` after mark-all-read.

Product submit review smoke assertion: fixture product `S26-DRAFT` was reset to draft/unsubmitted, submitted through `/seller/stores/:storeSlug/catalog/products/:productId/edit`, and `POST /api/seller/stores/:storeId/products/:productId/submit-review` returned `200`; no direct `Publish` button was exposed.
