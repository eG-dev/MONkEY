# Step 3E: Allowance Configuration

Status: implemented and locally verified under
[ADR-0015](../../docs/ADR/ADR-0015-monthly-allowance-configuration.md).

## Implemented Scope

- Managers configure a positive exact monthly amount and enabled/disabled state; Members read the configuration.
- An opening entry is required before enabling. Disabling retains the configured amount.
- Immutable next-month effective revisions and audit history; saving alone never posts a credit.
- Periods use configured `TZ`, independently of language/browser timezone. Currency follows the instance display unit.
- Localized accessible controls and stale-edit/retry feedback on account details.

## Acceptance Gate

- [x] Real API/SQLite checks cover exact inputs, initialization, CSRF/role enforcement, immutable effective dates and atomic audit failure.
- [x] Same-request retries and conflicting/stale edits preserve one scheduled configuration and retain user input for recovery.
- [x] Desktop/mobile workflows cover Manager edits and Member reads; German/English catalogs are validated.
- [x] Reload/restart preserves settings and saving does not alter ledger history or imply successful execution.

Durable credits are implemented in [allowance execution](03f-allowance-execution.md).
Remaining hosted/publication/host acceptance is in the [finish-line plan](README.md).