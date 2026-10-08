# E2E-first testing foundation

Status: local foundation suite implemented and verified; GitHub-hosted acceptance
remains open after a browser network-change failure. The latest 56-case regression
passed locally with CI scheduling; the hosted rerun is pending. See [ADR-0007](../../docs/ADR/ADR-0007-application-foundation.md)
and the [foundation guide](../../revamp/README.md). Extend with each feature.

## Strategy

Browser end-to-end tests are the primary application verification, not a small
smoke suite on top of a unit-test pyramid. Use Playwright as the proposed runner
and add meaningful E2E scenarios with every feature slice. Playwright is selected
and verified against the real image. Unit tests are optional
exceptions and may be absent entirely; do not introduce a mandatory unit-coverage
percentage or tests that merely duplicate E2E coverage.

- Run against real Angular SSR, Web-BFF, .NET, and SQLite. Use a disposable application instance and data volume; do not mock core APIs, authentication, business logic, or persistence in the main E2E suite.
- Provision deterministic fixtures through an operator/test-runner mechanism that is not exposed as a production HTTP endpoint. Keep real login tests even if other scenarios reuse saved authenticated browser state.
- Isolate data and authentication state per test/worker. Parallel workers need separate application instances/data roots or equivalent proven isolation; do not share a mutable SQLite fixture database accidentally.
- Use one worker in CI to avoid parallel Docker fixture network-interface churn interrupting native Linux Chromium asset requests (`ERR_NETWORK_CHANGED`). Local runs retain two workers; explicit concurrent-request cases remain enabled, and retries remain zero.
- Use accessible role/label locators or stable test IDs when necessary; avoid selectors coupled to Taiga internals, arbitrary sleeps, and order-dependent scenarios.
- Test meaningful user outcomes and persisted results, including reloads, validation/error states, manager/member behavior, and German/English workflows.
- Use Playwright's HTTP client against the running system for direct authorization/CSRF denial checks where the UI cannot express an attack. UI hiding alone is not proof of security.
- Add targeted integration tests only where they provide stronger, more deterministic evidence: actual SQLite rollback/concurrency/constraints, migration behavior, job idempotency, and controlled clock/failure scenarios. Avoid mocked repository tests as substitutes for real behavior.
- Introduce clock control and failure injection only through isolated test-host composition or protected host tooling; production must not expose arbitrary time-changing or failure-injection endpoints.
- Begin with Chromium desktop/mobile viewport coverage and both supported languages. Validate a broader Firefox/WebKit matrix on scheduled/release runs where supported; do not claim untested browser compatibility.
- Run the growing core E2E suite on pull requests and the full regression/container lifecycle suite before release. Keep fixtures and runtime efficient rather than disabling important tests to shorten CI.
- Preserve Playwright traces/screenshots and application logs on failure, with private data/credentials handled safely. Do not hide flakes with unconditional retries; investigate and repair nondeterminism.
- Document one reproducible local E2E command and the CI commands once scaffolding exists. Test dependencies belong in the development/test runner, not the production image.
- Run these checks in [GitHub Actions](builds-releases.md) and use the release suite as a publishing gate for GitHub Releases. Validate the same production image that is published, rather than a separately rebuilt application.

## Delivery sequence

Milestone 1 establishes the runner, fixtures, and shell/SSR/storage scenarios.
Milestone 2 adds real authentication and permission scenarios; milestone 3 grows
the suite slice by slice. Container restart, backup/restore, and upgrade scenarios
are automated as the corresponding operational features become available.

## Foundation acceptance gate

- [ ] A reproducible Playwright suite runs against the real stack locally and in CI without requiring unit tests.
- [x] E2E fixtures are isolated, reproducible, and unavailable as production backdoors; failed runs produce useful diagnostics.
- [x] SSR HTML is checked independently of browser JavaScript execution.
- [x] Smoke checks pass on desktop and mobile-sized viewports.