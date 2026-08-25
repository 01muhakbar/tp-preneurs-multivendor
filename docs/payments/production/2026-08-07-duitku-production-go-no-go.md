# Duitku Step 10: Production Go/No-Go Report

Date: 2026-08-07

Status: APPROVED

Approval boundary: Step 10 is approved for Duitku production rollout. This removes the `NODE_ENV=production` panic guards from the codebase, migrating safety boundary to the `DUITKU_ENABLED` feature flag.

## 1. Feature Flags & Configuration

- **Feature Flag**: `DUITKU_ENABLED` must be explicitly set to `true` to activate Duitku in production.
- **Initial State**: For the initial release phase, we recommend setting `DUITKU_ENABLED=false`. Once the infrastructure is verified on the live server, we can switch it to `true`.
- **Environment Context**: Ensure `DUITKU_ENV=production` in the live environment.
- **Provider API Keys**: The production values for `DUITKU_MERCHANT_CODE` and `DUITKU_API_KEY` must be configured securely on the server.
- **Endpoints**: 
  - Base URL should automatically resolve to `https://api-prod.duitku.com`.
  - Ensure `DUITKU_CALLBACK_URL` and `DUITKU_RETURN_URL` are valid, public HTTPS domains pointing to the live server.

## 2. Monitored Cohort & Rollout Strategy

- **Phase 1 (Silent Launch)**: Deploy codebase with `DUITKU_ENABLED=false`. Ensure no legacy flows break.
- **Phase 2 (Internal Verification)**: Enable `DUITKU_ENABLED=true` temporarily or for internal testing accounts only, perform one end-to-end checkout.
- **Phase 3 (General Availability)**: Keep `DUITKU_ENABLED=true` for all users and monitor the callback inbox strictly for the first 48 hours.

## 3. Rollback Plan

If critical issues are found in production:
1. **Immediate Halt**: Change `DUITKU_ENABLED=false` and restart the backend service. This instantly hides Duitku from the frontend and stops new invoices from being created.
2. **Data Preservation**: 
   - DO NOT delete or rollback the database schema (`order_collection_claims`, `duitku_callback_inbox`, `order_payment_attempts`). 
   - Durable evidence of in-flight payments must be preserved.
   - Any late callbacks for already created invoices will still be received and stored securely in the inbox for auditing or quarantine, even if Duitku creation is disabled.
3. **Fallback to QRIS**: Buyers will automatically fall back to the existing QRIS workflow for unpaid transactions.

## 4. Operations Process (Runbook)

Operations staff must be prepared for the following scenarios:
- **UNKNOWN Status Attempts**: If a payment attempt becomes stuck in `UNKNOWN` (e.g., timeout to provider), it will be flagged for manual review (`requires_manual_review = true`). Operations should check the Duitku Merchant Dashboard to confirm if the invoice was successfully created.
- **Quarantined Callbacks**: Callbacks that cannot be safely bound to an attempt or are blocked by an existing QRIS claim are marked as `QUARANTINED` in `duitku_callback_inbox`. Staff must review these manually.
- **Late Callbacks**: If a Duitku payment arrives late but the order was already paid via QRIS, the callback will be stored as evidence but will not mutate financial status. Operations must process refunds manually via the Duitku Dashboard.

## 5. Go/No-Go Decision

- [x] Sandbox Evidence Reviewed & Passed
- [x] Panic Guards Removed from codebase
- [x] CI/CD Smoke Tests Passed
- [x] Product Owner Approval
- [x] Tech Lead Approval

---
**Approver Signature**: *APPROVED BY MANAGEMENT & DEV TEAM - 2026-08-07*
