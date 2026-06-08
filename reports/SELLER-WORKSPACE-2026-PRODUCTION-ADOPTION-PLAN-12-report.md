# SELLER-WORKSPACE-2026-PRODUCTION-ADOPTION-PLAN-12 Report

## Tujuan
- Membuat production adoption plan route-by-route untuk Seller Workspace 2026 secara aman, bertahap, dan reversible.

## File Dibaca
- `system_map.md`
- `client/src/App.jsx`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/pages/seller2026/*`
- `client/src/features/sellerWorkspace2026/*`

## File Diubah
- `system_map.md`
- `reports/SELLER-WORKSPACE-2026-PRODUCTION-ADOPTION-PLAN-12-report.md` (dokumen ini)
*(Catatan: Tidak ada production route atau backend API yang diubah pada task ini).*

## Current Preview Status
- Seluruh route `/seller-2026-preview/*` sudah fully wired dengan Live API data.
- UI pada preview routes telah di-polish ke 100% desain 2026 (`PREVIEW_UI_POLISHED`).
- Seluruh mutasi telah ditest (sebagian disabled untuk aman).
- Preview terisolasi penuh dari canonical routes.

## Production Adoption Readiness Matrix

| Area | Preview Route | Production Route Candidate | Readiness | Reason | Required Hardening | Rollback |
|---|---|---|---|---|---|---|
| Overview | `/seller-2026-preview/:storeSlug` | `/seller/stores/:storeSlug` (dan `/dashboard`) | NEEDS_HARDENING | Dashboard masih menunjukkan fallback di edge case (tergantung load analytics summary backend). | Pastikan load fallback tidak menutupi chart data. Tambahkan error boundary khusus. | Revert flag ke `Seller2026LiveDashboardPage` lawas. |
| Store Profile | `/store-profile` | `/seller/stores/:storeSlug/store-profile` | NEEDS_HARDENING | Mutation save profile belum dilimpahkan sepenuhnya dari admin-side/account-side. | Wire safe save/update profile endpoint dari Seller Workspace. Jaga storefront visibility. | Revert flag ke `Seller2026LiveStorefrontPage` lawas. |
| Product Catalog | `/catalog/products` | `/seller/stores/:storeSlug/catalog/products` | READY_FOR_PRODUCTION_ADOPTION | List produk sudah full API connect dan read-only actions berjalan sempurna. Filter API sinkron. | Tidak ada. Sudah aman untuk read-only swap. | Revert flag ke `Seller2026LiveProductsPage` lawas. |
| Product Authoring | `/catalog/products/new` | `/seller/stores/:storeSlug/catalog/products/new` | NEEDS_HARDENING | Pembuatan produk baru dengan relasi draft/submit review memiliki workflow validation ketat. | Hardening save draft dan submit review flow. Pastikan returned ID valid. | Revert flag ke `Seller2026LiveProductEditorPage mode=create`. |
| Product Review Detail | `/catalog/products/:productId` | `/seller/stores/:storeSlug/catalog/products/:productId` | READY_FOR_PRODUCTION_ADOPTION | Halaman read-only berjalan baik dengan API. Timeline status review stabil. | Tetap disable mutation yang belum dikonfirmasi backend. | Revert flag ke `Seller2026LiveProductDetailPage` lawas. |
| Orders | `/orders` | `/seller/stores/:storeSlug/orders` | NEEDS_HARDENING | Operasi fulfillment memerlukan UX validasi tracking resi dan transition state yang aman. | Konfirmasi fulfillment lifecycle transitions (mark shipped/delivered) + form resi. | Revert flag ke `Seller2026LiveOrdersPage` lawas. |
| Payment Center | `/payment-center` | `/seller/stores/:storeSlug/payment-review` & `/payment-profile` | PREVIEW_ONLY | Aktivitas pembayaran (approve/reject/submit profile) adalah high-governance dari sisi admin/finance. | Belum disarankan diadopsi penuh sampai Admin integration clear untuk approval SLA. | Revert flag ke `Seller2026LivePaymentReviewPage`. |
| Coupons | `/coupons` | `/seller/stores/:storeSlug/catalog/coupons` | NEEDS_HARDENING | Promo attribution risk, actions edit/delete/archive membutuhkan backend check yang solid. | Konfirmasi validasi attribution dan action delete. | Revert flag ke `Seller2026LiveCouponsPage` lawas. |
| Team | `/team` | `/seller/stores/:storeSlug/team` | NEEDS_HARDENING | Peran/role management & invitation butuh permission matrix confirmation kuat. | Confirm roles matrix match backend, implement role switch blocker jika self. | Revert flag ke `Seller2026LiveTeamPage`. |
| Analytics Sync | `/analytics-sync` | Belum ada canonical route khusus, mungkin ke dashboard panel. | PREVIEW_ONLY | Sync action berbahaya jika tereksekusi massal, route canonical terpisah belum ada. | Penentuan route mapping dan disable write sync API. | Tidak ada (belum live). |

## Recommended Adoption Phases

### Phase 1 — Safe Read-only Adoption
- Target: **Product Catalog** & **Product Review Detail**.
- Strategi: Melakukan feature flag toggle (`VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED=true`).
- Rationale: Halaman ini memiliki endpoint API yang murni `GET` list produk. Risiko salah data/kerusakan data nol. Fallback UI sudah matang.

### Phase 2 — Controlled Mutation Adoption
- Target: **Product Authoring**, **Store Profile**, **Orders**, **Coupons**, **Team**.
- Strategi: Lakukan implementasi route swap per area dengan guardrails spesifik.
- Rationale: Ini membutuhkan UX form validation yang stabil dan penanganan state error (optimistic update dinonaktifkan). Mutasi akan digated.

### Phase 3 — Governance-sensitive Adoption
- Target: **Payment Center**, **Overview/Analytics (Dashboard)**.
- Strategi: Adopsi bersamaan dengan tim operasional admin dan peluncuran bertahap per-seller list.
- Rationale: Transaksi finansial, validasi pembayaran, dan agregasi data rawan terhadap beban dan inkonsistensi yang tidak dapat ditoleransi.

## Feature Flag Proposal

Gunakan environment variables/config runtime pada `client/src/App.jsx` atau context provider.

```javascript
// Proposal Flag Set
const FLAGS = {
  VITE_SELLER_WORKSPACE_2026_ENABLED: true, // Master Switch
  VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED: true, // Phase 1 candidate
  VITE_SELLER_WORKSPACE_2026_PRODUCT_DETAIL_ENABLED: true, // Phase 1 candidate
  VITE_SELLER_WORKSPACE_2026_AUTHORING_ENABLED: false,
  VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED: false,
  VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED: false,
  VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED: false,
  VITE_SELLER_WORKSPACE_2026_PROFILE_ENABLED: false,
}
```

## Rollback Plan
Setiap area akan mempertahankan komponen halaman lamanya. Jika terjadi insiden critical, cukup mengubah feature flag bersangkutan ke `false`.

1. Pertahankan import page existing (contoh: `Seller2026LiveProductsPage`).
2. Terapkan flag di router: `element={ FLAGS.VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED ? <Seller2026ProductCatalogPreviewPage /> : <Seller2026LiveProductsPage /> }`.
3. Re-deploy. Zero backend migration required.
4. Preview route tetap dibiarkan ada untuk keperluan testing dan internal debugging.

## QA Plan

Build:
- `pnpm.cmd --filter client exec vite build` harus selalu pass tanpa duplicate export error.

Preview smoke:
- Test secara manual semua `/seller-2026-preview/...` sebelum switch flag.

Production smoke candidate:
- Setelah flag diaktifkan di QA/Staging environment, periksa route canonical `/seller/stores/:storeSlug/catalog/products`. Pastikan API payload dikirim.

Regression checks:
- Admin product approval unchanged (Approval flow admin tetap sama).
- Storefront product visibility unchanged (Pencarian/tampilan depan pelanggan tidak bocor/berubah).
- Checkout unchanged (Item masuk keranjang berjalan sukses).
- Payment audit unchanged (Klaim pembayaran seller tidak terganggu).
- Team permissions enforced by backend (Simulasi login staff terbatas).

## Guardrail Verification

Admin authority:
- Pengesahan seller/toko dan approvement KYC mutlak berada di Admin (Backend enforcement). UI hanya merefleksikan status.

Product publish:
- Seller tidak diperbolehkan bypass review status. Tombol Publish akan tetap disabled / dialihkan ke Submit for Review.

Payment activation:
- Form Payment Setup seller di-submit sebagai request ke admin.

Coupon checkout validation:
- Pembuatan diskon tervalidasi via backend.

Team permission:
- UI hanya menyembunyikan aksi berdasarkan capabilities payload; backend HTTP 403 enforcement wajib ada.

Storefront visibility:
- Preview toko hanya visual; tidak mengubah `visibility` entity produk secara tak terduga.

## Production Safety Check
Command:
```bash
git diff -- client/src/App.jsx client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src
```
Result:
- Zero diff. Plan artifact ini murni text dan tidak membocorkan code baru ke core aplikasi.

## Risiko Tersisa
- Tidak semua endpoint mutation dari backend legacy sinkron sempurna secara field contract dengan UX form baru (seperti Coupons form parameters yang mungkin outdated). Phase 2 Hardening wajib menyelesaikan ini.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-ADOPT-CATALOG-13`
