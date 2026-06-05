# Seller Workspace 2026 Mutation Integration

## Store Profile Update

### Route
- `/seller/stores/:storeSlug/store-profile`

### Permission
- UI permission: `STORE_PROFILE_UPDATE`
- Backend permission alias/source: `STORE_EDIT`

### Mutation Flag
- `storeProfileUpdate: true`

### Endpoint Used
- `PATCH /api/seller/stores/:storeId/store-profile`

### Payload Fields Enabled
- `description`
- `email`
- `whatsapp`
- `phone`
- `websiteUrl`
- `instagramUrl`
- `tiktokUrl`
- `addressLine1`
- `addressLine2`
- `city`
- `province`
- `postalCode`
- `country`
- `shippingSetup.originContactName`
- `shippingSetup.originPhone`
- `shippingSetup.originAddressLine1`
- `shippingSetup.originAddressLine2`
- `shippingSetup.originDistrict`
- `shippingSetup.originCity`
- `shippingSetup.originProvince`
- `shippingSetup.originPostalCode`
- `shippingSetup.originCountry`
- `shippingSetup.pickupNotes`

### Fields Still Disabled
- store name
- slug
- logo upload
- banner upload
- business category/subcategory
- operating hours
- policy full editor
- theme persistence
- homepage section persistence
- submit for review

### Safety Notes
- `storeId` is resolved from live seller workspace context, not from form body.
- Frontend submits a whitelisted payload through `storefront.mutations.ts`.
- Backend route uses `requireSellerStoreAccess(["STORE_EDIT"])`.
- Backend schema rejects unknown fields and read-only profile fields.
- Preview route `/seller-2026/storefront` remains mock-only and receives no mutation handler.
- Frontend permission gating is UX only; backend remains the enforcement authority.

## Product Draft Save

### Routes
- `/seller/stores/:storeSlug/catalog/products/new`
- `/seller/stores/:storeSlug/catalog/products/:productId/edit`

### Permissions
- Create draft: `CATALOG_PRODUCT_CREATE` aliasing backend `PRODUCT_CREATE`
- Update draft: `CATALOG_PRODUCT_UPDATE` aliasing backend `PRODUCT_EDIT`

### Mutation Flag
- `productDraftSave: true`

### Endpoints Used
- `POST /api/seller/stores/:storeId/products/drafts`
- `PATCH /api/seller/stores/:storeId/products/:productId/draft`

### Payload Fields Enabled
- `name`
- `sku`
- `description`
- `categoryIds`
- `tags`
- `price`
- `salePrice` through the Seller 2026 `compareAtPrice` payload field
- `stock`
- `seo.title`
- `seo.description`

### Fields Still Disabled
- media upload
- variant matrix persistence
- publish/unpublish
- delete product
- duplicate product
- deactivate product
- public visibility toggle
- admin revision lifecycle
- inventory adjustment workflow

### Safety Notes
- `storeId` is resolved from live seller workspace context, not from the form body.
- Frontend submits a whitelisted draft payload through `products.mutations.ts`.
- Create endpoint uses `requireSellerStoreAccess(["PRODUCT_CREATE"])`.
- Update endpoint uses `requireSellerStoreAccess(["PRODUCT_EDIT"])` and fetches product by `{ id, storeId }`.
- Create endpoint forces `status: "draft"` and `isPublished: false`.
- Preview route `/seller-2026/products` remains mock-only and receives no draft save mutation handler.

## Product Submit Review

### Routes
- `/seller/stores/:storeSlug/catalog/products`
- `/seller/stores/:storeSlug/catalog/products/:productId`
- `/seller/stores/:storeSlug/catalog/products/:productId/edit`

### Permission / Governance
- UI permission: `CATALOG_PRODUCT_SUBMIT`
- Backend permission alias/source: `PRODUCT_EDIT`
- Backend route guard: `requireSellerStoreAccess(["PRODUCT_EDIT"])`

### Mutation Flag
- `productSubmitReview: true`
- `products: false` remains the guard for direct publish/delete/bulk product actions.

### Endpoint Used
- `POST /api/seller/stores/:storeId/products/:productId/submit-review`

### Payload Fields Enabled
- No request payload is sent. The endpoint uses route-scoped `storeId` and `productId` only.

### Lifecycle Actions Enabled
- Submit an existing store-owned draft product for admin review.
- Resubmit a draft product with `sellerSubmissionStatus: "needs_revision"` when backend actionability allows it.
- Refetch Seller 2026 product list/detail after successful submit.

### Fields Still Disabled
- Direct publish/unpublish.
- Product delete/archive.
- Bulk submit review.
- Product duplicate.
- Media upload.
- Variant matrix persistence.
- Admin approval/rejection/revision mutation.

### Safety Notes
- `storeId` is resolved from the live seller workspace context, not from the UI body.
- Frontend submit review is exposed only on live list/detail/edit routes when the adapted product view model reports `canSubmitReview`.
- The adapter reads backend `submission.canSubmit`, `submission.canResubmit`, and `governance.submissionGovernance` before enabling the action.
- Backend still fetches the product by `{ id: productId, storeId }`, requires draft status, rejects already-submitted drafts, and writes seller submission audit/activity data.
- Seller 2026 create route requires saving a draft first; submit review is then available from the edit/detail/list surface with a persisted `productId`.
- Preview route `/seller-2026/products` remains mock-only and receives no live submit review mutation handler.

## Notification Read State

### Route
- `/seller/stores/:storeSlug/notifications`

### Permission
- UI permission: `NOTIFICATION_READ`
- Backend permission alias/source: `STORE_VIEW`

### Mutation Flag
- `notifications: true`

### Endpoints Used
- `PATCH /api/seller/stores/:storeId/notifications/:notificationId/read`
- `PATCH /api/seller/stores/:storeId/notifications/read-all`
- `GET /api/seller/stores/:storeId/notifications/unread-count`

### Fields Enabled
- mark one seller notification as read
- mark all seller notifications as read for the current store/user scope
- refetch Seller 2026 notification list and unread count
- invalidate existing SellerLayout notification dropdown queries

### Fields Still Disabled
- delete notification
- create notification
- admin notification read state
- cross-store notification mutation
- real-time push subscriptions

### Safety Notes
- `storeId` is resolved from live seller workspace context, not from a form body.
- Frontend calls whitelisted notification mutation helpers through `notifications.mutations.ts`.
- Backend routes use `requireSellerStoreAccess(["STORE_VIEW"])`.
- Backend service filters mutations by seller notification metadata: `audience: "SELLER"`, `userId`, and `storeId`.
- Mutations are idempotent for already-read in-scope notifications and return not found for out-of-scope notifications.
- Preview route `/seller-2026/team` remains mock-only and receives no live notification mutation handler.

## Coupon Lifecycle

### Route
- `/seller/stores/:storeSlug/catalog/coupons`

### Permissions
- Create coupon: `COUPON_CREATE`
- Edit coupon fields: `COUPON_UPDATE`, aliased to backend `COUPON_EDIT`
- Activate/deactivate coupon: `COUPON_STATUS_MANAGE`
- Archive coupon: `COUPON_DELETE`, aliased to backend `COUPON_STATUS_MANAGE`

### Mutation Flag
- `coupons: true`

### Endpoints Used
- `POST /api/seller/stores/:storeId/coupons`
- `PATCH /api/seller/stores/:storeId/coupons/:couponId`
- `DELETE /api/seller/stores/:storeId/coupons/:couponId`

### Payload Fields Enabled
- `code`
- `campaignName`
- `discountType`
- `amount`
- `minSpend`
- `active`
- `startsAt`
- `expiresAt`
- `bannerImageUrl`

### Lifecycle Actions Enabled
- Create coupon from the Seller 2026 coupon drawer.
- Edit supported coupon fields from the coupon table.
- Activate and deactivate coupons through the status action.
- Archive coupon through the existing backend delete route, which deactivates the store-scoped coupon instead of hard deleting it.

### Fields Still Disabled
- Hard delete.
- Duplicate coupon.
- Coupon import/export.
- Banner upload picker.
- Cross-store coupon mutation.
- Admin coupon lifecycle mutation from Seller 2026.

### Safety Notes
- `storeId` is resolved from the live seller workspace context, not from the form body.
- Frontend sends a whitelisted coupon payload through `coupons.mutations.ts`.
- Create endpoint forces `scopeType: "STORE"` and the resolved `storeId`.
- Edit endpoint looks up coupons by `{ couponId, storeId, scopeType: "STORE" }`.
- Updating `active` requires backend `COUPON_STATUS_MANAGE`.
- Delete endpoint is treated by the UI as archive/deactivate because the backend returns a deactivated coupon.
- Preview route `/seller-2026/catalog-tools` remains mock-only and receives no live coupon mutation handler.

## Order Fulfillment

### Routes
- `/seller/stores/:storeSlug/orders`
- `/seller/stores/:storeSlug/orders/:suborderId`

### Permissions
- Read orders: `ORDER_READ`, aliased to backend `ORDER_VIEW`
- Update fulfillment: `ORDER_FULFILLMENT_UPDATE`, aliased to backend `ORDER_FULFILLMENT_MANAGE`

### Mutation Flag
- `orders: true`

### Endpoint Used
- `PATCH /api/seller/stores/:storeId/suborders/:suborderId/fulfillment`

### Payload Fields Enabled
- `action`
- `shippingFee`

### Lifecycle Actions Enabled
- Mark as Packed through `MARK_PROCESSING` when backend governance exposes it.
- Mark as Shipped through `MARK_SHIPPED`.
- Mark Delivered through `MARK_DELIVERED` when backend governance exposes it.

### Fields Still Disabled
- Payment status mutation.
- Payment approve/reject.
- Tracking/resi persistence. The backend route accepts courier/tracking fields, but the current shipment read model reports legacy fallback/no persisted shipment in the smoke fixture.
- Bulk fulfillment.
- Bulk delete.
- Print receipt/label.
- Cancel/refund/return/dispute UI flows.
- Courier integration beyond the existing text payload fields.

### Safety Notes
- `storeId` is resolved from the live seller workspace context, not from the form body.
- The frontend sends a whitelisted fulfillment payload through `orders.mutations.ts`.
- The backend route is store-scoped by `requireSellerStoreAccess(["ORDER_VIEW", "ORDER_FULFILLMENT_MANAGE"])`.
- The UI reads backend `governance.fulfillment.availableActions` and does not invent unsupported status transitions.
- Payment information remains read-only on Seller 2026 order pages.
- Tracking fields are visible but disabled until persisted shipment tracking is available for the live rollout.
- Preview route `/seller-2026/orders-payments` remains mock-only and receives no live fulfillment mutation handler.

## Payment Review

### Route
- `/seller/stores/:storeSlug/payment-review`

### Permission / Governance
- UI read permission: `PAYMENT_REVIEW_READ`, aliased to backend `PAYMENT_STATUS_VIEW`.
- Backend view guard: `ORDER_VIEW` + `PAYMENT_STATUS_VIEW`.
- Backend mutation governance: the store-scoped review route additionally requires the seller access context to be `STORE_OWNER` or `STORE_ADMIN`.

### Mutation Flag
- `payments: true`

### Endpoint Used
- `PATCH /api/seller/stores/:storeId/payments/:paymentId/review`

### Payload Fields Enabled
- `action: "APPROVE" | "REJECT"`
- `note`

### Lifecycle Actions Enabled
- Approve payment proof while payment status is `PENDING_CONFIRMATION` and the latest proof is `PENDING`.
- Reject payment proof while payment status is `PENDING_CONFIRMATION` and the latest proof is `PENDING`.
- Reject requires a Seller 2026 UI reason before submit; the backend accepts it as `note`.

### Fields Still Disabled
- Request clarification. No distinct seller endpoint/lifecycle exists yet.
- Refund, dispute, payout settlement, and admin reconciliation.
- Payment status mutation from the order detail page.
- Payment profile approval or payout account approval.

### Safety Notes
- `storeId` is resolved from the live seller workspace context, not from a form body.
- Frontend sends a whitelisted payload through `payments.mutations.ts`.
- Frontend only enables actions when the page has read permission, `SELLER_2026_MUTATIONS.payments` is true, backend list governance returns `canReview: true`, and the selected payment row returns `reviewActionability.canReview: true`.
- Backend rechecks route store scope, payment/suborder store ownership, payment status, proof status, role governance, and audit/status log updates.
- Seller 2026 order pages keep payment status read-only.
- Preview route `/seller-2026/orders-payments` remains mock-only and receives no live payment review mutation handler.

## Payment Profile Request

### Route
- `/seller/stores/:storeSlug/payment-profile`

### Permission / Governance
- UI read permission: `STORE_PAYMENT_PROFILE_READ`, aliased to backend `PAYMENT_PROFILE_VIEW`.
- UI submit permission: `STORE_PAYMENT_PROFILE_SUBMIT`, aliased to backend `PAYMENT_PROFILE_EDIT`.
- Backend guard: `requireSellerStoreAccess(["PAYMENT_PROFILE_EDIT"])`.
- Backend request governance: seller edits only a separate store-scoped request; admin remains final reviewer and activation authority.

### Mutation Flag
- `payments: true`

### Endpoint Used
- `POST /api/seller/stores/:storeId/payment-profile/request/submit`

### Payload Fields Enabled
- `accountName`
- `merchantName`
- `merchantId`
- `qrisImageUrl`
- `qrisPayload`
- `instructionText`
- `sellerNote`

### Lifecycle Actions Enabled
- Submit payment profile request for admin review.
- Refetch payment profile state after successful submit.

### Fields Still Disabled
- Direct active profile approval.
- Direct activation/deactivation.
- Payout execution, balance withdrawal, settlement, refund, or dispute.
- Payment profile document upload. No dedicated seller payment-profile document endpoint is confirmed.
- Admin review note/status mutation from seller UI.

### Safety Notes
- `storeId` is resolved from the live seller workspace context, not from a form body.
- Frontend sends a whitelisted request payload through `payment-profile.mutations.ts`.
- Seller 2026 validates required request fields before submit: account owner name, merchant name, and QRIS image URL.
- Backend rejects unknown fields through a strict schema and blocks edits while the latest request is already `SUBMITTED`.
- The active approved snapshot remains unchanged until admin review/promotion outside Seller 2026.
- Preview route `/seller-2026/orders-payments` remains mock-only and receives no live payment profile mutation handler.
