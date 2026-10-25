# E2E-first testing foundation

Status: local foundation suite implemented and verified. On 2026-10-10, the user
confirmed that all tests pass in GitHub Actions; hosted test execution is no
longer pending for that earlier run. A subsequent supplied run passed 56 of 57
cases but exposed an image-load assertion race. On 2026-10-12, the user confirmed
that all tests pass in GitHub Actions again, closing the pending hosted rerun.
No run URL or exact case count was supplied for this confirmation. Fork-specific
verification, publishing rehearsal, and real-host deployment remain separate
gates. See [ADR-0007](../../docs/ADR/ADR-0007-application-foundation.md)
and the [foundation guide](../../revamp/README.md). Extend with each feature.

## Latest Hosted Verification, 2026-10-25

The user confirmed that the latest GitHub Actions run, including E2E tests,
passed successfully. This records the hosted-rerun confirmation following the
cross-platform notice-evidence hash fix. No run URL, commit SHA or exact test
count was supplied; the result is user-reported, not independently inspected.

This confirmation does not approve the draft portable financial export/recovery
design or verify its unimplemented behavior. Operational rehearsal,
deployment-specific review and artifact-publication gates remain separate.
Earlier local-only records below retain their historical scope.

## Allowance execution acceptance

On 2026-10-12, the final allowance acceptance set passed all **17 checks** locally
against the current production Linux image, using one worker and zero retries.
It covers configuration API/SQLite and desktop/mobile workflows, durable worker
startup recovery after forced process termination, automatic periodic retry after
an atomic posting failure, Member API redaction and browser visibility, catch-up
periods, business-timezone history dates, opening workflows, and existing SSR/
hydration checks. German/English catalogs and E2E TypeScript checks passed
separately. The [Step 3F delivery record](03f-allowance-execution.md#delivery-evidence)
contains the reproducible command and exact fixture/recovery scope.

This result is scoped local acceptance, not a full release-suite run or a new
GitHub Actions success confirmation. Hosted verification for this revision and
the operational/publication gates remain open; earlier hosted results above
retain their original scope.

## Image loading regression

[GitHub run 38083728753](https://github.com/eG-dev/MONkEY/actions/runs/38083728753)
passed 56 of 57 cases. The desktop image workflow read `naturalWidth` as zero
immediately after the image element became visible. Visibility does not prove
that the image has loaded; the assertion now polls for the expected 512-pixel
width, matching the existing replacement-image check. A permanently broken
image still fails the assertion; no sleeps or unconditional retries were added.

Both desktop and mobile image workflows passed locally against the production
image with `npm --prefix revamp/tests/e2e test -- accounts/images-workflows.spec.ts`.
The readability pass restores setup/action/assertion clusters with whitespace-only
changes elsewhere in specs/helpers. The full suite was not run for this change.
On 2026-10-12, the user confirmed the subsequent GitHub Actions tests all passed.

## Strategy

On 2026-10-10, the categorized suite passed all 60 production-image cases locally
with two workers and zero retries (`npm --prefix revamp/tests/e2e test` from the
repository root). Specs are split across 22 files in five category folders.
Workflows run in English, retaining EUR/USD and desktop/mobile coverage plus
one German first-render/hydration check. This local result does not close hosted
CI or release gates.

Currency coverage was narrowed on 2026-10-10: core workflows use EUR, with one
desktop USD setting/rendering check and the existing display-unit-change
persistence check. All 11 other ledger checks passed in the category run; the
focused USD check passed after correcting its SSR whitespace assertion.

Browser end-to-end tests are the primary application verification, not a small
smoke suite on top of a unit-test pyramid. Use Playwright as the proposed runner
and add meaningful E2E scenarios with every feature slice. Playwright is selected
and verified against the real image. Unit tests are optional
exceptions and may be absent entirely; do not introduce a mandatory unit-coverage
percentage or tests that merely duplicate E2E coverage.

- Run against real Angular SSR, Web-BFF, .NET, and SQLite. Use a disposable application instance and data volume; do not mock core APIs, authentication, business logic, or persistence in the main E2E suite.
- Provision deterministic fixtures through an operator/test-runner mechanism that is not exposed as a production HTTP endpoint. Keep real login tests even if other scenarios reuse saved authenticated browser state.
- Isolate data and authentication state per test/worker. Parallel workers need separate application instances/data roots or equivalent proven isolation; do not share a mutable SQLite fixture database accidentally.
- Run the CI browser in an isolated Playwright `run-server` container with loopback exposed through the test runner, so parallel Docker fixture network-interface churn cannot interrupt native Linux Chromium requests (`ERR_NETWORK_CHANGED`). CI then uses two workers like local runs (one worker only without a connect endpoint); explicit concurrent-request cases remain enabled, and retries remain zero.
- Select elements as decided in [ADR-0005](../../docs/ADR/ADR-0005-e2e-first-verification.md#browser-selectors): document-unique `<scope>-<purpose>` IDs, row-scoped `data-testid` values, and role/label locators as fallback, with explicit accessible-name and localized-text assertions. Avoid selectors coupled to Taiga internals, arbitrary sleeps, and order-dependent scenarios.
- Test meaningful user outcomes and persisted results in English, including reloads, validation/error states, and manager/member behavior. Keep only the focused desktop German first-render/hydration exception defined in [ADR-0005](../../docs/ADR/ADR-0005-e2e-first-verification.md); verify other localization behavior separately through Transloco/catalog checks and focused localization review, not duplicated E2E workflows.
- Use EUR for core workflows rather than duplicating them for USD. Verify the USD setting in one desktop API/SSR/browser check, retain targeted display-unit-change persistence coverage and unsupported-currency startup validation, following [ADR-0011](../../docs/ADR/ADR-0011-currency-display-unit.md).
- Organize specs under category folders with focused workflow, API, persistence, or recovery files and shared helpers outside `specs/`. Discover and typecheck nested specs; category filters must retain the intended HTTPS fixtures and desktop/mobile coverage.
- Use Playwright's HTTP client against the running system for direct authorization/CSRF denial checks where the UI cannot express an attack. UI hiding alone is not proof of security.
- Add targeted integration tests only where they provide stronger, more deterministic evidence: actual SQLite rollback/concurrency/constraints, migration behavior, job idempotency, and controlled clock/failure scenarios. Avoid mocked repository tests as substitutes for real behavior.
- Introduce clock control and failure injection only through isolated test-host composition or protected host tooling; production must not expose arbitrary time-changing or failure-injection endpoints.
- Begin with Chromium desktop/mobile viewport coverage in English. Validate a broader Firefox/WebKit matrix on scheduled/release runs where supported; do not claim untested browser compatibility.
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

- [x] A reproducible Playwright suite runs against the real stack locally and in CI without requiring unit tests; GitHub Actions success confirmed by the user on 2026-10-10.
- [x] E2E fixtures are isolated, reproducible, and unavailable as production backdoors; failed runs produce useful diagnostics.
- [x] SSR HTML is checked independently of browser JavaScript execution.
- [x] Smoke checks pass on desktop and mobile-sized viewports.