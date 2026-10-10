# Step 3E: allowance configuration

Status: implementation in progress; policy approved by the user on 2026-10-10 in [ADR-0015](../../docs/ADR/ADR-0015-monthly-allowance-configuration.md). Depends on [ledger and opening balances](03b-ledger-opening-balances.md).
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

- [ ] Manager settings persist across reload/restart; members read settings but direct configuration writes fail.
- [ ] Invalid values and CSRF attempts fail without partially saving configuration.
- [ ] English/EUR browser tests cover enabled/disabled state, effective-date behavior, and accessible desktop/mobile controls; German/English catalog validation passes separately.
- [ ] Saving configuration alone never creates a ledger credit or misleading execution-success state.

Next: [allowance execution](03f-allowance-execution.md).