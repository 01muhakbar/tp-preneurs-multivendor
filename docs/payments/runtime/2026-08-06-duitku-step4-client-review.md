# PAY-DUITKU-STEP4: Local Duitku Client Service Review

Date: 2026-08-06  
Environment: local development  
Reviewer: Codex developer audit  
Scope: Step 4 local/non-production Duitku client service only.

## Decision

Step 4 local/non-production client service: PASS.  
Step 5 callback raw parser gate: NOT APPROVED by this review.  
Shared financial transaction service, QRIS guard refactor, frontend DTO changes, sandbox, and production gates: NOT APPROVED.

This review confirms a local service boundary only. It does not approve checkout route integration, real user-flow provider calls, callback financial mutation, QRIS fallback activation, frontend payment behavior changes, sandbox pass, staging rollout, or production rollout.

## Provider Contract Source

Official Duitku POP Create Invoice documentation was checked on 2026-08-06.

Sources:

- https://docs.duitku.com/pop/en/
- https://docs.duitku.com/pop/id/

Confirmed contract:

- endpoint is `POST /api/merchant/createInvoice`;
- request type is `application/json`;
- sandbox base URL is `https://api-sandbox.duitku.com`;
- production base URL is `https://api-prod.duitku.com`;
- required request headers include `x-duitku-timestamp`, `x-duitku-signature`, and `x-duitku-merchantcode`;
- Create Invoice signature uses `HMAC_SHA256(merchantCode + timestamp, apiKey)`;
- response includes `merchantCode`, `reference`, `paymentUrl`, `statusCode`, and `statusMessage`;
- successful Create Invoice uses `statusCode = 00`.

## Files Reviewed

- `server/src/services/duitku/duitkuConfig.service.ts`
- `server/src/services/duitku/duitkuSigner.service.ts`
- `server/src/services/duitku/duitkuClient.service.ts`
- `server/src/services/duitku/duitkuTypes.ts`
- `server/src/services/duitku/duitkuRedaction.service.ts`
- `server/src/services/duitku/duitkuAttemptPersistence.service.ts`
- `server/src/scripts/smokeDuitkuStep4Client.ts`
- `.env.example`
- `server/.env.example`
- `server/package.json`
- `docs/payments/duitku-payment-architecture.md`

## Implemented Scope

Implemented:

- Duitku config resolver with disabled-by-default behavior;
- production runtime guard for the Step 4 client;
- Create Invoice HMAC SHA256 signer;
- Create Invoice request DTO builder;
- Create Invoice response normalizer;
- client service with fetch injection and timeout handling;
- redaction helper for credentials, signatures, tokens, and payment URLs;
- attempt/event persistence helper that is not mounted into checkout routes;
- smoke validation script using mocked fetch only.

Not implemented:

- checkout route integration;
- real provider call from user flow;
- callback route;
- callback financial mutation;
- QRIS fallback activation;
- frontend behavior;
- sandbox matrix;
- production rollout.

## Validation Commands

```powershell
pnpm.cmd -F server build
```

Result: pass.

```powershell
pnpm.cmd -F server smoke:duitku-step4-client
```

Result: pass.

Observed smoke checks:

- Create Invoice HMAC SHA256 signer;
- Create Invoice headers;
- sandbox config resolver;
- production guard;
- request DTO builder;
- client success mapping with mocked fetch;
- client failed-provider mapping with mocked fetch;
- redaction helper;
- idempotency and request fingerprint hashes;
- provider-limit validation.

```powershell
git diff --check
```

Result: pass. Git emitted CRLF normalization warnings for `.env.example` and `server/.env.example`, but no whitespace error.

## Runtime Safety Notes

- `DUITKU_ENABLED=false` by default.
- `resolveDuitkuConfig` refuses enabled Step 4 client usage when `NODE_ENV=production`.
- `DuitkuClient` is not imported by checkout routes.
- `DuitkuClient` accepts an injected `fetchImpl`; the smoke test uses mocked fetch and performs no network call.
- Persistence helper is available for later approved runtime work but is not called by any route in this step.

## Remaining Gates

Still blocked:

- Step 5 callback route raw parser;
- Step 6 shared financial transaction service;
- Step 7 QRIS guard refactor;
- Step 8 frontend DTO changes;
- Step 9 sandbox matrix;
- Step 10 production rollout.

## Next Required Decision

Before any Step 5 work, record an explicit callback parser gate decision:

```text
Step 5 callback raw parser gate: APPROVED / NOT APPROVED.
Approved scope:
Reviewer:
Date:
Evidence:
```
