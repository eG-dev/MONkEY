# Step 3C: deposits, withdrawals, and history

Status: not started. Depends on [ledger and opening balances](03b-ledger-opening-balances.md).
Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

Managers post deposits/withdrawals. Both roles inspect balances and paginated
transaction history, including source, actor, time, and comments.

## Decisions before implementation

- Agree manual amount/comment validation and how the approved negative-balance policy is presented.
- Define correction/reversal semantics and their UI scope before exposing them; prefer explicit compensating entries over history edits.
- Define stable ordering and bounded pagination for history.

## Work

- Reuse the atomic, exact, idempotent posting service from 3B; adapt reviewed legacy behavior without moving business rules into Angular.
- Add backend-authorized posting/history contracts and manager deposit/withdrawal controls on account details.
- Render paginated history with localized dates/money from raw stored values, retaining UTC timestamps and immutable actor identity.
- Implement agreed correction/reversal workflows through new entries, not silent updates/deletes.
- Show actionable validation, conflict, and failure states rather than swallowing errors or presenting an unpersisted balance as successful.

## Acceptance gate

- [ ] Deposits/withdrawals and their history survive reload/restart; members can read but direct member writes fail.
- [ ] Concurrent manager writes produce correct balances; failed writes roll back entries and balances together.
- [ ] Repeated clicks/retries do not double-post; conflicting reuse of an idempotency key follows the agreed contract.
- [ ] Browser tests cover pagination, invalid inputs, insufficient funds where applicable, corrections, both languages, and desktop/mobile layouts.
- [ ] Changing language leaves amounts, timestamps, actor identity, and user-entered comments unchanged.

Next in the default order: [account images](03d-account-images.md).