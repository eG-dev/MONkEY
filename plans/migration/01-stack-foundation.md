# Milestone 1: stack foundation

Status: not started. Depends on agreement with the [overview](README.md).

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

- [ ] The [guardrail acceptance gate](00-guardrails.md#acceptance-gate) is satisfied for the replacement workspace.
- [ ] The [configuration](configuration.md#acceptance-gate), [localization](localization.md#acceptance-gate), and [testing](testing.md#foundation-acceptance-gate) foundation gates are satisfied.
- [ ] Key milestone decisions and their rationale are recorded in `/docs/ADR`; evaluated proposals have explicit outcomes.
- [ ] Local builds and container builds succeed from a clean checkout.
- [ ] GitHub-hosted CI builds and runs the current E2E suite, including fork contributions, without Azure secrets; a release publishing dry run or foundation prerelease is verified.
- [ ] Angular SSR works with Taiga components, Lucide fonts, and hydration.
- [ ] Fonts/icons load with outbound networking disabled; no runtime CDN dependency exists.
- [ ] Database and files persist across restart and container replacement.
- [ ] Only the intended public port is reachable externally.
- [ ] Either child process crashing causes an observable failed container lifecycle.
- [ ] Docker stop terminates both processes within a bounded shutdown period.
- [ ] Readiness includes backend/storage availability, not just a listening Node port.
- [ ] The existing Azure application still builds without depending on the replacement.

## Decisions and limits

Validate Linux timezone/globalization support, the actual target CPU architecture,
and the host HTTPS arrangement. Do not claim ARM support without building and
testing it. If dual-process supervision proves unreliable, revisit the preference
for one container explicitly rather than hiding extra required services.

Next: [authentication and authorization](02-authentication-authorization.md).