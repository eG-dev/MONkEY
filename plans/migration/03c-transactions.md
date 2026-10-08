# Step 3C: deposits, withdrawals, and history

Status: approved scope locally implemented and verified on 2026-10-08; policy agreed in [ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md). Depends on [ledger and opening balances](03b-ledger-opening-balances.md). Dedicated reversal workflows are explicitly deferred.
Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

Managers post deposits/withdrawals. Both roles inspect balances and paginated
transaction history, including source, actor, time, and comments.

## Approved scope

- Manual deposit and withdrawal inputs are positive, with optional trimmed comments up to 500 characters. Negative opening amounts and overdrafts are now allowed, superseding the earlier nonnegative policy.
- History includes openings, newest first by persisted posting sequence, with snapshot-bounded keyset pagination (20 by default, maximum 100).
- Dedicated correction/reversal controls are explicitly deferred. Do not edit/delete financial history or expose an unapproved reversal workflow.

## Work

- Reuse the atomic, exact, idempotent posting service from 3B; adapt reviewed legacy behavior without moving business rules into Angular.
- Add backend-authorized posting/history contracts and manager deposit/withdrawal controls on account details.
- Render paginated history with localized dates/money from raw stored values, retaining UTC timestamps and immutable actor identity.
- Leave correction/reversal controls for a separately agreed follow-up; never silently update/delete history.
- Show actionable validation, conflict, and failure states rather than swallowing errors or presenting an unpersisted balance as successful.

## Acceptance gate

- [x] Deposits/withdrawals and their history survive reload/restart; members can read but direct member writes fail.
- [x] Concurrent manager writes produce correct balances; failed writes roll back entries and balances together.
- [x] Repeated clicks/retries do not double-post; conflicting reuse of an idempotency key follows the agreed contract.
- [x] Browser tests cover pagination, invalid inputs, overdrafts, representation overflow, both languages, and desktop/mobile layouts.
- [x] Changing language leaves amounts, timestamps, actor identity, and user-entered comments unchanged.

## Local verification

- Locked .NET solution/runtime-check and Angular SSR builds passed. German/English catalog validation, E2E typechecking, and EF pending-model check passed (none pending).
- The actual-SQLite `ledger-persistence` probe upgrades existing opening history without changing money/provenance, checks signed Int64 boundaries and source-sign constraints, and verifies atomic rollback of opening/manual audit failures.
- `npm --prefix tests/e2e test -- ledger.spec.ts` passed all 15 ledger cases against the rebuilt production image. The full `npm --prefix tests/e2e test` passed all 56 cases with `CI=true`, one worker, and zero retries in 10.4 minutes.
- API cases cover Manager/Member/anonymous boundaries, CSRF, positive manual inputs, required initialization, signed extremes, concurrent deltas, source/account-aware idempotency conflicts, snapshot pagination, historical actor names, and restart persistence.
- German/English desktop/mobile workflows cover negative openings, overdrafts, response-loss retries using the same key, escaped comments, previous/next pagination while new entries arrive, unchanged history after language switching, Member reads, and exact negative-limit screenshots without horizontal overflow.

Hosted GitHub, publishing, and actual-host operational gates remain open.

## Deferred follow-up

Dedicated correction/reversal workflows require a separately agreed policy and
implementation. No reversal, history edit, or history delete endpoint is exposed.

Next in the default order: [account images](03d-account-images.md).