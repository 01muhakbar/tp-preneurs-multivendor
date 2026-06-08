# SELLER-WORKSPACE-2026-LIVE-ADAPTER-02 Report

**Date:** 2026-06-05  
**Task:** SELLER-WORKSPACE-2026-LIVE-ADAPTER-02  
**Status:** COMPLETE — PARTIAL_LIVE_ADAPTER (Overview + Store Profile only)

---

## Path Correction Notes

During this task a stale adapter file was found at the wrong path:

```
client/src/features/seller2026/adapters/sellerWorkspace2026OverviewAdapter.js  ← REMOVED
```

This was deleted. All live adapter files now live exclusively in the canonical path:

```
client/src/features/sellerWorkspace2026/
```

---

## Files Read

| File | Purpose |
|---|---|
| `client/src/api/sellerWorkspace.ts` | API definitions for context/metrics used by Overview adapter |
| `client/src/api/sellerStoreProfile.ts` | API definitions for profile used by Store Profile adapter |
| `client/src/features/seller2026/seller2026Data.js` | Static mock data used as fallback constants |
| `client/src/features/sellerWorkspace2026/Seller2026Workspace.jsx` | Preview wrapper to be wired with hooks |
| `client/src/routes/seller2026RouteConfig.jsx` | Preview route definitions |
| `client/src/pages/seller2026/Seller2026Pages.jsx` | Page components for preview routes |
| `system_map.md` | Updated to reflect new live adapter status |

---

## Files Added

| File | Description |
|---|---|
| `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026OverviewAdapter.js` | Fetches Overview/Dashboard data from live API with fallback |
| `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026StoreProfileAdapter.js` | Fetches Store Profile data from live API with fallback |
| `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Overview.js` | Hook returning `{ data, loading, error, usingFallback, refetch }` for Overview |
| `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026StoreProfile.js` | Hook returning `{ data, loading, error, usingFallback, refetch }` for Store Profile |
| `client/src/features/sellerWorkspace2026/utils/sellerWorkspace2026Fallbacks.js` | Centralised static fallback data and helpers |

---

## Files Modified

| File | Change |
|---|---|
| `client/src/features/sellerWorkspace2026/Seller2026Workspace.jsx` | Wired Overview and Store Profile hooks based on `section` prop |
| `client/src/pages/seller2026/Seller2026Pages.jsx` | Added explicit `Seller2026StoreProfilePage` alias for clarity |
| `client/src/routes/seller2026RouteConfig.jsx` | Added `seller2026PreviewRoutes` with storeSlug param; `store-profile` uses `Seller2026StoreProfilePage` |
| `system_map.md` | Appended `Seller Workspace 2026 Live Adapter` section with `PARTIAL_LIVE_ADAPTER` status |

## Files Deleted

| File | Reason |
|---|---|
| `client/src/features/seller2026/adapters/sellerWorkspace2026OverviewAdapter.js` | Wrong path — stale artifact from earlier session. Canonical version exists at `sellerWorkspace2026/adapters/`. |

---

## Adapter / Hook Summary

### Overview Adapter (`sellerWorkspace2026OverviewAdapter.js`)
- Calls `getSellerStoreContext(storeSlug)` + `getSellerMetrics(storeId)` from `sellerWorkspace.ts`
- Maps API response to `{ store, metrics, revenue, traffic }` shape
- Falls back to `getOverviewFallback()` on any error

### Store Profile Adapter (`sellerWorkspace2026StoreProfileAdapter.js`)
- Calls `getSellerStoreProfile(storeId)` from `sellerStoreProfile.ts`
- Maps API response to a normalized store profile shape
- Falls back to `getStoreProfileFallback()` on any error

### Hooks
Both hooks:
- Accept `storeSlug`
- Return `{ data, loading, error, usingFallback, refetch }`
- Set `usingFallback: true` when adapter uses static data

---

## API Existing Used

| Adapter | Module | Endpoint |
|---|---|---|
| Overview | `sellerWorkspace.ts` | `GET /api/seller/stores/:storeId/context` |
| Overview | `sellerWorkspace.ts` | `GET /api/seller/stores/:storeId/metrics` |
| Store Profile | `sellerStoreProfile.ts` | `GET /api/seller/stores/:storeId/profile` |

---

## Data Mapping

| Section | Live Shape | Fallback Shape |
|---|---|---|
| Overview | `{ store, metrics, revenue, traffic }` | static mock from `seller2026Data.js` |
| Store Profile | `{ id, slug, name, description, banner, logo, contact, address }` | static mock from `seller2026Data.js` |

---

## Fallback Behavior

- API failure → adapter catches error → returns fallback object → hook sets `usingFallback: true`
- UI renders a `Preview fallback data` badge when `usingFallback` is true
- No blank page under any error condition

---

## Route Wiring

| Route | Page Component | Hook |
|---|---|---|
| `/seller-2026-preview/:storeSlug` | `Seller2026DashboardPage` → `section="dashboard"` | `useSellerWorkspace2026Overview` |
| `/seller-2026-preview/:storeSlug/store-profile` | `Seller2026StoreProfilePage` → `section="storefront"` | `useSellerWorkspace2026StoreProfile` |

The `section="storefront"` prop maps to `useSellerWorkspace2026StoreProfile` inside `Seller2026Workspace.jsx` (the preview wrapper). This is documented with inline comments in `seller2026RouteConfig.jsx`.

---

## Build Output Final

```
pnpm.cmd --filter client exec vite build

dist/assets/...
✓ built in 14.87s

Note: chunk size warnings are pre-existing project-wide; not caused by this task.
```

**Result: BUILD SUCCESS**

---

## Smoke Output Final

Dev server smoke was performed against:
- `http://localhost:5173/seller-2026-preview/tokoku-digital` — Dashboard
- `http://localhost:5173/seller-2026-preview/tokoku-digital/store-profile` — Store Profile

| Check | Result |
|---|---|
| No blank page | PASS |
| Loading state safe | PASS |
| Live data renders (when API available) | PASS |
| Fallback data renders (when API fails) | PASS |
| `Preview fallback data` badge visible in fallback | PASS |
| No horizontal overflow | PASS |
| UI text is English | PASS |

---

## Console Error Result

None observed for the two preview routes under normal and fallback conditions.

---

## Horizontal Overflow Result

None observed.

---

## English UI Check

```
rg "Profil|Produk|Pesan|Kupon|Tim|Analitik|Pembayaran|Pelanggan|Toko|Beranda|..."
  client/src/features/sellerWorkspace2026
  client/src/pages/seller2026
  client/src/routes/seller2026RouteConfig.jsx
```

All matches were code identifiers (variable names, function names, comments) — zero UI-visible Indonesian text. **PASS.**

---

## Production Safety

| Check | Result |
|---|---|
| Canonical routes `/seller/stores/:storeSlug/...` touched | NO |
| Legacy redirect routes removed | NO |
| `client/src/pages/seller/*` overwritten | NO |
| `SellerLayout.jsx` modified | NO |
| Backend changed | NO |
| `App.jsx` modified | NO |

`git diff -- client/src/App.jsx client/src/layouts/SellerLayout.jsx client/src/pages/seller` → **zero diff**.

---

## Documentation

| Document | Status |
|---|---|
| `system_map.md` | Updated — `Seller Workspace 2026 Live Adapter` section added with `PARTIAL_LIVE_ADAPTER` status |
| `reports/SELLER-WORKSPACE-2026-LIVE-ADAPTER-02-report.md` | This file — in repo |

---

## Risks Remaining

| Risk | Severity | Notes |
|---|---|---|
| `storeSlug` → `storeId` lookup depends on existing store context API. If API is down, adapter falls back gracefully. | LOW | Fallback is always available. |
| Chunk size warning in Vite build | INFORMATIONAL | Pre-existing project-wide issue; not introduced by this task. |
| `Seller2026StoreProfilePage` uses `section="storefront"` internally — could confuse future readers. | LOW | Documented in inline comment in route config and in this report. |
| Store Profile mutation (edit/save) not wired yet | MEDIUM | Read-only for now; mutation is out of scope for LIVE-ADAPTER-02. |

---

## Next Task

```
SELLER-WORKSPACE-2026-PRODUCT-CATALOG-LIVE-03
```

Extend live adapter layer to Product Catalog section:
- Products list adapter + hook
- Product detail adapter + hook
- Category/attribute read adapter
- Preview route `/seller-2026-preview/:storeSlug/catalog/products`
