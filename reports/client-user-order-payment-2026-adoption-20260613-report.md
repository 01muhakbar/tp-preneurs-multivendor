# Client User Order Payment 2026 Adoption Report

Date: 2026-06-13

## Scope

- Route: `/user/my-orders/:id/payment`
- Route component remains `AccountOrderPaymentPage.jsx`
- Existing `StoreLayout`, `AccountGuard`, and `AccountLayout` ownership is preserved
- Existing grouped checkout payment query and payment mutations are reused

## Implementation

- Added `AccountOrderPayment2026View.jsx`
- Added scoped `account-order-payment-2026.css` using the `tppay2026-` prefix
- Added `accountOrderPayment2026Adapter.js`
- Normalized parent payment summary and store payment groups from the backend grouped payment read-model
- Kept QRIS destination, amount, reference, and actions scoped to the selected store payment
- Kept proof image upload and proof submission through `orderPayments.ts`
- Kept payment cancellation through `orderPayments.ts`
- Preserved existing query invalidation for payment detail, order detail, grouped order, and account order list
- Updated the account layout route matcher so the payment page uses the same unframed content area as order detail
- Added a per-store WhatsApp notification CTA on store payment cards after the buyer has paid or submitted payment proof
- Reused store `phone` / `whatsapp` fields from the existing checkout payment response

## Action Safety

- `I Have Transferred` is rendered only when the backend operational buyer action or compatible backend actionability allows proof submission
- `Cancel Payment` is rendered only when the backend operational buyer action or compatible backend cancelability allows cancellation
- A declared disabled backend action is not overridden by fallback client logic
- No final payment lifecycle state is synthesized independently from the backend read-model
- WhatsApp notification is hidden while payment is only `CREATED`
- WhatsApp notification is hidden when the store has no usable WhatsApp or phone contact
- WhatsApp message links are generated only as `wa.me` URLs; no message is sent automatically

## QA

- `pnpm -F client build`: passed
- `pnpm -F server build`: passed
- `git diff --check`: passed
- Guest smoke routes redirect account pages through `AccountGuard` and public routes render without horizontal overflow
- Authenticated fixture smoke verified:
  - Order Payment view renders
  - My Orders sidebar item is active
  - QR image renders when available
  - QR preview opens and closes
  - Confirm and cancel actions render when backend actions are enabled
  - Confirm and cancel actions are hidden when backend actions are disabled
  - Notify Store WhatsApp CTA appears after proof upload
  - Notify Store WhatsApp CTA appears when payment status is `PAID`
  - Notify Store WhatsApp CTA is hidden when payment status is `CREATED`
  - Notify Store WhatsApp CTA falls back from invalid `whatsapp` value to store `phone`
  - Notify Store WhatsApp CTA is hidden when no store contact is available
  - WhatsApp URL normalizes Indonesian `08...` numbers to `628...`
  - WhatsApp message includes store name, order reference, payment reference, and amount
  - Desktop and 390px mobile widths have no page-level horizontal overflow
  - One Storefront floating cart and one footer remain

## Smoke Routes

- `/user/my-orders`
- `/user/my-orders/1555`
- `/user/my-orders/1555/payment`
- `/user/dashboard`
- `/cart`
- `/checkout`
- `/order/STORE-IDEMP-85A06E0B43C64AE4FF069EEB`
- `/`
