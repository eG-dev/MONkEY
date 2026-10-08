# ADR-0012 Manual Transactions and Signed Balances

_Creation date_: 2026-10-08

## Context

POCKET MONkEY accounts may owe money. Opening balances and subsequent balances
must therefore support negative values, while manual transaction inputs clearly
express a positive amount to deposit or withdraw. History must remain exact,
immutable, and stable when new entries are posted during pagination.

## Decision

- Allow signed opening amounts and balances throughout the signed 64-bit cent range. Allow overdrafts; reject representation overflow rather than imposing an insufficient-funds rule.
- Require strictly positive deposit and withdrawal inputs. Store deposits as positive ledger deltas and withdrawals as negative deltas. Retain exact two-decimal decimal-string transport and reject extra precision rather than rounding.
- Require an explicit opening before manual transactions. Preserve the one-opening constraint, including explicit zero and negative openings.
- Keep optional comments trimmed, empty-as-null, and at most 500 characters. Persist immutable actor identity, display-name snapshot, source, and UTC posting time.
- Commit every ledger delta, resulting balance, posting sequence, and audit event atomically. Retain unique idempotency keys; matching account, actor, source, amount, and comment replay the original entry, while conflicting reuse is rejected.
- Expose history to ready Managers and Members, newest first by a unique increasing posting sequence. Use keyset pagination, default 20 entries and maximum 100 per page, with a first-page snapshot bound so new postings do not shift subsequent pages. Include opening entries.
- Managers post manual transactions; backend authorization and antiforgery remain authoritative. Keep posted history append-only, with no edit, delete, or reversal endpoint.

This supersedes the negative-amount and negative-balance prohibition in
[ADR-0010](ADR-0010-ledger-and-money.md). Its exact-money, opening provenance,
atomicity, and retry guarantees remain in force. Currency remains a display unit
under [ADR-0011](ADR-0011-currency-display-unit.md). A dedicated correction or
reversal workflow requires a separately agreed policy.