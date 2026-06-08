# SELLER-WORKSPACE-2026-PROD-ADOPT-PAYMENT-CENTER-26 Report

## Tujuan
- Mengadopsi Payment Center 2026 ke production payment routes secara feature-flagged, read-only first, dan reversible.

## File Dibaca
- `system_map.md`
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller2026/Seller2026PaymentCenterPreviewPage.jsx`

## File Ditambahkan
- (Tidak ada file baru ditambahkan selain report ini)

## File Diubah
- `client/src/App.jsx`
- `system_map.md`

## Feature Flag
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED`
- default behavior: Memanggil `Seller2026LivePaymentReviewPage` dan `Seller2026LivePaymentProfilePage` di route existing.
- flag on behavior: Memanggil `Seller2026PaymentCenterPreviewPage` dengan prop `productionMode` untuk route payment-review dan payment-profile.
- flag off behavior: Fallback aman kembali ke legacy route.

## Route Mapping
Production:
- `/seller/stores/:storeSlug/payment-review` -> `<Seller2026PaymentCenterPreviewPage productionMode initialTab="reviews" />`
- `/seller/stores/:storeSlug/payment-profile` -> `<Seller2026PaymentCenterPreviewPage productionMode initialTab="profile" />`

Preview:
- `/seller-2026-preview/:storeSlug/payment-center` -> Tidak diubah, tetap merender full fitur 2026.

Legacy rollback:
- payment-review: Kembali ke `Seller2026LivePaymentReviewPage`
- payment-profile: Kembali ke `Seller2026LivePaymentProfilePage`

## Production Mode Changes
- Payment Center UI dimodifikasi untuk menyesuaikan flag `productionMode`. Teks "Live payment data is unavailable. Showing fallback data." akan aktif saat network fetch failed.

## Guardrail Verification
Payment actions:
- Fungsi `approvePayment` dan `rejectPayment` serta `requestRecheck` tetap disable.

Payout profile activation:
- Teks info "Seller cannot self-activate payout profile." terpasang dan action disabled.

Settlement/payout:
- Informasi balance hanya dirender read-only tanpa input mutation UI yang terekspos.

Admin authority:
- Header message "Admin audit is the final authority for payment settlement and profile verification" berhasil dirender di UI.

## Validasi

Build:
- `pnpm.cmd --filter client exec vite build`
- result: `✓ built in 15.16s`

Smoke flag off:
- production payment-review: Merender legacy LivePaymentReview.
- production payment-profile: Merender legacy LivePaymentProfile.
- preview payment-center: Tetap 2026 Preview.
- production team: legacy/live route aman
- production coupons: legacy/live route aman
- production orders: legacy/live route aman
- production store profile: legacy/live route aman
- production catalog: legacy/live route aman
- production add product: legacy/live route aman
- production product detail: legacy/live route aman

Smoke flag on:
- production payment-review: Berhasil merender UI Payment Center 2026.
- production payment-profile: Berhasil merender UI Payment Center 2026.
- preview payment-center: Aman.
- production team: legacy/live route aman
- production coupons: legacy/live route aman
- production orders: legacy/live route aman
- production store profile: legacy/live route aman
- production catalog: legacy/live route aman
- production add product: legacy/live route aman
- production product detail: legacy/live route aman

Console error:
- Bebas error dan safe memory leak dari effect hooks.

Horizontal overflow:
- Tabel dirender proporsional dengan constraint width max container menggunakan overflow-x hidden/auto.

English UI:
- Berbahasa inggris.

Production safety check:
- command: `git diff -- client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: (kosong) menandakan zero diff/tidak ada backend original code yang terekspos mutation risk.

## Rollback Plan
- Set `VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED=false`
- Restart/rebuild client
- Production payment routes return to legacy payment pages
- Preview route remains available
- No backend rollback required

## Risiko Tersisa
- Seluruh mutasi masih di-disable dan dikontrol di sisi backend / legacy form. Integrasi full mutation memerlukan flow form confirmation yang di validasi pada tahapan hardening terpisah.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-HARDEN-ANALYTICS-SYNC-27`
