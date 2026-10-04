---
description: "Use when implementing the replacement .NET backend: application services, authorization, exact money, persistence, migrations, and durable jobs."
applyTo: "revamp/backend/**"
---
# Backend

- Follow [application boundaries](../../docs/ADR/ADR-0002-application-boundaries.md) and [shared-instance access](../../docs/ADR/ADR-0003-shared-instance-access.md). Enforce authorization and input validation in the backend, including SSR data access.
- Keep domain/application behavior independent of Angular and Azure SDK entities. Define explicit API contracts and stable error codes, not raw exception messages for display.
- Use meaningful names and separate interface files. Respect inherited EditorConfig rules; do not introduce primary constructors against the existing preference.
- Use exact money arithmetic, with the representation/rounding agreed before financial implementation. Post entries and stored balance updates atomically; enforce idempotency and concurrency guarantees in the selected persistence layer.
- Preserve financial audit history with explicit corrections. Storage technology, currency, negative balances, retention, and job catch-up policies remain decisions for their responsible phases, not assumptions to hard-code now.
- Use immutable internal user IDs and UTC timestamps. Apply the validated IANA timezone from Docker ENV `TZ` explicitly for business periods; UI language must not change those periods.
- Make scheduled work durable, retry-safe, and observable. Do not hold database transactions across network/filesystem operations or rely on timers firing exactly once.
- Keep credentials and persistent authentication keys private. Validate configuration/permissions before readiness; log failures without passwords, cookies, or private payloads.
- Review root NuGet configuration inheritance before adding projects; do not make legacy package changes implicitly. Record reproducible backend commands after scaffolding rather than assuming a project/test framework exists.
- Verify user-facing behavior through E2E tests; use focused real-persistence integration tests for rollback, constraints, migrations, concurrency, and controlled job failures. Do not add routine mock/unit suites or coverage quotas.