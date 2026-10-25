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
archival or user deletion/anonymization workflows are in scope. Dedicated
reversals remain deferred rather than a blocker for the first release.

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

## Acceptance Gate

- [x] Agreed lifecycle features have real-stack browser/API coverage, including permissions, last-manager concurrency and retention safety.
- [x] Approved About/legal content and local notice delivery are implemented for both roles and the public entry point.
- [x] German/English catalogs are delivered; removed tenancy/email/account/user lifecycle features are not reintroduced.
- [ ] Complete current hosted release verification and source/notice/build identity checks on the actual distributed image.
- [ ] Complete application-wide visual/localization and deployment-specific legal/privacy acceptance as part of [operations](04-operations-cutover.md#release-gate).