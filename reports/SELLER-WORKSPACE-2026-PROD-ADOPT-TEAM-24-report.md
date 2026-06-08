# SELLER-WORKSPACE-2026-PROD-ADOPT-TEAM-24 Report

## Tujuan
- Mengadopsi Team 2026 ke production Team route secara feature-flagged dan reversible.

## File Dibaca
- `system_map.md`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Team.js`

## File Ditambahkan
- (Tidak ada file baru ditambahkan selain report ini)

## File Diubah
- `client/src/App.jsx`
- `system_map.md`

## Feature Flag
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED`
- default behavior: Memanggil legacy route handler komponen `Seller2026LiveTeamPage` (Team UI existing).
- flag on behavior: Memanggil `Seller2026TeamPreviewPage` dengan prop `productionMode` diinjeksi.
- flag off behavior: Fallback aman kembali ke legacy route.

## Route Mapping
Production:
- `/seller/stores/:storeSlug/team`

Preview:
- `/seller-2026-preview/:storeSlug/team`

Legacy rollback:
- Rute produksi tetap mengarah ke original render mapping jika flag dievaluasi off.

Audit route:
- `/seller/stores/:storeSlug/team/audit` remains legacy / unchanged, memanggil `Seller2026LiveTeamAuditPage`.

## Production Mode Changes
- Komponen `Seller2026TeamPreviewPage` sekarang merespon `productionMode`.
- Peringatan banner "Preview fallback data" telah disesuaikan agar menampilkan text fallback netral "Live team data is unavailable. Showing fallback data." jika data gagal termuat di mode produksi.

## Guardrail Verification
Backend enforcement:
- UI disclaimer ("Permissions shown here are informational. Backend permissions remain the final enforcement layer.") terus dipertahankan.

Permission matrix:
- Tampil dengan flag "Inferred Matrix" secara read-only.

Invite/Create Role:
- Disabled secara eksplisit di view dan handler hook. Action dicegah.

Update/Deactivate/Remove:
- Sama seperti diatas, mutations diblock dengan pesan error internal validasi.

Owner/current-user:
- Owner protected dan action destructivenya disabled.

Audit:
- Sidebar timeline log audit berjalan aman secara read-only.

## Validasi

Build:
- `pnpm.cmd --filter client exec vite build`
- result: `✓ built in 22.44s`

Smoke flag off:
- production team: Berhasil memuat legacy route
- preview team: Tetap merender preview Team 2026
- production coupons: Aman
- production orders: Aman
- production store profile: Aman
- production catalog: Aman
- production add product: Aman
- production product detail: Aman

Smoke flag on:
- production team: Berhasil memuat Team 2026
- preview team: Independen memuat Team 2026
- production coupons: Aman
- production orders: Aman
- production store profile: Aman
- production catalog: Aman
- production add product: Aman
- production product detail: Aman

Console error:
- Bebas dari error re-render component dan promise handling warning.

Horizontal overflow:
- Tabel member dan role tertangani menggunakan class table responsive dan `overflowX`.

English UI:
- Bahasa tampilan terverifikasi konsisten dalam bahasa Inggris.

Production safety check:
- command: `git diff -- client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: (kosong) Zero diff, mengkonfirmasi integritas backend dan original production wrapper.

## Rollback Plan
- Set `VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED=false`
- Restart/rebuild client
- Production Team route returns to legacy Team page
- Preview route remains available
- No backend rollback required

## Risiko Tersisa
- Seluruh mutasi telah dinonaktifkan sebagai langkah pencegahan, jadi resiko logic failure sangat minimal. Confirmation form per role access mutation perlu dikembangkan untuk full adoption.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-HARDEN-PAYMENT-CENTER-25`
