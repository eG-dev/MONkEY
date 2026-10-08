# Step 3G: monthly reports without email

Status: not started. Depends on [manual transactions](03c-transactions.md) and
the durable execution foundation from [allowance execution](03f-allowance-execution.md).
Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

Backend jobs generate immutable monthly report snapshots. Both roles browse report
lists/details; managers can see generation failures. Reuse the evaluated job
foundation rather than introducing a second scheduling mechanism.

## Decisions before implementation

- Agree period closure, late corrections, and empty-period behavior.
- Define boundaries after timezone changes without reinterpreting already closed periods.
- Download/export is outside this step unless explicitly agreed; it is not a substitute email feature.

## Work

- Generate snapshots from ledger boundaries with unique account/period constraints and durable retry/restart behavior.
- Reconcile opening/closing balances using retained opening entries/checkpoints from 3B and posted transactions.
- Determine monthly boundaries with `TZ`; retain raw timestamps/amounts and immutable closed-period meaning.
- Add authorized report contracts and Angular list/detail views, formatting only at presentation boundaries.
- Surface job outcomes/failures through the application. Do not port email triggers, SMTP templates, queues, delivery preferences, or resend controls.

## Acceptance gate

- [ ] Report opening/closing balances reconcile; repeated generation/restart cannot create duplicate or silently changed snapshots.
- [ ] Deterministic integration tests cover empty periods, late corrections, DST/month boundaries, and subsequent timezone changes.
- [ ] Both roles read reports, unauthorized writes fail, and managers can observe failures through real-stack browser tests.
- [ ] German/English presentation leaves report amounts, periods, and stored content unchanged.

Next: [management and lifecycle completion](03h-lifecycle.md).