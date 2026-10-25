# Step 3A: Shared Accounts

Status: implemented and locally verified. Follow
[ADR-0009](../../docs/ADR/ADR-0009-shared-accounts.md) and the
[business-feature summary](03-ui-business-logic.md).

## Implemented Scope

- Both roles list/view every account; only Managers create/edit through backend-authorized contracts.
- Trimmed, nonempty names of at most 40 characters, case-insensitive database uniqueness, immutable IDs and no nine-account cap.
- Atomic account mutation/audit, reload/restart persistence and private request-scoped SSR.
- Accessible responsive list/detail/dialog states with German/English catalogs.

## Acceptance Gate

- [x] Real browser/API checks cover create/edit/reload, shared Member reads and denied writes, anonymous access, CSRF, invalid/missing accounts and responsive layouts.
- [x] SQLite probes cover constraints, concurrent duplicate names, rename conflicts and atomic audit rollback.
- [x] Persisted account state and private SSR isolation survive restart without cross-user leakage.

Images, money and allowances are delivered in their respective slices, not
deferred features. Account archival/deletion is outside scope. Current commands
and release gates are in [testing](testing.md) and the [finish-line plan](README.md).