# ADR-0005 E2E-First Verification

_Creation date_: 2026-10-04

## Context

POCKET MONkEY correctness depends on the interaction of UI, SSR, authentication,
business rules, and persistence. Isolated mock-heavy tests do not provide enough
confidence in the actual user workflows, while some database and scheduling
failures require more deterministic checks than a browser can conveniently express.

## Decision

- Make real-application browser E2E tests the primary acceptance and regression suite, adding meaningful scenarios with each feature.
- Run through actual frontend, backend, authentication, and persistence rather than mocking core services. Include persisted outcomes, permissions, errors, languages, and responsive workflows.
- Use targeted integration tests for transaction rollback/concurrency, constraints, migrations, retries, and controlled time/failure cases where they provide stronger evidence.
- Unit tests are optional exceptions and may be absent entirely. Do not require unit-coverage quotas or duplicate E2E scenarios with routine mock/unit suites.
- Isolate fixtures and session state, use deterministic clocks where necessary, and keep test controls out of production HTTP interfaces.
- Preserve actionable failure diagnostics and repair flaky behavior rather than hiding it. Verify the production artifact used for release.
- Choose the concrete E2E/integration runners and runnable commands when the toolchain is established.