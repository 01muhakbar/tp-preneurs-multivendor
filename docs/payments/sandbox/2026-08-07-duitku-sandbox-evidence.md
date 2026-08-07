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
| Sandbox return URL reachable by browser | FAIL | Public HTTPS URL returns HTTP 404 at `/payments/return`; return URL needs frontend route/tunnel correction before return scenarios |
| Non-production database selected | PASS | Local `ecommerce_dev` on `127.0.0.1:3306` |
| Test buyer/seller/store/order data seeded | PENDING | Test ids only |
| Production feature flags disabled | PENDING | Flag names and boolean values only |

Latest preflight result:

- `pnpm.cmd -F server preflight:duitku-step9-env`: PASS.
- `pnpm.cmd -F server build`: PASS.
- Backend local port `3001`: PASS.
- Database local port `3306`: PASS.
- Return URL route check: FAIL with HTTP 404 for `/payments/return`.

Required next environment action:

- point `DUITKU_RETURN_URL` to a reachable frontend/non-production return route;
- rerun `pnpm.cmd -F server preflight:duitku-step9-env`;
- recheck the return URL route before running return URL scenarios;
- keep secret values out of git and out of this evidence file.

## Required Matrix

| # | Scenario | Status | Evidence Summary | Follow-up |
| --- | --- | --- | --- | --- |
| 1 | Create Invoice success with payment URL | PASS | `merchantOrderId=TPSTEP920260807020333`, `statusCode=00`, `statusMessage=SUCCESS`, `reference=DS3388326HIG0JOFEZDSJYOM`, payment URL returned by Duitku sandbox | Use payment URL for manual payment/return callback scenarios if needed |
| 2 | Create Invoice definitive rejection | PENDING |  |  |
| 3 | Create Invoice timeout or ambiguous response | PENDING |  |  |
| 4 | Create Invoice idempotent replay with matching fingerprint | PENDING |  |  |
| 5 | Create Invoice idempotent replay with mismatched fingerprint | PENDING |  |  |
| 6 | Valid paid callback `resultCode = 00` | PENDING |  |  |
| 7 | Valid failed callback `resultCode = 01` | PENDING |  |  |
| 8 | Invalid signature callback | PASS | Public callback URL returned HTTP 200 with `accepted=false` and `storedAsSecurityEvent=true` |  |
| 9 | Malformed form callback | PASS | Public callback URL returned HTTP 400 with missing required fields; no financial mutation |  |
| 10 | Duplicate callback delivery | PASS | Duplicate valid callback returned HTTP 200 with `duplicate=true` |  |
| 11 | Unknown `merchantOrderId` callback | PASS | Valid signed callback for unknown order returned `bindingState=UNBOUND`, `processingResult=QUARANTINED`, `financialMutationApplied=false` |  |
| 12 | Late paid callback after QRIS fallback claim | PENDING |  |  |
| 13 | Return URL before payment | BLOCKED | Current `DUITKU_RETURN_URL` path returns HTTP 404 | Fix frontend/non-production return URL |
| 14 | Return URL after payment | BLOCKED | Current `DUITKU_RETURN_URL` path returns HTTP 404 | Fix frontend/non-production return URL |
| 15 | Return URL after failed payment | BLOCKED | Current `DUITKU_RETURN_URL` path returns HTTP 404 | Fix frontend/non-production return URL |
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
