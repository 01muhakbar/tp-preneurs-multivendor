# PAY-DUITKU-03: Step 3-10 Implementation Plan

Status: Step 3 completed locally; Step 4-10 remain gated.
Date: 2026-08-06.  
Scope: Step 3 local migration/model package plus planning for Step 4 through Step 10.
Approval: Step 3 local DDL/model package completed; NOT APPROVED for provider calls, callback financial mutation, runtime QRIS refactor, frontend behavior changes, sandbox pass, or production rollout.

This plan assumes Step 1 and Step 2 have local artifacts available:

- `docs/payments/preflight/2026-08-06-migration-runner-validation.md`
- `docs/payments/preflight/2026-08-06-duitku-ddl-preflight.md`

Before implementing any later step, reviewers must explicitly approve the next gate in `duitku-payment-architecture.md`.

## 1. Current Audit

`duitku-payment-architecture.md` is mature enough as a gated architecture and runbook, but it still blocks full implementation.

Current state:

- architecture status is `Pending independent re-audit`;
- migration approval is `NOT APPROVED`;
- runtime implementation approval is `NOT APPROVED`;
- sandbox approval is `NOT APPROVED`;
- production approval is `NOT APPROVED`;
- Step 1 and Step 2 are the only conditionally ready scopes.

Local Step 2 preflight summary:

- base table resolution: clean;
- partial Duitku objects: none found;
- orphan suborders/payments: none found;
- amount anomalies: none found;
- QRIS readiness sampling: none found;
- database target: local `ecommerce_dev`;
- database engine/version: MariaDB `10.4.32`.

Step 3 approval status:

- Step 1 and Step 2 artifacts were committed in `dc5f6ee`;
- Step 3 local migration/model package was approved with conditions on 2026-08-06;
- Step 3 local migration/model package was implemented and reviewed in `docs/payments/migrations/2026-08-06-duitku-step3-migration-review.md`;
- runtime integration, sandbox, and production are still not approved.

## 2. Gate Sequence

Do not implement later steps until their gate sequence is satisfied.

| Gate | Required before | Required evidence |
| --- | --- | --- |
| Gate A: Step 1-2 review | Step 3 | migration runner validation and read-only DDL preflight reviewed |
| Gate B: Migration approval | Step 3 DDL files | approved migration design and rollback guards; granted with conditions for local Step 3 only |
| Gate C: Runtime design approval | Step 4-8 runtime code | raw parser and shared transaction service design accepted |
| Gate D: Runtime test approval | Step 9 sandbox | unit, integration, and race tests passing locally |
| Gate E: Sandbox approval | Step 10 production cohort | sandbox evidence report reviewed |
| Gate F: Production go/no-go | production flag enablement | monitored cohort plan and rollback process approved |

## 3. Step 3: Model Update And Migration Package

Goal: align schema, Sequelize models, TypeScript types, associations, and read models with the approved Duitku schema.

### 3.1 Preconditions

- Step 1 runner validation reviewed.
- Step 2 preflight reviewed.
- Migration approval granted.
- `DB_SYNC=true` disabled for all environments that will run financial migrations.
- `docs/payments/` artifacts tracked or linked in an approved documentation system.

### 3.2 Implementation Tasks

1. Create one approved migration package for the Duitku schema.
2. Create tables:
   - `order_collection_claims`;
   - `order_payment_attempts`;
   - `duitku_callback_inbox`;
   - `order_payment_attempt_events`;
   - `order_payment_security_events`.
3. Alter existing tables:
   - `payments.payment_channel` to include `DUITKU`;
   - `payments.payment_type` to include `DUITKU_POP`;
   - `payments.qr_image_url` to nullable;
   - add `payments.allocation_key`;
   - add `payments.paid_by_order_payment_attempt_id`;
   - `suborders.payment_method` to include `DUITKU`.
4. Add Sequelize models:
   - `OrderCollectionClaim.ts`;
   - `OrderPaymentAttempt.ts`;
   - `DuitkuCallbackInbox.ts`;
   - `OrderPaymentAttemptEvent.ts`;
   - `OrderPaymentSecurityEvent.ts`.
5. Update existing models:
   - `Payment.ts`;
   - `Suborder.ts`;
   - `Order.ts` only if associations or read-model convenience fields are needed;
   - `models/index.ts`.
6. Update internal serializers and read-model builders to represent:
   - parent collection claim;
   - parent Duitku attempt;
   - callback inbox state;
   - seller allocation rows.

### 3.3 Primary Files

- `server/migrations/*.cjs`
- `server/src/models/Payment.ts`
- `server/src/models/Suborder.ts`
- `server/src/models/index.ts`
- new model files under `server/src/models/`
- `server/src/services/orderPaymentAggregation.service.ts`
- payment read-model services under `server/src/services/`

### 3.4 Tests

- `node server/scripts/run-migrations.js --dry-run`
- `pnpm.cmd -F server build`
- migration up on approved local database
- post-DDL structural verification from `duitku-payment-migration-design.md`
- existing `smoke:order-payment`
- existing QRIS checkout/proof smoke

### 3.5 Exit Criteria

- migration applies cleanly on local approved DB;
- post-DDL verification is saved as an artifact;
- TypeScript build passes;
- existing QRIS historical rows remain readable;
- no model uses `qrImageUrl` as required for Duitku rows;
- rollback guard refuses destructive down migration when payment evidence exists.

## 4. Step 4: Duitku Client Service

Goal: isolate Duitku POP communication behind a provider service with safe signing, timeout, redaction, and idempotency behavior.

### 4.1 Preconditions

- Step 3 models and migration package merged in a non-production environment.
- Runtime design approval granted for provider client boundaries.
- Sandbox credentials available only in non-production env.

### 4.2 Implementation Tasks

1. Add Duitku env config:
   - `DUITKU_ENV`;
   - `DUITKU_BASE_URL`;
   - `DUITKU_MERCHANT_CODE`;
   - `DUITKU_API_KEY` or final agreed secret name;
   - `DUITKU_CALLBACK_URL`;
   - `DUITKU_RETURN_URL`;
   - `DUITKU_CREATE_INVOICE_TIMEOUT_MS`;
   - `ENABLE_DUITKU_STATUS_CHECK=false`.
2. Create `server/src/services/duitku/duitkuConfig.service.ts`.
3. Create `server/src/services/duitku/duitkuSignature.service.ts`.
4. Create `server/src/services/duitku/duitkuClient.service.ts`.
5. Implement Create Invoice request builder.
6. Persist outbound request evidence:
   - `provider_call_id`;
   - `merchant_order_id`;
   - request fingerprint;
   - provider reference;
   - payment URL;
   - provider response code/message.
7. Map Create Invoice states:
   - `statusCode = 00` -> attempt `PENDING`;
   - definitive rejection before reference/payment URL -> `FAILED`;
   - timeout/ambiguous result -> `UNKNOWN` and manual review.
8. Keep status check disabled except for explicitly approved sandbox experiments.

### 4.3 Primary Files

- `server/src/services/duitku/*.ts`
- `server/src/services/paymentAttempt*.ts` or equivalent attempt persistence service
- `.env.example`
- `server/.env.example`
- future checkout/payment route integration files

### 4.4 Tests

- unit test HMAC input `merchantCode + timestamp`;
- timeout mapping test;
- response redaction test;
- idempotency replay test;
- mismatched idempotency fingerprint -> HTTP 409 test;
- build.

### 4.5 Exit Criteria

- no provider credential appears in logs or reports;
- Create Invoice does not mark payment `PAID`;
- ambiguous provider result cannot start QRIS fallback;
- attempts are idempotent by `order_id + idempotency_key_hash`.

## 5. Step 5: Callback Route Raw Parser

Goal: safely receive Duitku callbacks without losing raw values required for signature verification.

### 5.1 Preconditions

- Runtime design approval granted.
- Security reviewer approves raw parser design.
- Callback route mount order reviewed against `server/src/app.ts`.

### 5.2 Implementation Tasks

1. Add callback route before global `express.json` and `express.urlencoded`, or add route-specific raw parser that runs before normalized parsing.
2. Enforce:
   - 64 KiB body size;
   - `application/x-www-form-urlencoded`;
   - max 32 fields;
   - max decoded field length 2048 before prefix storage;
   - duplicate-key rejection;
   - nested-key rejection.
3. Preserve exact raw values:
   - `merchantCode`;
   - `amount`;
   - `merchantOrderId`;
   - `reference`;
   - `resultCode`;
   - `signature`.
4. Verify HMAC-SHA256 with input `merchantCode + amount + merchantOrderId`.
5. Use constant-time comparison.
6. Store invalid/malformed/oversized evidence in `order_payment_security_events`.
7. Store valid callbacks first in `duitku_callback_inbox`.
8. Do not bind or mutate financial status until the shared financial transaction service validates the attempt and claim.

### 5.3 Primary Files

- `server/src/app.ts`
- `server/src/routes/duitku.callback.ts`
- `server/src/services/duitku/duitkuCallbackParser.service.ts`
- `server/src/services/duitku/duitkuCallbackInbox.service.ts`
- `server/src/services/duitku/duitkuSecurityEvent.service.ts`

### 5.4 Tests

- valid callback parse test;
- invalid signature writes security event only;
- duplicate key rejected;
- nested key rejected;
- oversized body rejected;
- unsupported content type rejected;
- valid unknown `merchantOrderId` is quarantined;
- route-order test proves global body parser does not run first.

### 5.5 Exit Criteria

- invalid signature cannot create trusted inbox rows;
- malformed input cannot create trusted provider evidence;
- valid callback is durable before HTTP 200;
- financial mutation still disabled until Step 6 service applies it.

## 6. Step 6: Shared Financial Transaction Service

Goal: centralize all guarded financial mutations behind one lock-order implementation.

### 6.1 Preconditions

- Step 3 schema and models available.
- Step 5 callback inbox/security storage available.
- Runtime implementation approval granted.

### 6.2 Implementation Tasks

Create `server/src/services/payments/financialTransaction.service.ts` or equivalent.

Required functions:

```ts
applyDuitkuCallback(input)
activateQrisFallback(input)
approveQrisProof(input)
rejectQrisProof(input)
cancelBuyerPayment(input)
expirePayment(input)
applyDuitkuReconciliation(input)
```

Every function must:

- lock parent `Order` first;
- lock `order_collection_claims` second;
- lock relevant `OrderPaymentAttempt` third;
- lock all parent `Suborder` rows fourth;
- lock stable `Payment` allocation rows fifth;
- lock relevant proof/inbox/event/security rows last;
- validate claim rail and state before any mutation;
- write durable log/event evidence;
- return idempotent read model for duplicate no-ops.

### 6.3 Primary Files

- new shared service under `server/src/services/payments/`
- `server/src/routes/payments.ts`
- `server/src/routes/seller.payments.ts`
- `server/src/services/paymentExpiry.service.ts`
- Duitku callback/reconciliation services
- status log service

### 6.4 Tests

- unit tests for state transition table;
- integration tests with local DB transactions;
- race tests:
  - Duitku paid callback vs QRIS fallback;
  - Duitku paid callback vs seller approval;
  - buyer cancel vs Duitku callback;
  - expiry vs Duitku callback.

### 6.5 Exit Criteria

- code search shows guarded routes no longer update financial state directly;
- QRIS approval requires QRIS claim;
- Duitku paid propagation requires Duitku claim;
- QRIS claim never releases back to Duitku after reject/cancel/expiry;
- duplicate callback and duplicate seller approval are idempotent.

## 7. Step 7: QRIS Guard Refactor

Goal: keep existing manual QRIS behavior safe while Duitku becomes the parent collection rail.

### 7.1 Preconditions

- Step 6 service available.
- QRIS fallback activation behavior approved.
- Existing QRIS regression tests passing before refactor.

### 7.2 Implementation Tasks

1. Refactor buyer proof upload to require:
   - `order_collection_claims.rail = 'QRIS_STATIC'`;
   - `Payment.payment_channel = 'QRIS'`;
   - `Payment.payment_type = 'QRIS_STATIC'`.
2. Refactor seller approve/reject to call shared financial transaction service.
3. Refactor buyer cancellation to call shared financial transaction service.
4. Refactor payment expiry to call shared financial transaction service.
5. Hide or exclude Duitku allocations from seller payment-review lists.
6. Implement QRIS fallback activation:
   - only after definitive Duitku failure or provider-confirmed expiry;
   - snapshot `stores.active_store_payment_profile_id` into `Suborder` and `Payment`;
   - all-or-nothing for every stable seller allocation.

### 7.3 Primary Files

- `server/src/routes/payments.ts`
- `server/src/routes/seller.payments.ts`
- `server/src/services/paymentExpiry.service.ts`
- `server/src/services/sharedContracts/storePaymentProfileCompat.ts`
- seller payment read-model adapters

### 7.4 Tests

- buyer cannot upload QRIS proof for Duitku allocation;
- seller cannot approve QRIS proof for Duitku-claimed order;
- QRIS fallback blocked when attempt is `CREATED`, `PENDING`, `UNKNOWN`, or manual review;
- parent order `PAID` only after every stable QRIS allocation is paid;
- existing manual QRIS historical rows remain readable.

### 7.5 Exit Criteria

- QRIS guarded flows pass regression;
- seller review list excludes Duitku allocations;
- buyer cancellation cannot disturb Duitku paid callback evidence;
- expiry cannot release QRIS claim back to Duitku.

## 8. Step 8: Frontend DTO Changes

Goal: make buyer, seller, and admin UI distinguish parent collection rail from seller allocation status.

### 8.1 Preconditions

- Backend DTO contract approved.
- Runtime read models expose claim/attempt/allocation data.
- Product decision approved for hosted redirect UX and QRIS fallback UX.

### 8.2 Implementation Tasks

1. Add common payment DTO fields:
   - `collectionRail`;
   - `claimState`;
   - `attemptStatus`;
   - `paymentUrl`;
   - `callbackState`;
   - `manualReviewReason`;
   - `allocations`.
2. Update buyer checkout result:
   - show Duitku hosted redirect when `paymentUrl` exists;
   - show QRIS proof upload only for `QRIS_STATIC`.
3. Update account payment pages:
   - return URL reads backend state only;
   - no frontend route marks payment paid.
4. Update seller payment-review pages:
   - hide Duitku allocations;
   - show QRIS review actions only when allowed.
5. Update admin payment audit:
   - show claim;
   - show attempt;
   - show callback inbox;
   - show security events;
   - show seller allocations.

### 8.3 Primary Files

- `client/src/pages/account/AccountOrderPaymentPage.jsx`
- `client/src/pages/account/AccountOrderPayment2026View.jsx`
- `client/src/pages/account/accountOrderPayment2026Adapter.js`
- `client/src/features/sellerWorkspace2026/*Payment*`
- `client/src/pages/admin/AdminPaymentAuditPage.jsx`
- `client/src/pages/admin/AdminPaymentAuditDetailPage.jsx`
- shared payment components under `client/src/components/payments/`

### 8.4 Tests

- buyer Duitku redirect smoke;
- buyer QRIS fallback smoke;
- return URL read-only smoke;
- seller payment-review visibility smoke;
- admin audit rendering smoke;
- mobile/desktop UI screenshot checks for payment pages.

### 8.5 Exit Criteria

- buyer sees only the action valid for current collection rail;
- seller cannot review Duitku allocation;
- admin can see and distinguish quarantined, unknown, duplicate, late, and paid states;
- no existing Stripe or QRIS UI regression.

## 9. Step 9: Sandbox Test Matrix

Goal: prove provider contract and race behavior before any production enablement.

### 9.1 Preconditions

- Steps 3-8 implemented in non-production.
- Sandbox merchant code and secret configured.
- Callback URL reachable from Duitku sandbox.
- Test data seeded with buyer, sellers, products, stores, and active QRIS profiles.

### 9.2 Required Scenarios

Run and save evidence for:

- Create Invoice success with payment URL;
- Create Invoice definitive rejection;
- Create Invoice timeout or ambiguous response;
- idempotent Create Invoice replay with matching fingerprint;
- idempotent Create Invoice replay with mismatched fingerprint;
- valid paid callback `resultCode = 00`;
- valid failed callback `resultCode = 01`;
- invalid signature callback;
- malformed form callback;
- duplicate callback delivery;
- unknown `merchantOrderId`;
- late paid callback after QRIS fallback claim;
- return URL before payment;
- return URL after payment;
- return URL after failed payment;
- QRIS fallback after definitive Duitku failure;
- QRIS fallback after provider-confirmed expiry;
- concurrent Duitku callback vs QRIS fallback;
- concurrent seller approval vs late Duitku callback.

### 9.3 Artifact Location

Save sandbox evidence under:

```text
docs/payments/sandbox/YYYY-MM-DD-duitku-sandbox-evidence.md
```

### 9.4 Exit Criteria

- every required scenario has pass/fail evidence;
- every failure has remediation owner;
- invalid/malformed callbacks never mutate financial state;
- browser return URL never mutates financial state;
- no production approval until sandbox report is reviewed.

## 10. Step 10: Production Rollout Feature-Flagged

Goal: enable Duitku gradually without disrupting QRIS and Stripe paths.

### 10.1 Preconditions

- Sandbox approval granted.
- Production merchant account confirmed.
- Callback URL configured in Duitku dashboard.
- Operations process approved for unknown/quarantine/late callback states.
- Rollback process approved.

### 10.2 Feature Flags

Required flags:

- `ENABLE_DUITKU_RAIL=false`;
- `ENABLE_DUITKU_CREATE_INVOICE=false`;
- `ENABLE_DUITKU_CALLBACK_PROCESSING=false`;
- `ENABLE_DUITKU_QRIS_FALLBACK=false`;
- `ENABLE_DUITKU_ADMIN_RECOVERY=false`;
- `ENABLE_DUITKU_STATUS_CHECK=false`;
- optional allowlist flag or allowlist IDs for internal cohort.

### 10.3 Rollout Sequence

1. Deploy schema and models with all Duitku flags off.
2. Deploy read-only admin visibility for claims/attempts/inbox/security events.
3. Enable callback storage only if callback route has passed sandbox validation.
4. Enable Create Invoice for internal allowlist only.
5. Monitor:
   - attempt count;
   - `UNKNOWN` attempts;
   - quarantined callbacks;
   - duplicate callbacks;
   - invalid signatures;
   - late callbacks;
   - QRIS fallback cases.
6. Expand cohort only after go/no-go review.
7. Keep status check disabled until separately approved.

### 10.4 Rollback

Rollback disables new Duitku creation and fallback entry points. It must not delete or overwrite:

- attempts;
- claims;
- callback inbox;
- security events;
- status logs;
- seller allocations.

### 10.5 Exit Criteria

- disabling feature flags stops new Duitku attempts;
- existing QRIS and Stripe flows continue;
- operations can manually review `UNKNOWN` and quarantined states;
- go/no-go report is signed off before broader enablement.

## 11. Recommended Implementation Order After Review

Recommended next sequence:

1. Commit or otherwise officially track `docs/payments/` architecture and preflight artifacts.
2. Review Step 1 migration runner validation.
3. Review Step 2 DDL preflight report.
4. Grant or reject migration approval.
5. If approved, implement Step 3 migration and models.
6. Run post-DDL structural verification.
7. Request runtime integration approval.
8. Implement Steps 4-8 behind feature flags.
9. Run local unit, integration, race, and smoke tests.
10. Request sandbox approval.
11. Execute Step 9 sandbox matrix and save evidence.
12. Request production go/no-go.
13. Execute Step 10 feature-flagged rollout.

## 12. Explicit Non-Goals

This plan does not approve:

- running Duitku DDL;
- calling Duitku APIs;
- accepting production callbacks;
- changing financial state from callback;
- enabling production Duitku checkout;
- enabling Duitku status check.

Those actions require the gate approvals listed above.
