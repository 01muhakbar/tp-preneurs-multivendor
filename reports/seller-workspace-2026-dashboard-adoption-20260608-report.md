# SELLER-WORKSPACE-2026-PROD-ADOPT-DASHBOARD-04

## Scope
Adopsi Seller Workspace 2026 Dashboard ke canonical production routes secara aman, read-only-first, live API connected, feature-flagged, rollbackable, dan tanpa mock data di canonical route.

## Files Read
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller2026/Seller2026LiveDashboardPage.jsx`
- `client/src/hooks/seller2026/useSeller2026Dashboard.ts`
- `client/src/api/seller2026/dashboard.adapter.ts`
- `system_map.md`

## Files Changed
- `scripts/seller2026-dashboard-adoption-smoke.ts` (Dibuat baru untuk e2e test Dashboard)
- `system_map.md` (Diperbarui dengan status adopsi Dashboard)

## Route Adoption Behavior
- `/seller/stores/:storeSlug` dan `/seller/stores/:storeSlug/dashboard` sekarang secara otomatis memuat `Seller2026LiveDashboardPage` jika *feature flags* diaktifkan.
- Jika *feature flags* dinonaktifkan, *routes* tersebut akan kembali (rollback) secara mulus memuat komponen `SellerWorkspaceHome` (Legacy Dashboard).

## Feature Flags
- `VITE_SELLER_WORKSPACE_2026_ENABLED=true`
- `VITE_SELLER_WORKSPACE_2026_DASHBOARD_ENABLED=true`
- *Flags* ini dikelola melalui `sellerWorkspace2026Flags.js` dengan fungsi getter `isSeller2026DashboardProductionEnabled()`.

## APIs Used
Komponen live API yang terkoneksi langsung dengan dashboard:
- `getSellerFinanceSummary`
- `getSellerAnalyticsSummary`
- `getSellerWorkspaceReadiness`
- `getSellerSuborders`

## Dashboard Data Contract
Dashboard data adapter (`dashboard.adapter.ts`) mematuhi aturan normalisasi minimal dengan fallback aman:
- `kpis`: Merender ringkasan Paid Revenue, Total Orders, Active Products, dan Eligible Paid Gross yang telah di-*fallback*.
- `readiness`: Mematuhi persentase skor, checklist, dan items status dari `summary`.
- `traffic`: Merender produk draft, processing orders, completed orders.
- `topProducts` & `recentSuborders`: Tersedia list aman tanpa limit berlebihan dan diproteksi empty array `[]` *fallback*.
- Seluruh metrics seperti angka dan *currency* menggunakan *formatter formatterCurrency* dan *formatNumber*.

## UI States
UI state dikelola melalui state standard `dashboardState` di `Seller2026LiveDashboardPage.jsx`:
- `isLoading`: Menangani *skeleton loader* jika query belum selesai.
- `isError`: Menangani *error notification state*.
- Data kosong dirender secara aman melalui *default adapter fallback*.

## Permission Behavior
Owner memiliki akses baca ke *Dashboard metrics*, *top products*, *recent suborders*, dan metrik keuangan. Quick actions disesuaikan dengan *permissions* session.

## Cross-Store Behavior
Guard lintas-toko (cross-store) bekerja di semua *canonical route*. Mencegah pemilik toko A mengakses *dashboard* toko B tanpa *permission* (*Access Forbidden* berhasil di-*render*).

## Preview Behavior
Route `seller-2026` dan `/seller-2026/dashboard` tetap eksis dan dirender secara aman via komponen *preview*. Tidak ada kebocoran mock-data di live route.

## Disabled Mutations
Tidak ada form mutasi yang disertakan. *Publishing products*, *Payment reject/approve*, dan *order processing* semuanya dikelola di laman spesifik yang masing-masingnya terhubung dari tombol (Quick Actions/Navigasi).

## Smoke Results
- **Flags ON**: PASS (Live dashboard tertampil).
- **Owner**: PASS (Data termuat dan dapat dinavigasikan).
- **Role-limited member**: PASS (Terkoneksi aman dengan limit role).
- **Cross-store guard**: PASS (403 Access Forbidden dirender aman pada UI).
- **Preview**: PASS (Mock data termuat di `seller-2026` path).
- **Notifications regression**: PASS (Route lain aman tidak mengalami perubahan perilaku render).

## Typecheck/build/lint result
- Typecheck (`tsc -b`): PASS
- Build (`vite build`): PASS

## Bugs Fixed
- Fix bug *regression checking regex* dalam *smoke test* agar tidak *false-positive* atas keberadaan string "Dashboard" untuk halaman non-seller.

## Known Limitations
- Beberapa *repo-wide lint debts* yang sudah ada tetap tidak disentuh (dilompati).

## Rollback Notes
Rollback dari Dashboard Seller 2026 sangat aman dengan mengubah `.env` flag `VITE_SELLER_WORKSPACE_2026_DASHBOARD_ENABLED=false`. Hal ini akan langsung me-render `SellerWorkspaceHome`.

## Next Recommended Task
`SELLER-WORKSPACE-2026-PROD-ADOPT-CATALOG-05`
