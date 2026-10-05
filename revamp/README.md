# POCKET MONkEY Foundation

The first build/run/storage slice is implemented. This is a read-only foundation
demonstration, not a production-ready application. Authentication, accounts,
transactions, reports, and user administration have not been implemented.
Use the independent [solution](PocketMonkey.slnx); the legacy solution is unchanged
by this work. Follow [ADR-0007](../docs/ADR/ADR-0007-application-foundation.md).

## Verified Stack

| Component | Verified version |
| --- | --- |
| .NET SDK / runtime / EF Core | 10.0.401 / 10.0.12 / 10.0.12 |
| Node / Angular SSR | 24.21.0 / 22.2.1 |
| Taiga / universal Web APIs | 5.26.0 / 5.4.0 |
| Transloco / MessageFormat integration | 8.4.0 / 8.4.0 |
| Lucide static font | 1.52.0 |
| Playwright | 1.63.0 |
| Container platform | Linux x86-64 only |

Patch versions are locked in the manifests/lockfiles. The ICU compiler uses
CommonJS and adds approximately 77 KB to the initial browser bundle; the explicit
initial budget is 650 KB warning / 800 KB error. No runtime CDN is used.
No ARM, Firefox, or WebKit compatibility claim is made yet.

Application styles use SCSS, while the vendor Taiga theme retains its Less import.
The PNG favicon in `web/public/` is bundled locally.

## Build and Verify

From the repository root, enter `revamp/`. Node 24, .NET SDK 10.0.401, and Docker
with a Linux engine are required. These commands work in PowerShell and CI shell:

Stop a running local backend preview before rebuilding its Release output on
Windows, where the executable remains locked while the process is running.

```text
dotnet build PocketMonkey.slnx --configuration Release -p:RestoreLockedMode=true
npm --prefix web ci --ignore-scripts
npm --prefix tests/e2e ci --ignore-scripts
npm --prefix web run check:catalogs
npm --prefix web run build
npm --prefix tests/e2e run check
node ../plans/migration/verify-guardrails.mjs
docker build --file deploy/Dockerfile --tag pocket-monkey:foundation .
npm --prefix tests/e2e exec -- playwright install chromium
npm --prefix tests/e2e test
```

On Linux CI, use `playwright install --with-deps chromium`. On a corporate network
whose CA is trusted by Windows, `NODE_USE_SYSTEM_CA=1` allows Node downloads to use
that trust store; never disable certificate verification to download a browser.

The solution build includes the test-only `RuntimeChecks` probe. E2E fixtures use
fresh named volumes/containers and dynamically published loopback ports per test;
they rediscover ports after Docker restart. Tests clean up only their own state.
Reports, screenshots, traces, and failure logs are beneath
`tests/e2e/playwright-report/` and `tests/e2e/test-results/`, both ignored by Git.
No core API/authentication/storage mocks or unit-coverage requirement are used.

Browser cases live in `tests/e2e/specs/`; Playwright configuration and shared
fixtures remain at the E2E project root. Test phases are separated into readable
setup/action/assertion groups.

## Local Development

With Node 24 and .NET SDK 10.0.401 installed, run these commands from the repository
root. Install web dependencies once after checkout or when the lockfile changes:

```text
npm --prefix revamp/web ci --ignore-scripts
npm --prefix revamp/web run dev
```

The launcher starts `dotnet watch` and Angular's SSR development server together.
It builds automatically, enables hot reload/watch mode, uses the real Web-BFF and
backend, and keeps state under `revamp/.local/dev/`. Docker and browser-test tooling
are not required. Open http://127.0.0.1:4180; backend OpenAPI is available directly
at http://127.0.0.1:5180/openapi/v1.json. Ctrl+C stops both process trees. A child
exiting also stops the other process. Windows may report a nonzero cancellation
status after Ctrl+C.

The launcher sets development mode, empty trusted proxies, and a loopback public
origin for both applications. `TZ` is inherited if set, otherwise Europe/Berlin.
This is a local development environment, not production authentication.

Occupied ports fail startup without stopping existing processes. Stop an earlier
preview first, or choose free ports:

```text
npm --prefix revamp/web run dev -- --web-port 4182 --backend-port 5182
```

An editor task can call the same npm command; startup configuration belongs in the
launcher rather than being duplicated in editor-specific tasks.

### Manual Built Preview

For a preview without watchers, build first and use two PowerShell terminals,
each with `revamp/` as its working directory. Choose free ports if needed.

Backend:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:MONKEY_DATA_PATH = Join-Path $PWD.Path '.local/dev'
$env:MONKEY_PUBLIC_URL = 'http://127.0.0.1:4180'
$env:TZ = 'Europe/Berlin'
dotnet run --no-build --configuration Release --project backend/PocketMonkey.Api --urls http://127.0.0.1:5180
```

Web-BFF/SSR:

```powershell
$env:NODE_ENV = 'development'
$env:MONKEY_BACKEND_URL = 'http://127.0.0.1:5180'
$env:MONKEY_PUBLIC_URL = 'http://127.0.0.1:4180'
$env:PORT = '4180'
$env:TZ = 'Europe/Berlin'
node web/dist/web/server/server.mjs
```

Open http://127.0.0.1:4180. Ctrl+C stops each process. The harmless sample UUID,
UTC initialization timestamp, file, and persistent keys live under `.local/dev/`.
Backend OpenAPI is available at http://127.0.0.1:5180/openapi/v1.json in development
only. The public Web-BFF does not forward it.

## Docker Preview

For a local read-only demonstration, reserve a loopback port and create an isolated
volume. HTTPS is not supplied by this command; the configured HTTPS origin is an
example for the future host/reverse proxy, not a claim that TLS has been installed.

```text
docker volume create pocket-monkey-preview-data
docker run --detach --name pocket-monkey-preview --publish 127.0.0.1:4181:8080 --env MONKEY_PUBLIC_URL=https://localhost --env TZ=Europe/Berlin --mount type=volume,source=pocket-monkey-preview-data,target=/data pocket-monkey:foundation
docker stop --timeout 25 pocket-monkey-preview
docker start pocket-monkey-preview
```

When running, open http://127.0.0.1:4181. Use a different name/port rather than
replacing an existing container. Remove the container with `docker rm`; the named
volume retains state. Removing that volume is a separate, destructive operator
decision. The [Compose example](deploy/compose.yaml) requires the actual HTTPS
origin and publishes to loopback for a host reverse proxy.

Runtime is UID/GID 10001. Named volumes receive the image's private directory
ownership. For host bind mounts, provision the directory for UID/GID 10001 with
mode 0700 before launch. Existing public or read-only storage fails startup;
the application does not silently change existing permissions or ownership.
The database, image directory, and keys must be backed up consistently together.
Data Protection keys are not encrypted at rest: protect host storage/backups and
do not publish them. No credentials are stored in ordinary application ENV values.

## Verification Record

Verified locally on 2026-10-04 with Windows development tooling and a Linux x86-64
Docker engine:

- Locked backend solution, Angular SSR, and production container builds.
- Real browser desktop/mobile hydration, language switching, request isolation, accessible controls, local fonts, and persistent sample/file behavior.
- Restart/replacement persistence, key-directory privacy, bounded clean shutdown, and failed-container exit after either child crashes.
- Invalid configuration, read-only/public data volumes, fully offline runtime assets, no production SDK/npm/browser-test executables, and non-default path/language/log settings.
- Node/.NET agreement at both Berlin DST transitions, with English/German globalization in the actual runtime image.
- Catalog key/placeholder/ICU validation, negative fixtures, instruction/workflow scopes, local links, and Mermaid syntax.
- Legacy WebApp builds using existing restore assets. Legacy Functions also builds, but its generated worker-extension restore needs a command-only public-source override on this machine: `dotnet build ../Functions/Functions.csproj --no-restore -p:RestoreSources=https://api.nuget.org/v3/index.json`.

On 2026-10-05, the Node 24.21.0 update passed the production image build, runtime
version check, all 20 desktop/mobile and lifecycle tests, and repository guardrails.
The CI runner is now configured as Ubuntu 26.04; execution on that GitHub-hosted
runner has not been verified locally.

The [foundation workflow](../.github/workflows/revamp-foundation.yml) defines locked,
read-only PR verification with pinned official actions. Its optional manual export
produces a tested image archive/checksums without registry or GitHub Release
publishing. Azure triggers exclude replacement-only changes; mixed commits with
legacy/shared runtime changes still trigger the appropriate existing deployments.

## Remaining Gates

- Execute GitHub-hosted CI and a fork PR; local YAML/action metadata checks are not a hosted run.
- Run the export workflow and complete a publishing rehearsal/foundation prerelease to the selected public registry, [GHCR](../docs/ADR/ADR-0006-github-delivery.md), after agreeing on the owner/image namespace, version/tag, approval, and release policies. Verify anonymous pulls; no image/tag/release has been published.
- Confirm the real Docker host architecture, storage mount, and HTTPS/reverse-proxy configuration before production or authentication rollout.
- Preview Mermaid rendering on GitHub. Syntax has been checked locally.
- Restrict/remove harmless foundation diagnostics before production release; they are not a business authorization model.

Complete the remaining [milestone 1 gates](../plans/migration/01-stack-foundation.md#acceptance-gate)
before beginning authentication, then deliver business UI/rules in milestone 3.