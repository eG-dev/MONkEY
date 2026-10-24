# POCKET MONkEY migration plan

Status: Step 0 guardrails are implemented; milestone 1 has a locally verified build/run/storage foundation. Local authentication and user administration are implemented as step 2A. The user accepted step 2B design references, foundations, and implemented representative screens on 2026-10-10; the design pause is lifted. Steps 3A shared accounts, 3B ledger/opening balances, and the approved 3C manual transaction/history scope remain locally implemented with their existing verification records. Step 3D account images is locally implemented and verified on 2026-10-10. Steps 3E allowance configuration and 3F execution are locally implemented and verified on 2026-10-12; see the [final allowance acceptance evidence](03f-allowance-execution.md#delivery-evidence). The user's earlier GitHub Actions success confirmations remain recorded in the [testing record](testing.md); hosted verification for this new revision remains open. Step 3H lifecycle completion, fork-specific CI verification, publishing rehearsal, and the real deployment host remain open. Dedicated reversals are deferred from the first release. Monthly reports are excluded from the product scope.

## Confirmed scope

- Application name: **POCKET MONkEY**, with a lowercase `k`, for managing pocket money.
- Small household/group deployment, accessible over LAN or VPN.
- One instance, multiple users, no tenancy.
- Managers administer users and accounts and perform financial writes.
- Members can read all accounts; no account assignments are required.
- Angular SSR with Taiga UI and locally packaged Lucide icon fonts/assets.
- German and English are available from the first release; localization must support additional community-contributed languages.
- Intended publication as a GitHub open-source project under `AGPL-3.0-only`; see [ADR-0018](../../docs/ADR/ADR-0018-project-license.md). Source-only public development may precede ORT and comprehensive third-party release preparation, but still requires rights/notices for included material and a private-data/history review. Public Docker images and releases require their complete notices, corresponding-source delivery and separate release gates.
- Builds and verification run through GitHub Actions; versioned distributions are published as GitHub Releases, with a Docker image as the primary runtime artifact.
- ASP.NET Core backend; retaining .NET for business logic is acceptable.
- Prefer one application container, with persistent storage outside its writable layer.
- Self-contained local authentication. OIDC integration is optional, not required for the first release.
- No email functionality, SMTP dependency, email queue, or email-based recovery.
- No monthly reports, monthly-summary views, report snapshots, or report-generation jobs.
- No import of existing Azure data. The new instance starts with a clean database.
- Incremental development, not a big-bang rewrite or deployment.
- Business timezone is set through Docker ENV (`TZ`, using an IANA timezone ID).
- E2E-first testing: extensive real-application browser coverage, focused integration tests where useful, and no routine unit-test requirement. Unit tests may be absent entirely.
- Key decisions are documented during migration in Markdown ADRs under `/docs/ADR`, with Mermaid diagrams where useful. [ADR-0001](../../docs/ADR/ADR-0001-architecture-decision-records.md) establishes the concise greenfield format; the [ADR index](../../docs/ADR/README.md) lists the initial records created during Step 0. Extend them in each phase; revamping history and execution sequencing stay in these plans.

## Target architecture

Browser -> Angular SSR / Web-BFF -> ASP.NET Core API / application services

The backend owns identity, authorization, business rules, database access, images,
and scheduled jobs. The BFF owns rendering and browser-facing transport, not
financial rules. Both API requests and SSR data reads require backend authorization.

The following packaging/storage choices are now implemented and evaluated locally
in [ADR-0007](../../docs/ADR/ADR-0007-application-foundation.md). See the
[foundation guide](../../revamp/README.md) for verified commands and remaining gates.

Initially package Node and ASP.NET Core in one image as two supervised processes.
Expose only the web-facing port; bind the backend to loopback in that deployment.
Keep the internal API explicit so two containers remain possible without rewriting
business logic. SSR does not imply that every route must use server rendering.

Use SQLite on a local-disk Docker volume for structured data and a directory in
that volume for images. Only the backend accesses the database. Persist ASP.NET
Core Data Protection keys there as well. No Redis, message broker, or database
server is required for the initial single-instance deployment.

HTTPS must be supplied by the host/reverse proxy or explicitly configured in the
application deployment. One application container does not mean zero host setup.
Internet connectivity and an external identity provider must not be required at runtime.

## Milestones

Work-order update (2026-10-18): the user selected ORT and approved preparing for
it while removing the superseded notice approach. The bespoke audit dump and
review worksheet are replaced by an [ORT preparation guide](../../revamp/notices/README.md),
preserving the artwork-authorship confirmation and reusable notice delivery.
On 2026-10-19 the user confirmed source-only GitHub publication first, with Docker
images and releases later. ORT setup and release dependency/asset discovery and
review move to the end, after the repository can become
public and before artifact distribution. Source publication still requires rights
and applicable notices for included material plus private-data/credential review.
Continue the non-notice [Step 3H work](03h-lifecycle.md#current-work-order);
retention is locally implemented and verified. This sequencing does not waive
licensing/source obligations or independently approve publication.

Notice delivery is staged: first a manually reviewed Angular, .NET, ASP.NET Core,
EF Core, SQLite (including provider/bindings/native bundle), Taiga UI, Lucide and
Roboto set, with optional initial About presentation before
ORT; later tool-assisted expansion under the
[staged checklist](../../revamp/notices/README.md#staged-delivery). Partial
overview coverage does not postpone applicable redistribution obligations.

On 2026-10-24 the user approved the
[proportional notice workflow](../../revamp/notices/README.md#proportional-review-approved-2026-10-24):
automated discovery, targeted exception review and preserved upstream material.
Keep About curated; do not turn npm transitives or OS packages into an exhaustive
manual collection backlog. The
[backend/native slice](../../revamp/README.md#backend-and-native-notices-2026-10-24)
now maps all 18 packages in the published backend, preserving shared upstream
bundles rather than enumerating their contents. The user confirmed the agreed
manual notice work complete on 2026-10-24; ORT and its findings/release review
come later. Recorded Skia applicability/source and runtime/OS questions belong
to that deferred phase, not a separate manual backlog. The user subsequently
accepted the curated collection as complete and requested removal of the partial
label. Keep `coverage: complete` separate from `releaseReview: pending`; finish
the revamp first, then complete ORT and its findings review before **1.0.0**.
Independent publication gates remain unchanged.

| Order | Plan | Outcome |
| --- | --- | --- |
| 1 | [Stack foundation](01-stack-foundation.md) | Runnable .NET + Angular SSR + storage in Docker |
| 2A | [Authentication and authorization](02-authentication-authorization.md) | Local users, sessions, and enforced roles; locally implemented |
| 2B | [Product UX and UI design](02b-ux-ui-design.md) | Approved workflows/wireframes/visual foundations and established representative UI patterns |
| 3 | [Incremental UI and business logic](03-ui-business-logic.md) | Separately gated business slices with usable, tested UI |
| 4 | [Operations and cutover](04-operations-cutover.md) | Application-wide design acceptance, restorable deployment, and deliberate Azure retirement |

Milestone 3's [shared accounts](03a-accounts.md), [opening balances](03b-ledger-opening-balances.md), and [manual transactions/history](03c-transactions.md) steps are locally implemented:
account listing, detail, creation/editing, explicit signed opening entries, atomic deposits/withdrawals, and snapshot-paginated history with exact balances and EUR/USD display units. [Account images](03d-account-images.md) now adds private upload, display, replacement, and removal. These are functional deliveries, not application-wide design acceptance. Allowance
configuration/execution now adds durable monthly credits and approved localized execution status. Lifecycle completion remains a separate subsequent step; dedicated reversals are deferred from the first release. Follow the
[delivery order and decision gates](03-ui-business-logic.md#delivery-steps).

[Step 2B design foundations and representative screens](02b-ux-ui-design.md#acceptance-gate)
were accepted by the user on 2026-10-10; remaining milestone 3 work may resume
subject to each slice's policy and verification prerequisites. Store references under
[docs/design](../../docs/design/README.md). Approved design patterns guide each
subsequent slice; application-wide design review remains a milestone 4 release
gate. Existing 3A-3C delivery history is preserved, not restarted or discarded.

The ledger and transaction history are the financial record. Monthly reports
are not a deferred feature or a planned follow-up.

Each milestone has an acceptance gate. Work may be demonstrated before feature
parity, but the replacement is not the production system until its release gates
pass. Add foundational operational checks in milestone 1; do not postpone all
deployment validation until milestone 4.

Every phase also adds or resolves the relevant ADRs before its acceptance gate is
complete. Follow the [ADR lifecycle](00-guardrails.md#architecture-decision-records)
established during Step 0; proposed choices in these plans are not automatically
accepted decisions.

## Supporting plans

These plans keep cross-cutting requirements separate from the milestone sequence:

| Plan | When to apply |
| --- | --- |
| [Step 0: implementation guardrails](00-guardrails.md) | Before scaffolding; refine after the foundation spike |
| [Docker environment configuration](configuration.md) | Establish in milestone 1; maintain through deployment and recovery |
| [Localization](localization.md) | Establish in milestone 1; deliver German/English with every feature |
| [E2E-first testing](testing.md) | Establish in milestone 1; grow through all subsequent milestones |
| [GitHub builds and releases](builds-releases.md) | Establish CI in milestone 1; complete release publishing before production cutover |

## Incremental repository strategy

- Leave the current WebApp and Functions deployable while building the replacement.
- Confirmed home: `revamp/`, with `web/`, `backend/`, `tests/e2e/`, `tests/integration/`, and `deploy/`. Use a separate .NET solution and Angular workspace; confirm backend project subdivisions during scaffolding.
- Reuse reviewed C# rules and helpers selectively; do not share Azure Table entities as the new domain model.
- Extract behavior currently implemented in Razor pages into backend application services.
- Keep existing Azure publish workflows independent. Milestone 1 added narrow replacement/docs exclusions and tested that owning/shared runtime changes still trigger deployment; see the [foundation handoff](00-guardrails.md#foundation-handoff). The new verification workflow does not deploy or require Azure secrets.
- No dual writes, Azure/local synchronization, or data import is planned.
- Do not remove old projects or cloud resources merely because an early milestone works.

## Current implementation anchors

- [Web startup](../../WebApp/Program.cs): Blazor Server, Microsoft identity, Azure telemetry.
- [Service registration](../../WebApp/ServiceCollectionExtensions.cs): Azure Tables, Blobs, and Queues.
- [Account details](../../WebApp/Components/Pages/AccountDetails.razor): transaction and allowance behavior embedded in UI code.
- [Account management](../../BusinessLogic/Services/AccountManagementService.cs): account/image operations and tenant-dependent checks.
- [Tenant management](../../BusinessLogic/Services/TenantManagementService.cs): user and tenant lifecycle currently combined.
- [Workers](../../Functions/Workers): allowance credits, monthly reporting, cleanup, and email delivery.

## Decisions to close during implementation

- Currency, precision, and opening-entry guarantees are resolved in [ADR-0010](../../docs/ADR/ADR-0010-ledger-and-money.md) and [ADR-0011](../../docs/ADR/ADR-0011-currency-display-unit.md). Signed openings, overdrafts, manual transactions, and history are recorded in [ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md), superseding the original nonnegative rule. Account naming and the absence of a nine-account cap are recorded in [ADR-0009](../../docs/ADR/ADR-0009-shared-accounts.md). Dedicated corrections/reversals remain a subsequent decision.
- Deployment timezone value via `TZ`, monthly allowance due date, catch-up after downtime, and handling timezone changes after initial use.
- Transaction-history retention configuration is accepted: `MONKEY_TRANSACTION_RETENTION_MONTHS`, default `24`, minimum positive `1`, `0` unlimited. Cleanup design, cutoff semantics, and preservation of balances/idempotency still need approval; see [step 3H](03h-lifecycle.md#transaction-retention-discussion). Account archival and user deletion/anonymization are removed from product scope, not deferred.
- Manager recovery process and whether MFA is needed for the first release.
- HTTPS termination, backup location, restore objectives, and supported host architectures.
- Which authenticated routes benefit from SSR versus client rendering.

Defaults proposed in the milestone plans are not silently accepted requirements.
Resolve behavior-changing decisions before implementing the affected feature.