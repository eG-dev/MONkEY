# Milestone 4: operations and cutover

Status: not started. Basic lifecycle checks start in [stack foundation](01-stack-foundation.md).
Production cutover depends on the agreed slices in [UI and business logic](03-ui-business-logic.md),
the [step 2B design foundation](02b-ux-ui-design.md), and application-wide design acceptance.

## Goal

Make the new self-hosted instance secure, restorable, and upgradeable before
retiring the Azure version. This is deployment cutover, not Azure data migration.

## Deployment contract

- Publish a versioned image and a minimal example deployment with port, volume, and configuration documented.
- Complete the [GitHub build and release workflow](builds-releases.md), publishing the verified container and matching deployment assets with a versioned GitHub Release.
- Document the [ENV contract](configuration.md), including `TZ` and `MONKEY_DATA_PATH`, separately from host volume paths and published ports.
- Run Node and .NET as non-root with bounded resources and controlled shutdown.
- Document which host architectures are actually verified.
- Support LAN/VPN use with a defined HTTPS termination arrangement and trusted proxy configuration.
- Validate configuration on startup; do not put credentials or signing keys in the image or source control.
- No Azure connection strings, SMTP configuration, public CDN assets, or external identity provider are required.
- State the single-instance/local-disk limitation. SQLite is not an assumed multi-replica database.

## Open-source translation contributions

- Document the language registry, catalog layout, source/fallback language, Taiga resource mapping, and how to add a new language in one contribution guide.
- Include example translation changes, placeholder/pluralization rules, local preview commands, and the same validation command used by CI.
- Require German and English completeness and validate syntax/key/placeholder consistency on translation pull requests. Define an explicit completeness policy for additional languages.
- Document review expectations for translated privacy/terms content; do not treat community wording as automatically legally equivalent.
- Choose the OSS license explicitly and review third-party asset/translation licensing and repository history for private data or credentials before public publication.
- External translation platforms are optional future tooling, not required for contributors or for running the application.

## Backup, restore, and upgrades

- Back up the database, image files, and persistent authentication keys with appropriate confidentiality protections.
- Preserve deployment configuration, particularly `TZ`, with the recovery documentation so restored jobs use the original business-period rules.
- Use SQLite's supported backup mechanisms or a coordinated stopped-instance backup. Do not copy only a live database file while ignoring WAL state.
- Establish database/image consistency during backup; document whether writes must pause.
- Store backups outside the container and preferably outside the Docker host; a mounted volume alone is not a backup.
- Decide backup frequency, retention, encryption, recovery point objective, and recovery time objective.
- Provide a restore procedure and rehearse it on a clean host/volume.
- Take a pre-upgrade backup and apply schema migrations before readiness succeeds.
- Define schema compatibility explicitly. Rolling back an image does not undo a database migration; restore or a supported compatibility path is required.
- Explain recovery behavior for users, keys, sessions, and scheduled jobs after restoring an older backup.

## Observability and security

- Structured logs to stdout/stderr, with rotation handled by the host.
- Liveness/readiness cover the application processes and meaningful backend dependencies.
- Manager-visible allowance job failures; apply the same rule to report jobs only if reports are later approved. No email alerts or outbox are planned.
- Optional vendor-neutral telemetry rather than an Azure dependency.
- Never log passwords, session cookies, recovery credentials, or full private financial payloads.
- Dependency and container scanning, pinned build inputs, and a documented update process.
- Authorization, CSRF, upload validation, private-cache behavior, and session-revocation regression tests.
- Verify security behavior through real-stack browser/HTTP E2E scenarios, with focused integration checks where needed; no unit-test coverage gate is required.
- Rate limits and bounded request/upload sizes at appropriate layers.

## Incremental rollout

1. Keep the current Azure application available throughout replacement development.
2. Run the new instance with a separate empty database for acceptance testing; no dual writes or synchronization.
3. Complete an operational rehearsal, including restart during posting/jobs, backup/restore, and upgrade failure.
4. Agree on the minimum release scope and communicate that old balances/history are not transferred.
5. Start the accepted new instance with deliberately created accounts/opening entries.
6. Retain or archive the old environment for an agreed period; avoid ongoing user writes to both systems after cutover.
7. With explicit approval, disable Azure deployment workflows, stop the old application/Functions, and remove obsolete cloud resources and secrets.
8. Remove obsolete Blazor/Azure/email projects and references only after the new path is accepted. Historical source can remain available through Git.

## Release gate

- [ ] Core workflows and role permissions pass end-to-end tests.
- [ ] The [step 2B design acceptance gate](02b-ux-ui-design.md#acceptance-gate) passes, and application-wide review confirms the approved design across every shipped screen; functional tests alone do not approve the design.
- [ ] The full E2E regression and container lifecycle suites pass against the release build, with reproducible fixtures and actionable failure artifacts.
- [ ] The [GitHub publishing acceptance gates](builds-releases.md#acceptance-gates) pass; the released assets and public container digest correspond to the verified source revision.
- [ ] Targeted integration checks cover agreed database/job risks; release does not depend on a unit-test suite or unit-coverage percentage.
- [ ] German and English cover all shipped UI, with a documented and tested path for adding languages.
- [ ] Container restart and job retry do not corrupt or duplicate financial activity.
- [ ] No required email, Azure, external identity, or runtime CDN dependency exists.
- [ ] One documented application container and its persistent volume can run the system.
- [ ] HTTPS and host/proxy requirements are explicit and verified.
- [ ] Backups restore successfully on a clean instance.
- [ ] Upgrade failure and rollback/restore procedures have been rehearsed.
- [ ] Operational logs and job failures are observable without cloud services.
- [ ] Remaining feature omissions and accepted limitations are documented, including deferred monthly reports and dedicated reversals.
- [ ] Azure retirement and old-data disposal have explicit approval.

Return to the [migration overview](README.md).