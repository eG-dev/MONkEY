# Step 3F: allowance execution

Status: not started. Depends on [manual transactions](03c-transactions.md) and
[allowance configuration](03e-allowance-configuration.md).
Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

The backend durably credits due monthly allowances. Members see allowance status
and ledger credits; managers see execution outcomes and failures.

## Decisions before implementation

- Finalize missed-month catch-up, disabled-period handling, and subsequent `TZ` changes consistently with 3E effective-date rules.
- Agree retry/recovery behavior and evaluate the scheduler/job-state implementation; record approved enduring job decisions during this step.

## Work

- Replace the Azure pocket-money worker with backend scheduling and persistent execution state.
- Define account/period identities in business time using `TZ`, with raw UTC timestamps for events.
- Enforce a unique account/period credit identity in the database and post through the same atomic ledger service as manual writes.
- Resume pending work after startup/failure; do not rely on an in-memory timer firing exactly once.
- Persist execution outcomes and expose localized allowance status and manager-visible failures in the UI.

## Acceptance gate

- [ ] Due credits appear in persisted balances/history and status through the real application.
- [ ] Retries, concurrent execution, crashes, and restart cannot double-credit or leave partial financial writes.
- [ ] Deterministic real-SQLite/job-host tests cover month/DST boundaries, effective dates, disabled allowances, downtime/catch-up, and timezone policy.
- [ ] Browser tests verify member-visible status and actionable manager failure/recovery states in German and English.

## Deferred

Monthly reports are [deferred from the first release](03g-monthly-reports.md);
email is excluded. Test clocks/failure controls belong in isolated
test-host composition or protected operator tooling, never public production APIs.

Next: [management and lifecycle completion](03h-lifecycle.md).