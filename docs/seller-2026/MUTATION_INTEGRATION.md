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
