# Seller Workspace 2026 Implementation Map

## Dari system_map.md ke slicing

| System map area | Visual slicing section | Files |
|---|---|---|
| Dashboard / Overview | Dashboard & Growth Command Center | `Seller2026Workspace.jsx`, section `dashboard` |
| Store Profile / Microsite | Storefront, Store Profile & Microsite | `Seller2026Workspace.jsx`, section `storefront` |
| Products / Product Authoring | Product Catalog & Authoring | `Seller2026Workspace.jsx`, section `products` |
| Categories / Attributes / Coupons | Catalog Tools | `Seller2026Workspace.jsx`, section `taxonomy` |
| Orders / Fulfillment / Payments | Operations | `Seller2026Workspace.jsx`, section `operations` |
| Team / Audit / Notifications | Collaboration | `Seller2026Workspace.jsx`, section `team` |

## API integration targets

Saat mengganti data mock menjadi data real, hubungkan tiap area ke API existing berikut:

- Dashboard: `client/src/api/sellerWorkspace.ts`, `client/src/api/sellerNotifications.ts`
- Storefront/Profile: `client/src/api/sellerStoreProfile.ts`
- Products: `client/src/api/sellerProducts.ts`
- Categories: `client/src/api/sellerCategories.ts`
- Attributes: `client/src/api/sellerAttributes.ts`
- Coupons: `client/src/api/sellerCoupons.ts`
- Orders/Suborders: `client/src/api/sellerOrders.ts`
- Payment Review: `client/src/api/sellerPayments.ts`
- Payment Profile: `client/src/api/sellerPaymentProfile.ts`
- Team: `client/src/api/sellerTeam.ts`, `client/src/api/sellerInvitations.ts`, `client/src/api/sellerTeamAudit.ts`

## UI production checklist

- Replace mock tables with React Query hooks.
- Add loading skeletons for each table/card.
- Add empty state per domain.
- Connect action buttons to existing mutation endpoints.
- Preserve `storeSlug` and server-resolved `storeId` scope.
- Do not expose admin-only fields in public storefront preview.
- Keep permission gating from existing `SellerLayout` and middleware.
