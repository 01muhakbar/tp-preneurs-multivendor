# PAY-DUITKU-02A: Migration Design dan Static Preflight Duitku

Document status: Pending independent re-audit.  
Migration approval: NOT APPROVED.  
Date: 2026-08-05.  
Scope: documentation and static inspection only.

This document defines future migration design. It does not create migration files, execute SQL, connect to a database, alter data, change runtime code, or approve implementation.

## 1. Source Findings

Static source inspected on branch `main`:

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

Key findings:

- MySQL through Sequelize is the runtime database pattern.
- `Store` has `active_store_payment_profile_id`.
- `StorePaymentProfile` has `store_id`, `is_active`, `verification_status`, `snapshot_status`, `provider_code`, `payment_type`, `qris_image_url`, and `qris_payload`.
- `server/src/routes/seller.payments.ts` currently marks QRIS payment/suborder paid without parent order lock and without collection claim checks.
- Future implementation must change `server/src/routes/seller.payments.ts`, but this task changes documentation only.

## 2. Physical Table Resolution

Every future migration resolves physical table names through `information_schema.tables` using `LOWER(table_name)`.

Logical tables:

- `users`
- `orders`
- `suborders`
- `payments`
- `payment_proofs`
- `payment_status_logs`
- `stores`
- `store_payment_profiles`

Rules:

- zero match fails loudly;
- more than one case variant fails loudly;
- resolved physical names are used for foreign keys;
- MySQL version and storage engine are checked before DDL.

## 3. Migration Order

Future migration order:

1. Pre-DDL live-schema checks.
2. Partial-migration detection.
3. Create `order_collection_claims`.
4. Create `order_payment_attempts`.
5. Create `duitku_callback_inbox`.
6. Create `order_payment_attempt_events`.
7. Create `order_payment_security_events`.
8. Alter `payments.payment_channel` to `ENUM('QRIS','DUITKU')`.
9. Alter `payments.payment_type` to `ENUM('QRIS_STATIC','DUITKU_POP')`.
10. Alter `payments.qr_image_url` to nullable `LONGTEXT`.
11. Add `payments.allocation_key VARCHAR(160) NULL`.
12. Add `payments.paid_by_order_payment_attempt_id INT UNSIGNED NULL`.
13. Alter `suborders.payment_method` to `ENUM('QRIS','DUITKU') NOT NULL DEFAULT 'QRIS'`.
14. Post-DDL structural verification.
15. Post-backfill/data-invariant verification.

## 4. Final Table: order_collection_claims

Purpose: parent-level exclusive collection claim/winner.

Collection winner means the row whose `claim_state = 'PAID'`; after that state no other rail can obtain settlement rights for the parent order.

| Column | SQL type | Null | Default | Constraint | Reason |
| --- | --- | --- | --- | --- | --- |
| `id` | `INT UNSIGNED AUTO_INCREMENT` | no | none | primary key | row identity |
| `order_id` | `INT UNSIGNED` | no | none | FK resolved orders, `ON UPDATE CASCADE`, `ON DELETE RESTRICT`; `UNIQUE KEY uniq_occ_order_id (order_id)` | one claim per parent |
| `rail` | `ENUM('DUITKU_POP','QRIS_STATIC')` | no | none | `KEY idx_occ_rail_state (rail, claim_state)` | active exclusive rail |
| `claim_state` | `ENUM('CLAIMED','PAID','FAILED','EXPIRED','CANCELLED')` | no | `'CLAIMED'` | `KEY idx_occ_rail_state (rail, claim_state)` | claim lifecycle |
| `claim_source` | `ENUM('DUITKU_CREATE_INVOICE','QRIS_FALLBACK','ADMIN_RECOVERY')` | no | none | `KEY idx_occ_source (claim_source)` | acquisition source |
| `order_payment_attempt_id` | `INT UNSIGNED` | yes | `NULL` | FK `order_payment_attempts(id)`, `ON UPDATE CASCADE`, `ON DELETE RESTRICT`; `KEY idx_occ_attempt (order_payment_attempt_id)` | Duitku claim owner |
| `claimed_at` | `DATETIME` | no | `CURRENT_TIMESTAMP` | `KEY idx_occ_claimed_at (claimed_at)` | claim time |
| `paid_at` | `DATETIME` | yes | `NULL` | `KEY idx_occ_paid_at (paid_at)` | final paid time |
| `terminal_at` | `DATETIME` | yes | `NULL` | `KEY idx_occ_terminal_at (terminal_at)` | failed/expired/cancelled time |
| `created_at` | `DATETIME` | no | `CURRENT_TIMESTAMP` | none | audit |
| `updated_at` | `DATETIME` | no | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | none | audit |

Claim rules:

- Duitku obtains claim when Create Invoice `statusCode = 00` is persisted with provider reference and payment URL.
- QRIS fallback obtains claim in the same transaction that switches all stable allocations to QRIS.
- `UNIQUE KEY uniq_occ_order_id (order_id)` prevents concurrent claims.
- Duitku paid propagation requires `rail = 'DUITKU_POP'` and `claim_state = 'CLAIMED'`.
- Seller proof approval requires `rail = 'QRIS_STATIC'` and `claim_state = 'CLAIMED'`.
- Claim state `PAID` is final.

## 5. Final Table: order_payment_attempts

Purpose: parent Duitku payment attempt.

| Column | SQL type | Null | Default | Constraint | Reason |
| --- | --- | --- | --- | --- | --- |
| `id` | `INT UNSIGNED AUTO_INCREMENT` | no | none | primary key | identity |
| `order_id` | `INT UNSIGNED` | no | none | FK resolved orders, `ON UPDATE CASCADE`, `ON DELETE RESTRICT` | parent |
| `provider` | `ENUM('DUITKU')` | no | `'DUITKU'` | see index list | provider |
| `status` | `ENUM('CREATED','PENDING','PAID','FAILED','CANCELLED','EXPIRED','UNKNOWN')` | no | `'CREATED'` | see index list | state |
| `requires_manual_review` | `BOOLEAN` | no | `FALSE` | see index list | review queue |
| `manual_review_reason` | `VARCHAR(120)` | yes | `NULL` | none | controlled code |
| `manual_review_created_at` | `DATETIME` | yes | `NULL` | see index list | queue ordering |
| `manual_reviewed_by_user_id` | `INT UNSIGNED` | yes | `NULL` | FK resolved users, `ON UPDATE CASCADE`, `ON DELETE SET NULL` | actor |
| `manual_reviewed_at` | `DATETIME` | yes | `NULL` | none | review time |
| `merchant_order_id` | `VARCHAR(50)` | no | none | `UNIQUE KEY uniq_opa_merchant_order_id (merchant_order_id)` | provider limit |
| `provider_reference` | `VARCHAR(160)` | yes | `NULL` | `UNIQUE KEY uniq_opa_provider_reference (provider_reference)` | Duitku reference |
| `payment_url` | `TEXT` | yes | `NULL` | none | redirect URL, redacted in logs |
| `amount` | `BIGINT UNSIGNED` | no | none | see index list | integer IDR |
| `currency` | `CHAR(3)` | no | `'IDR'` | none | currency |
| `expiry_period_minutes` | `INT UNSIGNED` | no | `60` | none | invoice expiry |
| `expires_at` | `DATETIME` | yes | `NULL` | see index list | due time |
| `created_at_provider` | `DATETIME` | yes | `NULL` | none | provider time |
| `paid_at` | `DATETIME` | yes | `NULL` | see index list | paid time |
| `cancelled_at` | `DATETIME` | yes | `NULL` | none | cancellation time |
| `expired_at` | `DATETIME` | yes | `NULL` | none | expiry time |
| `idempotency_key_hash` | `CHAR(64)` | no | none | `UNIQUE KEY uniq_opa_order_idempotency (order_id, idempotency_key_hash)` | replay guard |
| `request_fingerprint` | `CHAR(64)` | no | none | see index list | canonical payload |
| `provider_last_code` | `VARCHAR(40)` | yes | `NULL` | none | provider code |
| `provider_last_message` | `VARCHAR(255)` | yes | `NULL` | none | redacted message |
| `last_reconciled_at` | `DATETIME` | yes | `NULL` | none | reconciliation |
| `reconcile_attempt_count` | `INT UNSIGNED` | no | `0` | see index list | retry count |
| `next_reconcile_at` | `DATETIME` | yes | `NULL` | see index list | retry schedule |
| `last_reconcile_error_code` | `VARCHAR(64)` | yes | `NULL` | none | error code |
| `last_reconcile_error_at` | `DATETIME` | yes | `NULL` | none | error time |
| `created_by_user_id` | `INT UNSIGNED` | yes | `NULL` | FK resolved users, `ON UPDATE CASCADE`, `ON DELETE SET NULL` | buyer |
| `created_at` | `DATETIME` | no | `CURRENT_TIMESTAMP` | see index list | audit |
| `updated_at` | `DATETIME` | no | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | none | audit |

Create Invoice idempotency:

- same key hash and same request fingerprint replays existing attempt;
- same key hash and different request fingerprint returns HTTP 409;
- concurrent inserts rely on `uniq_opa_order_idempotency`;
- `merchant_order_id` is immutable once inserted;
- provider retry uses the same `merchant_order_id`.

## 6. Final Table: duitku_callback_inbox

Purpose: durable inbox/quarantine for signed callbacks before or after attempt binding.

| Column | SQL type | Null | Default | Constraint | Reason |
| --- | --- | --- | --- | --- | --- |
| `id` | `INT UNSIGNED AUTO_INCREMENT` | no | none | primary key | identity |
| `payment_attempt_id` | `INT UNSIGNED` | yes | `NULL` | FK `order_payment_attempts(id)`, `ON UPDATE CASCADE`, `ON DELETE RESTRICT`; `KEY idx_dci_attempt (payment_attempt_id)` | immediate binding |
| `resolved_payment_attempt_id` | `INT UNSIGNED` | yes | `NULL` | FK `order_payment_attempts(id)`, `ON UPDATE CASCADE`, `ON DELETE RESTRICT`; `KEY idx_dci_resolved_attempt (resolved_payment_attempt_id)` | later binding |
| `merchant_code_raw` | `VARCHAR(64)` | no | none | `KEY idx_dci_merchant_code (merchant_code_raw)` | bounded raw prefix |
| `merchant_order_id_raw` | `VARCHAR(128)` | no | none | `KEY idx_dci_merchant_order (merchant_order_id_raw)` | bounded raw prefix |
| `provider_reference_raw` | `VARCHAR(192)` | yes | `NULL` | `KEY idx_dci_reference (provider_reference_raw)` | bounded raw prefix |
| `amount_raw` | `VARCHAR(64)` | no | none | none | bounded raw prefix |
| `result_code_raw` | `VARCHAR(40)` | no | none | `KEY idx_dci_result_code (result_code_raw)` | callback result |
| `signature_state` | `ENUM('VALID')` | no | `'VALID'` | `KEY idx_dci_signature_binding (signature_state, binding_state)` | inbox stores signed callbacks |
| `binding_state` | `ENUM('BOUND','UNBOUND','AMBIGUOUS','RESOLVED')` | no | `'UNBOUND'` | `KEY idx_dci_signature_binding (signature_state, binding_state)` | binding lifecycle |
| `processing_result` | `ENUM('APPLIED','IGNORED','QUARANTINED','ERROR')` | no | `'QUARANTINED'` | `KEY idx_dci_processing (processing_result)` | immutable result |
| `quarantine_reason` | `VARCHAR(120)` | yes | `NULL` | `KEY idx_dci_quarantine (quarantine_reason, first_received_at)` | review reason |
| `occurrence_key` | `CHAR(64)` | no | none | `UNIQUE KEY uniq_dci_occurrence (occurrence_key)` | signed callback occurrence |
| `event_hash` | `CHAR(64)` | no | none | `KEY idx_dci_event_hash (event_hash)` | forensic digest |
| `raw_body_digest` | `CHAR(64)` | no | none | `KEY idx_dci_raw_body_digest (raw_body_digest)` | raw bytes digest |
| `field_values_digest` | `CHAR(64)` | no | none | none | complete raw values digest |
| `duplicate_count` | `INT UNSIGNED` | no | `0` | none | delivery count |
| `first_received_at` | `DATETIME` | no | `CURRENT_TIMESTAMP` | `KEY idx_dci_received (first_received_at)` | first delivery |
| `last_received_at` | `DATETIME` | no | `CURRENT_TIMESTAMP` | `KEY idx_dci_last_received (last_received_at)` | latest delivery |
| `resolved_at` | `DATETIME` | yes | `NULL` | `KEY idx_dci_resolved_at (resolved_at)` | resolution time |
| `created_at` | `DATETIME` | no | `CURRENT_TIMESTAMP` | none | audit |
| `updated_at` | `DATETIME` | no | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | none | mutable delivery metadata |

Processing rules:

- signature verification happens first;
- attempt binding happens after signature validation;
- valid callback without safe binding is stored as `processing_result = 'QUARANTINED'`;
- unbound callback does not change financial status;
- duplicate callback updates `duplicate_count` and `last_received_at`;
- original `processing_result` is immutable;
- HTTP 200 follows durable inbox write;
- transient database failure returns 5xx;
- manual resolution revalidates merchant, order, reference, amount, claim, and state transition.

## 7. Final Table: order_payment_attempt_events

Purpose: trusted attempt-bound event audit. Callback rows here must originate from a valid bound inbox row.

| Column | SQL type | Null | Default | Constraint | Reason |
| --- | --- | --- | --- | --- | --- |
| `id` | `INT UNSIGNED AUTO_INCREMENT` | no | none | primary key | identity |
| `payment_attempt_id` | `INT UNSIGNED` | no | none | FK `order_payment_attempts(id)`, `ON UPDATE CASCADE`, `ON DELETE RESTRICT` | attempt |
| `callback_inbox_id` | `INT UNSIGNED` | yes | `NULL` | FK `duitku_callback_inbox(id)`, `ON UPDATE CASCADE`, `ON DELETE RESTRICT`; `UNIQUE KEY uniq_opae_callback_inbox (callback_inbox_id)` | callback source |
| `event_type` | `ENUM('CREATE_INVOICE','CALLBACK','STATUS_CHECK','RECOVERY','RETURN_OBSERVED')` | no | none | see index list | event kind |
| `occurrence_key` | `CHAR(64)` | no | none | see index list | occurrence |
| `provider_call_id` | `CHAR(36)` | yes | `NULL` | see index list | outbound call |
| `reconciliation_run_id` | `CHAR(36)` | yes | `NULL` | see index list | polling run |
| `merchant_order_id` | `VARCHAR(50)` | yes | `NULL` | see index list | provider field |
| `provider_reference` | `VARCHAR(160)` | yes | `NULL` | see index list | provider reference |
| `provider_amount_raw` | `VARCHAR(64)` | yes | `NULL` | none | exact provider amount |
| `amount_normalized` | `BIGINT UNSIGNED` | yes | `NULL` | none | integer IDR |
| `provider_result_code` | `VARCHAR(40)` | yes | `NULL` | see index list | callback code |
| `provider_status_code` | `VARCHAR(40)` | yes | `NULL` | see index list | status code |
| `payment_code` | `VARCHAR(40)` | yes | `NULL` | none | payment method code |
| `signature_state` | `ENUM('VALID','NOT_APPLICABLE','NOT_CHECKED')` | no | `'NOT_CHECKED'` | see index list | signature invariant |
| `processing_result` | `ENUM('APPLIED','IGNORED','QUARANTINED','ERROR')` | no | none | see index list | immutable result |
| `event_hash` | `CHAR(64)` | no | none | `KEY idx_opae_event_hash (event_hash)` | non-unique forensic hash |
| `raw_body_digest` | `CHAR(64)` | yes | `NULL` | none | raw bytes digest |
| `duplicate_count` | `INT UNSIGNED` | no | `0` | none | delivery count |
| `first_received_at` | `DATETIME` | no | `CURRENT_TIMESTAMP` | see index list | first seen |
| `last_received_at` | `DATETIME` | no | `CURRENT_TIMESTAMP` | see index list | latest delivery |
| `created_at` | `DATETIME` | no | `CURRENT_TIMESTAMP` | none | audit |
| `updated_at` | `DATETIME` | no | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | none | mutable delivery metadata |

Invariants:

- callback event here must have `signature_state = 'VALID'`;
- callback cannot be `APPLIED` unless `signature_state = 'VALID'`;
- non-callback event uses `signature_state = 'NOT_APPLICABLE'`;
- `NOT_CHECKED` cannot be a final persisted processing state;
- original `processing_result` is immutable;
- only delivery metadata can change;
- runtime validation and post-write verification enforce these invariants until target MySQL CHECK support is verified.

## 8. Final Table: order_payment_security_events

Purpose: bounded storage for untrusted callback/security metadata.

| Column | SQL type | Null | Default | Constraint | Reason |
| --- | --- | --- | --- | --- | --- |
| `id` | `INT UNSIGNED AUTO_INCREMENT` | no | none | primary key | identity |
| `event_type` | `ENUM('CALLBACK_INVALID_SIGNATURE','CALLBACK_MALFORMED','CALLBACK_OVERSIZED')` | no | none | `KEY idx_opse_type_received (event_type, received_at)` | security class |
| `merchant_code_prefix` | `VARCHAR(64)` | yes | `NULL` | none | bounded prefix |
| `merchant_order_id_prefix` | `VARCHAR(128)` | yes | `NULL` | `KEY idx_opse_order_prefix (merchant_order_id_prefix)` | bounded prefix |
| `provider_reference_prefix` | `VARCHAR(192)` | yes | `NULL` | none | bounded prefix |
| `amount_prefix` | `VARCHAR(64)` | yes | `NULL` | none | bounded prefix |
| `result_code_prefix` | `VARCHAR(40)` | yes | `NULL` | none | bounded prefix |
| `signature_state` | `ENUM('INVALID','NOT_CHECKED')` | no | `'NOT_CHECKED'` | `KEY idx_opse_signature (signature_state)` | security state |
| `raw_body_digest` | `CHAR(64)` | yes | `NULL` | `KEY idx_opse_raw_digest (raw_body_digest)` | raw bytes digest |
| `field_values_digest` | `CHAR(64)` | yes | `NULL` | none | full values digest |
| `source_ip_hash` | `CHAR(64)` | yes | `NULL` | `KEY idx_opse_ip_time (source_ip_hash, received_at)` | rate investigation |
| `user_agent_hash` | `CHAR(64)` | yes | `NULL` | none | investigation |
| `received_at` | `DATETIME` | no | `CURRENT_TIMESTAMP` | `KEY idx_opse_received (received_at)` | time |
| `created_at` | `DATETIME` | no | `CURRENT_TIMESTAMP` | none | audit |

Security rules:

- invalid signature writes `CALLBACK_INVALID_SIGNATURE` and returns HTTP 200 after durable write;
- malformed form writes `CALLBACK_MALFORMED` and returns HTTP 400 after durable write;
- oversized body writes `CALLBACK_OVERSIZED` when a safe prefix/digest can be captured and returns HTTP 413;
- merchant key, signature secret, raw credentials, card data, and sensitive payment credentials are never stored.

## 9. Final Alterations: payments

| Change | SQL definition | Constraint |
| --- | --- | --- |
| `payment_channel` | `ENUM('QRIS','DUITKU') NOT NULL DEFAULT 'QRIS'` | existing data preserved |
| `payment_type` | `ENUM('QRIS_STATIC','DUITKU_POP') NOT NULL DEFAULT 'QRIS_STATIC'` | existing data preserved |
| `qr_image_url` | `LONGTEXT NULL DEFAULT NULL` | Duitku rows have no QR image |
| `allocation_key` | `VARCHAR(160) NULL DEFAULT NULL` | `UNIQUE KEY uniq_payments_allocation_key (allocation_key)` |
| `paid_by_order_payment_attempt_id` | `INT UNSIGNED NULL DEFAULT NULL` | FK `order_payment_attempts(id)`, `ON UPDATE CASCADE`, `ON DELETE RESTRICT`; `KEY idx_payments_paid_by_attempt (paid_by_order_payment_attempt_id)` |

Stable allocation scope:

- new Duitku and QRIS fallback orders use stable allocation rows;
- stable rows have non-null `allocation_key`;
- historical QRIS rows with null `allocation_key` remain valid outside the new stable-allocation scope.

## 10. Final Alteration: suborders

| Change | SQL definition | Constraint |
| --- | --- | --- |
| `payment_method` | `ENUM('QRIS','DUITKU') NOT NULL DEFAULT 'QRIS'` | existing QRIS data preserved |

## 11. Final Index List

`order_collection_claims`:

```sql
PRIMARY KEY (id)
UNIQUE KEY uniq_occ_order_id (order_id)
KEY idx_occ_rail_state (rail, claim_state)
KEY idx_occ_source (claim_source)
KEY idx_occ_attempt (order_payment_attempt_id)
KEY idx_occ_claimed_at (claimed_at)
KEY idx_occ_paid_at (paid_at)
KEY idx_occ_terminal_at (terminal_at)
```

`order_payment_attempts`:

```sql
PRIMARY KEY (id)
UNIQUE KEY uniq_opa_merchant_order_id (merchant_order_id)
UNIQUE KEY uniq_opa_provider_reference (provider_reference)
UNIQUE KEY uniq_opa_order_idempotency (order_id, idempotency_key_hash)
KEY idx_opa_provider_status (provider, status)
KEY idx_opa_order_status (order_id, status)
KEY idx_opa_manual_review_queue (requires_manual_review, status, manual_review_created_at)
KEY idx_opa_reconcile_due (next_reconcile_at, status, reconcile_attempt_count)
KEY idx_opa_amount (amount)
KEY idx_opa_expires_at (expires_at)
KEY idx_opa_paid_at (paid_at)
KEY idx_opa_request_fingerprint (request_fingerprint)
KEY idx_opa_created_at (created_at)
```

`duitku_callback_inbox`:

```sql
PRIMARY KEY (id)
UNIQUE KEY uniq_dci_occurrence (occurrence_key)
KEY idx_dci_attempt (payment_attempt_id)
KEY idx_dci_resolved_attempt (resolved_payment_attempt_id)
KEY idx_dci_merchant_code (merchant_code_raw)
KEY idx_dci_merchant_order (merchant_order_id_raw)
KEY idx_dci_reference (provider_reference_raw)
KEY idx_dci_result_code (result_code_raw)
KEY idx_dci_signature_binding (signature_state, binding_state)
KEY idx_dci_processing (processing_result)
KEY idx_dci_quarantine (quarantine_reason, first_received_at)
KEY idx_dci_event_hash (event_hash)
KEY idx_dci_raw_body_digest (raw_body_digest)
KEY idx_dci_received (first_received_at)
KEY idx_dci_last_received (last_received_at)
KEY idx_dci_resolved_at (resolved_at)
```

`order_payment_attempt_events`:

```sql
PRIMARY KEY (id)
UNIQUE KEY uniq_opae_occurrence (payment_attempt_id, event_type, occurrence_key)
UNIQUE KEY uniq_opae_callback_inbox (callback_inbox_id)
KEY idx_opae_attempt_id (payment_attempt_id)
KEY idx_opae_provider_call_id (provider_call_id)
KEY idx_opae_reconciliation_run_id (reconciliation_run_id)
KEY idx_opae_merchant_order_id (merchant_order_id)
KEY idx_opae_provider_reference (provider_reference)
KEY idx_opae_result_code (provider_result_code)
KEY idx_opae_status_code (provider_status_code)
KEY idx_opae_signature_state (signature_state)
KEY idx_opae_processing_result (processing_result)
KEY idx_opae_event_hash (event_hash)
KEY idx_opae_first_received_at (first_received_at)
KEY idx_opae_last_received_at (last_received_at)
```

`order_payment_security_events`:

```sql
PRIMARY KEY (id)
KEY idx_opse_type_received (event_type, received_at)
KEY idx_opse_order_prefix (merchant_order_id_prefix)
KEY idx_opse_signature (signature_state)
KEY idx_opse_raw_digest (raw_body_digest)
KEY idx_opse_ip_time (source_ip_hash, received_at)
KEY idx_opse_received (received_at)
```

`payments`:

```sql
UNIQUE KEY uniq_payments_allocation_key (allocation_key)
KEY idx_payments_paid_by_attempt (paid_by_order_payment_attempt_id)
```

All names are under MySQL's 64-character identifier limit. Future migration must detect table-local name collisions before DDL.

## 12. Lock Order

Every financial mutation uses this order:

1. parent `Order` using `FOR UPDATE`;
2. `order_collection_claims` using `FOR UPDATE`;
3. relevant `OrderPaymentAttempt` using `FOR UPDATE`;
4. all parent `Suborder` rows using `FOR UPDATE`;
5. stable `Payment` allocations using `FOR UPDATE`;
6. relevant `PaymentProof`, inbox, event, and security rows using `FOR UPDATE`.

Covered flows:

- Duitku callback;
- reconciliation;
- QRIS fallback activation;
- seller proof approve/reject in `server/src/routes/seller.payments.ts`;
- buyer cancellation;
- QRIS expiry.

## 13. Exact QRIS Active Profile Readiness

Authoritative field: `{STORES_TABLE}.active_store_payment_profile_id`.

Eligibility:

- store status is `ACTIVE`;
- active profile id is present;
- profile id equals `active_store_payment_profile_id`;
- profile `store_id` equals store id;
- `is_active = 1`;
- `verification_status = 'ACTIVE'`;
- `snapshot_status = 'ACTIVE'`;
- `provider_code = 'MANUAL_QRIS'`;
- `payment_type = 'QRIS_STATIC'`;
- `qris_image_url` is present and non-empty;
- QR rendering fields used by existing checkout are valid.

Do not use `{SUBORDERS_TABLE}.store_payment_profile_id` to decide readiness before fallback. Snapshot profile id and QR fields only during fallback activation.

Final readiness query:

```sql
SELECT s.order_id,
       s.store_id,
       COUNT(DISTINCT spp.id) AS eligible_profile_count
FROM {SUBORDERS_TABLE} s
JOIN {STORES_TABLE} st
  ON st.id = s.store_id
LEFT JOIN {STORE_PAYMENT_PROFILES_TABLE} spp
  ON spp.id = st.active_store_payment_profile_id
 AND spp.store_id = st.id
 AND spp.is_active = 1
 AND spp.verification_status = 'ACTIVE'
 AND spp.snapshot_status = 'ACTIVE'
 AND spp.provider_code = 'MANUAL_QRIS'
 AND spp.payment_type = 'QRIS_STATIC'
 AND spp.qris_image_url IS NOT NULL
 AND spp.qris_image_url <> ''
WHERE st.status = 'ACTIVE'
GROUP BY s.order_id, s.store_id
HAVING eligible_profile_count <> 1;
```

## 14. Static Preflight Phases

All SQL is read-only. Do not run against production without separate approval.

### A. Pre-DDL Live-Schema Checks

Only existing tables and columns are queried.

```sql
SELECT VERSION() AS mysql_version, DATABASE() AS current_schema;
```

```sql
SELECT table_name, engine
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND LOWER(table_name) IN ('users','orders','suborders','payments','payment_proofs','payment_status_logs','stores','store_payment_profiles')
ORDER BY LOWER(table_name), table_name;
```

```sql
SELECT LOWER(table_name) AS logical_name,
       COUNT(*) AS variant_count,
       GROUP_CONCAT(table_name ORDER BY table_name SEPARATOR ', ') AS variants
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND LOWER(table_name) IN ('users','orders','suborders','payments','payment_proofs','payment_status_logs','stores','store_payment_profiles')
GROUP BY LOWER(table_name)
HAVING COUNT(*) <> 1;
```

```sql
SELECT table_name, column_name, column_type, is_nullable, column_default, column_key, extra
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND LOWER(table_name) IN ('users','orders','suborders','payments','payment_proofs','payment_status_logs','stores','store_payment_profiles')
ORDER BY LOWER(table_name), ordinal_position;
```

```sql
SELECT table_name, index_name, non_unique,
       GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',') AS columns_in_order
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND LOWER(table_name) IN ('users','orders','suborders','payments','payment_proofs','payment_status_logs','stores','store_payment_profiles')
GROUP BY table_name, index_name, non_unique
ORDER BY LOWER(table_name), index_name;
```

```sql
SELECT kcu.table_name, kcu.column_name, kcu.constraint_name,
       kcu.referenced_table_name, kcu.referenced_column_name,
       rc.update_rule, rc.delete_rule
FROM information_schema.key_column_usage kcu
JOIN information_schema.referential_constraints rc
  ON rc.constraint_schema = kcu.constraint_schema
 AND rc.constraint_name = kcu.constraint_name
WHERE kcu.table_schema = DATABASE()
  AND LOWER(kcu.table_name) IN ('users','orders','suborders','payments','payment_proofs','payment_status_logs','stores','store_payment_profiles')
  AND kcu.referenced_table_name IS NOT NULL
ORDER BY LOWER(kcu.table_name), kcu.constraint_name, kcu.ordinal_position;
```

```sql
SELECT table_name, column_name, column_type
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND (
    (LOWER(table_name) = 'payments' AND column_name IN ('payment_channel','payment_type','status'))
    OR (LOWER(table_name) = 'suborders' AND column_name IN ('payment_method','payment_status'))
    OR (LOWER(table_name) = 'stores' AND column_name = 'status')
    OR (LOWER(table_name) = 'store_payment_profiles' AND column_name IN ('provider_code','payment_type','snapshot_status','verification_status'))
  );
```

Existing orphan and amount checks use resolved table placeholders:

```sql
SELECT s.id, s.order_id
FROM {SUBORDERS_TABLE} s
LEFT JOIN {ORDERS_TABLE} o ON o.id = s.order_id
WHERE o.id IS NULL
LIMIT 50;
```

```sql
SELECT p.id, p.suborder_id
FROM {PAYMENTS_TABLE} p
LEFT JOIN {SUBORDERS_TABLE} s ON s.id = p.suborder_id
WHERE s.id IS NULL
LIMIT 50;
```

```sql
SELECT id, total_amount
FROM {ORDERS_TABLE}
WHERE total_amount IS NULL OR total_amount <= 0 OR total_amount <> ROUND(total_amount, 0)
LIMIT 50;
```

Migration runner/runtime compatibility is checked by comparing configured deployment variables outside SQL and must confirm support for `DATABASE_URL`, `DB_PORT`, SSL, and dialect settings before migration execution.

### B. Partial-Migration Detection

Read-only detection for objects that may exist from a failed or interrupted run.

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND LOWER(table_name) IN ('order_collection_claims','order_payment_attempts','duitku_callback_inbox','order_payment_attempt_events','order_payment_security_events')
ORDER BY LOWER(table_name);
```

```sql
SELECT table_name, column_name, column_type, is_nullable, column_default, column_key, extra
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND (
    LOWER(table_name) IN ('order_collection_claims','order_payment_attempts','duitku_callback_inbox','order_payment_attempt_events','order_payment_security_events')
    OR (LOWER(table_name) = 'payments' AND column_name IN ('allocation_key','paid_by_order_payment_attempt_id'))
  )
ORDER BY LOWER(table_name), ordinal_position;
```

```sql
SELECT table_name, index_name, non_unique,
       GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',') AS columns_in_order
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND LOWER(table_name) IN ('order_collection_claims','order_payment_attempts','duitku_callback_inbox','order_payment_attempt_events','order_payment_security_events','payments')
GROUP BY table_name, index_name, non_unique
ORDER BY LOWER(table_name), index_name;
```

```sql
SELECT filename, created_at
FROM migrations
WHERE filename LIKE '%duitku%'
   OR filename LIKE '%payment_attempt%'
   OR filename LIKE '%collection_claim%'
   OR filename LIKE '%callback_inbox%'
   OR filename LIKE '%allocation_key%'
ORDER BY created_at, filename;
```

Decision:

- exact match continues idempotently;
- incompatible partial state fails loudly;
- migration does not silently repair or overwrite incompatible schema.

### C. Post-DDL Structural Verification

This phase runs only after approved DDL has created the new objects.

```sql
SELECT table_name, column_name, column_type, is_nullable, column_default, column_key, extra
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND LOWER(table_name) IN ('order_collection_claims','order_payment_attempts','duitku_callback_inbox','order_payment_attempt_events','order_payment_security_events')
ORDER BY LOWER(table_name), ordinal_position;
```

```sql
SELECT table_name, index_name, non_unique,
       GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',') AS columns_in_order
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND LOWER(table_name) IN ('order_collection_claims','order_payment_attempts','duitku_callback_inbox','order_payment_attempt_events','order_payment_security_events','payments')
GROUP BY table_name, index_name, non_unique
ORDER BY LOWER(table_name), index_name;
```

```sql
SELECT kcu.table_name, kcu.column_name, kcu.constraint_name,
       kcu.referenced_table_name, kcu.referenced_column_name,
       rc.update_rule, rc.delete_rule
FROM information_schema.key_column_usage kcu
JOIN information_schema.referential_constraints rc
  ON rc.constraint_schema = kcu.constraint_schema
 AND rc.constraint_name = kcu.constraint_name
WHERE kcu.table_schema = DATABASE()
  AND LOWER(kcu.table_name) IN ('order_collection_claims','order_payment_attempts','duitku_callback_inbox','order_payment_attempt_events','order_payment_security_events','payments')
  AND kcu.referenced_table_name IS NOT NULL
ORDER BY LOWER(kcu.table_name), kcu.constraint_name, kcu.ordinal_position;
```

### D. Post-Backfill And Data-Invariant Verification

Scope: orders that have `order_collection_claims` or at least one non-null `payments.allocation_key`.

Duplicate allocation key:

```sql
SELECT allocation_key, COUNT(*) AS duplicate_count
FROM {PAYMENTS_TABLE}
WHERE allocation_key IS NOT NULL
GROUP BY allocation_key
HAVING COUNT(*) > 1;
```

Missing stable allocation in new scope:

```sql
SELECT s.order_id, s.id AS suborder_id, COUNT(p.id) AS stable_allocation_count
FROM {SUBORDERS_TABLE} s
JOIN order_collection_claims occ ON occ.order_id = s.order_id
LEFT JOIN {PAYMENTS_TABLE} p
  ON p.suborder_id = s.id
 AND p.allocation_key IS NOT NULL
GROUP BY s.order_id, s.id
HAVING stable_allocation_count <> 1;
```

Stable allocation total:

```sql
SELECT o.id AS order_id, o.total_amount, SUM(p.amount) AS stable_total
FROM {ORDERS_TABLE} o
JOIN order_collection_claims occ ON occ.order_id = o.id
JOIN {SUBORDERS_TABLE} s ON s.order_id = o.id
JOIN {PAYMENTS_TABLE} p ON p.suborder_id = s.id AND p.allocation_key IS NOT NULL
GROUP BY o.id, o.total_amount
HAVING SUM(p.amount) <> o.total_amount;
```

Attempt-order binding:

```sql
SELECT p.id AS payment_id, s.order_id AS allocation_order_id, a.order_id AS attempt_order_id
FROM {PAYMENTS_TABLE} p
JOIN {SUBORDERS_TABLE} s ON s.id = p.suborder_id
JOIN order_payment_attempts a ON a.id = p.paid_by_order_payment_attempt_id
WHERE p.paid_by_order_payment_attempt_id IS NOT NULL
  AND a.order_id <> s.order_id;
```

Maximum one claim per parent is structurally enforced and verified:

```sql
SELECT order_id, COUNT(*) AS claim_count
FROM order_collection_claims
GROUP BY order_id
HAVING COUNT(*) > 1;
```

Claim rail against payment channel:

```sql
SELECT occ.order_id, occ.rail, p.payment_channel, p.payment_type, COUNT(*) AS row_count
FROM order_collection_claims occ
JOIN {SUBORDERS_TABLE} s ON s.order_id = occ.order_id
JOIN {PAYMENTS_TABLE} p ON p.suborder_id = s.id AND p.allocation_key IS NOT NULL
GROUP BY occ.order_id, occ.rail, p.payment_channel, p.payment_type
HAVING (occ.rail = 'DUITKU_POP' AND (p.payment_channel <> 'DUITKU' OR p.payment_type <> 'DUITKU_POP'))
    OR (occ.rail = 'QRIS_STATIC' AND (p.payment_channel <> 'QRIS' OR p.payment_type <> 'QRIS_STATIC'));
```

Paid allocations against winner:

```sql
SELECT occ.order_id, occ.rail, occ.claim_state, COUNT(*) AS unpaid_count
FROM order_collection_claims occ
JOIN {SUBORDERS_TABLE} s ON s.order_id = occ.order_id
JOIN {PAYMENTS_TABLE} p ON p.suborder_id = s.id AND p.allocation_key IS NOT NULL
WHERE occ.claim_state = 'PAID'
  AND p.status <> 'PAID'
GROUP BY occ.order_id, occ.rail, occ.claim_state;
```

## 15. Endpoint Security Limits

Runtime implementation must enforce:

- body size: 64 KiB;
- form fields: 32;
- decoded field length before prefix storage: 2048 bytes;
- duplicate keys rejected;
- nested keys rejected;
- content type must be `application/x-www-form-urlencoded`;
- request timeout: 5 seconds;
- rate limit: 60 per source IP per minute and 600 per merchant code per minute;
- constant-time signature comparison.

Response policy:

- valid stored callback: HTTP 200;
- invalid signature stored: HTTP 200;
- malformed stored: HTTP 400;
- oversized stored: HTTP 413;
- unsupported content type: HTTP 415 after safe metadata write;
- transient storage failure: HTTP 5xx.

## 16. Reconciliation

Default:

- `ENABLE_DUITKU_STATUS_CHECK=false`.

Fields:

- `reconcile_attempt_count`;
- `next_reconcile_at`;
- `last_reconcile_error_code`;
- `last_reconcile_error_at`;
- `last_reconciled_at`.

Policy:

- initial delay 5 minutes;
- multiplier 2;
- cap 60 minutes;
- jitter 0 to 20 percent;
- maximum attempts 12;
- rate limit records `RATE_LIMIT`;
- timeout records `TIMEOUT`;
- retry exhaustion sets `UNKNOWN`, `requires_manual_review = TRUE`, and `manual_review_reason = 'RECONCILE_RETRY_EXHAUSTED'`.

## 17. Rollback Guards

Down migration refuses destructive rollback when rows or non-null evidence exist:

- `order_collection_claims`;
- `order_payment_attempts`;
- `duitku_callback_inbox`;
- `order_payment_attempt_events`;
- `order_payment_security_events`;
- `payments.allocation_key`;
- `payments.paid_by_order_payment_attempt_id`;
- rows using `DUITKU`, `DUITKU_POP`, or `suborders.payment_method = 'DUITKU'`.

## 18. Self-Review

Self-review status: complete; this is not an independent audit result.

Checks:

- migration remains `NOT APPROVED`;
- document remains pending independent re-audit;
- parent collection claim/winner is stored durably;
- valid-but-unbound callback has inbox storage;
- Create Invoice idempotency has a unique key;
- QRIS readiness uses `active_store_payment_profile_id`;
- static preflight is split into four phases;
- stable allocation verification is scoped to new claim/stable-allocation orders.
