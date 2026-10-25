# Milestone 4: Operations and Cutover

Status: application lifecycle and portable financial recovery are implemented and
locally verified. Successful beta publication, real-host rehearsal and production
acceptance remain open. Follow the ordered [finish-line checklist](README.md).

## Real-Host Rehearsal

The target is the home server's Ubuntu Docker VM. It needs a published beta from
GHCR before rehearsal can begin. Do not make those host checks a prerequisite for
obtaining the beta; public beta distribution still requires automated checks,
reviewed notices/source and approval under [builds and releases](builds-releases.md).

Use disposable data first:

1. Pull the published digest and use its matching deployment bundle.
2. Verify HTTPS termination, configured public URL, trusted proxies and LAN/VPN access.
3. Verify non-root ownership, private local-disk storage, persistent keys and optional private export mount.
4. Bootstrap a Manager; check Manager/Member core workflows, both languages and the deployed build/source identity.
5. Restart/replace the container and check persistence, jobs, readiness, logs and graceful shutdown.
6. Rehearse complete backup/restore and an upgrade failure with a recoverable pre-upgrade snapshot.
7. Record the image digest, host/configuration, actual results and unresolved findings without publishing private data.

Commands and configuration are maintained in the
[operator guide](../../docs/development.md#docker-compose-configuration).

## Deployment Contract

- One supervised application container, running Node/.NET as non-root; only the web port is exposed and the backend binds to loopback.
- SQLite, images and Data Protection keys use private persistent local-disk storage. Single-instance operation only; no multi-replica or untested architecture claim.
- Initial published platform is Linux amd64. Add architectures only after their actual images are verified.
- HTTPS/proxy settings, resource limits, log rotation, storage monitoring and updates are operator responsibilities.
- No Azure, SMTP, external identity provider or runtime CDN is required.
- Startup rejects invalid configuration; credentials and keys must not be committed or included in the image.

## Backup, Restore, and Upgrades

Full-installation backup/restore is a manual operator procedure using ordinary
host/container tools, not a new backend endpoint, command, scheduler or UI.

- Stop the instance; back up the complete private data root, including SQLite/WAL state, images and authentication keys. Preserve private deployment configuration separately, particularly `TZ` and the Compose project/volume identity.
- Keep backups outside the container and preferably outside the Docker host. Agree frequency, retention, encryption, recovery point objective and recovery time objective.
- Restore into an empty compatible volume with correct ownership/permissions; start and verify users, accounts, history, sessions and jobs. Rehearse without touching real operator data.
- Take a recoverable backup before upgrades. Image rollback does not undo schema migrations; use a compatible image or restore the pre-upgrade installation.
- Older state may trigger normal allowance catch-up and retention at startup. Explain lost later writes and retained-key/session behavior; never imply stale recovery preserves newer activity.

## Portable Financial Export and Recovery

Implemented under
[ADR-0021](../../docs/ADR/ADR-0021-portable-financial-recovery.md).
The [operator guide](../../docs/development.md#portable-financial-recovery) and
[scenario catalog](../../tests/fixtures/financial-snapshots/README.md) own the commands.

- One versioned instance-wide JSON snapshot preserves exact balances, retained ledger details, audit attribution, allowance revisions/executions, retired keys and maintenance state.
- Exclude images, Identity users/roles/passwords, sessions and Data Protection keys. Recovery uses default images and separately created users; historical attribution is not remapped.
- `MONKEY_EXPORT_PATH` enables a private directory outside the data root. Check at startup and daily at 01:00 in configured `TZ`, handling downtime/DST safely. Publish only changed content, including an initial snapshot; unchanged checks do not create/prune files.
- `MONKEY_EXPORT_KEEP_COUNT`: default `30`, positive `1..365`, or `0` unlimited. Count successful snapshots, not elapsed days. Publish atomically, preserve the last valid export and retry failures without blocking financial operations.
- Content hashes exclude snapshot/build identity, capture time and retention's scan-only completion timestamp; financial changes, pruning and permanent safety metadata still count. Hashes detect differences, not authenticity.
- Offline `import-financial` requires an empty business target, matching configuration and exclusive access. Strictly validate the supported JSON contract, 256 MiB size limit, exact money, references and permanent identities, then import atomically without replaying postings or rewriting live history.
- Shared synthetic snapshots feed E2E/manual fixtures. Explicit destructive `--reset` belongs only to the isolated scenario loader, never the production importer.

Real SQLite probes and production-image tests cover export scheduling, DST,
atomic failure, recovery validation, idempotency, private files and role behavior.
Financial JSON recovery is not a replacement for full-volume backup/restore.

## Open-Source Translation Contributions

Complete or verify one contributor guide covering the language registry, catalog
layout, fallback language, Taiga mapping, placeholders/plurals, local preview and
the CI catalog-validation command. Keep German/English complete; define and test
the completion/fallback policy for additional languages. Verify a sample language
addition without scattered code changes. Do not assume translated legal wording
is automatically equivalent. No external translation platform is required.

## Observability and Security

- Verify structured logs, readiness/liveness and Manager-visible allowance failures on the real host. Do not log secrets, cookies or private financial payloads.
- Confirm host rotation, disk/backups monitoring, update ownership and bounded requests/uploads. Optional telemetry must not become an Azure dependency.
- Keep Dependabot alerts and notifier-only Renovate; no automated update PRs. Review the current low-severity dependency alert and record its disposition rather than treating an audit threshold as acceptance.
- Verify fork-safe CI without secrets/publishing permissions and review deployed authorization, CSRF, session, upload and private-cache behavior.
- Settle any outstanding security scan, SBOM/provenance and stable-publishing requirements before claiming stable release support. Existing identity/checksum files are not an SBOM or signed attestation.

## Production Cutover

After acceptance, create the production instance with deliberate accounts and
opening entries. No Azure import, dual writes or synchronization. Agree whether
and how long to retain the old environment/data, and prevent writes to both systems.
Azure shutdown, resource deletion, old-data disposal and credential removal each
require explicit approval. Removed repository source/workflows do not retire the
deployed resources. Do not rewrite Git history as part of plan cleanup.

## Release Gate

These unchecked items describe production acceptance, not missing feature code.
Local implementation/test completion is recorded in [testing](testing.md).

- [ ] Current full hosted E2E/integration/lifecycle checks pass against the release image; failures have actionable private diagnostics.
- [ ] [Publishing gates](builds-releases.md#acceptance-gates) pass, including matching source/version/digest, notices, assets, anonymous pulls and protected approval.
- [ ] Application-wide desktop/mobile, German/English and accessibility review accepts every shipped screen against the approved design.
- [ ] Translation contribution and future-language fallback guidance is documented and verified.
- [ ] Ubuntu host HTTPS/proxy, private storage, persistent keys, core workflows, restart and job behavior are verified.
- [ ] Full backup/restore and upgrade-failure recovery succeed on disposable state; backup policy and recovery objectives are agreed.
- [ ] Logs, job failures, storage limits and security/update responsibilities are operationally verified; remaining security/provenance decisions are closed.
- [ ] Deployment-specific legal/privacy review, accepted limitations and production scope are recorded. Deferred reversals are not silently promoted into scope.

Azure retirement is a separate authorized operation after these gates, not a
prerequisite for publishing the beta or testing the new installation.