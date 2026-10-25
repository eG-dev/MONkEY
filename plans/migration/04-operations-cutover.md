# Milestone 4: operations and cutover

Status: portable financial recovery R7 is implemented and locally verified;
the remaining operations and production-cutover work is not started. Basic
lifecycle checks start in [runtime stack](01-runtime-stack.md).
Production cutover depends on the agreed slices in [UI and business logic](03-ui-business-logic.md),
the [step 2B design system](02b-ux-ui-design.md), and application-wide design acceptance.

## Goal

Make the new self-hosted instance secure, restorable, and upgradeable before
retiring the Azure version. This is deployment cutover, not Azure data migration.

## Deployment contract

- Separate source-only GitHub visibility from artifact publication under [ADR-0006](../../docs/ADR/ADR-0006-github-delivery.md) and [ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md). The source repository may become public before ORT/comprehensive third-party asset review and About integration, after checking rights/notices for included material and repository history for private data/credentials. Keep public Docker images and releases deferred until their independent release and distribution gates pass; no visibility change or publishing action is implied by this plan.
- Publish a versioned image and a minimal example deployment with port, volume, and configuration documented.
- Complete the [GitHub build and release workflow](builds-releases.md), publishing the verified container and matching deployment assets with a versioned GitHub Release.
- Document the [ENV contract](configuration.md), including `TZ` and `MONKEY_DATA_PATH`, separately from host volume paths and published ports.
- Run Node and .NET as non-root with bounded resources and controlled shutdown.
- Document which host architectures are actually verified.
- Support LAN/VPN use with a defined HTTPS termination arrangement and trusted proxy configuration.
- Validate configuration on startup; do not put credentials or signing keys in the image or source control.
- No Azure connection strings, SMTP configuration, public CDN assets, or external identity provider are required.
- State the single-instance/local-disk limitation. SQLite is not an assumed multi-replica database.

### Real-Host Verification Dependency

The user confirmed on 2026-10-25 that real-environment verification requires a
published GHCR prerelease they can pull onto their home server's Ubuntu Docker
VM. Follow the [prerelease verification sequence](builds-releases.md#home-server-prerelease-verification):
prepare a CI-tested immutable beta first, then perform the host HTTPS/storage,
restart and full-backup/restore rehearsals. Do not make those host checks a
circular prerequisite for obtaining the beta image. They remain required for
production acceptance; automated checks and distribution/publication gates are
not waived. No publishing or real-host verification is claimed complete.

## Open-source translation contributions

- Document the language registry, catalog layout, source/fallback language, Taiga resource mapping, and how to add a new language in one contribution guide.
- Include example translation changes, placeholder/pluralization rules, local preview commands, and the same validation command used by CI.
- Require German and English completeness and validate syntax/key/placeholder consistency on translation pull requests. Define an explicit completeness policy for additional languages.
- Document review expectations for translated privacy/terms content; do not treat community wording as automatically legally equivalent.
- Use the selected `AGPL-3.0-only` license under [ADR-0018](../../docs/ADR/ADR-0018-project-license.md). Before source-only public visibility, review project/contributor rights, licensing/notices for included third-party code/assets/translations, and repository history for private data or credentials. Defer comprehensive ORT and shipped-component/asset review to final release preparation, before public image/release distribution.
- Follow the [self-hosted legal-content direction](03h-lifecycle.md#self-hosted-legal-content-and-license): fresh German/English operator notices, responsibility for hosting/updates/backups, and legally qualified warranty/liability disclaimers consistent with AGPL. Include the license and required notices in source and release distributions, and make the corresponding source for the distributed revision available. Artifact packaging, source-offer presentation, and rights/notice review remain release gates, not completed by selecting the license.
- External translation platforms are optional future tooling, not required for contributors or for running the application.

## Backup, restore, and upgrades

- Agreed on 2026-10-25: keep full installation backup and restore as documented manual operator procedures using ordinary host/container tools. Do not add application-specific full-backup/restore commands, backend endpoints, scheduled full-backup jobs, or settings UI. The separately requested portable financial export/recovery feature is covered below; it does not replace this procedure.
- Stop the container before backing up the complete private data root and preserve deployment configuration separately. Restore into an empty volume with a compatible application version, preserve required ownership/permissions, then start and verify the instance. Rehearse with disposable data; do not touch an operator's installation without explicit approval.
- Back up the database, image files, and persistent authentication keys with appropriate confidentiality protections.
- Preserve deployment configuration, particularly `TZ`, with the recovery documentation so restored jobs use the original business-period rules.
- Use the coordinated stopped-instance backup above for database/image consistency. Do not copy only a live database file while ignoring WAL state.
- Store backups outside the container and preferably outside the Docker host; a mounted volume alone is not a backup.
- Decide backup frequency, retention, encryption, recovery point objective, and recovery time objective.
- Provide a restore procedure and rehearse it on a clean host/volume.
- Take a pre-upgrade backup and apply schema migrations before readiness succeeds.
- Define schema compatibility explicitly. Rolling back an image does not undo a database migration; restore or a supported compatibility path is required.
- Explain recovery behavior for users, keys, sessions, and scheduled jobs after restoring an older backup.

## Portable Financial Export and Recovery R7

Backend/data proposal R7, **approved on 2026-10-25** by the user: "okay, I approve
the proposal". Approval covers the current R7 scope, including export policies,
offline import, shared scenarios and test-only reset. Implementation and local
verification evidence are recorded below; hosted CI for these changes and the
broader release/cutover gates are not claimed complete.

Approved implementation clarification, 2026-10-25: retain retention's
`LastCompletedAtUtc` in snapshots but exclude this scan-only timestamp from the
content hash. The user explicitly selected "Yes, exclude the scan-only timestamp".
Daily no-op retention scans must not force exports; pruning revisions, retired
keys and all financial changes still count.

R7 incorporates the user's 2026-10-25 acceptance of a test-only scenario loader
with explicit `--reset`, separate from the non-destructive recovery importer.
Keep R6's shared scenario-export collection for E2E and manual testing and R5's
snapshot retention (default 30,
finite counts through 365, 0 unlimited), R4's change-only publication and R3's
daily check at 01:00 business time in configured `TZ`, superseding R2's fixed
UTC schedule, without a configurable hourly interval. These accept the stated
policies, scenario reuse and test-only reset; those earlier policy approvals did
not approve the complete backend/data proposal. The explicit R7 approval above
subsequently approved that design.

### Purpose and Agreed Scope

- Produce one versioned JSON file per complete instance financial snapshot, not
	separate files per account. Prioritize accounts, exact balances and retained
	transactions. Exclude images, image keys, Identity users/roles/credentials,
	sessions and Data Protection keys. Restored accounts use the default image.
- Include the permanent financial state required for safe recovery: audit
	metadata, allowance revisions/executions, retired posting keys and ledger
	maintenance counters. Preserve historical actor IDs and display-name snapshots
	as attribution, without recreating login identities or remapping old actions
	to the new operator. Audit metadata may refer to users not recreated on import.
- Export only transaction details still present at snapshot time: default
	retention is 24 UTC calendar months, with openings and permanent safety records
	retained independently. Never claim that retained deltas reconstruct a balance
	after pruning, or that an older export contains changes made after its snapshot.
- Schedule exports to a private, configurable directory that can be bind-mounted
	separately. No HTTP endpoint, browser download, settings UI or image archive.
- Reuse the same JSON contract and importer for isolated E2E state setup. Keep
	real UI/API creation tests; this is not an Azure-data import facility.

### Contract and Types

The approved types below are implemented in `PocketMonkey.Host`.

| Type / namespace / location | Responsibility |
| --- | --- |
| `FinancialSnapshot` and one explicit record type per exported collection, `PocketMonkey.Host.Contracts.Recovery`, under [Contracts/Recovery](../../backend/PocketMonkey.Host/Contracts/Recovery) | Versioned transport DTOs, separate files, no direct EF/Identity serialization. |
| `FinancialSnapshotService`, `PocketMonkey.Host.Services`, [FinancialSnapshotService.cs](../../backend/PocketMonkey.Host/Services/FinancialSnapshotService.cs) | Read a consistent snapshot; validate and atomically import financial state through the existing context. |
| `FinancialExportStore`, `PocketMonkey.Host.Services`, [FinancialExportStore.cs](../../backend/PocketMonkey.Host/Services/FinancialExportStore.cs) | Deterministic content hashing, private temporary files, atomic publication, completed-export discovery, scheduler-state file and bounded retention. |
| `FinancialExportWorker`, `PocketMonkey.Host.HostedServices`, [FinancialExportWorker.cs](../../backend/PocketMonkey.Host/HostedServices/FinancialExportWorker.cs) | Wake at startup/minutely, determine whether an export is due, retry failures without stopping financial workflows. |
| `FinancialImportCommand`, `PocketMonkey.Host.Operations`, [FinancialImportCommand.cs](../../backend/PocketMonkey.Host/Operations/FinancialImportCommand.cs) | Offline `import-financial <absolute-json-path>` entry point, stable diagnostics/exit codes, no host or workers started. |

Existing integration points are
[Program.cs](../../backend/PocketMonkey.Host/Program.cs),
[InstanceSettings](../../backend/PocketMonkey.Host/Configuration/InstanceSettings.cs)
and [PocketMonkeyDbContext](../../backend/PocketMonkey.Storage/PocketMonkeyDbContext.cs).
Keep financial import dispatch separate from the interactive username/password
flow in [OperatorCommands](../../backend/PocketMonkey.Host/Operations/OperatorCommands.cs).
No new persisted entity, relationship, index or migration was added.

The document contains `formatVersion: 1`, a unique snapshot ID, capture time in
UTC, application version, source currency/timezone/transaction-retention settings,
and the collections `accounts`, `ledgerEntries`, `auditEvents`,
`allowanceRevisions`, `allowanceExecutions`, `retiredLedgerKeys` and
`ledgerMaintenanceState`. Export IDs, relationships, immutable provenance and
nullable fields explicitly; retain allowance revision order, execution outcomes,
attempt metadata, sequence high-water mark and retention revision.

Money uses canonical two-decimal strings with the existing signed 64-bit cent
limits. Other 64-bit counters/IDs use canonical integer strings to avoid loss in
JavaScript fixture tooling. UTC instants preserve all supported timestamp
precision; closed categories use validated stable strings. Currency/timezone are
metadata, not permission to change deployment configuration silently. JSON is
human-readable UTF-8; files contain private financial and attribution data.

### Scheduling and Filesystem Policy

- Opt in by setting `MONKEY_EXPORT_PATH` to an absolute private directory outside
	the main data root. Unset means disabled. Document a separate optional Compose
	bind mount, writable only by the application owner; no world-readable files.
- Check once daily at 01:00 in the configured business timezone `TZ`, not the
	host-local timezone or fixed UTC. This is one hour after the normal midnight
	allowance eligibility boundary, not a guarantee that retries/catch-up have
	completed. No interval or separate schedule configuration initially.
	Configure `MONKEY_EXPORT_KEEP_COUNT`: default `30`, whole counts `1..365`,
	or `0` for unlimited. Reject negative, non-integer or greater-than-365 values
	at startup. Transaction retention and export-file retention remain independent.
- Determine due work from completed files, a private atomically replaced
	`.export-state.json` in the export directory and the injected `TimeProvider`,
	not an in-memory timer alone. The most recent elapsed 01:00 business-time
	boundary, converted to a UTC instant, defines the due slot. Record a successfully
	checked slot and its `TZ` even if unchanged; do not reread/hash all data every
	minute or restart for that slot. A completed snapshot captured at or after the
	boundary also satisfies it if publication succeeded before a state-file crash.
	Treat missing/invalid scheduler state as requiring a safe recheck, not proof
	that recovery data exists. Proposed startup behavior: check the latest missed
	slot and publish only if needed, including an initial snapshot when none exists.
	After downtime do not fabricate exports for missed days. Failed capture,
	comparison, publication or state writes remain retryable on a later wake.
- Compare deterministic SHA-256 content hashes with the latest successful
	snapshot, not changes within the current calendar day. Use fixed property
	ordering, stable collection ordering by immutable keys, canonical exact amounts
	and UTC timestamps. Hash the format version, exported source configuration and
	all exported record content; exclude snapshot ID, capture time and application
	build version and retention's scan-only `LastCompletedAtUtc`. A changed build
	version or no-op retention scan alone must not produce a data export.
	Recompute/validate the baseline from the completed snapshot, rather than trust
	a cached hash without its file. An unreadable/invalid latest snapshot is an
	observable failure, not an unchanged result; preserve it and earlier snapshots.
- Publish when there is no prior completed snapshot or the content differs.
	Account/balance/transaction/allowance changes, exported audit changes and
	retention pruning count; excluded credentials/images alone do not. Export
	checks/publication use structured logs, not new database audit events that
	would themselves cause perpetual changes. A snapshot hash detects content
	differences, not authenticity or legal/financial correctness.
- On an unchanged result, write only scheduler state: do not create/touch a
	snapshot or prune completed exports. Retention remains count-based over actual
	successful snapshots, not days; 30 files may span far more than 30 days, and
	365 files approximate a year only when changes produce a snapshot every day.
	There is no calendar-year age limit; `0` disables count-based pruning entirely
	and requires the operator to monitor disk usage. Never remove the last
	successful export because it is old. If the baseline file has
	been removed externally, invalidate its checked-slot state and create a new
	initial snapshot rather than relying on stale cached state.
- Proposed daylight-saving handling: if 01:00 is ambiguous, use its first
	occurrence and do not export again for the repeated occurrence. If 01:00 does
	not exist, use the first valid local instant after the gap. Calculate boundaries
	from business calendar dates, not by adding 24 elapsed hours. Snapshot timestamps
	and filenames remain UTC. After a `TZ` change, calculate due slots using the new
	zone without altering existing snapshots or financial history.
- Materialize a stable DTO graph inside one SQLite read transaction, then end
	that transaction before serialization/filesystem work. Concurrent postings and
	cleanup must not mix pre-change balances with post-change rows.
- Write a uniquely named temporary file in the destination directory, flush and
	close it, then atomically rename without overwrite to a timestamp/snapshot-ID
	`.json` name. Interrupted writes never become completed exports. Clean only
	application-owned temporary files and prune only matching completed export
	files, oldest first, after successful publication when the configured count is
	positive. Lowering the count takes effect after the next successful publication,
	not on an unchanged check. Never delete arbitrary files.
- Validate enabled configuration/storage at startup. Runtime export failures
	produce nonfinancial structured diagnostics, never payloads, and do not block
	posting or readiness. Do not claim host-disk disaster protection from a bind
	mount or guarantee durability beyond the host filesystem.

### Offline Import and Financial Validation

- Stop the application container; run a one-off command with its data volume and
	a read-only snapshot mount. Require exclusive database access, with a bounded
	lock wait and a stable failure if another writer is active. Never run HTTP,
	allowance, cleanup or export workers during import.
- Target a current migrated schema with empty business tables and default ledger
	maintenance state. Existing separately bootstrapped login users and their user
	administration audit records are allowed; account/ledger/allowance/retired-key
	data is not. Preserve those local users/audit records; allocate imported audit
	row IDs locally while retaining event time, actor, subject and action.
- Validate the whole document before inserting: supported format, required
	fields, bounded strings/collections, valid exact amounts/UTC instants, unique
	IDs and keys, account/revision references, normalized-name uniqueness, source
	signs, exactly one opening for initialized accounts, and no ledger for an
	uninitialized account. Reject unknown properties and unsupported categories.
	Proposed initial file-size limit: 256 MiB; exceed it with a clear error rather
	than allowing unbounded deserialization. Revisit with measured real fixtures.
- Validate revision chains/order, execution account/month/revision/key agreement,
	credited-versus-pending state, active/retired key disjointness and maintenance
	counters at least as high as all retained sequences. Credited executions may
	legitimately have no ledger row after pruning. Reject retained allowance rows
	inconsistent with their durable execution evidence.
- Import exact stored balances and retained history directly, never through
	posting endpoints. Do not replay credits, reconstruct balances from partial
	history, synthesize adjustment entries or overwrite existing business data.
	Validate balance sums only when completeness can actually be established;
	partial history cannot independently prove the exported balance is correct.
- Require target currency and `TZ` to match the snapshot before recovery; explain
	how to set deployment configuration, without silently overriding it. Report
	differing transaction-retention settings and require a deliberate matching
	setting before normal startup. Document that startup catch-up and retention
	resume under normal policies, so old snapshots may trigger eligible credits
	and cleanup after recovery; no stale-state recovery can preserve later writes.
- Use one SQLite write transaction, recheck target emptiness inside it, insert in
	dependency order, preserve counters and keys, and add a nonfinancial import
	audit event. Any validation, constraint or write failure leaves business state
	unchanged. A second import fails the nonempty-target check rather than merging.
	Schema initialization may remain after failure; no financial partial recovery.
- Return stable command errors such as `snapshot_invalid`,
	`snapshot_version_unsupported`, `snapshot_configuration_mismatch`,
	`recovery_target_not_empty` and `recovery_storage_busy`, with nonzero exit codes.
	No Manager/Member API contract or authorization rule changes; host/storage
	access is the recovery privilege. Operators recreate users separately.

### E2E Reuse and Verification

#### Shared Scenario Collection

Maintain a small version-controlled data store of synthetic scenario exports in
the **proposed** `tests/fixtures/financial-snapshots/` directory, shared by
browser E2E, integration checks and manual testing rather than duplicated under
each suite. This is a file collection, not another database or service. Each
scenario JSON uses the production snapshot format and passes the same importer
validation; never commit real household exports, credentials or personal data.

Start with reusable scenarios for uninitialized accounts; signed/zero opening
balances and manual transactions; paginated retained history with pruned details
and retired keys; and allowance configuration with credited/pending executions.
Keep expected account balances, identifiers and record counts explicit. Add
further fixtures only for concrete workflows. Generate representative exports
through real application operations where practical, then review and check them
in; do not use fixture imports as a substitute for testing those operations.

A colocated README catalogs stable scenario names, purpose, source-format
version, expected state, required currency/`TZ`/transaction-retention settings,
reference dates and any startup job effects. Document shared user bootstrap
steps separately from financial JSON. Keep malformed import inputs in negative
test coverage, clearly separate from usable manual scenarios.

Both E2E setup and documented manual steps select the same named JSON and invoke
the same offline importer against fresh disposable storage; do not relax the
empty-business-state rule or add a production fixture endpoint. Mount fixtures
read-only. Manual testing starts a separate instance after import, with no
implicit reset of existing data and no production credentials or volumes.

Provide a test-only scenario loader, shared by E2E setup and manual testing,
outside the production image. Its explicit `--reset` option stops its managed
test instance, recreates its disposable data storage, bootstraps test users and
invokes the same offline financial importer before starting the instance again.
Without `--reset`, nonempty financial state is rejected. The production recovery
command has no wipe/reset/replace flag and never deletes existing business data.

Reset requires positive ownership checks for loader-created test storage, not
just a name prefix or an arbitrary supplied path. Restrict filesystem targets to
the loader's dedicated test root, reject symlinks/reparse points and overlapping
application/export/fixture paths, and verify ownership metadata for managed Docker
volumes. Refuse unknown storage or unrelated running containers. Reset never
deletes read-only scenario sources, operator exports or production storage.
Document the selected target and destructive scope before reset: test users,
database, images and authentication keys are discarded, then test users are
recreated separately. Failure must not start a partially prepared test instance.

Time-sensitive automated checks use the existing test-only clock injection
approach. Manual runs use actual time: document that allowance catch-up and
retention can change historical fixtures immediately after startup. Include
time-stable scenarios with allowances disabled and suitable documented retention
for general manual exploration; do not silently shift fixture timestamps or add
a production clock override to force historical outcomes. Update fixtures and
their documentation together when the recovery format changes, and validate
every supported scenario in the focused real-persistence checks.

#### Verification

Extend the existing real-persistence
[RuntimeChecks project](../../tests/integration/RuntimeChecks) with isolated
snapshot checks and reuse the importer from test-only tooling. Minimal fixtures
contain valid complete financial state, not relaxed production validation.
Create users separately, use fresh volumes, and inject a fixed clock for
time-sensitive scenarios without adding a production clock override/endpoint.

Required checks: export/import/export semantic round trip including pruned
history; exact signed limits and timestamp precision; historical actor
attribution; default images; retained/pending allowance recovery without duplicate
credits; posting and cleanup concurrent with capture; atomic rollback; nonempty
target/repeated import rejection; explicit test-loader reset, user rebootstrap,
rejection of unowned/out-of-root/linked storage and preservation of fixture/export
sources; malformed/oversized/version-mismatched files;
configuration mismatch; interrupted writes and unwritable mounts; 01:00 business
boundary/restart/downtime detection; non-UTC `TZ`, timezone changes and
skipped/repeated daylight-saving times; unchanged-day skips across restarts;
stable hashes despite metadata/collection-order differences; changed and reverted
data compared to the last success; pruning/configuration changes; corrupt/missing
baseline and scheduler-state recovery; publication/state crash ordering;
file-retention safety and no private
payload logging. Run focused
real-image Manager/Member read and Manager posting workflows after recovery.
Use only disposable databases, export directories and volumes.

### Architecture and Approval

Follow [ADR-0007](../../docs/ADR/ADR-0007-application-foundation.md),
[ADR-0010](../../docs/ADR/ADR-0010-ledger-and-money.md),
[ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md),
[ADR-0016](../../docs/ADR/ADR-0016-monthly-allowance-execution.md) and
[ADR-0017](../../docs/ADR/ADR-0017-backend-project-boundaries.md).
Offline empty-target reconstruction is a new recovery capability, not permission
to edit live financial history. ADR-0021 records the approved capability and
ADR-0012 now identifies this narrow reconstruction exception. The manual
full-backup decision remains unchanged; credentials/images are not restored.

Evaluated alternatives: CSV loses typed relationships and recovery metadata;
per-account files risk mixed snapshots; ZIP adds no value without images; full
SQLite copies remain the separate manual backup; a web import endpoint adds
unnecessary attack surface. R7 approval covers the proposed defaults, file bounds,
identity exclusion and offline import entry point. The enduring decision is
[ADR-0021](../../docs/ADR/ADR-0021-portable-financial-recovery.md).

### Delivery and Verification

Implemented on 2026-10-25 without schema changes or recovery HTTP/UI endpoints.
See the [operator guide](../../docs/development.md#portable-financial-recovery),
[optional export mount](../../deploy/compose.exports.yaml) and
[shared scenario catalog](../../tests/fixtures/financial-snapshots/README.md).

Local verification against disposable data and the production Linux image:

- Release solution build passed. The `financial-recovery` RuntimeChecks probe
	passed against all four committed scenario files, both locally and inside the
	non-root production image. It covers exact money, strict/oversized JSON,
	semantic round trips, historical attribution/default images, nonempty and
	busy targets, rollback, pending/retired allowance identities, concurrent
	posting/retention/capture, DST gaps/repetition, stable hashes, changed/reverted
	data, cancellation, owner-only files, unwritable/linked storage, scheduler-state
	recovery and count-based retention.
- The final production image build passed. All four recovery E2E tests passed:
	Linux persistence probe; private export publication/restart; desktop and mobile
	recovered Manager posting/Member denial, explicit reset/user rebootstrap,
	unknown/out-of-root/linked/unowned storage refusal and unchanged fixture sources.
	The persistence probe is included in normal E2E discovery for hosted CI.
- Existing `ledger-persistence` and `allowance-execution` probes passed. E2E
	TypeScript checking and Markdown/ADR guardrails passed. Compose configuration
	with the export override passed `config --no-interpolate`; no operator mounts
	or installation data were started or changed.

Reproduce from the repository root using the commands in the operator/scenario guides and
`dotnet run --project tests/integration/RuntimeChecks --configuration Release -- financial-recovery tests/fixtures/financial-snapshots`.
Hosted CI for this uncommitted implementation, real operator backup/restore
rehearsals, clean-host upgrades and release/publication gates remain separate.

## Observability and security

- Structured logs to stdout/stderr, with rotation handled by the host.
- Liveness/readiness cover the application processes and meaningful backend dependencies.
- Manager-visible allowance job failures. No email alerts or outbox are planned.
- Optional vendor-neutral telemetry rather than an Azure dependency.
- Never log passwords, session cookies, recovery credentials, or full private financial payloads.
- Dependency and container scanning, pinned build inputs, and a documented update process.
- Authorization, CSRF, upload validation, private-cache behavior, and session-revocation regression tests.
- Verify security behavior through real-stack browser/HTTP E2E scenarios, with focused integration checks where needed; no unit-test coverage gate is required.
- Rate limits and bounded request/upload sizes at appropriate layers.

## Incremental rollout

1. Repository cleanup was explicitly approved on 2026-10-25: legacy source and Azure workflows are removed, the application is at the root, and Git history is preserved. This does not remove or stop any deployed Azure resources.
2. Run the new instance with a separate empty database for acceptance testing; no dual writes or synchronization.
3. Complete an operational rehearsal, including restart during posting/jobs, backup/restore, and upgrade failure.
4. Agree on the minimum release scope and communicate that old balances/history are not transferred.
5. Start the accepted new instance with deliberately created accounts/opening entries.
6. Retain or archive the old environment for an agreed period; avoid ongoing user writes to both systems after cutover.
7. With separate explicit approval, stop the old application/Functions and remove obsolete cloud resources and secrets. Repository workflows were already removed as part of the approved source cleanup.
8. Retain historical source through Git; repository cleanup does not authorize history rewriting or publication.

## Release gate

- [ ] Core workflows and role permissions pass end-to-end tests.
- [ ] The [step 2B design acceptance gate](02b-ux-ui-design.md#acceptance-gate) passes, and application-wide review confirms the approved design across every shipped screen; functional tests alone do not approve the design.
- [ ] The full E2E regression and container lifecycle suites pass against the release build, with reproducible fixtures and actionable failure artifacts.
- [ ] The [GitHub publishing acceptance gates](builds-releases.md#acceptance-gates) pass; the released assets and public container digest correspond to the verified source revision.
- [ ] Targeted integration checks cover agreed database/job risks; release does not depend on a unit-test suite or unit-coverage percentage.
- [ ] German and English cover all shipped UI, with a documented and tested path for adding languages.
- [ ] The project OSS license is explicitly selected and included with required notices; reviewed self-hosted legal information distinguishes operator responsibilities from project obligations and does not reuse the cloud-service terms.
- [ ] Container restart and job retry do not corrupt or duplicate financial activity.
- [ ] No required email, Azure, external identity, or runtime CDN dependency exists.
- [ ] One documented application container and its persistent volume can run the system.
- [ ] HTTPS and host/proxy requirements are explicit and verified.
- [ ] Backups restore successfully on a clean instance.
- [ ] Upgrade failure and rollback/restore procedures have been rehearsed.
- [ ] Operational logs and job failures are observable without cloud services.
- [ ] Remaining feature omissions and accepted limitations are documented, including deferred dedicated reversals.
- [ ] Azure retirement and old-data disposal have explicit approval.

Return to the [migration overview](README.md).