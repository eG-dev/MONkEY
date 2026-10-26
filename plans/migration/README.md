# POCKET MONkEY Finish-Line Plan

Status: core features are implemented and locally verified. Remaining work is
hosted release verification, publishing, real-host rehearsal and final acceptance.
This is the authoritative remaining-work checklist. Decisions live in the
[ADR index](../../docs/ADR/README.md); commands and operator procedures live in the
[development guide](../../docs/development.md). Git retains the delivery history.

## Remaining Work

| Order | Next Outcome | Completion Evidence |
| --- | --- | --- |
| 1 | Publish the verified beta | Full hosted CI passes; reviewed draft, same tested image, digest-pinned assets and anonymous image pull succeed |
| 2 | Rehearse on the home server | Ubuntu Docker VM verifies HTTPS/proxy, private storage, bootstrap, core workflows, restart and jobs |
| 3 | Prove recovery and upgrade procedures | Disposable full-volume backup/restore and upgrade-failure recovery succeed; recovery objectives and backup policy are agreed |
| 4 | Complete final acceptance | Application-wide design and German/English review, translation contribution guidance, fork-safe CI and operational/security checks are closed |
| 5 | Approve production cutover | The [release gate](04-operations-cutover.md#release-gate) passes; limitations and the production scope are accepted |

The beta.1 retry has failed again; the reported hosted blocker is .NET
installation/download availability. Recheck the failure before retrying. Do not
bypass verification or claim publishing/real-host success. Failed unpublished
attempts may be retagged only under the approved exception in
[ADR-0006](../../docs/ADR/ADR-0006-github-delivery.md).

## Implemented Scope

- Local users, Manager/Member roles, sessions, password flows and operator recovery.
- Shared accounts, private images, signed opening balances, exact deposits and withdrawals, and paginated history.
- Monthly allowance configuration, catch-up, durable retries and execution status.
- Automatic transaction-detail retention with permanent financial safety records.
- Shared public/authenticated About, build/source identity, AGPL license, notices and approved bilingual operator/privacy information.
- Optional change-only financial JSON exports, offline empty-target recovery and shared test scenarios.
- Angular SSR/Web-BFF, .NET/SQLite and non-root supervised Docker deployment, with German/English and locally bundled runtime assets.
- Root repository layout, CI tiers and protected GHCR pre-release workflow.

The full real-image suite passed **87 cases locally in 11.8 minutes**, with two
workers and zero retries. This is not hosted release or deployment acceptance.
See [testing](testing.md) for current coverage and commands.

## Product Boundaries

- One shared instance; Members read all accounts, Managers perform business writes. Backend authorization is authoritative.
- No tenancy, email/SMTP, monthly reports, Azure data import, account archival or user deletion/anonymization.
- Dedicated transaction reversals are deferred beyond the first release.
- No required external identity provider, runtime CDN, Redis or separate database server.
- SQLite uses local disk and a single application instance; do not advertise multi-replica support.
- Financial JSON recovery does not restore users, credentials, images or authentication keys and is not a full-installation backup.
- No new feature or settings backlog is implied by unfinished acceptance checkboxes.

## Acceptance Ownership

- [Lifecycle completion](03h-lifecycle.md): implemented behavior and feature-closeout boundaries.
- [Builds and releases](builds-releases.md): hosted verification, approval, publication and artifact identity.
- [Operations and cutover](04-operations-cutover.md): host rehearsal, backup/restore, upgrades and final acceptance.
- [Testing](testing.md), [configuration](configuration.md) and [localization](localization.md): cross-cutting contracts and checks.
- [Wiki documentation plan](wiki-documentation.md): approved structure, English sources and automatic main publication; initialization is complete and hosted authentication verification remains open.

Real-host verification requires the published beta; do not make host rehearsal
a circular prerequisite for obtaining it. Public beta distribution still requires
automated checks, reviewed notices, corresponding source and publication approval.
GitHub dependency reporting and targeted distribution review replace ORT under
[ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md).

## Completed Milestones

| Milestone | Reference | Current State |
| --- | --- | --- |
| 0 | [Guardrails](00-guardrails.md) | Implemented; focused workflow/EF checks and change-scoped documentation validation |
| 1 | [Runtime stack](01-runtime-stack.md) | Implemented and locally verified |
| 2A | [Authentication](02-authentication-authorization.md) | Implemented and locally verified |
| 2B | [UX/UI design](02b-ux-ui-design.md) | Representative design accepted; application-wide review remains |
| 3 | [Business features](03-ui-business-logic.md) | Agreed first-release feature scope implemented |
| 4 | [Operations](04-operations-cutover.md) | Financial recovery implemented; release and real-host acceptance remain |

## Repository and Cutover

Application paths are `web`, `backend`, `tests/e2e`, `tests/integration` and
`deploy`; `PocketMonkey.slnx` and shared build inputs are at the root. Legacy
source and Azure workflows are removed. That cleanup did not retire deployed
Azure resources or authorize deleting old data.

Start the accepted instance with deliberately created accounts/openings, without
dual writes or synchronization. Azure shutdown, resource deletion and old-data
disposal require separate explicit approval after a retention decision.