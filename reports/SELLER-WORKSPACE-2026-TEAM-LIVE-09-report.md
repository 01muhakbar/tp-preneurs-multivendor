# SELLER-WORKSPACE-2026-TEAM-LIVE-09 Report

Tanggal: 2026-06-06
Branch/Commit jika ada:

## Tujuan
- Menghubungkan preview Team & Access 2026 ke API existing secara aman.

## File Dibaca
- `client/src/api/sellerTeam.ts`
- `client/src/api/sellerTeamAudit.ts`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/pages/seller2026/Seller2026Pages.jsx`
- `system_map.md`

## File Ditambahkan
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026TeamAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Team.js`
- `client/src/pages/seller2026/Seller2026TeamPreviewPage.jsx`

## File Diubah
- `client/src/features/sellerWorkspace2026/utils/sellerWorkspace2026Fallbacks.js`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/pages/seller2026/Seller2026Pages.jsx`
- `system_map.md`

## Adapter / Hook Baru
- `sellerWorkspace2026TeamAdapter.js`: Menggabungkan respons `getSellerTeamSummary` dan `getSellerTeamAudit` (jika user memiliki capability `canViewAudit`) menjadi view model Team & Access.
- `useSellerWorkspace2026Team.js`: Hook untuk me-load data dan mendefinisikan action state. Semua action (invite, role change, deactivate) dinonaktifkan (no-op) karena UX form validasi belum matang.

## API Existing yang Digunakan
Store Context:
- `getSellerStoreProfile`

Team Members:
- `getSellerTeamSummary(storeId)`

Roles / Permissions:
- `getSellerTeamSummary(storeId)` (bagian `roles` dan `currentAccess`)

Audit Logs:
- `getSellerTeamAudit(storeId, params)`

## Data Mapping
Member:
- Mapping didapat dari array `members`. `roleLabel` diambil dari `roleName` atau dimapping manual berdasarkan `roleCode`. 
- Jika `member.governance.isOwner`, label di-force menjadi `Owner`.

Role:
- Mapping dari array `roles`. Array of strings `permissionKeys` tidak langsung bisa di-plot ke matriks UI secara otomatis jika formatnya dinamis.

Permission Matrix:
- Menggunakan inferred/fallback matrix karena matrix spesifik 2026 (per module x role status Allowed/Limited/Denied) belum diserve sebagai endpoint terpisah. Ditandai dengan badge "Inferred Matrix".

Audit Log:
- Memanfaatkan array `items` dari `getSellerTeamAudit`. Meta action target, actorName, dan changeSummary diplot ke UI audit log list sederhana.

Summary:
- Dihitung dari object `summary` bawaan `getSellerTeamSummary`.

Governance:
- Memanfaatkan `teamData.currentAccess.capabilities` untuk menset capabilities level page seperti `canInviteMembers`, `canChangeRoles`, dll. 

## Status Mapping
- `ACTIVE` -> `Active`
- `INVITED` -> `Pending Invite`
- `DISABLED` -> `Inactive`
- `REMOVED` -> `Removed`
- Default fallback -> `Unknown`

## Permission Guardrail
Backend enforcement:
- Explicit governance note ditambahkan di atas layout UI: "Permissions shown here are informational. Backend permissions remain the final enforcement layer."

UI matrix:
- Tampil sebagai readonly data dan ditandai sebagai `Inferred Matrix` jika bersumber dari local fallback format UI.

Invite Member:
- Action dimatikan (disabled) via attr UI dan no-op via Hook function.

Update Role:
- Action dimatikan (disabled) karena form mutasi permission tidak boleh mengandalkan UI fallback.

Deactivate / Remove:
- Action dimatikan (disabled) dengan reason "Destructive mutation currently disabled".

Audit View:
- Boleh dilihat jika capability endpoint backend menyetujui (`canViewAudit`).

## Fallback Behavior
- Jika live endpoint gagal (termasuk jaringan putus), menggunakan data statis mock `getTeamFallback` dengan setting `meta.usingLiveData = false`.
- Badge "Preview Data / Live API Unavailable" akan muncul di header.

## UI Behavior
- Loading: Teks "Loading members..." dalam table cell.
- Error: Render block error warna merah di tengah layar dengan error.message.
- Empty: Teks "No members found" dalam table cell.
- Fallback badge: "Preview Data / Live API Unavailable" warna kuning.
- Disabled states: Tombol "Create Role", "Invite Member", "Update Role", "Deactivate Member" dirender opacity setengah atau background abu-abu, disertai kursor not-allowed dan title penjelasan.

## Validasi
Build:
- `✓ built in 16.12s`

Smoke:
- `/seller-2026-preview/akbar-cahaya-studio/team`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio/coupons`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio/payment-center`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio/orders`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio/store-profile`: Lolos

Console error:
- Tidak ada undefined exceptions yang terlempar.

Horizontal overflow:
- Terdapat x-overflow container di bagian tabel role dan tabel member untuk mengakomodasi layar kecil tanpa stretching root layout.

English UI check:
- command: `rg "(Ringkasan|minggu lalu|Selesai|Profil|...)" client/src/features/sellerWorkspace2026 ...`
- hasil: Semua text label di UI komponen Team sudah murni English. (Hanya menyentuh mock data/comment/console di file lain yang tak terekspose).

Production safety check:
- command: `git diff -- client/src/App.jsx client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- hasil: Zero diff

## Sinkronisasi 3 Aplikasi

Admin:
- Admin/global governance is not changed.

Seller:
- Team preview reads members/roles/audit if available.
- Team mutations are guarded and disabled unless permission-safe.

Storefront:
- Storefront access is not changed.
- Public behavior is not changed.

## Duplicate / Merge Notes
- Existing Seller Team page tidak dihapus.
- Existing Seller Team Audit page tidak dihapus.
- Existing Member Lifecycle page tidak dihapus.
- Route legacy tidak dihapus.
- Backend tidak diubah.

## Risiko Tersisa
- Tidak ada action mutasi team (invite/update role/deactivate) yang di-enable di preview route ini. Jika user harus memutasi team, mereka secara implicit diharuskan ke halaman legacy (production route) sampai workflow UI mutasi di versi preview 2026 ini disetujui aman dan dikembangkan sepenuhnya.
- Matriks Role Permission di UI hanya mock format (inferred) karena data real (array of permissionKeys) butuh mapping matrix lookup table tambahan.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-ANALYTICS-STOREFRONT-SYNC-LIVE-10`
