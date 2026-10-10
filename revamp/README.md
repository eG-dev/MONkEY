# POCKET MONkEY Foundation, Authentication, Accounts, Images, and Ledger

The build/run/storage foundation, local authentication, manager user
administration, shared accounts and private account images, signed opening balances, deposits/withdrawals,
and paginated history are implemented. This is not a production-ready application.
Dedicated reversals are deferred. Allowances and reports have
not been implemented.

Monthly reports are deferred from the first release; no report snapshots or jobs
are required. The approved [step 2B](../plans/migration/02b-ux-ui-design.md)
shell, design tokens, and view designs from [docs/design](../docs/design/README.md)
are implemented on the existing screens: sign-in, overview, account management,
account details, profile, and user administration. The representative design was
accepted on 2026-10-10; existing delivery records remain intact. Subsequent slices
reuse the established patterns and resolve their own policy prerequisites.
[Operations and cutover](../plans/migration/04-operations-cutover.md) is milestone 4
and requires application-wide design acceptance as well as the existing
security, verification, and operational gates.

Use the independent [solution](PocketMonkey.slnx); the legacy solution is unchanged
by this work. Follow [ADR-0007](../docs/ADR/ADR-0007-application-foundation.md).
Authentication follows [ADR-0008](../docs/ADR/ADR-0008-local-authentication.md).
Accounts follow [ADR-0009](../docs/ADR/ADR-0009-shared-accounts.md).
Opening balances follow [ADR-0010](../docs/ADR/ADR-0010-ledger-and-money.md),
with the display currency policy in [ADR-0011](../docs/ADR/ADR-0011-currency-display-unit.md).
Signed openings, overdrafts, manual transactions, and history follow
[ADR-0012](../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md).
Private images follow [ADR-0014](../docs/ADR/ADR-0014-private-account-images.md).

## Private Account Images

Managers upload, replace, and remove PNG/JPEG/WebP images from account details.
Both dimensions must be at most 512 pixels; uploads must not exceed 2,097,152
bytes (2 MiB). Oversized images are rejected, not cropped or resized. The backend
decodes actual content and writes a fresh metadata-free PNG using SkiaSharp
4.153.1 and its Linux native assets. Members have read-only access; missing or
unavailable images fall back to the account name's first letter.

Generated files live under `MONKEY_DATA_PATH/images`, never public static storage.
Authenticated image routes use `Cache-Control: no-store`. Files are finished
before the account reference and audit event commit atomically; failed replacements
retain the old image. Startup/hourly collection removes only generated,
unreferenced PNG files older than 24 hours. Back up and restore the database and
image directory together. Financial history is unchanged.

The six focused image checks passed against the production Linux image on
2026-10-10, covering API limits/security/restart, real file/database recovery,
and German/English desktop/mobile workflows. Run from `revamp/` after the solution
and container builds: `npm --prefix tests/e2e test -- images.spec.ts --workers 1`.

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
Global partials in `web/src/styles/` hold the design tokens (light/dark), local
Roboto WOFF2 faces, Taiga variable mapping, base utilities, and shared component
classes; component SCSS holds only view-specific layout. Roboto (SIL OFL 1.1, see
`web/public/fonts/roboto/OFL.txt`), the logo, and the PNG favicon in `web/public/`
are bundled locally.

The theme preference (`system`, `light`, `dark`) is stored per user by the
backend (`PUT /api/auth/theme`) and applied during SSR as `data-theme-preference`
and `tuiTheme` on the root element; `system` follows the device setting.
Manager-created users and password resets receive a backend-generated temporary
password that the API returns once.

## Angular Structure

Keep the root component and application configuration/routes in `web/src/app/`.
Group other Angular artifacts by responsibility, then by their component, pipe,
or service name. Components keep their TypeScript, HTML, and SCSS together:

```text
app/
	components/
		shell/            app shell: header, user menu, navigation drawer
		login/            sign-in, forced password change, system status
		overview/         account cards (home view)
		accounts/         Manager account table with create/edit dialog
		account-details/  balance, opening entry, transactions, history
		administration/   profile/users tabs
		profile/          account facts, password dialog, preferences
		users/            Manager user administration and temporary passwords
		modal-dialog/     shared native dialog
	pipes/amount-tone/, currency-amount/
	services/accounts/, authentication/, foundation/, language/, theme/, users/
	models/accounts/, authentication/, foundation/
	i18n/               language registry and bundled-catalog loader
	app.ts, app.html, app.config*.ts, app.routes*.ts
styles/             global tokens, fonts, Taiga mapping, base and component classes
```

## Backend Structure

The [API project](backend/PocketMonkey.Api/PocketMonkey.Api.csproj) separates types
and behavior by responsibility. Namespaces follow the folders:

| Folder | Responsibility |
| --- | --- |
| Entities | Persisted domain and Identity entities, not API payloads |
| Contracts/Authentication, Contracts/Users, Contracts/Accounts | Request/response models grouped by API feature |
| Endpoints | Feature-specific HTTP routing, policies, and response mapping |
| Services | Application behavior, transactional user/account administration, and typed error outcomes |
| Identity | Identity registration, cookie validation, policies, and claims |
| Operations | Host-only manager bootstrap and recovery commands |
| Storage | EF context, storage initialization, and readiness |
| Configuration | Runtime options and validation |
| Migrations | Generated schema history and model snapshot |

Endpoints use contracts at the HTTP boundary; services operate on entities.
Moving types between folders does not change routes, JSON contracts, or the schema.

User administration returns `UserAdministrationError?`, with `null` indicating
success. The enum and its shared `ToCode()` conversion live beside the service.
HTTP and operator boundaries retain stable snake-case error strings; only the
endpoint mapper assigns HTTP statuses.

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
CI uses one Playwright worker; local runs use two. Parallel Docker fixture
creation/removal on a native Linux runner can trigger Chromium
`ERR_NETWORK_CHANGED` during asset downloads. Serializing CI fixture lifecycles
avoids that interference without retries; explicit concurrent-request tests still
exercise business concurrency.
Reports, screenshots, traces, and failure logs are beneath
`tests/e2e/playwright-report/` and `tests/e2e/test-results/`, both ignored by Git.
No core API/authentication/storage mocks or unit-coverage requirement are used.

On 2026-10-08, the downloaded GitHub trace showed a desktop English ledger reload
losing its stylesheet and lazy account-details bundle to `ERR_NETWORK_CHANGED`,
then failing the balance assertion with an empty content area. The same case and
all 49 production-image cases passed locally with `CI=true` and one worker
(full suite: 8.5 minutes). The native Linux hosted rerun remains unverified.

Browser cases live in `tests/e2e/specs/`; Playwright configuration and shared
fixtures remain at the E2E project root. C# runtime check implementations live in
`tests/integration/RuntimeChecks/Tests/`; the project root contains the command
dispatcher and project/configuration files, not check implementations.
Test phases are separated into readable
setup/action/assertion groups, including independent concerns within assertions.
Multi-stage workflows repeat action/assertion groups rather than combining all
actions into one block.

Authentication and account fixtures use an ephemeral, loopback HTTPS reverse proxy and a
test-only self-signed certificate so production Secure cookies are tested without
weakening them. Certificate exceptions apply only to those isolated fixtures.
The mounted runtime probe verifies initial-schema upgrades, cookie lifetime/expiry,
account constraints/audit rollback, and timezone contracts; it and all browser
tooling remain outside the image.

## Local Development

With Node 24 and .NET SDK 10.0.401 installed, run these commands from the repository
root. Install web dependencies once after checkout or when the lockfile changes:

```text
npm --prefix revamp/web ci --ignore-scripts
npm --prefix revamp/web run dev
```

For a fresh data directory, [create the first Manager](#first-manager-and-recovery)
before signing in. That section also documents password recovery; there is no
default user or public registration route.

The launcher starts `dotnet watch` and Angular's SSR development server together.
It builds automatically, enables hot reload/watch mode, uses the real Web-BFF and
backend, and keeps state under `revamp/.local/dev/`. Docker and browser-test tooling
are not required. Open http://127.0.0.1:4180; backend OpenAPI is available directly
at http://127.0.0.1:5180/openapi/v1.json. Ctrl+C stops both process trees. A child
exiting also stops the other process. Windows may report a nonzero cancellation
status after Ctrl+C.

Supervision uses Node's built-in process APIs and executable/argument arrays,
without shell command strings or a concurrency package. Output retains backend/web
prefixes. Windows cleanup uses `taskkill /T`; Linux signals process groups and
forces termination after five seconds if necessary. An unexpected child exit or
startup failure stops both applications and returns a failure status.

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

### First Manager and Recovery

There is no public registration/setup route, default password, or email recovery.
Run operator commands on the host; they prompt for a username and password without
echoing the password or placing it in command arguments. Passwords require at least
12 characters, uppercase/lowercase letters, and a digit.

For Docker, with the container running:

```text
docker exec -it pocket-monkey-preview dotnet /app/backend/PocketMonkey.Api.dll bootstrap-manager
docker exec -it pocket-monkey-preview dotnet /app/backend/PocketMonkey.Api.dll recover-manager
```

Bootstrap works only while there are no users. Recovery resets an existing
manager's password, clears lockout, reactivates that manager, and requires a
password change after login. Both operations create database audit events.
Host access is a privileged operator capability, not an in-app Manager permission.

For the development launcher, run from the repository root in another PowerShell
terminal after the Release build. Resolve the replacement directory explicitly
so the operator command cannot accidentally select a repository-root data folder.
Use the same public origin as the launcher (change the port below if necessary):

```powershell
$revampPath = (Resolve-Path './revamp').Path
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:MONKEY_DATA_PATH = Join-Path $revampPath '.local/dev'
$env:MONKEY_PUBLIC_URL = 'http://127.0.0.1:4180'
dotnet (Join-Path $revampPath 'backend/PocketMonkey.Api/bin/Release/net10.0/PocketMonkey.Api.dll') bootstrap-manager
```

Use `recover-manager` in place of `bootstrap-manager` for recovery. Development
HTTP cookies are local-only; production requires HTTPS and Secure cookies.

Operator commands print their resolved `Data directory` before prompting. Check
that it matches the launcher's `Persistent development data` path; success against
a different database does not change the preview's users. Commands show concise
warnings/errors instead of informational EF query logs, while application runtime
logs retain their structured format and configured level. Enter passwords directly
at the hidden terminal prompt, not as arguments or in chat.

### Sessions and Permissions

- Managers create users, change roles/active status, and reset passwords. Temporary passwords require a change before user administration or ordinary protected access.
- The last active manager cannot be disabled or demoted, including concurrent changes. Users are disabled rather than deleted; immutable actor IDs are retained.
- Sessions expire after eight hours without sliding renewal or remember-me persistence. Valid cookies survive container restart, but password reset, role change, or disablement revokes them on the next request.
- Unsafe requests require the backend-issued antiforgery token, including login/logout. The BFF forwards cookies/tokens and strips client identity/proxy headers; the backend decides access.
- Five failed password attempts lock the account for fifteen minutes; login additionally permits twenty attempts per minute for the instance. Authentication failures use generic errors.
- Members can change their own password/language and read every account and its ledger history. Managers create/edit accounts, post explicit opening entries, and make deposits/withdrawals.

Application role decisions and contracts use `UserRole`; explicit Identity names
and JSON values remain `Manager`/`Member`. Invalid textual roles retain the
`invalid_user` error contract, numeric roles are rejected, and an omitted role
defaults to Member.

The harmless foundation diagnostics remain anonymous during development and must
be restricted or removed before production release.

### Shared Accounts

Ready authenticated users see the shared account list at `/` or `/accounts`, and
details at `/accounts/{id}`. Managers create/edit names; Members have read-only
views. Anonymous or forced-password sessions see the authentication shell instead
of private account content. Backend authorization remains authoritative.

Names are trimmed and contain 1-40 characters. Invariant-uppercase normalized
names have a unique database index, so case-insensitive conflicts return errors
even during concurrent writes. IDs do not change on rename. There is no nine-account
cap and no editable balance, media, or account deletion.

The Web-BFF allowlists `GET /api/accounts`, `GET /api/accounts/{id}`,
`POST /api/accounts`, `PUT /api/accounts/{id}`, `POST /api/accounts/{id}/opening`, and
`GET`/`POST /api/accounts/{id}/transactions`. Successful account responses expose
IDs/names, the configured currency code, nullable exact balance, and opening provenance; errors retain stable `invalid_account_name`,
`account_name_taken`, and `not_found` codes. Writes and their audit events commit
atomically. Request-scoped SSR uses reviewed identity-bound hydration data, not
shared private caches or automatic HTTP transfer caching.

### Opening Balances and Currency

Accounts start with `balance: null` and no opening entry. A Manager posts exactly
one explicit opening amount, including zero and negative amounts. Members can read the resulting
balance and provenance but cannot post. Opening entries cannot be edited or
deleted. Posting commits the entry, balance, and audit event atomically; retries
with the same account, actor, amount, comment, and GUID idempotency key replay the
original entry. Changed payloads/actors conflict.

Amounts use signed 64-bit integer minor units internally and canonical
two-decimal strings in JSON. Opening amounts and balances support the full range
`-92233720368547758.08` through `92233720368547758.07`. Extra precision and
out-of-range values are rejected rather than rounded. Browser formatting also
preserves every digit without binary floating-point money arithmetic.

Set `MONKEY_CURRENCY=EUR` (default) or `MONKEY_CURRENCY=USD` in the backend/container
environment. Unsupported values prevent startup. It is one display unit for the
whole instance, independent of UI language and `TZ`: localized numbers always
have the symbol after them, such as `12,34 €` or `12.34 $`. Changing the setting
only relabels amounts; it does not convert money or alter stored ledger history.
The currency-neutral helpers are `CurrencyAmount` and `CurrencyAmountPipe`.

Ledger sources use `LedgerEntrySource` in entities, queries, entry creation, and
response mapping. EF converts it to the existing lowercase text column; JSON
uses the stable `opening`, `deposit`, and `withdrawal` values. The original enum
change required no schema migration; manual transactions add the sequence and signed constraints described below.
The SQLite enum query/materialization probe and all 16 focused account/ledger
production-image cases passed on 2026-10-08.

Opening errors retain stable `invalid_opening_amount`, `invalid_comment`,
`invalid_idempotency_key`, `not_found`, `already_initialized`, and
`idempotency_conflict` codes.

On 2026-10-08, Step 3B passed the locked backend/runtime-check build, real-SQLite
`ledger-persistence` probe, Angular SSR/image builds, catalog checks, E2E
typechecking, Compose USD forwarding, and EF pending-model check (none pending).
The focused ledger suite passed 8/8 cases; the full production-image suite passed
49/49, including invalid-currency startup rejection. Desktop/mobile screenshots
confirmed exact maximum-value layout and suffix symbols. Tests also verified
same-volume EUR-to-USD relabeling without monetary/provenance changes.
Hosted CI, publishing, and actual-host release gates remain open.

### Manual Transactions and History

An account needs one opening before a Manager can post manual transactions.
`POST /api/accounts/{id}/transactions` accepts `source: "deposit"` or
`"withdrawal"`, a positive decimal-string `amount`, an optional comment up to
500 characters, and a GUID `idempotencyKey`. Deposits persist positive deltas;
withdrawals persist negative deltas. Overdrafts are allowed. Checked balance
overflow returns `balance_overflow` with no partial financial writes.
Successful posts and matching replays return the original entry with HTTP 200.
The key is shared across opening/manual postings; source is part of conflict matching.

`GET /api/accounts/{id}/transactions?pageSize=20` returns `entries` and
`nextCursor`. Pass the returned cursor unchanged, URL-encoded, to read the next
page. Pages allow 1-100 entries and include openings. A unique increasing
sequence gives newest-first ordering, and the first page's snapshot excludes
new postings from later pages. The UI retains previous pages while browsing;
refreshing the account starts a new snapshot. Ready Members can read all history
but cannot post; the backend enforces permissions and antiforgery.

The `ManualTransactions` migration backfills only the ordering sequence for
existing openings, preserving amounts, balances, actors, timestamps, and comments.
SQLite checks validate integer balances/deltas, source signs, positive unique
sequences, single openings, and unique idempotency keys. Posted history has no
edit/delete/reversal endpoint. Dedicated reversals remain deferred.

On 2026-10-08, the locked .NET build, actual-SQLite migration/rollback probe,
Angular SSR/image builds, catalog validation, E2E typecheck, and EF model check
passed. All 15 focused ledger cases and all 56 production-image cases passed;
the full suite used `CI=true`, one worker, zero retries, and took 10.4 minutes.
Desktop/mobile German/English screenshots and checks cover negative extremes,
overdrafts, escaped comments, response-loss retries, pagination during new posts,
and unchanged persisted history on language changes. Hosted acceptance remains open.

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

On 2026-10-07, local authentication and user administration passed:

- Locked backend/integration builds, Angular SSR build, production image build, E2E typechecks, catalog validation, and editor diagnostics.
- All 31 production-image acceptance cases, including desktop/mobile browser login, manager create/edit/reset controls, forced password change, language preference, and logout.
- One-time bootstrap, CSRF and forged-header rejection, member authorization denials, concurrent SSR identity isolation, immediate revocation, lockout/recovery, restart sessions, absolute eight-hour expiry, and initial-schema upgrade without sample loss.
- The test-tool audit's high-severity gate; two low-severity findings remain in existing Mermaid/KaTeX tooling.

The responsibility-based backend organization and E2E readability cleanup also
passed the locked solution build, production image build, E2E typecheck, and all
31 acceptance cases. EF reported no pending model changes; the cleanup leaves
schema history, routes, and JSON contracts unchanged.

The subsequent typed-error refactor passed the locked solution and production
image builds, E2E typecheck, and all 12 authentication cases. The new API regression
checks preserve validation/not-found/conflict statuses and exact JSON codes;
operator bootstrap rejection retains `already_initialized`.

The initial web dependency audit failed because the development-only
`concurrently` / `shell-quote` dependency chain had a critical advisory,
[GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv).
Removing that chain and replacing development supervision with Node's built-in
APIs cleared the finding; the web audit now reports zero vulnerabilities.
The native launcher passed real Windows startup/SSR, occupied-port isolation,
Ctrl+C cleanup, peer-failure cleanup, and executable-start failure checks. Isolated
Linux process fixtures verified SIGINT/SIGTERM, unexpected child exit, startup
failure, and forced cleanup of descendants that ignore SIGTERM.
A clean lockfile-based web install, production Angular/SSR build, catalog checks,
and `npm --prefix web audit --audit-level=high` also passed after removal.

On 2026-10-08, [Step 3A shared accounts](../plans/migration/03a-accounts.md) passed:

- Locked backend/runtime-check builds, Angular SSR and production-image builds, E2E typechecking, and bilingual catalog validation. The generated account migration has no pending model changes.
- All 40 production-image acceptance cases, including eight account cases and the existing authentication, SSR language, lifecycle, offline-runtime, and timezone checks.
- Real-SQLite name-length enforcement, conflict rollback/atomic audit, concurrent and German-character case-insensitive duplicates, more than nine accounts, and restart persistence.
- German/English desktop/mobile manager create/edit/reload and Member read-only workflows, empty/missing states, keyboard navigation, long-name wrapping, and immediate removal of a revoked Member's private view.
- Authenticated list/detail SSR hydration, no-store responses, and concurrent authenticated/anonymous request isolation without leaking account names or session cookies.

The subsequent operator-usability fix passed the locked API and production-image
builds and the focused real-image lockout/recovery/login/restart case. That case
also checks the resolved data-directory output and absence of EF query chatter;
successful recovery still requires a password change after login.

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

Local authentication work does not close the remaining
[milestone 1 gates](../plans/migration/01-stack-foundation.md#acceptance-gate).
Complete those delivery/host checks and the
[authentication gate](../plans/migration/02-authentication-authorization.md#acceptance-gate)
before claiming deployment readiness; deliver business UI/rules in milestone 3.