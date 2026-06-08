# system_map.md — Fondasi Sistem TP Preneurs Multi-Vendor

Tanggal audit: 2026-06-05
Repo: `tp-preneurs-multivendor-main`
Fokus: Multi-Vendor Seller Workspace, sinkron Admin Workspace dan Client / Storefront
Status dokumen: DRAFT AWAL berdasarkan audit statis ZIP; belum ada patch ke repo.

> Guardrail utama: jangan hapus fitur duplicate secara langsung. Tandai, audit pemakaian, pilih canonical, lalu sinkronkan/merge setelah aman.

---

## 1. Executive Summary

Repo adalah monorepo e-commerce React + Vite + Express + Sequelize dengan 3 permukaan aplikasi:

1. **Admin Workspace** — pusat governance, approval, audit, store application, product review/publish, payment audit, shipping reconciliation, store customization/settings.
2. **Multi-Vendor Seller Workspace** — workspace operasional seller per store dengan route canonical `/seller/stores/:storeSlug` dan API `/api/seller/stores/:storeId/...`.
3. **Client / Storefront** — public storefront, microsite `/store/:slug`, product visibility, cart, checkout, order tracking, coupon validation.

Temuan utama:

- Root repo belum memiliki `system_map.md`; file ini perlu dibuat sebagai fondasi hidup.
- Seller Workspace sudah **EXISTING/PARTIAL kuat**: dashboard, store profile, product catalog/authoring, order/suborder operations, payment setup/profile, payment review, coupons, team/permission, notifications, analytics/readiness.
- Banyak fitur sudah pernah di-hardening lewat report historis di `reports/` dan `CODEx_REPORTS/`; report ini harus dibaca sebelum perubahan lanjutan.
- Potensi duplicate terbesar ada pada product route lama vs canonical, payment profile lama vs seller payment profile request, admin product controller legacy vs `admin.products.ts`, public product route vs store/microsite route, dan coupon boundary admin/seller/storefront.
- Perubahan lanjutan harus berupa **sync kecil + dokumentasi + smoke**, bukan rebuild fitur.

---

## 2. 3-App Boundary Map

| Aplikasi | Tanggung Jawab | Source of Truth Utama | Guardrail |
|---|---|---|---|
| Admin Workspace | Review store application, review product seller, publish/unpublish, payment audit/profile review, store settings/customization, shipping reconciliation, master catalog governance | `client/src/pages/admin/*`, `server/src/routes/admin.*.ts`, Admin models/services | Admin tetap final authority untuk approval/publish/payment governance. Jangan pindahkan authority ini ke Seller. |
| Seller Workspace | Operasional toko milik seller: profile editable fields, catalog/product draft, submit review, orders/suborders, payment setup request, coupon store scope, team/member, readiness, analytics | `client/src/layouts/SellerLayout.jsx`, `client/src/pages/seller/*`, `client/src/api/seller*.ts`, `server/src/routes/seller.*.ts` | Seller hanya mengelola data store yang dia punya aksesnya. Semua mutasi harus melewati `requireSellerStoreAccess`/permission. |
| Client / Storefront | Public product/store display, microsite, cart, checkout, order tracking, coupon validation | `client/src/pages/store/*`, `server/src/routes/store.ts`, `server/src/routes/public.ts`, `server/src/routes/checkout.ts`, `server/src/routes/store.coupons.ts` | Storefront hanya membaca data approved/published/visible. Checkout harus membuat order/suborder yang kembali terbaca oleh Seller/Admin. |

---

## 3. Seller Workspace Canonical Map

Canonical route UI: `/seller/stores/:storeSlug`.

Canonical route builder: `client/src/utils/sellerWorkspaceRoute.js`.

Layout/workspace shell: `client/src/layouts/SellerLayout.jsx`.

Shared seller UI foundation: `client/src/components/seller/SellerWorkspaceFoundation.jsx`.

| Modul | UI | API Client | Backend Route | Status | Notes |
|---|---|---|---|---|---|
| Overview / Dashboard | `SellerWorkspaceHome.jsx` | `sellerWorkspace.ts` | `seller.workspace.ts` | EXISTING / NEEDS_SYNC | Menggabungkan context, finance summary, readiness, analytics. |
| Store Profile | `SellerStoreProfilePage.jsx` | `sellerStoreProfile.ts` | `seller.storeProfile.ts` | EXISTING | Perlu sinkron Admin + Storefront identity. |
| Shipping Setup | anchor `store-profile#shipping-setup` | `sellerStoreProfile.ts` | seller store profile / shipping service | PARTIAL | Status muncul di sidebar; validasi readiness harus dipetakan. |
| Product Catalog | `SellerCatalogPage.jsx`, detail/edit/authoring | `sellerProducts.ts` | `seller.products.ts` | EXISTING | Draft, authoring, submit review, published read model. |
| Product Submit Review | detail/edit/authoring pages | `submitSellerProductReview` | `seller.products.ts`, `admin.products.ts` | EXISTING / NEEDS_SYNC | Admin approval/publish gate harus tetap source of truth. |
| Orders/Suborders | `SellerOrdersPage.jsx`, `SellerOrderDetailPage.jsx` | `sellerOrders.ts` | `seller.orders.ts` | EXISTING | Seller reads suborders; parent order/payment remains read-only. |
| Payment Review | `SellerPaymentReviewPage.jsx` | `sellerPayments.ts` | `seller.payments.ts` | EXISTING | Seller review buyer payment proof; Admin payment audit remains governance. |
| Payment Setup/Profile | `SellerPaymentProfilePage.jsx` | `sellerPaymentProfile.ts` | `seller.paymentProfiles.ts`, `admin.storePaymentProfiles.ts` | EXISTING / NEEDS_SYNC | Seller creates/updates request; Admin reviews/activates. |
| Coupons | `SellerCouponsPage.jsx` | `sellerCoupons.ts` | `seller.coupons.ts`, `store.coupons.ts`, `admin.coupons.ts` | EXISTING / NEEDS_SYNC | Need attribution contract clear. |
| Team / Role / Permission | `SellerTeamPage.jsx`, audit/lifecycle pages | `sellerTeam.ts`, `sellerTeamAudit.ts` | `seller.team.ts`, seller services | EXISTING | Owner/member lifecycle already modeled. |
| Notifications | SellerLayout notification menu | `sellerNotifications.ts` | `seller.notifications.ts` | EXISTING | Routes notification meta back to orders/payment review. |
| Analytics | Dashboard cards | `sellerWorkspace.ts` | `seller.workspace.ts`, `sellerWorkspaceAnalytics.ts` | EXISTING / PARTIAL | Needs source alignment with order/product/coupon truth. |

---

## 4. Route Map

### 4.1 UI Routes — Seller Canonical

Defined in `client/src/App.jsx`:

- `/seller/stores/:storeSlug` → `SellerLayout` + `SellerWorkspaceHome`
- `/seller/stores/:storeSlug/dashboard` → `SellerWorkspaceHome`
- `/seller/stores/:storeSlug/store-profile` → `SellerStoreProfilePage`
- `/seller/stores/:storeSlug/team` → `SellerTeamPage`
- `/seller/stores/:storeSlug/team/:memberId` → `SellerMemberLifecyclePage`
- `/seller/stores/:storeSlug/team/audit` → `SellerTeamAuditPage`
- `/seller/stores/:storeSlug/catalog/products` → `SellerCatalogPage`
- `/seller/stores/:storeSlug/catalog/categories` → `SellerCategoriesPage`
- `/seller/stores/:storeSlug/catalog/attributes` → `SellerAttributesPage`
- `/seller/stores/:storeSlug/catalog/attributes/:attributeId/values` → `SellerAttributeValuesPage`
- `/seller/stores/:storeSlug/catalog/products/new` → `SellerProductAuthoringPage mode=create`
- `/seller/stores/:storeSlug/catalog/products/:productId` → `SellerProductDetailPage`
- `/seller/stores/:storeSlug/catalog/products/:productId/edit` → `SellerProductEditPage`
- `/seller/stores/:storeSlug/orders` → `SellerOrdersPage`
- `/seller/stores/:storeSlug/orders/:suborderId` → `SellerOrderDetailPage`
- `/seller/stores/:storeSlug/payment-review` → `SellerPaymentReviewPage`
- `/seller/stores/:storeSlug/payment-profile` → `SellerPaymentProfilePage`
- `/seller/stores/:storeSlug/catalog/coupons` → `SellerCouponsPage`

### 4.2 UI Routes — Legacy Seller Redirects

- `/seller/stores/:storeSlug/profile` → redirect to `/store-profile`
- `/seller/stores/:storeSlug/catalog` → redirect to `/catalog/products`
- `/seller/stores/:storeSlug/catalog/new` → redirect to `/catalog/products/new`
- `/seller/stores/:storeSlug/catalog/:productId` → redirect to `/catalog/products/:productId`
- `/seller/stores/:storeSlug/coupons` → redirect to `/catalog/coupons`

Status: `DEPRECATED_CANDIDATE`, tetapi **jangan hapus** sebelum semua link lama, report, smoke, dan notification route diverifikasi.

### 4.3 UI Routes — Admin Related

- `/admin/products` and product detail/edit/preview/review surfaces
- `/admin/orders`
- `/admin/store/applications`
- `/admin/store/payment-profiles`
- `/admin/online-store/payment-audit`
- `/admin/online-store/shipping-reconciliation`
- `/admin/store/customization`
- `/admin/online-store/store-profile`
- `/admin/store/store-settings`

### 4.4 UI Routes — Storefront Related

- `/`
- `/store/:slug`
- `/store/:slug/product/:productSlug` or microsite detail route depending page implementation
- `/product/:slug`
- `/cart`
- `/checkout`
- `/checkout/success`
- `/order/:ref`
- `/offers`
- `/category/:slug`

---

## 5. API Map

### 5.1 Seller API Canonical

Mounted from `server/src/app.ts` under `/api/seller`:

- `GET /api/seller/stores` — seller store list
- `GET /api/seller/stores/:storeId/context`
- `GET /api/seller/stores/slug/:storeSlug/context`
- `GET /api/seller/stores/:storeId/workspace-readiness`
- `GET /api/seller/stores/:storeId/finance-summary`
- `GET /api/seller/stores/:storeId/analytics-summary`
- `GET/PATCH /api/seller/stores/:storeId/store-profile`
- `GET/POST/PATCH/DELETE /api/seller/stores/:storeId/products...`
- `POST /api/seller/stores/:storeId/products/:productId/submit-review`
- `GET /api/seller/stores/:storeId/suborders`
- `GET/PATCH /api/seller/stores/:storeId/suborders/:suborderId...`
- `GET/PUT/POST /api/seller/stores/:storeId/payment-profile...`
- `GET/POST/PATCH/DELETE /api/seller/stores/:storeId/coupons...`
- `GET/POST/PATCH /api/seller/stores/:storeId/team/members...`
- `GET /api/seller/stores/:storeId/team/audit`
- `GET/PATCH /api/seller/stores/:storeId/notifications...`

### 5.2 Admin API Related

Mounted in `server/src/app.ts`:

- `/api/admin/products` — product list/detail/import/bulk/review/publish gates
- `/api/admin/orders` — order truth/admin operations
- `/api/admin/payments/audit` — payment audit
- `/api/admin/stores` — store payment profiles
- `/api/admin/store/customization` — store customization
- `/api/admin/store/settings` — store settings
- `/api/admin/...store applications...` — store application review

### 5.3 Storefront/Public API Related

- `/api/products` and `/api/products/:slug` — public product read model/activity route
- `/api/store` — store/microsite/public store surfaces
- `/api/store/coupons` — coupon quote/validate
- `/api/checkout` — checkout generation
- `/api/orders` — buyer order tracking/read model
- `/api/user/store-applications` — user store application flow

---

## 6. Data / Entity Map

| Entity | Admin | Seller | Storefront | Sync Notes |
|---|---|---|---|---|
| Store Application | Review/approve/reject | User applies; Seller starts after approval/access | Not public until store active | Admin source of truth. |
| Store Profile | Core governance, active status | Editable allowed profile fields | Public identity via slug/microsite | Need shared `storeProfileGovernance` and public identity contract. |
| Store Member / Role | Governance/backfill possible | Owner/member operations | N/A | Permission map must remain backend enforced. |
| Product | Review, approval, publish | Draft, edit, submit review, revision | Only published/visible products | Admin publish gate is final authority. |
| Product Attribute/Category | Admin master/category governance | Seller scoped product attributes/categories | Product display/checkout variants | Avoid duplicate product metadata contracts. |
| Order | Parent order truth | Suborder operations per store | Buyer checkout/order tracking | Order lifecycle truth table must be respected. |
| Suborder | Admin aggregate/read model | Seller fulfillment/payment lane | Derived from checkout | Seller must not mutate parent order outside allowed lifecycle. |
| Payment Proof / Payment Status | Audit/final authority | Seller payment review lane | Buyer payment submission/status | Admin audit remains authoritative. |
| Payment Profile | Review/activate | Request/draft/submit revision | Checkout readiness/payment method availability | Do not expose activation authority to seller. |
| Coupon | Platform/admin coupon governance | Store/seller coupon baseline | Quote/validate/apply | Attribution must be verified Admin-Seller-Storefront. |
| Notification | Admin/user/seller event sources | Seller notification drawer | Buyer notification pages | Ensure action route meta points to canonical routes. |

---

## 7. Feature Status Matrix

| Feature | Status | Evidence Path | Next Action |
|---|---|---|---|
| Seller workspace shell/sidebar/header | READY / EXISTING | `client/src/layouts/SellerLayout.jsx` | Keep; only sync nav/permission copy. |
| Seller overview/dashboard | EXISTING / NEEDS_SYNC | `SellerWorkspaceHome.jsx`, `seller.workspace.ts` | Verify cards use live data only or controlled fallback. |
| Store profile edit | EXISTING | `SellerStoreProfilePage.jsx`, `seller.storeProfile.ts` | Map editable/read-only fields to Admin/Storefront. |
| Product draft/authoring | EXISTING | `SellerProductAuthoringPage.jsx`, `seller.products.ts` | Keep canonical; map legacy authoring/report usage. |
| Product submit review | EXISTING / READY after verification | `sellerProducts.ts`, `admin.products.ts` | Verify seller submitted → admin approve/revision → storefront visible. |
| Seller order ops | EXISTING | `seller.orders.ts`, `SellerOrdersPage.jsx` | Verify suborder ownership smoke. |
| Payment profile request | EXISTING / NEEDS_SYNC | `seller.paymentProfiles.ts`, `admin.storePaymentProfiles.ts` | Align status vocabulary and readiness card. |
| Payment review | EXISTING | `seller.payments.ts`, `admin.payments.audit.ts` | Confirm boundaries seller review vs admin audit. |
| Coupons | EXISTING / NEEDS_SYNC | `seller.coupons.ts`, `store.coupons.ts`, `admin.coupons.ts` | Verify attribution and conflict rules. |
| Team/permission | EXISTING | `seller.team.ts`, seller services | Keep backend permission enforcement. |
| Storefront identity sync | PARTIAL / NEEDS_SYNC | `store.ts`, publicStoreIdentity contract | Verify slug/logo/banner/status propagation. |
| Analytics | PARTIAL | `sellerWorkspaceAnalytics.ts` | Define exact metric source and known limitations. |

---

## 8. Duplicate Detection Matrix

### Duplicate Feature Candidate: Seller Product Routes / Legacy Catalog Routes

Status: `DUPLICATE / DEPRECATED_CANDIDATE`

Lokasi:
- `client/src/App.jsx` legacy redirects: `/catalog`, `/catalog/new`, `/catalog/:productId`, `/coupons`
- `client/src/utils/sellerWorkspaceRoute.js` canonical builders: `/catalog/products`, `/catalog/products/new`, `/catalog/products/:productId`, `/catalog/coupons`

Fungsi Saat Ini:
- Legacy routes menjaga kompatibilitas link lama.
- Canonical routes dipakai Seller Workspace baru.

Risiko:
- Menghapus legacy route dapat mematahkan report/smoke/link notifikasi lama.
- Membiarkan tanpa map dapat membuat dua URL untuk fitur sama.

Keputusan Sementara:
- Jangan hapus.
- Tandai legacy sebagai `DEPRECATED_CANDIDATE`.
- Semua CTA baru wajib memakai `createSellerWorkspaceRoutes`.

Rencana Sinkronisasi:
1. Audit semua `to=`, `navigate`, notification meta, report smoke yang mengarah ke legacy.
2. Pastikan redirect 301/SPA Navigate stabil.
3. Setelah aman, minta persetujuan sebelum penghapusan.

### Duplicate Feature Candidate: Admin Product Controller Legacy vs `admin.products.ts`

Status: `DUPLICATE / NEEDS_SYNC`

Lokasi:
- `server/src/controllers/adminProductController.ts`
- `server/src/routes/admin.products.ts`
- `server/src/routes/adminProductRoutes.ts`

Fungsi Saat Ini:
- Controller legacy memiliki komentar `/api/v1/admin/products`.
- `admin.products.ts` terlihat menjadi route aktif mounted `/api/admin/products` dan berisi review/publish gate modern.

Risiko:
- Salah memilih route bisa memodifikasi jalur mati atau membuat logic berbeda.

Keputusan Sementara:
- Canonical sementara: `server/src/routes/admin.products.ts` karena mounted di `server/src/app.ts`.
- Jangan hapus controller legacy sampai audit import/mount penuh.

Rencana Sinkronisasi:
1. `rg "adminProductController|adminProductRoutes|/api/v1/admin/products"`.
2. Tandai legacy yang tidak mounted sebagai `DEPRECATED_CANDIDATE`.
3. Pastikan Admin UI hanya memakai API canonical.

### Duplicate Feature Candidate: Payment Profile APIs

Status: `DUPLICATE / NEEDS_SYNC`

Lokasi:
- `server/src/routes/seller.paymentProfiles.ts`
- `server/src/routes/stores.ts` (`/:storeId/payment-profile`)
- `server/src/routes/admin.storePaymentProfiles.ts`
- `server/src/services/storePaymentProfileCompat.ts`
- `server/src/services/sharedContracts/storePaymentProfileCompat.ts`

Fungsi Saat Ini:
- Seller route untuk request/self-service.
- Store route lama untuk payment profile.
- Admin route untuk review/activation.
- Compat services menjaga state/shape lintas aplikasi.

Risiko:
- Status vocabulary payment bisa divergen.
- Storefront checkout readiness bisa membaca field berbeda.

Keputusan Sementara:
- Canonical seller self-service: `/api/seller/stores/:storeId/payment-profile`.
- Canonical admin review: `/api/admin/stores/...payment-profile...`.
- Legacy `/api/stores/:storeId/payment-profile` perlu audit pemakaian.

Rencana Sinkronisasi:
1. Audit client API dan checkout readiness yang memakai payment profile.
2. Tetapkan field status tunggal: draft/submitted/needs_revision/approved/active/rejected bila sesuai existing.
3. Update `system_map.md`, bukan hapus route.

### Duplicate Feature Candidate: Coupon Admin/Seller/Storefront Boundary

Status: `NEEDS_SYNC`

Lokasi:
- `server/src/routes/admin.coupons.ts`
- `server/src/routes/seller.coupons.ts`
- `server/src/routes/store.coupons.ts`
- `server/src/services/coupon.service.ts`
- `server/src/services/couponGovernance.ts`

Fungsi Saat Ini:
- Admin coupon governance.
- Seller store-scoped coupon baseline.
- Storefront quote/validate/apply.

Risiko:
- Attribution order/store bisa salah jika scope tidak tegas.
- Seller coupon dapat bentrok dengan platform coupon.

Keputusan Sementara:
- Jangan gabungkan route secara fisik.
- Gabungkan contract/terminologi governance dan attribution.

Rencana Sinkronisasi:
1. Audit `coupon-sync` dan `SELLER-MVF-08/09` report.
2. Tulis truth table coupon scope/platform/store.
3. Smoke checkout coupon attribution.

### Duplicate Feature Candidate: Public Product Read Models

Status: `NEEDS_SYNC / BUG_RISK`

Lokasi:
- `server/src/routes/public.ts` (`/api/products`)
- `server/src/routes/store.ts` store/microsite product routes
- `server/src/routes/products.activity.ts`
- `server/src/services/productVisibility.ts`

Fungsi Saat Ini:
- Public API dan store/microsite membaca product visibility.
- Product activity route mounted under `/api/products`.

Risiko:
- Produk approved Admin bisa tampil di satu storefront tetapi hilang di microsite.
- Product slug/id route bisa beda visibility rule.

Keputusan Sementara:
- Canonical visibility rule harus dari `productVisibility.ts`.
- Jangan tambah filter baru di UI tanpa sinkron backend.

Rencana Sinkronisasi:
1. Audit semua public product query.
2. Pastikan filter published/active/store active sama.
3. Jalankan smoke storefront product visibility.

---

## 9. Sync Gap Matrix

| Gap | Status | Dampak | Langkah Aman |
|---|---|---|---|
| `system_map.md` belum ada | NEEDS_SYNC | Tidak ada peta source of truth hidup | Buat dokumen ini di root dan update tiap task. |
| Seller dashboard live vs fallback | BUG_RISK | Dashboard bisa menampilkan data tidak sesuai backend | Audit `SellerWorkspaceHome.jsx` dan `sellerWorkspace.ts`. |
| Store slug vs storeId transition | NEEDS_SYNC | Link lama bisa patah atau salah store | Pertahankan slug canonical + redirect storeId/legacy. |
| Product approval → publish → storefront | NEEDS_SYNC | Produk seller tidak konsisten antar Admin/Seller/Storefront | End-to-end smoke draft→submit→approve/publish→visible. |
| Payment profile readiness | NEEDS_SYNC | Checkout readiness tidak selaras dengan Admin review | Align state via shared compat services. |
| Coupon attribution | NEEDS_SYNC | Diskon/order attribution salah | Truth table + checkout smoke. |
| Order lifecycle parent/suborder | BUG_RISK | Seller bisa memutasi state yang seharusnya Admin/system-owned | Gunakan existing order lifecycle contract services. |

---

## 10. Risk and Guardrail

1. **Tidak membuat fitur baru sebelum audit pemakaian fitur existing.**
2. **Tidak menghapus duplicate langsung.** Tandai dulu sebagai `DEPRECATED_CANDIDATE`.
3. **Seller tidak mengambil otoritas Admin** untuk approval produk, publish gate, payment activation, dan governance store.
4. **Semua route baru/CTA seller wajib memakai `createSellerWorkspaceRoutes`.**
5. **Semua mutasi seller wajib berbasis store access + permission backend**, bukan hanya UI disabled state.
6. **Public storefront hanya membaca produk/toko yang approved, published, visible, dan store aktif.**
7. **Setiap task wajib update `system_map.md` dan report di `reports/`.**
8. **Setiap perubahan UI route wajib smoke Admin/Seller/Storefront, cek console error, dan horizontal overflow.**

---

## 11. Next Task Queue

1. `SYS-MAP-SELLER-FOUNDATION-01` — Buat `system_map.md` root dari draft ini dan tambahkan bukti file/route final.
2. `SELLER-ROUTE-CANONICAL-AUDIT-02` — Audit semua link seller legacy vs canonical; tidak hapus.
3. `SELLER-DASHBOARD-LIVE-SYNC-03` — Validasi dashboard overview memakai API live dan controlled fallback.
4. `PRODUCT-REVIEW-STOREFRONT-E2E-04` — Smoke flow seller draft → submit review → admin revision/approve/publish → storefront visible.
5. `PAYMENT-PROFILE-STATE-SYNC-05` — Selaraskan status payment setup Seller/Admin/Checkout readiness.
6. `COUPON-ATTRIBUTION-SYNC-06` — Peta coupon Admin/Seller/Storefront dan order attribution.
7. `STORE-IDENTITY-SYNC-07` — Audit store profile Seller/Admin/Public microsite identity.
8. `ORDER-SUBORDER-LIFECYCLE-SYNC-08` — Verifikasi parent order vs seller suborder operational truth.

---

## 12. Definition of Done untuk Fondasi Ini

- `system_map.md` ada di root repo.
- Semua route canonical Seller/Admin/Storefront tercatat.
- Semua duplicate candidate tercatat dengan lokasi, risiko, keputusan sementara, dan rencana sync.
- Semua fitur Seller Workspace punya status: `EXISTING`, `PARTIAL`, `DUPLICATE`, `NEEDS_SYNC`, `BUG_RISK`, `READY`, `DEPRECATED_CANDIDATE`, atau `DO_NOT_TOUCH`.
- Minimal satu report dibuat di `reports/` untuk setiap task implementasi.
- Validasi minimal: build client dan smoke route sesuai cakupan perubahan.
