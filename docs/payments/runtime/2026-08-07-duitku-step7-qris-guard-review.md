# PAY-DUITKU-10: Step 7 QRIS Guard Refactor Review

Date: 2026-08-07.  
Environment: local development only.  
Decision: COMPLETED / PASS.

## Scope

Implemented:

- seller payment-review approve/reject route now calls the shared financial transaction service;
- seller payment-review route rejects non-QRIS allocations before seller proof review;
- seller payment-review list excludes Duitku allocations;
- local regression smoke script added at `server/src/scripts/smokeDuitkuStep7QrisGuard.ts`;
- smoke script covers seller review list exclusion, QRIS approval under QRIS claim, and QRIS approval blocked by Duitku claim.

Not implemented:

- no frontend DTO changes;
- no checkout route integration;
- no sandbox provider evidence;
- no production enablement.

## Validation

Commands run:

```powershell
pnpm.cmd -F server build
pnpm.cmd -F server smoke:duitku-step7-qris-guard
```

Result:

- build passed;
- initial smoke rerun was blocked because local MySQL/MariaDB was unavailable at `127.0.0.1:3306`;
- DB-backed smoke rerun passed after local MySQL/MariaDB became available on `127.0.0.1:3306`;
- static route inspection found no direct seller review `sequelize.transaction`, `payment.update`, `suborder.update`, proof update, `appendPaymentStatusLog`, or `recalculateParentOrderPaymentStatus` calls remaining in `server/src/routes/seller.payments.ts`;
- route now delegates approve/reject to `approveQrisProof` and `rejectQrisProof`.

DB-backed rerun completed:

```powershell
pnpm.cmd -F server smoke:duitku-step7-qris-guard
pnpm.cmd -F server smoke:duitku-step6-financial
pnpm.cmd -F server smoke:duitku-step5-callback
pnpm.cmd -F server smoke:duitku-step4-client
```

Rerun result:

- `pnpm.cmd -F server smoke:duitku-step7-qris-guard`: PASS.
- `pnpm.cmd -F server smoke:duitku-step6-financial`: PASS.
- `pnpm.cmd -F server smoke:duitku-step5-callback`: PASS.
- `pnpm.cmd -F server smoke:duitku-step4-client`: PASS.

## Approval Boundary

Step 7 is approved only for local/non-production QRIS guard refactor.

Step 8 frontend DTO changes were later approved and completed under local/non-production scope. Sandbox and production remain NOT APPROVED.
