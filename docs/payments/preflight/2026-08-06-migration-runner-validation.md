# PAY-DUITKU-STEP1: Migration Runner Validation

Date: 2026-08-06  
Environment: local development  
Scope: Step 1 only, migration runner fix and validation.  
Decision: Step 1 implementation validated locally; this does not approve DDL, database mutation, Duitku provider calls, callback processing, sandbox approval, or production rollout.

## Summary

Step 1 updated the migration runner so it resolves database targets consistently with runtime configuration and can be validated without applying migrations.

Implemented:

- `server/scripts/run-migrations.js` supports `DATABASE_URL`.
- `server/scripts/run-migrations.js` supports `DB_PORT`.
- `server/scripts/run-migrations.js` supports DB SSL env flags.
- `server/src/config/database.ts` supports the same DB SSL env flags.
- `server/scripts/run-migrations.js --print-config` prints a redacted target.
- `server/scripts/run-migrations.js --dry-run` validates migration file loading without database mutation.
- mixed `DATABASE_URL` and split `DB_*` configuration fails loudly when targets differ.
- Duitku financial migration guard refuses matching Duitku/payment-attempt migration filenames when `DB_SYNC=true`.

## Commands

```powershell
node --check server\scripts\run-migrations.js
```

Result: pass.

```powershell
node server\scripts\run-migrations.js --print-config
```

Result: pass. Output redacted username and did not print credentials.

```powershell
node server\scripts\run-migrations.js --dry-run
```

Result: pass. Existing `.cjs` and `.sql` migrations were read/validated without applying SQL and without opening a database connection.

```powershell
$env:DATABASE_URL='mysql://demo_user:demo_pass@example.test:3307/demo_db'
node server\scripts\run-migrations.js --print-config
Remove-Item Env:DATABASE_URL
```

Result: pass. Output used `DATABASE_URL` mode and redacted username/password.

```powershell
$env:DATABASE_URL='mysql://demo_user:demo_pass@example.test:3307/demo_db'
$env:DB_HOST='other.test'
node server\scripts\run-migrations.js --print-config
Remove-Item Env:DATABASE_URL
Remove-Item Env:DB_HOST
```

Result: expected fail. Runner rejected mixed configuration because `DATABASE_URL` and `DB_*` target fields differed.

```powershell
pnpm.cmd -F server build
```

Result: pass.

## Redaction Check

Observed config output:

- host visible;
- port visible;
- database visible;
- username redacted;
- password redacted or blank;
- SSL mode visible without printing CA content.

## Database Mutation Check

No DDL was created or applied.  
No migration was executed.  
No database connection was required for `--print-config` or `--dry-run`.

## Remaining Gates

Still blocked:

- migration approval;
- runtime integration approval;
- sandbox approval;
- production approval.

Next allowed step:

- Step 2 read-only DDL preflight, after selecting the intended local database target.
