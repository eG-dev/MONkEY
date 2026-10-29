# ADR-0021 Portable Financial Recovery

_Creation date_: 2026-10-25

_Updated_: 2026-10-28

## Context

An operator needs portable financial recovery information independent of SQLite
files. The same valid synthetic snapshots can establish repeatable automated and
manual test scenarios. This does not replace a complete installation backup.

## Decision

- Before 1.0, compatibility with older or newer snapshot formats is not guaranteed. Reject an unsupported format rather than guessing or importing incomplete state. Do not publish a snapshot that cannot represent the current financial state; suspend incompatible import and export with a clear operator-facing reason until the contract supports it. Preserve existing snapshot files. Recovery scenarios remain deferred until requested or needed for 1.0. The requirements below apply when compatible recovery is enabled.
- Export one versioned JSON snapshot of accounts, exact stored balances, retained
  ledger details, audit metadata, allowance revisions/executions, retired posting
  keys and ledger maintenance counters. Preserve historical attribution. Exclude
  images, login identities, credentials, sessions and authentication keys.
- Keep money as exact decimal strings, 64-bit identifiers/counters as integer
  strings and timestamps as precise UTC instants. Preserve stored balances rather
  than reconstructing them from history that may have been pruned.
- Opt in through a private separate export directory. Check daily at 01:00 in
  business `TZ`. Publish only changed content compared with the last successful
  snapshot, ignoring capture metadata and the retention scan-completion heartbeat
  (still preserved in exported JSON). Actual pruning and safety counters remain
  part of comparison. Atomically publish completed files and
  record checked slots durably, including unchanged results. Retry interrupted
  work and capture one current snapshot after downtime, not invented past files.
- For ambiguous 01:00 use its first occurrence; for an invalid 01:00 use the first
  valid local instant after the gap. Never use elapsed 24-hour additions for
  business-date boundaries. Keep file timestamps in UTC.
- Keep 30 completed snapshots by default; allow counts 1 through 365, with 0
  meaning unlimited. Prune only owned completed files after successful publication,
  never on unchanged days. Count retention is separate from transaction retention.
- Recover only offline into empty financial state using one validated atomic
  transaction. Existing separately created users may remain. Never merge, replay
  credits, alter historical actors or replace existing financial records. Resume
  normal allowance and retention policies only when the application starts.
- Keep the backend responsible for snapshot consistency and import validation,
  following [ADR-0017](ADR-0017-backend-project-boundaries.md). No recovery HTTP
  endpoint or settings UI is provided. Require matching recovery configuration.
- Share version-controlled synthetic snapshots and the same importer across E2E,
  integration and manual tests. A test-only loader may explicitly reset only its
  verified disposable storage, recreating users separately. Never ship that reset
  capability in the production recovery command or production image.
- Continue manual stopped-container backups for the complete data root and
  deployment configuration under [ADR-0007](ADR-0007-application-foundation.md).
  Portable exports do not recover missing credentials, images, pruned details or
  writes made after capture, and a same-disk mount is not disaster protection.

This permits controlled empty-target reconstruction alongside the live-history
rules in [ADR-0012](ADR-0012-manual-transactions-and-signed-balances.md), preserving
the durable allowance identities in [ADR-0016](ADR-0016-monthly-allowance-execution.md).

## Alternatives

- CSV does not retain typed relationships and recovery metadata adequately.
- Separate account files can accidentally mix snapshots; ZIP adds no value when
  images are excluded. SQLite copies remain a separate complete-backup procedure.
- A web import or production replacement flag unnecessarily exposes destructive
  operations. Test-only reset keeps that privilege outside runtime delivery.

## Change History

- 2026-10-28: Clarified that prerelease imports need not support incompatible snapshot versions; unsupported formats are rejected.
- 2026-10-28: Incompatible prerelease recovery is suspended rather than allowed to silently lose state; recovery work is deferred until requested or required for 1.0.
