# SELLER-WORKSPACE-2026-PAYMENT-CENTER-LIVE-07 Report

Tanggal: 2026-06-06
Branch/Commit jika ada:

## Tujuan
- Menghubungkan preview Payment Center 2026 ke API existing secara aman.

## File Dibaca
- `client/src/api/sellerPayments.ts`
- `client/src/api/sellerPaymentProfile.ts`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/pages/seller2026/Seller2026Pages.jsx`
- `system_map.md`

## File Ditambahkan
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026PaymentCenterAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026PaymentCenter.js`
- `client/src/pages/seller2026/Seller2026PaymentCenterPreviewPage.jsx`

## File Diubah
- `client/src/features/sellerWorkspace2026/utils/sellerWorkspace2026Fallbacks.js`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/pages/seller2026/Seller2026Pages.jsx`
- `system_map.md`

## Adapter / Hook Baru
- `sellerWorkspace2026PaymentCenterAdapter.js`: Menggabungkan respons `getSellerPaymentReviewSuborders` dan `getSellerPaymentProfile` menjadi model view preview sederhana.
- `useSellerWorkspace2026PaymentCenter.js`: Menghandle status React, loading, dan action.

## API Existing yang Digunakan
Store Context:
- `getSellerStoreProfile`

Payment Review:
- `getSellerPaymentReviewSuborders(storeId, 'pending')`
- `reviewSellerStorePayment(storeId, paymentId, payload)`

Payment Profile:
- `getSellerPaymentProfile`

Payout / Bank / Documents:
- Diambil dari `getSellerPaymentProfile`

## Data Mapping
Payment Review:
- Items di-map dari `items[].payment` dan fallback ke item suborder untuk id dan order reference.
- `allowedActions` di-map dari `payment.reviewActionability.canReview`.

Payment Profile:
- Diambil dari field `activeSnapshot` dan `readModel` di response profile.

Summary:
- Dihitung dari list review (hanya yang pending), sisanya mock atau static untuk layout.

Governance:
- `adminAuditFinal` hardcoded true.
- `sellerCanApprovePayment` dan `sellerCanRejectPayment` diaktifkan di UI hanya saat `allowedActions` mencakup action tersebut.
- `sellerCanActivateProfile` selalu false untuk menegakkan role Admin.

## Status Mapping
Payment Review:
- pending / submitted -> Pending Review
- verified / approved / paid -> Verified
- rejected -> Rejected
- needs_check / recheck -> Needs Recheck
- cancelled -> Cancelled

Payment Profile:
- draft -> Draft
- submitted / in_review -> In Review
- needs_revision -> Needs Revision
- approved -> Approved
- active -> Active
- rejected -> Rejected
- inactive -> Inactive

## Payment Governance Guardrail
Approve Payment:
- Tombol dimatikan jika endpoint `canReview` mengembalikan false atau data berjalan di mode fallback.
- Hanya meluluskan review level seller.

Reject Payment:
- Tombol dimatikan jika endpoint `canReview` mengembalikan false atau data berjalan di mode fallback.

Request Recheck:
- Disabled. Action tidak diimplementasi secara UI.

Submit / Update Payment Profile:
- Disabled. Akan diteruskan ke halaman form terpisah di future sprint/task.

Activate Payment Profile:
- Disabled (bawaan guardrail, Admin final authority).

## Fallback Behavior
- Jika live API gagal (network atau endpoint tidak ada), menggunakan object fallback statis dengan meta `usingLiveData: false`.
- Di mode fallback, semua tombol payment action dinonaktifkan dengan pesan helper bahwa aksi memerlukan live permission.

## UI Behavior
- Loading: "Loading reviews..." di tabel.
- Error: Error text di kontainer merah (hanya jika gagal tanpa fallback).
- Empty: "No pending reviews" di tabel jika tidak ada data dari backend.
- Fallback badge: "Preview Data / Live API Unavailable".
- Disabled states: Tombol approve/reject redup jika sedang memproses.

## Validasi
Build:
- `✓ built in 18.86s`

Smoke:
- `/seller-2026-preview/akbar-cahaya-studio/payment-center`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio/orders`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio/catalog/products`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio/store-profile`: Lolos

Console error:
- Tidak ada.

Horizontal overflow:
- Tidak ada. Tabel memakai width auto/collapse standar.

English UI check:
- command: `rg "(Ringkasan|minggu lalu|Selesai|Profil|...)" client/src/features/sellerWorkspace2026 ...`
- hasil: Hanya mengenai data mock/fallback atau comment. UI components (Seller2026PaymentCenterPreviewPage) clean dari bahasa Indonesia.

Production safety check:
- command: `git diff -- client/src/App.jsx client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- hasil: Zero diff

## Sinkronisasi 3 Aplikasi

Admin:
- Admin/payment audit remains final authority.
- Payment profile activation is not delegated to Seller.

Seller:
- Payment Center preview reads payment review/profile data if available.
- Seller actions are guarded and disabled unless safe.

Storefront:
- Checkout/payment flow is not changed.
- Public/payment behavior is not changed.

## Duplicate / Merge Notes
- Existing Seller Payment Review page tidak dihapus.
- Existing Seller Payment Profile page tidak dihapus.
- Route legacy tidak dihapus.
- Backend tidak diubah.

## Risiko Tersisa
- Tombol action Profile (Update Profile) di-disable secara hardcode karena form belum di-develop.
- Summary numbers (Verified, Rejected) untuk Preview di-hardcode 0 karena endpoint `getSellerPaymentReviewSuborders` dipanggil dengan parameter statis `"pending"`. Ini dapat di-fix dengan query terpisah nantinya.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-COUPONS-LIVE-08`
