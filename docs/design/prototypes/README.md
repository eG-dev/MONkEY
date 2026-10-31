# Click Prototypes

Offline click prototypes for the approved wireframes. Open any `index.html`
directly in a browser; no server or internet access is required. Keep the
surrounding design folder with the pages, because they use the shared design
stylesheet, Roboto fonts, and logo.

## Member Account Assignment R9 (2026-10-31)

**Click prototype R9 draft; not approved.** The assignment dialog removes the
stale-conflict state and uses last-committed replacement. When a save cannot be
confirmed, the selected checkboxes remain visible, saving is disabled and the
Manager can reload the current assignments before deciding whether to save
again. The message does not claim that the save failed. The approved R8
wireframe is unchanged; this detail is not depicted in its list or notes.

Verification, headless Chromium, 2026-10-31:

| Scope | Role | Language | Theme | Viewport | States/flows | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Standalone | Manager, Member | en, de | light, dark | 360, 1440 | Assignment tab visibility, Space selection, unconfirmed save retaining input, reload, successful save, no stale-conflict rejection, page overflow and script errors (16 cases) | pass |
| Integrated | Manager, Member | en, de | light, dark | 360, 1440 | Navigation to Administration and the same changed flows (16 cases) | pass |

These are prototype checks, not production E2E verification or design approval.

## Member Account Assignment R8 (2026-10-31)

**Click prototype R8 approved, 2026-10-31:** "prototype approved". The Account assignments tab removes
Status entirely, including beside names; the released space goes to assigned
accounts. Disabled Members remain listed and editable. Users retains its status
column, and duplicate Member names still include usernames for disambiguation.
The [wireframe R8](../README.md#member-account-assignment-r8-2026-10-31)
was approved and its PNG exported and inspected before this prototype change.

Verification, headless Chromium, 2026-10-31:

| Scope | Role | Language | Theme | Viewport | States/flows | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Standalone | Manager, Member | en, de | light, dark | 360, 1440 | Three columns, no status, disabled Member editing, keyboard and focus, dialog fit, Users status and Member tab visibility (16 cases) | pass |
| Integrated | Manager, Member | en, de | light, dark | 360, 1440 | Shell and tab navigation; same dialog and visibility checks (16 cases) | pass |
| Standalone | Manager | en | light | 1280 | Loading, error, empty; duplicate disabled Member identity, dialog and save | pass |

These are prototype checks, not production E2E verification.

## Member Account Assignment R7 (2026-10-31)

**Click prototype R7 draft; not approved.** Account rows have a 4px gap using
the existing spacing token. Rows remain 36px on desktop and 44px on phones;
R6's selection colors and behavior are unchanged. The approved R4 wireframe
remains unchanged because this is a small dialog-spacing adjustment.

Verification, headless Chromium, 2026-10-31:

| Scope | Role | Language | Theme | Viewport | States/flows | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Standalone | Manager | en, de | light, dark | 360, 1440 | Row gap and height, selection color, Space toggle, focus and dialog fit (8 cases) | pass |
| Integrated | Manager | en, de | light, dark | 360, 1440 | Shell and tab navigation; same dialog checks (8 cases) | pass |

These are prototype checks, not production E2E or design approval. The current
prototype still requires explicit approval before application implementation.

## Member Account Assignment R6 (2026-10-31)

**Click prototype R6 draft; not approved.** Checked account rows use
`--surface-selected` and `--text-selected`, the existing navigation selection
colors in both themes. Hover does not obscure the selection, and the checkbox
and focus outline remain visible. The approved R4 wireframe is unchanged; this
is a dialog styling detail. R5's compact rows and the earlier flow evidence
remain in effect. The previous R2 unfilled-row request is superseded.

Verification, headless Chromium, 2026-10-31:

| Scope | Role | Language | Theme | Viewport | States/flows | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Standalone | Manager, Member | en, de | light, dark | 360, 1440 | Selected and unselected colors, Space toggling, focus, dialog fit and Member tab visibility (16 cases) | pass |
| Integrated | Manager, Member | en, de | light, dark | 360, 1440 | Shell and tab navigation; same dialog and visibility checks (16 cases) | pass |

Selected-row colors were also checked against the active navigation while
hovered in both themes. These are prototype checks, not production E2E or design
approval. The current prototype still requires explicit approval before
application implementation.

## Member Account Assignment R5 (2026-10-31)

**Click prototype R5 draft; not approved.** The assignment dialog uses compact
36px checkbox rows on desktop and retains 44px rows on phones. The extra space
between rows was removed; selection behavior is unchanged and no search was
added. The approved R4 wireframe remains unchanged because this is a small
dialog-spacing adjustment, not a structural or behavioral change. R4 evidence
below remains historical.

Verification, headless Chromium, 2026-10-31:

| Scope | Role | Language | Theme | Viewport | States/flows | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Standalone | Manager | en, de | light, dark | 360, 1440 | Row heights, Space toggling, dialog fit, reachable Save, focus return, no page errors (8 cases) | pass |
| Integrated | Manager | en, de | light, dark | 360, 1440 | Shell and tab navigation; same dialog checks (8 cases) | pass |

These are prototype checks, not production E2E or design approval. The current
prototype still requires explicit approval before application implementation.

## Member Account Assignment R4 (2026-10-31)

**Click prototype R4 draft; not approved.** In the
[Administration view](administration/index.html), Account assignments now shows
Display name, Status, Assigned accounts and the edit icon. Username remains in
Users. Only Members whose display names collide (ignoring case and surrounding
whitespace) show their username beneath the name; the edit button's accessible
name and dialog title also include that username. Disabled Members participate
in the same duplicate-name check.

The column removal is a structural change requiring wireframe review first.
The [assignment wireframe R4](../wireframes/administration/administration-account-assignments-wireframe.drawio)
was approved on 2026-10-31 with "approved", including the user's final arrangement
and split note targets. Its review markers were cleaned and its R4 PNG exported
and visually inspected. The earlier direct-prototype classification was incorrect;
that prerequisite is now completed. Reconciliation found the existing prototype
matches the approved structure and note requirements, requiring no code change.
The R4 prototype remains unapproved; application implementation does not proceed
without explicit prototype approval.

Verification, ordinary headless Chromium, 2026-10-31:

| Scope | Role | Language | Theme | Viewport | States/flows | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Standalone | Manager | en, de | light, dark | 360, 1440 | Four columns, unique names without username, case/whitespace duplicate names, distinct edit labels/dialog title, focus return, Users unchanged, no horizontal overflow (8 cases) | pass |
| Integrated | Manager | en, de | light, dark | 360, 1440 | Shell navigation to Administration and Account assignments, same identity/dialog/layout checks (8 cases) | pass |
| Standalone, post-wireframe reconciliation | Manager, Member fallback | en, de | light, dark | 360, 1440 | Four columns, unique/duplicate names including disabled Member, dialog identity, reachable actions, focus return, list loading/error/empty retaining heading/tabs, Users unchanged, no overflow (8 cases) | pass |
| Integrated, post-wireframe reconciliation | Manager, Member fallback | en, de | light, dark | 360, 1440 | Actual shell/tab navigation and the same approved-wireframe checks (8 cases) | pass |

No page errors occurred. Desktop/phone list screenshots with unique and duplicate
names and the German dark phone dialog were inspected. R3 flow/state evidence
below remains historical; these checks are not production E2E or design approval.

## Member Account Assignment R3 (2026-10-31)

**Click prototype R3 draft; not approved.** It follows the Account assignments,
Users and Profile wireframes R3, approved 2026-10-31. Open the
[integrated application](index.html) as Manager and follow Administration to
the new Account assignments tab, or use the
[standalone Administration view](administration/index.html) and select its Account assignments tab.

The tab lists Members only, including disabled Noah, with Display name,
Username, Status, Assigned accounts and an edit icon. Managers have no rows.
Users no longer has an assignment column and keeps its identity, role, status
and password actions. Members still see only Profile; `#users` and
`#assignments` fall back to Profile for them. On phones each Member is a
compact item with a labelled assigned-accounts line and the edit icon. The R2
dialog behavior is unchanged.

View state now separates list and dialog states: `loading`, `error` (with Try
again) and `no-members` (empty state linking to Users) for the list;
`dialog-loading`, `dialog-error`, `no-active-accounts`, `conflict`,
`unavailable` and `not-member` for the dialog. A not-member reload closes the
dialog and returns to the refreshed Member list.

Verification, ordinary headless Chromium, 2026-10-31:

| Scope | Role | Language | Theme | Viewport | States/flows | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Standalone | Manager, Member | en, de | light, dark | 360, 1440 | Tabs, Member-only rows/order, summaries, Users without assignment column, no horizontal overflow (24 checks) | pass |
| Standalone | Manager | en; de | light; dark | 1440; 360 | Assign Noah, save, row update, focus return, Save reachable on phone | pass |
| Standalone | Manager | en | light | 1440 | loading, error/Try again, no-members/Users link, dialog-error, no-active-accounts, conflict, not-member reload | pass |
| Integrated | Manager, Member | en, de | light, dark | 360, 1440 | Shell navigation to the tab, one shell, Member-only rows, no Member tab, no overflow (32 checks) | pass |
| Integrated | Manager | en | light | 1440 | Saved assignment persists through Overview and back | pass |

No page errors occurred. The English light desktop list, German dark phone list
and German dark phone dialog screenshots were inspected. These are prototype
checks, not production E2E or approval.

## Member Account Assignment R2 (2026-10-30)

**Click prototype R2 draft; not approved.** Backend/Data Proposal R9 and the
Administration Users wireframe R2 are approved. Open the
[integrated application](index.html), follow Administration to Users and edit
the dedicated Assigned accounts column. The
[standalone Administration view](administration/index.html) remains usable;
select its Users tab.

Managers see all accounts; Member Emma starts assigned to Ben and Emma, Lena
to Lena, and disabled Noah to none. Managers have no assignment edit control.
New users and old saved fixture users without assignment data default to none;
use Reset prototype data for the current seed. Assignment selections persist
through actual navigation. No change history is stored. Role/disablement keeps
assignments; retirement/deletion drops them and reactivation does not restore
them. This is a fictional local-storage simulation, not security enforcement.
Production backend, migrations and Angular code are unchanged.

Administration's View state selects normal, loading, empty, error, conflict,
unavailable or not-member for the assignment dialog. Next save fails exercises
kept checkbox input and reload before retry. Stale versions prevent overwrite;
reload refreshes assignments or, for a non-Member target, the user list. No
selection is valid. Retired accounts never appear in the checkbox list. The
Member overview distinguishes no assigned accounts from loading/failure and
the Manager create-first state. Shared About includes the approved English and
German assignment privacy explanation and retains the host-access warning.

Standalone integrated-browser checks passed 16 combinations of Manager/Member,
English/German, light/dark and 360x1000/1440x1000. Manager checks opened disabled
Noah's dialog; Member checks confirmed no Users or assignment controls. Checks
found no table/dialog horizontal overflow. Additional standalone checks covered
all six non-normal review states, a real stale-version conflict, failed save
with unchanged data/kept selection, reload and successful save, focus return,
retired-account exclusion and a 40-character account name in a long summary at
both widths. The German dark phone dialog screenshot was inspected.

Through the integrated entry, a separate 16-case matrix used actual navigation
between Overview and Administration with the same roles/languages/themes and
outer viewports. It checked the assignment dialog, one shell, inner/outer fit,
and six Manager versus two Member overview cards. A saved Mia assignment
survived navigation and appeared for Emma; removing all produced the informative
Member empty state without a create action. Fixture assignments were restored
after these checks. A role change during editing blocked save and Reload
refreshed the user list. Six direct-link checks returned identical localized
not-found messages for inaccessible Lena, retired Alex and a missing ID. Assigned
Emma details stayed Member read-only. Both About privacy translations were
checked through the shell's About dialog. The English light desktop column
screenshot was inspected; no page script errors occurred in the matrices.

Focused Node checks also passed shared visibility/retirement-version behavior,
inline script syntax and preservation of the existing German allowance phrase.
The browser initially cached an older inline script during follow-up checks;
cache was disabled and the current source verified before rerunning them.
These are prototype checks, not production E2E or prototype approval. Older
verification notes below describe their historical all-account access baseline.

Checkbox correction after review, 2026-10-30: native accent-only rendering was
replaced with explicit existing primary-color tokens, a check
mark, focus outline, disabled styling and native forced-color fallback. No new
tokens or layout were introduced. Ordinary headless Chromium passed eight
standalone and eight integrated cases (English/German, light/dark,
360x1000/1440x1000), including distinct checked colors, no horizontal
overflow, visible keyboard focus and actual Space-key toggling. No page script
errors occurred. Early keyboard runs reused the same file URL and accidentally
stacked dialogs; unique document URLs isolated cases and resolved that test
setup error. The separate assignment tab is now drafted in the
[R3 wireframes](../README.md#member-account-assignment-r3-2026-10-30), not yet
approved or implemented in this prototype. The prototype still shows R2's Users
column; its R3 revision awaits explicit wireframe approval.
At the user's request, selected rows no longer receive a background fill; hover
feedback remains. Four standalone and four integrated light/dark and phone/desktop
cases passed with unfilled selected rows, colored checkboxes and Space toggling.

## Retired Account Allowance R2 (2026-10-28)

**Account-details prototype R2 approved, 2026-10-28.** The user explicitly approved
the current revision with "approved". The
[account-details preview](account-details/index.html) places the
unchanged retirement explanation in an info box directly below Monthly allowance,
above the allowance status and amount. It uses the existing info icon, message
colors and spacing tokens. The old description paragraph is removed; active
accounts are unchanged. Earlier R1 approval remains historical. Angular now
implements the approved info box, including its position and status semantics.

To review the retired state, open the integrated entry and follow Accounts to
the archived Alex account.

The actual inline renderer passed 32 Node/JSDOM cases covering Manager/Member,
English/German, active/retired accounts and present/absent current and scheduled
settings. Checks assert one retirement notice immediately after the heading,
info styling and semantics, no old nested paragraph and unchanged edit visibility.

Standalone integrated-browser checks passed 16 combinations of both roles,
English/German, light/dark and 360x1000/1440x1000 using the existing fictional
retired Alex. The localized message appears once, with its info icon and a 12px
token gap below the heading, before allowance content. No overlap or horizontal
overflow was found; the dark phone allowance-panel screenshot was inspected.

Through the [integrated entry](index.html), actual navigation from Overview to
Accounts and the archived Alex link succeeded. A separate 16-case matrix at
outer 360x1000/1440x1000 verified both roles, languages and themes, message order,
no overlap, no inner/outer horizontal overflow and no page errors. Preferences
were restored in memory after each matrix; account data was not changed or saved.
These are prototype checks, not production E2E verification or design approval.

After explicit approval, Angular and production-image builds, catalog validation
and E2E typechecking passed. Four focused production-image retirement executions
passed on desktop/mobile, covering current and scheduled allowances, Manager/Member
info-box visibility, title adjacency, token spacing, fit, retained settings/history
and removal on reactivation. Both production panel screenshots were inspected.
See the [delivery record](../../development.md#retired-account-allowance-r2-2026-10-28).

## Retired Account Allowance R1 (2026-10-28)

**Account-details prototype R1 approved, 2026-10-28.** The user approved the
current wording and divider for implementation, then requested the shorter
explanation in both prototype and application. Retired accounts show
a paused allowance status and an explanation that credits are suspended while
the account is scheduled for deletion. The explanation does not discuss saved
settings. Scheduled enabled amounts retain their
effective month without promising credits. No financial rules or settings change.

The actual inline renderer passed 24 Node VM checks across English/German,
active/retired accounts, present/absent current settings and enabled/disabled/no
scheduled revision. These assert that retirement removes active/scheduled
status and automatic-start promises, while adding the suspension explanation.

Standalone integrated-browser checks passed 16 combinations of Manager/Member,
English/German, light/dark and 360x1000/1440x1000. Noah was temporarily retired
in memory; checks confirmed paused status, explanation, retained credit history,
hidden editing and no horizontal overflow or page errors. Fictional data and
preferences were restored without saving account changes.

Through the integrated entry, a separate 16-case matrix used the existing retired
Alex fixture and confirmed paused status, explanation, hidden editing and no
horizontal overflow. Preferences were restored and account data was unchanged.
Hidden-tab navigation attempts did not reliably reach the intended Noah page;
the integrated matrix therefore uses Alex rather than claiming that navigation
flow passed. These checks cover prototypes only, not the Angular application.

Approved follow-up refinement: a full-width subtle border separates allowance
configuration from Credit runs, with existing spacing tokens above and below.
Four integrated-browser checks at 360x1000 and 1440x1000 in light/dark themes
confirmed a solid 1px theme-colored border, 16px inner spacing and no horizontal
overflow. This divider refinement has not been separately checked standalone.

The subsequently requested shorter English/German explanation is synchronized
with the application catalogs. Five focused production-image retirement checks
passed, including desktop/mobile current and scheduled allowances, unchanged
settings/history, reactivation, the rendered divider and lifecycle permissions.
See the [delivery record](../../development.md#retired-account-allowance-r1-2026-10-28).

## Overview Balance Label R1 (2026-10-26)

**Wireframe and matching prototype approved, 2026-10-26.** The user explicitly approved
the current wireframe with "wireframe approved, implement" after adjusting its
arrow. The [overview prototype](accounts-overview/index.html) now groups Balance
and its amount separately from the account name. The label is right-aligned
directly above the amount, with the existing `--space-2` gap. Amount formatting,
allowance summaries and card navigation are unchanged. The user subsequently
confirmed "prototype approved" for the current integrated revision. Angular
implementation and its separate production verification are complete; see the
[delivery record](../../development.md#approved-balance-label-and-profile-key-icon-2026-10-26).

Ordinary Chromium passed 16 standalone and 16 integrated combinations of
Manager/Member, English/German, light/dark and 360x1000/1440x1000. All six cards
had matching label/amount right edges and the exact token gap, with no label in
the name row or horizontal overflow. Integrated checks followed a card to
details and back before visiting Administration and returning to Overview.
No page errors or fictional data changes occurred. The German light phone
screenshot was inspected; captures are under ignored
`.local/balance-label-r1-{360,1440}.png`.

## User Action Icons R1 (2026-10-26)

**Prototype approved, 2026-10-26.** The user confirmed "prototype approved" for
the current integrated revision. The
[Users prototype](administration/index.html) replaces visible Edit/Reset password
text with the existing shared pencil/key icons, matching Angular. Both buttons
retain translated user-specific accessible names and gain matching title
tooltips. Existing square icon-button dimensions and phone action layout are
reused; dialog behavior and role visibility are unchanged.

Ordinary Chromium passed 16 standalone Administration and 16 separate integrated
scenarios across Manager/Member, English/German, light/dark and
360x1000/1440x1000. Manager checks verified every row's exact icons, absent visible
action text, accessible names, matching titles and square dimensions. Enter
opened Edit; native clicks opened reset confirmation; both cancelled without
data changes. Members retained Profile and no user actions. Integrated checks
used the actual navigation drawer/sidebar and Users tab, then returned to
Overview. No page errors or horizontal overflow occurred. German light phone
and desktop screenshots were inspected under ignored
`.local/user-action-icons-r1-{360,1440}.png`.

The reproducible ignored review probe is
`.local/review-balance-and-user-icons-r1.mjs`. These are prototype checks,
not production verification; Angular already uses icon-only user actions.

## Profile Key Icon R1 (2026-10-26)

**Profile Key Icon R1 approved, 2026-10-26.** The user confirmed
"prototype approved" for the current integrated revision. On
[Profile](administration/index.html), Change password now uses the
existing shared key icon instead of square-asterisk. No layout, strings or
password rules changed. Angular now uses its matching key-round icon, with
separate production verification in the
[delivery record](../../development.md#approved-balance-label-and-profile-key-icon-2026-10-26).
This approval does not retroactively change the historical square-asterisk
approval below.

Ordinary Chromium passed 16 standalone and 16 separate integrated combinations:
Manager/Member, English/German, light/dark and 360x1000/1440x1000. Native clicks
opened and cancelled the dialog with all three password fields intact. Checks
confirmed the exact shared key SVG, localized action name, button fit and no
horizontal overflow or page errors. Integrated checks used actual Overview,
user-menu Profile, dialog and return-to-Overview navigation. German light phone
screenshots were inspected under ignored
`.local/profile-key-r1-{standalone,integrated}-chromium.png`.

The integrated-browser tab separately passed the same two 16-case matrices
using forced clicks, with preferences restored and fictional data unchanged.
Its hidden-tab screenshots were clipped and are not visual evidence; ordinary
Chromium screenshots above are the visual reference. These are prototype
checks, not production verification.

The separate Overview Balance Label R1 wireframe and matching card prototype
are approved; see the
[design index](../README.md#overview-balance-label-r1-2026-10-26).

## Overview Allowance and Panel Labels R1 (2026-10-26)

**Overview Allowance and Panel Labels R1 approved, 2026-10-26.** The user
explicitly confirmed "approved" for the named current revision after the
single-sentence wording and title-spacing refinements.
Overview cards now distinguish an absent current allowance from an enabled
next-month configuration. The latter shows one sentence:
"{amount} monthly from {month}" / "{amount} monatlich ab {month}", with only
the signed amount in green. This replaces the initial two-line presentation.
The effective month/year is localized, not a claimed completed credit. For active
accounts the current amount and execution status remain visible; future amount
changes or disablement add a separate period-specific line. Fully disabled
accounts retain the existing no-allowance state.

On details, Transaction History now uses the same existing caption typography
and secondary color as Balance and Monthly Allowance. Its semantic heading,
spacing, ledger contents and financial behavior are unchanged. The previous
Allowance Clarity R2 approval remains historical; this approved refinement
authorizes the matching Angular changes.

Sixteen standalone and sixteen separate integrated checks passed for
Manager/Member, English/German, light/dark and 360x1000/1440x1000. Each verified
the real Mia card's planned amount and start month, then navigated to details
and back. The three labels had identical computed font size (12px), weight (400)
and theme-specific color. Additional in-memory account projections checked
scheduled amount changes, scheduled stops and preservation of current credit
failure styling. There were no page errors or horizontal overflow. Clicks were
forced because the integrated browser can be hidden; these are not native
keyboard checks. Fictional account data was not mutated and saved preferences
were restored. These were offline-prototype checks before Angular implementation.

The single-sentence refinement passed eight focused standalone/integrated
English/German checks at 360px/1440px: exact text, signed positive amount, no
separate start-date line and no horizontal overflow. The wording request does
not constitute approval of the complete current draft.

Title-spacing refinement: the Monthly Allowance title-to-content gap is 16px
(`--space-5`), increased from 8px without changing the internal content spacing.
Eight standalone/integrated English/German checks at 360px/1440px measured the
gap against the token and confirmed no horizontal overflow.

The approved changes are now implemented in Angular. Separate production-image
and localized layout evidence is recorded in the
[development guide](../../development.md#overview-allowance-and-panel-labels-r1-2026-10-26).

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

## Account Deletion R2 (2026-10-28)

**Account-details and shared account-state prototype R2 approved, 2026-10-28.**
The user approved the revised wireframe and click prototype. Retirement preserves current
and scheduled allowance settings; reactivation retains them. Outstanding
eligible months still require a credit/drop choice. A dropped or previously
credited month is not offered again, and a failed credit's automatic retry is
described as paused while retired. The fixed-clock offline prototype does not
run scheduled credits or automatic purge. Reset prototype data in Prototype
settings to load the updated Alex fixture when older fictional data is stored.

Standalone browser checks covered 16 Manager/Member, English/German, light/dark
and 1440x1000/360x1000 combinations. They checked read-only retired details,
role restrictions, localized dialog text, required choice and overflow.
Additional standalone flows checked enabled, disabled and scheduled settings,
credit/drop, failed requests and retained choices, paused failures, repeated
retirement, resolved months and historical catch-up credit identities.

A separate integrated pass covered the same 16 outer-viewport combinations
through Overview, Accounts and account details; Members used a direct retired
account URL. Additional integrated flows navigated through retirement and both
reactivation choices, including failed saves and retry, and checked settings
and Overview after reactivation. Neither pass reported page or console errors.
The standalone German/dark phone dialog was visually inspected; desktop screenshot
capture was unavailable. Browser interactions included DOM-dispatched clicks,
not additional native keyboard evidence. Prototype approval is not application
verification.

## Account Deletion R1 (2026-10-28)

**Overview shared state, Accounts and account-details prototypes R1 draft.**
The account-details reactivation behavior is superseded by R2 and the approved
R7 policy. The following evidence describes the earlier revision.
Retired accounts are excluded from Overview and active Accounts. Managers can
open the scheduled-deletion list, delete accounts from details and reactivate
retired accounts there. Both roles can read retired details via direct links.
Reactivation requires a credit/drop choice when the fictional fixture has
outstanding months and leaves future allowance disabled. The offline prototype
uses a fixed fictional clock; it does not run an automatic purge. Reset prototype
data in Prototype settings to load the new retired Alex fixture when older
fictional data is already stored.

Standalone browser checks covered 16 combinations of Manager/Member,
English/German, light/dark and 1440x1000/360x1000. They checked the list,
read-only retired details, role restrictions and horizontal overflow. Separate
flow checks covered immediate and opening-only deletion, retirement, failed
save and retry, required choice, credit and drop, retained choice on failure,
and disabled future allowance. The fixed-clock deadline was checked as 30 days.

An independent integrated pass covered the same 16 outer-viewport combinations
through Overview, Accounts and account details. Managers navigated through the
scheduled list; Members used a direct retired-account URL. Additional integrated
checks covered retirement, reactivation without outstanding months, validation,
failed save and retry, credit and deadline rejection. Loading, error/retry and
the existing credit review states were checked separately. No page errors were
reported; the review-state pass also reported no console errors. Integrated
desktop Accounts and German/dark phone account details were visually inspected.
Some integrated interactions used DOM-dispatched clicks rather than native
keyboard input. This is prototype evidence, not application verification or
prototype approval.

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
