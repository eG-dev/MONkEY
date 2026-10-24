# Click Prototypes

Offline click prototypes for the approved wireframes. Open any `index.html`
directly in a browser; no server or internet access is required. Keep the
surrounding design folder with the pages, because they use the shared design
stylesheet, Roboto fonts, and logo.

## Notice Document Hierarchy R6 (2026-10-24)

**Wireframe and shared About prototype R6 explicitly approved, 2026-10-24.**
The revised notices pane uses bounded package/license groups, lists applicable
packages and their sources once per group, and separates readable document
titles from independent Open original links. Each document starts closed and
can expand without collapsing another. Shared metadata appears in the group
heading; differing member versions/licenses remain attached to those members.
SQLite illustrates Microsoft providers, SQLitePCLRaw and the public-domain
engine without implying one common license.

These are illustrative design fixtures, not a second maintained distribution
inventory. Inline legal-text bodies are explicitly marked placeholders.
Original-file links reuse the tracked originals, which remain unchanged; the
production implementation must render their complete original text. Search
retains an entire matching component and its applicability groups. Document and
component expansion survive filtering and tab changes, but reset when the
dialog closes. Phones stack metadata and actions, wrap long names/links and
retain the existing single content scroller and fixed header/tabs.

Standalone verification passed 16 combinations of Manager/Member,
English/German, light/dark and 1440x1000/360x1000. Checks covered three SQLite
groups, the 3/4/1 package mapping, five initially closed documents, independent
Enter/Space expansion, case-insensitive package search, empty results, expansion
retention through filtering and tab changes, preferences, unique IDs, no
horizontal overflow, Escape/focus return and reset after reopening.

A separate integrated pass covered the same 16 outer-viewport combinations
through actual Overview-to-Administration navigation and the shell About entry,
then back to Overview. It additionally checked multiple SQLitePCLRaw documents
open together, independent collapse, hidden/visible bodies, mixed Angular member
versions, fixed header/tabs, no nested legal-text scrollers and unchanged
fictional data. Integrated controls used DOM-dispatched clicks/input events;
this is not additional native keyboard-input evidence. Neither matrix reported
script errors. Ten distinct original-file URLs were opened locally and their
nonempty text verified. The original-link action did not toggle its document.

Integrated English/light desktop and German/dark phone screenshots were
inspected. A focused German/dark check also passed at 320px and 360px without
horizontal overflow; the outer phone viewport measured 360x1000. Bundled fonts
finished loading before visual review. An additional ordinary headless Chromium
pass confirmed real Administration navigation, native Enter expansion and no
overflow at 1440x1000 and 360x1000; capture dimensions were verified before
inspection to avoid integrated-browser screenshot sizing artifacts. Neither
ordinary-browser scenario reported script errors.

The [standalone review](about/index.html) and
[integrated application](index.html) are the approved references. After the
wireframe approval with "approved", the user explicitly approved the current
prototype with "prototype approved, implement" on 2026-10-24. Both design gates
are complete. Angular delivery and production-image evidence are recorded
separately from the prototype checks in the
[R6 application delivery record](../../../revamp/README.md#grouped-notice-documents-r6-2026-10-24).

## Currency Formatting R1 (2026-10-24)

**Shared formatter and affected Overview/Accounts/account-details references
R1 approved, 2026-10-24.** The user explicitly approved the current revision with
"approved". Whole-unit amounts omit the decimal separator and zero cents;
nonzero cents retain two fractional digits. Locale grouping/separators, signs,
colors, currency labels and exact minor-unit data are unchanged. This is a
read-only display rule for both supported currencies; the fictional fixture
remains EUR, without new currency-selection controls. Editable form strings
and parsing are unchanged. The separate approval gate for Angular is complete.

Standalone verification passed 16 combinations of Manager/Member,
English/German, light/dark and 1440x1000/360x1000. A separate integrated pass
covered the same 16 outer-viewport combinations through actual Overview-to-Paul-
details-to-Overview navigation. Manager flows also visited Accounts and Ben's
opening-balance confirmation, then cancelled without posting. Both passes
verified zero/whole/fractional positive and negative amounts, one-cent amounts,
retained trailing zero for nonzero cents, localized grouping, unsigned monetary
feedback formatting, unchanged parsing, role retention, failure-status visibility,
Manager-only attempt/reason metadata, unchanged fictional data and no horizontal
overflow. No script errors were reported. Integrated German/dark screenshots
at 1440px and 360px were inspected.

## Allowance Status Consistency R2 (2026-10-24)

**Overview and account-details prototypes R2 approved, 2026-10-24; prototype-only.**
The user explicitly approved the current corrections and preceding password-dialog
prototype with "okay, approve also the previous changes". The
Overview's extra Manager check incorrectly hid generic failure status from
Members even though details showed it. Generic execution status now appears for
both roles in both views, consistent with ADR-0016. Attempts and failure reasons
remain Manager-only in details. Error colors, credited-state precedence,
disabled allowances, data and balances are unchanged. This supersedes R1's
unchanged Overview visibility and the older Manager-only summary behavior;
earlier approvals remain history.

Standalone verification passed 16 combinations of Manager/Member,
English/German, light/dark and 1440x1000/360x1000. A separate integrated pass
covered the same 16 combinations through Overview-to-Paul-details-to-Overview
navigation. Assertions covered visible generic failure for both roles in both
views, translated labels, exact Error colors, role retention, Manager-only
attempt/reason fields and no horizontal overflow. No script errors were reported.
No Angular or backend changes were made.

## Account Details Consistency R1 (2026-10-24)

**Draft; prototype-only correction.** Normal account details previously showed
execution failures only when an explicit review state was selected, ignoring
Paul's fictional `failedPeriod` used by Overview. Details now also uses the
shared `PM.allowanceStatus()` result in normal mode, preserving the same
configured/credited precedence. His October failure appears with the existing
September success and the Error foreground. The illustrative attempt date uses
the failed month rather than the unrelated November review fixture.
Existing Manager-only attempt/reason details and Member generic failure status
remain. Overview role visibility is unchanged.

Standalone verification passed 16 combinations of Manager/Member,
English/German, light/dark and 1440x1000/360x1000, navigating Overview to Paul,
back to Overview and then to Emma. A separate integrated pass covered the same
16 combinations using those actual application links. Checks covered matching
failure period, exact Error foreground, retained last success, role-specific
details, unchanged 320-cent balance, no false failure for Emma and no horizontal
overflow. Ten additional role/review-state checks preserved no-credits, pending,
failed, detailed-failure and catch-up overrides. No script errors were reported.
Fresh English/light desktop and German/dark phone screenshots were inspected.

No wireframe, Angular or backend changes are included. This historical draft was
superseded by the approved Allowance Status Consistency R2 above.

## Password Dialog R1 (2026-10-24)

**Wireframe R1 and Profile prototype R1 approved, 2026-10-24.** The user explicitly
approved the current Profile wireframe together with Error Feedback R3 using
"both approved". The approved note was restored to yellow, re-exported and
its PNG inspected, preserving the note position and arrow routing.

The Profile action now uses the locally bundled Lucide `square-asterisk` shape.
Its dialog contains current password, new password and required Confirm new
password fields, with English/German labels. Confirmation matches exactly
without trimming; missing/mismatched confirmation is reported inline and
prevents the simulated request. Input remains after validation and failed saves.
Existing current-password/length checks, session-ending notice, Cancel/focus
return and successful sign-in-again navigation are preserved.
The first-sign-in page and Manager-generated temporary-password dialog are
outside this revision.

Standalone verification passed 16 role/language/theme/viewport combinations:
Manager/Member, English/German, light/dark and 1440x1000/360x1000.
A separate integrated pass covered the same 16 combinations via actual
Overview-to-Administration navigation and the owning Profile dialog.
Both passes checked the local icon, accessible labels, required/mismatch errors,
exact matching with trailing whitespace, keyboard submission, focus to invalid
fields, no request on invalid input, existing password validation, retained
input after a simulated failed save, disabled submitting state, successful retry
and sign-in-again navigation, Cancel/focus return and no horizontal overflow.
Neither pass reported script errors. Fresh English/light desktop and
German/dark phone screenshots were inspected.

The user subsequently approved the current prototype with "okay, approve also the previous changes",
completing its separate approval gate for Angular implementation.

## Error Feedback R3 (2026-10-24)

**Overview prototype R3 approved, 2026-10-24.** Failed executions use `--status-error-fg`,
with a distinct contrast-safe Error red (`#C4352B` light / `#FF6B60` dark).
The user selected this direction after correcting the earlier Danger treatment.
Successful/scheduled execution text remains dimmed, Member visibility and
disabled-allowance behavior are unchanged, and destructive actions retain their
existing colors. The color guide and surface specimen reflect this draft.
The user explicitly approved this revision with "both approved"; R2 approval
below remains history.

Standalone verification passed 16 combinations of Manager/Member,
English/German, light/dark and 1440x1000/360x1000. A separate integrated pass
covered the same 16 combinations through real Administration-to-Overview
navigation, retaining role/language/theme. Assertions checked exact Error and
dimmed colors, translated failure labels, unchanged Member failure visibility
and no horizontal overflow. Neither pass reported script errors. No dialog,
validation or other interaction behavior changed in this color-only revision.
Fresh ordinary Chromium desktop/phone captures and the light/dark surface
specimen were inspected; computed specimen colors match the new tokens.

The approved Error foreground has been implemented in Angular, with exact-color
desktop/mobile production-image checks passing. The Profile revision has its
separate prototype gate described above.

## Allowance Presentation R2 (2026-10-24)

**Accounts and Overview prototypes R2 and wireframes R1 explicitly approved
2026-10-24.** Accounts now has a right-aligned Allowance column between Balance
and Status, with its monthly amount or "No monthly allowance". On phones,
Allowance is directly below Balance on the right. Name/status remain on the left;
names remain non-underlined links and preserve their minimum target.

Overview puts execution information on a separate row below allowance.
Successful/scheduled text uses `--text-dimmed`; the user's R2 correction uses
`--status-danger-fg` for failed executions instead. Failure text remains
Manager-only, and disabled allowances have no execution row. The local design
tokens, color guide and light/dark surface specimen reflect this distinction.
The approved wireframe notes were restored to yellow and re-exported/inspected.
The correction is a prototype color detail, not a structural wireframe change.
The user explicitly approved the current prototypes with "approved" on
2026-10-24, authorizing the Angular port.

Final R2 standalone verification passed 32 view checks: Accounts/Overview,
Manager/Member, English/German, light/dark, 1440x1000/360x1000. A separate
integrated pass covered the same 32 view combinations using real
Overview-to-Accounts navigation and reviewer role switching for Member guidance.
Assertions covered five desktop columns, phone allowance below and right-aligned
with Balance, no page/table overflow, exact theme-aware danger/dimmed colors,
translated failure labels, and absent execution rows for disabled allowances.
Neither pass reported script errors.

Additional R1 interaction/layout checks covered 48 integrated Overview
loading/empty/error states with retry, eight integrated Manager create-dialog
validation/failed-save/input-retention combinations, and return navigation to
Overview/Administration with preserved settings. Eighteen standalone wrapping
checks covered both languages at 320/360/600/899/900/1199/1200/1440/1920px,
long unbroken names and oversized amounts, plus keyboard focus/Enter navigation.
These checks preceded the failure-color correction; the final R2 view matrix
above was rerun after it.

Fresh ordinary headless-Chromium screenshots were inspected for English/light
desktop and German/dark phone Accounts, failed-execution cards in both settings,
and the light/dark surface specimen. Both specimen colors were also checked
against the exact token values. The shared hidden VS Code tab can show stale
paint even when its DOM is current; visual evidence used fresh Chromium captures
rather than treating cached integrated screenshots as current.

## Compact Account Names R2 (2026-10-24)

**Wireframe and prototype R2 separately approved 2026-10-24.** The Accounts view uses
non-underlined name links, a capped name column followed by Balance, and spare
desktop width in Status. Phone grouping and minimum link targets are retained.
The reviewed wireframe's blue marker was cleared, re-exported and inspected.
The user explicitly approved this current prototype for Angular implementation
after the verification below.

Standalone verification: 16 combinations covered Manager/Member, English/German,
light/dark, and outer viewports 1440x1000/360x1000. Checks covered non-underlined
names, the desktop name-width cap, no horizontal page overflow, Member guidance
and Manager creation validation/cancellation.

Integrated verification separately passed the same 16 combinations through
Overview-to-Accounts navigation, creation validation/cancellation, Member
guidance, return to Overview and onward to Administration, retaining language
and theme without script errors. Additional integrated checks exercised long
unbroken names and oversized amounts at 360, 600, 899, 900, 1440 and 1920px,
failed-save input retention, visible keyboard focus and Enter navigation to
account details. Desktop English/light and phone German/dark screenshots were
inspected. Dialog validation/cancellation used DOM activation; focus and detail
navigation used keyboard input. No new loading/error view states were introduced.

## Shared Notice Documents R1 (2026-10-23)

**Approved, 2026-10-23:** "approved, implement". The shared About dialog illustrates eight Angular packages with
one applicable notice block and an explicit English/German applicability list.
Package-name search keeps that complete group visible. Other rows retain their
existing presentation. The legal text remains an illustrative placeholder, not
a duplicate maintained upstream original. Wireframes are unchanged; explicit
approval permits the Angular port, now delivered and verified. Earlier approvals below
describe the preceding presentation.

Standalone verification passed eight offline combinations: English/German,
light/dark and 1440x1000/360x1000. Integrated verification separately passed
sixteen combinations with both Manager and Member through Overview-to-
Administration navigation and the real About entry. Checks covered keyboard
expansion, eight applicable package names, one document block, member-name
search with retained expansion, unchanged single-package rows, Escape/focus
return, preserved preferences and no overflow or script errors. Expansion state
is captured before filtering rather than relying on a queued native toggle event.
Desktop English/light and integrated German/dark-phone screenshots were inspected;
ignored evidence is under `revamp/.local/shared-notice-review/`. These checks
verify the prototype; separate Angular delivery evidence is recorded in the
[design index](../README.md#shared-notice-documents-r1-2026-10-23).

## Integrated Application Entry

Open [index.html](./index.html) to review and test the complete application.
**Approved 2026-10-23.** The entry starts at Overview and frames the
maintained pages, which already reuse the common shell, components, preferences
and fictional data. Actual navigation opens Accounts, account details and
Administration; About opens from its real entry points, and sign out leads to
Login and back through sign in. There is one shell, not an additional outer menu.
Every page below remains usable standalone; the direct shell stays neutral.

The root does not copy markup, invent specimen navigation, maintain a second
state store or access the framed page's DOM. Existing navigation/preferences and
local storage remain owned by the maintained pages. No cross-frame application
state protocol is needed. This is offline review composition, not production
routing or authorization. Wireframes are unchanged; Angular now adopts the
approved surface styling, not this offline composition mechanism.

Follow [ADR-0013](../../ADR/ADR-0013-wireframes-and-click-prototypes.md#integrated-prototype-entry):
verify changed views standalone first, then through this root and real
navigation, including their dialogs and relevant states. Record both kinds of
evidence separately. Passing checks are not approval; the current revision was
separately approved by the user: "I approve the changes. Now do in Angular".

### Integrated Verification (2026-10-23)

The prior focused standalone checks remain recorded below. Separately, 16
integrated combinations passed in ordinary offline Chromium at outer viewports
1440x1000 and 360x1000: Manager/Member, English/German and light/dark. Native
clicks and form input exercised Overview-to-details navigation, Manager Accounts
creation validation/cancellation, Administration/password-dialog cancellation,
Manager Users/create-dialog cancellation, all four About tabs, sign out and
sign in. Role, language and theme survived navigation; one shell remained, with
no horizontal content overflow, outer document scrolling or script errors.
The outer URL stayed on the root entry. No account/user writes were submitted.
Integrated German dark-phone and English light-desktop screenshots were inspected.

| Prototype | Wireframe |
| --- | --- |
| [Application shell](./application-shell/index.html) | [Shell](../wireframes/application-shell/application-shell-wireframe.png) |
| [Overview](./accounts-overview/index.html) | [Accounts overview](../wireframes/accounts-overview/accounts-overview-wireframe.png) |
| [Accounts](./accounts/index.html) | [Accounts](../wireframes/accounts/accounts-wireframe.png) |
| [Account details](./account-details/index.html?account=noah) | [Account details](../wireframes/account-details/account-details-wireframe.png) |
| [Administration](./administration/index.html) | [Profile](../wireframes/administration/administration-profile-wireframe.png) and [Users](../wireframes/administration/administration-users-wireframe.png) |
| [Login](./login/index.html) | [Login](../wireframes/login/login-wireframe.png) |
| [About dialog](./about/index.html) | [Overview](../wireframes/about/about-wireframe.png), [Third-party notices](../wireframes/about/about-notices-wireframe.png), [Legal information](../wireframes/about/about-legal-wireframe.png) |

## Approved Surface Revision (2026-10-23)

All seven prototypes above have the approved border-minimal styling revision.
Account cards and panels use neutral tonal fills; secondary buttons use filled
states; tables use soft alternating rows. Shell regions, dialogs and feedback
no longer have decorative outlines. Floating layers retain their shadows, and
cards gain subtle hover elevation. Input boundaries, keyboard focus and selected
navigation/tab indicators remain unchanged.

Review the [overview](./accounts-overview/index.html) and
[light/dark surface specimen](../design-system/specimens/colors-surfaces.html).
The user explicitly approved this revision for Angular implementation on
2026-10-23, including the earlier Login centring correction. Earlier approvals
below remain history. Wireframes are unchanged; Angular styling now implements
the approved treatment. See the [delivery record](../../../revamp/README.md#tonal-surfaces-2026-10-23).

Checks passed 80 signed-in combinations, 16 public Login/About combinations,
eight validation/failed-save dialog combinations and 48 overview state
combinations. Coverage includes English/German, light/dark, both signed-in roles,
1440px/360px, input boundaries, visible focus, retry, all About tabs and retained
form values. Desktop/mobile card screenshots were inspected in both themes.
Dialog/form activation used DOM events rather than full native keyboard input.

## Structure

- [shared/prototype.js](./shared/prototype.js) builds the application shell
  and provides formatting, dialogs, toasts, and preferences. Each view only
  renders the main content, so the shell can change in one place.
- [shared/prototype.css](./shared/prototype.css) contains the shell and common
  component styles on top of the design-system tokens.
- [shared/data.js](./shared/data.js) holds the fictional seed data. Changes made
  while clicking through are kept in the browser's local storage.
- [shared/about.js](./shared/about.js) provides the same lazy-loaded About modal
  for login, every shell view, and the direct About review page.
- [shared/project-license.js](./shared/project-license.js) is generated mechanically
  from the root [LICENSE](../../../LICENSE). Its decoded text must remain identical
  to that canonical file; regenerate the asset whenever the license changes.

## Legal Content Presentation (2026-10-23)

The shared About dialog's Legal information tab now presents the
[accepted German/English R1 wording](../../terms/self_hosted_legal_information.md)
instead of the three legal placeholders. Paragraph boundaries and text are
retained; Markdown code delimiters are not displayed. A short privacy caveat
repeats an accepted sentence, not an invented operator identity or hosting policy.
The presentation was initially a draft. After verification, the user requested
"implement" on 2026-10-23, accepting the current presentation for Angular.
The port is now implemented and verified; see the
[delivery record](../../../revamp/README.md#legal-information-delivery-2026-10-23).
Earlier R5 and tonal styling approvals remain history for those revisions;
approved wireframes are unchanged. No acknowledgement or consent gate is added.

Standalone verification passed 12 ordinary offline Chromium combinations:
English/German, light/dark and 1440px/360px/320px. Every body paragraph matched
the accepted document after whitespace/Markdown-delimiter normalization.
Existing sentence-case headings retain their labels. Native keyboard checks,
paragraph spacing, no horizontal overflow, internal scroll, fixed header/tabs,
Escape and opener focus return passed without script errors.

Separately, 16 integrated combinations passed after those standalone checks:
Manager/Member, both languages/themes and outer 1440px/360px. Checks followed
real Administration navigation inside the root composition, opened About from
the shell, and repeated the text/interaction/layout checks. The root URL remained
stable and one shell remained. English light-desktop and German dark-phone
screenshots were inspected; generated artifacts are under ignored
`revamp/.local/legal-prototype-review/`. All data/preferences were isolated from
the user's browser. This is prototype verification, not legal certification or
evidence of Angular delivery; that separate verification is recorded above.

## About Approval

The four-tab R5 wireframes and shared prototype were explicitly approved on
2026-10-19 and ported to Angular on 2026-10-23 at the user's request. Overview now
contains product/version/source information only; Project license is the second
tab and shows the complete original text immediately, without an accordion.
Notices preserve expanded rows across filtering/tab changes and reset on close.
Eight focused desktop/mobile production-image checks passed; see the
[delivery record](../../../revamp/README.md#four-tab-about-delivery-2026-10-23).
That initial Angular delivery retained legal placeholders and a staged notice
collection. The later legal-content presentation above replaces those legal
placeholders; third-party coverage remains partial.

The user explicitly approved the current shared dialog and updated shell/login
prototypes on 2026-10-17 for Angular implementation. The component inventory and legal wording remain labelled review placeholders;
repository/source links remain unavailable until their URLs are agreed.
The project license is bundled verbatim for offline reading. Close the dialog on
the direct review page to access its language/theme controls; reopening resets the
selected tab to Overview. Other views retain the existing prototype settings.

The latest login footer reads `Version | About` without an icon. The earlier
Administration-below-Overview approval remains history. The user explicitly
approved the revised Administration-last wireframe on 2026-10-17 ("Approve both
current references"), then its updated shell prototype ("Approve current shell
prototype and implement Angular"). All shared-shell prototypes now show Overview,
Manager-only Accounts, Administration, and labelled About anchored at the bottom
above the version. The revised prototype passed 16 role/language/theme/viewport
combinations. The wireframe's textual icon placeholders remain actual icons in
the prototype. The existing borderless account-image badge prototype was also
explicitly approved in the first of these two confirmations.

## Prototype settings

The user menu contains **Prototype settings** for review:

- Language (English/German) and signed-in role (Manager Mara or Member Emma).
- Navigation mode (auto, compact, wide).
- View state (normal, loading, empty, error) on views that support it.
- **Next save fails** to review error and retry handling once.
- **Reset prototype data** to restore the seed data.

On the login page, every fictional user signs in with `pocket-monkey`; `lena`
must change her password, and five wrong attempts lock the sign-in.

The prototypes illustrate approved behavior; they are not the Angular
implementation and do not enforce security. Amounts are integer cents and the
business date is fixed to 10 Oct 2026 for repeatable reviews.
