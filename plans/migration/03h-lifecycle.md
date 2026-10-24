# Step 3H: management and lifecycle completion

Status: partially implemented. The approved shared About dialog and shell/login
entry points are implemented with explicitly marked review content. Release-ready
legal/notices content and the remaining lifecycle work are not complete. Depends
on the preceding features affected by each operation. Apply the
[milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

Complete remaining profile, instance-settings, legal, and lifecycle workflows
without corrupting balances or audit attribution. Review this backlog after earlier steps;
deliver each remaining workflow separately rather than treating it as one large task.

Account archival and user deletion/anonymization are removed from the product
scope by the user's decision on 2026-10-17, not deferred to a later release.
Existing user disablement remains available; do not add archival flags, screens,
cleanup jobs, or deletion/anonymization endpoints for these removed workflows.

## Current Work Order

On 2026-10-18, after postponing the unsatisfactory notice approach, the user
selected ORT and approved preparation and cleanup. Follow the
[ORT preparation guide](../../revamp/notices/README.md) and current
[ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md). The bespoke
audit dump and findings worksheet are superseded; preserve N09's first-party
artwork confirmation and the reusable exact-copy delivery checks. Detailed
scanning/review and About integration are not completed by this preparation.

Continue the remaining non-notice Step 3H work. Transaction retention follows the
approved [R1 and 2026-10-19 amendments](#transaction-retention-backenddata-proposal-r1)
and its [local delivery evidence](#retention-delivery-evidence-2026-10-19).
Final self-hosted operator/privacy wording and operations/deployment acceptance
remain separate work; postponing third-party work does not waive their gates.

On 2026-10-19 the user explicitly confirmed source-only GitHub publication first,
with Docker images and releases later. Put ORT setup, comprehensive third-party
dependency/asset review and complete About notice integration at the end of the work order,
after the repository can become public and before image/release distribution.
This supersedes the earlier blanket pre-publication timing, not the obligations:
source publication still requires rights and applicable notices for included
code/assets plus review of repository history for private data or credentials.
No public visibility change, image publication or completed rights review is
authorized or claimed by recording this sequence. Existing notice placeholders
are development material, not approved distribution notices.

The user further selected staged notice delivery on 2026-10-19: first provide a
handcrafted, reviewed set covering Angular, .NET, ASP.NET Core, Entity Framework
Core, SQLite, Taiga UI, Lucide and Roboto, with actual identities/versions and
required original texts. Include SQLite's provider/binding/native bundle chain,
distinguishing the public-domain engine from separately licensed wrappers.
Its initial About presentation need not wait for ORT; follow existing UI review
gates when implementing it. Then expand coverage and fill gaps using ORT and
supplemental review at the end of the work order. Keep the first set explicitly
partial, not an assertion that the selected names cover everything shipped. The
user explicitly accepts known initial coverage gaps; that is not a completed
review or an assertion that redistribution obligations are satisfied. This
does not authorize postponing required notices for material already distributed;
preserve accompanying upstream material and resolve distribution obligations or
withhold the affected artifact. See the
[staged delivery checklist](../../revamp/notices/README.md#staged-delivery).

The approved manual proof is implemented locally, not an ORT setup:
the user requested a manual-first package/component-to-About mapping with explicit
artifact locations and associations. See
[manual mapping concept R1](../../revamp/notices/README.md#manual-mapping-concept-r1).
It uses separate component, About-entry and original-document records, then
one deterministic assembly path reusable by later automation. On 2026-10-19 the
user explicitly approved R1 with "okay approved" after the ownership review and
Roboto example. ADR-0020 records the tracked-originals/generated-root ownership.
The [two-entry delivery evidence](#manual-mapping-proof-2026-10-19) covers one
managed package and Roboto. On 2026-10-19 the user approved the About design review
and explicitly confirmed reuse of the existing R4 dialog and matching prototype
for real notice data, keeping layout and interactions unchanged. That approval
closes the reuse gate: render the mapped data in the existing presentation, then
extend the agreed initial set. Future design changes retain their separate gates;
ORT remains later work.

On 2026-10-24 the initial manual About set reached all eight agreed component
groups: Angular, .NET, ASP.NET Core, Entity Framework Core, SQLite, Taiga UI,
Lucide and Roboto. SQLite includes its provider/binding/native chain and the
separately identified public-domain engine. See the
[collection and local verification record](../../revamp/notices/README.md#sqlite-provider-bindings-and-engine-2026-10-24).
Coverage remains explicitly partial; this does not close comprehensive ORT,
transitive/runtime/OS review, source-publication rights or release acceptance.

The user then explicitly approved the R6 notice hierarchy wireframe and its
matching click prototype on 2026-10-24 ("prototype approved, implement").
The [Angular delivery record](../../revamp/README.md#grouped-notice-documents-r6-2026-10-24)
documents package/license applicability groups, independent document expansion,
unchanged original texts and the passing focused production-image/localization
checks. This presentation revision does not close the remaining release gates.

The user's subsequent 2026-10-19 request moved the full project license to a
dedicated tab without expansion and corrected login-prototype centring. The login
prototype correction was initially a locally verified draft; it was explicitly
approved with the surface revision on 2026-10-23. About R5 adds Project license
as the second of four tabs. See the [design review record](../../docs/design/README.md#current-drafts-2026-10-19).
On 2026-10-19 the user explicitly confirmed "Wireframe approved" for the current
R5 references, including the current project-license source/annotations. The
wireframe gate is satisfied. The shared R5 About click prototype is now updated
and verified: separate project-license tab, immediately visible full
AGPL text, no accordion and stable scrollbar gutters. Forty review cases passed
(12 public review, 24 signed-in and four login form-preservation checks), with
desktop/phone screenshots inspected and no script errors. Hidden-browser control/
keyboard-handler checks used DOM-dispatched events rather than native input.
The offline license copy was regenerated to match root text exactly after
detecting CRLF/LF drift. The user explicitly approved the current R5 prototype on
2026-10-19 with "prototype approved, create a commit with it" and selected all
pending About/notice work for that commit. Both R5 design gates are satisfied.
The dedicated Angular license tab was implemented on 2026-10-23 and committed
in `7b6f917`, alongside the approved tonal styling. Eight production-image About
checks passed across desktop/mobile public, Manager, Member and forced-password
flows. Eight separate English/German, light/dark layout checks passed at
1440px/360px; desktop and 320px phone license screenshots were inspected.
See the [current Angular delivery record](../../revamp/README.md#four-tab-about-delivery-2026-10-23).
These checks do not approve final legal wording or complete notice coverage.

## Decisions before implementation

- Transaction-retention R1 and its automatic-cleanup, UTC-boundary and history-contract amendments are approved; keep this separate from the removed account/user lifecycle workflows. Local implementation checks do not waive hosted or release acceptance.
- Draft new self-hosted legal information consistent with the selected AGPLv3-only license and review wording/acceptance requirements before publishing it. Do not reuse the cloud terms or privacy declaration as the replacement's legal text.
- Agree which sensitive actions require confirmation and re-authentication.

## Work

- Review existing milestone 2 user/role administration, password flows, last-manager protection, and personal language preferences; implement only remaining agreed profile/management gaps.
- Preserve language selection before login and saved preferences for both roles; do not rebuild the foundation selector or grant business writes through personal preferences.
- Add agreed instance-settings workflows, not tenant creation/selection/invitation/deletion or email settings.
- Deliver reviewed legal content/acceptance flows with German/English UI where required by the agreed self-hosted product scope.
- Protect ledger/audit integrity and immutable actor IDs; expose only explicitly agreed destructive actions with suitable confirmations/re-authentication.

## Self-hosted legal content and license

Direction requested by the user on 2026-10-17. AGPLv3 was explicitly selected
later that day ("yes, AGPLv3 it is"), with version 3 only recorded in
[ADR-0018](../../docs/ADR/ADR-0018-project-license.md) and the root [LICENSE](../../LICENSE).
Commercial use remains permitted subject to AGPL source-sharing obligations;
the earlier commercial-permission restriction is not part of the chosen license.
The general bilingual wording is approved as recorded below; deployment-specific
publication review remains open. No in-app acceptance flow is approved.

The [self-hosted information R1](../../docs/terms/self_hosted_legal_information.md)
records German and English operator, warranty/liability and privacy wording,
approved by the user on 2026-10-23: "sounds good, lets keep it".
It distinguishes the operator from household users and
project maintainers, preserves AGPL rights, and explains shared-account visibility
and the limits of transaction-detail retention. Its deployment-specific review
questions remain open; wording approval does not establish legal enforceability
or deployment-specific readiness. The shared About prototype now presents the
accepted wording. After verification, the user requested "implement" on
2026-10-23, accepting the current presentation for Angular implementation.
Standalone verification passed 12 offline browser combinations, followed by 16
integrated combinations with both roles and real navigation. See the
[presentation review record](../../docs/design/prototypes/README.md#legal-content-presentation-2026-10-23).
Angular now presents the accepted bilingual paragraphs and privacy caveat.
Production-image build/catalog/type checks, eight focused production-image About
checks and eight separate bilingual/theme layout checks passed; see the
[delivery record](../../revamp/README.md#legal-information-delivery-2026-10-23).
The existing cloud documents are unchanged. No consent state or acceptance gate
is introduced; deployment-specific legal review remains open.

Final user acceptance on 2026-10-23: "very well, all approved, whats next?".
The current legal wording, prototype presentation and Angular delivery are
accepted; committed as `9ab7739`. The next staged notice slice now adds Angular's
eight locked `22.2.3` runtime packages under the existing catalog/original-document
contract, sharing their byte-identical MIT original. All 24 build-input checks
and nine production-image About/offline checks passed; see the
[Angular notice record](../../revamp/notices/README.md#angular-runtime-packages-2026-10-23).
The remaining initial components, Angular's separate dependencies, ORT and
comprehensive release coverage remain later work. This acceptance does not
authorize publication or claim deployment-specific legal readiness.

- Write fresh German and English self-hosted terms/operator notices. Leave the [existing cloud usage terms](../../docs/terms/usage_terms_v1_0.md) and [cloud privacy declaration](../../docs/terms/data_privacy_declaration_v1_0.md) unchanged for the independently runnable Azure application. Do not carry over a central service operator, cloud support contact, availability promise, or account/data-deletion promise.
- Distinguish the instance operator from ordinary household members: the person running the instance is responsible for its hosting, access control, HTTPS/network exposure, persistent storage, backups and restore, configuration, and installing application/dependency/security updates. Using an old version is not a project-provided managed service.
- Explain that the community project supplies software, not hosting or a service-level agreement. Provide an "as is"/"as available" disclaimer and no promised availability, fitness, correctness of balances, continuing maintenance, support, or security-update schedule, to the extent permitted by applicable law. These disclaimers do not justify weakening implementation or verification requirements.
- Do not promise an absolute exclusion of every warranty or all liability. Review applicable mandatory law and the chosen license's standard disclaimer; additional operator information must not contradict the license or remove recipients' OSS rights. Treat the text as a reviewable draft, not legal advice or a guarantee of enforceability.
- Keep instance privacy information separate from the software license: describe actual data processing and operator responsibilities rather than implying that project maintainers host household data. Review any privacy obligations applicable to the deployment; do not copy cloud-provider wording or assume all deployments have identical legal requirements.
- Use the selected `AGPL-3.0-only` license and its unmodified standard text. Identify the copyright holder(s), confirm rights to license project/contributed code, and review third-party compatibility and required notices before publication. License selection does not close those checks or authorize inventing copyright attributions.
- In-app visibility, acknowledgements, version tracking, or mandatory acceptance are separate design decisions. Do not add per-user consent state, an acceptance endpoint, or a registration gate without the relevant UI and backend/data review.

### About page and third-party notices

The user requested a third-party components view and an About page bringing
the related information together on 2026-10-17. This records the feature
requirement, not approval of a layout or implementation.

- Provide one About page, labelled "About" / "Info", as the home for the product name, running version/build, GitHub project link, matching source access, project license, and third-party notices. Placement agreed by the user on 2026-10-17: an info-icon About entry below Administration (called Settings in the discussion) in the bottom sidebar group, with the smaller build version beneath; the same order in the mobile drawer. Login has a version/About footer. Move GitHub into About rather than retaining a second footer link. This placement agreement does not approve the [R1 wireframes](../../docs/design/README.md#reference-inventory).
- Make the page and notices readable without signing in and by either role. Do not expose household/user data, deployment secrets, or sensitive diagnostics, and do not add an acknowledgement or consent gate. Retain the unavailable GitHub placeholder until the future repository URL is agreed; do not invent a repository or corresponding-source URL.
- Presentation refinement requested on 2026-10-17: open one shared About dialog from login and the app, near-full viewport on desktop and full-screen on phones. Close replaces Back; Close/Escape restore focus to the opener while preserving the underlying view/form. Trap modal focus and make the background inert. Keep header/tabs visible while content scrolls internally. Retain the current language/theme; no separate signed-out content version. The user explicitly approved the resulting three R4 wireframes and matching shell/login entry-point notes, including annotation arrangements and exported previews, on 2026-10-17 ("approved").
- Subsequent refinement requested on 2026-10-17: login uses `Version | About` without an info icon; the user selected retaining the About text in the main menu and moving Administration (called Settings in discussion) directly below Overview. The user explicitly approved the current wireframes ("wireframes approved"), including their shell icon-placeholder edits and annotation arrangement, on 2026-10-17. The menu move is now applied to every shared-shell prototype: Overview, Administration, Manager-only Accounts, with labelled About at the bottom above the version. The three approved R4 About tab layouts are unchanged. The shared dialog and changed shell/login prototypes are verified as recorded in the [design index](../../docs/design/README.md#reference-inventory), but still require explicit prototype approval before Angular implementation.
- Tab names/content split agreed on 2026-10-17: Overview / Übersicht is the default tab with project/version/source information and the project license. Third-party notices / Drittanbieterhinweise contains component search, licenses, and attributions. Legal information / Rechtliche Hinweise is the last tab and brings operator responsibilities, warranty/liability information, and privacy together on one page as distinct sections; remove the operator/privacy links from Overview. This agreement does not approve the resulting R3 wireframe layouts or legal wording.
- Identify the project's license as `AGPL-3.0-only` and make its full unmodified text available locally. Keep source access matched to the running release/revision, consistent with [ADR-0018](../../docs/ADR/ADR-0018-project-license.md).
- Present third-party component names, shipped versions, license identifiers/names, required copyright/attribution and NOTICE content, and complete applicable license texts. Component/source links can supplement, but not replace, locally readable required material. Long notices may use expandable sections or linked detail views; that interaction remains subject to design review.
- Cover shipped frontend/backend dependencies, including transitive dependencies, bundled fonts/icons/assets, and applicable container/runtime components. Derive and review the inventory from resolved build/release inputs; distinguish shipped components from development-only tooling. SPDX identifiers or a direct-dependency manifest alone are not a complete notice inventory.
- Bundle release-matched notices in the application and distributions, review multi-license choices and compatibility, and preserve authoritative legal texts rather than substituting unofficial translations. Local viewing must not require external network access. The page does not replace distribution notice or corresponding-source obligations.
- Use German/English navigation and explanatory UI. Present reviewed operator/privacy information as distinct sections in the last Legal information tab, separate from the software license and third-party notices. Their final wording remains pending the legal-content review above.
- The user explicitly approved all three then-current R1 wireframes (About, application shell, login), including their source edits and annotation arrangement, on 2026-10-17; see the [design index](../../docs/design/README.md#reference-inventory). Subsequent removal of stale draft labels was authorized as housekeeping. R2's two-tab layout remained a draft. The user then explicitly approved all three then-current About R3 tab wireframes (Overview, Third-party notices, Legal information), including annotation arrangements, on 2026-10-17 ("draw.io wireframes approved"). Those approvals remain history. The subsequent explicit R4 approval recorded above satisfies the current wireframe gate; next is the shared About dialog click prototype and affected shell/login prototype updates under [ADR-0013](../../docs/ADR/ADR-0013-wireframes-and-click-prototypes.md). Separate explicit prototype approval is still required before Angular implementation. Inventory tooling, legal wording, and any required backend contract remain to be evaluated separately.

The user explicitly approved the current About dialog and updated shell/login click
prototypes on 2026-10-17 ("Approve all three current prototypes; commit and implement
Angular"). Both UI design gates are satisfied; proceed with the shared Angular dialog
and approved entry points. Earlier draft/prototype-gate notes above record the review
sequence, not an outstanding gate. Legal wording, inventory completeness and future
repository/source URLs remain unresolved and are not approved by the layout decision.

### Angular delivery evidence (2026-10-17)

The requested pre-implementation commit is `ef89c09` (`Approve About dialog designs
and adopt AGPL-3.0-only`). The subsequent Angular implementation is delivered
separately from that design/license commit.

- [AboutDialog](../../revamp/web/src/app/components/about-dialog/about-dialog.ts) is hosted once by the root application. [AboutService](../../revamp/web/src/app/services/about/about.service.ts) opens the same dialog from public login/forced-password-change and either signed-in role; no backend contract, authorization rule, consent state, or persistence changed.
- The existing native modal has an opt-in full-size layout. Header/tabs remain fixed while content scrolls; keyboard tab navigation, native modal background inertness, Close/Escape, opener focus return, and preservation of the underlying form/view are verified. Ordinary modal layout remains unchanged.
- Login uses text-only `Version | About` / `Version | Info`. Shell order is Overview, Administration, Manager-only Accounts, then labelled About at the bottom above the smaller version. The former unavailable GitHub footer link moved into About.
- The Overview tab uses the actual web package version, currently `0.0.0`, and explicitly reports that this build does not supply its source revision. Repository and version-specific source links remain unavailable rather than inventing release metadata. Both inline project-license text and the local license-file link match the canonical root license exactly.
- Third-party rows remain the approved illustrative placeholders, not a complete shipped inventory. Operator responsibilities, warranty/liability, and privacy use the approved placeholder wording, not legally reviewed release text. Required rights/compatibility review, release-matched notices/source metadata, and final legal wording remain open; the About acceptance checkbox below is intentionally not complete.

Commands run from the repository root:

```text
npm --prefix revamp/web run build
npm --prefix revamp/web run check:catalogs
npm --prefix revamp/tests/e2e run check
docker build --file revamp/deploy/Dockerfile --tag pocket-monkey:foundation revamp
npm --prefix revamp/tests/e2e test -- specs/shell specs/authentication/about.spec.ts specs/authentication/workflows.spec.ts --workers 1
```

The final production image passed **21 checks**: eight About cases across desktop
and mobile plus nearby authentication, SSR/hydration, local-asset, and failure
regressions. About coverage includes both roles, a 320px public viewport, form
preservation, keyboard tabs, matching/empty search, component expansion, native
modal inertness, exact inline/file license fidelity, pinned header, and focus
return after Close/Escape. The public workflow blocks external requests and
asserts no browser errors. Catalog/compiler/type checks and scoped new-file
formatting checks also passed.

Separate from the English E2E suite, a real-browser German localization review
checked all three tabs at actual 1440px/320px widths in light/dark themes (12
layout combinations), translated runtime-name search, and absence of browser
errors/overflow. Uncropped screenshots were captured beneath the ignored
`revamp/.local/about-review/`; desktop Overview and phone notice/legal screens
were inspected. These local checks do not waive hosted/release gates or constitute
application-wide visual or legal acceptance.

### Subsequent UI corrections (2026-10-17)

The user subsequently requested a borderless account-image pencil badge and
Administration always last in the top navigation group. The earlier menu-order
descriptions above record the initial delivery, not the current order. The user
explicitly approved the revised shell wireframe and existing borderless badge
prototype ("Approve both current references"), then separately approved the
revised shell prototype ("Approve current shell prototype and implement Angular").
The [design index](../../docs/design/README.md#review-rules) records these approvals.

Angular now matches both references: the image badge is a centered 26px circle
with no border and an opaque theme-aware panel background; the button's keyboard
focus outline is retained. Menu order is Overview, Manager-only Accounts,
Administration, with About still anchored at the bottom above the version.
The shell wireframe PNG was re-exported and inspected without changing the
user's annotation arrangement, and the shared prototype passed 16 combinations
of role, language, theme, and desktop/phone width.

The final production image passed **eight checks** using the following command
from the repository root after the documented image build:

```text
npm --prefix revamp/tests/e2e test -- specs/accounts/images-workflows.spec.ts specs/authentication/about.spec.ts --workers 1
```

Coverage includes borderless/centered/panel-background badges in light/dark,
upload/replacement/removal and Member read-only behavior, both roles' menu order,
About focus/navigation preservation, and forced-password-change preservation on
desktop/mobile. The phone badge screenshots in both themes were inspected.
Angular production build, compiler, and E2E type checks passed. No backend or
About-content behavior changed, and the pending legal/source/inventory gates
remain unchanged.

## About content update process

### R1: build inputs, generated assets, and review gates

The notice generation/reconciliation parts of this R1 are superseded by the
[approved simplification](#approved-notice-simplification-2026-10-18) and
[ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md). Retain
them as proposal history; application/build identity and project-license
generation remain in force.

On 2026-10-17, the user accepted clarifying this process before further Step 3H
implementation ("sounds good, let use the recommendation"). The accepted direction
is one application version, build-specific source information, mechanically
synchronized project-license copies, generated/reviewed third-party notices,
and separately maintained legal documents. This R1 makes that direction concrete;
generator/scanner choices, new artifact schemas, final legal wording, and future
repository URLs remain proposals or unresolved inputs, not approved release content.
Follow [ADR-0006](../../docs/ADR/ADR-0006-github-delivery.md),
[ADR-0007](../../docs/ADR/ADR-0007-application-foundation.md), and
[ADR-0018](../../docs/ADR/ADR-0018-project-license.md).

#### Authoritative inputs and outputs

| Area | Authoritative input | Build/distribution output |
| --- | --- | --- |
| Application identity | Proposed single version source: [web package](../../revamp/web/package.json), with its lockfile root version kept equal. Release tag must be exactly `v<version>`, including any prerelease suffix. | The same application version in About, shell/login version labels, OCI labels, and release assets. Framework/package versions remain separate component versions. No manually maintained second application version. |
| Build identity and source | Full Git commit and clean/dirty state captured before Docker packaging; the agreed public repository URL. Docker's `revamp/` context does not contain the repository root or Git metadata. | Build metadata bundled into the tested image; immutable revision-specific source links for clean builds, plus matching release source access. Local/PR builds are identified as development builds; dirty or unavailable provenance must not be presented as release-matched source. Release builds require clean, known provenance and matching tag/version/commit. |
| Project license | Canonical root [LICENSE](../../LICENSE), `AGPL-3.0-only`. | Mechanically generated inline text and downloadable local file through the [build-input generator](../../revamp/web/scripts/prepare-about.mjs), replacing manually synchronized copies. Preserve the authoritative text exactly and verify equality. |
| Third-party notices | Resolved production npm dependencies and bundled browser/server output; NuGet lockfiles and published backend assets; exact runtime/base-image inputs, final OS package inventory, and bundled fonts/icons/images. | Release-matched component identities, versions, license expressions, applicable attributions/NOTICE content, and full license texts. Track provenance and content hashes. Include transitive, embedded, native, runtime, and redistributed asset components; exclude build-only tools unless their material actually ships. |
| Operator/privacy information | Separately maintained German/English source documents, with stable document IDs, explicit revisions/review dates, and reviewed wording. | Locally bundled documents and their revisions, independent of the application version. Preserve prior revisions in Git. A language is not current until its matching revision is reviewed; package updates never silently rewrite these texts. No per-user consent or acceptance storage is introduced. |

#### Generation and update triggers

1. Before development/CI packaging, capture application/build identity and derive
	the project-license assets from the root source. Generate into build outputs;
	do not require maintainers to edit duplicate license text or component versions
	inside [AboutDialog](../../revamp/web/src/app/components/about-dialog/about-dialog.ts).
2. Collect the notice inventory from the actual locked build and final runtime
	inputs, not only direct dependency manifests. Dependency/lockfile, publish,
	runtime/image, OS-package, or bundled-asset changes regenerate the inventory
	and expose a reviewable added/changed/removed diff. A scanner or SBOM alone
	does not establish complete notices, license compatibility, or licensing rights.
3. Keep reviewed exceptions, multi-license selections, and missing metadata
	resolutions as explicit source-controlled inputs tied to component/version
	identity and authoritative evidence. Do not guess licenses or copyright holders.
	Evaluate tooling against the shipped npm/NuGet/runtime/asset scope before choosing it.
4. Assemble the metadata, license texts, notices, and legal documents during the
	production build, before the image is tested. Inventory the final runtime
	contents without counting build-stage tools. Reconcile the bundled inventory
	against the completed image; never rebuild or mutate it after verification.
5. Render these static artifacts through the existing approved About layout and
	bundled translations. No new backend endpoint, user data, consent gate, runtime
	registry/GitHub lookup, or external dependency for reading documents is needed.

#### Verification and publication gates

- Development builds may retain explicit unavailable/review states; generation/schema/source-fidelity checks must still run. Such states do not become release-ready merely because the ordinary build passes.
- Release verification rejects missing/dirty source identity, tag/version/lockfile disagreement, unavailable repository or matching source access, illustrative component rows, unresolved notice/rights/compatibility review, and unreviewed or mismatched German/English legal revisions. Text hashes detect drift, not legal approval.
- Verify deterministic generated content for the same recorded inputs; persist the inputs and approved overrides with release evidence. Verify that shipped component versions agree with the notice inventory, local texts match their authoritative inputs, and downloadable assets/checksums match the tested distribution.
- Extend real-image coverage for public login and both signed-in roles: version/source agreement, search and complete local notice texts, license fidelity, long-content keyboard/mobile behavior, and reading while external networking is unavailable. Keep the established separate catalog/localization checks; do not duplicate workflows by language.
- Integrate the checks with the [build/release plan](builds-releases.md#about-content-and-release-inputs). Passing them does not authorize publishing, waive application-wide acceptance, or complete the remaining legal/source review.

#### Delivery order

1. First implement application/build metadata and automatic project-license
	synchronization, with checks for local/development and tagged-release inputs.
2. Establish the ORT dependency/license overview and reviewed local notice document under
	[ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md), complete
	the human review, then integrate reviewed notices into the approved About UI.
3. Review and bundle final German/English operator/privacy/warranty information;
	finish repository/source URLs and content completeness checks.
4. Exercise the complete artifact and release gates during the existing
	non-publishing rehearsal and later operations/release work. Transaction retention
	remains a separate backend/data design review, not part of this pipeline.

### Build metadata and license implementation

The user authorized the first implementation slice on 2026-10-17 ("proceed").
[ADR-0019](../../docs/ADR/ADR-0019-build-identity-and-about-assets.md) records the
accepted application/build identity and automatic license-synchronization rules.
Notice tooling, final legal wording/revisions, public repository URLs, and
publication remain outside this delivered slice.

- The [generator](../../revamp/web/scripts/prepare-about.mjs) uses the web package as the sole application SemVer input, verifies both lockfile version fields, and captures commit/cleanliness without borrowing an unrelated parent repository's identity. Generated files are ignored; the former tracked license copies are removed.
- Npm build/server entry points prepare the metadata and exact inline/downloadable license assets. Login, shell, and About consume the same generated identity; German/English build labels distinguish release, clean development, dirty development, and unavailable revision states. The public metadata asset contains no household data or secrets.
- The [Docker wrapper](../../revamp/web/scripts/build-image.mjs) prepares the restricted build context and passes matching OCI labels. The in-container generator validates snapshot/license/label agreement; the wrapper rechecks inputs after building. CI runs isolated build-input checks and uses the wrapper; no publishing permissions or release job was added.
- Release identity validation rejects mismatched or non-HEAD tags, dirty/unknown provenance, inconsistent versions, and missing/unsafe repository URLs. No future repository URL is invented. A valid clean revision link alone does not satisfy all Corresponding Source or release-content obligations.
- The existing real-image About tests now verify package/UI/OCI identity agreement and canonical license/hash fidelity. Offline runtime coverage includes metadata and license assets. Reproducible commands and watch-mode behavior are in the [foundation guide](../../revamp/README.md#build-metadata-and-license-generation).
- Build-only `devDependencies`, including the metadata parser, are excluded from delivered-component notices unless their material actually ships. Inventory generation and its review remain pending; illustrative third-party rows have not been replaced.

Verification on 2026-10-17 passed **13 isolated real-Git build-input checks**
and **23 production-image checks**, including public/Manager/Member About behavior,
SSR/hydration, canonical license/hash fidelity, UI/static/OCI identity agreement,
and offline runtime assets. The isolated checks cover strict versions and
prereleases, mismatched/missing/non-HEAD tags, dirty release rejection, unsafe or
missing repository URLs, stale outputs, tampered snapshots, label disagreement,
determinism, and unavailable/unrelated-parent Git provenance.

Commands run from the repository root:

```text
npm --prefix revamp/web run check:about
npm --prefix revamp/web run check:catalogs
npm --prefix revamp/web run build
npm --prefix revamp/tests/e2e run check
npm --prefix revamp/web run build:image
npm --prefix revamp/tests/e2e test -- specs/shell specs/authentication/about.spec.ts specs/authentication/workflows.spec.ts specs/lifecycle/runtime.spec.ts --workers 1
node plans/migration/verify-guardrails.mjs
```

Separate German browser review passed at actual 1440px/320px in both light/dark
themes: four combinations, no revision/link overlap, overflow, or browser errors.
Desktop/light and phone/dark screenshots were inspected under ignored
`revamp/.local/build-metadata-review/`. The temporary review container was removed;
no preview was left running. Release-input validation uses isolated fixture tags
and an example repository, not an approved public project URL or publishing
rehearsal. Hosted execution, complete notices, legal review, Corresponding Source
delivery, and publication remain unverified/open.

### Inventory collection implementation (2026-10-18)

**Historical evaluation, superseded below.** Its local checks are retained here
as evidence of that experiment, not requirements for current builds.

The user authorized continuing with the inventory collector after confirming the
preceding revision passed GitHub checks. The evaluated hybrid approach is retained
as an alternative in [ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md);
the current process is in the
[maintained build guide](../../revamp/README.md#third-party-notices).

- Angular statistics select positive emitted-byte npm contributions and copied assets. NuGet collection now runs in an intermediate Docker stage using that build's locked restore, package archives and published output. Structured XML/ZIP parsers remain build-only.
- NuGet evidence preserves declarations, copyright and original license/NOTICE bytes, separates locked content hashes from signed-archive hashes, and verifies actual published bytes against archive entries. Build-only exclusions and metadata-only dependencies remain explicit.
- Final-image collection verifies embedded build identities and published hashes, then runs digest-pinned Syft 1.54.1 against the exact exported image with no container networking or Docker socket mount. The OCI index/configuration mismatch is resolved by hashing exported configuration bytes, not by weakening identity checks.
- Combined evidence links native binaries to verified NuGet payloads, retains upstream Node/.NET notices and distinguishes first-party assemblies. Temporary exported archives/backend copies are removed; raw SBOMs and reconciled JSON remain ignored review outputs. CI collects those outputs in a separate short-lived diagnostic artifact with existing read-only permissions.

The real-image scan identifies **112 web components**, **18 NuGet dependency
identities** (17 with published payload, one metadata-only), **141 runtime/image
records**, and **two copied-asset groups**. These sets overlap and must not be
summed as a distinct-component count. All 18 NuGet identities match scanner
evidence; no published NuGet payload is undetected. Twenty restore packages are
excluded as build-only. Existing redistributed Windows/macOS/native architecture
payloads are included without advertising execution support for those platforms.

All **12 isolated inventory input checks** pass: deterministic normalized evidence,
original text/binary fidelity, native ownership inputs, metadata-only/build-only
distinction, lock/version/hash agreement, archive/publish tampering, nuspec identity,
file-based licenses, missing declared text, unsafe paths and ambiguous frameworks.
Actual Linux production-image build and final-image reconciliation pass locally.
Repeating collection for the same immutable image produces identical reconciled
JSON, including its source-evidence hashes. Ten production-image checks also pass:
public/Manager/Member About, forced-password-change preservation, exact project
license/hash identity, desktop/mobile behavior, offline assets/no development
executables, and Linux Node/.NET globalization. The final image contains neither
the NuGet cache nor web `node_modules`/build directories.

The experiment used isolated inventory fixtures, a real image build, repeated
final-image scans, the focused About/runtime E2E suite and the guardrail validator.
Its collectors and their npm commands are now removed. This slice was not
verified on hosted CI before supersession.

**Not complete:** three runtime records still lack declarations and 109 lack
attached full text. These are evidence-coverage flags, not a legal conclusion;
shared/common-license and embedded-code review is still required. Resolve missing
NuGet texts, Debian/common licenses, runtime/native attributions, font version and
artwork rights through the maintained local document and human release review.
About's illustrative rows, final operator/privacy
wording and public source URLs remain unchanged. Successful collection does not
mark notices reviewed, mutate a tested image or authorize publication.

### Approved notice simplification (2026-10-18)

**Historical preparation, refined by the ORT selection below.** The seeded dump
and worksheet described here are no longer current inputs or review evidence.

The user explicitly approved replacing the mandatory hybrid inventory approach
with a simple reviewed component list and local required texts, without replacing
obligations with external links. [ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md)
records that choice, retaining the earlier automated approach under Alternatives.
The user explicitly approved merging ADR-0020 and ADR-0021 on 2026-10-18, then
approved maintaining one authoritative record per topic under
[ADR-0001](../../docs/ADR/ADR-0001-architecture-decision-records.md). Approved
decision changes now update that topic's record with concise dated rationale;
separate supersession records are not mandatory.

- Removed the three collectors, fixture suite, XML/ZIP parser dependencies, automatic Angular statistics, intermediate Docker inventory stage and mandatory CI scan/artifact upload. Normal build/version/project-license generation and upstream runtime notices remain intact.
- The single maintained [root notice document](../../THIRD-PARTY-NOTICES.txt), beside the project license, contains the component index and available license/copyright/NOTICE texts. The existing preparation helper copies its exact bytes into ignored Docker inputs and generated assets with freshness checks; Angular bundles that copy without regenerating its content. The initial draft was mechanically seeded once from existing audit evidence and upstream OS/runtime files, sharing only identical texts and retaining explicit associations.
- The short [review checklist](../../revamp/notices/README.md) covers shipped dependency/transitive/native/asset/runtime changes, final installed OS inputs, optional initial/release audits and independent source/relinking checks. No generic templates or package links silently resolve missing material.
- The existing network-disabled image test checks availability and byte fidelity. The baseline remains explicitly draft; complete attribution, missing texts, rights, compatibility and release review are not implied by successful copying or test results.
- About remains on its approved illustrative UI. Integrating the reviewed document/content, final operator/privacy wording, source URLs and publication remain open; no design approval or release gate has been inferred from the simplification approval.

Local verification on 2026-10-18 passed the simplified production-image build,
E2E TypeScript check, all **10 focused About/runtime image tests** (including exact
offline notice bytes), and the guardrail validator. Lockfile synchronization
reported zero audit vulnerabilities. The one-time seed check preserved all 273
source-text occurrences as 176 distinct texts with associations and LF endings;
the seed utility was then removed. Hosted verification of this simplification and
the substantive licensing/rights review remain open. No preview, commit, push or
publication was performed.

### ORT selection and cleanup (2026-10-18)

The user explicitly selected ORT and requested preparation plus removal of
superseded material. [ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md)
now selects ORT's dependency/license overview; original notice collection may
remain manual. The [preparation guide](../../revamp/notices/README.md) replaces
the bespoke findings worksheet and preserves the supplied N09 artwork-authorship
confirmation. The large unreviewed root audit dump is replaced by an explicit
development-only placeholder, not a claim that notices are no longer required.

Keep the existing exact-copy packaging, freshness and offline delivery tests,
project-license/build metadata, and upstream runtime/OS notices. Do not restore
the bespoke collectors or mandatory image reconciliation. ORT version pinning,
tested invocation, reports and supplemental coverage remain implementation work;
no scan or licensing approval is claimed. Complete reviewed distribution texts,
source obligations and About integration remain release gates.

### Manual mapping proof (2026-10-19)

Approved R1 is implemented with EF Core `10.0.12` and all four local Roboto
`3.015` font files. The [catalog](../../revamp/notices/catalog.json) binds exact
component/version/license identities to retained upstream MIT/OFL originals,
About entries, provenance and hashes. Roboto's name tables were inspected with
disposable fontTools `4.61.1`, consistent with the user's Google Fonts source.
No project Python dependency or custom font parser was added.

The assembler generates the tracked root bundle and ignored About JSON/document
assets from those inputs. Normal preparation rejects stale assembled output;
the container snapshot retains originals, catalog and evidence. Packaged builds
check captured input integrity and actual web evidence. Coverage is explicitly
partial and therefore cannot pass release-input validation.

Local delivery evidence:

- 24 isolated `check:about` checks passed, including grouped/shared documents,
	LF/CRLF original fidelity, duplicate/dangling references, version/hash/path
	rejection, prepared-input drift and release validation.
- Real `prepare:about` and its `--check` mode passed; `build:image` built the
	production artifact with the new metadata and individual original texts.
- E2E TypeScript check and three production-image checks passed: the existing
	network-disabled runtime check verifies mapped entries and served original
	hashes against the catalog, and public About passes on desktop/mobile.

See the [manual proof guide](../../revamp/notices/README.md#implemented-manual-proof-2026-10-19)
for reproducible commands, paths and evidence fields. This assembly proof did not
change the UI artifacts; the subsequent approved reuse is delivered below.
No full initial collection, ORT scan, complete distribution review, hosted CI or
publication approval is claimed.

### About mapped-data delivery (2026-10-19)

The user explicitly approved the About design review and confirmed "Yes, reuse
the existing design for real notice data". The current R4 wireframes and matching
click prototype remain unchanged; approval covers reusing their layout and
interactions, not legal wording or complete component coverage. Approval and
verification are recorded in the [design index](../../docs/design/README.md#reference-inventory).

About now uses the generated catalog instead of illustrative component rows.
Grouped entries retain each member's exact version, license and original-document
association. Full original texts render as escaped text, with local download
links. Names, versions and license identifiers are searchable. German/English UI
labels and the partial-coverage warning are included; original legal texts remain
untranslated. No backend contract, runtime download, consent state, layout or
legal-tab wording changed.

Angular build, catalog validation, E2E typecheck and production-image build passed.
The focused About/offline command in the manual proof guide passed all nine tests:
public desktop/320px real notices, exact inline text/download hashes, keyboard
expansion/search, both roles, forced-password form preservation and offline assets.
English desktop/mobile screenshots were inspected. Four German browser checks at
1440px/360px in light/dark verified translated labels and original-text wrapping
without horizontal overflow or script errors. Remaining initial collection and
ORT expansion remain separate work; no release approval is implied.

A subsequent scrollbar-stability fix on 2026-10-19 reserves balanced gutter space
in the About scroll area. Before the fix, expanding a component or the AGPL text
moved the centred desktop panel left by 7.5px as a 15px scrollbar appeared; the
same browser measurement now reports no shift. The production-image build,
E2E typecheck and both public desktop/mobile About checks passed, with regression
assertions for unchanged panel position and width on each expansion. This restores
the approved centred presentation without changing layout or interactions.

## Transaction retention discussion

Configuration policy accepted by the user on 2026-10-17 ("you retention proposal
sounds good to me"). This accepts the setting and values below, not a backend/data
cleanup design or authorization to delete existing transactions.

- Accepted: Docker environment setting `MONKEY_TRANSACTION_RETENTION_MONTHS`, default `24`, positive values from `1` through `120` (10 years), and `0` meaning unlimited retention. The maximum was accepted on 2026-10-19; use `0` when more than 10 years are needed. Configure duration independently of `TZ`; the range is a product choice, not a SQLite limit. Disabling cleanup cannot restore previously deleted history.
- Still to design: whether the cutoff uses calendar months in the configured business timezone, which records it covers, and what happens when the value changes. The accepted default must not trigger deletion before the cleanup design is reviewed and implemented.
- A plain age-based delete is not safe: [LedgerAdministration](../../revamp/backend/PocketMonkey.Host/Services/LedgerAdministration.cs) uses stored ledger entries for idempotency and posting sequence allocation. The [model](../../revamp/backend/PocketMonkey.Storage/PocketMonkeyDbContext.cs) also enforces opening-entry and account/month uniqueness. Preserve balances, initialization, retry guarantees, allowance credit identities, and consistent pagination before removing history.
- Decide treatment of opening entries, audit details, and allowance execution records explicitly. Deleting visible history is not necessarily erasing every record of a transaction. Take a backup before any first destructive cleanup; disabling retention later cannot recover deleted history.
- Automatic history removal requires a reviewed exception to the append-only policy in [ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md) and must preserve [ADR-0016](../../docs/ADR/ADR-0016-monthly-allowance-execution.md). Next, present a revisioned class/namespace-linked backend/data proposal for approval before changing schema, runtime configuration, or jobs. Record the accepted enduring retention design in an ADR, preserving the existing decision history; configuration-policy acceptance alone does not approve cleanup implementation.

### Transaction retention backend/data proposal R1

**Current approved design, amended 2026-10-19:** R1's initial approval below is
historical. The user rejected separate activation, accepted UTC cleanup while
retaining `TZ` for allowance execution, and approved the history recommendation
with "For A3 I'll go with your recommendation". These amendments supersede the
activation and local-boundary requirements in the original text below:

- Run cleanup automatically at application startup and daily for positive
	durations; default `24`, `0` unlimited. No activation command, confirmation
	prompt, `ActivatedAtUtc` or `RetentionActivated` field. Backups remain normal
	operational guidance, not an application-enforced prerequisite. A restored
	database may be pruned at startup; set `0` before starting it when cleanup must
	remain disabled.
- On 2026-10-19 the user limited positive durations to `1` through `120` months
	(10 years), with `0` for longer/unlimited history. Enforce this in
	`PocketMonkey.Host.Configuration.InstanceSettings.Read`, reject `121` and larger
	values at startup, and cover `0`, `120` and `121` in the existing
	`LedgerPersistenceCheck`. This configuration-only amendment changes no schema,
	API contract, cleanup responsibility or R2 timestamp mapping.
- Calculate the cutoff once per run as `00:00:00Z` on the first day of the current
	UTC month minus the configured number of calendar months, clamped to the
	earliest representable month. Prune only timestamps strictly before it. Do not
	use `TZ`, host-local time or fixed day counts. Keep `TZ` for allowance execution
	and timestamp display; do not rewrite stored UTC timestamps.
- Add `int RetentionMonths` and `DateTimeOffset? RetentionCutoffUtc` to
	`PocketMonkey.Host.Contracts.Accounts.LedgerHistoryResponse`. A null cutoff
	means unlimited; otherwise it describes configured eligibility, not proof that
	cleanup has finished. Both roles receive the same information. On
	`history_retention_changed`, clear all cached pages for that account and reload
	page one once; another conflict uses the existing error path, not a retry loop.
	No new visible wording/layout is approved by this contract decision.
- `LedgerMaintenanceState` keeps the proposed sequence high-water mark,
	retention revision and nullable UTC `LastCompletedAtUtc`, but no activation
	state. Worker eligibility depends only on duration and UTC cutoff. The schema
	upgrade itself does not delete rows; the worker may prune afterward.
- Retain all other approved R1 safeguards: permanent openings, audits, allowance
	revisions/executions and retired keys; exact unchanged balances; durable
	sequence allocation; atomic bounded cleanup and cursor invalidation. Verify a
	populated upgrade, automatic startup cleanup, default/zero/invalid/changed
	duration, exact UTC boundaries and `TZ` independence, concurrent posting,
	rollback/restart, retired-key rejection, allowance deduplication, truthful
	history metadata and bounded restart using isolated fixtures only.

The remaining R1/A1 text records the original review, not the current activation
or cutoff policy. There are no outstanding A1/A2/A3 policy decisions. See the
delivery evidence below for actual implementation and verification scope.

**R1 approved by the user on 2026-10-18:** "reviewed the proposal, sound good to
me". Approval covers the calendar-month cutoff, permanent opening/audit/allowance
metadata and retired-key retention, durable sequence allocation, expired-key
`409` semantics, cursor invalidation, and explicit backup/activation safeguard
described below. This is approval of R1, not merely the earlier environment-setting
policy. Preserve its stated boundaries: the exact operator activation procedure,
timezone-boundary resolution and additive history-disclosure contract need the
narrow follow-up identified by R1 before dependent implementation. Approval does
not authorize activation against an operator database or deletion of existing
financial data in this workspace. No schema, runtime configuration, job or
endpoint behavior has been changed by recording this approval.

#### Proposed behavior and boundaries

- Keep the accepted setting: `MONKEY_TRANSACTION_RETENTION_MONTHS`, default `24`,
	`0` unlimited, positive values at least `1`. Validate a nonnegative integer at
	startup; reject malformed or unrepresentable values. Configuration remains
	deployment-only, not a Manager preference or new settings endpoint.
- Proposed cutoff: the first instant of the current business month in `TZ`, minus
	the configured number of calendar months. Convert that boundary to UTC once per
	run and delete only entries strictly before it. For example, October 2026 with
	`24` retains October 2024 onward. Resolve skipped/ambiguous local boundaries
	explicitly using the existing business-timezone policy before implementation;
	never substitute the host timezone or a fixed days-per-month duration. Clamp
	subtraction at the earliest representable month for very large durations.
- Prune deposit, withdrawal and credited allowance ledger rows only. Keep opening
	entries permanently as initialization/provenance anchors, including zero and
	negative openings. Do not change account balances, create financial credits,
	or reinterpret an old entry after a timezone/configuration change.
- Retain existing financial audit events, allowance revisions and allowance
	execution records. They are not covered by this transaction-detail retention
	policy. In particular, retain account/business-month credit identities forever
	so downtime, retries and `TZ` changes cannot re-credit a pruned allowance.
	This is history retention, not erasure of all transaction-related metadata.
- Shortening the duration makes more history eligible at the next run; increasing
	it or setting `0` does not restore deleted rows. Read history continues to show
	retained rows, including the permanent opening. Current balances remain
	authoritative; opening plus remaining visible deltas will no longer necessarily
	reconstruct them. No synthetic adjustment or silent financial rewrite occurs.
- Require an operator-confirmed, recoverable backup before the first destructive
	run. Proposed safeguard: cleanup stays blocked until an explicit local operator
	activation records that confirmation. The activation command and backup
	verification procedure must be included in implementation review; do not infer
	consent from the default `24` or from database startup/migration alone.

#### Types, model and persistence

Existing ownership stays unchanged: Host owns behavior/jobs; Storage owns entities,
mapping and migrations. Existing references:

- `PocketMonkey.Host.Services.LedgerAdministration` in
	[LedgerAdministration.cs](../../revamp/backend/PocketMonkey.Host/Services/LedgerAdministration.cs):
	its current ledger-only key lookup and `MAX(SequenceNumber) + 1` allocation must
	be changed atomically with cleanup support, not after deletion is enabled.
- `PocketMonkey.Storage.PocketMonkeyDbContext` in
	[PocketMonkeyDbContext.cs](../../revamp/backend/PocketMonkey.Storage/PocketMonkeyDbContext.cs):
	retain existing money, opening, sequence, account and allowance-month constraints.
- `PocketMonkey.Storage.Entities.LedgerEntry` in
	[LedgerEntry.cs](../../revamp/backend/PocketMonkey.Storage/Entities/LedgerEntry.cs)
	remains the retained immutable financial record; do not add nullable financial
	fields or overwrite entries to simulate deletion.
- `PocketMonkey.Storage.Entities.AllowanceExecution` in
	[AllowanceExecution.cs](../../revamp/backend/PocketMonkey.Storage/Entities/AllowanceExecution.cs)
	keeps its unique account/month and posting-key identities and credited outcome.

Proposed new types/paths, not files created by this proposal:

| Type and namespace | Proposed path | Responsibility / fields |
| --- | --- | --- |
| `PocketMonkey.Storage.Entities.LedgerMaintenanceState` | `revamp/backend/PocketMonkey.Storage/Entities/LedgerMaintenanceState.cs` | Singleton primary key constrained to `1`; nonnegative `long LastAllocatedSequenceNumber` and `long RetentionRevision`; nullable UTC `ActivatedAtUtc` and `LastCompletedAtUtc`. Durable sequence high-water mark, cleanup activation and cursor generation. No secrets or financial amounts. |
| `PocketMonkey.Storage.Entities.RetiredLedgerKey` | `revamp/backend/PocketMonkey.Storage/Entities/RetiredLedgerKey.cs` | Required canonical 36-character `IdempotencyKey` primary key and non-null UTC `RetiredAtUtc`. No comment, amount or actor snapshot; no foreign key to a deleted ledger row. Keep indefinitely to reject reuse, not replay deleted payloads. |
| `PocketMonkey.Host.Services.TransactionRetention` | `revamp/backend/PocketMonkey.Host/Services/TransactionRetention.cs` | Scoped cleanup coordinator using the configured duration and injectable time source. Select bounded eligible rows, retain their keys, delete rows and advance the retention revision in one serializable SQLite transaction per batch. |
| `PocketMonkey.Host.HostedServices.TransactionRetentionWorker` | `revamp/backend/PocketMonkey.Host/HostedServices/TransactionRetentionWorker.cs` | Wake at startup and daily; persisted activation and current eligibility control work. Resume safely after interruption; do not hold a database transaction during backup/filesystem/network operations. |

Extend existing Host instance configuration with the validated retention duration.
The owning type is `PocketMonkey.Host.Configuration.InstanceSettings` in
[InstanceSettings.cs](../../revamp/backend/PocketMonkey.Host/Configuration/InstanceSettings.cs);
propose an `int TransactionRetentionMonths` property populated by `Read`.
`PocketMonkey.Host.Services.AllowanceExecutor` in
[AllowanceExecutor.cs](../../revamp/backend/PocketMonkey.Host/Services/AllowanceExecutor.cs)
already skips months with retained credited execution records; preserve that
behavior and verify it after ledger pruning rather than rebuilding those records
from visible history.

Use a proposed `(OccurredAtUtc, SequenceNumber)` eligibility index with a query
representation proven to compare UTC instants correctly in SQLite. Inspect actual
timestamp storage before choosing index/query SQL; do not rely on unsupported EF
`DateTimeOffset` ordering or lexical comparisons across differing offsets.

The migration initializes the singleton high-water mark from the existing maximum
sequence without changing ledger rows, balances, execution outcomes or keys.
Initialize activation to null: migrating populated data never starts deletion.
Each new posting allocates and persists the next sequence within its existing
serializable financial transaction, checking overflow. Cleanup uses the same
database serialization boundary and never lowers that counter. Retired-key lookup
must occur inside posting's transaction before a new key can be accepted; moving
keys and deleting rows must commit or roll back together. Retain unique indexes
and protect against a key existing in both live and retired storage through the
shared serialized posting/cleanup path, not a preflight application-only check.

Before pruning an allowance row, require its matching execution to be durably
credited with the same account/month/key. A mismatch blocks that candidate and
produces a bounded diagnostic; never discard uncertain execution evidence. Retry
jobs and posting must remain safe against cleanup running concurrently.

#### API, visibility and compatibility

- No new public cleanup, transaction-delete or retention-setting endpoint.
	Existing ready Manager writes and Manager/Member history visibility remain;
	backend authorization and antiforgery are unchanged.
- Live-key retries retain their original replay/conflict semantics. A retired key
	must never post again. Proposed response: HTTP `409` with stable code
	`transaction_history_expired`, regardless of supplied payload, because the
	original entry is no longer available to replay or compare. Do not retain full
	comments/response payloads merely to emulate deletion. This deliberately changes
	permanent original-entry replay and requires explicit approval.
- Extend the existing opaque history cursor with `RetentionRevision`. After any
	committed pruning batch, a cursor from an older revision receives HTTP `409`,
	stable code `history_retention_changed`; callers restart at the first page.
	Reject pre-upgrade cursors through that same restart path. New postings alone
	preserve the existing snapshot-bound keyset behavior. Use the global revision
	conservatively, even if another account was pruned, to avoid ambiguous cursors.
- Keep `LedgerEntryResponse` and money transport unchanged. The existing
	`LedgerHistoryResponse`, cursor/error mapping and history caller need review for
	an additive retention disclosure and restart handling before implementation.
	This proposal does not approve new UI wording/layout; any visible changes must
	follow the existing German/English design process.

Concrete existing integration targets are
`PocketMonkey.Host.Endpoints.TransactionEndpoints` in
[TransactionEndpoints.cs](../../revamp/backend/PocketMonkey.Host/Endpoints/TransactionEndpoints.cs),
`PocketMonkey.Host.Services.LedgerHistoryCursor` in
[LedgerHistoryCursor.cs](../../revamp/backend/PocketMonkey.Host/Services/LedgerHistoryCursor.cs),
and `PocketMonkey.Host.Contracts.Accounts.LedgerHistoryResponse` in
[LedgerHistoryResponse.cs](../../revamp/backend/PocketMonkey.Host/Contracts/Accounts/LedgerHistoryResponse.cs).
Add the two error cases to the existing `LedgerError` mapping and GET OpenAPI
`409` metadata. The affected routes remain `GET` and `POST`
`/api/accounts/{id}/transactions`; opening replay is unchanged because openings
are never pruned. Update the existing
[history caller](../../revamp/web/src/app/components/account-details/account-details.ts)
and [history model](../../revamp/web/src/app/models/accounts/ledger-history.ts),
including clearing cached pages before restarting, rather than creating a second
history transport or silently showing stale cached pages as current.

#### Operations, architecture and verification

Write one nonfinancial audit event per committed cleanup batch, with UTC time and
a stable action; log bounded counts/cutoff/outcome without amounts, comments,
credentials or actor snapshots. Batch failures roll back keys and deletions
together and retry later; business posting and readiness must not depend on a
successful cleanup run. Completed batches remain valid after interruption.
Disabling cleanup prevents new batches, not recovery of deleted data. Backups
may still contain old history; document that separately. Disk-space reclamation
and `VACUUM` are not part of the job or an implicit privacy guarantee.

Applicable decisions: [ADR-0010](../../docs/ADR/ADR-0010-ledger-and-money.md),
[ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md),
[ADR-0016](../../docs/ADR/ADR-0016-monthly-allowance-execution.md), and
[ADR-0017](../../docs/ADR/ADR-0017-backend-project-boundaries.md).
R1 conflicts with ADR-0012's append-only/permanent replay and cursor behavior:
after approval, update that authoritative record with the explicit bounded
retention exception and dated rationale before implementation. Record durable
allowance-identity preservation in ADR-0016 where needed. Do not amend approved
decisions as if this draft were accepted.

Focused acceptance checks must cover a real populated SQLite upgrade with zero
deletions before activation; default/zero/invalid/changed duration; exact cutoff
and timezone edge cases under controlled time; preserved signed balances/openings;
monotonic sequence allocation even after all eligible rows are gone; retired-key
rejection and live replay/conflict; concurrent posting/cleanup and interrupted
batches; no duplicate old allowance credits after restart or `TZ` changes; stale
cursor restart and normal posting snapshots; Manager/Member reads, direct Member
write denials and antiforgery; and the operator backup/activation/recovery path.
Use existing E2E/integration harnesses rather than routine mock/unit suites.
Extend the real-persistence slices in
[LedgerPersistenceCheck.cs](../../revamp/tests/integration/RuntimeChecks/Tests/LedgerPersistenceCheck.cs)
and [AllowanceExecutionCheck.cs](../../revamp/tests/integration/RuntimeChecks/Tests/AllowanceExecutionCheck.cs);
their current existence is not a claim that retention has been tested.
Rollback after deletion requires restoring a tested backup, not a down migration.

**Approval outcome:** R1's cutoff, permanent opening/audit/allowance metadata and
retired-key retention, expired-key `409` semantics, cursor invalidation, and
explicit backup/activation safeguard were approved on 2026-10-18. Exact operator
command, existing configuration/caller integration and time-boundary handling
still need the stated narrow follow-up before dependent implementation. Do not
reopen the accepted policy choices or infer approval of unspecified contracts.

#### Implementation-detail addendum A1

**Historical draft, 2026-10-18; resolved on 2026-10-19.** The numbered topics
below were discussed as A1/A2/A3. Activation was rejected, UTC cutoff accepted,
and history metadata/restart approved. The current amended design at the start
of R1 is authoritative; this original draft is retained as review history.

1. **Operator activation:** propose `activate-retention` as a local Host command,
	following the operator-only routing in
	[Program.cs](../../revamp/backend/PocketMonkey.Host/Program.cs). It prints the
	resolved data directory and configured duration, requires an interactive
	confirmation that a complete, recoverable instance backup exists, then records
	`ActivatedAtUtc` and a nonfinancial activation audit atomically. An absent
	confirmation or `0` duration changes nothing and exits unsuccessfully. An
	already activated instance reports its activation time without resetting it.
	The command does not run cleanup, start HTTP or hosted workers, accept remote
	requests, or treat Manager access as operator authority. Do not introduce a
	silent command-line confirmation flag. The documented prerequisite is an
	offline backup of the entire persistent data directory, tested by restoring it
	to an isolated instance, checking SQLite integrity and verifying balances,
	history, account images and authentication keys. The command records operator
	attestation, not a technical guarantee that an arbitrary backup can restore.
2. **Timezone boundary:** determine the target calendar month first, then resolve
	its first local instant. For an ambiguous midnight choose the earlier UTC
	instant; for a skipped midnight choose the first valid local instant in that
	month. If a valid boundary cannot be established, skip that run with a bounded
	diagnostic rather than deleting against a guessed boundary. Preserve strict
	`OccurredAtUtc < cutoff` comparison. Implementation must prove exact candidate
	comparison against actual persisted UTC timestamps; an index/query choice may
	not change that rule. Historical timestamps are never rewritten merely to
	make a query sortable.
3. **History contract/caller:** propose additive `int RetentionMonths`,
	`DateTimeOffset? RetentionCutoffUtc` and `bool RetentionActivated` properties on
	[LedgerHistoryResponse.cs](../../revamp/backend/PocketMonkey.Host/Contracts/Accounts/LedgerHistoryResponse.cs).
	The cutoff describes configured eligibility, not proof that every eligible row
	was removed; use null for unlimited retention. Both roles receive the same
	policy information and retained rows, without operator backup locations or
	private execution diagnostics. Keep the existing cursor opaque and use its
	retention revision for the approved `409` restart behavior. On
	`history_retention_changed`, the caller clears all cached pages for that
	account and reloads the first page once; repeated conflicts surface through
	the existing error path rather than an unbounded retry loop. No new visible
	wording/layout is approved here; any retention notice needs the separate
	German/English UI design review already required by R1.

A1 implementation verification must exercise canceled/failed/successful/repeated
operator activation, no deletion or workers during that command, a real isolated
backup restore, skipped/ambiguous month boundaries, truthful inactive/unlimited
history metadata, and bounded cursor restart. Do not run activation or prune
operator data as part of implementation checks; use isolated fixtures only.

### Ledger UTC mapping amendment R2

**Approved for implementation, 2026-10-19.** The user explicitly approved R2 with
"it's fine, go with it", quoting its application/API `DateTimeOffset`, UTC
`DateTime` provider mapping, lossless populated-data conversion, LINQ cleanup and
fail-closed handling of unexpected stored formats. Approval covers this narrow
amendment, not conversion or pruning of an operator database. R1, accepted
A1/A2/A3 policies and the 120-month finite configuration limit remain unchanged.
The separate R1/R2 delivery evidence below distinguishes the earlier raw-SQL
implementation from the mapped LINQ implementation.

#### Scope and mapping

- Keep `PocketMonkey.Storage.Entities.LedgerEntry.OccurredAtUtc` in
	[LedgerEntry.cs](../../revamp/backend/PocketMonkey.Storage/Entities/LedgerEntry.cs)
	as a non-null `DateTimeOffset`. Preserve the existing API response fields,
	UTC instants, full 100-nanosecond precision, financial data and actor snapshots.
- In `PocketMonkey.Storage.PocketMonkeyDbContext` in
	[PocketMonkeyDbContext.cs](../../revamp/backend/PocketMonkey.Storage/PocketMonkeyDbContext.cs),
	configure that property with an inline EF value converter: write
	`DateTimeOffset.UtcDateTime` as provider `DateTime`; on read explicitly mark the
	provider value as `DateTimeKind.Utc` and construct a zero-offset
	`DateTimeOffset`. Do not interpret database values in host-local time. SQLite
	still stores readable `TEXT`, now in the provider's canonical `DateTime` format.
- Keep the existing `(OccurredAtUtc, SequenceNumber)` index and all other ledger
	constraints. No new columns, entities, interfaces or converter helper class.
	Do not change audit, allowance-execution/revision, maintenance or retired-key
	timestamp mappings; this amendment is limited to the ledger query requirement.

#### Populated-data upgrade

- Add the `LedgerUtcDateTimeMapping` migration under the existing Storage
	`Migrations` directory and namespace, updating the sole model snapshot. Keep
	all existing migration IDs and operations, including `TransactionRetention`.
- Normalize existing application-written UTC ledger strings into the provider
	`DateTime` representation before serving or starting cleanup. Support the
	existing space/`T` separators and zero-offset suffixes without changing the
	instant. Preserve fractional seconds exactly; do not use SQLite `datetime()`
	or `strftime()` to round-trip timestamp precision, truncate to milliseconds,
	or append a second independently maintained timestamp column.
- Validate supported UTC representations and calendar values before conversion.
	Unexpected/malformed/nonzero-offset persisted values abort the upgrade
	atomically with an actionable diagnostic, rather than guessing an offset,
	partially converting history or silently skipping rows. Future nonzero-offset
	application values are normalized to UTC by the write converter.
- One-time data-normalization SQL in the migration is acceptable; the goal is
	to remove handwritten selection SQL from business services, not to prohibit
	migration SQL. A reverse representation conversion must preserve instants and
	precision; it cannot restore transaction details removed by retention.

#### Cleanup and unchanged contracts

- Replace both raw selection queries in
	`PocketMonkey.Host.Services.TransactionRetention` in
	[TransactionRetention.cs](../../revamp/backend/PocketMonkey.Host/Services/TransactionRetention.cs)
	with EF LINQ: eligible source and timestamp predicates, matching credited
	allowance execution through `Any`, timestamp/sequence ordering and `Take(200)`.
	Filtering, existence checks, ordering and the limit must execute in SQLite,
	not through `AsEnumerable` or a full-ledger materialization.
- Remove string-formatted boundaries, suffix inspection and the unsupported-text
	diagnostic. Keep the missing-credit-evidence warning, serializable batch
	transactions, retired-key insertion, deletion, audit, revision increments and
	interrupted-batch recovery. Do not change worker ownership, cadence or activation.
- HTTP routes, DTO types, money transport, roles, authorization, antiforgery,
	history metadata and bounded cursor restart are unaffected. No Angular,
	translation, UI-design or deployment change is required.

#### Architecture and verification

Follow [ADR-0004](../../docs/ADR/ADR-0004-language-and-timezone.md),
[ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md) and
[ADR-0017](../../docs/ADR/ADR-0017-backend-project-boundaries.md). ADR-0012 records
the approved provider mapping with a dated rationale; no new architecture record
or change to UTC retention/business-timezone scheduling.

Extend the existing real SQLite
[LedgerPersistenceCheck.cs](../../revamp/tests/integration/RuntimeChecks/Tests/LedgerPersistenceCheck.cs)
with populated pre-R2 upgrades covering old UTC representations, seven-digit
fractions, unchanged instants/balances/provenance, atomic rejection of malformed
data and round-trip normalization under non-UTC host timezones. Prove LINQ
translation, actual index use, chronological ordering and strict cutoff behavior
one tick before/at/after the boundary. Retain the existing rollback, concurrency,
sequence/key, allowance-evidence and deduplication checks. Rerun focused real-image
desktop/mobile startup-retention tests, EF pending-model and migration-layout
checks. Use isolated databases only; do not convert or prune an operator database.

**Review gate closed:** R2's mapping, lossless conversion and fail-closed upgrade
behavior were explicitly approved on 2026-10-19. Implementation must pass the
focused verification above; approval alone is not verification.

### R2 mapping delivery evidence, 2026-10-19

Implemented the approved inline UTC `DateTime` converter, retaining application/API
`DateTimeOffset` and all other timestamp mappings. Both cleanup selections now use
LINQ with database-side predicates, credited-execution existence checks,
timestamp/sequence ordering and a 200-row limit. No boundary formatting or stored
suffix inspection remains in the service; missing allowance evidence still blocks
deletion. The 120-month finite setting cap and unlimited `0` remain unchanged.

Added `20261019113107_LedgerUtcDateTimeMapping` and its generated metadata in the
existing Storage folder, with one snapshot and unchanged prior migration IDs.
The data-only upgrade validates supported UTC formats and calendar values before
updating anything, normalizes space/`T` and `+00:00`/`Z` forms without date-function
rounding, and trims only insignificant fractional zeroes. Invalid data aborts
atomically with a diagnostic. Down conversion restores the zero-offset suffix;
it cannot recover details already pruned by retention.

Actual focused verification:

- Locked Release Host build passed. From `revamp/`, both
	`dotnet run --configuration Release --project tests/integration/RuntimeChecks -p:RestoreLockedMode=true -- ledger-persistence`
	and the corresponding `-- allowance-execution` probe passed.
- The extended ledger probe covers populated pre-R2 data, leap/calendar edge
	cases, seven-digit fractions, minimum/maximum instants, unchanged balances and
	provenance, nonzero-offset write normalization, downgrade/re-upgrade and atomic
	rejection of 15 malformed/unexpected persisted representations. It verifies
	chronological ordering and cutoff exclusion at/after the boundary, retaining
	the original batching, rollback, key/sequence and concurrency checks.
- A test-only command interceptor captures the actual LINQ candidate command and
	its parameters. SQLite `EXPLAIN QUERY PLAN` confirms use of
	`IX_LedgerEntries_OccurredAtUtc_SequenceNumber` without a temporary sort; the
	executed command includes the database-side 200-row limit.
- `dotnet ef migrations has-pending-model-changes --project backend/PocketMonkey.Storage --startup-project backend/PocketMonkey.Host --context PocketMonkeyDbContext`
	reported no model changes. The production image built successfully using
	`npm --prefix revamp/web run build:image`.
- `npm --prefix revamp/tests/e2e test -- ledger/persistence.spec.ts ledger/transaction-workflows.spec.ts --grep "history restarts once|ledger persistence" --workers=1`
	selected and passed both desktop/mobile retention restart cases. The separately
	named SQLite case was not selected by that filter; the complete ledger probe
	was instead run directly in the production Linux image as UID 10001, network
	disabled, test binaries mounted read-only, and `TZ=Pacific/Honolulu`. It returned
	`ledger_persistence_passed`, including all R2 upgrade/precision checks.
- Editor diagnostics were clear for touched C# files; tracked whitespace checks
	passed. All checks used disposable SQLite files or fixture volumes, not an
	operator database. No commit or push was performed.

Full release-suite and hosted CI verification remain separate gates.

### Retention delivery evidence, 2026-10-19

Historical R1 results below describe the pre-R2 raw-SQL implementation. The R2
section above is authoritative for the current mapping and selection queries.

Implemented the accepted R1 amendments in Storage/Host and the existing history
caller. Added `TransactionRetention` migration under the sole Storage migration
directory; it creates durable maintenance/key state, initializes the counter from
existing history and adds the timestamp/sequence eligibility index without
deleting financial rows. Posting allocates durable sequences and rejects retired
keys inside its financial transaction. The hosted worker prunes bounded atomic
batches at startup/daily; duration `0` disables cleanup without activation state.

The indexed query handles the application's persisted UTC text representation,
including subsecond timestamps, and rechecks candidate instants before deletion.
Unsupported offset representations and allowance rows lacking matching credited
execution evidence are preserved with a bounded diagnostic rather than guessed
away. Openings, balances, financial audit and allowance identities remain intact.
History reads bind page/snapshot/revision in one transaction; old and pre-upgrade
cursors restart via `409`. Angular clears cached pages and retries page one once.
No visible layout/text or catalog keys were added.

Actual local verification:

- Locked .NET Release build and Angular SSR build passed; production Linux image
	built with `npm --prefix revamp/web run build:image`.
- Real SQLite `ledger-persistence` probe passed: populated upgrade, signed money,
	configuration boundaries/default/unlimited, exact UTC month/year/tick cutoff,
	clamping, atomic rollback, committed-batch interruption/restart, retired keys,
	monotonic sequence after high rows are pruned, legacy/stale cursors, history
	metadata, and concurrent posting/cleanup with normal snapshot behavior.
- Real SQLite `allowance-execution` probe passed: missing credit evidence blocks
	cleanup; restoration permits it; retained revisions/executions prevent repeated
	credit attempts or balance changes after pruning, restart and `TZ` changes.
- `npm --prefix revamp/tests/e2e test -- ledger/ --workers=1` initially passed
	13/14 cases, including the new desktop/mobile startup-retention flow. The sole
	failure was a test-runner exact-output mismatch from an extra success line, not
	a financial failure; the original output contract was restored.
- `npm --prefix revamp/tests/e2e test -- ledger/persistence.spec.ts accounts/allowance-execution.spec.ts --workers=1`
	then passed all 7 cases, including the repaired caller and desktop/mobile
	allowance crash/retry/recovery checks.
- After adding the opening-endpoint expired-key mapping and rebuilding the image,
	`npm --prefix revamp/tests/e2e test -- ledger/transaction-workflows.spec.ts --grep "history restarts once" --workers=1`
	passed both desktop/mobile cases. These use real login, BFF, backend, SQLite and
	worker startup; they assert a real `409` followed by one successful reload,
	cleared previous-page cache, permanent signed opening/balance, expired-key
	rejection across posting endpoints, identical Member history and denied writes.
- E2E TypeScript checking passed. All fixtures used disposable databases and
	named Docker volumes; no operator database was activated or pruned.
- EF `has-pending-model-changes` reported none. Guardrails passed for all 23
	Storage migration artifacts and the updated links/ADRs; tracked diff whitespace
	checks passed. Compose configuration verified forwarding of default `24`,
	unlimited `0` and custom `37` without starting an instance. See the maintained
	[environment contract](configuration.md#environment-contract).

The full release suite and hosted CI were not run for this revision. Final
operator/legal wording, ORT/notices review and deployment/publication gates remain
separate; this delivery does not mark the complete Step 3H acceptance gate done.

## Acceptance gate

- [ ] Each newly delivered workflow has real-stack browser coverage for both roles and direct API denials; verify German/English catalogs and follow the established language-testing policy rather than duplicating workflows by language.
- [ ] Removed archival and user deletion/anonymization workflows are not introduced as release requirements or deferred backlog.
- [ ] New German/English self-hosted legal content and an explicitly chosen OSS license are reviewed; operator responsibilities and legally qualified disclaimers are consistent, with no cloud-service terms reused or unapproved acceptance workflow added.
- [ ] The approved About page is discoverable from login and the signed-in shell, works for both roles and languages on desktop/mobile, and provides release-matched project/source information and bundled third-party notices without an authentication/consent gate or external-network requirement for reading legal texts.
- [ ] Last-manager protection remains valid, including concurrency; retention behavior follows the approved policy.
- [ ] No tenant or email assumptions remain in the agreed replacement workflows.

Next: [operations and cutover](04-operations-cutover.md), including application-wide
acceptance against the [step 2B design](02b-ux-ui-design.md); outstanding release and
deployment gates are not waived by completion of these business features.