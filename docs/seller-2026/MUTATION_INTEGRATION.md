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
- submit review
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
