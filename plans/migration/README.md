# POCKET MONkEY migration plan

Status: Step 0 guardrails are implemented; milestone 1 has a locally verified build/run/storage foundation. Local authentication and user administration are implemented as step 2A. Step 2B product UX/UI design is the next activity. Steps 3A shared accounts, 3B ledger/opening balances, and the approved 3C manual transaction/history scope remain locally implemented and verified; remaining milestone 3 feature work is paused until the step 2B acceptance gate passes. Hosted/fork CI, publishing rehearsal, and the real deployment host remain open; local implementation does not close those gates. Dedicated reversals and monthly reports are deferred from the first release; images and allowances have not started.

## Confirmed scope

- Application name: **POCKET MONkEY**, with a lowercase `k`, for managing pocket money.
- Small household/group deployment, accessible over LAN or VPN.
- One instance, multiple users, no tenancy.
- Managers administer users and accounts and perform financial writes.
- Members can read all accounts; no account assignments are required.
- Angular SSR with Taiga UI and locally packaged Lucide icon fonts/assets.
- German and English are available from the first release; localization must support additional community-contributed languages.
- Intended publication as a GitHub open-source project; document how to contribute translations and choose the project license explicitly before publication.
- Builds and verification run through GitHub Actions; versioned distributions are published as GitHub Releases, with a Docker image as the primary runtime artifact.
- ASP.NET Core backend; retaining .NET for business logic is acceptable.
- Prefer one application container, with persistent storage outside its writable layer.
- Self-contained local authentication. OIDC integration is optional, not required for the first release.
- No email functionality, SMTP dependency, email queue, or email-based recovery.
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

| Order | Plan | Outcome |
| --- | --- | --- |
| 1 | [Stack foundation](01-stack-foundation.md) | Runnable .NET + Angular SSR + storage in Docker |
| 2A | [Authentication and authorization](02-authentication-authorization.md) | Local users, sessions, and enforced roles; locally implemented |
| 2B | [Product UX and UI design](02b-ux-ui-design.md) | Approved workflows/wireframes/visual foundations and established representative UI patterns |
| 3 | [Incremental UI and business logic](03-ui-business-logic.md) | Separately gated business slices with usable, tested UI; 3G deferred |
| 4 | [Operations and cutover](04-operations-cutover.md) | Application-wide design acceptance, restorable deployment, and deliberate Azure retirement |

Milestone 3's [shared accounts](03a-accounts.md), [opening balances](03b-ledger-opening-balances.md), and [manual transactions/history](03c-transactions.md) steps are locally implemented:
text-only account listing, detail, creation/editing, explicit signed opening entries, atomic deposits/withdrawals, and snapshot-paginated history with exact balances and EUR/USD display units. These are functional deliveries, not accepted final visual designs. Images, allowance
configuration/execution, and lifecycle completion remain separate subsequent steps; monthly reports and dedicated reversals are deferred from the first release. Follow the
[delivery order and decision gates](03-ui-business-logic.md#delivery-steps).

Complete [step 2B design foundations and representative-screen implementation](02b-ux-ui-design.md#acceptance-gate)
before resuming remaining milestone 3 feature work, including backend-only
additions. Store draw.io wireframes and exported previews under
[docs/design](../../docs/design/README.md). Approved design patterns guide each
subsequent slice; application-wide design review remains a milestone 4 release
gate. Existing 3A-3C delivery history is preserved, not restarted or discarded.

Monthly summaries may later be derived on demand from the ledger, but no summary
feature, report snapshots, or report-generation jobs are part of the first release
without separately approved scope. See the [deferred report plan](03g-monthly-reports.md).

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
- Financial-history retention and archive versus permanent deletion semantics.
- Manager recovery process and whether MFA is needed for the first release.
- HTTPS termination, backup location, restore objectives, and supported host architectures.
- Which authenticated routes benefit from SSR versus client rendering.

Defaults proposed in the milestone plans are not silently accepted requirements.
Resolve behavior-changing decisions before implementing the affected feature.