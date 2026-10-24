# POCKET MONkEY Foundation, Authentication, Accounts, Images, Ledger, and Allowances

The build/run/storage foundation, local authentication, manager user
administration, shared accounts and private account images, signed opening balances, deposits/withdrawals,
paginated history, monthly allowance configuration, and durable allowance credits
are implemented. This is not a production-ready application.
Dedicated reversals are deferred.

Monthly reports are excluded from the product scope; no monthly-summary views,
report snapshots, or report-generation jobs are planned.
The approved [step 2B](../plans/migration/02b-ux-ui-design.md)
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
Allowance configuration and execution follow
[ADR-0015](../docs/ADR/ADR-0015-monthly-allowance-configuration.md) and
[ADR-0016](../docs/ADR/ADR-0016-monthly-allowance-execution.md).

## Currency Formatting R1 (2026-10-24)

The user explicitly approved the current Currency Formatting R1 prototype with
"approved". Angular's shared `CurrencyAmountPipe` now omits the fractional part
only when cents are zero. Nonzero cents keep exactly two digits, including
trailing zeroes (`10.10` / `10,10`) and subunit values (`0.01` / `0,01`).
The rule applies consistently to EUR and USD, balances, allowances, ledger
history and confirmations, with existing locale grouping, suffix symbols and
signed/color semantics.

The formatter still uses canonical decimal strings and `BigInt` integer
formatting; it never converts monetary values to binary floating-point.
Stored values, canonical API strings, parsing, editable inputs and exact-money
limits are unchanged. Only display expectations changed in the allowance
workflow tests; editable values such as `15.00` remain intact.
The approved enduring display rule is recorded in
[ADR-0011](../docs/ADR/ADR-0011-currency-display-unit.md).

Validation passed:

```text
npm --prefix revamp/web run build:image
npm --prefix revamp/web run check:catalogs
npm --prefix revamp/tests/e2e run check
npm --prefix revamp/tests/e2e test -- specs/ledger/amount-display.spec.ts specs/ledger/opening-workflows.spec.ts specs/ledger/transaction-workflows.spec.ts specs/ledger/currency-setting.spec.ts specs/accounts/allowance-workflows.spec.ts --grep "whole amounts|opening entry, exact|signed transactions, retry|USD setting|manager schedules allowance|allowance save failures" --workers 1
```

All eleven focused production-image checks passed without retries. Coverage
includes desktop/mobile Overview SSR and hydration, Accounts rows, details,
history, whole/fractional opening confirmations, canonical API values, zero,
positive/negative whole amounts, tenths, single cents and large exact balances.
Existing opening/transaction checks preserve signed 64-bit fractional extremes,
Member read-only behavior, retries and pagination. Allowance checks preserve
input retention, scheduled/retained amount display and stale-write recovery.
The existing focused desktop USD configuration/rendering check now also covers
zero, whole, tenths and subunit amounts without duplicating business workflows.

A separate temporary German rendering/localization review passed at
1440x1000 and 360x1000 in light/dark themes. It checked initial SSR and hydrated
amounts, grouping, cent precision, large whole amounts, localized confirmation
previews, unchanged comma-decimal input and no horizontal overflow. Desktop/light
and phone/dark screenshots were inspected. The temporary review was removed
rather than adding German workflow duplication to the E2E suite.

Catalog, TypeScript, formatting and whitespace checks passed. The production
build retains the existing warning-only initial-bundle overrun (754.95kB versus
750kB); budget limits are unchanged. The full release suite was not run.

## Allowance Consistency and Feedback Alignment (2026-10-24)

The user clarified that prototype-only corrections must not leave the same
inconsistency in the real application. Angular Overview now shows generic
outstanding allowance status to both Managers and Members, matching details
and the existing redacted API. Attempt/reason metadata remains Manager-only;
no backend contract or fictional failure data was introduced.

Shared Angular feedback styles now give field errors a separated icon/text
layout. Icon line boxes match the first caption/body text line, including
wrapped messages. This corrects confirmation-field and login-banner alignment
without changing error messages, colors, validation or API behavior.

Validation passed:

```text
npm --prefix revamp/web run build:image
npm --prefix revamp/tests/e2e run check
npm --prefix revamp/tests/e2e test -- specs/authentication/profile-password.spec.ts specs/authentication/workflows.spec.ts --workers 1
npm --prefix revamp/tests/e2e test -- specs/accounts/allowance-execution.spec.ts --grep "active allowance" --workers 1
```

All ten distinct production-image checks passed without retries across those
focused runs: eight authentication checks and two active-allowance failure/
recovery checks, on desktop/mobile. Member generic failure now appears in
Overview SSR and after hydration; API redaction and Manager-only details remain
covered. The initial revised assertion omitted the existing automatic-retry
sentence; the corrected expectation includes the complete translated label.

Feedback checks load the local fonts and measure icon-center alignment against
the first rendered text line (at most 1px offset), with at least 4px separation.
They cover required/mismatched confirmation and real password-save/login errors,
including wrapped text. Fresh confirmation, login and wrapped password-error
screenshots were inspected. The scoped TypeScript checks and whitespace check
passed. The image build retains the existing warning-only initial-bundle overrun
(754.95kB versus 750kB); budget limits are unchanged.

The optional-zero-cents presentation was separately drafted in this earlier
slice. Its later approval and Angular implementation are recorded above.

## Password Dialog R1 (2026-10-24)

The user explicitly approved the Profile password-dialog prototype R1 and the
prototype-only Allowance Status Consistency R2 corrections with "okay, approve
also the previous changes". The Profile wireframe R1 was already approved.
Angular now uses the locally bundled Lucide `square-asterisk` icon and a required
Confirm new password field. Confirmation compares exactly without trimming;
missing/mismatched values show a translated inline alert, associate it with the
invalid field and focus that field without sending a password-change request.
Only current/new passwords are sent through the existing endpoint.

Failed saves retain all input, Cancel restores focus, and reopening clears the
form and validation. Successful changes retain the existing session-ending
behavior and permit sign-in with the new password. The first-sign-in form,
Manager temporary-password dialog and backend contracts are unchanged.
Allowance Status Consistency R2 remained prototype-only in this earlier slice.
The later explicit request to fix equivalent application inconsistencies is
implemented above without adding fictional failure data.

Validation passed:

```text
npm --prefix revamp/web run build:image
npm --prefix revamp/web run check:catalogs
npm --prefix revamp/tests/e2e run check
npm --prefix revamp/tests/e2e test -- specs/authentication/profile-password.spec.ts specs/authentication/workflows.spec.ts --workers 1
```

All eight production-image checks passed without retries: four new
Manager/Member desktop/mobile confirmation and real failed-save/retry flows,
plus four existing login/preferences/logout and temporary-password workflows.
The new checks cover light/dark presentation, accessible labels and errors,
required confirmation, trailing-space mismatch, keyboard submission, no writes
for invalid confirmation, focus return, reset on reopen, retained input, session
revocation and sign-in with the changed password.

A separate temporary German localization review passed at 1440x1000 and
360x1000 in both themes, checking translated labels, inline required/mismatch
messages, accessible descriptions, focus and horizontal overflow. Desktop/light
and phone/dark screenshots were inspected; the review script was removed rather
than adding German workflow duplication to the E2E suite. Its initial attempt
raced the language selector's own document reload; waiting for that existing
reload corrected the review without application changes or retries.

TypeScript formatting and `git diff --check` passed. The image build compiles
Angular and retains the existing warning-only initial-bundle budget overrun
(754.80kB versus 750kB); budget limits were not changed.

## Error Feedback R3 (2026-10-24)

The user explicitly approved Overview prototype R3 and its distinct,
contrast-safe Error foreground. Failed execution text now uses
`--status-error-fg`, backed by `--error-text-fg` (`#C4352B` light / `#FF6B60`
dark), instead of the earlier Danger alias. Successful/scheduled execution text,
role visibility, destructive actions and monetary colors are unchanged.
See the [approved contrast values](../docs/design/design-system/color-scheme.md#error-text-error-feedback-r3-2026-10-24).

Validation passed:

```text
npm --prefix revamp/web run build:image
npm --prefix revamp/tests/e2e run check
npm --prefix revamp/tests/e2e test -- specs/accounts/allowance-execution.spec.ts --grep "active allowance" --workers 1
```

Both desktop/mobile real-worker failure/recovery checks passed without retries,
including exact Error colors in both themes, Member visibility and unchanged
history. The production-image build compiles Angular; it retains the existing
warning-only initial-bundle budget overrun (754.49kB versus 750kB).
No Angular password behavior or icon changed in this earlier slice; the later
approved Password Dialog R1 implementation is recorded above.

## Allowance Presentation (2026-10-24)

The Accounts/Overview wireframes R1 and prototypes R2 were explicitly approved.
Angular now shows Allowance between Balance and Status, with allowance below
Balance on the right on phones. Overview cards show monthly allowance and a
separate execution row: successful/scheduled information uses the theme-aware
Text dimmed tokens, while Manager-visible failures use the danger foreground.
Disabled allowances have no execution row. Member summary visibility remains
as approved; account-details execution visibility and API redaction are unchanged.

The frontend composes account summaries from the existing account-list and
per-account allowance endpoints, fetching allowance states in parallel and
transferring the request-scoped result through SSR. No backend contract or
financial rule changed. The amount reflects the current business-month
configuration, not a future scheduled revision; details still shows future
changes. Credit dates use the backend's business timezone. Summary fetch failures
surface the existing error/retry state rather than appearing as disabled allowances.

Validation commands:

```text
npm --prefix revamp/web run build
npm --prefix revamp/web run check:catalogs
npm --prefix revamp/tests/e2e run check
npm --prefix revamp/web run build:image
dotnet build revamp/tests/integration/RuntimeChecks/RuntimeChecks.csproj --configuration Release -p:RestoreLockedMode=true
npm --prefix revamp/tests/e2e test -- specs/accounts/workflows.spec.ts specs/accounts/allowance-workflows.spec.ts specs/accounts/allowance-execution.spec.ts specs/ledger/transaction-workflows.spec.ts --workers 1
npm --prefix revamp/tests/e2e test -- specs/accounts/allowance-execution.spec.ts --workers 1
```

Nineteen distinct core production-image checks passed across these focused runs,
without automatic retries. Initial execution assertions used a fixture disabled
for the current month; the final execution run passed all seven checks with
separate active/disabled allowance cases. Coverage includes desktop/mobile
column ordering and placement, current versus scheduled configuration, explicit
load-error recovery, SSR execution text, exact light/dark dimmed and danger
colors, Member visibility, and real worker failure/recovery without duplicate
history. The test-only fixture gained an active-allowance failure variant;
production code gained no test backdoor.

A separate, temporary German rendering review passed for both views in light
and dark themes at 1440px and 360px, checking translated amounts/statuses,
danger colors and no horizontal overflow. Its review-only spec was removed.
Fresh English and German desktop/phone screenshots were inspected. This is
focused verification, not a full regression or release approval.

The existing warning-only initial-bundle budget overrun remains: 754.29kB versus
750kB. Budget limits are unchanged.

## Compact Account Names (2026-10-24)

The wireframe and Accounts R2 prototype were separately approved. Angular now
renders account-name links without underlines, caps the desktop Name column,
places right-aligned Balance directly beside it and allocates spare width to
Status. Column tokens match the design reference using the application's rem
scale. Names and amounts wrap; hover feedback, keyboard focus, detail navigation,
and phone identity/status grouping and tap targets are retained.

The following focused validation passed:

```text
npm --prefix revamp/web run build
npm --prefix revamp/web run check:catalogs
npm --prefix revamp/tests/e2e run check
npm --prefix revamp/web run build:image
npm --prefix revamp/tests/e2e test -- specs/accounts/workflows.spec.ts specs/ledger/transaction-workflows.spec.ts --workers 1
```

All six production-image desktop/mobile checks passed with zero retries.
Account assertions cover non-underlined links, capped columns at
600/899/900/1440/1920px, long-name wrapping and phone status/tap targets at
320/360px, plus visible keyboard focus and Enter navigation. Existing transaction
retry, signed-balance and history checks also passed. Desktop and 360px phone
account screenshots were inspected. Catalog validation covers both languages;
the production-image workflows ran in English. The prototype was separately
verified across both languages and themes, as recorded in the
[design index](../docs/design/README.md#compact-account-names-r2-2026-10-24).

The build retains the warning-only initial-bundle budget overrun
(753.81kB versus 750kB); limits are unchanged. This focused selection is not a full
regression or release verification.

## Tonal Surfaces (2026-10-23)

The user approved the current design-system/prototype revision for Angular
implementation: "I approve the changes. Now do in Angular". Application SCSS now
uses neutral tonal account cards/panels, filled secondary actions, borderless
feedback/dialogs and alternating table rows instead of decorative outlines.
Keyboard focus, selected navigation/tabs, input boundaries and validation remain.
Light/dark tokens stay local to Angular; specimen CSS is not imported. No backend
rules, localization text or wireframe layouts changed.

Angular and production-image builds passed. The following real production-image
selection passed **19 checks** across desktop/mobile, including the new rendered
surface/focus assertions, theme persistence, native dialogs and SSR/hydration:

```text
npm --prefix revamp/web run build
npm --prefix revamp/web run build:image
npm --prefix revamp/tests/e2e test -- specs/authentication/workflows.spec.ts --workers 1
npm --prefix revamp/tests/e2e test -- specs/shell/about.spec.ts specs/authentication/about.spec.ts specs/ledger/transaction-workflows.spec.ts specs/shell/rendering.spec.ts --workers 1
```

Desktop/mobile transaction-dialog screenshots were inspected. This focused
verification is not an application-wide accessibility audit or release approval.

## Monthly Allowances

Managers configure exact positive monthly amounts or disable allowance while
retaining the amount. Changes take effect next business month; saving settings
never posts money. The backend scans at startup and once per minute, catches up
every missed eligible historical month, skips disabled months, and automatically
retries durable failures. Unique account/month identities and atomic ledger,
balance, audit, and execution completion prevent duplicate or partial credits.

Account details shows only the latest successful credit and oldest outstanding
month. Managers see attempt details and safe reasons; Member API responses redact
those details. Ledger credits show localized automatic provenance and their
business period. Status and history dates use validated `TZ`; stored UTC events
and credited month identities remain unchanged. Language never chooses the
business timezone or financial period.

The current wireframe and prototype were separately explicitly approved on
2026-10-12. The [Step 3F delivery record](../plans/migration/03f-allowance-execution.md#delivery-evidence)
documents **17 passing local production-image checks**, including forced restart,
periodic retry, atomic failure, role security, configuration regressions, and
SSR/hydration. It includes the exact reproducible command and remaining hosted/
release gates; no production test-clock or failure-injection endpoint exists.

## About and Legal Review Content

The approved shared About / Info dialog is available from public sign-in and
forced-password-change screens and from either signed-in role. Login shows
`Version | About`; the sidebar keeps Administration last in the top navigation
group, after Overview and Manager-only Accounts,
with labelled About anchored above the version. Opening the dialog preserves
the underlying form/navigation. It uses the current language/theme, keyboard
tabs, native modal background inertness, and Close/Escape with opener focus return.

Overview contains the web package version and source metadata. The dedicated
Project license tab shows the full unmodified `AGPL-3.0-only` text immediately,
without expansion. The [About build-input generator](web/scripts/prepare-about.mjs)
derives inline text and the locally served `/licenses/AGPL-3.0-only.txt` from the
root [LICENSE](../LICENSE), preserving its exact contents. Both are ignored build
outputs, not manually maintained copies. The About E2E workflow verifies their
fidelity, the license hash, and version/build agreement with container labels.

This is still review content, not release-ready legal delivery. The third-party
tab shows the real three-entry manual collection with explicit partial coverage;
the legal sections present the accepted general bilingual wording and an explicit
deployment-specific privacy caveat.
Complete shipped/transitive/runtime notices, rights/compatibility review, and
deployment-specific legal review remain outstanding. Repository/release-source URLs
are unavailable until agreed. About now shows the captured source revision and
whether this is a development build with uncommitted changes; source archives
without Git explicitly report unavailable provenance. Dirty builds do not receive
a misleading revision-matched source link.

The [Step 3H delivery record](../plans/migration/03h-lifecycle.md#angular-delivery-evidence-2026-10-17)
records 21 passing production-image checks and the separate German layout review.
Run the focused set from the repository root after building the image:

```text
npm --prefix revamp/tests/e2e test -- specs/shell specs/authentication/about.spec.ts specs/authentication/workflows.spec.ts --workers 1
```

### Four-Tab About Delivery (2026-10-23)

The approved R5 layout is implemented: Overview, Project license, Third-party
notices and Legal information. The license is no longer nested in Overview or
behind an accordion. Existing bilingual labels, canonical generated text, local
downloads and real build/notice metadata are retained. Notice expansion survives
filtering and tab changes; closing/reopening resets the selected tab, search and
expansion. Header/tabs stay fixed while content scrolls internally, including on
phones. This changes neither notice coverage nor legal review status.

Application and production-image builds, E2E typechecking and **eight focused
production-image About checks** passed. The checks cover public/Manager/Member
access, forced-password forms, keyboard tab order, exact license/download text,
stable content width, fixed header/tabs, search/expansion state and focus return.
Desktop and 320px phone license screenshots were inspected. Eight separate
development-app layout checks passed in isolated browser contexts for both
languages/themes at 1440px/360px: localized license labels, the full text, no
horizontal overflow and no nested license scroll box. The existing signed-in
session and saved preferences were untouched.

```text
npm --prefix revamp/web run build
npm --prefix revamp/web run build:image
npm --prefix revamp/tests/e2e run check
npm --prefix revamp/tests/e2e test -- specs/shell/about.spec.ts specs/authentication/about.spec.ts --workers 1
```

### Legal Information Delivery (2026-10-23)

After the wording and prototype review, the user requested "implement" for the
current Legal information presentation. Angular now displays the accepted
[German/English R1 text](../docs/terms/self_hosted_legal_information.md) as separate,
escaped paragraphs in the existing Operator responsibilities, Warranty and
liability, and Privacy information sections, retaining the deployment-specific
privacy caveat. No backend/consent state, cloud legal documents, canonical license
or notice originals changed. Partial notice coverage and deployment-specific
publication/legal review remain open.

The production-image build, catalog validation and E2E typecheck passed, followed
by **eight production-image About checks** on desktop/mobile. The public workflow
compares every English paragraph against R1 and verifies paragraph spacing,
internal scrolling and fixed header/tabs, alongside the existing role/form,
focus-return, exact-license and mapped-notice checks.

```text
npm --prefix revamp/web run check:catalogs
npm --prefix revamp/tests/e2e run check
npm --prefix revamp/web run build:image
npm --prefix revamp/tests/e2e test -- specs/shell/about.spec.ts specs/authentication/about.spec.ts --workers 1
```

Separate development-app browser checks passed eight English/German, light/dark,
1440px/360px combinations with exact accepted paragraphs, native keyboard,
spacing, overflow, scrolling and focus return. Contexts were isolated from the
existing signed-in session. Production desktop/320px phone screenshots and
German dark-phone screenshots were inspected; local layout artifacts are beneath
ignored `revamp/.local/legal-angular-review/`.

### Build Metadata and License Generation

[ADR-0019](../docs/ADR/ADR-0019-build-identity-and-about-assets.md) defines the
version/source rules. The web package is the single application-version source;
both root lockfile versions must match it. Login, shell, About, and OCI labels use
the generated identity, not independently edited constants.

Run these commands from the repository root:

```text
npm --prefix revamp/web run assemble:notices
node revamp/web/scripts/assemble-notices.mjs --check
npm --prefix revamp/web run prepare:about
npm --prefix revamp/web run prepare:about -- --check
npm --prefix revamp/web run check:about
npm --prefix revamp/web run build:image
```

The npm `build`, `start`, `dev`, `watch`, and `ng` entry points automatically
prepare assets before starting. If a version/license input changes while a watch
server is running, rerun `prepare:about` or restart it. A clean checkout must run
preparation or one of these entry points before directly invoking Angular tools.

The [image wrapper](web/scripts/build-image.mjs) captures repository metadata and
the canonical license in ignored `revamp/.build/about/` before invoking Docker.
Docker validates that snapshot against package versions and label arguments,
then generates its own web assets. This works without Git or the repository-root
license inside the `revamp/` Docker context. A post-build check rejects input drift.
Use this wrapper instead of the previous standalone `docker build` command;
`--tag` can select a different local image tag.

For eventual release-input validation, `prepare:about` and `build:image` accept
`--release-tag` and `--repository-url`. The tag must exist at HEAD, exactly match
the application version, and use clean source; the URL must be the explicitly
agreed public HTTPS GitHub repository. No repository default is inferred or
invented. These flags validate identity, not legal completeness or release approval.

Public `/about/build-info.json` contains only the version, source/build identity,
optional source links, and project-license hash. It contains no user/deployment
secrets. The build-only SemVer parser and other build tools do not ship in the
runtime image; notice inclusion is determined by redistributed material, not
merely by `dependencies` versus `devDependencies` in a manifest.

### Third-Party Notices

[ADR-0020](../docs/ADR/ADR-0020-shipped-component-inventory.md) selects ORT for the
dependency/license overview instead of a bespoke inventory. See the
[ORT preparation checklist](notices/README.md) for the remaining version pinning,
reproducible invocation, reporting and coverage checks. ORT is not installed or
required by CI yet. Original notices may still be collected manually.

Source-only public GitHub development may begin before ORT setup, comprehensive
dependency/asset review and complete About integration. Those tasks are deferred to final
release preparation, before public Docker images or releases. Source publication
still requires rights and applicable notices for included code/assets and review
of repository history for private data or credentials. This sequence does not
authorize a visibility change or mark any publication gate complete.

Notice delivery starts with a handcrafted, reviewed Angular, .NET, ASP.NET Core,
Entity Framework Core, SQLite, Taiga UI, Lucide and Roboto set using actual shipped versions
and required original texts. Its initial About presentation can precede ORT;
later tooling and supplemental review expand coverage. This first set is partial,
not proof that all shipped components are covered or permission to defer their
required notices. Follow the [staged delivery checklist](notices/README.md#staged-delivery).

SQLite coverage includes its .NET provider and `SQLitePCLRaw` bindings/native
bundle. The SQLite engine is public domain; wrapper/package terms are separate.

The [root notice document](../THIRD-PARTY-NOTICES.txt), beside the project license,
is the canonical generated distribution output, not an independently maintained
dependency database. Approved Manual Mapping R1 now has three partial entries:
Angular's seven framework runtime packages at `22.2.3` and SSR at `22.2.4` (MIT), EF Core `10.0.13` (MIT)
and the four local Roboto `3.015` fonts (OFL-1.1). The
[Angular delivery record](notices/README.md#angular-runtime-packages-2026-10-23)
documents their explicit grouping, shared original and bounded coverage.
Maintain the [catalog](notices/catalog.json) and original upstream texts,
then run `assemble:notices`; commit those inputs and the assembled root together.
This does not complete the agreed initial set or approve publication.

About preparation checks the root document against the catalog rather than
rewriting it implicitly, then copies its exact bytes into ignored Docker inputs
and generated assets. It also generates `/about/third-party.json`, preserving
grouped component/version/license/document associations, and original text files
at `/licenses/notices/<document-id>.txt`. Angular bundles these static assets
alongside `/licenses/THIRD-PARTY-NOTICES.txt`. Do not edit generated copies.
The container snapshot includes the catalog, originals and supporting lockfile/
font evidence; packaged preparation validates them against the actual web context.
No runtime downloads,
XML/ZIP parser dependencies, inventory Docker stage or required image scan remain.
The existing project-license/build-identity generation is unchanged. Upstream
Node/.NET/OS notices remain in the image. Build with the usual `build:image`
command; the existing offline runtime E2E check verifies the notice document's
exact bundle bytes, generated mappings and individual original-document hashes
from the network-disabled production image. The 24 isolated build-input checks
cover grouping, byte fidelity, stale versions/assets, invalid references, snapshot
drift and release-input boundaries. Partial coverage blocks release validation.

Review ORT coverage and supplemental evidence whenever shipped dependencies,
assets or runtime inputs change, and before release. Include transitive/native/
embedded and OS material, not just direct manifests. Apt results can change
without source edits. Store manual original texts with exact package/version and
provenance associations in the existing mapping contract. Later ORT adapters
propose reviewed changes to that contract rather than defining the UI format.

The preparation guide preserves the user's project-artwork authorship
confirmation. Complete attribution, required original texts, compatibility, font
provenance and applicable source/relinking obligations remain release gates.
The user explicitly approved reuse of the existing R4 dialog and matching prototype
for real notice data on 2026-10-19. About now renders the generated entries within
that unchanged layout and interactions: names/versions/license identifiers,
component-specific original texts and local document links. Search covers entry/
component names, versions and licenses. German/English labels and the explicit
partial-coverage warning are bundled; original legal text is not translated.
Nine focused About/offline production-image checks passed, plus four German
desktop/phone, light/dark browser checks. Legal wording and source URLs remain
unchanged; future design changes retain their separate approval gates.
Extend the partial proof with reviewed release-matched material before testing
the release image. Copy/hash checks establish delivery, not legal completeness.

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
and container builds: `npm --prefix tests/e2e test -- accounts/images --workers 1`.

## Verified Stack

English uses `en-US` formatting; German uses `de-DE`. Set
`MONKEY_DEFAULT_LOCALE=en-US` for an English instance default (German remains
the unset default). Existing personal language IDs remain `en` and `de`.
`en-GB` is no longer a supported value for this setting. This does not change
the configured currency or business timezone.

| Component | Verified version |
| --- | --- |
| .NET SDK / runtime / EF Core | 10.0.402 / 10.0.13 / 10.0.13 |
| Node / Angular framework / SSR and CLI | 24.22.0 / 22.2.3 / 22.2.4 |
| npm / TypeScript | 12.2.0 / 6.0.3 |
| Taiga / universal Web APIs | 5.29.0 / 5.4.0 |
| Transloco / MessageFormat integration | 8.4.0 / 8.4.0 |
| Lucide static font | 1.61.0 |
| Playwright | 1.63.0 |
| Container platform | Linux x86-64 only |

Patch versions are locked in the manifests/lockfiles. The ICU compiler uses
CommonJS and adds approximately 77 KB to the initial browser bundle; the explicit
initial budget is 650 KB warning / 800 KB error. No runtime CDN is used.
No ARM, Firefox, or WebKit compatibility claim is made yet.

Dependency refresh verified on 2026-10-23: npm 12.2.0 clean installation,
Angular SSR and replacement .NET builds, production image, 24 About/build-input
checks and 16 focused production-image checks passed. npm 12's default blocking
of dependency install scripts did not prevent the Angular build; container
installs continue to use `--ignore-scripts`. TypeScript 7 is deferred because
Angular 22.2.3 requires TypeScript `>=6.0 <6.1`; npm 11.21.1 is superseded by the
verified npm 12 update. The EF Core 10.0.13 original license has the same SHA-256
as 10.0.12, verified against the release-matched upstream URL.

### Audit Remediation (2026-10-24)

Updated Angular CLI/build/SSR to `22.2.4`, Taiga to `5.29.0`, Lucide to
`1.61.0`, and compatible locked transitives. Framework packages remain at their
latest `22.2.3`. Angular build `22.2.4` still pins vulnerable Vite `8.3.0`;
the web manifest therefore overrides only its Vite dependency to `8.3.5`.
Remove that override when Angular ships a patched Vite pin. Do not use
`npm audit fix --force`, which currently suggests downgrading Angular build.
The refresh also resolves `body-parser` to `2.4.0`, `fast-uri` to `3.1.9`,
and test-only DOMPurify to `3.4.17`.

Both CI `npm audit --audit-level=high` gates pass unchanged; the web graph has
zero reported vulnerabilities. Test tooling retains two low findings in the
Mermaid/KaTeX chain. npm suggests Mermaid `12.2.0`, a breaking major upgrade,
which is deferred rather than forced or hidden. Node types remain on Node 24;
TypeScript remains on Angular's supported 6.0 series.

Verified clean `ci --ignore-scripts` installs for web and E2E tooling, 24 About
build-input checks, translation catalogs, E2E typechecking, repository guardrails
(including Mermaid parsing), Angular SSR and production-image builds, and
**19 desktop/mobile production-image checks**:

```text
npm --prefix revamp/tests/e2e test -- specs/shell/rendering.spec.ts specs/shell/assets.spec.ts specs/authentication/workflows.spec.ts specs/authentication/about.spec.ts specs/shell/about.spec.ts --workers 1
```

The Vite development server also returned HTTP 200 with the English SSR sign-in
and its WebSocket client. The build reports a 753.57 KB initial bundle against
the 750 KB warning budget; the error budget was not changed.
The SSR license matches the reviewed Angular original byte-for-byte; its exact
catalog version and generated root notices were refreshed. Taiga/Lucide still
remain outside the explicitly partial curated catalog; their package license
material is retained and Lucide's license continues to be copied with its assets.
This does not close release notice-review gates or claim a hosted CI rerun.

During the 2026-10-23 refresh, the legacy solution also built with central OpenTelemetry Hosting 1.20.1 and
.NET package patches. Its inherited corporate NuGet source was unavailable,
so verification used `-p:RestoreSources=https://api.nuget.org/v3/index.json`
without changing source configuration. Existing moderate/high
`System.Security.Cryptography.Pkcs` vulnerability warnings remain; this update
does not claim an audit-clean legacy dependency graph.

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

The [Host executable](backend/PocketMonkey.Host/PocketMonkey.Host.csproj) references
the [Storage library](backend/PocketMonkey.Storage/PocketMonkey.Storage.csproj),
never the reverse. Both run in the same backend process. Follow
[ADR-0017](../docs/ADR/ADR-0017-backend-project-boundaries.md).
Namespaces follow the project and folder boundaries:

| Project / Folder | Responsibility |
| --- | --- |
| Storage / Entities | Persisted domain and Identity entities, not API payloads; ledger source enum and its existing serialization metadata |
| Storage / PocketMonkeyDbContext | EF context and model mappings |
| Storage / Migrations | All generated EF migration implementations, designer metadata, and the single model snapshot |
| Host / Contracts/Authentication, Contracts/Users, Contracts/Accounts | Request/response models grouped by API feature |
| Host / Endpoints | Feature-specific HTTP routing, policies, and response mapping |
| Host / Services | Application behavior, transactional user/account administration, and typed error outcomes |
| Host / HostedServices | Host-managed background workers and scheduling; delegates scoped business behavior to Services |
| Host / Identity | Identity registration, role enum, cookie validation, policies, and claims |
| Host / Operations | Host-only manager bootstrap and recovery commands |
| Host / Startup | Migration execution, role initialization, and Data Protection validation |
| Host / Health | Database and filesystem readiness |
| Host / Configuration | Runtime options and validation |

Endpoints use contracts at the HTTP boundary; services operate on entities.
Moving types between folders does not change routes, JSON contracts, or the schema.

Generate migrations from `revamp/` using the pinned EF tool and explicit paths:

```text
dotnet tool restore
dotnet ef migrations add <Name> --project backend/PocketMonkey.Storage --startup-project backend/PocketMonkey.Host --context PocketMonkeyDbContext --output-dir Migrations --namespace PocketMonkey.Storage.Migrations
node ../plans/migration/verify-guardrails.mjs
```

Keep every migration and the single `PocketMonkeyDbContextModelSnapshot` in
`backend/PocketMonkey.Storage/Migrations`. Do not create a second folder or snapshot. The backend build
rejects misplaced timestamped migration/snapshot files; the CI guard also checks
namespace consistency, matching implementation/designer pairs, and one snapshot.
Relocating generated history must preserve migration IDs and schema operations.

User administration returns `UserAdministrationError?`, with `null` indicating
success. The enum and its shared `ToCode()` conversion live beside the service.
HTTP and operator boundaries retain stable snake-case error strings; only the
endpoint mapper assigns HTTP statuses.

## Build and Verify

From the repository root, enter `revamp/`. Node 24, .NET SDK 10.0.402, and Docker
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
npm --prefix web run build:image
npm --prefix tests/e2e exec -- playwright install chromium
npm --prefix tests/e2e test
```

CI does not install a host browser; see the isolated browser server below. On a corporate network
whose CA is trusted by Windows, `NODE_USE_SYSTEM_CA=1` allows Node downloads to use
that trust store; never disable certificate verification to download a browser.

The solution build includes the test-only `RuntimeChecks` probe. E2E fixtures use
English browser/request defaults and English preferences for ready users. Core
workflows use EUR without a duplicated USD matrix; one desktop check verifies
USD configuration in API responses and SSR/hydrated rendering, while a targeted
persistence check verifies relabeling without financial-history changes.
Workflows are not duplicated by language; one desktop check verifies an explicit
German preference on the first SSR render and hydration. German/other-language
catalog checks and focused localization review remain separate.

Specs live in category folders beneath `tests/e2e/specs/`: `accounts`,
`authentication`, `ledger`, `shell`, and `lifecycle`. Each category has smaller
workflow, API, persistence, or recovery specs; shared helpers live in
`tests/e2e/helpers/`. Run a category or focused file from `revamp/`:

```powershell
npm --prefix tests/e2e test -- accounts/
npm --prefix tests/e2e test -- ledger/opening-workflows.spec.ts
npm --prefix tests/e2e run test:shell
```

E2E fixtures use
fresh named volumes/containers and dynamically published loopback ports per test;
they rediscover ports after Docker restart. Tests clean up only their own state.
Parallel Docker fixture creation/removal on a native Linux host creates and
removes veth interfaces; a host-namespace Chromium reacts with
`ERR_NETWORK_CHANGED` during asset downloads. CI therefore runs the browser in a
pinned `mcr.microsoft.com/playwright` container (`run-server`) with its own
network namespace and sets `PW_TEST_CONNECT_WS_ENDPOINT` plus
`PW_TEST_CONNECT_EXPOSE_NETWORK=<loopback>`, so browser traffic to the loopback
fixtures is tunnelled through the test runner. With a connect endpoint, CI uses
two workers; without one, CI falls back to one worker. Local runs use two.
Retries remain zero. To reproduce locally:

```powershell
docker run --detach --rm --init --name playwright-browser --publish 127.0.0.1:3000:3000 --workdir /home/pwuser --user pwuser mcr.microsoft.com/playwright:v1.63.0-noble /bin/sh -c "npx -y playwright@1.63.0 run-server --port 3000 --host 0.0.0.0"
$env:PW_TEST_CONNECT_WS_ENDPOINT = 'ws://127.0.0.1:3000/'; $env:PW_TEST_CONNECT_EXPOSE_NETWORK = '<loopback>'
npm --prefix tests/e2e test
```

Keep the image tag and the `run-server` version equal to `@playwright/test`.
The HTTPS fixture proxy caches the container's published port, re-resolves it
only after a connection failure (Docker restart), and opens a fresh upstream
connection per request. Resolving the port per request blocked each worker's
event loop on `docker inspect`, and pooled keep-alive sockets produced sporadic
`502` responses for lazy chunks.
Reports, screenshots, traces, and failure logs are beneath
`tests/e2e/playwright-report/` and `tests/e2e/test-results/`, both ignored by Git.
No core API/authentication/storage mocks or unit-coverage requirement are used.

On 2026-10-08, the downloaded GitHub trace showed a desktop English ledger reload
losing its stylesheet and lazy account-details bundle to `ERR_NETWORK_CHANGED`,
then failing the balance assertion with an empty content area. The same case and
all 49 production-image cases passed locally with `CI=true` and one worker
(full suite: 8.5 minutes). On 2026-10-10, the user subsequently confirmed that
all tests pass in GitHub Actions; see the [testing record](../plans/migration/testing.md).
This confirms hosted test execution, not fork-specific verification, publishing,
or real-host deployment acceptance.

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

With Node 24 and .NET SDK 10.0.402 installed, run these commands from the repository
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
Run operator commands on the host; they prompt for a username, password, and password
confirmation without echoing either password entry or placing it in command arguments.
Both bootstrap and recovery reject a mismatch without changing credentials; run the
command again to retry. Redirected input must supply all three lines in that order.
Passwords require at least
12 characters, uppercase/lowercase letters, and a digit.

For Docker, with the container running:

```text
docker exec -it pocket-monkey-preview dotnet /app/backend/PocketMonkey.Host.dll bootstrap-manager
docker exec -it pocket-monkey-preview dotnet /app/backend/PocketMonkey.Host.dll recover-manager
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
dotnet (Join-Path $revampPath 'backend/PocketMonkey.Host/bin/Release/net10.0/PocketMonkey.Host.dll') bootstrap-manager
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
`idempotency_conflict` codes. Reusing a retired transaction key through the opening
endpoint returns `transaction_history_expired` with HTTP 409.

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
Successful posts and matching replays of retained entries return the original entry with HTTP 200.
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

### Transaction Retention

Set `MONKEY_TRANSACTION_RETENTION_MONTHS` in the backend/container environment.
The default is `24`; `0` keeps unlimited transaction history. Positive integers
from `1` to `120` (10 years) are accepted; use `0` for longer retention.
Invalid values prevent startup. Restart the application after changing deployment
settings.

Ledger timestamps retain `DateTimeOffset` application/API contracts and full
100-nanosecond precision, using UTC `DateTime` provider values for indexed EF
queries. The `LedgerUtcDateTimeMapping` startup upgrade normalizes supported
existing UTC text without changing instants. Malformed, unexpected or nonzero-offset
stored timestamps abort the upgrade atomically with an unsupported-timestamp
diagnostic; investigate and correct the data before retrying, rather than guessing
an instant. Setting retention to `0` disables pruning, not upgrade validation.

Cleanup runs automatically at startup and daily in atomic batches of at most 200
entries. The cutoff is midnight on the first day of the current **UTC** month
minus the configured number of calendar months, clamped to the earliest
representable month. Only strictly older deposits, withdrawals and safely
credited allowance rows are eligible. `TZ` still controls allowance scheduling
and timestamp display, not cleanup.

Openings, exact account balances, financial audits, allowance revisions/executions
and minimal used-key records remain. Opening plus visible remaining deltas may
therefore no longer reconstruct the current balance. Retired keys cannot post
again: HTTP 409, `transaction_history_expired`. Sequence allocation remains
monotonic independently of remaining ledger rows.

History pages include `retentionMonths` and `retentionCutoffUtc`. Null cutoff
means unlimited; otherwise it describes eligibility, not completed deletion.
Pruning invalidates older cursors with HTTP 409, `history_retention_changed`.
The browser discards cached pages and restarts once; ordinary new postings still
respect snapshot pagination. Manager/Member read access and Manager-only writes
are unchanged. Cleanup failures leave committed batches intact and retry on a
later scan without taking readiness or financial posting offline.

There is no activation command. Keep recoverable backups as normal operational
practice. A restored database can be pruned immediately at startup: set retention
to `0` **before starting** a restore when cleanup must stay disabled. Increasing
retention cannot recover deleted details; restore a verified backup instead of
attempting a schema rollback. This policy does not erase retained metadata or
historical backups, and does not promise disk-space reclamation.

### Manual Built Preview

For a preview without watchers, build first and use two PowerShell terminals,
each with `revamp/` as its working directory. Choose free ports if needed.

Backend:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:MONKEY_DATA_PATH = Join-Path $PWD.Path '.local/dev'
$env:MONKEY_PUBLIC_URL = 'http://127.0.0.1:4180'
$env:TZ = 'Europe/Berlin'
dotnet run --no-build --configuration Release --project backend/PocketMonkey.Host --urls http://127.0.0.1:5180
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

On 2026-10-17, the Renovate updates to Express 5.3.0, Prettier 3.9.10,
Taiga UI 5.28.0, and Node 24.22.0 passed the Angular SSR and locked production-image
builds, E2E typechecking, catalog validation, and repository guardrails. Docker
and CI use Node 24.22.0, with the Docker base pinned to its verified digest; the
production image reports `v24.22.0`. The web dependency audit found no vulnerabilities.
All 38 selected production-image checks passed, covering desktop/mobile shell,
About, authentication, account/image workflows, offline assets, persistence,
configuration rejection, runtime/timezone agreement, and child-process failure.
After building the image, reproduce this set from the repository root:

```text
npm --prefix revamp/tests/e2e test -- specs/shell specs/authentication/workflows.spec.ts specs/authentication/about.spec.ts specs/accounts/workflows.spec.ts specs/accounts/images-workflows.spec.ts specs/lifecycle --workers 1
```

The same update raised the legacy application's central Application Insights
versions to 3.2.0 and Microsoft Identity Web versions to 4.16.1.
`dotnet build MONkEY.sln --configuration Release` restored and built successfully;
live Azure authentication and telemetry delivery were not tested locally.

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