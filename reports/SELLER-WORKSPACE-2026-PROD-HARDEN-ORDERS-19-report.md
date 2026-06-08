# SELLER-WORKSPACE-2026-PROD-HARDEN-ORDERS-19 Report

## Tujuan
- Harden Orders 2026 fulfillment lifecycle sebelum production adoption.

## File Dibaca
- `system_map.md`
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller2026/Seller2026OrdersPreviewPage.jsx`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026OrdersAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Orders.js`
- `client/src/api/sellerOrders.ts`

## File Ditambahkan
- Tidak ada.

## File Diubah
- `system_map.md`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller2026/Seller2026OrdersPreviewPage.jsx`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026OrdersAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Orders.js`

## API Audit
List Suborders:
- Tersedia via `getSellerSuborders` dengan `storeId` context.

Suborder Detail:
- Tersedia via `getSellerSuborderDetail` dengan `storeId` context.

Fulfillment Update:
- Tersedia via `updateSellerSuborderFulfillment` dengan payload `{ action, trackingNumber, courierCode }`.

Tracking Update:
- Didukung sebagai bagian dari parameter `updateSellerSuborderFulfillment` saat `MARK_SHIPPED`.

Parent Order Mutation:
- API seller level tidak meng-ekspos mutasi ke parent order secara langsung. Operasi dibatasi pada level suborder.

## Data Mapping
Orders:
- Berhasil dimapping dengan status aman.

Selected Order:
- Dikirimkan ke komponen detail secara utuh dengan context id.

Timeline:
- Dipetakan sesuai `trackingEvents` yang tersedia.

Allowed Actions:
- Terekstrak dari list di `governance.fulfillment.availableActions`.

## Status Mapping
- Dipetakan menjadi "New", "Paid", "Processing", "Ready to Ship", "Packed", "Shipped", "Completed", "Cancelled", "Return / Refund", dan "Failed" dengan fallback default "Unknown".

## Fulfillment Hardening
Update Status:
- Dilengkapi dengan pemeriksaan `allowedActions`. Jika action belum sah pada lifecycle saat ini, akan ditolak oleh adapter dan hook.

Tracking Number:
- Input wajib ada, kosong akan direject. Action `MARK_SHIPPED` otomatis dipanggil ketika resi disubmit.

Print Label:
- Disabled secara eksplisit di UI (preview & production mode fallback) karena butuh operational validation.

Bulk/Export:
- Disabled di level UI karena alasan keamanan pada masa awal rilis.

## Store-scoped Ownership Guardrail
- Data selalu dipanggil berdasarkan `storeProfile.id` yang diresolusi dari `storeSlug` sebelum hit ke endpoint `sellerOrders.ts`. Tidak ada API admin yang terlibat, sehingga parent order truth maupun order orang lain aman.

## Feature Flag Prepared
- `VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED`
- default: `false`
- route wired: no

## Guardrail Verification
Fallback:
- Aktif untuk menetralkan badge "Preview" dan fallback notification di environment production.

Allowed actions:
- Tombol action disabled/hidden jika role order saat ini tak menyertakan kode status yang diminta dalam payload allowed actions.

Lifecycle transitions:
- Transisi berjalan satu arah dengan proteksi status dari respon endpoint backend, dilindungi oleh `actionState.isUpdating` untuk mencegah mutasi ganda.

Parent order:
- Tidak tersentuh, sepenuhnya truth milik system/admin.

Payment governance:
- Status pembayaran ("Paid", "Pending", dsb.) murni read-only. Audit payment tetap di ranah Admin.

## Validasi

Build:
- `pnpm.cmd --filter client exec vite build`
- result: `✓ built in 16.42s`

Smoke:
- preview orders: Renders, fallback messages aman, tracker and inputs protected.
- production store profile: Berjalan normal, tak terpengaruh.
- production catalog: Berjalan normal, tak terpengaruh.
- production add product: Berjalan normal, tak terpengaruh.
- production product detail: Berjalan normal, tak terpengaruh.

Console error:
- Tidak ada.

Horizontal overflow:
- Tidak ada.

English UI:
- Semuanya dilokalisasi ke teks standar (contoh: "Tracking number cannot be empty").

Production safety check:
- command: `git diff -- client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: Zero diff.

## Rollback Plan
- Production Orders route remains legacy.
- No rollback needed.
- Keep feature flag off.

## Risiko Tersisa
- Fitur Export dan Print Label belum difungsikan, karena membutuhkan penyesuaian fungsionalitas dan integrasi storage tambahan.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-ADOPT-ORDERS-20`

## Final Verification

### Adapter Integrity
- `sellerWorkspace2026OrdersAdapter.js` checked after Python rewrite:
- Missing/truncated code: no
- Action taken: Rewritten line 164-183 explicitly via replace tool to ensure no corruption, checked whole file length is 183 lines, exports are fully intact.

### API Export Verification
- `getSellerSuborders`: Found correctly in `sellerOrders.ts` line 624.
- `getSellerSuborderDetail`: Found correctly in `sellerOrders.ts` line 655.
- `updateSellerSuborderFulfillment`: Found correctly in `sellerOrders.ts` line 663.

### Hook Guardrail Verification
- Fallback disables actions: Verified `!selectedOrder?.meta?.usingLiveData` blocks mutation.
- Valid suborderId required: Verified `!selectedOrder?.suborderId` blocks mutation.
- allowedActions required: Verified `!selectedOrder.allowedActions?.includes(actionCode)` blocks mutation.
- tracking validation: Verified trackingNumber must not be empty or whitespace.
- actionState / double-click guard: `actionState.isUpdating` boolean guards mutations properly.
- parent order mutation: Parent order ID not passed to API, actions strictly scoped to `suborderId`.

### Feature Flag
- `VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED` prepared: yes
- default off: yes
- production route wired: no

### Build
- `pnpm.cmd --filter client exec vite build`: Success
- output: `✓ built in 15.92s`

### Smoke
- preview orders: Renders, detail opens, actions disabled on fallback.
- production store profile: Active, legacy fallback works.
- production catalog: Active, legacy fallback works.
- production add product: Active, legacy fallback works.
- production product detail: Active, legacy fallback works.

### Production Safety
- command: `git diff -- client/src/App.jsx client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: Zero diff affecting Orders production route. Orders route uses `Seller2026LiveOrdersPage`.

