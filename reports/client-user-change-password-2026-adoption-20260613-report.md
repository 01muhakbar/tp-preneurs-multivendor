# Client User Change Password 2026 Adoption Report

Date: 2026-06-13

## Scope

- Route: `/user/change-password`
- Main file: `client/src/pages/account/AccountChangePasswordPage.jsx`
- New slicing files:
  - `client/src/pages/account/AccountChangePassword2026View.jsx`
  - `client/src/pages/account/account-change-password-2026.css`
  - `client/src/pages/account/accountChangePassword2026Adapter.js`

## Implementation Summary

- Replaced the legacy inline Change Password markup with `AccountChangePassword2026View`.
- Kept `/user/change-password` wired to `AccountChangePasswordPage.jsx`.
- Kept the existing buyer account route chain through `StoreLayout`, `AccountGuard`, and `AccountLayout`.
- Kept password submit on the existing `changeUserPassword` helper and `POST /user/change-password` backend contract.
- Added adapter-level validation for current password, minimum length, letter and number, confirmation match, and new password differing from current password.
- Added live rules checklist and strength meter based on the new password field.
- Kept password fields hidden by default with per-field eye toggles.
- Kept sensitive fields in React state only and clears the form after successful password change.
- Preserved the existing success behavior: store auth notice, logout account session, then redirect to `/auth/login`.
- Scoped all new CSS classes with the `tppwd2026-` prefix.

## Guardrails Checked

- No new route was introduced.
- No new API endpoint was introduced.
- No duplicate header, footer, sidebar, or floating cart was added.
- Storefront layout ownership remains in `StoreLayout`.
- Buyer account auth remains separated from admin auth.
- Password fields are not written to `localStorage` or `sessionStorage`.

## QA

- `pnpm -F client build`: passed.
- `pnpm -F server build`: passed.
- `git diff --check` on touched Change Password files: passed.

## Smoke Routes

Dev server: `http://localhost:5174`

- `/user/change-password`: redirected to `/auth/login` as guest via `AccountGuard`; no page crash; no horizontal overflow at 1440px viewport.
- `/user/my-account`: redirected to `/auth/login` as guest via `AccountGuard`; no page crash; no horizontal overflow at 1440px viewport.
- `/user/update-profile`: redirected to `/auth/login` as guest via `AccountGuard`; no page crash; no horizontal overflow at 1440px viewport.
- `/user/shipping-address`: redirected to `/auth/login` as guest via `AccountGuard`; no page crash; no horizontal overflow at 1440px viewport.
- `/user/dashboard`: redirected to `/auth/login` as guest via `AccountGuard`; no page crash; no horizontal overflow at 1440px viewport.
- `/auth/forgot-password`: rendered; no page crash; no horizontal overflow at 1440px viewport.
- `/cart`: rendered; no page crash; no horizontal overflow at 1440px viewport.
- `/checkout`: rendered; no page crash; no horizontal overflow at 1440px viewport.
- `/`: rendered; no page crash; no horizontal overflow at 1440px viewport.
