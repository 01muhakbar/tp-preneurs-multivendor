# SELLER-WORKSPACE-2026-PROD-HARDEN-TEAM-23 Report

## Tujuan
- Harden Team 2026 permission dan member guardrail sebelum production adoption.

## File Dibaca
- `system_map.md`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026TeamAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Team.js`
- `client/src/pages/seller2026/Seller2026TeamPreviewPage.jsx`

## File Ditambahkan
- (Tidak ada file baru ditambahkan selain report)

## File Diubah
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Team.js`
- `client/src/pages/seller2026/Seller2026TeamPreviewPage.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `system_map.md`

## API Audit
Team Members / Summary:
- Endpoints data mapping terkonfirmasi di adapter. Pemanggilan menggunakan `getSellerTeamSummary`.

Roles / Permissions:
- Role codes dilampirkan dari summary. Namun permission detail array di inference karena keterbatasan read endpoint murni UI pada live API.

Audit Logs:
- Data endpoint `getSellerTeamAudit` tersedia, dan mapping audit log timeline telah diset read-only dan dilimit jumlah fetch-nya untuk security dan performance.

Invite / Update / Deactivate:
- Mutasi members tersedia di API tetapi di-disable dari UI untuk keamanan. 

## Data Mapping
Members:
- Owner diperlakukan khusus menggunakan rule dari flag backend `member.governance?.isOwner`.

Roles:
- Status Role members dilindungi dalam standardisasi code mapper. Mapping menjadi: Owner, Admin, Staff, Support, Finance, Fulfillment, Custom, atau Unknown.

Permission Matrix:
- Menggunakan fallback dan status `inferred` (Inferred Matrix) untuk UI read-only purposes. 

Audit Logs:
- Mapping dari `action` dan `description` dikonversi menjadi severity format yang aman dengan actor identity mapping.

Allowed Actions:
- Dibaca langsung dari kapabilitas governance response `member.governance`.

## Permission Guardrail
Backend enforcement:
- Explicit disclaimer ditambahkan pada header list members: "Permissions shown here are informational. Backend permissions remain the final enforcement layer."

UI matrix:
- Matriks ditampilkan secara safe mode (inferred).

Owner/current user:
- UI dan state tidak memberikan kapabilitas manipulasi current user owner (disabled bypass update/deactivate).

Audit log:
- Sepenuhnya read-only, dan timeline hanya merender event tanpa aksi rollback click atau destructive click apa pun.

## Mutation Hardening
Invite:
- State internal diputus. Button disabled dan hook me-return error: "Team mutations will be connected after permission workflow validation."

Create Role:
- Sama seperti Invite, state disabled dengan error explicitly blocked.

Update Role:
- Button update role disabled dan tidak merespons update logic.

Deactivate / Remove:
- Destructive call di-prevent dan akan mengeluarkan alert state: "Member access changes require backend permission validation and confirmation."

Confirmation:
- UI dan state telah di-guard secara pasif sehingga tidak akan secara sengaja mengeksekusi fetch/PATCH payload sebelum confirmation UI logic ditambahkan nanti.

## Feature Flag Prepared
- `VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED`
- default: `false`
- route wired: no (Tidak diimplementasikan ke production routes di App.jsx pada task ini)

## Guardrail Verification
Fallback:
- Hook data fallback sepenuhnya meng-inherit flag safe-mode mutations. 

Backend permissions:
- UI flag memberikan peringatan eksplisit.

Owner/current user:
- Role manipulation buttons dinonaktifkan sepenuhnya. 

Destructive actions:
- State actions `updateMemberRole`, `inviteMember`, dan `deactivateMember` men-trigger soft-error internal sebagai placeholder.

Audit:
- Read model.

## Validasi

Build:
- `pnpm.cmd --filter client exec vite build`
- result: `✓ built in 21.61s`

Smoke:
- preview team: Menampilkan "Preview fallback data" yang sukses me-load dummy payload, action buttons terkonfirmasi "disabled" dengan safe error alert.
- production coupons: Rute flag tidak bocor ke komponen lain.
- production orders: Legacy (atau mode live yang diadopsi) tetap berjalan normal.
- production store profile: Tetap normal.
- production catalog: Tetap normal.
- production add product: Tetap normal.
- production product detail: Tetap normal.

Console error:
- Runtime clear tanpa warning invalid prop unmount.

Horizontal overflow:
- Tabel team list dan permission matrix dibungkus container `overflowX: 'auto'` mencegah clipping pada resolusi minim.

English UI:
- "Security Note", "Permissions shown here...", "Inferred Matrix".

Production safety check:
- command: `git diff -- client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: Zero diff (bersih). Rute production team legacy sama sekali tidak diubah.

## Rollback Plan
- Production Team route remains legacy.
- No rollback needed.
- Keep feature flag off.

## Risiko Tersisa
- Semua mutasi masih disabled karena role authorization confirmation matrix belum bisa dipercaya sepenuhnya di UI level. Ini adalah tindakan mitigasi pencegahan resiko.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-ADOPT-TEAM-24`
