# SELLER-WORKSPACE-2026-PROD-HARDEN-PAYMENT-CENTER-25 Report

## Tujuan
- Harden Payment Center 2026 governance dan mutation guardrail sebelum production adoption.

## File Dibaca
- `system_map.md`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026PaymentCenterAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026PaymentCenter.js`
- `client/src/pages/seller2026/Seller2026PaymentCenterPreviewPage.jsx`

## File Ditambahkan
- (Tidak ada file baru ditambahkan selain report ini)

## File Diubah
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026PaymentCenter.js`
- `client/src/pages/seller2026/Seller2026PaymentCenterPreviewPage.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `system_map.md`

## API Audit
Payment Review List:
- Available via `getSellerPaymentReviewSuborders` dari `sellerPayments.ts`.

Payment Profile:
- Available via `getSellerPaymentProfile` dari `sellerPaymentProfile.ts`.

Review Payment Action:
- Mutation tersedia via `reviewSellerStorePayment` untuk "APPROVE" dan "REJECT" endpoint live.

Payout/Profile Activation:
- Endpoint internal mencegah seller merubah state menjadi active secara mandiri.

Settlement/Payout Mutation:
- Status payout sepenuhnya derived dan terproteksi. Admin backend merupakan final validation point.

## Data Mapping
Payment Reviews:
- Dimapping dalam list UI list. `amount`, `method`, dan `buyerName` berhasil di-parse melalui `mapReviewStatus`.

Payment Profile:
- Mapping dari `activeSnapshot` dan status `completeness` ke model readiness read-only UI.

Status:
- Review Status: Pending Review, Verified, Rejected, Needs Recheck, Cancelled, Unknown.
- Profile Status: Draft, In Review, Needs Revision, Approved, Active, Rejected, Inactive, Unknown.

Allowed Actions:
- `canReview` dipetakan ke dalam array command `["APPROVE", "REJECT"]`. 

## Payment Governance Guardrail
Admin audit authority:
- Admin memiliki otoritas penuh. UI menampilkan static notification: "Governance Note: Admin audit is the final authority for payment settlement and profile verification."

Seller payment actions:
- Seller API call disabled di hook.

Payout profile activation:
- Ditahan. UI menampilkan: "Seller cannot self-activate payout profile."

Settlement/payout:
- Protected. Tidak ada input control UI yang dirender untuk memutasi balance settlement.

## Mutation Hardening
Approve:
- Hook internal function untuk approve telah direplace membalikkan error string (blocker): "Payment actions require live payment review permissions and active endpoints." untuk mencegah approval by UI bug.

Reject:
- Logic sama dengan Approve, aksi block dengan message string.

Request Recheck:
- Disabled secara eksplisit di return type hooks dengan stub func.

Update Profile:
- Tombol HTML attr disabled aktif dengan helper notice: "Payment profile editing will be connected after status workflow validation."

Activate Profile:
- Tombol dinonaktifkan di UI. Backend/Admin flow required.

Bank/Payout mutation:
- Tidak dirender sebagai form input fields melainkan teks label fallback dan live render strings.

Confirmation:
- Tidak dapat mencapai confirmation popup atau backend request dikarenakan action function ditutup state block returner langsung.

## Feature Flag Prepared
- `VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED`
- default: `false`
- route wired: no (Tidak diadopsi pada route App.jsx pada task ini)

## Guardrail Verification
Fallback:
- Pilihan `productionMode` kini didukung komponen `Seller2026PaymentCenterPreviewPage`. Message prop "Live payment data is unavailable. Showing fallback data." akan aktif ketika production data gagal termuat.

Allowed actions:
- Diperiksa sebelum array string aksi dirender ke dalam format UI buttons.

Admin/payment authority:
- Header label konfirmasi telah dirender dan menahan logic fallback UI.

Seller self-activation:
- Fitur tidak terekspos ke component buttons.

Settlement/payout mutation:
- Mutation buttons dan fields tidak ada.

## Validasi

Build:
- `pnpm.cmd --filter client exec vite build`
- result: `✓ built in 19.89s`

Smoke:
- preview payment center: Review dan detail order list termuat secara dummy dalam fallback mode, button reject dan approve mendisplay internal error text ketika ditekan untuk mencegah network calls destruct. Update button tersimpan dalam HTML state disable.
- production team: legacy / safe live page (Berdasar flag di task 24)
- production coupons: legacy / safe live page 
- production orders: legacy / safe live page
- production store profile: legacy / safe live page
- production catalog: legacy / safe live page
- production add product: legacy / safe live page
- production product detail: legacy / safe live page

Console error:
- Bebas dari error logic / mounting.

Horizontal overflow:
- Tabel payment list UI scroll bar wrap ditambahkan dalam flex layout original 2026.

English UI:
- Bebas dari text non-english (tervalidasi "Unknown", "Needs Recheck", "Review Details").

Production safety check:
- command: `git diff -- client/src/App.jsx client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: Zero diff (No changes, pristine condition).

## Rollback Plan
- Production Payment routes remain legacy.
- No rollback needed.
- Keep feature flag off.

## Risiko Tersisa
- Seluruh mutation state dimatikan. Aksi Approval dan Rejection harus melalui Seller admin page legacy sampai approval API workflow disetujui / validation confirmation popup dibentuk pada tahapan berikutnya.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-ADOPT-PAYMENT-CENTER-26`
