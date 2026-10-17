# Step 3H: management and lifecycle completion

Status: not started. Depends on the preceding features affected by each lifecycle
operation. Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

Complete remaining profile, instance-settings, legal, and lifecycle workflows
without corrupting balances or audit attribution. Review this backlog after earlier steps;
deliver each remaining workflow separately rather than treating it as one large task.

Account archival and user deletion/anonymization are removed from the product
scope by the user's decision on 2026-10-17, not deferred to a later release.
Existing user disablement remains available; do not add archival flags, screens,
cleanup jobs, or deletion/anonymization endpoints for these removed workflows.

## Decisions before implementation

- The transaction-retention configuration policy below is accepted. Review and approve its backend/data cleanup design separately from the removed account/user lifecycle workflows before implementing automatic deletion.
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
Final operator/privacy wording and any in-app acceptance flow remain unapproved.

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

## Transaction retention discussion

Configuration policy accepted by the user on 2026-10-17 ("you retention proposal
sounds good to me"). This accepts the setting and values below, not a backend/data
cleanup design or authorization to delete existing transactions.

- Accepted: Docker environment setting `MONKEY_TRANSACTION_RETENTION_MONTHS`, default `24`, minimum positive value `1`, and `0` meaning unlimited retention. Configure duration independently of `TZ`; the minimum is a product choice, not a SQLite limit. Disabling cleanup cannot restore previously deleted history.
- Still to design: whether the cutoff uses calendar months in the configured business timezone, which records it covers, and what happens when the value changes. The accepted default must not trigger deletion before the cleanup design is reviewed and implemented.
- A plain age-based delete is not safe: [LedgerAdministration](../../revamp/backend/PocketMonkey.Host/Services/LedgerAdministration.cs) uses stored ledger entries for idempotency and posting sequence allocation. The [model](../../revamp/backend/PocketMonkey.Storage/PocketMonkeyDbContext.cs) also enforces opening-entry and account/month uniqueness. Preserve balances, initialization, retry guarantees, allowance credit identities, and consistent pagination before removing history.
- Decide treatment of opening entries, audit details, and allowance execution records explicitly. Deleting visible history is not necessarily erasing every record of a transaction. Take a backup before any first destructive cleanup; disabling retention later cannot recover deleted history.
- Automatic history removal requires a reviewed exception to the append-only policy in [ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md) and must preserve [ADR-0016](../../docs/ADR/ADR-0016-monthly-allowance-execution.md). Next, present a revisioned class/namespace-linked backend/data proposal for approval before changing schema, runtime configuration, or jobs. Record the accepted enduring retention design in an ADR, preserving the existing decision history; configuration-policy acceptance alone does not approve cleanup implementation.

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