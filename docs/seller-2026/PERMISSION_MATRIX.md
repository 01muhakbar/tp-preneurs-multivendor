# Seller Workspace 2026 Permission Matrix

## Source
- Live Seller 2026 pages read permissions from the existing `SellerLayout` store context.
- Primary source: `sellerContext.access.permissionKeys`.
- Normalization helper: `client/src/api/seller2026/permissions.ts`.
- Page helper: `client/src/pages/seller2026/seller2026PagePermissions.js`.
- Preview routes use `SELLER_2026_PREVIEW_PERMISSIONS` and are not used as live fallback.

## Route Permissions
| Route | Required Permission | Behavior if Missing |
| --- | --- | --- |
| `/seller/stores/:storeSlug/dashboard` | `STORE_DASHBOARD_VIEW` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/store-profile` | `STORE_PROFILE_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/microsite-preview` | `STORE_PROFILE_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/catalog/products` | `CATALOG_PRODUCT_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/catalog/products/new` | `CATALOG_PRODUCT_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/catalog/products/:productId` | `CATALOG_PRODUCT_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/catalog/products/:productId/edit` | `CATALOG_PRODUCT_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/catalog/categories` | `CATALOG_CATEGORY_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/catalog/attributes` | `CATALOG_ATTRIBUTE_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/catalog/attributes/:attributeId/values` | `CATALOG_ATTRIBUTE_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/catalog/coupons` | `COUPON_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/orders` | `ORDER_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/orders/:suborderId` | `ORDER_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/payment-review` | `PAYMENT_REVIEW_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/payment-profile` | `STORE_PAYMENT_PROFILE_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/team` | `TEAM_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/team/:memberId` | `TEAM_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/team/audit` | `TEAM_AUDIT_READ` | Restricted state when permission source is available. |
| `/seller/stores/:storeSlug/notifications` | `NOTIFICATION_READ` | Restricted state when permission source is available. |

## Action Permissions
| Domain | Action | Required Permission | Mutation Flag | Current Status |
| --- | --- | --- | --- | --- |
| Store Profile | Edit supported seller-owned fields | `STORE_PROFILE_UPDATE` | `storeProfileUpdate` | Enabled for live store profile route. |
| Store Profile | Logo/banner upload, policies, theme | `STORE_PROFILE_UPDATE` | `storefront` | Disabled. |
| Store Profile | Submit for review | `STORE_PROFILE_UPDATE` | `storefront` | Disabled. |
| Products | Add product / create draft | `CATALOG_PRODUCT_CREATE` | `productDraftSave` | Enabled on live product create route. |
| Products | Edit product | `CATALOG_PRODUCT_UPDATE` | `products` | Disabled unless route detail link is read-only. |
| Products | Save draft | `CATALOG_PRODUCT_CREATE` or `CATALOG_PRODUCT_UPDATE` | `productDraftSave` | Enabled on live product create/edit routes. |
| Products | Submit product | `CATALOG_PRODUCT_SUBMIT` | `products` | Disabled. |
| Products | Delete product | `CATALOG_PRODUCT_DELETE` | `products` | Disabled. |
| Catalog | Category mutation shell | `CATALOG_CATEGORY_READ` | `catalog` | Disabled; no mutation permission exists yet. |
| Catalog | Attribute mutation shell | `CATALOG_ATTRIBUTE_READ` | `catalog` | Disabled; no mutation permission exists yet. |
| Coupons | Create coupon | `COUPON_CREATE` | `coupons` | Enabled on live coupon route. |
| Coupons | Update coupon | `COUPON_UPDATE` aliasing backend `COUPON_EDIT` | `coupons` | Enabled on live coupon route. |
| Coupons | Activate/deactivate coupon | `COUPON_STATUS_MANAGE` | `coupons` | Enabled on live coupon route. |
| Coupons | Archive coupon | `COUPON_DELETE` aliasing backend `COUPON_STATUS_MANAGE` | `coupons` | Enabled as deactivate/archive only, not hard delete. |
| Orders | Mark packed, mark shipped, mark delivered | `ORDER_FULFILLMENT_UPDATE` aliasing backend `ORDER_FULFILLMENT_MANAGE` | `orders` | Enabled when backend governance exposes the action. |
| Orders | Add/update tracking number | `ORDER_FULFILLMENT_UPDATE` | `orders` | Disabled pending persisted shipment tracking support. |
| Orders | Print label / receipt | `ORDER_FULFILLMENT_UPDATE` | `orders` | Disabled pending endpoint review. |
| Orders | Bulk fulfillment / bulk delete | `ORDER_FULFILLMENT_UPDATE` | `orders` | Disabled pending endpoint and destructive-flow review. |
| Payments | Approve/reject payment proof | `PAYMENT_REVIEW_READ` + backend owner/admin review governance | `payments` | Enabled on live payment review route. |
| Payments | Request clarification/refund/dispute payment | `PAYMENT_REVIEW_READ` | `payments` | Disabled pending backend lifecycle/governance review. |
| Payments | Submit/update payment profile request | `STORE_PAYMENT_PROFILE_SUBMIT` aliasing backend `PAYMENT_PROFILE_EDIT` | `payments` | Enabled on live payment profile route as admin-reviewed request only. |
| Payments | Upload payment profile documents | `STORE_PAYMENT_PROFILE_SUBMIT` | `payments` | Disabled pending endpoint review. |
| Payments | Approve/activate/deactivate profile, change payout execution | n/a | n/a | Admin/system only; not exposed to seller. |
| Team | Invite/resend/cancel invitation | `TEAM_INVITE` | `team` | Disabled. |
| Team | Update role / save changes | `TEAM_ROLE_UPDATE` | `team` | Disabled. |
| Team | Remove member | `TEAM_REMOVE` | `team` | Disabled. |
| Notifications | Mark one/all as read | `NOTIFICATION_READ` | `notifications` | Enabled on live notifications route. |
| Notifications | Delete notification | `NOTIFICATION_READ` | `notifications` | Disabled. |

## Current Mutation Policy
- A button can become active only when the user has the required permission and the matching mutation flag is enabled.
- Only `storeProfileUpdate`, `productDraftSave`, `coupons`, `orders`, payment review approve/reject, payment profile request submit, and notification read-state mutations are enabled; all other Seller 2026 mutation flags remain `false`.
- Frontend permission gating is UX readiness only; backend permission and store-scope enforcement remain the source of truth.

## Known Gaps
- Some legacy permissions are still aliased, such as `STORE_VIEW`, `PRODUCT_VIEW`, `CATEGORY_VIEW`, `ATTRIBUTE_VIEW`, and `COUPON_VIEW`.
- Category and attribute mutation-specific permissions are not modeled yet, so those actions stay disabled behind read permissions and mutation flags.
- Payment review mutation enablement depends on backend `canReview` governance because the backend limits mutation to `STORE_OWNER` and `STORE_ADMIN` even when `ORDER_MANAGER` can view payment review.
- Payment profile request submit depends on backend `governance.canEdit`; submitted requests become review-locked until admin action.
- Seller 2026 `.jsx` files are ignored by the current ESLint config.

## Next Phase
- Team invitation mutation.
- Notification delete mutation.
