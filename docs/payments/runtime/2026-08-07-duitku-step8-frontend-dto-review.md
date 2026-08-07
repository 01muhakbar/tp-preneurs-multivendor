# Duitku Step 8 Frontend DTO Review

Date: 2026-08-07

Status: COMPLETED / PASS for local non-production frontend DTO changes.

Approval boundary: Step 8 is approved only for local/non-production buyer, seller, and admin DTO display changes plus regression tests. Sandbox and production remain NOT APPROVED.

## Implemented Scope

- Added a shared payment collection DTO contract for frontend consumers.
- Added backend serialization for buyer payment detail, seller payment review, and admin payment audit surfaces:
  - `collectionRail`
  - `claimState`
  - `attemptStatus`
  - `paymentUrl`
  - `callbackState`
  - `manualReviewReason`
  - `allocations`
- Updated buyer payment adapter and view:
  - Duitku hosted payments show a hosted payment action when `paymentUrl` exists.
  - QRIS proof upload remains available only for QRIS static allocation flows.
  - Duitku hosted payments do not expose manual proof submission.
- Updated seller DTO adapter:
  - Duitku hosted allocations are not reviewable in the QRIS proof lane.
  - QRIS static allocations remain reviewable when backend actionability allows it.
- Updated admin audit list/detail:
  - collection rail, claim, attempt, callback, payment URL, and allocation context are visible.

## Validation

Passed:

- `pnpm.cmd qa:duitku-step8-dto`
- `pnpm.cmd -F server build`
- `pnpm.cmd -F client build`

Smoke coverage:

- buyer Duitku hosted payment DTO keeps proof upload disabled and exposes `paymentUrl`;
- buyer QRIS DTO keeps proof submission enabled;
- seller Duitku rail disables QRIS proof review even if legacy actionability is true;
- seller QRIS static rail remains reviewable.

## Remaining Gates

- Step 9 sandbox matrix is NOT APPROVED.
- Step 10 production rollout is NOT APPROVED.
- DB-backed Step 7 regression rerun remains blocked until local MySQL/MariaDB is available on `127.0.0.1:3306`.

Before requesting Step 9 sandbox approval, rerun:

```powershell
pnpm.cmd -F server smoke:duitku-step7-qris-guard
```

and record the result in the architecture decision log.
