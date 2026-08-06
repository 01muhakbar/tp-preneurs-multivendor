# PAY-DUITKU-STEP3: Local Migration And Model Review

Date: 2026-08-06  
Environment: local development  
Reviewer: Codex developer audit  
Scope: Step 3 local migration/model package only.

## Decision

Step 3 local migration/model package: PASS.  
Runtime integration gate for Step 4: NOT APPROVED by this review.  
Sandbox and production gates: NOT APPROVED.

This review confirms the local schema/model package only. It does not approve Duitku provider calls, callback financial mutation, QRIS fallback activation, seller QRIS guard runtime refactor, frontend payment behavior changes, sandbox pass, staging rollout, or production rollout.

## Files Reviewed

- `server/migrations/20260806090000-add-duitku-payment-foundation.cjs`
- `server/src/models/OrderCollectionClaim.ts`
- `server/src/models/OrderPaymentAttempt.ts`
- `server/src/models/DuitkuCallbackInbox.ts`
- `server/src/models/OrderPaymentAttemptEvent.ts`
- `server/src/models/OrderPaymentSecurityEvent.ts`
- `server/src/models/Payment.ts`
- `server/src/models/Suborder.ts`
- `server/src/models/Order.ts`
- `server/src/models/index.ts`
- `docs/payments/migrations/2026-08-06-duitku-step3-post-ddl-verification.md`

## Migration Scope

Created tables:

- `order_collection_claims`
- `order_payment_attempts`
- `duitku_callback_inbox`
- `order_payment_attempt_events`
- `order_payment_security_events`

Altered existing tables:

- `payments.payment_channel` accepts `QRIS` and `DUITKU`.
- `payments.payment_type` accepts `QRIS_STATIC` and `DUITKU_POP`.
- `payments.qr_image_url` is nullable.
- `payments.allocation_key` added with unique index.
- `payments.paid_by_order_payment_attempt_id` added with FK to `order_payment_attempts`.
- `suborders.payment_method` accepts `QRIS` and `DUITKU`.

Rollback guard:

- down migration refuses rollback when any Duitku foundation table contains rows;
- down migration refuses rollback when payments contain `DUITKU`, `DUITKU_POP`, `allocation_key`, or `paid_by_order_payment_attempt_id`;
- down migration refuses rollback when suborders contain `payment_method = 'DUITKU'`.

## Validation Commands

```powershell
node --check server\migrations\20260806090000-add-duitku-payment-foundation.cjs
```

Result: pass.

```powershell
node server\scripts\run-migrations.js --dry-run
```

Result: pass.

```powershell
pnpm.cmd -F server build
```

Result: pass.

```powershell
$env:CJS_MIGRATIONS='20260806090000-add-duitku-payment-foundation.cjs'
node server\scripts\run-migrations.js
Remove-Item Env:CJS_MIGRATIONS
```

Result: pass. Migration was applied to local `ecommerce_dev`.

```powershell
node server\scripts\duitku-preflight.js --output docs\payments\migrations\2026-08-06-duitku-step3-post-ddl-verification.md
```

Result: pass. Post-DDL read-only verification artifact was generated.

```powershell
pnpm.cmd -F server smoke:order-payment
```

Result: not executed successfully because the HTTP target server was not running locally. Failure was `ECONNREFUSED`. This is a test environment gap, not a migration/model compile failure.

## Local Database Evidence

Read-only structural check result:

```json
[
  {
    "check_name": "future_tables",
    "value": 5
  },
  {
    "check_name": "future_table_rows",
    "value": 0
  },
  {
    "check_name": "duitku_migration_records",
    "value": 1
  },
  {
    "check_name": "payment_duitku_rows",
    "value": 0
  },
  {
    "check_name": "suborder_duitku_rows",
    "value": 0
  }
]
```

Interpretation:

- all five Duitku foundation tables exist;
- no Duitku payment evidence rows were created by Step 3;
- the migration record exists;
- existing QRIS rows remain outside the new stable-allocation scope unless `allocation_key` is later populated by an approved runtime service.

## Issue Found And Fixed

Initial local migration attempt failed while altering MariaDB enum columns because `queryInterface.changeColumn` rendered `Sequelize.literal(...)` as `[object Object]`.

Remediation:

- enum and nullable QR image alterations were changed to raw `ALTER TABLE ... MODIFY` statements;
- migration was rerun idempotently using `CJS_MIGRATIONS`;
- the migration then completed and inserted the migration record.

## Remaining Gates

Still blocked:

- Step 4 Duitku client service;
- callback raw parser route;
- shared financial transaction service;
- QRIS guard runtime refactor;
- frontend DTO/payment behavior changes;
- sandbox matrix;
- production rollout.

## Next Required Decision

Before any Step 4 work, record an explicit runtime gate decision:

```text
Step 4 runtime integration gate: APPROVED / NOT APPROVED.
Approved scope:
Reviewer:
Date:
Evidence:
```
