# Duitku Step 9 Sandbox Evidence

Date: 2026-08-07

Status: APPROVED FOR NON-PRODUCTION EXECUTION / PENDING SANDBOX RUN.

Approval boundary: Step 9 is approved only for Duitku sandbox matrix execution using sandbox credentials, sandbox callback URL, test-only data, and saved evidence. Production rollout remains NOT APPROVED.

## Environment Checklist

Do not paste secrets into this file.

| Item | Status | Evidence |
| --- | --- | --- |
| Sandbox merchant code configured | MISSING LOCAL ENV | `DUITKU_MERCHANT_CODE` not present in `server/.env` during precheck |
| Sandbox API key/secret configured | MISSING LOCAL ENV | `DUITKU_API_KEY` not present in `server/.env` during precheck |
| Sandbox callback URL reachable by Duitku | MISSING LOCAL ENV | `DUITKU_CALLBACK_URL` not present in `server/.env` during precheck |
| Sandbox return URL reachable by browser | MISSING LOCAL ENV | `DUITKU_RETURN_URL` not present in `server/.env` during precheck |
| Non-production database selected | PENDING | Database name and host only |
| Test buyer/seller/store/order data seeded | PENDING | Test ids only |
| Production feature flags disabled | PENDING | Flag names and boolean values only |

## Required Matrix

| # | Scenario | Status | Evidence Summary | Follow-up |
| --- | --- | --- | --- | --- |
| 1 | Create Invoice success with payment URL | PENDING |  |  |
| 2 | Create Invoice definitive rejection | PENDING |  |  |
| 3 | Create Invoice timeout or ambiguous response | PENDING |  |  |
| 4 | Create Invoice idempotent replay with matching fingerprint | PENDING |  |  |
| 5 | Create Invoice idempotent replay with mismatched fingerprint | PENDING |  |  |
| 6 | Valid paid callback `resultCode = 00` | PENDING |  |  |
| 7 | Valid failed callback `resultCode = 01` | PENDING |  |  |
| 8 | Invalid signature callback | PENDING |  |  |
| 9 | Malformed form callback | PENDING |  |  |
| 10 | Duplicate callback delivery | PENDING |  |  |
| 11 | Unknown `merchantOrderId` callback | PENDING |  |  |
| 12 | Late paid callback after QRIS fallback claim | PENDING |  |  |
| 13 | Return URL before payment | PENDING |  |  |
| 14 | Return URL after payment | PENDING |  |  |
| 15 | Return URL after failed payment | PENDING |  |  |
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
