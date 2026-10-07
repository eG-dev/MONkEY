---
description: "Use when writing replacement browser E2E or .NET integration tests: real-stack coverage, fixture isolation, deterministic time, security checks, and failure diagnostics."
applyTo: "revamp/tests/e2e/**,revamp/tests/integration/**"
---
# Tests

- Follow [E2E-first verification](../../docs/ADR/ADR-0005-e2e-first-verification.md) and the [testing plan](../../plans/migration/testing.md). Browser E2E tests are the main acceptance/regression suite; unit tests may be absent entirely.
- Exercise real SSR, Web-BFF, backend, authentication, and persistence. Do not mock core services in the main E2E suite or replace login coverage entirely with preloaded browser state.
- Isolate mutable data/session state per test or worker, using separate instances/data roots where required. Avoid execution-order dependencies and arbitrary sleeps.
- Prefer accessible role/label locators; use stable test IDs where needed, not Taiga implementation selectors. Assert persisted results and meaningful user outcomes.
- Keep browser test cases beneath `revamp/tests/e2e/specs/`; configuration and shared fixtures/helpers live outside that folder. Include nested specs in TypeScript checks.
- Keep C# runtime probe implementations beneath `revamp/tests/integration/RuntimeChecks/Tests/`, with namespaces matching the folder. Leave only command dispatch in `Program.cs` and keep project/configuration files at the project root.
- Separate Arrange, Act, and Assert phases with blank lines. Multi-stage browser/lifecycle workflows may repeat action/assertion groups; do not force them into one oversized Act block or add comments that merely label obvious steps.
- Cover manager/member behavior, direct API denials and CSRF attempts, invalid inputs, failure recovery, German/English workflows, and relevant desktop/mobile layouts.
- Use focused integration checks for actual persistence rollback, constraints, concurrency, migrations, job retries, and deterministic period boundaries. Do not substitute mocked repositories for those guarantees.
- Provision fixtures and control clocks/failures through isolated test-host composition or protected operator tooling, never production-accessible test backdoors.
- Attach traces/screenshots and relevant logs to failures without exposing credentials or private data. Diagnose flaky tests rather than hiding them with unconditional retries.
- Playwright is the selected browser runner. Follow the [foundation guide](../../revamp/README.md) for locked installs, the solution build/test-only runtime probe, image build, and checks against the actual production artifact.
- Fixtures use their own containers/volumes and dynamically published loopback ports. Rediscover ports after Docker restart; do not assume an automatically assigned port is stable.