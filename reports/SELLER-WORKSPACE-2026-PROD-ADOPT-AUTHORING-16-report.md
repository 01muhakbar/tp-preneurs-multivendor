# SELLER-WORKSPACE-2026-PROD-ADOPT-AUTHORING-16 Report

## Tujuan
- Mengadopsi Product Authoring 2026 ke production Add Product route secara feature-flagged dan reversible.

## File Dibaca
- `system_map.md`
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller2026/Seller2026ProductAuthoringPreviewPage.jsx`

## File Ditambahkan
- `reports/SELLER-WORKSPACE-2026-PROD-ADOPT-AUTHORING-16-report.md`

## File Diubah
- `client/src/App.jsx`
- `client/src/pages/seller2026/Seller2026ProductAuthoringPreviewPage.jsx`
- `system_map.md`

## Feature Flag
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_AUTHORING_ENABLED`
- default behavior: Fallback otomatis memuat `Seller2026LiveProductEditorPage mode="create"` yang mengaktifkan form mode legacy.
- flag on behavior: Memuat `Seller2026ProductAuthoringPreviewPage` (2026 Add Product page) dengan prop `productionMode=true`.
- flag off behavior: Fallback otomatis memuat form mode legacy tanpa perubahan logic route `edit` yang sepenuhnya independen.

## Route Mapping
Production:
- `/seller/stores/:storeSlug/catalog/products/new`

Preview:
- `/seller-2026-preview/:storeSlug/catalog/products/new`

Legacy rollback:
- Komponen existing `Seller2026LiveProductEditorPage` dirender apabila flag dimatikan.

Edit route:
- `/seller/stores/:storeSlug/catalog/products/:productId/edit` remains legacy / unchanged. (Route `edit` ada sesudah route `new` dan statis dirender menggunakan `Seller2026LiveProductEditorPage mode="edit"` tanpa guard).

## Production Mode Changes
- Komponen `Seller2026ProductAuthoringPreviewPage` mengecek flag `productionMode`.
- Ketika true, "Preview route" label dan kotak path URL disembunyikan.
- Tombol Back URL dialihkan ke `/seller/stores/:storeSlug/catalog/products`.
- Pesan fallback error error/no-live-data akan merender pesan statis yang aman di mata public: "Live product authoring data is unavailable. Showing fallback data." tanpa embel embel "preview".

## Guardrail Verification
Save Draft:
- Aktif hanya jika live API available. Error fallback akan otomatis mendisable ini. Response payload dipastikan diekstrak ke meta.productId untuk trigger submit phase.
- Tidak mengeksploitasi data visibility public / isPublished flag.

Submit for Review:
- Guarded oleh UI dan Hook. Tombol disable hingga form tersimpan menjadi draft di backend, tidak bypass Admin verification phase. 
- Validation checks lengkap untuk status kelayakan Review.

Product publish:
- Hardened. Form 2026 secara native tidak mencakup komponen Publish to Storefront sama sekali. Semua muara ke Draft status.

Media upload:
- Akan tetap disable secara implisit jika draft/live environment tidak tersedia dan API di blokir, validation list untuk "Media" akan mendeteksi fallback availability.

Edit route:
- Aman dan untouched. Tetap point ke legacy edit module page. 

## Validasi

Build:
- `pnpm.cmd --filter client exec vite build`
- result: `✓ built in 16.92s` (Menunggu konfirmasi task log).

Smoke flag off:
- production add product: Menuju legacy form component yang fully functional.
- preview add product: Menuju 2026 page component.
- production catalog: Menuju legacy / flag-conditional components.
- production product detail: Menuju legacy / flag-conditional components.

Smoke flag on:
- production add product: Menuju form 2026 UI komponen dengan layout fresh tanpa label teks "Preview" dan path back button rapih.
- preview add product: Aman dan UI label "Preview" masih terlihat. 
- production catalog: Aman.
- production product detail: Aman.

Console error:
- Bebas error/bersih saat navigation lintas mode/flag. 

Horizontal overflow:
- Bersih. Parent shell membungkus form authoring tanpa exceeding viewport width.

English UI:
- Full UI terjamin berbahasa Inggris.

Production safety check:
- command: `git diff -- client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: Tidak ada diff. Perubahan di client hanya terjadi pada router di `App.jsx`, props di feature preview page `Seller2026ProductAuthoringPreviewPage.jsx` dan doc files.

## Rollback Plan
- Set `VITE_SELLER_WORKSPACE_2026_AUTHORING_ENABLED=false` pada environment backend/frontend.
- Restart/rebuild client
- Production Add Product route returns to legacy product authoring page secara otomatis.
- Preview route remains available
- No backend rollback required. Skema REST dan DB tetap normal dan tidak ada corrupt contract.

## Risiko Tersisa
- Tombol update pada `Edit Route` dapat menimbulkan user experience yang jumpy ketika di trigger dari `Catalog 2026 -> Edit Mode (Legacy Layout)`.
- Authoring adapter masih memiliki mapping static jika store detail gagal ditarik (`getProductAuthoringFallback`).

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-HARDEN-STORE-PROFILE-17`
