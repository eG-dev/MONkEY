# Development and Testing

Run commands from the repository root unless stated otherwise. Use synthetic
users and financial data, and keep development, automated-test and image-review
storage separate.

## Choose an Environment

- For source changes, use local development or
  [Codespaces Development](Codespaces-Development.md). Both run Angular SSR and
  the real .NET backend with watching enabled.
- For manual review of a pending release artifact or a published container, use
  [Codespaces Image Testing](Codespaces-Image-Testing.md). This does not build
  source and uses separate persistent Docker data.
- For automated acceptance, build the application image and run the browser
  tests against isolated real-image fixtures. A working development server is
  not verification of the release image.

The Codespaces profiles remain experimental; their guides distinguish local
tooling checks from unverified cloud forwarding, sign-in and persistence.

## Prerequisites and Locked Restore

Use the SDK selected by [global.json](../../global.json), the Node/npm versions
pinned in [CI](../../.github/workflows/ci.yml) and
[web/package.json](../../web/package.json), and a supported Linux amd64 Docker
engine for container builds and E2E. Docker Compose is needed for deployment
rehearsals. Source-only development does not require Docker.

Bash and `jq` are required for the workflow and Codespaces script checks. Git
Bash can supply Bash on Windows. If `jq` is not on `PATH`, the workflow checker
accepts an absolute executable path through `JQ_EXECUTABLE`.

```sh
npm --prefix web ci --ignore-scripts
npm --prefix tests/e2e ci --ignore-scripts
dotnet tool restore --configfile NuGet.Config
dotnet restore PocketMonkey.slnx --locked-mode --configfile NuGet.Config
```

Keep committed lockfiles and repository NuGet configuration authoritative. Do not
delete locks, enable arbitrary dependency install scripts or switch to floating
tool versions to make a restore pass. If a corporate network intercepts TLS,
configure its approved CA trust; never disable certificate verification.

## Start Source Development

```sh
npm --prefix web run dev
```

The launcher starts `dotnet watch` and Angular's SSR development server, prints
the public origin and resolved persistent data directory, and stops both process
trees on Ctrl+C. An unexpected child exit stops the other process too.

Locally, open `http://127.0.0.1:4180`. The backend listens on loopback port `5180`;
development OpenAPI is at `http://127.0.0.1:5180/openapi/v1.json`. Local data lives
in `.local/dev`. In Codespaces, use the private forwarded HTTPS address and the
separate `.local/codespaces/development` directory described in its guide.

Occupied ports fail startup without terminating another process. Choose unused
ports if needed:

```sh
npm --prefix web run dev -- --web-port 4182 --backend-port 5182
```

The launcher defaults to German, EUR and Europe/Berlin unless their supported
environment settings override them. Browser language does not change currency or
business periods. This is development mode, not production cookie/TLS validation.

### First Local Manager

There are no default credentials. While the local launcher is running, use
another terminal with its exact data directory. For local Bash:

```sh
ASPNETCORE_ENVIRONMENT=Development MONKEY_PUBLIC_URL=http://127.0.0.1:4180 MONKEY_DATA_PATH="$PWD/.local/dev" dotnet run --project backend/PocketMonkey.Host --no-launch-profile -- bootstrap-manager
```

For local PowerShell:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:MONKEY_PUBLIC_URL = 'http://127.0.0.1:4180'
$env:MONKEY_DATA_PATH = Join-Path (Get-Location).Path '.local/dev'
dotnet run --project backend/PocketMonkey.Host --no-launch-profile -- bootstrap-manager
```

Check the printed data directory against the launcher's output before entering
credentials, and match its public origin if you chose another port. The second
terminal does not inherit environment settings from the launcher's child processes.
Enter passwords at the hidden terminal prompts, never as arguments
or in chat. Bootstrap only works with no users; use `recover-manager` for an
existing Manager. Codespaces uses its own directory and
[bootstrap command](Codespaces-Development.md#first-manager).

## Build and Run Focused Checks

Stop a running backend before rebuilding its Release output on Windows, where
an executable can remain locked. After restoring dependencies:

```sh
dotnet build PocketMonkey.slnx --configuration Release -p:RestoreLockedMode=true
npm --prefix web run check:catalogs
npm --prefix web run check:about
npm --prefix web run build
npm --prefix tests/e2e run check
```

Use the relevant repository checks for documentation, migrations, delivery or
Codespaces changes:

```sh
node scripts/check-docs.mjs
node scripts/check-wiki.mjs
node scripts/verify-migrations.mjs
node scripts/verify-workflows.mjs
node scripts/check-codespaces.mjs
```

The solution build includes the test-only RuntimeChecks executable used by
integration scenarios. It is not a production HTTP testing interface. Runtime
checks and browser tooling remain outside the shipped application image.

## Test the Actual Image

Build through the repository wrapper so build identity and local notice assets
are prepared consistently:

```sh
npm --prefix web run build:image
npm --prefix tests/e2e exec -- playwright install chromium
npm --prefix tests/e2e run test:smoke
```

On Linux, Playwright also needs its browser system dependencies; the development
Codespace installs them during setup. Do not treat a failed browser download as a
passing setup or bypass TLS checks to complete it.

The default application image is `pocket-monkey:local`. Fixtures use fresh
containers, volumes and dynamically assigned loopback ports, not your running
development database. They exercise the real Web-BFF, backend, authentication
and persistence. Test HTTPS proxies use isolated test certificates; their
certificate exception is not production deployment guidance.

For a focused file, category or full regression run:

```sh
npm --prefix tests/e2e test -- ledger/opening-workflows.spec.ts
npm --prefix tests/e2e test -- accounts/
npm --prefix tests/e2e test
```

Choose checks for the changed behavior and report what actually ran. The smoke
suite is a bounded desktop subset, not equivalent to the full suite. Runtime or
schema changes may also need the corresponding persistence, recovery or
controlled-time integration scenarios.

### Coverage and CI Gates

Real-application browser E2E is the main acceptance suite. Targeted integration
checks cover risks such as rollback, concurrency, migrations and scheduling when
they provide stronger evidence. Routine mock-heavy unit suites and unit-coverage
quotas are not required.

Application workflows run in English with EUR. There is one focused German
SSR/hydration check and separate USD verification, not duplicate business suites
for each language or currency. Catalog checks and focused localization/layout
review remain necessary.

PRs run the bounded smoke suite plus builds, audits, type checks and catalog
validation. The `full-e2e` PR label requests full coverage. Pushes to `main`,
manual verification, release verification and image-export runs use the full
suite. See the [E2E-first decision](../ADR/ADR-0005-e2e-first-verification.md).

## Investigate Failures

Reports are under `tests/e2e/playwright-report/`; screenshots, retained failure
traces and fixture diagnostics are under `tests/e2e/test-results/`. These paths
are ignored by Git. CI uploads diagnostics as `test-results` with seven-day
retention. Review them before rerunning or changing the test.

Retries are zero. Do not hide a failure with retries, arbitrary delays or mocked
core services. Use stable IDs for unique controls and scoped `data-testid`
selectors for repeated items, while keeping accessibility assertions. Wait for
enabled controls and completed navigation rather than assuming hydration is done.

On native Linux, concurrent fixture networking can cause a host browser's
`ERR_NETWORK_CHANGED`. CI isolates Chromium in a pinned Playwright browser-server
container and connects through `PW_TEST_CONNECT_WS_ENDPOINT` with
`PW_TEST_CONNECT_EXPOSE_NETWORK=<loopback>`. Follow the
[isolated-browser procedure](../development.md#build-and-verify) when reproducing
that setup; keep the server version equal to the locked Playwright version.

Use fixture-scoped cleanup. Do not run broad Docker pruning or remove development
volumes to repair a test. Keep credentials and private financial data out of logs,
screenshots and public issues.

## Review a Pending Release

The [prerelease workflow](../../.github/workflows/ghcr-prerelease.yml) runs full
verification and exports a `verified-image` Actions artifact before its protected
`release` environment approval. That artifact contains `verified-image.tar.gz`,
image inspection, build metadata, Compose/deployment records and `SHA256SUMS`.
The publisher later loads that same image instead of rebuilding it.

This is the appropriate artifact for manual candidate acceptance. Select the
exact repository, workflow run and source revision, verify checksums and loaded
image identity, and preserve that evidence when approving publication. Do not
substitute a source rebuild or a floating registry tag. Export artifacts expire
after seven days and are accessible to users with repository Actions-artifact
access; unpublished does not mean private.

Use the image-testing profile's
[candidate command](Codespaces-Image-Testing.md#review-a-pending-release) with the
run ID and full expected source SHA. It verifies the current successful attempt
and artifact, loads the saved image and starts it with registry pulls disabled.
This is separate from full-stack source development and does not approve or
publish anything. Review the image and draft notes before approving that same
run's protected publishing job. Neither replaces automated verification or proves
real-host production readiness.