# Duitku Step 9 Sandbox Evidence

Date: 2026-08-07

Status: IN PROGRESS / PARTIAL PASS.

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
- Callback inbox check: PASS for safety evidence; no real provider paid callback observed for `merchantOrderId=TPSTEP920260807020333`.
- Ngrok return URL inbox check: PASS for failed/unsuccessful provider return; Duitku sandbox hit `/payments/return?resultCode=01&merchantOrderId=TPSTEP920260807020333&reference=DS3388326HIG0JOFEZDSJYOM` and backend returned HTTP 302.

Required next environment action:

- keep backend and ngrok tunnel active while running browser/provider return scenarios;
- run a paid return/callback scenario after a Duitku sandbox payment reaches `resultCode=00`;
- capture real provider callback evidence if Duitku sends `POST /api/payments/duitku/callback` for the sandbox invoice;
- keep secret values out of git and out of this evidence file.

## Latest Callback And Return Inbox Check

Command evidence:

- Callback DB inbox inspected via `DuitkuCallbackInbox.findAll({ order: [["createdAt", "DESC"]], limit: 12 })`.
- Security-event DB inbox inspected via `OrderPaymentSecurityEvent.findAll({ order: [["createdAt", "DESC"]], limit: 6 })`.
- Ngrok local inspector inspected via `http://127.0.0.1:4040/api/requests/http`.

Observed callback inbox state:

- Latest trusted callback inbox row is the Step 9 simulated valid unknown-order callback: `merchantOrderIdRaw=TPSTEP9CB20260807020412`, `resultCodeRaw=00`, `signatureState=VALID`, `bindingState=UNBOUND`, `processingResult=QUARANTINED`, `quarantineReason=UNKNOWN_MERCHANT_ORDER_ID`, `duplicateCount=1`.
- Security events include the matching invalid-signature and malformed-form safety scenarios from the Step 9 callback runner.
- No trusted provider callback row was found for the real Create Invoice sandbox order `merchantOrderId=TPSTEP920260807020333` / `reference=DS3388326HIG0JOFEZDSJYOM`.

Observed return URL state:

- Ngrok recorded real browser/provider return requests for `merchantOrderId=TPSTEP920260807020333` and `reference=DS3388326HIG0JOFEZDSJYOM` with `resultCode=01`.
- Backend returned HTTP 302 for those requests, preserving the read-only Return URL contract.
- No return request with `resultCode=00` was observed for the same sandbox invoice during this check.

## Required Matrix

| # | Scenario | Status | Evidence Summary | Follow-up |
| --- | --- | --- | --- | --- |
| 1 | Create Invoice success with payment URL | PASS | `merchantOrderId=TPSTEP920260807020333`, `statusCode=00`, `statusMessage=SUCCESS`, `reference=DS3388326HIG0JOFEZDSJYOM`, payment URL returned by Duitku sandbox | Use payment URL for manual payment/return callback scenarios if needed |
| 2 | Create Invoice definitive rejection | PENDING |  |  |
| 3 | Create Invoice timeout or ambiguous response | PENDING |  |  |
| 4 | Create Invoice idempotent replay with matching fingerprint | PENDING |  |  |
| 5 | Create Invoice idempotent replay with mismatched fingerprint | PENDING |  |  |
| 6 | Valid paid callback `resultCode = 00` | PENDING | No real provider paid callback found for `merchantOrderId=TPSTEP920260807020333`; only the simulated unknown-order safety callback has `resultCodeRaw=00` and remains `UNBOUND`/`QUARANTINED` | Complete paid sandbox payment and capture provider callback or bound callback evidence |
| 7 | Valid failed callback `resultCode = 01` | PENDING | Failed/unsuccessful browser return observed with `resultCode=01`, but no provider `POST /api/payments/duitku/callback` with `resultCode=01` was found in callback inbox | Capture provider failed callback evidence if Duitku sends it for sandbox |
| 8 | Invalid signature callback | PASS | Public callback URL returned HTTP 200 with `accepted=false` and `storedAsSecurityEvent=true` |  |
| 9 | Malformed form callback | PASS | Public callback URL returned HTTP 400 with missing required fields; no financial mutation |  |
| 10 | Duplicate callback delivery | PASS | Duplicate valid callback returned HTTP 200 with `duplicate=true` |  |
| 11 | Unknown `merchantOrderId` callback | PASS | Valid signed callback for unknown order returned `bindingState=UNBOUND`, `processingResult=QUARANTINED`, `financialMutationApplied=false` |  |
| 12 | Late paid callback after QRIS fallback claim | PENDING |  |  |
| 13 | Return URL before payment | PASS | Public `DUITKU_RETURN_URL` returned HTTP 302 to `/user/my-orders` with query echo and no financial mutation |  |
| 14 | Return URL after payment | PENDING | No return request with `resultCode=00` observed for `merchantOrderId=TPSTEP920260807020333`; route itself remains reachable/read-only | Complete manual/provider paid flow |
| 15 | Return URL after failed payment | PASS | Ngrok recorded `/payments/return?resultCode=01&merchantOrderId=TPSTEP920260807020333&reference=DS3388326HIG0JOFEZDSJYOM`; backend returned HTTP 302 to the read-only order route and no financial mutation was performed |  |
| 16 | QRIS fallback after definitive Duitku failure | PENDING |  |  |
| 17 | QRIS fallback after provider-confirmed expiry | PENDING |  |  |
| 18 | Concurrent Duitku callback vs QRIS fallback | PENDING |  |  |
| 19 | Concurrent seller approval vs late Duitku callback | PENDING |  |  |
| 20 | Provider status check behavior with status check disabled | PENDING |  |  |

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
