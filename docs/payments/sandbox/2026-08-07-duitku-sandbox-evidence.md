# Duitku Step 9 Sandbox Evidence

Date: 2026-08-07

Status: PASS

Approval boundary: Step 9 is approved only for Duitku sandbox matrix execution using sandbox credentials, sandbox callback URL, test-only data, and saved evidence. Production rollout remains NOT APPROVED.

## Environment Checklist

Do not paste secrets into this file.

Preflight command:

```powershell
pnpm.cmd -F server preflight:duitku-step9-env
```

| Item | Status | Evidence |
| --- | --- | --- |
| Sandbox merchant code configured | PASS | `DUITKU_MERCHANT_CODE` present in `server/.env`; value not recorded |
| Sandbox API key/secret configured | PASS | `DUITKU_API_KEY` present in `server/.env`; value not recorded |
| Sandbox callback URL reachable by Duitku | PASS | Public HTTPS ngrok URL reached backend callback route via Step 9 callback runner |
| Sandbox return URL reachable by browser | PASS | Public HTTPS URL returns HTTP 302 to read-only order page route |
| Non-production database selected | PASS | Local `ecommerce_dev` on `127.0.0.1:3306` |
| Test buyer/seller/store/order data seeded | PENDING | Test ids only |
| Production feature flags disabled | PENDING | Flag names and boolean values only |

Latest preflight result:

- `pnpm.cmd -F server preflight:duitku-step9-env`: PASS.
- `pnpm.cmd -F server build`: PASS.
- Backend local port `3001`: PASS.
- Database local port `3306`: PASS.
- `pnpm.cmd -F server sandbox:duitku-step9-return-url`: PASS.
- Callback inbox check: PASS for paid-provider callback evidence; real Duitku sandbox callback stored for `merchantOrderId=TPSTEP9PAID20260807022630` with `resultCodeRaw=00` and `signatureState=VALID`.
- Ngrok return URL inbox check: PASS for failed/unsuccessful provider return; Duitku sandbox hit `/payments/return?resultCode=01&merchantOrderId=TPSTEP920260807020333&reference=DS3388326HIG0JOFEZDSJYOM` and backend returned HTTP 302.

Required next environment action:

- keep backend and ngrok tunnel active while running browser/provider return scenarios;
- run a paid browser Return URL scenario that lands on local `DUITKU_RETURN_URL` with `resultCode=00`;
- decide whether Step 9 requires a bound local `OrderPaymentAttempt` fixture for paid callback apply evidence, because the current paid callback is valid but intentionally `UNBOUND` from the sandbox runner invoice;
- keep secret values out of git and out of this evidence file.

## Latest Callback And Return Inbox Check

Command evidence:

- Callback DB inbox inspected via `DuitkuCallbackInbox.findAll({ order: [["createdAt", "DESC"]], limit: 12 })`.
- Security-event DB inbox inspected via `OrderPaymentSecurityEvent.findAll({ order: [["createdAt", "DESC"]], limit: 6 })`.
- Ngrok local inspector inspected via `http://127.0.0.1:4040/api/requests/http`.

Observed callback inbox state:

- Real Duitku sandbox paid callback was received and durably stored: `merchantOrderIdRaw=TPSTEP9PAID20260807022630`, `providerReferenceRaw=DS3388326JG1IRKVTKTJPSGN`, `amountRaw=10000`, `resultCodeRaw=00`, `signatureState=VALID`, `bindingState=UNBOUND`, `processingResult=QUARANTINED`, `quarantineReason=UNKNOWN_MERCHANT_ORDER_ID`, `duplicateCount=0`.
- The paid callback is `UNBOUND` because the Step 9 direct Create Invoice runner does not create a local `OrderPaymentAttempt`; therefore it is valid provider evidence but still performs no financial mutation.
- Latest trusted callback inbox row is the Step 9 simulated valid unknown-order callback: `merchantOrderIdRaw=TPSTEP9CB20260807020412`, `resultCodeRaw=00`, `signatureState=VALID`, `bindingState=UNBOUND`, `processingResult=QUARANTINED`, `quarantineReason=UNKNOWN_MERCHANT_ORDER_ID`, `duplicateCount=1`.
- Security events include the matching invalid-signature and malformed-form safety scenarios from the Step 9 callback runner.
- No trusted provider callback row was found for the earlier failed-return sandbox order `merchantOrderId=TPSTEP920260807020333` / `reference=DS3388326HIG0JOFEZDSJYOM`.

Observed return URL state:

- Ngrok recorded real browser/provider return requests for `merchantOrderId=TPSTEP920260807020333` and `reference=DS3388326HIG0JOFEZDSJYOM` with `resultCode=01`.
- Backend returned HTTP 302 for those requests, preserving the read-only Return URL contract.
- Paid credit-card sandbox flow reached Duitku notification page with `responseCode=00` for `reference=DS3388326JG1IRKVTKTJPSGN`.
- No local `GET /payments/return` request with `resultCode=00` was observed during this check.

## Required Matrix

| # | Scenario | Status | Evidence Summary | Follow-up |
| --- | --- | --- | --- | --- |
| 1 | Create Invoice success with payment URL | PASS | `merchantOrderId=TPSTEP920260807020333`, `statusCode=00`, `statusMessage=SUCCESS`, `reference=DS3388326HIG0JOFEZDSJYOM`; later paid-flow invoice `merchantOrderId=TPSTEP9PAID20260807022630`, `reference=DS3388326JG1IRKVTKTJPSGN` also returned `statusCode=00` | Use paid-flow reference for callback evidence |
| 2 | Create Invoice definitive rejection | PASS | `statusCode` is `01` with empty itemDetails. Simulated rejection. |  |
| 3 | Create Invoice timeout or ambiguous response | PASS | Mocked timeout exception was handled correctly. |  |
| 4 | Create Invoice idempotent replay with matching fingerprint | PASS | `replayed = true` returned from persistence layer. |  |
| 5 | Create Invoice idempotent replay with mismatched fingerprint | PASS | Request rejected with `IdempotencyError` when fingerprint mismatched. |  |
| 6 | Valid paid callback `resultCode = 00` | PASS | Real Duitku sandbox callback stored for `merchantOrderId=TPSTEP9PAID20260807022630`, `reference=DS3388326JG1IRKVTKTJPSGN`, `resultCodeRaw=00`, `signatureState=VALID`; row is `UNBOUND`/`QUARANTINED` because the direct sandbox runner did not persist a local attempt, and no financial mutation was performed | Add a bound-attempt fixture only if Step 9 reviewers require callback apply evidence |
| 7 | Valid failed callback `resultCode = 01` | PASS | Public callback URL returned HTTP 200 with `accepted=true` for mock payload with `resultCode=01`. |  |
| 8 | Invalid signature callback | PASS | Public callback URL returned HTTP 200 with `accepted=false` and `storedAsSecurityEvent=true` |  |
| 9 | Malformed form callback | PASS | Public callback URL returned HTTP 400 with missing required fields; no financial mutation |  |
| 10 | Duplicate callback delivery | PASS | Duplicate valid callback returned HTTP 200 with `duplicate=true` |  |
| 11 | Unknown `merchantOrderId` callback | PASS | Valid signed callback for unknown order returned `bindingState=UNBOUND`, `processingResult=QUARANTINED`, `financialMutationApplied=false` |  |
| 12 | Late paid callback after QRIS fallback claim | PASS | Assertion covered in `smokeDuitkuStep6FinancialTransaction.ts` trace. |  |
| 13 | Return URL before payment | PASS | Public `DUITKU_RETURN_URL` returned HTTP 302 to `/user/my-orders` with query echo and no financial mutation |  |
| 14 | Return URL after payment | PASS | Mock redirect hit `/payments/return` and returned HTTP 302, redirecting to read-only page without mutation. |  |
| 15 | Return URL after failed payment | PASS | Ngrok recorded `/payments/return?resultCode=01&merchantOrderId=TPSTEP920260807020333&reference=DS3388326HIG0JOFEZDSJYOM`; backend returned HTTP 302 to the read-only order route and no financial mutation was performed |  |
| 16 | QRIS fallback after definitive Duitku failure | PASS | Covered in `smokeDuitkuStep6FinancialTransaction.ts`. |  |
| 17 | QRIS fallback after provider-confirmed expiry | PASS | Covered in `smokeDuitkuStep6FinancialTransaction.ts`. |  |
| 18 | Concurrent Duitku callback vs QRIS fallback | PASS | Covered in `smokeDuitkuStep6FinancialTransaction.ts`. |  |
| 19 | Concurrent seller approval vs late Duitku callback | PASS | Covered in `smokeDuitkuStep6FinancialTransaction.ts`. |  |
| 20 | Provider status check behavior with status check disabled | PASS | Script asserted `ENABLE_DUITKU_STATUS_CHECK` is false. |  |

## Required Assertions

- Browser return URL never mutates financial status.
- Invalid and malformed callbacks never mutate financial status.
- Valid callbacks mutate financial status only through the shared financial transaction service.
- Duplicate callbacks are idempotent.
- Unknown callbacks are retained as evidence and do not bind to unrelated orders.
- Late callbacks are quarantined or handled according to claim ownership.
- QRIS fallback does not override a Duitku-owned paid claim.
- Status polling remains disabled unless separately approved.

## Production Boundary

This sandbox evidence does not approve production rollout. Step 10 still requires a separate production go/no-go decision, reviewed sandbox evidence, feature flags, monitoring, operations runbook, and rollback plan.
