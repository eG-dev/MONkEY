# Milestone 1: stack foundation

Status: in progress. The initial build/run/storage slice is implemented and verified locally on 2026-10-04. Hosted CI, publishing rehearsal, and the real host's HTTPS setup remain open.

See the [foundation guide and verification record](../../docs/development.md) and
[ADR-0007](../../docs/ADR/ADR-0007-application-foundation.md). Local authentication
and user administration are now implemented under
[milestone 2](02-authentication-authorization.md); financial functionality has not
started. This does not close the hosted/fork CI, publishing, or deployment-host gates.

## Goal

Prove Angular SSR, .NET, SQLite, and persistent files work together on the target
Docker host before implementing authentication or financial behavior.

## Supporting plans

Complete [Step 0: implementation guardrails](00-guardrails.md) before scaffolding.
During this milestone, establish the cross-cutting foundations described in:

- [Docker environment configuration](configuration.md).
- [Localization](localization.md).
- [E2E-first testing](testing.md).
- [GitHub builds and releases](builds-releases.md).

These are supporting plans, not additional sequential milestones. Their detailed
requirements and acceptance checks live in those documents.

## Work

1. Create an isolated replacement workspace and independent build configuration.
2. Select supported Angular, Node LTS, Taiga UI, and .NET versions. Start from the existing .NET 10 baseline; record compatible versions and use lockfiles.
3. Create an ASP.NET Core backend with health/readiness endpoints, structured logs, OpenAPI contracts, consistent error responses, and cancellation handling.
4. Create the Angular SSR host with Taiga UI. Mount browser-facing API forwarding before the SSR route fallback.
5. Bundle Lucide icon fonts/assets locally through a maintained package such as `lucide-static`. Verify the font distribution, licensing, CSS integration, and compatibility with Taiga controls. Do not fetch fonts or icons from a CDN at runtime.
6. Establish a backend-only SQLite persistence layer, preferably EF Core SQLite, with schema migrations and foreign-key enforcement.
7. Establish configurable image and Data Protection key directories on persistent storage. Validate permissions before readiness succeeds.
8. Build a multi-stage container containing production Angular assets, Node SSR, and the published .NET application; do not ship development toolchains.
9. Add a proven supervisor/init arrangement that forwards signals, reaps child processes, and causes container failure when either application process fails. A health check alone must not leave a broken container indefinitely running.
10. Establish Playwright E2E infrastructure and independent GitHub Actions builds/tests/container checks, plus a publishing rehearsal, following [GitHub builds and releases](builds-releases.md). Do not deploy to Azure.
11. Establish the [localization foundation](localization.md) and demonstrate German/English switching before implementing authentication or business screens.
12. Extend the ADRs created during Step 0 with the key stack, storage, deployment, localization, and testing decisions resolved by this spike; follow the [ADR lifecycle](00-guardrails.md#architecture-decision-records).

## Minimal demonstration

- A Taiga-based shell displays backend availability and a harmless persisted sample value.
- A page produces server-rendered HTML and hydrates without errors.
- The sample value survives container replacement with the same volume.
- A test image/file survives restart and is served from the configured storage path.
- No account, transaction, report, or user-management functionality is exposed yet.
- Temporary diagnostics are development-only and are removed or restricted before release.

## Interfaces and ownership

- Browser requests use one public origin; do not introduce permissive CORS.
- SSR and client requests use the same documented backend contracts.
- Backend connection details are server-only configuration.
- Define trusted proxy handling and public base URL configuration early.
- Keep all SSR request state request-scoped; do not use singleton user state.
- SQLite is accessed only by the backend; use local storage, not a network share.
- Use bounded database busy handling and short write transactions; never hold one across HTTP or filesystem operations.
- Apply schema migrations once before serving traffic; fail startup clearly if migration fails.

## Acceptance gate

- [x] The [guardrail acceptance gate](00-guardrails.md#acceptance-gate) is satisfied for the current foundation scope; feature-specific enforcement continues as features arrive.
- [ ] The [configuration](configuration.md#acceptance-gate), [localization](localization.md#acceptance-gate), and [testing](testing.md#foundation-acceptance-gate) foundation gates are satisfied. Local checks pass; GitHub-hosted execution remains pending.
- [x] Key local stack/storage/lifecycle/localization/testing decisions and their rationale are recorded in `/docs/ADR`; publishing/host decisions remain explicit pending gates.
- [ ] Local builds and container builds succeed from a clean checkout. Locked local builds and an isolated Docker build pass; clean GitHub checkout execution remains pending.
- [ ] GitHub-hosted CI builds and runs the current E2E suite, including fork contributions, without Azure secrets; a release publishing dry run or foundation prerelease is verified.
- [x] Angular SSR works with Taiga components, Lucide fonts, and hydration.
- [x] Fonts/icons load with outbound networking disabled; no runtime CDN dependency exists.
- [x] Database and files persist across restart and container replacement.
- [x] Only the intended public port is published; the backend binds to loopback in the tested image.
- [x] Either child process crashing causes an observable failed container lifecycle.
- [x] Docker stop terminates both processes within a bounded shutdown period.
- [x] Readiness includes backend/storage availability, not just a listening Node port.
- [x] The existing Azure application still builds without depending on the replacement, with the documented local public-feed override for generated worker extensions.

## Decisions and limits

Validate Linux timezone/globalization support, the actual target CPU architecture,
and the host HTTPS arrangement. Do not claim ARM support without building and
testing it. If dual-process supervision proves unreliable, revisit the preference
for one container explicitly rather than hiding extra required services.

## Host/Storage Extraction Proposal R1

Revision R1 dated 2026-10-13, explicitly approved by the user on 2026-10-13
("approved" in response to the named proposal). Approval covers the following
mapping, the migration-location rule replacement, and the two-project extraction.
Implementation and focused local verification completed on 2026-10-13. Earlier feature approvals and
delivery evidence remain unchanged. The enduring boundary is recorded in
[ADR-0017](../../docs/ADR/ADR-0017-backend-project-boundaries.md).

### Purpose and Dependency

Rename the runnable backend to `PocketMonkey.Host` and extract structured
persistence into `PocketMonkey.Storage`. The only production project dependency
is Host -> Storage. Both remain part of the same backend process and deployment;
Storage is a library, not another service. Application services may continue using
the context directly; do not add repositories, a third domain project, or new
business abstractions as part of this extraction.

Implemented project paths are `backend/PocketMonkey.Host/PocketMonkey.Host.csproj`
(Web SDK executable) and
`backend/PocketMonkey.Storage/PocketMonkey.Storage.csproj` (.NET library).
Both retain the pinned .NET/EF versions and isolated
replacement build configuration. Storage must not reference Host or its settings,
HTTP contracts, authorization policies, application services, or hosted workers.

### Approved Class and Namespace Mapping

Links below now point to the implemented locations; the approved responsibilities
and scope are unchanged.

| Types and Current Files | Approved Ownership and Namespace |
| --- | --- |
| [Program](../../backend/PocketMonkey.Host/Program.cs), Contracts, Endpoints, Services, HostedServices, Operations, and Configuration | Move beneath `backend/PocketMonkey.Host`; use namespace prefix `PocketMonkey.Host`, preserving folder suffixes and responsibilities |
| [PocketMonkeyDbContext](../../backend/PocketMonkey.Storage/PocketMonkeyDbContext.cs) | `PocketMonkey.Storage/PocketMonkeyDbContext.cs`, namespace `PocketMonkey.Storage`; retain context name and mappings |
| [Account](../../backend/PocketMonkey.Storage/Entities/Account.cs), [ApplicationUser](../../backend/PocketMonkey.Storage/Entities/ApplicationUser.cs), [AuditEvent](../../backend/PocketMonkey.Storage/Entities/AuditEvent.cs), [LedgerEntry](../../backend/PocketMonkey.Storage/Entities/LedgerEntry.cs), [AllowanceRevision](../../backend/PocketMonkey.Storage/Entities/AllowanceRevision.cs), [AllowanceExecution](../../backend/PocketMonkey.Storage/Entities/AllowanceExecution.cs) | `PocketMonkey.Storage/Entities/<Type>.cs`, namespace `PocketMonkey.Storage.Entities`; preserve properties and relationships |
| [LedgerEntrySource](../../backend/PocketMonkey.Storage/Entities/LedgerEntrySource.cs) and [LedgerEntrySourceConverter](../../backend/PocketMonkey.Storage/Entities/LedgerEntrySourceConverter.cs) | Move together to `PocketMonkey.Storage.Entities`; preserve existing enum values and JSON serialization metadata to avoid contract changes |
| [UserRole](../../backend/PocketMonkey.Host/Identity/UserRole.cs) | `PocketMonkey.Host/Identity/UserRole.cs`, namespace `PocketMonkey.Host.Identity`; this is a role-policy/API type, not a property of the persisted ApplicationUser |
| [IdentityConfiguration](../../backend/PocketMonkey.Host/Identity/IdentityConfiguration.cs) and remaining Identity helpers | Stay in Host under `PocketMonkey.Host.Identity`; retain Identity store registration against the Storage context, cookie configuration, claims, role-name conversion, throttling, and authorization |
| [BackendInitialization](../../backend/PocketMonkey.Host/Startup/BackendInitialization.cs) | `PocketMonkey.Host/Startup/BackendInitialization.cs`, namespace `PocketMonkey.Host.Startup`; retain scoped migration execution, role initialization, and Data Protection validation in existing order |
| [StorageReadinessCheck](../../backend/PocketMonkey.Host/Health/StorageReadinessCheck.cs) | `PocketMonkey.Host/Health/StorageReadinessCheck.cs`, namespace `PocketMonkey.Host.Health`; retain database checks and InstanceSettings filesystem validation |
| [Migration history](../../backend/PocketMonkey.Storage/Migrations/20261004145713_InitialFoundation.cs) and [PocketMonkeyDbContextModelSnapshot](../../backend/PocketMonkey.Storage/Migrations/PocketMonkeyDbContextModelSnapshot.cs) | Move all 21 generated artifacts directly to `PocketMonkey.Storage/Migrations`, namespace `PocketMonkey.Storage.Migrations`; retain migration IDs, class names, operations, and the single snapshot |

Host owns startup orchestration and decides when to apply migrations; Storage owns
their implementation and the model. Keep filesystem images, Data Protection keys,
their settings, and their cleanup behavior in Host. Storage references Identity EF
and SQLite packages; Host retains OpenAPI, image packages, and EF design-time tooling
needed as the startup project. Adjust package references and regenerate affected
lockfiles without changing pinned dependency versions. Integration probes reference
Storage directly where they use persisted types and Host where they exercise
application behavior; production dependency direction remains one-way.

### Persistence and API Invariants

- No new database migration, table rename, data conversion, column/relationship/index/constraint change, or ledger rewrite is intended. Keep `monkey.db`, the data-root setting, and migration-history table unchanged.
- Moving migrations to another assembly must preserve discovery by the same context. Update CLR namespaces and generated metadata/model type references consistently; prove the current model has no pending schema changes rather than generating an empty migration to hide a mismatch.
- Preserve exact money, financial atomicity, idempotency, retries, audit records, role visibility, and worker scheduling. Endpoints, DTO shapes, JSON enum values, status/error codes, cookie names, security-stamp behavior, and bootstrap/recovery restrictions remain unchanged.
- Replace project/assembly paths in the solution, integration references, Docker build/publish/runtime commands, Supervisor configuration, web development launcher, E2E operator commands/probes, workflows, and current documentation. Keep the deployed backend output directory unchanged where practical; its executable becomes `PocketMonkey.Host.dll`. Do not change the web/backend transport or public ports.
- Existing populated databases must open and upgrade without losing data or reapplying migrations. This extraction adds no schema change; rollback to the previous executable has no intended data-format barrier, but is not a substitute for a backup or a general downgrade policy.

### ADR and Instruction Implications

Follow [ADR-0002](../../docs/ADR/ADR-0002-application-boundaries.md),
[ADR-0007](../../docs/ADR/ADR-0007-application-foundation.md), and
[ADR-0008](../../docs/ADR/ADR-0008-local-authentication.md); their process, storage,
and security decisions remain intact. The approved Host -> Storage dependency and
responsibility boundary is recorded in
[ADR-0017](../../docs/ADR/ADR-0017-backend-project-boundaries.md), following
[ADR-0001](../../docs/ADR/ADR-0001-architecture-decision-records.md), and linked from
the ADR index and affected instructions.

The [backend instructions](../../.github/instructions/backend.instructions.md)
previously required migrations inside the executable project. Approved R1 replaces
that rule with `backend/PocketMonkey.Storage/Migrations` and
`PocketMonkey.Storage.Migrations`, together with the build/layout guards.
The documented EF generation command, from the repository root, is now:

```text
dotnet ef migrations add <Name> --project backend/PocketMonkey.Storage --startup-project backend/PocketMonkey.Host --context PocketMonkeyDbContext --output-dir Migrations --namespace PocketMonkey.Storage.Migrations
```

### Acceptance Checks

1. Locked Release solution build and guardrail checks, including negative migration-location checks for both projects, one snapshot, and no remaining active references to the former combined API project.
2. EF migration listing and pending-model-change check using Storage as the target and Host as startup; compare existing migration IDs before/after. No migration generation is part of the extraction.
3. Existing real-SQLite `identity-upgrade`, account, ledger, image, allowance-persistence, and allowance-execution runtime probes; these cover historical upgrades, populated state, constraints, rollback, concurrency, and durable execution.
4. Rebuild the production Docker image and run focused real-stack authentication/operator, ledger API, image persistence, and allowance worker recovery checks, verifying startup/readiness and persisted state across restart. Verify the development launcher uses the renamed project.
5. Record actual commands and results below; hosted CI remains a separate delivery gate.

### Delivery Evidence

Focused local checks completed on 2026-10-13:

- `dotnet build PocketMonkey.slnx --configuration Release -p:RestoreLockedMode=true` from the repository root: passed for Host, Storage, and RuntimeChecks. Lockfiles were regenerated for the deliberate project/dependency ownership changes; existing backend package versions were verified unchanged.
- Pinned `dotnet tool restore`, then EF `migrations list --no-connect` and `migrations has-pending-model-changes` with `--project backend/PocketMonkey.Storage --startup-project backend/PocketMonkey.Host --context PocketMonkeyDbContext --configuration Release --no-build`: passed; the same ten migration IDs are discoverable and the model has no pending changes. These checks used a temporary isolated data root.
- All ten migration implementations were compared with their pre-extraction versions: only their namespace changed, not their schema operations. No migration was added.
- `dotnet tests/integration/RuntimeChecks/bin/Release/net10.0/RuntimeChecks.dll <probe>` for `identity-upgrade`, `account-persistence`, `ledger-persistence`, `image-persistence`, `allowance-persistence`, and `allowance-execution`: all six passed with real SQLite.
- Build and repository guards were negative-tested with a misplaced migration copy in each project: both rejected both copies, which were then removed. Positive guardrails validate all 21 artifacts, matching metadata pairs, namespace, and the single snapshot.
- `npm.cmd --prefix tests/e2e run check`: passed. `node --check web/scripts/dev.mjs` and its Host project path check passed; the development launcher was not started and its existing data was not modified.
- Production image rebuild with the explicit default Docker context/builder and `deploy/Dockerfile`: passed, including locked restore, Host publish, and the Angular production build.
- `npm.cmd --prefix tests/e2e test -- specs/authentication/security.spec.ts specs/authentication/persistence.spec.ts specs/ledger/transaction-api.spec.ts specs/accounts/images-api.spec.ts specs/accounts/allowance-execution.spec.ts specs/shell/resilience.spec.ts --project desktop --workers 1 --reporter=dot`: 12 passed, zero retries, 3.2 minutes against the rebuilt production image. This covers operator/authentication behavior, persisted sessions, ledger rules, image state, durable allowance recovery, readiness, and supervised lifecycle.

No full-suite or new GitHub-hosted success is claimed for this revision. Prior
delivery history remains intact; publishing, fork, and deployment-host gates remain open.

Next: [authentication and authorization](02-authentication-authorization.md).