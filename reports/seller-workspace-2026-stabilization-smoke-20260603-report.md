# Seller Workspace 2026 Stabilization Smoke Report

## Task
SELLER-2026-STABILIZATION-SMOKE-01

## Files Read
- `system_map.md`
- `client/src/App.jsx`
- `client/src/layouts/SellerLayout.jsx`
- `client/src/utils/sellerWorkspaceRoute.js`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/pages/seller2026/Seller2026LiveTeamAuditPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveDashboardPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveProductsPage.jsx`
- `client/src/pages/seller2026/seller2026PagePermissions.js`
- `client/src/hooks/seller2026/*`
- `client/src/api/seller2026/*`
- `client/src/api/sellerWorkspace.ts`
- `client/src/api/sellerProducts.ts`
- `client/src/api/sellerOrders.ts`
- `client/src/api/sellerCoupons.ts`
- `client/src/api/sellerPaymentProfile.ts`
- `client/src/api/sellerStoreProfile.ts`
- `client/src/api/sellerTeam.ts`
- `client/src/api/sellerTeamAudit.ts`
- `client/src/api/sellerPayments.ts`
- `client/src/api/sellerAttributes.ts`
- `client/src/api/sellerCategories.ts`
- `client/src/api/sellerNotifications.ts`
- `reports/seller-workspace-2026-slicing-adoption-20260603-report.md`
- Slicing bundle `README.md`
- Slicing bundle `IMPLEMENTATION_MAP.md`

## Files Modified
- `system_map.md`
- `client/src/App.jsx`
- `reports/seller-workspace-2026-stabilization-smoke-20260603-report.md`

## System Map Status
- `system_map.md` was missing at the project root.
- The slicing bundle did not include a `system_map.md`; it only included `IMPLEMENTATION_MAP.md`.
- Added a concise root system map covering Seller Workspace canonical routes, legacy redirects, API boundaries, and Seller Workspace 2026 adoption status.

## Canonical Route Smoke

Local services:
- Client: `http://localhost:5173`
- API: `http://localhost:3001`
- In-app Browser plugin status: unavailable (`iab` backend not available).
- Fallback smoke method: local Playwright headless route probes.
- Auth status: no valid seller credentials/session available. Existing local candidate seller users rejected guessed smoke passwords through `/api/auth/login`.

| Route | Result | Data Source | Console Error | Notes |
|---|---|---|---|---|
| `/seller/stores/super-admin-1` | PASS_GUARD | SellerLayout context API | 401 expected | Guard renders `Seller Session Required`; no crash. |
| `/seller/stores/super-admin-1/dashboard` | PASS_GUARD | SellerLayout context API | 401 expected | Guard renders; route resolves. |
| `/seller/stores/super-admin-1/store-profile` | PASS_GUARD | SellerLayout context API | 401 expected | Guard renders; route resolves. |
| `/seller/stores/super-admin-1/catalog/products` | PASS_GUARD | SellerLayout context API | 401 expected | Guard renders; route resolves. |
| `/seller/stores/super-admin-1/catalog/products/new` | PASS_GUARD | SellerLayout context API | 401 expected | Guard renders; route resolves. |
| `/seller/stores/super-admin-1/catalog/products/1` | PASS_GUARD | SellerLayout context API | 401 expected | Product id `1` found read-only from local DB. |
| `/seller/stores/super-admin-1/catalog/products/1/edit` | PASS_GUARD | SellerLayout context API | 401 expected | Product id `1` found read-only from local DB. |
| `/seller/stores/super-admin-1/catalog/categories` | PASS_GUARD | SellerLayout context API | 401 expected | Guard renders; route resolves. |
| `/seller/stores/super-admin-1/catalog/attributes` | PASS_GUARD | SellerLayout context API | 401 expected | Guard renders; route resolves. |
| `/seller/stores/super-admin-1/catalog/attributes/1/values` | PASS_GUARD | SellerLayout context API | 401 expected | Attribute id `1` found read-only from local DB. |
| `/seller/stores/super-admin-1/orders` | PASS_GUARD | SellerLayout context API | 401 expected | Guard renders; route resolves. |
| `/seller/stores/super-admin-1/orders/1` | PASS_GUARD | SellerLayout context API | 401 expected | Suborder id `1` found read-only from local DB. |
| `/seller/stores/super-admin-1/payment-review` | PASS_GUARD | SellerLayout context API | 401 expected | Guard renders; route resolves. |
| `/seller/stores/super-admin-1/payment-profile` | PASS_GUARD | SellerLayout context API | 401 expected | Guard renders; route resolves. |
| `/seller/stores/super-admin-1/catalog/coupons` | PASS_GUARD | SellerLayout context API | 401 expected | Guard renders; route resolves. |
| `/seller/stores/super-admin-1/team` | PASS_GUARD | SellerLayout context API | 401 expected | Guard renders; route resolves. |
| `/seller/stores/super-admin-1/team/:memberId` | NEEDS_VALID_ID | DB read-only lookup | n/a | No `StoreMember` row found in local DB lookup. |
| `/seller/stores/super-admin-1/team/audit` | PASS_GUARD | SellerLayout context API | 401 expected | Static audit route resolves separately from dynamic member route. |

## Legacy Redirect Smoke
| Legacy Route | Expected Target | Result | Notes |
|---|---|---|---|
| `/seller/stores/super-admin-1/profile` | `/seller/stores/super-admin-1/store-profile` | PASS_REDIRECT | Redirects before guard display. |
| `/seller/stores/super-admin-1/catalog` | `/seller/stores/super-admin-1/catalog/products` | PASS_REDIRECT | Fixed by top-level legacy route. |
| `/seller/stores/super-admin-1/catalog/new` | `/seller/stores/super-admin-1/catalog/products/new` | PASS_REDIRECT | Fixed by top-level legacy route. |
| `/seller/stores/super-admin-1/catalog/1` | `/seller/stores/super-admin-1/catalog/products/1` | PASS_REDIRECT | Fixed by top-level legacy route. |
| `/seller/stores/super-admin-1/catalog/1/edit` | `/seller/stores/super-admin-1/catalog/products/1/edit` | PASS_REDIRECT | Fixed by top-level legacy route. |
| `/seller/stores/super-admin-1/coupons` | `/seller/stores/super-admin-1/catalog/coupons` | PASS_REDIRECT | Fixed by top-level legacy route. |
| `/user/store-payment-profile` | `/auth/login` when unauthenticated | PASS_REDIRECT | Account guard redirects unauthenticated user. |
| `/user/store-payment-review` | `/auth/login` when unauthenticated | PASS_REDIRECT | Account guard redirects unauthenticated user. |

## API Wiring Status
| Page | API / Hook | Status | Mock Fallback | Missing Field | Notes |
|---|---|---|---|---|---|
| Dashboard | `useSeller2026Dashboard`, `sellerWorkspace`, `sellerOrders` | LIVE_API_CONNECTED | No final mock fallback in live page | None found | Canonical index and `/dashboard` use live page. |
| Store Profile | `useSeller2026Storefront`, `useSeller2026UpdateStoreProfile`, `sellerStoreProfile` | PARTIAL_API_CONNECTED | Visual shell fallback guards | NEEDS_REVIEW | Storefront/profile fields depend on existing backend DTO coverage. |
| Catalog | `useSeller2026Products`, `sellerProducts` | LIVE_API_CONNECTED | Empty/error states | None found | Query params and permission gates present. |
| Product Authoring | `useSeller2026SaveProductDraft`, `sellerProducts`, `sellerCategories`, `sellerAttributes` | PARTIAL_API_CONNECTED | Mutation flags/guards | NEEDS_REVIEW | Draft/edit rollout remains feature-flagged. |
| Product Detail | `useSeller2026ProductDetail`, `sellerProducts` | PARTIAL_API_CONNECTED | Detail empty/error state | NEEDS_REVIEW | Activity/audit detail remains existing endpoint dependent. |
| Product Edit | `useSeller2026ProductDetail`, `useSeller2026SaveProductDraft` | PARTIAL_API_CONNECTED | Mutation flags/guards | NEEDS_REVIEW | No backend schema change made. |
| Categories | `useSeller2026Categories`, `sellerCategories` | LIVE_API_CONNECTED | Empty/error states | None found | Store-scoped list hook present. |
| Attributes | `useSeller2026Attributes`, `useSeller2026AttributeValues`, `sellerAttributes` | LIVE_API_CONNECTED | Empty/error states | None found | Store-scoped hooks present. |
| Orders | `useSeller2026Orders`, `sellerOrders` | LIVE_API_CONNECTED | Empty/error states | None found | Store-scoped list hook present. |
| Order Detail | `useSeller2026SuborderDetail`, `sellerOrders` | LIVE_API_CONNECTED | Empty/error state | None found | Store-scoped detail hook present. |
| Payment Review | `useSeller2026PaymentReview`, `sellerPayments` | LIVE_API_CONNECTED | Empty/error states | None found | Existing seller payment APIs used. |
| Payment Profile | `useSeller2026PaymentProfile`, `sellerPaymentProfile` | LIVE_API_CONNECTED | Empty/error states | None found | Existing payment profile API used. |
| Coupons | `useSeller2026Coupons`, `sellerCoupons` | LIVE_API_CONNECTED | Empty/error states | None found | Canonical route is `/catalog/coupons`. |
| Team | `useSeller2026Team`, `sellerTeam` | LIVE_API_CONNECTED | Empty/error states | None found | Permission gate present. |
| Member Lifecycle | `useSeller2026MemberDetail`, `sellerTeam` | LIVE_API_CONNECTED | Empty/error state | NEEDS_VALID_ID | Local DB had no member row for browser detail smoke. |
| Team Audit | `useSeller2026TeamAudit`, `sellerTeamAudit` | LIVE_API_CONNECTED | Empty/error states | None found | Read-only audit query page. |
| Notifications | `useSeller2026Notifications`, `sellerNotifications` | LIVE_API_CONNECTED | Empty/error states | None found | Live page and layout notification API are present. |

## Ownership / Permission Smoke
| Scenario | Result | Notes |
|---|---|---|
| Owner store route access | NOT TESTED - NEEDS AUTH FIXTURE | No working seller credentials/session available. |
| Limited member route access | NOT TESTED - NEEDS AUTH FIXTURE | No local `StoreMember` row found in read-only lookup. |
| Seller changes `storeSlug` to another store | NOT TESTED - NEEDS AUTH FIXTURE | Requires two seller sessions or a known cross-store fixture. |
| Unauthenticated seller workspace access | PASS_GUARD | All canonical routes showed `Seller Session Required` without crash. |
| Legacy route unauthenticated handoff | PASS_REDIRECT | All legacy seller bookmark routes now redirect to canonical targets before guard. |

## Lint / Typecheck / Build
- Typecheck: `pnpm.cmd -F client exec tsc -b` passed before and after patch.
- Targeted adoption lint: `pnpm.cmd -F client exec eslint src/App.jsx src/routes/seller2026RouteConfig.jsx src/features/seller2026 src/pages/seller2026 src/hooks/seller2026 src/api/seller2026` returned 0 errors. `App.jsx` and route config are ignored by current ESLint config with warnings.
- Full lint: `pnpm.cmd -F client lint` fails with existing repo-wide lint debt, mainly `@typescript-eslint/no-explicit-any` in non-adoption API/util files and shared seller API modules.
- Build: `pnpm.cmd -F client build` passed after rerun, emitted `client/dist/index.html` and assets.
- Windows Node/libuv assertion notes: previous adoption report saw `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76` after Vite emit. Stabilization reruns on Node `v24.15.0` and pnpm `11.0.9` did not reproduce the assertion.

## Bugs Found
- `system_map.md` was absent from root.
- Legacy routes nested inside `SellerLayout` did not redirect before the seller auth/context guard for unauthenticated old bookmarks, except `/profile`, which was already top-level.
- Browser plugin backend `iab` was unavailable, so the requested in-app Browser smoke could not run.
- No valid seller auth fixture was available for authenticated live data smoke.

## Fixes Applied
- Added root `system_map.md`.
- Added top-level legacy seller redirect routes for:
  - `/seller/stores/:storeSlug/catalog`
  - `/seller/stores/:storeSlug/catalog/new`
  - `/seller/stores/:storeSlug/catalog/:productId`
  - `/seller/stores/:storeSlug/catalog/:productId/edit`
  - `/seller/stores/:storeSlug/coupons`

## Risks Remaining
- Authenticated browser smoke still needs a known seller owner/member fixture or credentials.
- Member lifecycle route needs a valid `StoreMember` ID in the local/staging fixture.
- Full lint remains blocked by repo-wide existing debt outside the scoped stabilization patch.
- Analytics live route remains intentionally not enabled and is still NEEDS REVIEW.

## Next Steps
- Provide or create an approved seller auth fixture, then rerun full authenticated canonical route smoke.
- Add a local/staging StoreMember fixture for member lifecycle and limited-role permission smoke.
- Track repo-wide lint debt separately from Seller Workspace 2026 stabilization.
