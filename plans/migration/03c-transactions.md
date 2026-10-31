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

## Current Actor Display Name - Backend/Data Proposal R1

**Approved, 2026-10-31:** "approved". The user requested that transactions retain
the display name recorded at posting, but show the user's current display name
while that user can still be resolved; otherwise show the stored name. This is
an output change, not permission to alter historical ledger entries.

### Data and behavior

- Existing `PocketMonkey.Storage.Entities.LedgerEntry` in
	[LedgerEntry.cs](../../backend/PocketMonkey.Storage/Entities/LedgerEntry.cs)
	already stores immutable `ActorId` and `ActorDisplayName`. Keep both fields,
	their constraints and stored values unchanged; no schema migration or backfill
	is needed. A renamed, disabled or role-changed user still resolves by exact
	immutable ID. A missing user falls back to the stored display-name snapshot;
	never infer an identity from a name. Automatic allowance entries keep their
	existing system attribution rather than resolving a user.
- The existing `PocketMonkey.Host.Services.LedgerAdministration` in
	[LedgerAdministration.cs](../../backend/PocketMonkey.Host/Services/LedgerAdministration.cs)
	resolves names when producing ledger responses. Fetch the distinct relevant
	users in a bounded query per result set rather than one query per entry. Use
	the current name in transaction history and opening entries. The existing
	`PocketMonkey.Host.Services.AccountAdministration` in
	[AccountAdministration.cs](../../backend/PocketMonkey.Host/Services/AccountAdministration.cs)
	applies the same rule to embedded opening entries in account list, retired
	list and detail responses. Existing new-post responses use the current name.
- An idempotent replay of an opening or transaction returns the same retained
	entry and performs no additional write, but its `actorDisplayName` reflects
	the currently resolved name and may differ from the original response after
	a rename. All other entry fields, conflict rules and posting guarantees remain
	unchanged. Existing [persistence API checks](../../tests/e2e/specs/ledger/persistence.spec.ts)
	currently expect the complete original response after a rename and must be
	updated for this deliberate response-semantic change.
- Financial exports and imports keep the stored snapshot and actor ID exactly
	as they are; no identity matching by name, export-format change, history
	rewrite or altered recovery behavior is proposed. If the stored ID cannot be
	resolved after recovery, display the snapshot. No new job is needed.

### Contract and decisions

- Keep existing routes, authorization, statuses and the shape of
	`PocketMonkey.Host.Contracts.Accounts.LedgerEntryResponse` in
	[LedgerEntryResponse.cs](../../backend/PocketMonkey.Host/Contracts/Accounts/LedgerEntryResponse.cs).
	Its `actorDisplayName` changes from always being the posting-time snapshot to
	the currently resolved name with snapshot fallback. Existing Angular history
	and opening-entry consumers need no new field or layout.
- [ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md)
	requires immutable stored provenance and replay of the retained entry. The
	proposed dynamic response name preserves the stored provenance but changes
	response semantics, including replay; the ADR now records that distinction.
	Continue to follow
	[ADR-0003](../../docs/ADR/ADR-0003-shared-instance-access.md) for immutable
	actor IDs and account access and
	[ADR-0021](../../docs/ADR/ADR-0021-portable-financial-recovery.md) for
	unchanged financial-only recovery.

### Verification after approval

- Real-stack checks post opening and manual entries, rename the Manager, and
	verify the current name in account responses, history and idempotent replay
	for both Manager and assigned Member reads. Confirm restart and pagination
	retain the behavior and that replay adds no posting or balance change.
- Real-persistence checks verify the stored snapshot remains unchanged, missing
	user IDs use it, disabled or role-changed users still resolve, automatic
	allowance attribution remains unchanged, and exports preserve stored values.
	Cover distinct actors in one page and account list, including unresolved IDs.
- These are planned checks, not evidence of implementation or verification.