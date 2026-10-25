# Step 3E: allowance configuration

Status: locally implemented; configuration acceptance was reverified on 2026-10-12 as part of the [Step 3F final acceptance set](03f-allowance-execution.md#delivery-evidence). Policy and design were approved on 2026-10-10 in [ADR-0015](../../docs/ADR/ADR-0015-monthly-allowance-configuration.md) and the [design index](../../docs/design/README.md). Depends on [ledger and opening balances](03b-ledger-opening-balances.md).
Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

Managers persist per-account monthly allowance settings. Members see the configured
amount and enabled/disabled state. This step does not run allowance jobs or claim
that any credit has been executed.

## Decisions before implementation

- Resolved: positive exact amounts in the existing range, retained amount when disabled, first-of-month credits at 00:00 in `TZ`, next-month changes, immutable revision/audit history, and opening-entry prerequisite for enabling; see [ADR-0015](../../docs/ADR/ADR-0015-monthly-allowance-configuration.md).

## Work

- Add backend-owned configuration persistence/migrations and Manager write/shared read contracts.
- Reuse the approved exact money representation and configured currency from 3B.
- Build localized allowance controls and member-visible configuration on account details.
- Keep business dates based on configured `TZ`, separate from presentation language/browser timezone; do not introduce an in-memory scheduler here.

## Acceptance gate

- [x] Manager settings persist across reload/restart; members read settings but direct configuration writes fail.
- [x] Invalid values and CSRF attempts fail without partially saving configuration.
- [x] English/EUR browser tests cover enabled/disabled state, effective-date behavior, and accessible desktop/mobile controls; German/English catalog validation passes separately.
- [x] Saving configuration alone never creates a ledger credit or misleading execution-success state.

The final 2026-10-12 production-image run passed the three configuration API/
SQLite checks and both configuration workflows on desktop/mobile, including
same-request retry, stale-edit recovery, immutable effective dates, retained
disabled amounts, and unchanged ledger history after saves. See the linked
Step 3F record for the exact command and independent remaining release gates.

Next: [allowance execution](03f-allowance-execution.md).