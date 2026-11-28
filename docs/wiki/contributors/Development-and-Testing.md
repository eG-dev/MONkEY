# Development and Testing

This guide focuses on a Windows host using PowerShell. Run commands from the
repository root unless stated otherwise. Use synthetic users and financial data,
and keep development, automated-test and image-review storage separate.

## Choose an Environment

- For source changes, run Angular SSR and the real .NET backend locally with
  watching enabled.
- For manual review of a pending release artifact or a published container, use
  a separate Docker instance and data volume; do not rebuild the candidate.
- For automated acceptance, build the application image and run the browser
  tests against isolated real-image fixtures. A working development server is
  not verification of the release image.

## Prerequisites and Locked Restore

Install Git for Windows, the .NET SDK selected by [global.json](../../../global.json),
and the Node/npm versions pinned in [CI](../../../.github/workflows/ci.yml) and
[web/package.json](../../../web/package.json). Open a new PowerShell terminal after
installation, clone the repository, and change to its root. Check the tools:

```powershell
git --version
dotnet --version
node --version
npm --version
```

For container builds and E2E, use a running Linux amd64 Docker engine, such as
Docker Desktop configured for Linux containers. Docker Compose is needed for
deployment rehearsals. Source-only development does not require Docker.

The workflow checker also needs Bash and `jq`. Git for Windows supplies Bash;
install `jq` separately. If `jq` is not on `PATH`, set `JQ_EXECUTABLE` to its
absolute executable path in PowerShell before running that checker, for example
`$env:JQ_EXECUTABLE = 'C:\tools\jq\jq.exe'` using your actual path.

```powershell
npm --prefix web ci --ignore-scripts
npm --prefix tests/e2e ci --ignore-scripts
dotnet tool restore --configfile NuGet.Config
dotnet restore PocketMonkey.slnx --locked-mode --configfile NuGet.Config
```

Keep committed lockfiles and repository NuGet configuration authoritative. Do not
delete locks, enable arbitrary dependency install scripts or switch to floating
tool versions to make a restore pass. If a corporate network intercepts TLS,
configure its approved CA trust; never disable certificate verification.

## First Local Manager

There are no default credentials. After restoring, create a Manager **before**
starting the development launcher. If the launcher is already running, press
Ctrl+C in its terminal and wait for both processes to stop first. `dotnet run`
builds the backend; on Windows, the running backend can lock its build output.
From the repository root in PowerShell:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:MONKEY_PUBLIC_URL = 'http://127.0.0.1:4180'
$env:MONKEY_DATA_PATH = Join-Path (Get-Location).Path '.local\dev'
dotnet run --project backend/PocketMonkey.Host --no-launch-profile -- bootstrap-manager
```

The command prints the data directory before prompting: confirm it is this
checkout's `.local\dev`. Enter a username and password at the terminal prompts;
passwords are hidden and must have at least 12 characters, uppercase and
lowercase letters, and a digit. Never put passwords in arguments or chat.
Confirm the password and check for `operator_success`. Bootstrap only works
when there are no users. For an existing Manager, stop the launcher and use
`recover-manager` instead; it resets the password and requires a change at login.

These environment variables apply to this PowerShell session, not other
terminals. If using a different web port, set `MONKEY_PUBLIC_URL` above to the
same origin as the launcher. Do not delete the data directory to resolve a
bootstrap error.

## Start Source Development

```powershell
npm --prefix web run dev
```

The launcher starts `dotnet watch` and Angular's SSR development server, prints
the public origin and resolved persistent data directory, and stops both process
trees on Ctrl+C. An unexpected child exit stops the other process too.
Confirm its data directory matches the one used for bootstrap.

Open `http://127.0.0.1:4180` and sign in with the Manager credentials. The backend
listens on loopback port `5180`; development OpenAPI is at
`http://127.0.0.1:5180/openapi/v1.json`. Local data lives in `.local\dev`.

Occupied ports fail startup without terminating another process. Choose unused
ports if needed:

```powershell
npm --prefix web run dev -- --web-port 4182 --backend-port 5182
```

The launcher defaults to German, EUR and Europe/Berlin unless their supported
environment settings override them. Browser language does not change currency or
business periods. This is development mode, not production cookie/TLS validation.

## Build and Run Focused Checks

Stop a running backend before rebuilding its Release output on Windows, where
an executable can remain locked. After restoring dependencies:

```powershell
dotnet build PocketMonkey.slnx --configuration Release -p:RestoreLockedMode=true
npm --prefix web run check:catalogs
npm --prefix web run check:about
npm --prefix web run build
npm --prefix tests/e2e run check
```

Use the relevant repository checks for documentation, migrations or delivery:

```powershell
node scripts/check-docs.mjs
node scripts/check-wiki.mjs
node scripts/verify-migrations.mjs
node scripts/verify-workflows.mjs
```

If the wiki check fails with `safe.bareRepository is 'explicit'`, its local Git
fixtures cannot open their temporary bare repository. In a separate PowerShell
window, run the following from the repository root, then close that window. This
changes Git configuration only for that window and its child processes, not the
global Git configuration:

```powershell
$env:GIT_CONFIG_COUNT = '1'
$env:GIT_CONFIG_KEY_0 = 'safe.bareRepository'
$env:GIT_CONFIG_VALUE_0 = 'all'
node scripts/check-wiki.mjs
```

The solution build includes the test-only RuntimeChecks executable used by
integration scenarios. It is not a production HTTP testing interface. Runtime
checks and browser tooling remain outside the shipped application image. CI
builds RuntimeChecks again on the image job's separate runner before browser
tests, rather than relying on another job's local build output.

## Test the Actual Image

Build through the repository wrapper so build identity and local notice assets
are prepared consistently:

```powershell
npm --prefix web run build:image
npm --prefix tests/e2e exec -- playwright install chromium
npm --prefix tests/e2e run test:smoke
```

On Linux, Playwright also needs its browser system dependencies. Do not treat a
failed browser download as a passing setup or bypass TLS checks to complete it.

The default application image is `pocket-monkey:local`. Fixtures use fresh
containers, volumes and dynamically assigned loopback ports, not your running
development database. They exercise the real Web-BFF, backend, authentication
and persistence. Test HTTPS proxies use isolated test certificates; their
certificate exception is not production deployment guidance.

For a focused file, category or full regression run:

```powershell
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
validation. Repository checks and application builds run in parallel; production
image verification follows only when both succeed. The `full-e2e` PR label
requests full coverage. Pushes to `main`, manual verification, release verification
and image-export runs use the full suite. See the
[E2E-first decision](../../ADR/ADR-0005-e2e-first-verification.md).

Repository administrators must update branch protection or rulesets to require
all three new CI checks: **Repository checks**, **Application builds**, and
**Build and verify app image**. Requiring only the image check is insufficient:
GitHub can mark it skipped when a prerequisite fails. Update the old required
check after the new checks are available; this repository cannot change the
ruleset through the workflow.

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
[isolated-browser procedure](../../development.md#build-and-verify) when reproducing
that setup; keep the server version equal to the locked Playwright version.

Use fixture-scoped cleanup. Do not run broad Docker pruning or remove development
volumes to repair a test. Keep credentials and private financial data out of logs,
screenshots and public issues.

## Review a Pending Release

The [prerelease workflow](../../../.github/workflows/ghcr-prerelease.yml) runs full
verification and exports a `verified-image` Actions artifact before its protected
`release` environment approval. That artifact contains `verified-image.tar.gz`,
image inspection, build metadata, Compose/deployment records, deployment guidance
and `SHA256SUMS`.
The publisher later loads that same image instead of rebuilding it.

This is the appropriate artifact for manual candidate acceptance. Select the
exact repository, workflow run and source revision, verify checksums and loaded
image identity, and preserve that evidence when approving publication. Do not
substitute a source rebuild or a floating registry tag. Export artifacts expire
after seven days and are accessible to users with repository Actions-artifact
access; unpublished does not mean private.

Follow the [candidate review guidance](../maintainers/Builds-and-Releases.md#review-before-approval)
for the exact run and attempt. Review the image and draft notes before approving
that same run's protected publishing job. Neither replaces automated verification
or proves real-host production readiness.