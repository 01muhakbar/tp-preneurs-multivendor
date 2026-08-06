# PAY-DUITKU-08: Step 5 Callback Raw Parser Review

Date: 2026-08-06.  
Environment: local development only.  
Decision: COMPLETED / PASS for Step 5 local/non-production callback raw parser only.

## Scope

Implemented:

- `POST /api/payments/duitku/callback` mounted before global `express.json` and `express.urlencoded`.
- Route-specific raw parser for `application/x-www-form-urlencoded` with 64 KiB limit.
- Duplicate-key, nested-key, missing-field, oversized-body, and unsupported-content-type rejection.
- Callback HMAC-SHA256 verification from raw field values: `merchantCode + amount + merchantOrderId`.
- Constant-time signature comparison.
- Valid signed callbacks written to `duitku_callback_inbox` as `QUARANTINED`.
- Invalid signature, malformed, and oversized callbacks written to `order_payment_security_events`.
- Duplicate valid callbacks increment duplicate metadata.

Not implemented:

- no order, suborder, payment, claim, allocation, or financial status mutation;
- no checkout route integration;
- no QRIS fallback activation;
- no frontend DTO changes;
- no sandbox provider callback evidence;
- no production route approval.

## Provider Contract Checked

Official Duitku POP documentation reviewed:

- https://docs.duitku.com/pop/en/
- https://docs.duitku.com/pop/id/

Relevant contract:

- callback body is `application/x-www-form-urlencoded`;
- callback includes `merchantCode`, `amount`, `merchantOrderId`, `signature`, `resultCode`, and `reference`;
- callback signature uses HMAC-SHA256 over `merchantCode + amount + merchantOrderId` with the merchant API key.

## Local Files

- `server/src/routes/duitku.callback.ts`
- `server/src/services/duitku/duitkuCallbackParser.service.ts`
- `server/src/services/duitku/duitkuCallbackSigner.service.ts`
- `server/src/services/duitku/duitkuCallbackStorage.service.ts`
- `server/src/scripts/smokeDuitkuStep5Callback.ts`
- `server/src/app.ts`
- `server/package.json`

## Validation

Commands:

```powershell
pnpm.cmd -F server build
pnpm.cmd -F server smoke:duitku-step5-callback
```

Result:

- build passed;
- valid signed callback stored without financial mutation;
- duplicate valid callback handled idempotently;
- invalid signature stored only as security event;
- missing required field rejected as malformed;
- duplicate form key rejected;
- nested form key rejected;
- unsupported content-type rejected before global JSON parser.

## Approval Boundary

Step 5 is approved and completed only for local/non-production callback raw parsing and evidence storage.

The next gate is Step 6: Shared Financial Transaction Service. It remains NOT APPROVED until explicitly approved. Step 6 must own all financial state transitions and lock-order behavior before any Duitku callback can mark orders, suborders, payments, claims, or allocations as paid or failed.
