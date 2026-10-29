# Step 3H: Lifecycle Completion

Status: the agreed first-release lifecycle features are implemented and locally
verified. No additional profile/settings feature is approved or required merely
to close this step. Remaining release and real-host acceptance is tracked in the
[finish-line plan](README.md) and [operations plan](04-operations-cutover.md).

## Current Work Order

1. Preserve the implemented behavior and close any concrete acceptance findings.
2. Complete hosted release verification and beta publication.
3. Complete application-wide design/localization and deployment-specific review
   during the real-host rehearsal.

Do not restart completed About/legal/notice work or invent a manual transitive
dependency inventory. Use GitHub reporting and targeted distribution review under
[ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md), not mandatory ORT.
The curated collection is complete and its release review was explicitly confirmed;
changed shipped inputs still require review before distribution.

## Implemented Workflows

- User/role administration, password changes, forced password changes, disablement, session revocation and concurrent last-manager protection.
- Personal language/theme preferences without granting Members business-write access.
- Shared About from login, forced-password view and either signed-in role.
- Automatic UTC-month transaction-detail retention with balance/idempotency safeguards.
- Reviewed German/English self-hosted legal information; no consent endpoint or mandatory acceptance workflow.

Instance configuration remains the documented ENV contract. No tenant, email,
or user deletion/anonymization workflow is in scope. Account deletion and the R7
allowance revision are approved and have focused backend implementation; the UI
and production-image lifecycle verification remain pending. Dedicated reversals
remain deferred rather than a blocker for the first release.

## Self-Hosted Legal Content and License

The project uses `AGPL-3.0-only` under
[ADR-0018](../../docs/ADR/ADR-0018-project-license.md). The accepted
[bilingual self-hosted information](../../docs/terms/self_hosted_legal_information.md)
distinguishes instance operators, household users and project maintainers.
Operators own hosting, access, HTTPS, updates, backups and restore; the project
does not supply a managed service or promise availability/support.

The wording and its application presentation are accepted. Applicability to the
actual deployment, mandatory law and operator/privacy obligations remains a
deployment-specific review, not a reason to rewrite approved general wording.

### About Page and Third-Party Notices

One shared dialog provides Overview, Project license, Third-party notices and
Legal information. It is readable without authentication and offline, preserves
the underlying view/form, traps focus, restores the opener on Close/Escape and
keeps the header/tabs usable on desktop and phones.

Keep exact upstream legal texts separate from translated navigation/explanations.
About is a curated overview, not a complete dependency graph. Locally delivered
notices and corresponding source remain distribution requirements independently
of the number of UI entries. See the [notice guide](../../notices/README.md).

### Angular Delivery Evidence (2026-10-17)

The implemented shared dialog has current real-image coverage for public,
Manager, Member and forced-password entry points, keyboard/focus behavior,
representative notice shapes, original text and form preservation. Exhaustive
shipped-document hashes are checked separately in the offline-image test.
Current verification and commands are in [testing](testing.md); older per-run
delivery narratives are retained in Git, not an active backlog.

## About Content Update Process

- Use the application version from the web manifest and validated commit/tag/cleanliness metadata for About, image labels and release assets; follow [ADR-0019](../../docs/ADR/ADR-0019-build-identity-and-about-assets.md).
- Maintain mappings and original documents in `notices`; generate the root notice bundle and local About assets from those inputs. Do not hand-edit competing copies.
- Preserve unmodified project-license text and reviewed bilingual operator/privacy content.
- Review changed shipped dependencies, native payloads, assets and runtime/OS inputs. Routine patch/minor changes may reuse reviewed originals under ADR-0020 unless terms or applicability changed.
- Ordinary development builds package maintained inputs. Release builds additionally enforce evidence/hash/bundle consistency, completed collection and reviewed release status.
- Package everything before testing; publish the tested artifact without rebuilding. No runtime notice downloads, consent state or new backend contract is implied.

## Transaction Retention Discussion

The design is approved and implemented in
[ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md),
with allowance safety under
[ADR-0016](../../docs/ADR/ADR-0016-monthly-allowance-execution.md).
There is no pending activation or cutoff proposal.

- `MONKEY_TRANSACTION_RETENTION_MONTHS`: default `24`, positive `1..120`, or `0` unlimited; configuration is deployment-only.
- Cleanup runs automatically at startup and daily. The cutoff is the first day of the current UTC month minus the configured calendar months; prune only strictly older eligible details. It is independent of `TZ`.
- Preserve exact balances, permanent opening entries, financial audits, allowance revisions/executions, retired posting keys and monotonic sequence state. No synthetic adjustments or rewritten financial history.
- Cleanup batches atomically retire keys and invalidate history cursors. Expired keys return `transaction_history_expired`; stale pages return `history_retention_changed`. Angular clears cached pages and reloads page one once.
- Raising the duration or choosing unlimited does not restore deleted rows. Retained deltas need not reconstruct the authoritative balance. Backups remain an operator responsibility, not an activation command.

Reproducible procedures and restore cautions are in the
[retention guide](../../docs/development.md#transaction-retention).

## Allowance Configuration on Reactivation (R7)

Status: explicitly approved on 2026-10-28. The owner confirmed that no existing
data needs preservation and approved the R7 change. R7 supersedes R4's
retirement-time disabling behavior; R4 and R6 remain recorded below as history.
The backend change and focused SQLite checks are implemented. Approval of the
revised UI references is separate; production-image lifecycle API verification
is blocked by the Web-BFF routes that await UI implementation.

### Behavior and Responsibilities

- `PocketMonkey.Host.Services.AccountAdministration` in
  [AccountAdministration.cs](../../backend/PocketMonkey.Host/Services/AccountAdministration.cs)
  retires an account without adding or changing allowance revisions. Existing
  current and already-scheduled settings remain intact; a scheduled setting
  takes effect according to the normal next-business-month rule, including while
  the account is retired. Retirement still immediately blocks business writes
  and credits; the 30-day deadline, purge and role rules do not change.
- `PocketMonkey.Host.Services.AllowanceExecutor` in
  [AllowanceExecutor.cs](../../backend/PocketMonkey.Host/Services/AllowanceExecutor.cs)
  continues to exclude retired accounts and recheck retirement during posting.
  On reactivation, normal future credits resume under the preserved revisions;
  a previously disabled or unconfigured allowance stays disabled or unconfigured.
- Reactivation still requires a Manager to choose `credit` or `drop` only when
  eligible, due and uncredited months exist, whether missed before or during
  retirement. Resolve each month's historical configuration and amount. Credit
  remains retry-safe; drop is permanent for those month identities. There is no
  choice when none are outstanding. Already credited or dropped months are not
  changed, and configuration saves still never post credits.
- No new entity, property, relationship, index, endpoint or request/response
  field is proposed. Existing `PocketMonkey.Storage.Entities.AllowanceRevision`
  and `AllowanceExecution` preserve immutable configuration history and durable
  account/month outcomes. Existing Manager authorization, Member reads,
  antiforgery, reactivation status/error codes and snapshot-version rejection
  remain unchanged. Retirement/reactivation and allowance posting must remain
  atomic and serializable under concurrent jobs and requests.

### Existing Data and Architecture

The owner confirmed there is no existing data to preserve. No data migration,
database reset, revision rewrite or snapshot-file deletion is needed for this
change. Snapshot format 2 remains unchanged; the existing rejection of unsupported
versions continues. Full recovery scenarios remain deferred as in R6.

This changes [ADR-0015](../../docs/ADR/ADR-0015-monthly-allowance-configuration.md)'s
retirement-disable decision and clarifies the existing retirement suppression
and reactivation rules in
[ADR-0016](../../docs/ADR/ADR-0016-monthly-allowance-execution.md). Those
authoritative records and the ADR index reflect R7; no new ADR is needed. The account lifecycle in
[ADR-0009](../../docs/ADR/ADR-0009-shared-accounts.md), money and role boundaries
remain unchanged. Update the account-details wireframe annotation and review
its revised export before updating the dependent click prototype; prototype
approval remains separate from backend approval and Angular implementation.

### Verification

Extend the real-persistence lifecycle check in
[AccountPersistenceCheck.cs](../../tests/integration/RuntimeChecks/Tests/AccountPersistenceCheck.cs)
and the account API/browser scenarios to cover preserved enabled, disabled and
scheduled settings; no revision added on retirement; execution blocked during
retirement; credit/drop and no-choice cases; missed months across a business-month
boundary with historical amounts; automatic future credits after reactivation;
retries, restart and concurrent retirement/reactivation/posting without duplicate
or dropped credits. Check both roles, English/German and deadline behavior. Verify
any agreed existing-data and snapshot handling with populated disposable data;
do not claim a migration or recovery check until it has actually run.

Focused checks on 2026-10-28 passed `account-lifecycle`, `allowance-execution`,
`snapshot-version`, and the E2E TypeScript check. Lifecycle coverage includes
current and scheduled settings, a pending failed execution, both choices across
a month boundary, repeated scans, a fresh context/executor, disabled settings,
and concurrent retirement/allowance scans. The production image built successfully,
but its focused lifecycle API test returned 404 on deletion because the Web-BFF
does not yet forward lifecycle routes. That test must be rerun after the approved
UI implementation includes transport. No browser E2E, full process-restart or
recovery verification is claimed for R7.

## Account Deletion Proposal (R4)

Status: approved for implementation; R4 supersedes R3 after review feedback.
R2 was explicitly approved on 2026-10-28 for the deletion lifecycle,
visibility, Member direct-link access, and scheduled-deletion notice. R3 was
explicitly approved on 2026-10-28 for Manager selection of missed allowance
handling on reactivation. R4 was explicitly approved on 2026-10-28 for the
account deletion, retirement, reactivation, allowance, audit, retention and
recovery behavior described below. Backend implementation is in progress with
focused persistence and local HTTP checks; broader concurrency, production-image
E2E and release verification remain open. UI wireframe and prototype approvals
are separate gates, and Angular lifecycle changes have not started.

### Purpose and Proposed Behavior

- Add Manager-initiated account deletion. Delete immediately when there are no
  manual deposit/withdrawal entries and no credited allowance execution. An
  opening entry, including an explicit zero opening, does not by itself require
  retirement. Allowance configuration and uncredited/failed execution attempts
  are purged with an immediately deleted account. Use retained
  `transaction_posted` audit events and durable allowance execution records to
  determine whether financial activity occurred even after transaction-detail
  retention prunes ledger rows. Accounts with manual activity or a credited
  allowance use retirement.
- Retirement immediately hides the account from the active list, rejects
  business writes, and stops allowance credits. Do not show retired accounts on
  the home overview. Show them in a separate retired section on the Manager-only
  account-management page at `/accounts`; only Managers can reactivate an account.
  Members retain read-only access to retired account details and history through
  a direct browser link, but retired accounts are not shown on the overview or
  archive list. Reactivation restores the account but leaves allowances disabled
  until a Manager reconfigures them. At reactivation, if any currently due,
  historically enabled allowance months remain uncredited, require the Manager
  to choose `credit` or `drop` for all of them. `credit` resumes each month's
  posting using its historical revision and durable account/month identity;
  already credited months remain unchanged. `drop` records each month as
  permanently skipped so normal catch-up cannot credit it later. If no eligible
  month is outstanding, no choice is required. Retirement creates a disabled
  allowance revision effective next business month when an allowance is
  configured; the executor suppresses all credits while the account is retired.
  This ensures future months remain disabled after reactivation until a Manager
  explicitly re-enables the allowance.
- On the account details view, prominently identify the account as marked for
  deletion and show its scheduled deletion date. Show the notice to both roles;
  only Managers receive the reactivate action. Localize the notice in
  English and German and format the date using the configured business timezone.
- Persist the retirement instant in UTC. After 30 elapsed days, an automatic,
  retryable background cleanup permanently deletes the account and its linked
  ledger entries, balance, audit events, allowance revisions/executions and
  account-associated retry identities. Cleanup must not affect other accounts.
  Instance backups may retain earlier copies and are not rewritten. Existing
  account audit history, including retirement/reactivation and deletion events,
  is purged with the account. Do not retain a separate account-linked deletion
  audit after purge. This explicitly supersedes ADR-0009's retained account
  mutation-audit rule for account deletion.
- Keep global ledger sequence high-water state. Do not synthesize postings,
  transfer balances, or reuse the deleted account ID. Deleted IDs return not
  found; recreation produces a new identity.

### Types, Data, and API

- Existing `PocketMonkey.Storage.Entities.Account` in
  [Account.cs](../../backend/PocketMonkey.Storage/Entities/Account.cs) gains a
  nullable UTC `RetiredAtUtc` timestamp. Existing restrictive foreign keys in
  [PocketMonkeyDbContext.cs](../../backend/PocketMonkey.Storage/PocketMonkeyDbContext.cs)
  require dependent rows to be removed before the account in one relational
  transaction. Persist pending image-file cleanup so a crash after the database
  commit cannot strand a private image; remove that work record only after
  idempotent file cleanup succeeds. This supplements the current hourly orphan
  scan, which intentionally leaves newly unreferenced files for 24 hours.
- Existing `PocketMonkey.Host.Services.AccountAdministration` in
  [AccountAdministration.cs](../../backend/PocketMonkey.Host/Services/AccountAdministration.cs)
  owns eligibility, retire/cancel, and relational purge policy. Existing
  `AccountEndpoints` in
  [AccountEndpoints.cs](../../backend/PocketMonkey.Host/Endpoints/AccountEndpoints.cs)
  gains Manager-only `DELETE /api/accounts/{id}` and
  `POST /api/accounts/{id}/reactivate` operations, plus Manager-only
  `GET /api/accounts/archived` for the management page. The shared
  `GET /api/accounts` returns active accounts only, keeping retired accounts
  off the home overview. The management page combines active and archived
  results. Keep `GET /api/accounts/{id}` and history reads available to Members
  for retired accounts during the grace period so a direct browser link works.
  Add nullable `PurgeAtUtc` to
  `PocketMonkey.Host.Contracts.Accounts.AccountResponse`, computed as
  `RetiredAtUtc + 30 days`; expose it as nullable `purgeAtUtc` in
  `web/src/app/models/accounts/shared-account.ts`. `AccountDetails` in
  `web/src/app/components/account-details/account-details.ts` and
  `account-details.html` renders the prominent notice from this value. Return
  `204` for immediate deletion, `202` with `purgeAtUtc` for retirement, and
  `204` when reactivation succeeds. When eligible uncredited allowance months
  exist, the request requires `missedAllowancePolicy: "credit" | "drop"`; a
  missing choice returns `400 missed_allowance_policy_required`, and an invalid
  value returns `400 invalid_missed_allowance_policy`, leaving the account
  retired. Reactivation at or after the purge deadline returns `409
account_deletion_expired`; an unknown account returns `404`. Repeating a
  retirement returns its existing deadline; repeating reactivation after
  success returns `204` without changing the original choice.
- Proposed `OrphanCleanup` in
  `PocketMonkey.Host.HostedServices` replaces the image-specific
  `ImageCleanup` worker. It runs the existing orphaned-image scan and due
  account-data cleanup using persisted state, and can host additional
  idempotent orphan cleanup tasks later. Register it in
  [Program.cs](../../backend/PocketMonkey.Host/Program.cs); do not hold database
  transactions across filesystem operations. Persist cleanup progress so a
  restart safely retries incomplete work.
- Existing `AllowanceExecutor` in
  [AllowanceExecutor.cs](../../backend/PocketMonkey.Host/Services/AllowanceExecutor.cs)
  must atomically honor retirement before creating or retrying credits. The
  retirement-time disable revision follows the next-business-month rule in
  ADR-0015; executor suppression is immediate. `AllowanceAdministration` must
  write that revision atomically with retirement. Update
  `PocketMonkey.Storage.Entities.AllowanceExecution` so a dropped month has a
  durable terminal outcome and retains its unique account/month identity;
  credited outcomes continue to use existing idempotency. Reactivation applies
  the selected policy to outstanding months using persisted execution state;
  credit retries use the recorded historical revision. `OrphanCleanup` in
  [OrphanCleanup.cs](../../backend/PocketMonkey.Host/HostedServices/OrphanCleanup.cs)
  replaces the previous image-only worker.
  `AccountImages` in
  [AccountImages.cs](../../backend/PocketMonkey.Host/Services/AccountImages.cs)
  remains responsible for image validation and serving.

### Persistence, Conflicts, and Recovery

- Extend `RetiredLedgerKey` with an account association for future transaction
  retention, then remove associated rows during that account's purge. Existing
  retired keys have no account ID and cannot be reliably backfilled after their
  ledger details were pruned. Retain these minimal, unassociated keys
  indefinitely under the existing never-reuse guarantee; they contain no
  account, actor, or financial payload and cannot be attributed to a deleted
  account.
- In one serializable SQLite transaction, recheck the account's retirement
  deadline and eligibility, delete account-linked financial/configuration/audit
  rows in dependency order, invalidate affected history state as required, and
  remove the account. Preserve the global posting-sequence high-water mark and
  stage image cleanup durably. Concurrent posting, allowance execution,
  reactivation, and purge must have a single winner. Immediate-delete eligibility
  checks retained account audit events (`transaction_posted`) and allowance
  executions, not current ledger rows alone, because transaction details may
  already have expired. Account deletion is the explicit exception to retaining
  account-subject audit events: purge them with the account and do not write a
  separate surviving deletion record.
- Existing accounts migrate as active. A migration cannot restore already
  pruned transaction details or associate legacy retired keys with accounts.
  Snapshot restore may bring back deleted accounts from the restored point in
  time; normal startup cleanup may then purge any already-expired retirement.

### Architecture and Verification

This revises [ADR-0009](../../docs/ADR/ADR-0009-shared-accounts.md),
[ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md),
[ADR-0015](../../docs/ADR/ADR-0015-monthly-allowance-configuration.md), and
[ADR-0016](../../docs/ADR/ADR-0016-monthly-allowance-execution.md). Approved
wording belongs in those authoritative records; no new ADR is proposed.
Manager-only archived listing preserves the shared-read rule in ADR-0003 by
retaining Member access to retired account details/history when opened by a
direct link. The proposal conflicts with the current no-account-archival
boundaries in this plan and the [finish-line plan](README.md).

- Add E2E coverage for eligibility, Manager/Member access, active/archive
  visibility, direct-link retired-account access, the scheduled-deletion notice
  and date for both roles/languages, Manager reactivation, expired/missing
  accounts, and bilingual states. Exercise both missed-month choices, required
  and invalid choices, multiple missed months with historical revisions, and
  retries/restarts without duplicate credits or dropped-month catch-up.
  Real-persistence checks must cover UTC deadline boundaries with a controlled
  clock, populated-schema migration, atomic cascade rollback, concurrent
  posting/allowance/purge/reactivation, restart and retry after failures, image-file
  cleanup, retry-key handling, and backup/restore behavior. Preserve existing
  ledger, allowance, retention, and export invariants except where explicitly
  revised by approval.
- R4 incorporates the Manager's immediate-deletion choice for accounts with
  allowance configuration but no credited allowance; account-linked audit
  history is purged; legacy account-unlinked retired keys remain globally
  retained to preserve the never-reuse guarantee; and reactivation error
  responses are specified. The missed-month policy and future allowance-disable
  behavior are explicit. R4 is approved; the remaining implementation and
  verification gates are described above.

## Account Deletion Recovery Addendum (R5, Draft)

Status: unapproved and deferred. R4 was approved on 2026-10-28. On the same
date the owner directed that recovery scenarios be deferred until 1.0 unless
explicitly requested, and selected fail-closed incompatible recovery instead of
shipping incomplete snapshots. R5 remains a historical proposal, not a current
implementation requirement. The replacement prerelease startup/reset proposal is
in [operations](04-operations-cutover.md#prerelease-schema-reset-r1).
R1 was withdrawn; startup does not automatically reset the database. R4
implementation and the separate UI wireframe and prototype gates remain pending.

- Export format version 2 with each account's nullable UTC retirement instant,
  each allowance execution's durable credited/pending/dropped outcome, and each
  retired ledger key's nullable owning account ID. Include any other persisted
  reactivation decision needed to resume selected credits without reviving
  dropped months or repeating a choice. Preserve existing exact-money, actor,
  revision, sequence, and UTC timestamp representations.
- Continue importing supported version 1 snapshots: treat accounts as active,
  executions as credited or pending according to their existing fields, and
  retired keys as unassociated. Never guess key ownership. Export version 2
  going forward; an older application may reject version 2, so recovery on an
  older release requires a compatible backup or release, not a lossy downgrade.
- Change the existing `PocketMonkey.Host.Contracts.Recovery.FinancialSnapshot`,
  `SnapshotAccount`, `SnapshotAllowanceExecution`, and
  `SnapshotRetiredLedgerKey` contracts in
  [financial recovery contracts](../../backend/PocketMonkey.Host/Contracts/Recovery/FinancialSnapshot.cs).
  Update `FinancialSnapshotService` in
  [FinancialSnapshotService.cs](../../backend/PocketMonkey.Host/Services/FinancialSnapshotService.cs),
  `FinancialSnapshotValidation` in
  [FinancialSnapshotValidation.cs](../../backend/PocketMonkey.Host/Services/FinancialSnapshotValidation.cs),
  and `FinancialSnapshotJson` in
  [FinancialSnapshotJson.cs](../../backend/PocketMonkey.Host/Services/FinancialSnapshotJson.cs)
  to capture, validate and atomically restore both supported formats. Version 2
  must reject missing or contradictory lifecycle fields rather than silently
  default them. Keep images and pending filesystem cleanup outside portable
  financial snapshots, as images are outside their scope.
- Verify existing version-1 fixture import, strict version-2 validation,
  retired-account deadline survival, dropped-month suppression, pending-credit
  retry, attributable and legacy-unassociated keys, and change-only export
  hashes using real persistence and restart checks. Restoring a snapshot may
  reintroduce accounts deleted after capture; startup cleanup applies any
  expired deadline, as R4 states. Full data-root backups remain separate.
- This would extend the versioned export/import contract governed by
  [ADR-0021](../../docs/ADR/ADR-0021-portable-financial-recovery.md); it is
  deferred and is not approved by the prerelease reset decision.

## Account Deletion Recovery Addendum (R6)

Status: explicitly approved on 2026-10-28 for the version-2 lifecycle-aware
snapshot contract and version rejection described below. The format and focused
version-rejection checks are implemented; broader recovery scenarios remain
deferred. This replaces R5's proposed version-1 import
compatibility. R4's account lifecycle remains approved, and automatic database
reset is withdrawn.

- Export a new format version 2 that represents the R4 lifecycle state: nullable
  UTC account retirement, the durable allowance execution outcome and any
  persisted reactivation choice needed for retry, and nullable account ownership
  of retired ledger keys. Preserve existing exact money, timestamps, sequence
  counters and audit attribution. Legacy unassociated keys remain nullable.
  Images and filesystem cleanup remain outside financial snapshots.
- Import only the currently supported snapshot format; reject version 1 and
  unknown versions with `snapshot_version_unsupported` before modifying the
  target. Snapshot format version, not application release version, determines
  compatibility. Do not silently default required lifecycle fields, publish an
  incomplete export, or delete existing snapshot files. Malformed or ambiguous
  JSON remains invalid. Full recovery scenarios remain deferred until requested
  or required for 1.0.
- Update the existing `PocketMonkey.Host.Contracts.Recovery.FinancialSnapshot`,
  `SnapshotAccount`, `SnapshotAllowanceExecution`, and `SnapshotRetiredLedgerKey`
  contracts in [recovery contracts](../../backend/PocketMonkey.Host/Contracts/Recovery/FinancialSnapshot.cs),
  plus `PocketMonkey.Host.Services.FinancialSnapshotService`,
  [FinancialSnapshotValidation](../../backend/PocketMonkey.Host/Services/FinancialSnapshotValidation.cs),
  and [FinancialSnapshotJson](../../backend/PocketMonkey.Host/Services/FinancialSnapshotJson.cs).
  The JSON reader must distinguish a well-formed unsupported version before
  deserializing version-specific required fields, while retaining size, duplicate
  property and strict validation limits. Import remains offline, empty-target
  and atomic; no HTTP API, authorization or job schedule changes are proposed.
- Apply R4's normal populated-database migration; do not automatically delete
  the database. Existing version-1 snapshots become unsupported by the new
  importer, but are left untouched. Until a compatible export contract is in
  place, incompatible import and export remain fail-closed under
  [ADR-0021](../../docs/ADR/ADR-0021-portable-financial-recovery.md).
- Check the exported fields and change detection for lifecycle state, and check
  that older, newer, missing and malformed versions cannot modify a disposable
  target. Verify ordinary migrations and the R4 lifecycle separately. Complete
  broader recovery and restore scenarios before 1.0 or when requested.

## Acceptance Gate

- [x] Agreed lifecycle features have real-stack browser/API coverage, including permissions, last-manager concurrency and retention safety.
- [x] Approved About/legal content and local notice delivery are implemented for both roles and the public entry point.
- [x] German/English catalogs are delivered; removed tenancy and email features are not reintroduced. Account deletion is now separately approved above and its bilingual UI remains pending.
- [ ] Complete current hosted release verification and source/notice/build identity checks on the actual distributed image.
- [ ] Complete application-wide visual/localization and deployment-specific legal/privacy acceptance as part of [operations](04-operations-cutover.md#release-gate).
