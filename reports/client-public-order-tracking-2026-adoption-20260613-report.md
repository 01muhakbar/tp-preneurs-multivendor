# Client Public Order Tracking 2026 Adoption Report

Date: 2026-06-13

## Scope

- Route: `/order/:ref`
- Controller: `client/src/pages/store/StoreOrderTrackingPage.jsx`
- Public API: existing `GET /api/store/orders/:ref`
- Layout ownership remains in `StoreLayout`.

## Implementation

- Added `StoreOrderTracking2026View.jsx` for the responsive tracking presentation.
- Added `store-order-tracking-2026.css` with scoped `tpord2026-` classes.
- Added `storeOrderTracking2026Adapter.js` to normalize backend order, payment, shipment, timeline, item, total, and masked customer data.
- Kept `StoreOrderTrackingPage.jsx` as the route controller and existing public query owner.
- Kept backend contract and store-split operational truth as status sources.
- Added defensive masking only when the backend response is not already masked.
- Kept payment information read-only and introduced no order or payment mutation.
- Reused existing invoice generation, browser print, and storefront support configuration.

## Verification

- Example public reference returned HTTP 200 without authentication.
- Desktop viewport: 1440 px document width equals 1440 px viewport width.
- Mobile viewport: 390 px document width equals 390 px viewport width.
- Items table scrolls inside its own container on small screens.
- Browser console and page-error checks returned no errors.
- Download Invoice produced `STORE-IDEMP-A927FD93122C6AFAC69D9A92.pdf`.
- Print Invoice invoked the browser print flow.
- Protected account order routes continued to redirect unauthenticated users to `/auth/login`.

## QA Results

- `pnpm -F client build`: passed.
- `pnpm -F server build`: passed.
- `git diff --check`: passed.
- Smoke routes passed:
  - `/order/STORE-IDEMP-A927FD93122C6AFAC69D9A92`
  - `/user/my-orders`
  - `/user/my-orders/1555`
  - `/user/my-orders/1555/payment`
  - `/cart`
  - `/checkout`
  - `/`

## Artifacts

- `reports/client-public-order-tracking-2026-desktop.png`
- `reports/client-public-order-tracking-2026-mobile.png`
