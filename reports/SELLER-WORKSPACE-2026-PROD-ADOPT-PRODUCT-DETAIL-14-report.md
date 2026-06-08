# SELLER-WORKSPACE-2026-PROD-ADOPT-PRODUCT-DETAIL-14 Report

## Tujuan
- Mengadopsi Product Detail 2026 ke production route secara feature-flagged, read-only/guarded, dan reversible.

## File Dibaca
- `system_map.md`
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller2026/Seller2026ProductReviewDetailPreviewPage.jsx`

## File Ditambahkan
- `reports/SELLER-WORKSPACE-2026-PROD-ADOPT-PRODUCT-DETAIL-14-report.md`

## File Diubah
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller2026/Seller2026ProductReviewDetailPreviewPage.jsx`
- `client/src/App.jsx`
- `system_map.md`

## Feature Flag
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_PRODUCT_DETAIL_ENABLED`
- default behavior: Merender `Seller2026LiveProductDetailPage` sebagai legacy mode untuk detail produk.
- flag on behavior: Merender `Seller2026ProductReviewDetailPreviewPage` dengan properti `productionMode={true}` untuk read-only safe mode.
- flag off behavior: Fallback otomatis ke legacy component tanpa mengubah apapun pada edit routing yang terpisah.

## Route Mapping
Production:
- `/seller/stores/:storeSlug/catalog/products/:productId` (Feature-flag conditional rendering)

Preview:
- `/seller-2026-preview/:storeSlug/catalog/products/:productId` (Unchanged, remains preview)

Legacy rollback:
- Tetap fallback ke `<Seller2026LiveProductDetailPage />`

Edit route:
- `/seller/stores/:storeSlug/catalog/products/:productId/edit` remains legacy / unchanged. (Tetap dipetakan ke `<Seller2026LiveProductEditorPage mode="edit" />`)

## Production Mode Changes
- Teks fallback "Preview route" disembunyikan dan diubah menjadi pesan fallback yang netral: "Live product detail data is unavailable. Showing fallback data."
- Rute Back to Catalog diarahkan ke `/seller/stores/:storeSlug/catalog/products`.
- Tidak ada kata "Preview" yang terlihat di UI pada area product detail saat `productionMode` diaktifkan.

## Guardrail Verification
Product publish:
- Tidak ada button product publish di preview UI dan tidak diadopsi pada production UI ini.

Save Changes:
- Hardcoded disabled dengan properti `disabled={true}` dan pesan hover konfirmasi yang aman untuk environment production.

Submit / Resubmit:
- Aman, di-gate oleh boolean state internal dari API payload: `!data.readiness.canSubmitReview && !data.readiness.canResubmit`.

Duplicate Product:
- Aman, direstrict langsung via API property: `!data.readiness.canDuplicate`.

View Storefront:
- Aman, dikontrol read-only via boolean field `data.readiness.canViewStorefront`.

## Validasi

Build:
- `pnpm.cmd --filter client exec vite build`
- result: `✓ built in 16.48s`

Smoke flag off:
- production product detail: Menampilkan komponen layout legacy `Seller2026LiveProductDetailPage`.
- preview product detail: Menampilkan preview normal.
- production catalog: Menampilkan list legacy (apabila flag catalog juga off).

Smoke flag on:
- production product detail: Menampilkan layout UI 2026 `Seller2026ProductReviewDetailPreviewPage` yang dipasangi mode productionMode.
- preview product detail: Preview route tetap jalan secara legacy preview mode.
- production catalog: Menampilkan legacy atau 2026 UI list tergantung catalog flag.

Console error:
- Clean. Tidak ada React errors atau API missing parameters.

Horizontal overflow:
- Clean. Dibatasi oleh shell layout `Seller2026Shell` flex rules.

English UI:
- Bahasa tampilan adalah English secara utuh.

Production safety check:
- command: `git diff -- client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: Zero diff untuk rute backend dan file area seller legacy (hanya `App.jsx` dan fitur feature flag area yang diubah).

## Rollback Plan
- Set `VITE_SELLER_WORKSPACE_2026_PRODUCT_DETAIL_ENABLED=false` pada environment variables node.
- Restart/rebuild client.
- Production route returns to legacy product detail page.
- Preview route remains available untuk debugging jika diperlukan.
- No backend rollback required sama sekali.

## Risiko Tersisa
- Editing masih legacy. Harus dijaga transisi UI antara detail halaman baru dengan edit page lama yang melompat layout paradigmanya (dijadwalkan di hardening task authoring).

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-HARDEN-AUTHORING-15`
