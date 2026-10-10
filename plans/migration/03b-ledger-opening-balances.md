# Step 3B: ledger and opening balances

Status: locally implemented and verified on 2026-10-08. Depends on [shared accounts](03a-accounts.md).
Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

A manager explicitly initializes an account's balance through a ledger entry.
Both roles see the exact resulting balance. This establishes the posting contract
once, before adding ordinary transactions or automated credits.

## Agreed decisions

- Instance-wide EUR (default) or USD display unit, configured by `MONKEY_CURRENCY`; append its symbol after localized amounts. Currency is only a unit, with no conversion or financial-history changes; see [ADR-0011](../../docs/ADR/ADR-0011-currency-display-unit.md).
- Two decimal places; exact signed 64-bit integer minor units internally and decimal strings in the API. Reject extra precision rather than rounding silently.
- Signed opening amounts and balances, with no product-specific monetary cap; enforce the representation's range and checked arithmetic. [ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md) supersedes the original nonnegative policy during Step 3C.
- Accounts remain uninitialized until a Manager posts exactly one explicit opening entry, including zero. Existing accounts are not silently initialized; opening entries cannot be edited or repeated.
- Follow [ADR-0010](../../docs/ADR/ADR-0010-ledger-and-money.md) for atomic posting, historical provenance, and idempotent retry/conflict behavior. No Azure import or silent balance edits.

## Work

- Add ledger schema and backend application-service posting, with a ledger entry and any stored balance changed in one database transaction.
- Enforce unique idempotency keys and define repeated-key/conflicting-payload behavior under retries and concurrent requests.
- Store immutable actor user ID, UTC timestamp, source, and optional comment; retain an actor display snapshot where historical readability requires it.
- Add an explicit manager opening-entry workflow and localized balance display to account pages; never use a generic editable balance property.

## Acceptance gate

- [x] Opening entries and balances persist correctly; members read them but cannot post them.
- [x] Repeated/concurrent initialization cannot duplicate entries or bypass the agreed opening-entry rule.
- [x] Targeted real-SQLite checks prove exact arithmetic, constraints, and complete rollback on failure.
- [x] Browser tests verify localized entry/display, actionable failures, and unchanged monetary values when language changes.

## Local verification

- Locked backend/runtime-check build and real-SQLite `ledger-persistence` check passed, including upgrade of existing accounts without implicit initialization, exact arithmetic/range enforcement, and full audit-failure rollback.
- Angular SSR and production-image builds, German/English catalog validation, E2E typechecking, Compose USD forwarding, and editor diagnostics passed. EF reports no pending model changes.
- `npm --prefix tests/e2e test -- ledger.spec.ts` passed all eight ledger cases. `npm --prefix tests/e2e test` passed all 49 production-image cases, including the new unsupported-currency startup check.
- Real HTTPS/browser workflows cover both roles, CSRF, zero/maximum amounts, precision errors, idempotent retries/conflicts, concurrent openings, restart persistence, historical actor snapshots, and private SSR isolation.
- German/English desktop/mobile entry, language switches, EUR/USD suffix display, and exact maximum-value screenshots passed. Reopening the same volume under USD preserved the original amounts and posting provenance.

Hosted CI, publishing, and actual-host operational gates remain open. Reproducible
commands and configuration are in the [replacement guide](../../revamp/README.md).

## Deferred

Ordinary deposits/withdrawals and transaction-history pagination are now delivered
in [Step 3C](03c-transactions.md). Allowances remain deferred. Keep
financial history append-only; opening-entry correction must follow
the subsequently agreed correction policy, not silently rewrite an entry.

Next: [deposits, withdrawals, and history](03c-transactions.md).