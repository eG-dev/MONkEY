# POCKET MONkEY design references

Store editable draw.io sources and synchronized PNG previews here for
[step 2B: product UX and UI design](../../plans/migration/02b-ux-ui-design.md).
The user approved the then-current wireframes, click prototypes, visual foundations,
and implemented representative design on 2026-10-10, including all subsequent
refinements recorded below. Approval applies to that reviewed revision;
later design changes require renewed review. It does not settle future business
policies or certify unperformed technical checks.

## Approved Surface Revision (2026-10-23)

The user explicitly approved the current design-system and prototype changes:
"I approve the changes. Now do in Angular". This includes the integrated entry,
tonal surfaces, specimen gallery and earlier Login centring correction.
Wireframes remain unchanged and approved. This does not approve unresolved legal
wording or future business policies.

The [integrated application prototype](prototypes/index.html) is also a
**approved 2026-10-23 revision**, composing the maintained standalone views and shared shell
for full-application navigation and flow review. Use it for final prototype
verification after the focused standalone checks; see the
[composition notes](prototypes/README.md#integrated-application-entry).
It does not change the wireframes.

Separate integrated verification passed 16 native-flow combinations in ordinary
offline Chromium: both roles, languages and themes at outer viewports 1440x1000
and 360x1000. Real navigation, validation/cancellation, Administration, all About
tabs and sign-out/sign-in preserved preferences without duplicate chrome,
horizontal overflow or script errors. Details are recorded in the prototype notes.

The design system and all seven click prototypes have the **approved tonal-surface
revision**, now implemented in Angular.
Account cards, panels, secondary buttons, dialogs, inline feedback and shared
shell regions use neutral fills, spacing and restrained shadows instead of
decorative outlines. Inputs, invalid-field boundaries, focus rings and selected
navigation/tab indicators remain visible. The existing layouts and all approved
wireframes are unchanged; prior prototype approvals below remain history.
The earlier Login centring correction is included in the current approval.

Review the [overview](prototypes/accounts-overview/index.html),
[surface specimen](design-system/specimens/colors-surfaces.html) and
[component guidance](design-system/components.md). The current revision covers
Shell, Overview, Accounts, Account details, Administration, Login and About,
including their shared dialogs and menus. Angular maps the approved values into
its application SCSS without importing the specimen stylesheet.

Angular and production-image builds passed. Nineteen selected production-image
E2E checks passed across desktop/mobile authentication, theme persistence, About,
transactions and SSR/hydration. New assertions verify borderless light cards,
light/dark panels and secondary buttons, keyboard-visible card focus, borderless
dialogs and retained input boundaries. Desktop/mobile transaction-dialog
screenshots were inspected. Reproducible commands are in the
[Angular delivery record](../../revamp/README.md#tonal-surfaces-2026-10-23).

Browser verification passed 80 signed-in role/language/theme/width combinations
across five views, 16 public Login/About combinations, eight account-dialog
validation/failed-save combinations and 48 overview loading/empty/error
combinations, at 1440px and 360px. Checks covered all four About tabs, empty notice
results, retained form values, retry, input boundaries, visible card focus and
no horizontal page overflow. Account-card screenshots were inspected in both
themes on desktop and German phones. The surface specimen also passed at 320px;
new text/surface contrast pairs are documented in the colour guide. Dialog and
form activation used DOM events, not a full native keyboard-input test.

The navigation/account-name link styling in the click prototypes was updated on
2026-10-10 and is approved. Navigation
text links are larger and not underlined; account-name links remain underlined
with the same larger type.

The Accounts and account-details layouts are approved: account
renaming is available only through the Manager pencil beside the account-details
heading. Lists have no rename control; their desktop trailing chevron opens details.
The mobile Accounts refinement was approved by the user on 2026-10-10: avatar
and name share a minimum 44px-high link, muted status sits below the name, and
balance remains right-aligned. Phones omit the duplicate chevron; long names and
amounts wrap without overlap. The wireframe, prototype and implementation reflect
this refinement. See [mobile account rows](design-system/components.md#mobile-account-rows).
Verification: Angular and production-image builds passed; all four selected
German/English desktop/mobile account workflows passed without retries, including
320px and 360px tap-target, status-alignment and overflow assertions. Mobile
screenshots were reviewed. Prototype checks covered both languages/themes at
320px, 360px and 1440px, long names/amounts, Member guidance and keyboard navigation.
View-level actions such as refresh align at the right edge of the view header;
contextual actions stay beside their target. See the shared
[view-header guidance](design-system/components.md#view-headers).

The user approved the unified transaction-dialog refinement on 2026-10-10:
desktop and mobile account details show a labelled "Record transaction" action
immediately after icon-only refresh in the right-aligned header group. Managers
with an opening balance use the same dialog for deposits and withdrawals at
every width; the regular view no longer embeds the form. Phone dialogs remain
full-screen. Opening-balance entry and backend financial rules are unchanged.
Verification: Angular/production-image builds, catalog validation and test
typechecking passed. All four selected desktop/mobile localized transaction
workflows passed without retries, covering deposits, withdrawals, validation,
retry idempotency, dialog closure, history and Member access. Desktop/mobile
dialog screenshots were reviewed. Prototype checks covered English/German,
light/dark, 320px/360px/1440px, action order, dialog opening and role/opening gates.

## Reference inventory

Account-image controls are implemented and locally verified on 2026-10-10:
six real-stack image checks passed, including both languages on desktop/mobile,
private access, reload/restart, upload limits, and file/database recovery.
The prototype hint now states the approved 512 x 512 pixel and 2 MiB limits;
this text-only refinement is draft pending review. The reviewed layout is unchanged.
Production desktop/mobile dialog screenshots were reviewed without overlap.
The prototype hint passed English/German, light/dark, and 360px/1440px checks
without horizontal overflow.

The account-details history column now reads "Recorded by" / "Erfasst von"
(2026-10-10). It displays the user's display name captured when the entry was
recorded, not their username or the financial account name; later user edits do
not rewrite historical attribution. The label-only prototype refinement is a
draft pending review; the reviewed wireframe layout remains unchanged.
Verification: catalog/type checks and the production-image build passed; four
localized desktop/mobile transaction workflows verified a distinct display name,
and the historical-name/restart API check passed. Both prototype labels were
checked in the browser. Existing ledger snapshots were not modified.

The 2026-10-10 Login and app-shell footer revision was approved: build version
and GitHub icon/label. That remains the Angular revision; the current click
prototype now has a shared About dialog and changed footer/navigation as a draft.
The repository link is an unavailable
placeholder pending the future repository URL; it must not point to the current
repository. The login footer sits at the bottom and flows below tall content on small screens.
The temporary foundation/system smoke-check panel has been removed from the
login implementation to match the approved references. Operational health checks
remain separate from the public sign-in screen.

The user explicitly approved all three then-current R1 wireframes on 2026-10-17,
clarifying "typo, 3 wireframes approved" after reporting source-only draw.io edits.
Approval covers About and the related application-shell/login changes, including
the current user-edited annotation arrangement. About / Info has an info icon
below Administration (called Settings in the discussion) in the bottom sidebar
group, with the smaller build version beneath; same arrangement in the mobile
drawer. Login retains version and an About footer link. GitHub moves into About.
The PNGs were re-exported and visually inspected after approval. The user then
authorized removing stale draft labels from the About diagram title and the
About/login notes; this metadata-only cleanup preserves all layout, behavior,
annotation positions, and approvals. Prototype approval remains a separate gate.
The user subsequently requested tabs and agreed their names: Overview / Übersicht
as the default, and Third-party notices / Drittanbieterhinweise. That R2 layout
was a draft, not approved. The user then requested Legal information / Rechtliche
Hinweise as the last tab. R3 has three separate tab wireframes in that order.
Overview retains project/version/source and the project license only; component
search and expandable notices remain on the second tab. The last tab contains
operator responsibilities, warranty/liability information, and privacy as distinct
sections on one page, with placeholders pending legal wording review.
The user explicitly approved all three then-current About R3 draw.io wireframes on
2026-10-17 ("draw.io wireframes approved"), including their annotation arrangements.
Their PNGs were re-exported and visually inspected to synchronize the approved
references. On 2026-10-17 the user then requested a shared full-size About dialog
from login and the app rather than separate page presentations. The current About
R4 wireframes show near-full viewport on desktop, full-screen on phones,
Close instead of Back, focus trapping/inert background, Escape dismissal and focus
return to the opener. Header/tabs remain visible while content scrolls internally.
The tab order/content is unchanged. The user explicitly approved the current three
About R4 wireframes and matching shell/login entry-point notes on 2026-10-17
("approved"), including their preserved annotation arrangements and exported
previews. Earlier R3/R1 approvals remain history. The wireframe gate is satisfied
for continuing the prototype; separate prototype approval is required before Angular.
Neither layout approval nor placeholders approve legal wording or a complete inventory.

The shared About dialog click prototype was built on 2026-10-17 and is a draft
awaiting explicit approval. Both login and the shell open the same component;
the direct About review page opens it automatically. It has keyboard-operated tabs,
component filtering/empty results and expansion, inline verbatim AGPL text,
disabled pending repository/source links, and clearly marked notice/legal placeholders.
Checks covered 24 signed-in role/language/theme/width combinations and 12 public
language/theme/width combinations at 1440px, 360px and 320px. Login and forced-password
form values, session-expiry messages, inert background, focus containment/return,
and Escape dismissal were checked. Desktop/phone screenshots were inspected.
The final inline-license refinement passed eight desktop/phone language/theme checks,
including Escape from the text, exact text preservation, and no horizontal overflow.
No script errors were observed in those runs; Angular remains unchanged.

The user then requested an icon-free `Version | About` login footer, implemented
as a draft cosmetic prototype refinement and synchronized in the login wireframe.
Six language/width checks passed for the footer, dialog opening and focus return.
The user selected retaining About text and moving Administration (called Settings
in discussion) directly below Overview. The user explicitly approved the current
wireframes on 2026-10-17 ("wireframes approved"), including their shell source edits
replacing drawn icons with textual icon placeholders and the current annotation
arrangement. The icon-free login footer wireframe is also covered by that approval.
The shared prototype now applies the menu move across all shell views, retaining
real icons and labels: Overview, Administration, Manager-only Accounts, with About
anchored at the bottom above the version. Checks passed 24 role/language/theme/width
combinations at 1440px, 360px and 320px, including menu order, role visibility,
vertical spacing, About focus return and no horizontal overflow or script errors.
Prior approvals remain history; the three About R4 dialog wireframes themselves
are unchanged and remain approved. The user explicitly approved all three current
click prototypes (About dialog, updated shell menu and login footer) on 2026-10-17
("Approve all three current prototypes; commit and implement Angular"). Both design
gates are satisfied for Angular implementation. This approval covers presentation
and interaction, not placeholder legal wording, an audited notice inventory or
unagreed repository/source URLs.
See the [About requirement](../../plans/migration/03h-lifecycle.md#about-page-and-third-party-notices).

On 2026-10-19 the user approved the About design review and explicitly confirmed
"Yes, reuse the existing design for real notice data". This approves reusing the
current About R4 wireframes and matching shared dialog click prototype without
changing their layout or interactions. Replace illustrative component rows with
the generated manual catalog, retaining search, expandable local original texts
and explicit partial coverage. No new layout revision is introduced. This does
not approve legal wording, complete inventory coverage or future design changes.

The approved reuse is implemented in Angular on 2026-10-19. The two manual entries
show their real component/version/license associations, unmodified original texts
and local document links. Nine production-image About/offline checks passed,
including desktop/320px public reading and both signed-in roles. English desktop/
mobile screenshots were inspected. German labels and original-text wrapping passed
four browser checks at 1440px/360px in light/dark themes without overflow or script
errors. Legal placeholders remain unchanged; the collection is explicitly partial.

### Current Drafts (2026-10-19)

The user requested two subsequent corrections. The login click prototype now
constrains its main wrapper to the 440px card width; the review note can no longer
widen the wrapper and offset the card. This correction is a draft pending review;
the already-centred login wireframe is unchanged. Browser checks passed 12
English/German, light/dark combinations at 1440px, 360px and 320px with zero
horizontal centre offset, no page overflow and no note/footer overlap. The old
auto-width wrapper reproduced a 329px offset at 1440px. The forced-password-change
form also remained centred at 1440px/360px. Angular was not changed for this fix.

About R5 is a **wireframe revision approved on 2026-10-19**.
The user explicitly answered "Wireframe approved" after the
four-tab proposal and current project-license source edits. Approval covers the
current R5 references and annotation arrangements; earlier R4 approvals remain history.
It separates the project license into its own second tab: Overview / Übersicht,
Project license / Projektlizenz, Third-party notices / Drittanbieterhinweise,
Legal information / Rechtliche Hinweise. Overview keeps only product/version/
source information. Selecting Project license shows the complete original
`AGPL-3.0-only` text immediately, without expansion, plus its local file link.
The existing dialog scroll area, fixed header/tabs, stable centred content and
phone tab-strip scrolling remain; there is no nested license scroll box.

All four R5 sources parse, preserve the 1440px viewport and share the same tab
order. PNGs were exported and inspected; the project-license preview was
synchronized from the current user-edited source without changing annotations.
The wireframe gate is closed. The shared About click prototype implements
R5 and was **explicitly approved on 2026-10-19** with "prototype approved, create
a commit with it". It adds Project license
as the second tab, removes the license accordion from Overview and renders the
entire original text immediately with its local file link. Balanced scrollbar
gutters keep the content centred. This explicit R5 approval, rather than the
earlier R4/reuse approvals, satisfies the changed prototype's gate. Angular now
implements this approved four-tab revision, delivered on 2026-10-23.

Prototype verification passed 12 public review combinations and 24 signed-in
Manager/Member combinations in English/German, light/dark at 1440px, 360px and
320px, plus four public login checks preserving typed form values. Checks covered
tab order and selection, no license expansion controls, exact text, stable
centring, no horizontal content overflow, internal scrolling with the header
fixed, Escape dismissal and focus return. Desktop/phone screenshots were inspected;
no script errors were observed. The integrated browser page remained hidden, so
control activation and keyboard-handler checks used DOM-dispatched events, not
native keyboard-input verification.

The existing offline `project-license.js` copy had CRLF line endings while the
canonical root license now uses LF. It was mechanically regenerated from the
root text without changing legal wording. The displayed 34,522-character text
matches the root SHA-256 exactly:
`7a269a0312054cacb0ec0c09671703c90c456747fcd3a45b523a0b0a4c32e29e`.
JavaScript syntax and repository guardrails passed. Both R5 design gates are
satisfied. Angular implementation was requested again on 2026-10-23: "Perfect,
approved. Now we need to also implement the About related changes". The earlier
login-centering correction was separately approved with the surface revision.

Angular delivery verification (2026-10-23): the application and production-image
builds passed, followed by eight production-image About E2E checks on desktop and
mobile. Coverage includes public access, Manager/Member access, forced-password
change, four-tab keyboard order, the immediately visible canonical license and
local download, stable content width, fixed header/tabs during internal scrolling,
notice expansion across search/tab changes, reopen reset and opener focus return.
Desktop and 320px phone license screenshots were inspected. Eight separate
development-app browser checks passed in isolated contexts: English/German,
light/dark and 1440px/360px, with localized license tabs, the full text, no
horizontal overflow and no nested license scrolling. These checks waited for
hydrated controls and did not change the existing signed-in session.
Actual notice documents/build metadata and the explicit partial-coverage/legal placeholders
remain unchanged. See the [delivery record](../../revamp/README.md#four-tab-about-delivery-2026-10-23).

| Reference | Scope |
| --- | --- |
| App shell | Shared navigation, identity/role controls, content boundaries, and responsive structure, without specific view content |
| Accounts overview | Application home/landing view with accounts and balances; no separate marketing page |
| Account management | Dedicated **Accounts** navigation entry: Manager account creation and navigation; no existing-account name editing |
| Account details | Manager rename beside the heading, image controls, balance, opening state, transactions/history, deposit/withdrawal forms, and monthly allowance configuration/status |
| Settings | **Profile** tab in Administration: personal preferences and password change; instance settings remain deployment configuration |
| User administration | **Users** tab in Administration: Manager user creation, roles, disablement, password reset, and last-manager protection |
| Login | Sign-in, forced-password change, and session-expiry states |
| About | R5 wireframes and shared prototype explicitly approved 2026-10-19: Overview, Project license, Third-party notices and Legal information; implemented in Angular 2026-10-23 |

Use desktop/mobile and Manager/Member variants where relevant. Forms, dialogs,
image upload, confirmations, and validation/retry states can be named pages in
the owning view's source, not additional top-level views. The overview links to
the dedicated Accounts view for management instead of embedding Manager controls.
About is being designed under the lifecycle scope review; final operator/privacy
wording remains pending. Dedicated reversals remain deferred. Monthly reports are
excluded from the product scope.

## Files and index

Allowance configuration was aligned with [ADR-0015](../ADR/ADR-0015-monthly-allowance-configuration.md)
and approved by the user on 2026-10-10: current versus next-month settings,
retained amounts when disabled, and no executed-credit status in Step 3E.
The existing allowance section and switch/amount modal layout are unchanged.

Step 3F execution status in the account-details click prototype was explicitly
approved by the user on 2026-10-12 ("prototype is approved"): the existing allowance
panel shows only the latest successful credit timestamp or no credits, plus the oldest
pending/failed month under a small "Credit runs" heading separated from the
configuration by space. The allowance amount is not repeated in execution status;
historical credit amounts remain in ledger history. Managers also see attempt details and a safe failure reason;
the detailed-failure review state uses a generic placeholder reason, not a balance
limit or advice to book a withdrawal. The account-details
prototype includes dedicated execution review states in both languages. No new
controls are introduced. The user separately approved the current wireframe on
2026-10-12; both design approval gates for Angular execution status are satisfied.
The revised
prototype passed 96 combinations of desktop/360px, English/German, Manager/Member,
light/dark, and six execution states without overflow. The configuration/status
groups retain 20px separation; the latest-credit icon is centered with its text
and outstanding status has at least 12px separation.

The approved 2026-10-12 prototype includes the requested corrections: the success icon and
text are vertically centered, with 12px before outstanding status. The latest
credit line omits a redundant month; only catch-up credits whose period differs
from the posting month retain a period label. The panel is limited to one latest
successful credit and one oldest pending/failed month, not an expanding run list.
Full credit history remains in the ledger. A catch-up review state illustrates
the period distinction. The final detailed-failure state uses "Example failure
reason." and its German equivalent, verified across 16 desktop/phone,
language, theme, and role combinations. This is the prototype revision covered
by the user's explicit prototype approval. The subsequent explicit wireframe
approval covers the current user-edited source and its annotation arrangement.
Its PNG was re-exported and visually inspected on 2026-10-12 without changing
the source. The approved execution-status design is now implemented in Angular;
the [Step 3F delivery record](../../plans/migration/03f-allowance-execution.md#delivery-evidence)
documents the 17 passing real-stack checks and inspected desktop/mobile screenshots.
The implementation uses existing spacing tokens with at least 20px between the
configuration/status groups and 12px before outstanding status. Both explicit
artifact approvals remain unchanged; local checks do not grant application-wide
visual acceptance.

A subsequent image-edit badge refinement requested on 2026-10-12 retains the
circular badge, removes its outline, and uses the panel background
behind the pencil in both themes. This styling-only change leaves the approved
wireframe layout and earlier execution-status approval intact. The user explicitly
approved this current borderless badge prototype on 2026-10-17
("Approve both current references"), together with the revised shell wireframe.
Verified 16 combinations of desktop/360px, English/German, light/dark, and
Manager/Member: no badge border, centered pencil, opaque theme-aware background,
working image dialog, Member read-only behavior, and no horizontal overflow.
The phone header screenshot was visually inspected.

Wireframe annotation formatting was refined on 2026-10-10: consolidate notes
targeting the same area and use straight 3px arrows around a black 3px viewport
border using draw.io's "Dashed (1)" preset.
After creating or substantially updating a wireframe, ask the user to arrange
its notes in draw.io, including above or below the viewport where this shortens
arrows. Preserve their arrangement, then re-export and inspect the PNG after
confirmation. The user reviewed all seven current wireframes, including their
annotation arrangements, on 2026-10-10. All seven PNG previews were re-exported
from those sources and visually inspected; the reviewed layouts were preserved.
Login's note overlap and Profile's accidental color-code text were corrected;
both affected previews were re-exported and visually checked on 2026-10-10.
Existing view/prototype approvals below remain unchanged.

Follow [ADR-0013](../ADR/ADR-0013-wireframes-and-click-prototypes.md): rough
wireframe first, then a detailed click prototype.

- Keep each `.drawio` source and its exported PNG preview together here, named `<view>-wireframe.drawio` and `<view>-wireframe.png`.
- Draw one main desktop viewport per view. Show only the view inside the shell's main content container (max 1440px), not the application shell, so the shell can change independently. Mark its bounds with a dashed border. Describe behavior, states, role differences, dialogs, and phone layout in yellow note shapes outside the viewport, around its edges, with arrows pointing to the relevant component. Never overlay annotations on the view. Expand the drawing/export to include the notes, not the viewport itself. Create a separate `.drawio` only when a screen has its own substantial layout, such as the Profile and Users tabs.
- Show detailed interactions and states in the click prototype, not in additional wireframes. Keep exports synchronized with the source revision. Prefer readable, uncompressed XML when practical.
- Commit editable sources, not only screenshots or external draw.io links. Use fictional data; never include credentials or private financial information.
- As references arrive, add actual source/preview links below with role, viewport/state, draft/approved status, reviewed revision, approval date, and open questions. Only link files that exist.
- Keep visual-token and interaction guidance here too, linked from that index. Wireframes alone do not approve typography, colors, or all behavior.

The user explicitly approved **all 11 then-current wireframes on 2026-10-21**
("I did minor adjustments on some of the wireframes and approve all of them"),
including the latest user-edited App shell, About Overview and Project license
sources, link-target widths and annotation arrangement. This approval remains
history for subsequently changed references; the four unchanged wireframes
retain this approval. Earlier dates below also remain approval history.
Annotation colours were already normal. Obsolete "R5 draft" prefixes were
removed from two About notes without changing their meaning or geometry, and
the four affected/user-adjusted PNGs were re-exported and visually inspected.
This housekeeping does not reopen approval. Prototype approvals are unchanged:
the Login centring prototype correction still awaits its own approval, and
wireframe approval does not approve legal wording or unresolved business policy.

Later on 2026-10-21, the user requested English-only text in all wireframes.
The App shell, Login, Administration Profile and all four About wireframes had
wording-only draft revisions: German alternatives were removed, and
language controls use the English label "German" instead of "Deutsch" without
changing their meaning. Nine changed annotations used temporary light-blue
review markers. Geometry, arrow routing, behavior, prototypes and application
translations are unchanged. All seven PNGs were re-exported and visually
inspected; all 11 sources parse with valid connector references, and a decoded
text scan found no remaining German terms.

The user then explicitly approved all seven English-only wireframe revisions
on 2026-10-21 ("all approved"), including the latest user-edited notices source.
All 11 current wireframes are now approved. The nine annotation highlights were
restored to normal yellow without changing their text, geometry or arrow
routing, and all six cleanup-affected PNGs were re-exported and visually
inspected. The Profile preview remains synchronized from its previous export.
All 11 sources parse with valid references and no review colours on notes.
Prototype approvals and legal-content review remain separate and unchanged.

Every click prototype in the following table has the **approved 2026-10-23 surface
revision**. Earlier dates in that column record approval history; the Status
column retains the unchanged wireframe approvals.

| Reference | Files | Status | Click prototype |
| --- | --- | --- | --- |
| App shell | [draw.io source](wireframes/application-shell/application-shell-wireframe.drawio), [PNG preview](wireframes/application-shell/application-shell-wireframe.png) | English-only wording explicitly approved 2026-10-21; earlier all-wireframe approval and Administration-last correction approval 2026-10-17 retained as history; user-edited icon placeholders/annotation arrangement preserved | [Shell](prototypes/application-shell/index.html), revised Administration-last menu prototype explicitly approved 2026-10-17 ("Approve current shell prototype and implement Angular"); earlier approvals retained as history |
| Accounts overview | [draw.io source](wireframes/accounts-overview/accounts-overview-wireframe.drawio), [PNG preview](wireframes/accounts-overview/accounts-overview-wireframe.png) | Approved 2026-10-10 | [Overview](prototypes/accounts-overview/index.html) |
| Accounts | [draw.io source](wireframes/accounts/accounts-wireframe.drawio), [PNG preview](wireframes/accounts/accounts-wireframe.png) | Approved 2026-10-10, including mobile identity/status grouping and removal of the mobile chevron | [Accounts](prototypes/accounts/index.html) |
| Account details | [draw.io source](wireframes/account-details/account-details-wireframe.drawio), [PNG preview](wireframes/account-details/account-details-wireframe.png) | Wireframe and earlier execution-status prototype explicitly approved 2026-10-12; borderless image-edit badge prototype explicitly approved 2026-10-17 ("Approve both current references"); approved wireframe unchanged | [Account details](prototypes/account-details/index.html) |
| Administration: Profile | [draw.io source](wireframes/administration/administration-profile-wireframe.drawio), [PNG preview](wireframes/administration/administration-profile-wireframe.png) | English-only wording explicitly approved 2026-10-21; earlier all-wireframe approval and approval 2026-10-10 retained as history | [Administration](prototypes/administration/index.html) |
| Administration: Users | [draw.io source](wireframes/administration/administration-users-wireframe.drawio), [PNG preview](wireframes/administration/administration-users-wireframe.png) | Approved 2026-10-10 | [Administration](prototypes/administration/index.html) |
| Login | [draw.io source](wireframes/login/login-wireframe.drawio), [PNG preview](wireframes/login/login-wireframe.png) | English-only wording explicitly approved 2026-10-21; earlier all-wireframe approval and icon-free footer approval 2026-10-17 retained as history | [Login](prototypes/login/index.html), centring correction draft 2026-10-19; prior shared About/footer approval retained as history |
| About: Overview | [draw.io source](wireframes/about/about-wireframe.drawio), [PNG preview](wireframes/about/about-wireframe.png) | English-only wording explicitly approved 2026-10-21; earlier all-wireframe and R5 approval 2026-10-19 retained as history; project license remains outside Overview | [About](prototypes/about/index.html), R5 explicitly approved 2026-10-19 |
| About: Project license | [draw.io source](wireframes/about/about-license-wireframe.drawio), [PNG preview](wireframes/about/about-license-wireframe.png) | English-only wording explicitly approved 2026-10-21; earlier all-wireframe and R5 approval 2026-10-19 retained as history; full AGPL text without expansion unchanged | [About](prototypes/about/index.html), R5 explicitly approved 2026-10-19 |
| About: Third-party notices | [draw.io source](wireframes/about/about-notices-wireframe.drawio), [PNG preview](wireframes/about/about-notices-wireframe.png) | English-only wording and latest user source edits explicitly approved 2026-10-21; earlier all-wireframe and R5 approval 2026-10-19 retained as history; synchronized four-tab strip unchanged | [About](prototypes/about/index.html), R5 explicitly approved 2026-10-19 |
| About: Legal information | [draw.io source](wireframes/about/about-legal-wireframe.drawio), [PNG preview](wireframes/about/about-legal-wireframe.png) | English-only wording explicitly approved 2026-10-21; earlier all-wireframe and R5 approval 2026-10-19 retained as history; legal wording not approved | [About](prototypes/about/index.html), R5 explicitly approved 2026-10-19; legal placeholders only |

Prototype structure, review settings, and fictional sign-in data are described in
the [prototype notes](prototypes/README.md).

Visual foundations are documented in the [design system](design-system/README.md),
with browser-viewable [specimens](design-system/specimens/index.html). Shared fonts
and images are stored in [assets](assets/).

## Review rules

The user requested two corrections on 2026-10-17 after the About implementation:
the account-image pencil must use the existing borderless prototype styling, and
Administration must always be the last item in the top navigation group. The
revised shell wireframe shows Overview, Manager-only Accounts, Administration,
with About / Info still anchored at the bottom. It preserves the user's icon
placeholders and annotation positions. The user explicitly approved this current
shell wireframe and the existing borderless image-edit badge prototype on
2026-10-17 ("Approve both current references"). The shared menu prototype was
then updated and verified across 16 role/language/theme/viewport combinations.
The user separately explicitly approved this current shell prototype on
2026-10-17 ("Approve current shell prototype and implement Angular"). Both
corrections are now implemented in Angular. Eight production-image checks passed
across desktop/mobile, including both menu roles and borderless, centered,
panel-background image badges in both themes. The existing image upload,
replacement, removal, and Member read-only workflow remains covered; phone
light/dark badge screenshots were inspected. The About dialog design is unchanged.

The user explicitly approved the current account-details click prototype on
2026-10-12 after the allowance execution-status corrections and replacement of
the misleading balance-limit advice with a bilingual placeholder failure reason.
That approval applies to the reviewed prototype revision. The user then
separately explicitly approved the current account-details wireframe on
2026-10-12 ("wireframe is approved to"), including their source edits and
annotation arrangement. The PNG was re-exported from that source and visually
inspected without modifying the source. Those approvals cover the then-reviewed
references and the implemented execution status. The later image-edit badge
prototype refinement was separately explicitly approved on 2026-10-17 as recorded
above. The approved wireframe is unchanged.

Committing a reference does not approve it. New or changed references are drafts
until explicitly reviewed; record approval against the reviewed revision.
Feedback, corrections, annotation readiness, business-policy acceptance, "proceed",
and successful checks are not approval. Wait for explicit approval at each stage.
Approved references guide implementation but do not override ADRs, backend
security, exact money rules, or real-stack verification. Resolve policy conflicts
before implementation rather than inferring decisions from diagrams.

The user accepted the representative design on 2026-10-10; the phase 2B design
pause is lifted. [Account images](../../plans/migration/03d-account-images.md) is
locally implemented and verified. Next is [allowance configuration](../../plans/migration/03e-allowance-configuration.md),
subject to its separate policy and verification prerequisites.