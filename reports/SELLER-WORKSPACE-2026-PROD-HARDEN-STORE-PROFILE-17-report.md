# SELLER-WORKSPACE-2026-PROD-HARDEN-STORE-PROFILE-17 Report

## Tujuan
- Harden Store Profile 2026 read/update workflow sebelum production adoption.

## File Dibaca
- `system_map.md`
- `client/src/App.jsx`
- `client/src/api/sellerStoreProfile.ts`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026StoreProfileAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026StoreProfile.js`
- `client/src/features/sellerWorkspace2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`

## File Ditambahkan
- `reports/SELLER-WORKSPACE-2026-PROD-HARDEN-STORE-PROFILE-17-report.md`

## File Diubah
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026StoreProfileAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026StoreProfile.js`
- `client/src/features/sellerWorkspace2026/Seller2026Workspace.jsx`
- `system_map.md`

## API Audit
Read Store Profile:
- Fungsi `getSellerStoreProfile` tersedia dan diarahkan ke `GET /seller/stores/:storeId/store-profile`.
- Respons di-normalize oleh `normalizeStoreProfile`.

Update Store Profile:
- Fungsi `updateSellerStoreProfile` memanggil endpoint `PATCH /seller/stores/:storeId/store-profile` dengan payload parsial.
- Field yang diedit hanya field yang whitelist.

Slug / Domain:
- Tidak dikirim di dalam form payload. Pembaruan ini tidak mengubah parameter URI akses.

Public Identity:
- Modifikasi identity public seperti Name dan Slug diblokir di endpoint client mapping layer `mapStoreProfileFormToPayload`. Status dan validasi KYC tidak disentuh (read-only render).

## Payload Mapping
Allowed Fields:
- `description`, `logoUrl`, `bannerUrl`, `email`, `phone`, `whatsapp`, `addressLine1`. (Dimapping dari internal flat state form di page).

Blocked/Sensitive Fields:
- Explicit deletion applied: `slug`, `domain`, `status`, `verificationStatus`, `published`, `isPublic`, `isActive`, `ownerId`, `name`.

## Save Profile Hardening
- Tombol `Save Changes` aktif hanya ketika ada input change (`isDirty`) dan live connection.
- Action submit di-map ke asynchronous `saveSellerWorkspace2026StoreProfile`.
- Disertai dengan validasi error dan success alert bawaan UI (`setSubmitStatus`).

## Storefront Preview Guardrail
- Microsite Storefront URL masih menampilkan `/store/:storeSlug` namun murni sebagai link navigasi (read-only di mata public storefront router). 
- Form save state tidak memicu public publish override (isPublic status protected).

## Feature Flag Prepared
- `VITE_SELLER_WORKSPACE_2026_STORE_PROFILE_ENABLED`
- default: `false`
- route wired: no. (Masih pure feature preparation, belum merubah route App.jsx).

## Guardrail Verification
Save Profile:
- Cepat dan responsive, error caught dan dirender pada `s26-alert error`. Success state render di `s26-alert success`.

Slug/domain:
- Form field Slug dan URL tetap readOnly di front-end UI form dan payload dibersihkan pada backend adapter.

Public visibility:
- Aman. Tidak mengubah status active atau verification status milik master toko.

Fallback:
- Apabila fail context load, menggunakan data mock `previewStore`. Mutation "Save Changes" mati karena deteksi fallback aktif.

## Validasi

Build:
- `pnpm.cmd --filter client exec vite build`
- result: `✓ built in 15.25s`

Smoke:
- preview store profile: UI merender dengan normal. Menampilkan "Live store profile could not load" bila database kosong.
- production catalog: Aman.
- production add product: Aman.
- production product detail: Aman.

Console error:
- Bersih. 

Horizontal overflow:
- Grid form form-group terkendali di dalam card wrapper flex layout.

English UI:
- English language UI terjaga pada internal preview text rendering dan validation errors response handling.

Production safety check:
- command: `git diff -- client/src/App.jsx client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: Zero diff pada backend core dan routing production layer.

## Rollback Plan
- Production Store Profile route remains legacy.
- No rollback needed.
- Keep feature flag off.

## Risiko Tersisa
- Tombol Edit Slug dan Edit Domain pada fase kedepan memerlukan custom dialog KYC verification dan tidak disarankan sekedar text input toggle.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-ADOPT-STORE-PROFILE-18`
