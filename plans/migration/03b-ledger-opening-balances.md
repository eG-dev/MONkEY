# Step 3B: ledger and opening balances

Status: not started. Depends on [shared accounts](03a-accounts.md).
Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

A manager explicitly initializes an account's balance through a ledger entry.
Both roles see the exact resulting balance. This establishes the posting contract
once, before adding ordinary transactions or automated credits.

## Decisions before implementation

- Agree one configured currency, precision, rounding, limits, and negative-balance policy.
- Proposed default: integer minor units with explicit rounding. Never use binary floating-point for monetary calculations.
- Agree the API representation: bounded safe integers or decimal strings, without Angular precision loss.
- Define initialization of empty accounts created in 3A, zero opening amounts, and whether/when an opening entry may be posted. No Azure import or silent balance edits.
- Record the approved financial model/policies in an ADR during this step.

## Work

- Add ledger schema and backend application-service posting, with a ledger entry and any stored balance changed in one database transaction.
- Enforce unique idempotency keys and define repeated-key/conflicting-payload behavior under retries and concurrent requests.
- Store immutable actor user ID, UTC timestamp, source, and optional comment; retain an actor display snapshot where historical readability requires it.
- Supply opening-balance/checkpoint information needed for later reporting, without building report jobs now.
- Add an explicit manager opening-entry workflow and localized balance display to account pages; never use a generic editable balance property.

## Acceptance gate

- [ ] Opening entries and balances persist correctly; members read them but cannot post them.
- [ ] Repeated/concurrent initialization cannot duplicate entries or bypass the agreed opening-entry rule.
- [ ] Targeted real-SQLite checks prove exact arithmetic, constraints, and complete rollback on failure.
- [ ] Browser tests verify localized entry/display, actionable failures, and unchanged monetary values when language changes.

## Deferred

Ordinary deposits/withdrawals, transaction-history pagination, allowances, and
reports. Keep financial history append-only; opening-entry correction must follow
the subsequently agreed correction policy, not silently rewrite an entry.

Next: [deposits, withdrawals, and history](03c-transactions.md).