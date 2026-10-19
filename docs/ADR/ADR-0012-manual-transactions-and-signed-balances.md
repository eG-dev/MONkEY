# ADR-0012 Manual Transactions and Signed Balances

_Creation date_: 2026-10-08

_Updated_: 2026-10-19

## Context

POCKET MONkEY accounts may owe money. Opening balances and subsequent balances
must therefore support negative values, while manual transaction inputs clearly
express a positive amount to deposit or withdraw. Retained history must remain
exact and immutable. Configurable retention must not change balances, permit
repeated postings or silently invalidate the meaning of a paginated history.

## Decision

- Allow signed opening amounts and balances throughout the signed 64-bit cent range. Allow overdrafts; reject representation overflow rather than imposing an insufficient-funds rule.
- Require strictly positive deposit and withdrawal inputs. Store deposits as positive ledger deltas and withdrawals as negative deltas. Retain exact two-decimal decimal-string transport and reject extra precision rather than rounding.
- Require an explicit opening before manual transactions. Preserve the one-opening constraint, including explicit zero and negative openings.
- Keep optional comments trimmed, empty-as-null, and at most 500 characters. Persist immutable actor identity, display-name snapshot, source, and UTC posting time.
- Keep ledger posting times as `DateTimeOffset` in application/API contracts, with a UTC `DateTime` EF provider mapping and readable SQLite `TEXT`. Normalize writes to UTC and explicitly restore UTC kind on reads, preserving full 100-nanosecond precision independently of the host timezone. This allows indexed database-side timestamp comparison and ordering through LINQ without storage-text inspection in application services. Normalize existing supported UTC representations losslessly; reject unexpected stored formats atomically rather than guessing an instant. Other timestamp mappings remain unchanged.
- Commit every ledger delta, resulting balance, posting sequence, and audit event atomically. Retain unique idempotency keys; matching account, actor, source, amount, and comment replay a retained original entry, while conflicting reuse is rejected. A retired key is never reusable and returns HTTP `409`, `transaction_history_expired`, instead of replaying deleted details.
- Expose history to ready Managers and Members, newest first by a unique increasing posting sequence. Use keyset pagination, default 20 entries and maximum 100 per page, with a first-page snapshot bound so new postings do not shift subsequent pages. Include opening entries.
- Managers post manual transactions; backend authorization and antiforgery remain authoritative. Keep retained financial entries immutable, with no public edit, delete, or reversal endpoint. Scheduled retention is the only approved removal exception.

### Transaction-detail retention

- Configure `MONKEY_TRANSACTION_RETENTION_MONTHS` at deployment: default `24`, positive integers from `1` through `120` (10 years), and `0` for unlimited. Reject values outside that range at startup; use unlimited retention when more than 10 years are needed. Use UTC calendar months, not a fixed day count, the business timezone or host-local time. The eligible boundary is `00:00:00Z` on the first day of the current UTC month minus the configured number of months; remove only strictly older entries. Clamp subtraction at the earliest representable month. `TZ` continues to govern allowance periods and timestamp display, not cleanup eligibility.
- Keep opening entries permanently. Remove only eligible deposits, withdrawals and credited allowance ledger rows. Preserve exact stored balances, financial audit events, allowance revisions and credited execution identities. Visible opening plus retained deltas need not reconstruct the current balance; never synthesize financial adjustments to hide that fact.
- Retain minimal retired-key records indefinitely without financial response payloads, comments or actor snapshots. Atomically move used keys to that storage when deleting their ledger rows. Keep a durable posting-sequence high-water mark, initialized from existing data and advanced atomically with financial posting; pruning must never reset it.
- Preserve the permanent allowance account/month identities under [ADR-0016](ADR-0016-monthly-allowance-execution.md). Require a matching durably credited execution before pruning an allowance row; uncertain evidence must not be deleted.
- Advance a durable retention revision with each committed pruning batch. Reject older history cursors with HTTP `409`, `history_retention_changed`, so callers discard cached pages and restart. New postings alone continue to respect the first-page snapshot bound. Pre-retention cursors require the same restart.
- Run bounded, serializable cleanup batches at startup and daily, with retries after interruption. Keep cleanup failures independent of business posting and readiness. Record nonfinancial cleanup audit events without retaining deleted payloads in logs.
- Enable cleanup automatically for positive durations; no activation command, confirmation prompt or activation-state fields. Schema initialization itself does not delete history, but the worker may prune eligible rows at startup, including after restoring a database. Set retention to `0` before starting a restored instance when cleanup must remain disabled. Shortening retention affects subsequent cleanup; increasing it or disabling cleanup does not restore deleted data. Maintain recoverable backups as operational guidance, not an application-enforced prerequisite. Restoring a verified backup, not a schema rollback, is the recovery path after deletion. Retention does not erase retained audit/execution/key metadata or historical backups and does not imply disk-space reclamation.
- Return configured retention months and a nullable UTC eligibility cutoff with history pages, identically for Managers and Members. Null means unlimited; a cutoff does not assert completed deletion. On a retention cursor conflict, callers discard that account's cached pages and reload the first page once; repeated conflicts use the existing error path rather than unbounded retries.

This supersedes the negative-amount and negative-balance prohibition in
[ADR-0010](ADR-0010-ledger-and-money.md). Its exact-money, opening provenance,
atomicity, and retry guarantees remain in force. Currency remains a display unit
under [ADR-0011](ADR-0011-currency-display-unit.md). A dedicated correction or
reversal workflow requires a separately agreed policy.

## Change History

- 2026-10-18: Approved retention R1 introduces bounded transaction-detail removal as an explicit exception to permanent ledger retention. Durable sequence allocation, retired keys, retained opening/allowance identities and cursor invalidation preserve financial safety without retaining complete expired transaction payloads. Backup-confirmed activation prevents schema initialization or the default duration from silently authorizing destructive cleanup.
- 2026-10-19: Accepted automatic cleanup from the first release instead of a separate activation gate, UTC calendar-month cutoffs independent of `TZ`, and history policy metadata with one bounded page restart. Allowance scheduling remains business-timezone based. Backups remain operational guidance, with restore-time startup pruning documented.
- 2026-10-19: Limited finite retention to 120 months (10 years); longer history uses the existing unlimited option rather than accepting larger finite durations.
- 2026-10-19: Approved UTC `DateTime` provider mapping for ledger timestamps, preserving `DateTimeOffset` contracts and exact instants while enabling database-side LINQ retention selection without coupling application services to timestamp suffixes.