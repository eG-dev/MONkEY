# Step 3A: shared accounts

Status: locally implemented and verified on 2026-10-08. Depends on locally implemented
[authentication and authorization](02-authentication-authorization.md).
Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

Managers create and edit text-only accounts. Both roles can list and view all
accounts through the actual application. This is the first business/UI delivery,
not a financial or media feature.

## Agreed decisions

- Names are trimmed, nonempty, and at most 40 characters, with case-insensitive uniqueness enforced by the database.
- There is no artificial nine-account cap. Immutable IDs survive renaming.
- Follow [ADR-0009](../../docs/ADR/ADR-0009-shared-accounts.md) for account identity, naming, shared access, and atomic mutation/audit behavior.

## Work

- Introduce a tenant-free account model, schema migration, and backend persistence/application services independent of Azure SDK entities. Do not add per-user account assignments.
- Add explicit list/detail/create/edit API contracts with backend-enforced shared reads and Manager writes.
- Build Angular account listing/detail routes and manager creation/editing with Taiga UI and locally packaged Lucide assets.
- Deliver empty/loading/error states, validation errors, keyboard access, responsive layouts, and complete German/English catalogs.
- Keep SSR identity/language request-scoped, private data out of shared caches, and persisted results visible after reload.

## Acceptance gate

- [x] A manager can create and edit an account; changes survive reload and container restart.
- [x] Members can list and view every account but cannot create or edit, including direct API requests.
- [x] Anonymous access, CSRF attempts, missing accounts, and invalid inputs fail safely.
- [x] Real-stack browser tests cover both languages, desktop/mobile, and SSR/hydration without cross-user data leakage.

## Local verification

- Locked backend/runtime-check builds, Angular SSR and production-image builds, E2E typechecking, and German/English catalog validation passed. EF reported no pending model changes after generating the account migration.
- All 40 production-image cases passed, including eight account cases. Existing authentication, language-isolation, lifecycle, offline-assets, and timezone regressions remain covered.
- The mounted real-SQLite probe verifies duplicate-name/rename rollback, atomic audit outcomes, and the database name-length constraint. API cases cover concurrent case-insensitive creates, German-character duplicates, 40-character names, and more than nine accounts.
- Browser cases cover both languages and desktop/mobile, manager create/edit/reload, Member read-only access, empty/missing states, keyboard navigation, long-name wrapping, and clearing a revoked Member's private view. Private SSR is isolated from concurrent anonymous requests; persistence survives restart.

Reproducible commands and broader open gates are recorded in the
[replacement guide](../../docs/development.md#build-and-verify). Local acceptance does
not close hosted CI, publishing, or real-host deployment gates.

## Deferred

No balance fields, opening amounts, ledger entries, images, allowances, reports,
or account deletion. Do not invent starting balances or expose editable money.

Next: [ledger and opening balances](03b-ledger-opening-balances.md).