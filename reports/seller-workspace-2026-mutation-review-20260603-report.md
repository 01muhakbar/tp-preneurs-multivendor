# Seller Workspace 2026 Mutation Review Report

## Task

`SELLER-2026-MUTATION-REVIEW-04`

## Files Read

- `system_map.md`
- `reports/seller-workspace-2026-api-delta-hardening-20260603-report.md`
- `reports/seller-workspace-2026-auth-fixture-live-smoke-20260603-report.md`
- `reports/seller-workspace-2026-stabilization-smoke-20260603-report.md`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `client/src/api/seller2026/**`
- `client/src/hooks/seller2026/**`
- `client/src/pages/seller2026/**`
- `client/src/features/seller2026/**`
- `client/src/api/sellerProducts.ts`
- `client/src/api/sellerOrders.ts`
- `client/src/api/sellerPayments.ts`
- `client/src/api/sellerPaymentProfile.ts`
- `client/src/api/sellerCoupons.ts`
- `client/src/api/sellerTeam.ts`
- `client/src/api/sellerTeamAudit.ts`
- `client/src/api/sellerNotifications.ts`
- `client/src/api/sellerStoreProfile.ts`
- `client/src/api/sellerAttributes.ts`
- `client/src/api/sellerCategories.ts`
- `server/src/routes/seller.products.ts`
- `server/src/routes/seller.orders.ts`
- `server/src/routes/seller.payments.ts`
- `server/src/routes/seller.paymentProfiles.ts`
- `server/src/routes/seller.coupons.ts`
- `server/src/routes/seller.team.ts`
- `server/src/routes/seller.notifications.ts`
- `server/src/middleware/requireSellerStoreAccess.ts`
- `server/src/services/seller/permissionMap.ts`
- `server/src/services/seller/resolveSellerAccess.ts`

## Files Modified

- `client/src/api/seller2026/mutation-flags.ts`
- `client/src/api/seller2026/mutations.ts`
- `client/src/api/seller2026/notifications.mutations.ts`
- `client/src/hooks/seller2026/useSeller2026NotificationMutations.ts`
- `client/src/pages/seller2026/Seller2026LiveNotificationsPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `system_map.md`
- `reports/seller-workspace-2026-mutation-review-20260603-report.md`

## Mutation Inventory

| Area | UI Action | Previous State | Existing API | Permission Needed | Decision | Notes |
|---|---|---|---|---|---|---|
| Product | Save draft/create draft/basic edit | ENABLED | `POST /seller/stores/:storeId/products/drafts`, `PATCH /products/:productId/draft` | `PRODUCT_CREATE` / `PRODUCT_EDIT` | WIRE_NOW | Already wired before this task; kept enabled. |
| Product | Submit review | DISABLED | `POST /seller/stores/:storeId/products/:productId/submit-review` | `PRODUCT_EDIT` | KEEP_DISABLED | Endpoint exists, but Seller 2026 media/variant/readiness flow is not complete. |
| Product | Duplicate | DISABLED | `POST /seller/stores/:storeId/products/:productId/duplicate` | `PRODUCT_CREATE` | KEEP_DISABLED | Needs UI confirmation, refetch path, and disposable fixture validation. |
| Product | Archive/delete | DISABLED | `DELETE /seller/stores/:storeId/products/:productId` | `PRODUCT_ARCHIVE` | KEEP_DISABLED | Endpoint can archive instead of delete referenced products; UI needs explicit confirmation/status copy. |
| Product | Publish/unpublish | DISABLED | `PATCH /seller/stores/:storeId/products/:productId/published` | `PRODUCT_PUBLISH` | NEEDS_PERMISSION_REVIEW | Backend can block direct publish when admin approval is required. |
| Product | Media/variants | DISABLED | Existing older upload/variant payload paths | `PRODUCT_MEDIA_MANAGE`, `PRODUCT_VARIANT_MANAGE` | NEEDS_BACKEND_REVIEW | Seller 2026 authoring flow is not complete enough to enable. |
| Order | Pack/mark processing | DISABLED | `PATCH /seller/stores/:storeId/suborders/:suborderId/fulfillment` | `ORDER_VIEW`, `ORDER_FULFILLMENT_MANAGE` | KEEP_DISABLED | Endpoint exists, but transition workflow and shipment rollout state need focused UI. |
| Order | Mark shipped/update tracking | DISABLED | Same fulfillment endpoint | `ORDER_VIEW`, `ORDER_FULFILLMENT_MANAGE` | KEEP_DISABLED | Requires courier/tracking payload form. |
| Order | Bulk fulfillment | DISABLED | Not confirmed as safe Seller 2026 endpoint | `ORDER_FULFILLMENT_MANAGE` | NEEDS_BACKEND_REVIEW | Bulk delete exists but is destructive and not fulfillment. |
| Order | Print/download receipt/label | DISABLED | Not confirmed | `ORDER_VIEW` | NEEDS_BACKEND_REVIEW | No clear store-scoped Seller 2026 endpoint found. |
| Payment Review | Approve | DISABLED | `PATCH /seller/stores/:storeId/payments/:paymentId/review` | `ORDER_VIEW`, `PAYMENT_STATUS_VIEW`, owner/admin role | KEEP_DISABLED | Backend limits mutation to owner/admin; UI needs confirm/refetch and payment fixture rollback. |
| Payment Review | Reject | DISABLED | Same payment review endpoint | Same as approve | KEEP_DISABLED | Reject needs reason/note UX and rollback-safe fixture. |
| Payment Review | Request clarification / dispute note | DISABLED | Not confirmed | Payment review permissions | NEEDS_BACKEND_REVIEW | No separate endpoint found. |
| Payment Profile | Save draft/request | DISABLED | `PUT /seller/stores/:storeId/payment-profile/request` | `PAYMENT_PROFILE_EDIT` | KEEP_DISABLED | Endpoint exists; UI edit form/upload lifecycle not wired. |
| Payment Profile | Submit request | DISABLED | `POST /seller/stores/:storeId/payment-profile/request/submit` | `PAYMENT_PROFILE_EDIT` | KEEP_DISABLED | Needs complete request form and pending-state UX. |
| Coupon | Create | DISABLED shell | `POST /seller/stores/:storeId/coupons` | `COUPON_CREATE` | KEEP_DISABLED | Endpoint exists; UI form validation and disposable fixture flow not wired in this pass. |
| Coupon | Edit | DISABLED | `PATCH /seller/stores/:storeId/coupons/:couponId` | `COUPON_EDIT` | KEEP_DISABLED | Needs edit form and status guard. |
| Coupon | Activate/deactivate/delete/archive | DISABLED | `PATCH active`, `DELETE` archives by active=false | `COUPON_STATUS_MANAGE` | KEEP_DISABLED | Needs lifecycle copy and fixture rollback. |
| Coupon | Duplicate | DISABLED | Not confirmed | `COUPON_CREATE` | NEEDS_BACKEND_REVIEW | No duplicate endpoint found. |
| Team | Invite | DISABLED | `POST /seller/stores/:storeId/members/invite` | `STORE_MEMBERS_MANAGE`, `STORE_ROLES_MANAGE` | KEEP_DISABLED | Needs role form, role hierarchy guard, and test-email fixture flow. |
| Team | Resend invite | DISABLED | `POST /seller/stores/:storeId/members/:memberId/reinvite` | `STORE_MEMBERS_MANAGE`, `STORE_ROLES_MANAGE` | KEEP_DISABLED | Needs invited member fixture and role payload. |
| Team | Change role | DISABLED | `PATCH /seller/stores/:storeId/members/:memberId/role` | `STORE_MEMBERS_MANAGE`, `STORE_ROLES_MANAGE` | KEEP_DISABLED | Needs self/owner/admin hierarchy UX. |
| Team | Change status | DISABLED | `PATCH /seller/stores/:storeId/members/:memberId/status` | `STORE_MEMBERS_MANAGE` | KEEP_DISABLED | Needs confirmation and active/disabled transition coverage. |
| Team | Remove access | DISABLED | `PATCH /seller/stores/:storeId/members/:memberId/remove` | `STORE_MEMBERS_MANAGE` | KEEP_DISABLED | Destructive access change; keep guarded pending fixture rollback. |
| Notification | Mark one as read | DISABLED | `PATCH /seller/stores/:storeId/notifications/:id/read` | `STORE_VIEW` / Seller 2026 `NOTIFICATION_READ` | WIRE_NOW | Wired in UI and smoke tested. |
| Notification | Mark all as read | DISABLED | `PATCH /seller/stores/:storeId/notifications/read-all` | `STORE_VIEW` / Seller 2026 `NOTIFICATION_READ` | WIRE_NOW | Wired in UI and smoke tested. |
| Team Audit | Export | DISABLED | Not confirmed | `AUDIT_LOG_VIEW` | NEEDS_BACKEND_REVIEW | Audit list exists; export endpoint not confirmed. |

## Mutations Wired

| Area | Action | Endpoint/API | Permission | Test Result |
|---|---|---|---|---|
| Notification | Mark one as read | `markSellerNotificationRead` -> `PATCH /seller/stores/:storeId/notifications/:id/read` | Frontend `NOTIFICATION_READ`; backend `STORE_VIEW` | PASS in smoke, `200 {"success":true}` |
| Notification | Mark all as read | `markAllSellerNotificationsRead` -> `PATCH /seller/stores/:storeId/notifications/read-all` | Frontend `NOTIFICATION_READ`; backend `STORE_VIEW` | PASS in smoke, `200 {"success":true,"data":{"updated":0}}` |

## Mutations Kept Disabled

| Area | Action | Reason | Next Requirement |
|---|---|---|---|
| Product | Submit review | Media/variant/readiness steps are not complete in Seller 2026 UI. | Product Authoring Phase 2 with validation and fixture product lifecycle. |
| Product | Duplicate/archive/delete | Endpoint exists but UI confirmation/refetch and disposable fixture coverage are not present. | Add row/detail actions with confirmation and non-referenced fixture product. |
| Product | Publish/unpublish | Backend has admin-approval blocker; direct seller publish is permission/product-policy sensitive. | Product approval policy decision. |
| Order | Fulfillment/status | Endpoint exists; shipment rollout state and transition payload need focused UX. | Fulfillment mutation flow with courier/tracking fields and transition smoke. |
| Payment Review | Approve/reject | Endpoint exists, but backend role restriction and review reason/rollback need explicit flow. | Owner/admin-only review modal and disposable payment proof fixture. |
| Payment Profile | Save/submit request | Endpoints exist; safe request form and upload lifecycle are not present. | Payment profile request editor task. |
| Coupon | Create/edit/status/delete | Endpoints exist; form validation, lifecycle copy, and rollback-safe smoke not wired. | Coupon lifecycle UI task with disposable coupon fixture. |
| Team | Invite/resend/role/status/remove | Endpoints exist; self-remove, hierarchy, role payload, and rollback risks remain. | Team mutation task with test users/invitations. |
| Team Audit | Export | No clear endpoint found. | Backend/API review for export contract. |

## Permission Guard

| Action | Frontend Guard | Backend Guard | Result |
|---|---|---|---|
| Notification mark read | `NOTIFICATION_READ` alias plus `SELLER_2026_MUTATIONS.notifications` | `requireSellerStoreAccess(["STORE_VIEW"])` | WIRED_AND_TESTED |
| Notification mark all read | `NOTIFICATION_READ` alias plus `SELLER_2026_MUTATIONS.notifications` | `requireSellerStoreAccess(["STORE_VIEW"])` | WIRED_AND_TESTED |
| Product draft save | `CATALOG_PRODUCT_CREATE` / `CATALOG_PRODUCT_UPDATE` and `productDraftSave` flag | `PRODUCT_CREATE` / `PRODUCT_EDIT` | Existing wired path kept |
| Product submit/publish/delete | Buttons remain disabled by Seller 2026 mutation flags | `PRODUCT_EDIT` / `PRODUCT_PUBLISH` / `PRODUCT_ARCHIVE` | Kept disabled |
| Order fulfillment | Buttons remain disabled by Seller 2026 `orders` flag | `ORDER_VIEW`, `ORDER_FULFILLMENT_MANAGE` | Kept disabled |
| Payment review approve/reject | Buttons remain disabled by Seller 2026 `payments` flag | view permissions plus owner/admin mutation role check | Kept disabled |
| Coupon lifecycle | Buttons/forms remain disabled by Seller 2026 `catalog` flag | `COUPON_CREATE`, `COUPON_EDIT`, `COUPON_STATUS_MANAGE` | Kept disabled |
| Team lifecycle | Buttons/forms remain disabled by Seller 2026 `team` flag | `STORE_MEMBERS_MANAGE`, `STORE_ROLES_MANAGE` | Kept disabled |
| Team audit export | Button remains disabled | No export endpoint confirmed | Kept disabled |

## Fixture / Smoke Mutation

| Mutation | Result | Rollback/Idempotency | Notes |
|---|---|---|---|
| Notification mark read | PASS, status 200 | Fixture recreates the notification each smoke run. | Used fixture notification id `5691` in verified run. |
| Notification mark all read | PASS, status 200 | Idempotent; second call can update `0` rows after mark-one. | Smoke observed `updated: 0` after mark-one. |

## Bugs Found

- Seller 2026 notification mutations had existing store-scoped backend endpoints but the UI mutation flag and live page controls were still disabled.
- The smoke fixture did not expose a notification id, so mutation smoke could not target the deterministic notification before this patch.
- Several mutation endpoints exist for products/coupons/team/payments, but their Seller 2026 UI forms are not complete enough to enable safely in the same pass.

## Fixes Applied

- Added common Seller 2026 mutation result/error normalization helper.
- Added Seller 2026 notification mutation wrappers.
- Added `useSeller2026NotificationMutations` with loading/error state and query invalidation after success.
- Enabled only the `notifications` mutation feature flag.
- Wired live notifications UI for mark-one-read and mark-all-read with permission/flag guards, pending state, success/error copy, and no optimistic fake success.
- Extended smoke fixture to return notification id and smoke both notification mutation endpoints.
- Updated `system_map.md` with `Seller Workspace 2026 Mutation Status`.

## Testing

- Live smoke: `pnpm.cmd exec tsx scripts/seller2026-auth-fixture-live-smoke.ts` PASS.
- Smoke mutation: notification mark read `200`; notification mark all read `200`.
- Cross-store guard: PASS, owner A to other store remains `FORBIDDEN` and context API returns expected `403`.
- Typecheck: `pnpm.cmd -F client exec tsc -b` PASS.
- Build: `pnpm.cmd -F client build` PASS with existing Vite large chunk warning.
- Seller 2026 lint: `pnpm.cmd -F client exec eslint src/features/seller2026 src/pages/seller2026 src/hooks/seller2026 src/api/seller2026 src/routes/seller2026RouteConfig.jsx` PASS with one existing warning that `src/routes/seller2026RouteConfig.jsx` is ignored by active ESLint config.
- Full lint: not run as a gate; existing repo-wide lint debt remains out of scope.

## Risks Remaining

- Product submit/duplicate/archive/delete/publish/media/variant actions need a focused authoring lifecycle task.
- Order fulfillment needs a dedicated workflow with transition validation, courier/tracking fields, and shipment rollout awareness.
- Payment review mutation needs owner/admin-only UI, reason modal, and disposable payment proof fixture.
- Coupon lifecycle needs validated create/edit/status/delete forms and rollback-safe fixture coverage.
- Team mutation needs hierarchy/self-remove safeguards and disposable invite/member fixture coverage.
- Team audit export still needs backend/API contract review.

## Recommended Next Task

- `SELLER-2026-COUPON-LIFECYCLE-05` or `SELLER-2026-PRODUCT-AUTHORING-LIFECYCLE-05`, depending whether the next priority is low-risk promo CRUD or product submit/duplicate/archive flow.
