# PAY-DUITKU-01: Architecture Decision Record Integrasi Duitku

Architecture status: Pending independent re-audit.  
Planning readiness: STEP 1 THROUGH STEP 5 COMPLETED LOCALLY UNDER LIMITED APPROVALS.
Step 1 local review: COMPLETED / PASS.  
Step 2 local review: COMPLETED / PASS.  
Step 3 local migration/model review: COMPLETED / PASS.
Migration approval: APPROVED WITH CONDITIONS FOR STEP 3 LOCAL MIGRATION/MODEL PACKAGE ONLY.
Step 4 local client service review: COMPLETED / PASS.
Step 5 local callback raw parser review: COMPLETED / PASS.
Runtime implementation approval: APPROVED WITH CONDITIONS FOR STEP 4 CLIENT SERVICE AND STEP 5 CALLBACK RAW PARSER LOCAL/NON-PRODUCTION ONLY.
Sandbox approval: NOT APPROVED.  
Production approval: NOT APPROVED.  
Date: 2026-08-05.  
Scope: gated local implementation review and approval tracking.

This document now approves Step 4 local/non-production Duitku client service work and Step 5 local/non-production callback raw parser work only. It does not approve checkout route integration, staging/production database mutation, real user-flow provider calls, callback financial mutation, QRIS fallback activation, frontend payment behavior changes, sandbox approval, or production rollout.

## 1. Baseline

Provider baseline:

- Duitku POP documentation: https://docs.duitku.com/pop/en/ and https://docs.duitku.com/pop/id/
- Use Duitku POP Hosted Checkout/redirect.
- Use POP HMAC-SHA256. Do not mix with old MD5 API contracts.
- One Duitku transaction maps to one parent `Order`.
- Parent `Order` can still contain many seller `Suborder` rows.
- Customer collection uses the platform Duitku merchant account.
- Seller settlement stays manual in phase one.
- Static QRIS remains fallback and historical compatibility.
- Stripe legacy stays unchanged.

Repo source inspected on branch `main`:

- `server/src/models/User.ts`
- `server/src/models/Order.ts`
- `server/src/models/Suborder.ts`
- `server/src/models/Payment.ts`
- `server/src/models/PaymentProof.ts`
- `server/src/models/PaymentStatusLog.ts`
- `server/src/models/Store.ts`
- `server/src/models/StorePaymentProfile.ts`
- `server/src/models/index.ts`
- `server/src/routes/checkout.ts`
- `server/src/routes/payments.ts`
- `server/src/routes/seller.payments.ts`
- `server/src/routes/admin.payments.audit.ts`
- `server/src/routes/seller.workspace.ts`
- `server/src/services/paymentExpiry.service.ts`
- `server/src/services/orderPaymentAggregation.service.ts`
- `server/src/services/paymentStatusLog.service.ts`
- `server/src/config/database.ts`
- `server/scripts/run-migrations.js`
- `package.json`
- `server/package.json`
- selected files under `server/migrations/`

Current source risk: `server/src/routes/seller.payments.ts` can approve QRIS proof and mark seller allocation/suborder paid without first locking parent `Order` and without checking a parent Duitku winner. Future implementation must fix that route surface.

## 2. Current Payment Model

Today the multivendor manual QRIS path creates:

- one parent `Order`;
- one or more seller `Suborder` rows;
- one seller allocation `Payment` row per suborder;
- buyer `PaymentProof`;
- seller proof review;
- allocation `PaymentStatusLog`.

Current constraints:

- `Suborder.payment_method` accepts `QRIS`.
- `Payment.payment_channel` accepts `QRIS`.
- `Payment.payment_type` accepts `QRIS_STATIC`.
- `Payment.qr_image_url` is required.
- local expiry service expires `Payment.status = CREATED`.
- buyer cancellation restores suborder inventory.

## 3. Final Collection Rail Model

Phase one adds a parent-level durable collection claim.

Final table: `order_collection_claims`.

Purpose:

- store the exclusive collection rail for a parent order;
- prevent Duitku and QRIS from winning together;
- block seller proof approval when the parent rail is not QRIS;
- block Duitku paid propagation when the parent rail is QRIS;
- separate rail availability, rail activation, exclusive claim, and settlement final paid state.

Definitions:

- Rail available: configuration/profile checks say a rail can be offered.
- Rail activated: user-facing payment rail has been created, e.g. Duitku payment URL or QRIS fallback snapshots.
- Collection claim: `order_collection_claims` row grants exclusive collection rights for the parent order.
- Collection winner: the claimed rail after `claim_state = 'PAID'`; no other rail can obtain settlement rights after this state.
- Settlement final `PAID`: parent order, all suborders, stable allocations, and claim are marked paid from a trusted rail.

Exclusive constraint:

- `order_collection_claims.order_id` has `UNIQUE KEY uniq_occ_order_id (order_id)`.
- A parent order can have one claim row at a time.
- Claim rail can move from `DUITKU_POP` to `QRIS_STATIC` only inside the approved fallback transaction after Duitku is definitively failed, provider-confirmed expired, or rejected before reference/payment URL existed.
- Claim rail can never move away from `PAID`.

Claim timing:

- Duitku obtains claim in the same transaction that stores Create Invoice `statusCode = 00`, provider reference, and payment URL.
- QRIS fallback obtains claim in the same transaction that switches every seller allocation to QRIS and snapshots active QRIS profiles.

## 4. Race Prevention

All financial mutation paths must acquire locks in one order:

1. parent `Order` row using `FOR UPDATE`;
2. parent `order_collection_claims` row using `FOR UPDATE`, creating it under the parent lock when needed;
3. relevant `OrderPaymentAttempt` rows using `FOR UPDATE`;
4. all `Suborder` rows for the parent order using `FOR UPDATE`;
5. stable `Payment` allocation rows using `FOR UPDATE`;
6. relevant `PaymentProof`, callback inbox, provider event, and security event rows using `FOR UPDATE`.

No financial path may use a different lock order.

Paths using this order:

- Duitku callback;
- Duitku reconciliation;
- QRIS fallback activation;
- seller QRIS proof approval/reject;
- buyer cancellation;
- payment expiry.

Race rules:

- Duitku callback must not propagate paid if `order_collection_claims.rail = 'QRIS_STATIC'`.
- QRIS seller proof approval must fail unless `order_collection_claims.rail = 'QRIS_STATIC'` and `claim_state = 'CLAIMED'`.
- QRIS fallback must fail if Duitku claim is `PAID` or Duitku attempt can still become paid.
- Buyer cancellation and expiry cannot release a QRIS claim back to Duitku.
- Late valid Duitku paid callback after QRIS claim is stored as trusted callback evidence and quarantined for manual review; it cannot mark allocations paid.

## 5. QRIS Seller Approval

QRIS fallback supports many sellers while still using one parent claim.

Rules:

- QRIS fallback activation claims `QRIS_STATIC` for the whole parent order.
- Each seller proof approval can mark only its seller stable allocation and suborder paid.
- Partial seller approval keeps the parent claim as `QRIS_STATIC`; Duitku cannot win again.
- Parent `Order.payment_status = 'PAID'` only when every stable QRIS allocation for the parent is `PAID`.
- When the last stable QRIS allocation becomes `PAID`, the same transaction marks `order_collection_claims.claim_state = 'PAID'`.
- Duplicate seller approval is idempotent when the latest proof is already approved and the allocation is already paid; return the current read model.
- Seller reject under QRIS claim marks that seller allocation rejected and keeps the parent claim `QRIS_STATIC`.
- QRIS expiry under QRIS claim can expire eligible QRIS allocations and can move the claim to `EXPIRED` only when all stable allocations are terminal and none is paid.
- Buyer cancel under QRIS claim can cancel eligible QRIS allocations and can move the claim to `CANCELLED` only when all stable allocations are terminal and none is paid.
- None of reject, expiry, or cancel after QRIS claim can give collection rights back to Duitku.

`server/src/routes/seller.payments.ts` is a mandatory implementation surface for these guards.

## 6. Duitku POP Contracts

Create Invoice:

- backend JSON request;
- HMAC-SHA256 request signature uses `merchantCode + timestamp`;
- `statusCode = 00` means invoice/reference/payment URL created;
- Create Invoice `statusCode = 00` maps attempt to `PENDING`, not `PAID`.

Provider callback:

- HTTP `POST`;
- `Content-Type: application/x-www-form-urlencoded`;
- no inbound timestamp participates in callback signature;
- signing input is exact raw form string concatenation `merchantCode + amount + merchantOrderId`;
- HMAC-SHA256 uses merchant key;
- verify against exact raw received string values before trimming, casting, formatting, parsing, or normalizing;
- `resultCode = 00` maps to `PAID`;
- `resultCode = 01` maps to `FAILED`;
- financial status changes only after signature, merchant, order, reference, amount, state transition, and collection claim checks pass;
- invalid signature never changes financial status;
- HTTP 200 is returned only after durable storage as applied, ignored, quarantined, or duplicate-delivery metadata update;
- HTTP 5xx is returned only for transient internal failure safe for provider retry.

Return URL:

- browser-facing only;
- reads backend state;
- never changes financial status.

Status check:

- `ENABLE_DUITKU_STATUS_CHECK=false` by default;
- enable only after sandbox validates request, response, security behavior, status mapping, replay, and rate limit behavior.

## 7. Valid Callback Inbox

Final decision: valid callbacks first enter durable inbox storage. Binding to an attempt occurs after signature validation.

Table: `duitku_callback_inbox`.

Uses:

- valid callback that binds to an attempt;
- valid callback with unknown `merchantOrderId`;
- valid callback that cannot be safely bound;
- valid callback blocked by a QRIS collection claim.

Processing:

1. enforce endpoint limits and content type;
2. capture raw bytes digest;
3. parse form with duplicate-key and nested-key rejection;
4. verify signature using raw field values;
5. insert or update `duitku_callback_inbox`;
6. bind to attempt only after signature is valid;
7. when binding fails, keep `binding_state = 'UNBOUND'` or `AMBIGUOUS` and `processing_result = 'QUARANTINED'`;
8. unbound valid callback never changes financial status;
9. HTTP 200 only after durable inbox/quarantine write;
10. transient database failure returns 5xx.

Invalid-signature and malformed callbacks stay outside trusted provider events and do not consume trusted callback occurrence keys.

Manual resolution of a quarantined callback requires revalidation of merchant, order, reference, amount, current collection claim, and allowed state transition.

## 8. Callback Security Limits

Endpoint protection:

- maximum HTTP body size: 64 KiB;
- maximum form fields: 32;
- maximum decoded field length: 2048 bytes before bounded prefix storage;
- reject duplicate form keys;
- reject nested key syntax;
- enforce `application/x-www-form-urlencoded`;
- request timeout: 5 seconds;
- rate limit: 60 callback requests per minute per source IP and 600 per merchant code per minute;
- constant-time signature comparison.

Security storage:

- invalid signature event type: `CALLBACK_INVALID_SIGNATURE`;
- malformed form event type: `CALLBACK_MALFORMED`;
- oversized body event type: `CALLBACK_OVERSIZED`;
- store bounded prefixes for investigation;
- store SHA-256 digests for raw bytes and complete raw values;
- never store merchant key, signature secret, raw credentials, card data, or sensitive payment credentials.

HTTP outcomes:

- invalid signature: durable security event then HTTP 200;
- malformed request: durable security event then HTTP 400;
- oversized request: durable security event then HTTP 413;
- unsupported content type: HTTP 415 after bounded security metadata write when body can be safely sampled;
- transient persistence failure: HTTP 5xx.

## 9. Create Invoice Idempotency

Final constraint:

```sql
UNIQUE KEY uniq_opa_order_idempotency
  (order_id, idempotency_key_hash)
```

Keep:

```sql
UNIQUE KEY uniq_opa_merchant_order_id
  (merchant_order_id)
```

Semantics:

- same idempotency key and same canonical request fingerprint: replay existing attempt state;
- same idempotency key and different fingerprint: reject HTTP 409;
- same key while attempt creation is in progress: return deterministic processing response;
- concurrent requests cannot create two attempts for the same parent order and key;
- existing attempt merchant order ID is immutable;
- provider retry never swaps merchant order ID silently.

Relationships:

- client/server idempotency key is canonicalized and hashed into `idempotency_key_hash`;
- canonical request payload is hashed into `request_fingerprint`;
- `merchant_order_id` is generated once per attempt;
- each outbound Create Invoice call has a `provider_call_id`;
- Duitku replay window is handled by reusing the same attempt and merchant order ID, never by creating a hidden replacement.

## 10. Payment Attempt Status

`OrderPaymentAttempt.status` values:

- `CREATED`;
- `PENDING`;
- `PAID`;
- `FAILED`;
- `CANCELLED`;
- `EXPIRED`;
- `UNKNOWN`.

Ambiguous provider state uses:

- `status = 'UNKNOWN'`;
- `requires_manual_review = true`;
- controlled `manual_review_reason`.

Allowed transitions:

| From | To | Evidence |
| --- | --- | --- |
| `CREATED` | `PENDING` | Create Invoice `statusCode = 00` and Duitku claim acquired |
| `CREATED` | `FAILED` | definitive Create Invoice rejection before reference/payment URL |
| `CREATED` | `UNKNOWN` | timeout or uncertain Create Invoice result |
| `PENDING` | `PAID` | valid callback `resultCode = 00`, binding checks, amount checks, and Duitku claim |
| `PENDING` | `FAILED` | valid callback `resultCode = 01` and all checks |
| `PENDING` | `EXPIRED` | provider-confirmed final expiry |
| `PENDING` | `UNKNOWN` | conflicting provider evidence |
| `UNKNOWN` | `PAID` | validated recovery and Duitku claim |
| `UNKNOWN` | `FAILED` | validated recovery |
| `UNKNOWN` | `EXPIRED` | validated recovery |

## 11. QRIS Fallback Eligibility

Fallback cannot start when a Duitku attempt is:

- `CREATED`;
- `PENDING`;
- `UNKNOWN`;
- `requires_manual_review = true`.

Fallback can start only when:

- attempt is definitively `FAILED`; or
- provider confirms final `EXPIRED`; or
- Create Invoice is rejected before provider reference and payment URL exist.

Fallback is parent-scoped, atomic, all-or-nothing, and obtains `order_collection_claims.rail = 'QRIS_STATIC'` in the same transaction that changes every stable allocation to QRIS.

## 12. Exact QRIS Profile Readiness

Authoritative source: `stores.active_store_payment_profile_id`.

A store is eligible for QRIS fallback only when:

- `stores.status = 'ACTIVE'`;
- `stores.active_store_payment_profile_id IS NOT NULL`;
- profile id equals `stores.active_store_payment_profile_id`;
- profile `store_id` equals store id;
- profile `is_active = 1`;
- profile `verification_status = 'ACTIVE'`;
- profile `snapshot_status = 'ACTIVE'`;
- profile `provider_code = 'MANUAL_QRIS'`;
- profile `payment_type = 'QRIS_STATIC'`;
- profile `qris_image_url` is present and non-empty;
- profile fields required by current QRIS rendering are valid.

Do not use `suborders.store_payment_profile_id` for readiness before fallback. Snapshot to `Suborder.store_payment_profile_id`, `Payment.store_payment_profile_id`, QR image, and QR payload only inside the fallback activation transaction.

## 13. Channel Guard Matrix

| Flow | Required guard |
| --- | --- |
| Buyer proof upload | `order_collection_claims.rail = 'QRIS_STATIC'` and `Payment.payment_channel = 'QRIS'` and `Payment.payment_type = 'QRIS_STATIC'` |
| Seller proof approval | same QRIS claim guard plus parent lock and proof lock |
| Seller proof reject | same QRIS claim guard |
| Buyer cancellation | parent lock, claim lock, QRIS-only mutation unless no provider claim exists |
| Payment expiry | parent lock, claim lock, QRIS-only expiry |
| Inventory restoration | only after QRIS cancel/expiry rules pass under claim lock |
| Seller payment-review list | excludes Duitku allocations |
| Admin read model | shows collection claim, parent attempt, callback inbox, and allocations separately |
| Buyer read model | shows parent rail and seller allocation states separately |
| Payment status log | records channel, actor, and claim context |

## 14. Reconciliation

Default flag:

- `ENABLE_DUITKU_STATUS_CHECK=false`.

When enabled in a later approved task:

- initial retry delay: 5 minutes;
- backoff multiplier: 2;
- maximum delay: 60 minutes;
- jitter: 0 to 20 percent;
- maximum attempts: 12;
- retry only due attempts with `next_reconcile_at <= NOW()`;
- rate limit records `RATE_LIMIT` and schedules capped retry;
- timeout records `TIMEOUT` and schedules capped retry;
- retry exhaustion sets `UNKNOWN`, `requires_manual_review = true`, and `manual_review_reason = 'RECONCILE_RETRY_EXHAUSTED'`.

Reconciliation uses the final lock order and cannot mark paid unless the claim row belongs to Duitku.

## 15. Sync And Migration Risk

Runtime DB config supports `DATABASE_URL` or `DB_*`. Migration runner currently uses a smaller `DB_*` set and does not follow `DATABASE_URL`, `DB_PORT`, SSL, or runtime dialect settings.

Invariants:

- do not use `syncDb()` for Duitku schema;
- do not run old model definitions through `sequelize.sync({ alter: true })` after official financial migrations;
- future migrations fail loudly when base tables cannot be resolved;
- migration runner/runtime connection mismatch must be fixed before applying Duitku migrations to environments that rely on runtime-only settings.

## 16. Validation Gates

Sandbox:

- callback fields and signature behavior;
- Create Invoice replay behavior;
- status-check contract before enabling status check;
- hosted redirect and return URL behavior;
- provider field acceptance.

Live schema:

- physical table names and case variants;
- table engine and MySQL version;
- existing columns, indexes, foreign keys, and enum definitions;
- historical payment classification;
- claim/inbox partial migration state.

Merchant account:

- sandbox/production merchant separation;
- enabled payment methods;
- callback setup;
- manual seller settlement policy.

## 17. Approval Gate Matrix

Approval is split into separate gates. Passing one gate does not imply approval for later gates.

| Gate | Current status | Approval requirement | Required artifact |
| --- | --- | --- | --- |
| Architecture | Pending independent re-audit | second-pass audit confirms provider contract, claim model, lock order, callback storage, QRIS fallback, migration safety, and rollout plan | independent audit note |
| Step 1 and Step 2 planning | Conditionally ready | implementation stays limited to migration runner fix and read-only DDL preflight | implementation task note |
| Migration | APPROVED WITH CONDITIONS FOR STEP 3 LOCAL MIGRATION/MODEL PACKAGE ONLY | migration runner/runtime target match is proven, read-only preflight is clean or remediated, DDL is reviewed against live schema, and rollback guards are documented | DDL preflight report and migration review |
| Runtime integration | APPROVED WITH CONDITIONS FOR STEP 4 CLIENT SERVICE AND STEP 5 CALLBACK RAW PARSER LOCAL/NON-PRODUCTION ONLY | shared financial transaction service, Duitku client, raw callback route, QRIS guards, DTOs, and route refactors pass automated validation | runtime test report |
| Sandbox | NOT APPROVED | sandbox matrix passes with saved evidence for Create Invoice, callback, return URL, fallback, duplicate, invalid, malformed, unknown, and race scenarios | sandbox evidence report |
| Production | NOT APPROVED | feature flags, monitored cohort, rollback plan, operations process, and go/no-go review are complete | production go/no-go report |

Rules:

- no DDL can be created or run from architecture approval alone;
- no provider callback can mutate financial state before the raw parser and shared transaction service are approved;
- no production Create Invoice can be enabled before sandbox evidence is reviewed;
- production rollback disables new Duitku creation but preserves durable attempts, callbacks, security events, and allocation evidence.

## 18. Implementation Readiness Requirements

These requirements close the current gates before the plan can move from documentation into approved implementation.

### Current Approval Scope

Current approval is intentionally narrow.

Approved scope:

- Step 1 may change migration-runner code and related validation scripts;
- Step 2 may run read-only schema preflight and produce documentation artifacts;
- Step 3 may create and validate local migration/model package only;
- Step 3 local migration execution is allowed only against the approved local development database target;
- Step 4 may create local/non-production Duitku client service, config validation, HMAC signer, DTO mapping, redaction helper, offline tests, and unmounted persistence helper.
- Step 5 may create local/non-production callback raw parser route, callback HMAC verification, callback inbox writes for valid signed callbacks, security-event writes for invalid/malformed callbacks, and parser smoke tests without financial mutation.

Not approved:

- Duitku DDL creation or execution outside approved local Step 3 migration/model package scope;
- production or staging database mutation;
- Duitku Create Invoice provider calls from checkout or real user flow;
- Duitku callback financial mutation;
- production callback route enablement;
- QRIS fallback activation;
- seller proof guard refactor in production routes;
- frontend payment behavior changes;
- sandbox approval;
- production rollout.

Exit criteria:

- any implementation issue or PR states the exact approved scope;
- any task beyond Step 5 requires a new approval decision.

### Decision Log

Approval decisions must be recorded in this document or in a linked artifact.

Required format:

| Date | Decision | Scope | Approver | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- |
| 2026-08-05 | Planning only; Step 1 and Step 2 conditionally ready | migration runner fix and read-only DDL preflight | pending | this ADR | independent re-audit and preflight artifact |
| 2026-08-06 | Step 1 and Step 2 local review completed; Step 3 remains blocked | migration runner fix and read-only DDL preflight evidence package | Codex developer audit; pending team approver | `docs/payments/audits/2026-08-06-step1-step2-local-review.md`, `docs/payments/preflight/2026-08-06-migration-runner-validation.md`, `docs/payments/preflight/2026-08-06-duitku-ddl-preflight.md` | track/commit artifacts and record explicit Step 3 migration gate decision |
| 2026-08-06 | Step 3 approved with conditions for local migration/model package only | migration files, Sequelize models, associations, rollback guard, local validation, and migration review artifact | user approval in Codex session | Step 1/2 review package in commit `dc5f6ee`; `docs/payments/duitku-step3-10-implementation-plan.md` | runtime integration, sandbox, and production remain not approved |
| 2026-08-06 | Step 3 local migration/model review completed | local DDL applied to `ecommerce_dev`, Sequelize models compiled, post-DDL verification generated | Codex developer audit; pending team approver | `docs/payments/migrations/2026-08-06-duitku-step3-migration-review.md`, `docs/payments/migrations/2026-08-06-duitku-step3-post-ddl-verification.md` | record explicit Step 4 runtime integration gate decision |
| 2026-08-06 | Step 4 approved with conditions for local/non-production client service only | Duitku config validation, HMAC signer, DTO mapping, redaction helper, offline client tests, and unmounted persistence helper | user approval in Codex session | Step 3 review package in commit `fba537e`; official Duitku POP Create Invoice documentation | callback route, shared financial transaction service, QRIS guard refactor, frontend DTO changes, sandbox, and production remain not approved |
| 2026-08-06 | Step 4 local client service review completed | offline Duitku client service, signer, config, DTO, redaction, persistence helper, and smoke validation | Codex developer audit; pending team approver | `docs/payments/runtime/2026-08-06-duitku-step4-client-review.md` | record explicit Step 5 callback raw parser gate decision |
| 2026-08-06 | Step 5 approved with conditions for local/non-production raw parser only | callback route raw parser, callback HMAC verification, valid callback inbox storage, invalid/malformed security-event storage, and smoke validation without financial mutation | user approval in Codex session | Step 4 review package in commit `e7423a1`; official Duitku POP callback documentation | shared financial transaction service, QRIS guard refactor, frontend DTO changes, sandbox, and production remain not approved |
| 2026-08-06 | Step 5 local callback raw parser review completed | raw form parser mounted before global body parsers, duplicate/nested rejection, constant-time callback HMAC verification, callback inbox/security-event separation, and no financial mutation | Codex developer audit; pending team approver | `docs/payments/runtime/2026-08-06-duitku-step5-callback-parser-review.md` | record explicit Step 6 shared financial transaction service gate decision |

Rules:

- a decision must state what is approved and what is still blocked;
- approval for one gate does not imply approval for later gates;
- production approval must reference sandbox evidence and go/no-go review;
- unresolved follow-up items must have an owner or remain blocking.

### Artifact Index

The following artifacts are required before each approval gate can pass.

| Artifact | Required before | Location |
| --- | --- | --- |
| independent audit note | architecture approval | `docs/payments/audits/` |
| Step 1 and Step 2 local review note | migration approval package | `docs/payments/audits/2026-08-06-step1-step2-local-review.md` |
| migration runner validation report | migration approval | `docs/payments/preflight/` |
| DDL preflight report | migration approval | `docs/payments/preflight/` |
| Step 3-10 implementation plan | migration/runtime/sandbox/production approval sequencing | `docs/payments/duitku-step3-10-implementation-plan.md` |
| migration review report | migration approval | `docs/payments/migrations/` |
| Step 3 local migration/model review | Step 4 runtime approval package | `docs/payments/migrations/2026-08-06-duitku-step3-migration-review.md` |
| Step 3 post-DDL verification | Step 4 runtime approval package | `docs/payments/migrations/2026-08-06-duitku-step3-post-ddl-verification.md` |
| runtime test report | runtime integration approval | `docs/payments/runtime/` |
| Step 4 client service review | Step 5 callback parser approval package | `docs/payments/runtime/2026-08-06-duitku-step4-client-review.md` |
| Step 5 callback parser review | Step 6 shared financial transaction service approval package | `docs/payments/runtime/2026-08-06-duitku-step5-callback-parser-review.md` |
| sandbox evidence report | sandbox approval | `docs/payments/sandbox/` |
| production go/no-go report | production approval | `docs/payments/production/` |

Exit criteria:

- each artifact has a date, reviewer, environment label, and decision;
- credentials, merchant keys, callback secrets, and raw sensitive payment data are never stored;
- artifacts are tracked in version control or linked from an approved documentation system.

### Step Ownership

Each runbook step must have an owner, output, and approving role before execution starts.

| Step | Primary owner | Required output | Approving role |
| --- | --- | --- | --- |
| Step 1: Migration Runner Fix | backend/platform | patched runner and validation report | tech lead |
| Step 2: DDL Preflight | backend/platform + DBA/reviewer | read-only preflight report | tech lead + database reviewer |
| Step 3: Model Update | backend | model diff and build report | tech lead |
| Step 4: Duitku Client Service | backend | client service tests and redaction proof | tech lead |
| Step 5: Callback Route Raw Parser | backend/security | parser tests and security-event proof | tech lead + security reviewer |
| Step 6: Shared Financial Transaction Service | backend | state-transition and lock-order tests | tech lead |
| Step 7: QRIS Guard Refactor | backend | route refactor and regression tests | tech lead |
| Step 8: Frontend DTO Changes | frontend | buyer/seller/admin DTO validation | product + tech lead |
| Step 9: Sandbox Test Matrix | QA/backend | sandbox evidence report | QA lead + tech lead |
| Step 10: Production Rollout | operations/backend | go/no-go report and rollback plan | product owner + tech lead |

Exit criteria:

- no step starts without an assigned owner;
- no step is considered complete without its required output;
- approving role signs off or records a blocking decision.

### Risk Register

Known risks must be tracked before approval.

| Risk | Severity | Mitigation | Blocking gate |
| --- | --- | --- | --- |
| migration runner targets a different DB than runtime | Critical | Step 1 runner parity and redacted target validation | migration |
| `sequelize.sync({ alter: true })` modifies financial schema | Critical | production guard and `DB_SYNC=true` refusal for Duitku schema | migration |
| callback body parsed before raw signature validation | Critical | route-specific raw parser mounted before global body parsers | runtime |
| valid Duitku paid callback races QRIS approval | Critical | shared transaction service and single lock order | runtime |
| QRIS fallback starts after ambiguous Duitku state | High | fallback eligibility blocks `CREATED`, `PENDING`, `UNKNOWN`, and manual-review attempts | runtime |
| invalid signature creates trusted evidence | High | invalid callbacks stored only as security events | runtime |
| return URL mutates financial status | High | return URL read-only contract and tests | sandbox |
| untracked docs or approval artifacts are treated as official | Medium | version control gate | architecture |
| status check is enabled before contract validation | Medium | `ENABLE_DUITKU_STATUS_CHECK=false` until separate approval | sandbox |

Exit criteria:

- every high or critical risk has an owner and mitigation;
- a gate cannot pass while its blocking risk remains open.

### Go/No-Go Criteria

Gate decisions must use the following criteria.

Go for Step 1 and Step 2:

- work is limited to migration runner parity, validation tooling, and read-only schema inspection;
- no Duitku DDL is created or executed;
- no provider calls are made;
- no payment runtime behavior changes.

No-Go for migration:

- migration runner/runtime target parity is unproven;
- DDL preflight artifact is missing or unreviewed;
- partial migration state is incompatible;
- rollback guards are missing.

No-Go for runtime integration:

- callback raw parser is missing;
- shared financial transaction service is missing;
- routes still mutate guarded payment state directly;
- lock-order and state-transition tests are missing.

No-Go for sandbox:

- invalid, malformed, duplicate, unknown, late, and race callback scenarios are not evidenced;
- return URL can mutate financial state;
- status check has not been separately validated.

No-Go for production:

- sandbox report has unresolved phase-one failures;
- feature flags cannot stop new Duitku attempts;
- operations has no process for `UNKNOWN`, quarantined, or late-callback cases;
- rollback plan deletes or loses durable evidence.

### Traceability To Repo Files

Implementation tasks must reference the files they affect.

| Area | Repo files |
| --- | --- |
| migration runner | `server/scripts/run-migrations.js`, `server/src/config/database.ts` |
| startup sync guard | `server/src/server.ts`, `server/src/models/index.ts` |
| callback parser route order | `server/src/app.ts`, future Duitku callback route |
| buyer proof and cancellation | `server/src/routes/payments.ts` |
| seller QRIS proof review | `server/src/routes/seller.payments.ts` |
| expiry mutation | `server/src/services/paymentExpiry.service.ts` |
| aggregation/read model | `server/src/services/orderPaymentAggregation.service.ts`, payment read-model services |
| model update | `server/src/models/Order.ts`, `Suborder.ts`, `Payment.ts`, `PaymentProof.ts`, `PaymentStatusLog.ts`, `Store.ts`, `StorePaymentProfile.ts`, `server/src/models/index.ts` |
| admin audit | `server/src/routes/admin.payments.audit.ts`, admin payment audit UI |
| frontend buyer payment | account order/payment pages and checkout DTO adapters |
| seller payment UI | seller payment review pages and adapters |

Exit criteria:

- each implementation task links its touched files to the relevant runbook step;
- no financial route is modified without a matching test or explicit test-gap note.

### Test Strategy

Testing must be layered by risk.

Required unit tests:

- Duitku HMAC request signature;
- callback HMAC verification from raw values;
- idempotency key hash and request fingerprint comparison;
- attempt state transitions;
- claim state transitions;
- QRIS fallback eligibility.

Required integration tests:

- Create Invoice success, rejection, timeout, and idempotent replay;
- callback inbox insert, duplicate update, quarantine, and security-event insert;
- route parser rejects duplicate keys, nested keys, oversized body, and unsupported content type;
- return URL reads state without mutation.

Required race tests:

- Duitku paid callback vs QRIS fallback;
- Duitku paid callback vs seller QRIS approval;
- buyer cancellation vs Duitku callback;
- payment expiry vs Duitku callback.

Required smoke tests:

- existing QRIS checkout and proof flow remains compatible;
- seller payment review excludes Duitku allocations;
- admin payment audit shows claim, attempt, inbox, and allocation evidence separately;
- Stripe legacy path remains unchanged.

Exit criteria:

- runtime approval requires passing unit, integration, and race tests for guarded flows;
- sandbox approval requires saved sandbox evidence in addition to automated tests.

### Version Control Gate

Planning and approval artifacts must be official before they can approve work.

Requirements:

- this ADR must be tracked in Git or an approved documentation system;
- migration design must be tracked or linked;
- preflight, audit, sandbox, and production artifacts must be tracked or linked;
- untracked local files cannot be treated as approval evidence;
- every approval decision references a committed file, PR, issue, or approved external document.

Exit criteria:

- `duitku-payment-architecture.md` is no longer an untracked local-only artifact before approval is requested;
- approval artifacts are reviewable by the team.

### Pre-Approval Checklist

The plan cannot be submitted for the next approval gate until this checklist is complete.

- [ ] current approval scope is stated in the implementation issue or PR;
- [ ] independent re-audit is complete or explicitly scoped as pending;
- [ ] step owner is assigned;
- [ ] required artifact location is prepared;
- [ ] migration runner validation is complete for migration approval;
- [ ] DDL preflight artifact is reviewed for migration approval;
- [x] raw callback parser design is reviewed for runtime approval;
- [ ] shared financial transaction service design is reviewed for runtime approval;
- [ ] test strategy is accepted for the target gate;
- [ ] rollback plan is accepted for migration/runtime/production as applicable;
- [ ] documentation and approval artifacts are tracked or linked.

### Independent Re-Audit Checklist

The independent re-audit must review:

- Duitku POP Create Invoice signature and response mapping;
- Duitku callback signature using raw `merchantCode + amount + merchantOrderId`;
- raw-body parser placement before global body parsing;
- valid callback inbox and invalid callback security-event separation;
- parent collection claim exclusivity and winner rules;
- single lock order across all financial mutations;
- QRIS fallback eligibility and seller proof guards;
- migration runner/runtime database target consistency;
- `syncDb()` risk after financial migrations;
- feature-flagged rollout and rollback policy.

Exit criteria:

- reviewer records pass, fail, or follow-up for each item;
- all fail items are resolved before migration approval;
- follow-up items are either resolved or explicitly deferred outside phase one.

### Preflight Artifact Requirement

The DDL preflight report must be saved before migration approval.

Required file location:

```text
docs/payments/preflight/YYYY-MM-DD-duitku-ddl-preflight.md
```

Required content:

- environment label and redacted database target;
- MySQL version and active schema;
- physical table-name resolution and case-variant result;
- table engine list for base tables;
- current columns, enum definitions, indexes, and foreign keys;
- orphan checks for `suborders` and `payments`;
- amount checks for parent orders;
- partial migration detection for Duitku tables and columns;
- QRIS active-profile readiness sampling;
- remediation plan for every non-clean result;
- reviewer name, timestamp, and decision.

Exit criteria:

- preflight artifact exists;
- no required section is blank;
- every issue has an owner and disposition;
- migration approval remains blocked until this artifact is reviewed.

### Callback Raw Parser Design Detail

The callback endpoint must not rely on global `express.urlencoded`.

Required design:

- mount Duitku callback route before global `express.json` and `express.urlencoded`, or use route-specific raw-body middleware that receives the request before normalized parsing;
- limit raw body to 64 KiB;
- enforce `Content-Type: application/x-www-form-urlencoded`;
- parse form with duplicate-key rejection;
- reject nested key syntax such as bracket or dotted object notation;
- preserve exact raw values for `merchantCode`, `amount`, `merchantOrderId`, `reference`, `resultCode`, and `signature`;
- compute raw body digest and field-values digest before mutation;
- verify signature with constant-time comparison;
- store invalid signatures only in `order_payment_security_events`;
- store valid callbacks first in `duitku_callback_inbox`;
- bind valid callbacks to attempts only after signature validation;
- return HTTP 200 for invalid signatures only after durable security-event write;
- return HTTP 5xx only for transient persistence failures safe for provider retry.

Exit criteria:

- a test proves global body parsers cannot consume the Duitku callback first;
- invalid signature does not create an inbox row;
- malformed callback does not create trusted provider evidence;
- valid unknown `merchantOrderId` is quarantined durably.

### Shared Financial Transaction Service Contract

All financial state changes must go through one service boundary.

Required service functions:

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

- acquire locks in the required order: parent `Order`, claim, attempt, all parent suborders, stable payments, then proof/inbox/event/security rows;
- validate the current claim before changing allocation, suborder, or parent order state;
- write durable event or status log evidence;
- return an idempotent read model for duplicate no-op cases;
- reject direct route-level financial mutation outside this service;
- preserve historical QRIS rows that are outside the new stable-allocation scope.

Exit criteria:

- routes call the service instead of updating financial status directly;
- code search verifies no direct route-level payment-status mutation remains for guarded flows;
- race tests cover callback vs fallback, callback vs seller approval, cancellation vs callback, and expiry vs callback.

### API And DTO Contract Requirement

Buyer, seller, and admin DTOs must separate parent collection from seller allocation state.

Required common fields:

```ts
{
  collectionRail: "DUITKU_POP" | "QRIS_STATIC" | null;
  claimState: "CLAIMED" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED" | null;
  attemptStatus: "CREATED" | "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "EXPIRED" | "UNKNOWN" | null;
  paymentUrl: string | null;
  callbackState: "NONE" | "BOUND" | "UNBOUND" | "AMBIGUOUS" | "QUARANTINED" | null;
  manualReviewReason: string | null;
  allocations: Array<{
    paymentId: number;
    suborderId: number;
    storeId: number;
    paymentChannel: "QRIS" | "DUITKU";
    paymentType: "QRIS_STATIC" | "DUITKU_POP";
    status: string;
  }>;
}
```

Exit criteria:

- buyer proof upload is shown only for `QRIS_STATIC`;
- Duitku hosted redirect is shown only when backend returns a Duitku payment URL;
- seller review actions are available only for QRIS allocations;
- admin audit can inspect claim, attempt, callback, security event, and allocation state separately.

### Sandbox Evidence Template

Every sandbox scenario must produce a saved evidence block.

Template:

```md
## Scenario

- Name:
- Environment:
- Time:
- Actor/reviewer:
- Feature flags:

## Input

- Request:
- Idempotency key:
- Provider fixture or real sandbox response:

## Expected Result

- HTTP result:
- Attempt state:
- Claim state:
- Allocation state:
- Callback/security evidence:

## Actual Result

- HTTP result:
- Database before:
- Database after:
- Logs/events:
- Screenshots or redirect URL evidence:

## Decision

- Pass/fail:
- Follow-up:
- Reviewer:
```

Exit criteria:

- every required sandbox scenario has evidence;
- every fail has a linked remediation;
- production approval remains blocked until all phase-one sandbox failures are resolved.

## 19. Implementation Runbook

This runbook is the required execution order for future implementation. Do not skip ahead, because later steps depend on schema, lock-order, and callback-parser guarantees created by earlier steps.

### Step 1: Migration Runner Fix

Goal: make migration execution use the same database target as runtime.

Required work:

- update `server/scripts/run-migrations.js` to support `DATABASE_URL`, `DB_PORT`, SSL, and runtime dialect options consistently with `server/src/config/database.ts`;
- fail loudly when runtime and migration configuration would target different database hosts, ports, users, or schemas;
- keep `multipleStatements` support only where intentionally required by existing migrations;
- add a dry-run/config-print mode that redacts credentials and shows the resolved connection target;
- add a production guard that refuses Duitku financial migrations when `DB_SYNC=true`.

Exit criteria:

- migration runner and runtime resolve the same database target in split `DB_*` mode;
- migration runner and runtime resolve the same database target in `DATABASE_URL` mode;
- credentials are never printed;
- CI or smoke validation proves the runner can load existing `.cjs` and `.sql` migrations.

### Step 2: DDL Preflight

Goal: verify the live schema before any Duitku DDL exists.

Required work:

- run the read-only preflight queries from `duitku-payment-migration-design.md`;
- resolve physical table names and case variants through `information_schema`;
- verify base table engines, columns, indexes, foreign keys, enum definitions, and existing amount data;
- detect partial Duitku/payment-attempt objects from interrupted previous work;
- record the result as an implementation artifact before DDL approval.

Exit criteria:

- every required base table has exactly one physical match;
- no incompatible partial Duitku schema exists;
- amount, orphan, enum, and FK checks are clean or have an explicit remediation plan;
- migration approval remains blocked until the preflight artifact is reviewed.

### Step 3: Model Update

Goal: align Sequelize models, TypeScript types, serializers, and read models with the approved schema.

Required work:

- add models for `OrderCollectionClaim`, `OrderPaymentAttempt`, `DuitkuCallbackInbox`, `OrderPaymentAttemptEvent`, and `OrderPaymentSecurityEvent`;
- extend `Payment.payment_channel` to `QRIS | DUITKU`;
- extend `Payment.payment_type` to `QRIS_STATIC | DUITKU_POP`;
- make `Payment.qr_image_url` nullable for Duitku rows;
- add `Payment.allocation_key` and `Payment.paid_by_order_payment_attempt_id`;
- extend `Suborder.payment_method` to `QRIS | DUITKU`;
- update associations in `server/src/models/index.ts`;
- update buyer, seller, and admin serializers so collection rail, parent attempt, callback state, and seller allocations are separate concepts.

Exit criteria:

- TypeScript build passes;
- model definitions match the DDL definitions exactly;
- existing QRIS reads remain backward compatible for historical rows;
- no code path depends on `qrImageUrl` being present for Duitku payments.

### Step 4: Duitku Client Service

Goal: isolate all provider communication behind a tested service boundary.

Required work:

- create a Duitku POP client service for Create Invoice and, later, status check;
- generate HMAC-SHA256 request signatures from `merchantCode + timestamp`;
- use separate sandbox and production config;
- enforce request timeout, response redaction, and structured provider error mapping;
- persist outbound `provider_call_id`, request fingerprint, `merchant_order_id`, provider reference, payment URL, and provider response metadata;
- keep `ENABLE_DUITKU_STATUS_CHECK=false` until sandbox validation approves status polling.

Exit criteria:

- Create Invoice `statusCode = 00` maps attempt to `PENDING`, not `PAID`;
- Create Invoice rejection before reference/payment URL maps attempt to definitive `FAILED`;
- timeout or ambiguous response maps attempt to `UNKNOWN` with manual review;
- idempotent replay returns the existing attempt when the request fingerprint matches;
- mismatched idempotency replay returns HTTP 409.

### Step 5: Callback Route Raw Parser

Goal: receive Duitku callbacks without losing raw values required for signature verification.

Required work:

- mount the Duitku callback route before global `express.urlencoded` or use a route-specific raw-body parser;
- enforce 64 KiB body limit, 32 fields, duplicate-key rejection, nested-key rejection, and `application/x-www-form-urlencoded`;
- preserve raw field values for `merchantCode`, `amount`, and `merchantOrderId` before normalization;
- verify callback HMAC-SHA256 from `merchantCode + amount + merchantOrderId` using constant-time comparison;
- write invalid-signature and malformed events to `order_payment_security_events`;
- write valid callbacks to `duitku_callback_inbox` before attempt binding;
- return HTTP 200 only after durable applied, ignored, quarantined, or duplicate metadata storage.

Exit criteria:

- invalid signature cannot create trusted callback inbox rows;
- valid-but-unbound callback is durably quarantined;
- duplicate valid callback increments duplicate metadata idempotently;
- global body parsers cannot consume or normalize callback input before signature verification.

### Step 6: Shared Financial Transaction Service

Goal: put all financial mutations behind one lock-order implementation.

Required work:

- create a shared service that acquires locks in the required order: parent `Order`, `order_collection_claims`, `OrderPaymentAttempt`, all parent `Suborder` rows, stable `Payment` rows, then proof/inbox/event/security rows;
- move Duitku callback apply, reconciliation apply, QRIS fallback activation, seller proof review, buyer cancellation, and payment expiry into this service;
- centralize allowed state transitions for claims, attempts, allocations, suborders, and parent order status;
- make duplicate callback and duplicate seller approval idempotent;
- prevent any financial route from updating payment state directly outside this service.

Exit criteria:

- code search shows no direct route-level financial status mutation outside the shared service;
- callback paid propagation requires Duitku claim ownership;
- QRIS approval requires QRIS claim ownership;
- cancellation and expiry cannot release a QRIS claim back to Duitku;
- lock-order tests cover concurrent Duitku callback vs QRIS fallback and seller approval vs late callback.

### Step 7: QRIS Guard Refactor

Goal: keep manual QRIS safe after Duitku is introduced.

Required work:

- update buyer proof upload to require `order_collection_claims.rail = 'QRIS_STATIC'` and QRIS allocation type;
- update seller proof approve/reject in `server/src/routes/seller.payments.ts` to use the shared financial transaction service;
- update buyer cancellation and payment expiry to use claim-aware QRIS-only mutation;
- update seller payment-review list to exclude Duitku allocations;
- update QRIS fallback activation to snapshot `stores.active_store_payment_profile_id` into suborder and payment rows atomically.

Exit criteria:

- seller cannot approve QRIS proof for an order claimed by Duitku;
- buyer cannot upload manual proof for a Duitku allocation;
- QRIS fallback cannot start while Duitku attempt is `CREATED`, `PENDING`, `UNKNOWN`, or requires manual review;
- parent order becomes `PAID` under QRIS only after all stable seller allocations are `PAID`.

### Step 8: Frontend DTO Changes

Goal: make buyer, seller, and admin UI understand parent collection rail separately from seller allocations.

Required work:

- add DTO fields for collection rail, claim state, parent payment attempt status, payment URL, callback/quarantine state, and seller allocation states;
- update checkout result to support hosted Duitku redirect and QRIS fallback display;
- update account payment pages so return URL only reads backend state and never marks payment paid;
- update seller payment-review screens to hide Duitku allocations and show QRIS-only review actions;
- update admin payment audit screens to show claim, attempt, callback inbox, security events, and allocation evidence separately.

Exit criteria:

- buyer sees Duitku hosted redirect when claim is `DUITKU_POP`;
- buyer sees QRIS proof upload only when claim is `QRIS_STATIC`;
- seller review actions appear only for QRIS allocations;
- admin can distinguish paid, failed, unknown, quarantined, duplicate, and late-callback states.

### Step 9: Sandbox Test Matrix

Goal: prove provider contracts and race rules before production credentials are used.

Required sandbox scenarios:

- Create Invoice success with payment URL;
- Create Invoice definitive rejection;
- Create Invoice timeout or ambiguous response;
- Create Invoice idempotent replay with matching fingerprint;
- Create Invoice idempotent replay with mismatched fingerprint;
- valid callback `resultCode = 00`;
- valid callback `resultCode = 01`;
- invalid signature callback;
- malformed form callback;
- duplicate callback delivery;
- unknown `merchantOrderId` callback;
- valid late paid callback after QRIS fallback claim;
- return URL before payment, after payment, and after failed payment;
- provider status check behavior, but keep status check disabled until separately approved;
- QRIS fallback after definitive Duitku failure or provider-confirmed expiry;
- concurrent Duitku callback vs QRIS fallback;
- concurrent seller approval vs late Duitku callback.

Exit criteria:

- every scenario has automated or documented manual evidence;
- no browser return path changes financial status;
- invalid and malformed callbacks never mutate payment state;
- callback retry behavior returns 5xx only for transient internal failures safe for provider retry.

### Step 10: Production Rollout Feature-Flagged

Goal: release Duitku gradually without disrupting existing QRIS and Stripe paths.

Required work:

- add feature flags for Duitku rail availability, Duitku Create Invoice, Duitku callback processing, QRIS fallback, reconciliation, and admin recovery;
- start with Duitku disabled in production while migrations and read-only admin visibility are deployed;
- enable sandbox credentials only in non-production environments;
- enable production Create Invoice for a limited internal allowlist or low-risk cohort;
- keep QRIS fallback and manual settlement policy visible in admin operations;
- monitor attempts, callback inbox, security events, unknown states, duplicate callbacks, and late callbacks;
- keep `ENABLE_DUITKU_STATUS_CHECK=false` until status-check sandbox results are approved;
- prepare rollback that disables new Duitku creation without deleting durable payment evidence.

Exit criteria:

- disabling feature flags stops new Duitku attempts while preserving callback evidence;
- existing QRIS and Stripe behavior remains unchanged for unaffected orders;
- operations can reconcile `UNKNOWN`, quarantined, and late-callback cases;
- production launch has documented go/no-go approval after monitored cohort results.

## 20. Self-Review

Self-review status: complete; this is not an independent audit result.

Checks:

- migration is approved only for Step 3 local migration/model package;
- document remains pending independent re-audit;
- parent collection claim/winner is explicit;
- lock order is single and shared;
- valid-but-unbound callback has durable inbox;
- invalid signature cannot consume trusted callback occurrence key;
- `stores.active_store_payment_profile_id` is the sole QRIS readiness source;
- `server/src/routes/seller.payments.ts` is listed as a required future implementation surface;
- approval gates are split across architecture, migration, runtime, sandbox, and production;
- implementation readiness requirements document preflight artifacts, callback raw parsing, shared financial transaction service, DTO contracts, and sandbox evidence;
- implementation runbook is documented and keeps production rollout feature-flagged.
