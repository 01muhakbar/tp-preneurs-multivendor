# Seller Workspace 2026 API Delta Hardening Report

- Task: `SELLER-2026-API-DELTA-HARDENING-03`
- Date: 2026-06-03
- Scope: frontend Seller 2026 API adapters, permission aliases, smoke/reporting, and system map documentation.
- Out of scope: backend routes, database schema, auth middleware, backend permission map, `App.jsx`, Seller layout, Admin Workspace, Client Storefront, and legacy global seller API rewrites.

## Files Read

- `system_map.md`
- `reports/seller-workspace-2026-slicing-adoption-20260603-report.md`
- `reports/seller-workspace-2026-stabilization-smoke-20260603-report.md`
- `reports/seller-workspace-2026-auth-fixture-live-smoke-20260603-report.md`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `client/src/api/seller2026/**`
- `client/src/hooks/seller2026/**`
- `client/src/pages/seller2026/**`
- `client/src/features/seller2026/**`

## Files Modified

- `client/src/api/seller2026/permissions.ts`
- `client/src/api/seller2026/products.adapter.ts`
- `client/src/api/seller2026/storefront.adapter.ts`
- `client/src/api/seller2026/orders-payments.adapter.ts`
- `client/src/api/seller2026/team.adapter.ts`
- `system_map.md`
- `reports/seller-workspace-2026-api-delta-hardening-20260603-report.md`

## API Delta Map

| Area | UI Need | Existing API / DTO Signal | Delta Found | Fix Applied | Backend Needed |
|---|---|---|---|---|---|
| Dashboard | KPIs, readiness, recent orders, top products, notifications | Seller context, readiness, finance summary, analytics summary, products, suborders, notifications | Standalone analytics page still has no approved Seller 2026 live route | No dashboard patch needed; kept dashboard on existing live summary APIs | No for dashboard; analytics route needs review |
| Store Profile | Public identity, description, logo/cover, socials, hours, status | `store-profile`, public identity, rich-about, status meta | Adapter underused public/rich identity fields and showed fallback wording too readily | Mapped richer identity/social/hour/status fields and removed "Live fallback profile" wording | No |
| Product Catalog | Price, stock, thumbnail, category, product status | `pricing`, `media`, `mediaPreviewUrl`, nested/default category, `inventory`, `submission` | Adapter used only a narrow subset of product DTOs | Mapped live pricing/media/category/inventory/submission fields | No |
| Product Detail/Edit | Gallery, descriptions, category assignments, tags, submission/revision notes | `descriptions`, `media.imageUrls`, `category.default`, assigned categories, `submission` | Detail read model lost live media/descriptions/submission context | Hardened product detail mapping and revision note fallback | No for read/basic edit; media/variant lifecycle still needs review |
| Orders | Operational/payment status, totals, customer, fulfillment | `readModel.primaryStatus`, `paymentState`, status meta, order totals | Adapter could miss canonical read-model status | Mapped read-model status/payment state and safer fallbacks | No |
| Order Detail | Seller-scope totals, items, payment/shipping state | `readModel.sellerScope`, `primaryStatus`, `paymentState` | Detail unwrap/fallback logic did not fully use seller-scope DTO | Mapped seller-scope read model and root data unwrap | No |
| Payment Review | Payment proof rows and status | `/payment-review/suborders`, proof/payment/customer fields | Read lane existed; row fallback was narrower than DTO | Hardened payment row mapping | No for read; approve/reject mutation remains review |
| Payment Profile | Active QRIS/profile readiness and verification | `activeSnapshot`, root profile fields, readiness, verification status | Adapter assumed snapshot shape even when root profile carried data | Mapped root profile fallback and readiness/status fields | No for read; submit/update mutation remains review |
| Team/Member | Role permissions and member capability summary | Existing backend permission keys such as `ORDER_VIEW`, `STORE_MEMBERS_MANAGE` | Seller 2026 UI capability names did not fully alias backend keys | Expanded Seller 2026 permission aliases and member-detail alias checks | No |
| Analytics | Standalone live analytics route | Dashboard analytics summary only | Route remains unapproved/needs review | Documented as `NEEDS_REVIEW` | Needs product/API decision |

## API Wiring Status Before / After

| Area | Before | After |
|---|---|---|
| Dashboard | LIVE_API_CONNECTED | LIVE_API_CONNECTED |
| Store Profile | PARTIAL_API_CONNECTED | LIVE_API_CONNECTED with rich-layout/mutation review caveat |
| Product Catalog | LIVE_API_CONNECTED | LIVE_API_CONNECTED, hardened mapping |
| Product Detail | PARTIAL_API_CONNECTED | LIVE_API_CONNECTED |
| Product Edit | PARTIAL_API_CONNECTED | PARTIAL_API_CONNECTED, safer live read/update mapping |
| Product Authoring | PARTIAL_API_CONNECTED | PARTIAL_API_CONNECTED, mutation guardrails retained |
| Orders | LIVE_API_CONNECTED | LIVE_API_CONNECTED, hardened read model mapping |
| Order Detail | LIVE_API_CONNECTED | LIVE_API_CONNECTED, hardened seller-scope mapping |
| Payment Review | LIVE_API_CONNECTED | LIVE_API_CONNECTED for read, review mutations disabled |
| Payment Profile | LIVE_API_CONNECTED | LIVE_API_CONNECTED, hardened root/snapshot mapping |
| Coupons | LIVE_API_CONNECTED | LIVE_API_CONNECTED for read, lifecycle mutations disabled |
| Team / Member Detail | PARTIAL_API_CONNECTED | LIVE_API_CONNECTED for read/lifecycle visibility |
| Team Audit | LIVE_API_CONNECTED | LIVE_API_CONNECTED |
| Notifications | LIVE_API_CONNECTED | LIVE_API_CONNECTED |
| Analytics | NEEDS_REVIEW | NEEDS_REVIEW |
| `/seller-2026` preview routes | MOCK_ONLY | MOCK_ONLY by design |

## Mock Dependency Reduction

| Area | Reduction |
|---|---|
| Store Profile | Live profile data is used more aggressively for identity, socials, rich-about, and hours; fallback labeling no longer implies a mock profile. |
| Product Catalog | Live DTO fields now cover price, media, category, inventory, and status instead of narrow/placeholder fallbacks. |
| Product Detail/Edit | Live descriptions, media gallery, submission notes, and category assignments reduce placeholder detail content. |
| Team/Member | Existing backend role permission keys now drive Seller 2026 member capability UI through aliases instead of looking like missing permissions. |
| Dashboard | No mock dependency introduced; visual chart remains a static dashboard visualization over live summary inputs. |
| Preview routes | Still mock-only intentionally under `/seller-2026`; not part of canonical live workspace. |

## Mutation Safety

| Action | Seller 2026 Status | Reason |
|---|---|---|
| Save store profile | WIRED | Existing profile update path is used for supported fields. |
| Save product draft/basic edit | WIRED | Existing draft/update path is used for supported fields. |
| Open product create/edit route | WIRED | Canonical routes load the live editor. |
| Product media, variants, submit, publish, archive, delete, and bulk actions | DISABLED_PENDING_API_REVIEW | Requires explicit Seller 2026 lifecycle/mutation decision. |
| Order fulfillment update | DISABLED_PENDING_API_REVIEW | Existing operational paths need Seller 2026 permission/mutation review before enabling. |
| Payment approve/reject | DISABLED_PENDING_API_REVIEW | Read API is live; mutation controls remain guarded. |
| Payment profile submit/update | DISABLED_PENDING_API_REVIEW | Read API is live; update/submit controls remain guarded. |
| Coupon create/edit/delete | DISABLED_PENDING_API_REVIEW | Read API is live; lifecycle actions remain guarded. |
| Team invite, role update, status update, remove, resend, cancel | DISABLED_PENDING_API_REVIEW | Live read/lifecycle visibility is present; member mutation controls stay guarded. |
| Team audit export | DISABLED_PENDING_API_REVIEW | Audit read lane is live; export endpoint/contract is not enabled. |
| Notification bulk mark-read | DISABLED_PENDING_API_REVIEW | Read/unread count lane is live; bulk mutation stays guarded. |

## Bugs Found

- Seller 2026 permission aliases were incomplete, so existing backend permission keys could over-restrict page-level actions or member capability details.
- Product status mapping could treat `submission.status = none` as more important than the operational product status.
- Product, store profile, order, payment, and team adapters underused existing nested live DTO fields.
- The prompt's root-prefixed targeted lint command is invalid inside the `client` filtered workspace because ESLint receives paths such as `client/src/...` from within `client`.

## Fixes Applied

- Expanded Seller 2026 permission aliases for store payment profile, catalog/product/coupon, orders, payment review, team, audit, and notifications.
- Hardened product list/detail mapping for pricing, stock, media, categories, descriptions, tags, submission status, operational status, and revision notes.
- Hardened store profile mapping for public identity, rich-about content, logo/cover, socials, operating hours, business category, and verification/status labels.
- Hardened orders/payment mapping for read-model status, payment state, seller-scope totals, payment rows, and payment profile root/snapshot shapes.
- Added team member permission alias handling so legacy backend role permissions surface correctly in the Seller 2026 member detail UI.
- Updated `system_map.md` with `Seller Workspace 2026 API Delta Status`.

## Smoke Runner Result

- Command: `pnpm.cmd exec tsx scripts/seller2026-auth-fixture-live-smoke.ts`
- Result: PASS
- Canonical live routes: PASS for dashboard, store profile, microsite preview, product list/create/detail/edit, categories, attributes, attribute values, coupons, orders, order detail, payment review, payment profile, team, member detail, team audit, and notifications.
- Legacy redirects: PASS for catalog/product/coupon redirects.
- API statuses: observed 200s for seller context, workspace readiness, finance summary, analytics summary, store profile, products, authoring meta, categories, attributes, attribute values, coupons, suborders, suborder detail, payment review suborders, payment profile, team, member lifecycle, audit, notifications, and unread count.
- Cross-store guard: expected 403 for owner A accessing another seller store.
- Browser console/network: no route-blocking console errors or API failures observed in the smoke result.

## Testing

- `pnpm.cmd -F client exec tsc -b`: PASS
- `pnpm.cmd -F client exec eslint src/api/seller2026 src/hooks/seller2026 src/pages/seller2026`: PASS
- `pnpm.cmd -F client exec eslint src/features/seller2026 src/pages/seller2026 src/hooks/seller2026 src/api/seller2026 src/routes/seller2026RouteConfig.jsx`: PASS with one warning that `src/routes/seller2026RouteConfig.jsx` is ignored by the active ESLint config.
- `pnpm.cmd -F client build`: PASS with the existing Vite large chunk warning.
- Prompt form `pnpm.cmd -F client lint -- client/src/features/seller2026 client/src/pages/seller2026 client/src/hooks/seller2026 client/src/api/seller2026 client/src/routes/seller2026RouteConfig.jsx`: FAILS because root-prefixed `client/src/...` paths are invalid after `pnpm -F client` switches execution into the client workspace. The supported client-relative equivalent passed as noted above.
- Repo-wide/client-wide lint was not treated as the gate for this task; prior known lint debt exists outside the Seller 2026 scoped files in legacy `client/src/api/seller*.ts`.

## Risks Remaining

- Product media, variants, submit/publish/archive/delete, and bulk lifecycle actions need a separate mutation enablement task.
- Standalone Seller 2026 analytics route remains `NEEDS_REVIEW`; dashboard analytics summary is live.
- Payment approval, payment profile submission/update, coupon lifecycle, team member mutation, notification bulk mutation, and audit export buttons remain intentionally disabled pending canonical mutation review.
- Preview/slicing routes under `/seller-2026` remain mock-only by design and should not be confused with live canonical seller routes.

## Recommended Next Task

Run a dedicated Seller 2026 mutation enablement plan that reviews existing backend mutation contracts, permission gates, optimistic UI behavior, and rollback/error states before enabling lifecycle buttons.
