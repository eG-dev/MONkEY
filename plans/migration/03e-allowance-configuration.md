# Step 3E: allowance configuration

Status: not started. Depends on [ledger and opening balances](03b-ledger-opening-balances.md).
Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

Managers persist per-account monthly allowance settings. Members see the configured
amount and enabled/disabled state. This step does not run allowance jobs or claim
that any credit has been executed.

## Decisions before implementation

- Agree allowed amounts, enabled/disabled behavior, due date, effective-date semantics, and required configuration history.
- Define how edits affect future periods so the executor can apply configuration deterministically, rather than reconstructing past settings from the latest value.

## Work

- Add backend-owned configuration persistence/migrations and Manager write/shared read contracts.
- Reuse the approved exact money representation and configured currency from 3B.
- Build localized allowance controls and member-visible configuration on account details.
- Keep business dates based on configured `TZ`, separate from presentation language/browser timezone; do not introduce an in-memory scheduler here.

## Acceptance gate

- [ ] Manager settings persist across reload/restart; members read settings but direct configuration writes fail.
- [ ] Invalid values and CSRF attempts fail without partially saving configuration.
- [ ] Both-language browser tests cover enabled/disabled state, effective-date behavior, and accessible desktop/mobile controls.
- [ ] Saving configuration alone never creates a ledger credit or misleading execution-success state.

Next: [allowance execution](03f-allowance-execution.md).