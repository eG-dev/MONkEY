# Step 3C: Deposits, Withdrawals and History

Status: implemented and locally verified under
[ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md).
Dedicated reversal workflows remain deferred beyond the first release.

## Implemented Scope

- Manager deposits/withdrawals use positive exact inputs, optional trimmed comments up to 500 characters, signed balances and overdrafts within checked representation limits.
- Shared read-only history includes openings, actor/source/time/comment, newest first by durable posting sequence, with snapshot-bounded keyset pagination (default 20, maximum 100).
- Atomic posting/balance/audit, source/account-aware retry conflicts and actionable failure states; never show unpersisted writes as success.
- Approved transaction-detail retention preserves balances, openings, audits, retired keys and allowance identities; see [lifecycle](03h-lifecycle.md#transaction-retention-discussion).

## Acceptance Gate

- [x] Persisted postings/history survive reload/restart; Members read but direct writes fail.
- [x] Real SQLite/API probes cover signed limits, overflow, concurrent deltas, complete rollback and source-aware idempotency.
- [x] Browser workflows cover validation, overdrafts, response-loss retry, escaped comments, snapshot pagination and responsive layout.
- [x] Language changes do not alter stored money, UTC timestamps, actor attribution or user comments; German/English catalogs remain complete.

No manual history edit/delete or reversal endpoint is approved. Automatic
retention and offline empty-target financial reconstruction are the narrow
documented exceptions, not permission to rewrite live history. Current
verification and remaining gates are in [testing](testing.md) and
the [finish-line plan](README.md).