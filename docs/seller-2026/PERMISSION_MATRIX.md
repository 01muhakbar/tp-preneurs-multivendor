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
| Store Profile | Edit fields, logo/banner, policies, theme | `STORE_PROFILE_UPDATE` | `storefront` | Disabled. |
| Store Profile | Submit for review | `STORE_PROFILE_UPDATE` | `storefront` | Disabled. |
| Products | Add product | `CATALOG_PRODUCT_CREATE` | `products` | Disabled. |
| Products | Edit product | `CATALOG_PRODUCT_UPDATE` | `products` | Disabled unless route detail link is read-only. |
| Products | Save draft | `CATALOG_PRODUCT_CREATE` or `CATALOG_PRODUCT_UPDATE` | `products` | Disabled. |
| Products | Submit product | `CATALOG_PRODUCT_SUBMIT` | `products` | Disabled. |
| Products | Delete product | `CATALOG_PRODUCT_DELETE` | `products` | Disabled. |
| Catalog | Category mutation shell | `CATALOG_CATEGORY_READ` | `catalog` | Disabled; no mutation permission exists yet. |
| Catalog | Attribute mutation shell | `CATALOG_ATTRIBUTE_READ` | `catalog` | Disabled; no mutation permission exists yet. |
| Coupons | Create coupon | `COUPON_CREATE` | `catalog` | Disabled. |
| Coupons | Update coupon | `COUPON_UPDATE` | `catalog` | Disabled. |
| Coupons | Delete coupon | `COUPON_DELETE` | `catalog` | Disabled. |
| Orders | Pack, print label, mark shipped, update tracking | `ORDER_FULFILLMENT_UPDATE` | `orders` | Disabled. |
| Payments | Approve/reject/refund payment | `PAYMENT_REVIEW_READ` | `payments` | Disabled. |
| Payments | Submit profile, upload documents, change payout account | `STORE_PAYMENT_PROFILE_SUBMIT` | `payments` | Disabled. |
| Team | Invite/resend/cancel invitation | `TEAM_INVITE` | `team` | Disabled. |
| Team | Update role / save changes | `TEAM_ROLE_UPDATE` | `team` | Disabled. |
| Team | Remove member | `TEAM_REMOVE` | `team` | Disabled. |
| Notifications | Mark read/delete notification | `NOTIFICATION_READ` | `notifications` | Disabled. |

## Current Mutation Policy
- A button can become active only when the user has the required permission and the matching mutation flag is enabled.
- All Seller 2026 mutation flags remain `false` in this pass.
- Frontend permission gating is UX readiness only; backend permission and store-scope enforcement remain the source of truth.

## Known Gaps
- Some legacy permissions are still aliased, such as `STORE_VIEW`, `PRODUCT_VIEW`, `CATEGORY_VIEW`, `ATTRIBUTE_VIEW`, and `COUPON_VIEW`.
- Category and attribute mutation-specific permissions are not modeled yet, so those actions stay disabled behind read permissions and mutation flags.
- Seller 2026 `.jsx` files are ignored by the current ESLint config.

## Next Phase
- Store profile update mutation.
- Product draft save mutation.
- Coupon create mutation.
- Fulfillment mutation.
- Team invitation mutation.
- Notification read/delete mutation.
