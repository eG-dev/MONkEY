# Step 3G: monthly reports without email

Status: deferred from the first release; not a dependency of lifecycle completion
or cutover. Reopen only after a user need and scope are explicitly agreed.
Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Purpose and scope decision

The previous email use case does not justify report-generation jobs or persisted
snapshots in an application without email. The existing ledger/history is the
first-release financial record.

A later monthly summary could help users inspect opening balance, income,
spending, and closing balance. Prefer deriving such a view on demand from the
ledger if that meets the agreed need. A month filter or summary is a possible
follow-up, not an approved first-release feature.

Persisted immutable reports are justified only by a separately agreed need for
closed statements with frozen period meaning. The former snapshot/job approach
below remains a conditional proposal, not a delivery requirement.

## Decisions before implementation

- Establish who needs a monthly view and what question the existing history cannot answer.
- Choose on-demand ledger summaries versus persisted closed statements before designing report storage or jobs.
- For an agreed summary, define account/period selection, totals, empty-period behavior, and timezone boundaries.
- Only for persisted statements: agree period closure, late corrections, and boundaries after timezone changes without reinterpreting already closed periods.
- Download/export is outside this step unless explicitly agreed; it is not a substitute email feature.

## Conditional snapshot proposal

Only if closed statements are explicitly approved: depend on
[manual transactions](03c-transactions.md) and the evaluated durable job foundation
from [allowance execution](03f-allowance-execution.md). Do not introduce a second
scheduling mechanism.

- Generate snapshots from ledger boundaries with unique account/period constraints and durable retry/restart behavior.
- Reconcile opening/closing balances using retained opening entries/checkpoints from 3B and posted transactions.
- Determine monthly boundaries with `TZ`; retain raw timestamps/amounts and immutable closed-period meaning.
- Add authorized report contracts and Angular list/detail views, formatting only at presentation boundaries.
- Surface job outcomes/failures through the application. Do not port email triggers, SMTP templates, queues, delivery preferences, or resend controls.

## Gate if reopened

- [ ] User need and summary/statement scope are explicitly approved before implementation.
- [ ] Opening, income, spending, and closing totals reconcile with the exact ledger values for the selected period.
- [ ] Deterministic integration tests cover empty periods, late corrections, DST/month boundaries, and subsequent timezone changes.
- [ ] Both roles read the agreed views through real-stack browser tests; any agreed write actions enforce backend authorization.
- [ ] German/English presentation leaves report amounts, periods, and stored content unchanged.

### Additional gate for persisted statements

- [ ] Repeated generation/restart cannot create duplicate or silently changed snapshots.
- [ ] Managers can observe generation failures through real-stack browser tests.

The first-release path proceeds directly from
[allowance execution](03f-allowance-execution.md) to
[management and lifecycle completion](03h-lifecycle.md), without this step.