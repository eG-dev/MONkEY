# ADR-0017 Backend Project Boundaries

_Creation date_: 2026-10-13

## Context

POCKET MONkEY's backend hosts HTTP endpoints, business workflows, authentication,
background workers, and operator commands. Structured persistence needs a clear
assembly boundary without a separate process or repository abstraction layer.

## Decision

- Use `PocketMonkey.Host` as the ASP.NET Core executable and composition root. It owns endpoints and contracts, application services, authorization and cookies, hosted workers, operator commands, configuration, startup orchestration, and readiness.
- Use `PocketMonkey.Storage` as a library containing persisted entities, `PocketMonkeyDbContext`, mappings, and EF migrations. Host references Storage; Storage never references Host or its HTTP contracts, configuration, or services.
- Keep the Identity user entity and EF persistence integration in Storage. Configure Identity stores, role policies, claims, sessions, and role initialization in Host.
- Apply Storage's migrations during Host startup before serving traffic. Keep all generated artifacts directly in `PocketMonkey.Storage/Migrations`, with namespace `PocketMonkey.Storage.Migrations` and one model snapshot. Use Host as the EF startup project.
- Application services may use the context directly. Do not require generic repositories or additional projects solely to hide EF Core.
- Keep images and Data Protection filesystem configuration and lifecycle in Host. Both projects form one backend process; the boundary does not change the public API or storage format.

This specializes [application boundaries](ADR-0002-application-boundaries.md),
preserves the [runtime deployment](ADR-0007-application-foundation.md), and
retains [local authentication](ADR-0008-local-authentication.md).