# SELLER-WORKSPACE-2026-PROD-HARDEN-ANALYTICS-SYNC-27 Report

## Tujuan
- Harden Analytics & Storefront Sync 2026 sebelum production route strategy ditetapkan.

## File Dibaca
- `system_map.md`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026AnalyticsSyncAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026AnalyticsSync.js`
- `client/src/pages/seller2026/Seller2026AnalyticsSyncPreviewPage.jsx`

## File Ditambahkan
- (Tidak ada file baru ditambahkan selain report ini)

## File Diubah
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026AnalyticsSync.js`
- `client/src/pages/seller2026/Seller2026AnalyticsSyncPreviewPage.jsx`
- `system_map.md`

## API Audit
Analytics Summary:
- Live GET requests termuat di `getSellerAnalyticsSummary` dan `getSellerStoreProfile`.

Product Performance:
- Diturunkan dari properti `qtySold` dan termanifestasi sebagai viewable array list melalui adapter. Mapping visibility diuji keamanannya via parameter `p.status`.

Storefront Identity:
- Store Slug, URL, taglines dimuat strictly read-only.

Sync / Index / Publish:
- Sync mutasi seperti "Sync Now" dan "Rebuild Index" terpantau sebagai stub dan telah digembok dengan state update UI error di level hook.

## Data Mapping
Analytics:
- KPI seperti Revenue, Orders, Conversion berjalan. Charts berupa series line sementara derived/mock untuk visualisasi structure layout preview.

Product Performance:
- Atribut title, sku, views, dan revenue telah dimapping dengan status visibility string yang terjamin fallback safetynya ('Visible', 'Hidden', 'Unknown').

Storefront Sync:
- Sync Health, Microsite Status, Product Index Status disederhanakan dan dibersihkan dari backend sync trigger logic untuk mempertahankan isolation.

Public Preview:
- Card rendering store name, tagline, url terisi secara fungsional. Hanya mode read-only.

Status:
- Valid mapping applied: `Healthy`, `Needs Attention`, `Missing`, `Error`, `Unknown`. Visibility: `Visible`, `Hidden`, `In Review`, `Rejected`.

## Storefront Visibility Guardrail
Public visibility:
- Mutasi public/disable microsite dinonaktifkan.

Product visibility:
- Toggle on/off publish di tabel dihapus / tak tersedia di UI.

Sync Now:
- Mutasi diblock di hook, button diconfigure `disabled=true` dan menampilkan tooltip serta error message.

Rebuild Index:
- Disamakan dengan logic strict Sync Now.

Publish Storefront:
- Disamakan dengan logic strict Sync Now.

Public Preview:
- Refresh action hanya memanggil fetch adapter `refetch()`. Teks peringatan "Storefront preview is read-only and does not change public visibility" dirender.

## Feature Flag Prepared
- `VITE_SELLER_WORKSPACE_2026_ANALYTICS_SYNC_ENABLED`
- default: `false`
- route wired: `no` (App.jsx tidak diubah)

## Readiness Decision
- status: `PREVIEW_ONLY`
- reason: Modul ini memiliki keterkaitan erat dengan integrasi real-time sync storefront yang belum diwire untuk production endpoints. Mutasi indexing harus dirumuskan ulang dalam lingkup arsitektur backend jika seller diizinkan mengakses control. Data chart juga sebagian masih derived mockup. Route strategy khusus juga belum diformulasikan. Saat ini aman sebagai preview.

## Guardrail Verification
Fallback:
- `productionMode` prop disisipkan agar `Seller2026FallbackBanner` dapat merender wording aman saat production data failure terjadi.

Sync actions:
- Stub function hook akan men-set timeout warning banner.

Public visibility:
- Store public URL tidak termutasi karena tidak adanya API patch call.

Product visibility:
- Form fields / checkbox list absen.

Storefront preview:
- Data dirender strictly read-only.

## Validasi

Build:
- `pnpm.cmd --filter client exec vite build`
- result: `✓ built in 14.87s`

Smoke:
- preview analytics-sync: Merender preview lengkap. Tombol-tombol mutation statik/disabled dan peringatan banner tampil. Refresh preview berjalan me-reload state adapter.
- production payment-review: legacy aman.
- production payment-profile: legacy aman.
- production team: legacy aman.
- production coupons: legacy aman.
- production orders: legacy aman.
- production store profile: legacy aman.
- production catalog: legacy aman.
- production add product: legacy aman.
- production product detail: legacy aman.

Console error:
- Clear, tidak terdapat syntax err atau state leaking.

Horizontal overflow:
- Dashboard layout grid scale dan table wrap bekerja proporsional dalam CSS flexbox layout bounds.

English UI:
- Clear.

Production safety check:
- command: `git diff -- client/src/App.jsx client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: `clean` tidak ada pergeseran diff routing server / backend (App.jsx unmodified pada tahapan task ini, aman).

## Rollback Plan
- Analytics Sync remains preview-only.
- No rollback needed.
- Keep feature flag off.

## Risiko Tersisa
- Saat route production ditentukan nanti, mutasi sync wajib kembali dipersiapkan untuk workflow endpoint real-nya.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-FINAL-SMOKE-28`
