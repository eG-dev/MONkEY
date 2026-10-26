# Click Prototypes

Offline click prototypes for the approved wireframes. Open any `index.html`
directly in a browser; no server or internet access is required. Keep the
surrounding design folder with the pages, because they use the shared design
stylesheet, Roboto fonts, and logo.

## Prototype Settings R1 (2026-10-26)

**Shared prototype settings R1 draft.** View state now uses a labelled native
select so long state lists do not clip inside a single segmented row. Existing
change handling continues to persist and apply the selected state. Other
settings and application code are unchanged.

Four focused standalone/integrated account-details checks at 360x1000 and
1440x1000 selected all eight available states, including Credit-catch-up and
Credit-failure-detail, and verified each applied preference. The select fits
inside the settings form without horizontal overflow. Original stored
preferences were restored after validation. These were programmatic selection
checks, not native keyboard-navigation evidence.

## Allowance Clarity R2 (2026-10-26)

**Account-details prototype R2 approved, 2026-10-26.** The user approved the
current revision with "okay, prototype approved. Implement" after the icon
alignment refinement. A calendar icon and explicit scheduled
automatic-allowance label lead the enabled future state, followed by its green
signed monthly amount. The start month/year and automatic-credit explanation
support it; current-month settings are muted below with an 8px separation.
Already-effective settings without a pending change explicitly say active.
Scheduled disablement prioritizes its future stop month, with this month's amount
as supporting text and completed credits preserved. This supersedes R1's
current-month-first hierarchy without changing its dialog, business rules or
wireframe structure. Angular implementation is authorized; the checks below
remain prototype evidence, separate from production verification.

Standalone checks passed all 16 Manager/Member, English/German, light/dark,
360x1000/1440x1000 combinations, including icon, status label, primary positive
amount/color, muted current state, visual order, switch visibility and retained
input. Separate integrated checks passed the same 16 combinations through actual
Overview-to-details-to-Overview navigation, including Manager dialog toggles.
Neither pass reported page errors or horizontal overflow; stored preferences
and fictional data were restored. Four additional standalone/integrated language
flows checked active settings, scheduled amount changes with distinct current
and future amounts, scheduled disablement and absent configuration. Inline
JavaScript parsing passed. These are prototype checks, not Angular verification.

Wording refinement: "Die Gutschriften erfolgen automatisch ab {month}." /
"Credits are posted automatically from {month}." replaces the two-sentence
start text. Both exact rendered sentences passed integrated browser checks.

Spacing refinement: 8px below the section label, 4px between state and amount,
12px before the explanation, 8px before the current-month note, 16px before a
wrapped edit button and 24px before credit history. All use existing spacing
tokens. Eight focused standalone/integrated English/German checks at 360px and
1440px confirmed the actual gaps and no horizontal overflow.

Current-month wording selected during review: "Diesen Monat gibt es noch kein
Taschengeld." / "No allowance this month yet." Both exact rendered texts passed
integrated browser checks. This wording choice does not approve the R2 artifact.

Disabled-state refinement: current and future disabled settings show only
"Automatisches Taschengeld deaktiviert." / "Automatic allowance disabled."
Retained amounts are not displayed on details. An active current allowance with
scheduled disablement still shows its current amount and future stop month.
Four standalone/integrated language checks confirmed the single disabled
message, no exposed retained amount, hidden disabled dialog settings, retained
value on re-enabling and the meaningful active-to-disabled transition.

Three explicit View state fixtures now cover:

- `no-credit-this-month-planned-next`: no October credit/current allowance;
  automatic +20 EUR scheduled for November.
- `credited-this-month-disabled-next`: October +20 EUR credit/current allowance;
  disabled from November, with no retained future amount displayed.
- `credited-this-month-changed-next`: October +20 EUR credit/current allowance;
  automatic +30 EUR scheduled for November, with both periods distinguished.

These render-only projections clone the selected account, retain earlier
credits, replace October/future allowance entries and add an illustrative
opening entry only if required. October credit summaries, history and balances
agree. Source account data is unchanged; returning to Normal restores the
original view. These are review fixtures, not persisted financial changes.

All three states passed 16 standalone and 16 separate integrated combinations
of Manager/Member, English/German, light/dark and 360x1000/1440x1000. Each was
selected through the settings dropdown. Checks covered credits, displayed and
computed balances, current/future amounts, role controls, unchanged source
account data and no horizontal overflow. Integrated checks included actual
Overview-to-details-to-Overview navigation and reported no page errors. Original
stored preferences were restored. Inline JavaScript syntax checking passed.

Current-amount wording is a full sentence: "Für diesen Monat beträgt das
Taschengeld {amount}." / "This month's allowance is {amount}." Both exact
sentences and their signed positive amount passed integrated browser checks.

Scheduled-disablement hierarchy refinement: "Ab {month} ist das automatische
Taschengeld deaktiviert." / "Automatic allowance will be disabled from {month}."
is now the primary calendar-labelled message. The fluent current-month sentence
is muted below; its amount is no longer a separate prominent line. Eight focused
standalone/integrated English/German checks at 360px and 1440px confirmed order,
wording, retained credit information and no horizontal overflow.
Calendar icons align with the first text line rather than the centre of wrapped
status messages. Four integrated English/German checks at 360px and 1440px
confirmed first-line alignment and no horizontal overflow.

The approved presentation and switch-dependent dialog are now implemented in
Angular. Production-image evidence is recorded separately in the
[development guide](../../development.md#allowance-clarity-r2-2026-10-26);
the verification above describes the offline prototypes only.

## Allowance Clarity R1 (2026-10-26)

**Historical unapproved R1 draft, superseded by R2 above.** The allowance dialog hides its amount,
hint and explanatory section when disabled, retaining the value when toggled.
The details panel distinguishes this month's configuration from a scheduled
credit, names the localized month/year and renders its signed amount in the
existing positive color. Disabled schedules also name their effective month.
The prototype's established October 2026 clock makes the next month November;
an explicit scheduled effective month takes precedence. Application code and
wireframe structure are unchanged; explicit prototype approval is pending.

Standalone browser checks passed 16 combinations of Manager/Member,
English/German, light/dark and 1440x1000/360x1000. They verified current-month
wording, November 2026, +50 EUR, positive theme colors, role restrictions,
switch visibility and retained input, with no horizontal overflow or page errors.
A separate integrated pass covered the same 16 combinations through actual
Overview-to-Mia-details-to-Overview navigation and dialog toggles, with no page
errors or horizontal overflow. The initial integrated driver read the frame URL
before navigation completed; awaiting its URL resolved that driver race.

Separate standalone and integrated flows verified initially hidden settings,
zero-amount validation, failed-save input retention, successful retry, scheduled
disablement and saved-amount retention after re-enabling. Saving did not change
the fictional balance or transaction history. Checks used forced clicks and
DOM-dispatched form submissions, not native keyboard-input evidence. Stored
fictional data and preferences were restored after each check. Inline JavaScript
syntax checking passed. These checks do not verify Angular or backend behavior.

Review refinement: the scheduled-credit statement now has an 8px top margin
using `--space-3`. Focused standalone and integrated navigation checks at 360px
and 1440px confirmed the token-sized gap and no horizontal overflow. Browser
geometry assertions allow subpixel rounding. The current R1 remains a draft.

Further review refinement: removed the amount-retention sentence from the
English/German dialog info without changing retention behavior. Four focused
standalone/integrated browser checks confirmed both revised texts and the
remaining explanation that saving does not book money.

The scheduled-credit sentence now explicitly says "automatic credit" /
"automatische Gutschrift". Four standalone/integrated English/German browser
checks confirmed the revised wording and the signed positive amount.

## Password Sampling R1 (2026-10-26)

**Administration Users prototype R1 draft.** Temporary fictional passwords use
rejection sampling before mapping 32-bit random values to the 56-character
alphabet. This removes modulo bias without changing the twelve characters,
four-character grouping, copy action or dialog behavior. These remain prototype
values, not authentication credentials. Wireframes and application code are
unchanged.

Standalone browser verification passed 16 combinations of Manager/Member,
English/German, light/dark and 1440x1000/360x1000. All eight Manager combinations
completed the actual password-reset flow, retaining the alphabet, grouped length,
copy-button focus and no horizontal overflow; Members had no reset controls.
No page errors were reported.

A separate integrated pass covered the same 16 outer-viewport combinations
through actual Overview-to-Administration-to-Overview navigation, including
eight Manager resets and eight Member restrictions, with no page errors.
These checks used DOM-dispatched clicks, not native keyboard-input evidence.

Separate standalone and integrated checks covered blank create-user validation,
successful creation with a grouped password, a simulated failed reset with no
password shown, and successful retry. A standalone deterministic RNG check
forced zero, the last alphabet index, the last accepted 32-bit value, the
rejection threshold and the maximum 32-bit value. It verified repeated rejection
and resampling, exact grouped output and the value passed to a stubbed clipboard
API; it did not write the operating-system clipboard. Browser test changes to
fictional data and preferences were restored. This remains a draft reference,
not approval of a new design or production authentication verification.

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
[R6 application delivery record](../../development.md#grouped-notice-documents-r6-2026-10-24).

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
ignored evidence is under `.local/shared-notice-review/`. These checks
verify the prototype; separate Angular delivery evidence is recorded in the
[design index](../README.md#shared-notice-documents-r1-2026-10-23).

## Integrated Application Entry

Open [index.html](index.html) to review and test the complete application.
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
| [Application shell](application-shell/index.html) | [Shell](../wireframes/application-shell/application-shell-wireframe.png) |
| [Overview](accounts-overview/index.html) | [Accounts overview](../wireframes/accounts-overview/accounts-overview-wireframe.png) |
| [Accounts](accounts/index.html) | [Accounts](../wireframes/accounts/accounts-wireframe.png) |
| [Account details](account-details/index.html%3Faccount%3Dnoah) | [Account details](../wireframes/account-details/account-details-wireframe.png) |
| [Administration](administration/index.html) | [Profile](../wireframes/administration/administration-profile-wireframe.png) and [Users](../wireframes/administration/administration-users-wireframe.png) |
| [Login](login/index.html) | [Login](../wireframes/login/login-wireframe.png) |
| [About dialog](about/index.html) | [Overview](../wireframes/about/about-wireframe.png), [Third-party notices](../wireframes/about/about-notices-wireframe.png), [Legal information](../wireframes/about/about-legal-wireframe.png) |

## Approved Surface Revision (2026-10-23)

All seven prototypes above have the approved border-minimal styling revision.
Account cards and panels use neutral tonal fills; secondary buttons use filled
states; tables use soft alternating rows. Shell regions, dialogs and feedback
no longer have decorative outlines. Floating layers retain their shadows, and
cards gain subtle hover elevation. Input boundaries, keyboard focus and selected
navigation/tab indicators remain unchanged.

Review the [overview](accounts-overview/index.html) and
[light/dark surface specimen](../design-system/specimens/colors-surfaces.html).
The user explicitly approved this revision for Angular implementation on
2026-10-23, including the earlier Login centring correction. Earlier approvals
below remain history. Wireframes are unchanged; Angular styling now implements
the approved treatment. See the [delivery record](../../development.md#tonal-surfaces-2026-10-23).

Checks passed 80 signed-in combinations, 16 public Login/About combinations,
eight validation/failed-save dialog combinations and 48 overview state
combinations. Coverage includes English/German, light/dark, both signed-in roles,
1440px/360px, input boundaries, visible focus, retry, all About tabs and retained
form values. Desktop/mobile card screenshots were inspected in both themes.
Dialog/form activation used DOM events rather than full native keyboard input.

## Structure

- [shared/prototype.js](shared/prototype.js) builds the application shell
  and provides formatting, dialogs, toasts, and preferences. Each view only
  renders the main content, so the shell can change in one place.
- [shared/prototype.css](shared/prototype.css) contains the shell and common
  component styles on top of the design-system tokens.
- [shared/data.js](shared/data.js) holds the fictional seed data. Changes made
  while clicking through are kept in the browser's local storage.
- [shared/about.js](shared/about.js) provides the same lazy-loaded About modal
  for login, every shell view, and the direct About review page.
- [shared/project-license.js](shared/project-license.js) is generated mechanically
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
[delivery record](../../development.md#legal-information-delivery-2026-10-23).
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
`.local/legal-prototype-review/`. All data/preferences were isolated from
the user's browser. This is prototype verification, not legal certification or
evidence of Angular delivery; that separate verification is recorded above.

## About Approval

The four-tab R5 wireframes and shared prototype were explicitly approved on
2026-10-19 and ported to Angular on 2026-10-23 at the user's request. Overview now
contains product/version/source information only; Project license is the second
tab and shows the complete original text immediately, without an accordion.
Notices preserve expanded rows across filtering/tab changes and reset on close.
Eight focused desktop/mobile production-image checks passed; see the
[delivery record](../../development.md#four-tab-about-delivery-2026-10-23).
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
