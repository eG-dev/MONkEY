# E2E-First Testing

Status: the current reduced suite passed **87 production-image cases locally in
11.8 minutes**, with two workers and zero retries. E2E TypeScript, guardrails and
whitespace checks passed. Current hosted release verification remains open;
earlier hosted success does not certify a newer revision or production readiness.

## Strategy

Follow [ADR-0005](../../docs/ADR/ADR-0005-e2e-first-verification.md).
Browser E2E is the primary application verification. No routine unit-test suite
or coverage quota is required. Use targeted real-SQLite/runtime probes where
they give stronger evidence for rollback, concurrency, migrations, controlled
time, native files or job/recovery behavior.

- Exercise real Angular SSR, Web-BFF, .NET, authorization, SQLite and jobs; do not mock core services.
- Isolate containers, volumes, users and financial state per scenario/worker. Shared synthetic fixtures never replace real UI/API creation tests.
- Cover Manager/Member workflows and direct authorization/CSRF denials, forged identity, session revocation and concurrent SSR isolation.
- Preserve exact-money, signed-boundary, idempotency, history-pagination, retention, rollback and concurrent posting checks.
- Preserve allowance restart/catch-up/retry, private-image validation, financial recovery, offline runtime, DST and process-lifecycle checks.
- Test meaningful responsive layouts rather than repeating request-only/persistence checks for each viewport.
- Run workflows in English and EUR, with the focused desktop German SSR/hydration check and USD display-unit checks. Validate German completeness/layout separately, not by duplicating every workflow.
- Use stable IDs/row test IDs and accessible names; wait for actual navigation/image readiness. No arbitrary sleeps or unconditional retries.
- Retain traces, screenshots and bounded application logs on failure without secrets or private financial payloads.

## CI Verification Tiers

- Every PR, including dependency updates: locked builds, audits, translation/type/About-input checks, workflow/EF safety checks and `npm --prefix tests/e2e run test:smoke`. Documentation validation runs for Markdown/tooling changes or file deletions.
- Smoke contains six existing desktop cases covering SSR, authentication/user administration and financial posting/history; it is not a separate mocked suite.
- `main`, manual runs, releases and image export: `npm --prefix tests/e2e test` runs the full regression/container-lifecycle suite.
- The `full-e2e` PR label selects full regression before merge for high-risk changes; keep its result read-only and fork-safe.
- CI isolates Chromium in a Playwright server container to avoid host veth churn. Two workers are supported; the configuration falls back to one on CI without the isolated endpoint.
- A passing smoke run is not full regression or release verification. Publish the tested image, not a separately rebuilt artifact.

## Focused Viewport Coverage

The suite discovers **68 desktop and 19 mobile executions**, reduced from 95
without removing distinct financial/security behavior. The six-case PR smoke
selection is unchanged.

- Request-only assets/English SSR, backend outage and disposable scenario recovery run on desktop only.
- Interrupted allowance-worker recovery and active/disabled periodic retries run on desktop. Mobile retains active-failure layout and role visibility without repeating the retry timer.
- Public About uses Angular, .NET, SQLite and tslib as representative simple, long-document, grouped/public-domain and copyright entries on both viewports. Keep keyboard, state, original-text and layout checks; the offline-image test hashes every shipped original.
- Authenticated About focuses on role/drawer entry, focus/navigation and forced-password form preservation rather than repeating deep document checks.
- The full password flow runs as Manager on desktop and Member on mobile, not the complete role-by-viewport matrix.
- `@desktop` and `@mobile` select intentional viewport coverage; `@api` avoids duplicating direct integration checks on mobile. No behavior may silently disappear from all projects.

## Reproduce

From the repository root, follow the
[build and verification guide](../../docs/development.md#build-and-verify)
to install locked tooling, build Release runtime probes and prepare the image.

```text
npm --prefix tests/e2e run check
npm --prefix tests/e2e run test:smoke
npm --prefix tests/e2e test
node scripts/verify-workflows.mjs
node scripts/verify-migrations.mjs
node scripts/check-docs.mjs
```

Test dependencies belong in the runner, not the production image. Use narrow
spec/category runs during development, then the required full release gate.
Record what actually ran and investigate failures instead of masking them.

## Runtime Acceptance Gate

- [x] Real-stack browser/API/runtime probes and isolated disposable fixtures are implemented.
- [x] SSR HTML, hydration, local assets, desktop/mobile workflows and focused German/English behavior have local coverage.
- [x] Financial, authorization, concurrency, recovery and container risks remain covered in the reduced local suite.
- [ ] The current release revision passes full hosted verification.
- [ ] Fork verification and real-host deployment/recovery are independently demonstrated; follow [operations](04-operations-cutover.md#release-gate).