# TP Preneurs Seller Workspace 2026 — Slicing Package

Paket ini berisi hasil slicing visual mockup Seller Workspace 2026 untuk project `tp-preneurs-multivendor-main`.

Fokus implementasi:

- Dashboard seller: KPI, readiness, analytics, traffic, top products, recent suborders, quick actions.
- Storefront: Store Profile, Microsite Preview, Store Readiness, Theme & Customization.
- Catalog: Products List, Product Create/Edit, Product Detail/Preview, Revision Notes, Publish History.
- Catalog tools: Categories, Attributes, Attribute Values, Coupons.
- Operations: All Orders, Fulfillment Queue, Suborder Detail, Payment Review, Payment Profile.
- Collaboration: Members, Role Editor, Invitations, Audit Log, Notifications Center.
- Light/Dark mode preview via local component state.

## Struktur file

```text
client/src/features/seller2026/
  Seller2026Workspace.jsx          # komponen utama slicing
  Seller2026DesignSystem.css       # design token + layout + component CSS
  seller2026Data.js                # mock data untuk slicing

client/src/pages/seller2026/
  Seller2026Pages.jsx              # named wrapper pages
  Seller2026DashboardPage.jsx
  Seller2026StorefrontPage.jsx
  Seller2026ProductsPage.jsx
  Seller2026CategoriesPage.jsx
  Seller2026AttributesPage.jsx
  Seller2026AttributeValuesPage.jsx
  Seller2026CouponsPage.jsx
  Seller2026OrdersPage.jsx
  Seller2026OrderDetailPage.jsx
  Seller2026PaymentReviewPage.jsx
  Seller2026PaymentProfilePage.jsx
  Seller2026TeamPage.jsx
  Seller2026MemberDetailPage.jsx
  Seller2026InvitationsPage.jsx
  Seller2026AuditLogPage.jsx
  Seller2026NotificationsPage.jsx

client/src/routes/
  seller2026RouteConfig.jsx        # route preview opsional

patches/
  App.jsx.integration-snippet.md   # panduan integrasi ke App.jsx

docs/seller-2026-mockups/
  01-dashboard-design-direction.png
  02-storefront-profile-microsite.png
  03-product-catalog-management.png
  04-categories-attributes-coupons.png
  05-orders-fulfillment-payments.png
  06-team-audit-notifications.png
```

## Cara implementasi cepat

1. Copy folder `client/src/features/seller2026` ke project Anda.
2. Copy folder `client/src/pages/seller2026` ke project Anda.
3. Copy `client/src/routes/seller2026RouteConfig.jsx` ke project Anda.
4. Ikuti panduan di `patches/App.jsx.integration-snippet.md`.
5. Jalankan:

```bash
cd client
npm run dev
```

6. Buka preview:

```text
/seller-2026
/seller-2026/storefront
/seller-2026/catalog/products
/seller-2026/catalog/categories
/seller-2026/catalog/attributes
/seller-2026/catalog/coupons
/seller-2026/orders
/seller-2026/payment-review
/seller-2026/payment-profile
/seller-2026/team
/seller-2026/notifications
```

## Integrasi ke route seller live

Setelah preview disetujui, Anda dapat mengganti page live secara bertahap:

| Route live saat ini | Page slicing yang disarankan |
|---|---|
| `/seller/stores/:storeSlug/dashboard` | `Seller2026DashboardPage` |
| `/seller/stores/:storeSlug/store-profile` | `Seller2026StorefrontPage` |
| `/seller/stores/:storeSlug/catalog/products` | `Seller2026ProductsPage` |
| `/seller/stores/:storeSlug/catalog/products/new` | `Seller2026ProductsPage` |
| `/seller/stores/:storeSlug/catalog/products/:productId` | `Seller2026ProductsPage` |
| `/seller/stores/:storeSlug/catalog/categories` | `Seller2026CategoriesPage` |
| `/seller/stores/:storeSlug/catalog/attributes` | `Seller2026AttributesPage` |
| `/seller/stores/:storeSlug/catalog/attributes/:attributeId/values` | `Seller2026AttributeValuesPage` |
| `/seller/stores/:storeSlug/catalog/coupons` | `Seller2026CouponsPage` |
| `/seller/stores/:storeSlug/orders` | `Seller2026OrdersPage` |
| `/seller/stores/:storeSlug/orders/:suborderId` | `Seller2026OrderDetailPage` |
| `/seller/stores/:storeSlug/payment-review` | `Seller2026PaymentReviewPage` |
| `/seller/stores/:storeSlug/payment-profile` | `Seller2026PaymentProfilePage` |
| `/seller/stores/:storeSlug/team` | `Seller2026TeamPage` |
| `/seller/stores/:storeSlug/team/:memberId` | `Seller2026MemberDetailPage` |
| `/seller/stores/:storeSlug/team/audit` | `Seller2026AuditLogPage` |

## Catatan teknis

- Paket ini tidak mengubah API existing. Semua data masih mock supaya aman untuk review visual.
- Tidak menambah dependency baru. Komponen memakai React + CSS plain.
- CSS sengaja di-scope dengan prefix `.s26-` untuk mengurangi konflik dengan styling existing.
- Slicing ini dirancang sebagai foundation UI. Untuk production, hubungkan data dari API existing seperti `sellerProducts.ts`, `sellerOrders.ts`, `sellerPaymentProfile.ts`, `sellerTeam.ts`, dan `sellerNotifications.ts`.
- Light/dark mode pada slicing memakai state lokal. Untuk production, sinkronkan dengan store/theme preference existing.

## Rekomendasi tahapan lanjut

1. Review visual preview route `/seller-2026`.
2. Pecah komponen besar ke domain component kecil jika akan dipakai produksi.
3. Ganti mock data dengan React Query dari API seller existing.
4. Gunakan route live per domain secara bertahap, mulai dari dashboard dan storefront.
5. Tambahkan loading/error/empty state sesuai data real.
