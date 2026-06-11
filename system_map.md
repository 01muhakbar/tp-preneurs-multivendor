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
| Order Detail | `/seller/stores/:storeSlug/orders/:suborderId` | `SellerOrderDetailPage` deep-link fallback |
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

1. `SELLER-WORKSPACE-2026-PROD-ADOPT-COUPONS-22`
2. `SELLER-WORKSPACE-2026-PROD-HARDEN-TEAM-23`

## Seller Workspace 2026 Production Hardening — Coupons

Status: COUPONS_HARDENED_PENDING_ADOPTION

Scope:
- Coupons 2026 list/attribution workflow audited and hardened.
- Coupon owner/scope guardrails audited.
- Destructive mutation guardrails audited.
- Checkout validation unchanged requirement documented.
- Production route is not replaced in this task.

Preview Route:
- `/seller-2026-preview/:storeSlug/coupons`

Future Production Route:
- `/seller/stores/:storeSlug/catalog/coupons`

Feature Flag Prepared:
- `VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED`

Guardrail:
- Default flag state is off.
- Backend API contracts are not changed.
- Existing Seller Coupons page is not deleted.
- Checkout coupon validation is not changed.
- Seller cannot mutate platform/admin coupons.
- Destructive coupon mutation requires attribution validation and confirmation.
- Rollback is keeping legacy Coupons route.

Next:
1. `SELLER-WORKSPACE-2026-PROD-ADOPT-COUPONS-22`
2. `SELLER-WORKSPACE-2026-PROD-HARDEN-TEAM-23`

## Seller Workspace 2026 Production Adoption — Coupons

Status: COUPONS_PRODUCTION_ADOPTION_FLAGGED

Scope:
- Coupons 2026 can be adopted on production Coupons route via feature flag.
- Legacy Seller Coupons remains available as rollback.
- Preview route remains available.
- Coupon mutations remain disabled until attribution and confirmation workflows are validated.

Production Route:
- `/seller/stores/:storeSlug/catalog/coupons`

Preview Route:
- `/seller-2026-preview/:storeSlug/coupons`

Feature Flags:
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED`

Guardrail:
- Default flag state is off.
- Backend API contracts are not changed.
- Existing Seller Coupons page is not deleted.
- Checkout coupon validation is not changed.
- Seller cannot mutate platform/admin coupons.
- Create/Edit/Delete/Archive remain disabled unless attribution and confirmation are validated.
- Rollback is feature-flag off.

Next:
1. `SELLER-WORKSPACE-2026-PROD-ADOPT-TEAM-24`
2. `SELLER-WORKSPACE-2026-PROD-HARDEN-PAYMENT-CENTER-25`

## Seller Workspace 2026 Production Hardening — Team

Status: TEAM_HARDENED_PENDING_ADOPTION

Scope:
- Team 2026 members/roles/audit workflow audited and hardened.
- Permission matrix is informational and backend-owned.
- Team mutation guardrails audited.
- Production route is not replaced in this task.

Preview Route:
- `/seller-2026-preview/:storeSlug/team`

Future Production Routes:
- `/seller/stores/:storeSlug/team`
- `/seller/stores/:storeSlug/team/audit`

Feature Flag Prepared:
- `VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED`

Guardrail:
- Default flag state is off.
- Backend API contracts are not changed.
- Existing Seller Team pages are not deleted.
- Backend permissions remain final enforcement.
- UI permission matrix is informational only.
- Team mutations remain disabled until permission workflow validation.
- Owner/current-user destructive actions remain blocked.
- Rollback is keeping legacy Team route.

Next:
1. `SELLER-WORKSPACE-2026-PROD-HARDEN-ANALYTICS-SYNC-27`
2. `SELLER-WORKSPACE-2026-PROD-FINAL-SMOKE-28`

## Seller Workspace 2026 Production Adoption — Payment Center

Status: PAYMENT_CENTER_PRODUCTION_ADOPTION_FLAGGED_READ_ONLY

Scope:
- Payment Center 2026 can be adopted on production payment routes via feature flag.
- Legacy Seller Payment Review/Profile remain available as rollback.
- Preview route remains available.
- Production adoption is read-only first.

Production Routes:
- `/seller/stores/:storeSlug/payment-review`
- `/seller/stores/:storeSlug/payment-profile`

Preview Route:
- `/seller-2026-preview/:storeSlug/payment-center`

Feature Flags:
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED`

Guardrail:
- Default flag state is off.
- Backend API contracts are not changed.
- Existing Seller Payment pages are not deleted.
- Admin/payment audit remains final authority.
- Seller cannot self-activate payout profile.
- Payment approve/reject/recheck actions remain disabled until confirmation workflow is validated.
- Settlement/payout mutation remains unavailable from Seller UI 2026.
- Rollback is feature-flag off.

Next:
1. `SELLER-WORKSPACE-2026-PROD-HARDEN-ANALYTICS-SYNC-27`
2. `SELLER-WORKSPACE-2026-PROD-FINAL-SMOKE-28`

## Seller Workspace 2026 Production Hardening — Analytics & Storefront Sync

Status: ANALYTICS_SYNC_HARDENED_PREVIEW_ONLY

Scope:
- Analytics & Storefront Sync 2026 workflow audited and hardened.
- Analytics/read-only data mapping remains available in preview.
- Storefront sync/public preview remains read-only.
- Production route is not introduced in this task.

Preview Route:
- `/seller-2026-preview/:storeSlug/analytics-sync`

Production Route:
- Not adopted yet / no canonical production route assigned.

Feature Flag Prepared:
- `VITE_SELLER_WORKSPACE_2026_ANALYTICS_SYNC_ENABLED`

Guardrail:
- Default flag state is off.
- Backend API contracts are not changed.
- Public storefront visibility is not changed.
- Product visibility/publish status is not changed.
- Sync Now/Rebuild Index/Publish Storefront remain disabled.
- Storefront preview is read-only.
- Rollback is keeping preview-only module.

Readiness:
- `PREVIEW_ONLY` until production route strategy and public visibility workflow are validated.

Next:
1. `SELLER-WORKSPACE-2026-PROD-FINAL-SMOKE-28`
2. `SELLER-WORKSPACE-2026-RELEASE-NOTES-29`

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

## Seller Workspace 2026 UI Polish Parity

Status: PREVIEW_UI_POLISHED

Scope:
- Preview Seller Workspace 2026 UI polished across all live-adapter pages.
- Light/dark theme parity improved.
- Shared visual components introduced.
- Fallback, loading, empty, disabled, and status states standardized.
- Guardrails remain unchanged.

Locations:
- `client/src/features/sellerWorkspace2026/components/Seller2026Shell.jsx`
- `client/src/features/sellerWorkspace2026/components/Seller2026FallbackBanner.jsx`
- `client/src/features/sellerWorkspace2026/SellerWorkspace2026.css`
- `client/src/pages/seller2026/*`

Guardrail:
- Production Seller canonical routes are not replaced.
- Existing Seller production pages are not deleted.
- Backend API contracts are not changed.
- No new mutation authority is introduced.
- Public storefront visibility is not changed.
- Preview remains isolated.

Next:
1. Production adoption plan per route
2. Route-by-route live replacement proposal
3. Final UI regression smoke before production adoption

## Seller Workspace 2026 Production Adoption Plan

Status: PRODUCTION_ADOPTION_PLANNED

Scope:
- Preview Seller Workspace 2026 is complete and polished.
- Production adoption will be route-by-route.
- Feature-flagged adoption is recommended.
- Rollback to existing Seller pages remains required.

Initial Recommendation:
- Start with Product Catalog read-only adoption.
- Keep mutation-heavy and governance-sensitive routes in preview until hardening is complete.

Guardrail:
- Existing production Seller pages are not deleted.
- Preview routes remain available.
- Backend API contracts are not changed.
- Admin authority remains unchanged.
- Public storefront visibility remains unchanged.
- Payment and permission governance remain backend/Admin controlled.

Next:
1. `SELLER-WORKSPACE-2026-PROD-ADOPT-CATALOG-13`
2. `SELLER-WORKSPACE-2026-PROD-ADOPT-PRODUCT-DETAIL-14`
3. `SELLER-WORKSPACE-2026-PROD-HARDEN-AUTHORING-15`

## Seller Workspace 2026 Production Adoption — Product Catalog

Status: CATALOG_PRODUCTION_ADOPTION_FLAGGED

Scope:
- Product Catalog 2026 can be adopted on production route via feature flag.
- Legacy Seller Catalog remains available as rollback.
- Preview route remains available.

Production Route:
- `/seller/stores/:storeSlug/catalog/products`

Preview Route:
- `/seller-2026-preview/:storeSlug/catalog/products`

Feature Flags:
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED`

Guardrail:
- Default flag state is off.
- Backend API contracts are not changed.
- Existing Seller Catalog page is not deleted.
- Product destructive/bulk actions remain disabled.
- Product publish is not introduced.
- Rollback is feature-flag off.

Next:
1. `SELLER-WORKSPACE-2026-PROD-ADOPT-PRODUCT-DETAIL-14`
2. `SELLER-WORKSPACE-2026-PROD-HARDEN-AUTHORING-15`

## Seller Workspace 2026 Production Adoption — Product Detail

Status: PRODUCT_DETAIL_PRODUCTION_ADOPTION_FLAGGED

Scope:
- Product Detail 2026 can be adopted on production route via feature flag.
- Legacy Seller Product Detail remains available as rollback.
- Preview route remains available.
- Adoption is read-only/guarded first.

Production Route:
- `/seller/stores/:storeSlug/catalog/products/:productId`

Preview Route:
- `/seller-2026-preview/:storeSlug/catalog/products/:productId`

Feature Flags:
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_PRODUCT_DETAIL_ENABLED`

Guardrail:
- Default flag state is off.
- Backend API contracts are not changed.
- Existing Seller Product Detail page is not deleted.
- Product publish is not introduced.
- Save Changes remains disabled unless mapping is safe.
- View Storefront remains public-safe only.
- Rollback is feature-flag off.

Next:
1. `SELLER-WORKSPACE-2026-PROD-HARDEN-AUTHORING-15`
2. `SELLER-WORKSPACE-2026-PROD-HARDEN-STORE-PROFILE-16`

## Seller Workspace 2026 Production Hardening — Product Authoring

Status: AUTHORING_HARDENED_PENDING_ADOPTION

Scope:
- Product Authoring 2026 Save Draft flow audited and hardened.
- Submit for Review guardrail audited and hardened.
- Persisted product ID requirement documented.
- Edit mode remains legacy until update mapping is fully validated.
- Production route is not replaced in this task.

Preview Route:
- `/seller-2026-preview/:storeSlug/catalog/products/new`

Future Production Routes:
- `/seller/stores/:storeSlug/catalog/products/new`
- `/seller/stores/:storeSlug/catalog/products/:productId/edit`

Feature Flag Prepared:
- `VITE_SELLER_WORKSPACE_2026_AUTHORING_ENABLED`

Guardrail:
- Default flag state is off.
- Backend API contracts are not changed.
- Existing Seller Product Authoring/Edit pages are not deleted.
- Save Draft does not publish.
- Submit for Review does not bypass Admin approval.
- Submit for Review requires persisted product ID.
- Rollback is keeping legacy authoring route.

Next:
1. `SELLER-WORKSPACE-2026-PROD-HARDEN-STORE-PROFILE-17`
2. `SELLER-WORKSPACE-2026-PROD-HARDEN-ORDERS-18`

## Seller Workspace 2026 Production Adoption — Store Profile

Status: STORE_PROFILE_PRODUCTION_ADOPTION_FLAGGED

Scope:
- Store Profile 2026 can be adopted on production Store Profile route via feature flag.
- Legacy Seller Store Profile remains available as rollback.
- Preview route remains available.
- Storefront preview remains read-only.

Production Route:
- `/seller/stores/:storeSlug/store-profile`

Preview Route:
- `/seller-2026-preview/:storeSlug/store-profile`

Feature Flags:
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_STORE_PROFILE_ENABLED`

Guardrail:
- Default flag state is off.
- Backend API contracts are not changed.
- Existing Seller Store Profile page is not deleted.
- Save Profile only sends whitelisted fields.
- Slug/domain/public identity changes remain guarded.
- Storefront public visibility is not changed.
- Upload media remains disabled unless storage validation is complete.
- Rollback is feature-flag off.

## Seller Workspace 2026 Production Hardening — Orders

Status: ORDERS_HARDENED_PENDING_ADOPTION

Scope:
- Orders 2026 list/detail workflow audited and hardened.
- Fulfillment action guardrails audited.
- Tracking update guardrails audited.
- Store-scoped suborder ownership requirement documented.
- Production route is not replaced in this task.

Preview Route:
- `/seller-2026-preview/:storeSlug/orders`

Future Production Routes:
- `/seller/stores/:storeSlug/orders`
- `/seller/stores/:storeSlug/orders/:suborderId`

Feature Flag Prepared:
- `VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED`

Guardrail:
- Default flag state is off.
- Backend API contracts are not changed.
- Existing Seller Orders pages are not deleted.
- Seller cannot mutate parent order directly.
- Fulfillment actions require lifecycle-safe allowed actions.
- Tracking update requires valid suborder and validation.
- Payment governance remains Admin/payment-audit owned.
- Rollback is keeping legacy Orders route.

Next:
1. `SELLER-WORKSPACE-2026-PROD-ADOPT-ORDERS-20`
2. `SELLER-WORKSPACE-2026-PROD-HARDEN-COUPONS-21`

## Seller Workspace 2026 Production Adoption — Orders

Status: ORDERS_PRODUCTION_ADOPTION_FLAGGED

Scope:
- Orders 2026 can be adopted on production Orders route via feature flag.
- Legacy Seller Orders remains available as rollback.
- Preview route remains available.
- Fulfillment and tracking actions remain guarded.

Production Route:
- `/seller/stores/:storeSlug/orders`

Preview Route:
- `/seller-2026-preview/:storeSlug/orders`

Feature Flags:
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED`

Guardrail:
- Default flag state is off.
- Backend API contracts are not changed.
- Existing Seller Orders pages are not deleted.
- Seller cannot mutate parent order directly.
- Fulfillment actions require lifecycle-safe allowed actions.
- Tracking update requires valid suborder and validation.
- Bulk shipment/export remain disabled unless operationally validated.
- Payment governance remains Admin/payment-audit owned.
- Rollback is feature-flag off.

Next:
1. `SELLER-WORKSPACE-2026-PROD-HARDEN-COUPONS-21`
2. `SELLER-WORKSPACE-2026-PROD-HARDEN-TEAM-22`

## Seller Workspace 2026 Live Adapter

Status: SELLER_WORKSPACE_2026_PREVIEW_COMPLETE

Scope:
- Overview preview route connected to live API where available.
- Store Profile preview route connected to live API where available.
- Product Catalog preview route connected to live API where available.
- Product Authoring preview route connected to live API where safely available.
- Product Review Detail preview route connected to live API where available.
- Orders preview route connected to live API where available.
- Payment Center preview route connected to live API where available.
- Coupons preview route connected to live API where available.
- Team preview route connected to live API where available.
- Analytics & Storefront Sync preview route connected to live API where available.

Locations:
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026AnalyticsSyncAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026AnalyticsSync.js`
- `client/src/pages/seller2026/Seller2026AnalyticsSyncPreviewPage.jsx`

Guardrail:
- Analytics & Storefront Sync remains preview-scoped.
- Public storefront visibility is not changed.
- Storefront preview is read-only.
- Sync mutations are disabled unless public visibility workflow is validated.
- Backend API contracts are not changed.
- Existing Seller production pages are not replaced.

Next:
2. Production adoption plan per route

## Seller Workspace 2026 Production Adoption — Analytics

Status final: `ANALYTICS_PRODUCTION_ADOPTION_FLAGGED`, `ANALYTICS_READ_ONLY_HARDENED`

*Note: Fixed incorrect React Query import in Seller2026LiveAnalyticsPage.jsx. The codebase uses @tanstack/react-query, not react-query.*

Production route:
- `/seller/stores/:storeSlug/analytics`

## Seller Workspace 2026 Payment Workflow Sync
Status: PAYMENT_WORKFLOW_ADMIN_GOVERNED_SYNCED

## Seller Workspace 2026 Dashboard Visual Slicing

Status: DASHBOARD_VISUAL_SLICING_ADOPTED

Scope:
- Seller Workspace Overview visual redesign implemented for canonical dashboard routes.
- Minimal 2026 light UI adopted with responsive and dark-theme-compatible tokens.
- English-only feature copy enforced.
- Dashboard remains store-scoped under `/seller/stores/:storeSlug`.
- Data continues to use existing seller APIs and adapters.
- Admin authority and Client Storefront visibility are unchanged.

Routes:
- `/seller/stores/:storeSlug`
- `/seller/stores/:storeSlug/dashboard`

Files:
- `client/src/pages/seller2026/Seller2026LiveDashboardPage.jsx`
- `client/src/features/sellerWorkspace2026/SellerWorkspace2026.css`
- `client/src/hooks/seller2026/useSeller2026Dashboard.ts`
- `client/src/api/seller2026/dashboard.adapter.ts`

Guardrail:
- Backend API contracts are not changed.
- Legacy dashboard fallback remains available through the existing feature flags.
- Dashboard actions are navigation-only and permission-aware.
- Public storefront behavior is unchanged.
- Daily analytics points are not synthesized when the existing summary API only provides aggregates.

## Seller Workspace 2026 Store Profile Visual Slicing

Status: STORE_PROFILE_VISUAL_SLICING_ADOPTED

Scope:
- Canonical Store Profile route now uses a dedicated responsive 2026 overview and edit experience.
- Overview includes readiness, buyer-facing preview, governance, missing fields, and shipping setup.
- Edit mode covers media, public details, contact, address, and shipping origin on the same route.
- Copy is English-only and all values come from existing seller APIs.

Route:
- `/seller/stores/:storeSlug/store-profile`

Files:
- `client/src/pages/seller2026/Seller2026LiveStorefrontPage.jsx`
- `client/src/features/sellerWorkspace2026/SellerWorkspace2026.css`
- `client/src/hooks/seller2026/useSeller2026StoreProfile.ts`
- `client/src/api/seller2026/storeProfile.adapter.ts`
- `client/src/api/seller2026/storefront.mutations.ts`

Guardrail:
- `name`, `slug`, and `status` remain Admin-managed and read-only for sellers.
- Save payloads are restricted to backend-approved seller fields.
- Media removal requires confirmation and is persisted only after Save.
- Existing upload and Store Profile endpoints are reused.
- Legacy Store Profile remains the feature-flag rollback path.

## Seller Workspace 2026 Product Catalog Visual Slicing

Status: PRODUCT_CATALOG_VISUAL_SLICING_ADOPTED

Scope:
- Products catalog visual redesign implemented for the canonical store-scoped route.
- Product editor visual redesign implemented for create and edit routes.
- Product detail visual redesign implemented for the canonical detail route.
- English-only product workspace copy enforced.
- Product data continues to use existing seller APIs and Seller 2026 adapters.
- Product approval and publish governance remain backend/Admin controlled.
- Public storefront visibility behavior is unchanged.

Routes:
- `/seller/stores/:storeSlug/catalog/products`
- `/seller/stores/:storeSlug/catalog/products/new`
- `/seller/stores/:storeSlug/catalog/products/:productId`
- `/seller/stores/:storeSlug/catalog/products/:productId/edit`

Files:
- `client/src/pages/seller2026/Seller2026LiveProductsPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveProductEditorPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveProductDetailPage.jsx`
- `client/src/features/sellerWorkspace2026/SellerWorkspace2026.css`
- `client/src/hooks/seller2026/useSeller2026Products.ts`
- `client/src/hooks/seller2026/useSeller2026ProductEditor.ts`
- `client/src/hooks/seller2026/useSeller2026ProductDetail.ts`
- `client/src/api/seller2026/products.adapter.ts`
- `client/src/api/seller2026/productEditor.adapter.ts`
- `client/src/api/seller2026/productDetail.adapter.ts`

Guardrail:
- Backend API contracts are not changed.
- Existing legacy product pages are not deleted.
- Draft save uses existing store-scoped seller APIs.
- Submit review does not publish directly.
- Direct publish remains disabled.
- Destructive, duplicate, variant, and bulk controls remain disabled.
- Public storefront visibility is not changed by this UI.
- Rollback remains feature-flag off.

## Seller Workspace 2026 Categories Visual Slicing

Status: CATEGORIES_VISUAL_SLICING_ADOPTED

Scope:
- Categories visual redesign implemented for the canonical store-scoped route.
- Add and update category modal redesigned with the 2026 Seller Workspace design system.
- English-only feature copy enforced.
- Categories data continues to use existing seller APIs and Seller 2026 adapters.
- Category visibility and mutation authority remain backend-governed.
- Product/category relationships are not changed outside existing APIs.

Route:
- `/seller/stores/:storeSlug/catalog/categories`

Files:
- `client/src/pages/seller2026/Seller2026LiveCategoriesPage.jsx`
- `client/src/features/sellerWorkspace2026/SellerWorkspace2026.css`
- `client/src/hooks/seller2026/useSeller2026Categories.ts`
- `client/src/api/seller2026/categories.adapter.ts`

Guardrail:
- Backend API contracts are not changed.
- Existing legacy category pages are not deleted.
- Category create/update uses existing store-scoped seller APIs.
- Category publish/visibility uses existing governance only.
- Destructive and bulk actions remain disabled or confirmation-gated.
- Public storefront behavior is not changed by this UI.
- Rollback remains feature-flag off.


## Seller Workspace 2026 Attributes Visual Slicing

Status: ATTRIBUTES_VISUAL_SLICING_ADOPTED

Scope:
- Attributes visual redesign implemented for the canonical store-scoped route.
- Attribute Values visual redesign implemented for the canonical attribute values route.
- Add/update attribute drawer redesigned with the 2026 Seller Workspace design system.
- Add/update attribute value drawer redesigned with the 2026 Seller Workspace design system.
- English-only feature copy enforced.
- Attributes data continues to use existing seller APIs and Seller 2026 adapters.
- Attribute and value mutation authority remain backend-governed.
- Product/variant attribute relationships are not changed outside existing APIs.

Routes:
- `/seller/stores/:storeSlug/catalog/attributes`
- `/seller/stores/:storeSlug/catalog/attributes/:attributeId/values`

Files:
- `client/src/pages/seller2026/Seller2026LiveAttributesPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveAttributeValuesPage.jsx`
- `client/src/features/sellerWorkspace2026/components/Seller2026AttributeDrawer.jsx`
- `client/src/features/sellerWorkspace2026/components/Seller2026AttributeValueDrawer.jsx`
- `client/src/features/sellerWorkspace2026/SellerWorkspace2026.css`
- `client/src/hooks/seller2026/useSeller2026Attributes.ts`
- `client/src/hooks/seller2026/useSeller2026AttributeValues.ts`
- `client/src/api/seller2026/attributes.adapter.ts`
- `client/src/api/seller2026/attributeValues.adapter.ts`

Guardrail:
- Backend API contracts are not changed.
- Existing legacy attribute pages are not deleted.
- Attribute create/update uses existing store-scoped seller APIs.
- Attribute value create/update uses existing store-scoped seller APIs.
- Attribute publish/visibility uses existing governance only.
- Destructive and bulk actions remain disabled or confirmation-gated.
- Product variant behavior is not changed by this UI.
- Public storefront behavior is not changed by this UI.
- Rollback remains feature-flag off.

## Seller Workspace 2026 Coupons Visual Slicing

Status: COUPONS_VISUAL_SLICING_ADOPTED

Scope:
- Coupons visual redesign implemented for the canonical store-scoped route.
- Add/Edit Coupon slide-over drawer redesigned with the 2026 Seller Workspace design system.
- English-only feature copy enforced.
- Coupon data and mutations continue to use existing seller APIs and Seller Workspace context.
- Checkout coupon validation and Admin authority are unchanged.

Route:
- `/seller/stores/:storeSlug/catalog/coupons`

Files:
- `client/src/pages/seller2026/Seller2026LiveCouponsPage.jsx`
- `client/src/components/seller2026/coupons/Seller2026CouponDrawer.jsx`
- `client/src/features/sellerWorkspace2026/Seller2026Coupons.css`

Guardrail:
- Backend API contracts are not changed.
- Existing legacy coupons page is not deleted until smoke passes.
- Seller cannot mutate platform/admin coupons outside existing backend governance.
- Archive is deactivate-style behavior through the existing seller endpoint.
- Public storefront and checkout coupon validation are not changed by this UI.
- Rollback remains restoring the previous route component.

## Seller Workspace 2026 Orders Visual Slicing

Status: ORDERS_VISUAL_SLICING_ADOPTED_FLAGGED

Scope:
- Orders list visual redesign implemented for the canonical store-scoped route.
- Live order detail is available in a right-side drawer without replacing the deep-link detail fallback.
- English-only feature copy enforced.
- Orders and drawer data continue to use existing store-scoped seller APIs.
- Fulfillment mutation remains limited to backend-enabled `MARK_DELIVERED`.

Routes:
- `/seller/stores/:storeSlug/orders`
- `/seller/stores/:storeSlug/orders/:suborderId` remains the legacy deep-link fallback.

Files:
- `client/src/pages/seller2026/Seller2026LiveOrdersPage.jsx`
- `client/src/components/seller2026/orders/Seller2026OrderDetailDrawer.jsx`
- `client/src/hooks/seller2026/useSeller2026Orders.ts`
- `client/src/api/seller2026/orders-payments.adapter.ts`
- `client/src/features/sellerWorkspace2026/Seller2026Orders.css`

Guardrail:
- Backend API contracts are not changed.
- Payment status remains read-only.
- Parent order mutation is not exposed.
- Tracking updates remain read-only until persistence is validated.
- Bulk destructive actions remain disabled.
- Rollback is `VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED=false`.

## Seller Workspace 2026 Payment Review Visual Slicing

Status: PAYMENT_REVIEW_VISUAL_SLICING_ADOPTED_FLAGGED

Scope:
- Payment Review queue visual redesign implemented for the canonical store-scoped route.
- Live payment proof review is available in a right-side drawer.
- Awaiting, approved, rejected, and combined queues use the existing seller payment review API.
- Match status is computed for presentation only; backend payment governance remains final.
- English-only feature copy enforced.

Route:
- `/seller/stores/:storeSlug/payment-review`

Files:
- `client/src/pages/seller2026/Seller2026LivePaymentReviewPage.jsx`
- `client/src/components/seller2026/paymentReview/Seller2026PaymentProofDrawer.jsx`
- `client/src/hooks/seller2026/useSeller2026PaymentReview.ts`
- `client/src/api/seller2026/paymentReview.adapter.ts`
- `client/src/features/sellerWorkspace2026/Seller2026PaymentReview.css`

Guardrail:
- Backend API contracts are not changed.
- Access requires order and payment-status visibility.
- Approve/reject require both actor governance and row-level review actionability.
- Reject requires a clear note.
- Request Clarification remains disabled pending a backend-approved endpoint.
- Payment status remains read-only outside the existing review endpoint.
- Rollback is `VITE_SELLER_WORKSPACE_2026_PAYMENT_REVIEW_ENABLED=false`.

## Seller Workspace 2026 Payment Profile Visual Slicing

Status: PAYMENT_PROFILE_VISUAL_SLICING_ADOPTED_FLAGGED

Scope:
- Payment Profile visual redesign implemented for the canonical store-scoped route.
- Active QRIS checkout setup remains read-only unless backend marks it active and approved.
- Seller edits only a store-scoped request for admin review.
- English-only feature copy enforced.
- Checkout and Admin authority remain unchanged.

Route:
- `/seller/stores/:storeSlug/payment-profile`

Files:
- `client/src/pages/seller2026/Seller2026LivePaymentProfilePage.jsx`
- `client/src/components/seller2026/paymentProfile/Seller2026PaymentProfileEditor.jsx`
- `client/src/hooks/seller2026/useSeller2026PaymentProfile.ts`
- `client/src/api/seller2026/paymentProfile.adapter.ts`
- `client/src/features/sellerWorkspace2026/Seller2026PaymentProfile.css`

Guardrail:
- Backend API contracts are not changed.
- Seller cannot self-activate checkout or payout setup.
- Save Draft and Submit for Review use the existing store-scoped seller request endpoints.
- Client checkout continues reading only the active approved setup.
- Payment proof approval/rejection remains in Payment Review.
- Rollback is `VITE_SELLER_WORKSPACE_2026_PAYMENT_PROFILE_ENABLED=false`.
