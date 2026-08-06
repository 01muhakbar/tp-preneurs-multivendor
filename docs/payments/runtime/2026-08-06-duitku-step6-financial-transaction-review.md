# PAY-DUITKU-09: Step 6 Shared Financial Transaction Service Review

Date: 2026-08-06.  
Environment: local development only.  
Decision: COMPLETED / PASS for Step 6 local/non-production shared financial transaction service only.

## Scope

Implemented:

- shared service boundary in `server/src/services/payments/financialTransaction.service.ts`;
- local/non-production runtime guard;
- declared lock order: parent order, collection claim, attempt, suborders, payments, evidence;
- `applyDuitkuCallback`;
- `applyDuitkuReconciliation` wrapper;
- `approveQrisProof`;
- `rejectQrisProof`;
- `cancelBuyerPayment`;
- `expirePayment`;
- `activateQrisFallback`;
- local smoke validation in `server/src/scripts/smokeDuitkuStep6FinancialTransaction.ts`.

Not implemented:

- no seller payment route refactor;
- no checkout route integration;
- no callback route financial-apply wiring;
- no frontend DTO changes;
- no sandbox evidence;
- no production rollout.

## Validation

Commands:

```powershell
pnpm.cmd -F server build
pnpm.cmd -F server smoke:duitku-step6-financial
```

Result:

- build passed;
- declared lock order matched expected sequence;
- Duitku paid callback applied through shared service;
- duplicate Duitku callback returned idempotent result;
- QRIS proof approval was blocked when the parent claim belonged to Duitku;
- QRIS proof approval succeeded only under a QRIS claim.

## Approval Boundary

Step 6 is approved and completed only for local/non-production shared financial transaction service implementation and tests.

The next gate is Step 7: QRIS Guard Refactor. It remains NOT APPROVED until explicitly approved. Step 7 must decide when and how existing seller QRIS approval/reject routes call this shared service.
