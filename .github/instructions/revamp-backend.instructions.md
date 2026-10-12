---
description: "Use when implementing the replacement .NET backend: application services, authorization, exact money, persistence, migrations, and durable jobs."
applyTo: "revamp/backend/**"
---
# Backend

- Follow [application boundaries](../../docs/ADR/ADR-0002-application-boundaries.md) and [shared-instance access](../../docs/ADR/ADR-0003-shared-instance-access.md). Enforce authorization and input validation in the backend, including SSR data access.
- Follow the evaluated [foundation stack](../../docs/ADR/ADR-0007-application-foundation.md) and [reproducible commands](../../revamp/README.md). Use the independent solution and scoped NuGet/SDK configuration, not the legacy solution.
- Keep domain/application behavior independent of Angular and Azure SDK entities. Define explicit API contracts and stable error codes, not raw exception messages for display.
- Use meaningful names and separate interface files. Respect inherited EditorConfig rules; do not introduce primary constructors against the existing preference.
- Use exact money arithmetic, with the representation/rounding agreed before financial implementation. Post entries and stored balance updates atomically; enforce idempotency and concurrency guarantees in the selected persistence layer.
- Preserve financial audit history with explicit corrections. EF Core SQLite is selected; currency/precision, negative balances, retention, and job catch-up policies remain decisions for their responsible phases, not assumptions to hard-code now.
- Use immutable internal user IDs and UTC timestamps. Apply the validated IANA timezone from Docker ENV `TZ` explicitly for business periods; UI language must not change those periods.
- Make scheduled work durable, retry-safe, and observable. Do not hold database transactions across network/filesystem operations or rely on timers firing exactly once.
- Keep credentials and persistent authentication keys private. Validate configuration/permissions before readiness; log failures without passwords, cookies, or private payloads.
- Keep new projects within the replacement's isolated NuGet/build configuration; do not make legacy package changes implicitly. Restore locked dependencies and build from `revamp/` so its SDK pin is applied.
- Keep all EF migration implementations, designer metadata, and the single model snapshot directly in `revamp/backend/PocketMonkey.Api/Storage/Migrations`, using namespace `PocketMonkey.Api.Storage.Migrations`. Before generating, inspect the existing history/snapshot and use the exact scoped command in the foundation guide, with explicit `--output-dir Storage/Migrations` and `--namespace PocketMonkey.Api.Storage.Migrations`. Never generate a second migration folder or snapshot. Run the migration-layout guard and a real populated-schema upgrade check after generation or relocation; preserve existing migration IDs and operations.
- Verify user-facing behavior through E2E tests; use focused real-persistence integration tests for rollback, constraints, migrations, concurrency, and controlled job failures. Do not add routine mock/unit suites or coverage quotas.