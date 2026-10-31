# POCKET MONkEY design references

Store editable draw.io sources and approved PNG previews here for
[step 2B: product UX and UI design](../../plans/migration/02b-ux-ui-design.md).
The user approved the then-current wireframes, click prototypes, visual design,
and implemented representative design on 2026-10-10, including all subsequent
refinements recorded below. Approval applies to that reviewed revision;
later design changes require renewed review. It does not settle future business
policies or certify unperformed technical checks.

Review current drafts in draw.io. PNG previews are exported after source
approval and marker cleanup, so an existing preview may show an earlier
revision while its source is a draft.

## Reusable Annotation Example

See the UI/UX skill's [annotation syntax and example](../../.github/skills/ui-ux-design/SKILL.md#annotation-scopes)
and [repository profile](../../.github/skills/ui-ux-design/references/pocket-monkey.md).
The [ADR](../ADR/ADR-0013-wireframes-and-click-prototypes.md) owns decisions and
approval policy; this index records artifact status and review evidence.

## Wireframe Approval (2026-10-31)

**All 12 wireframes approved at R3/annotation revisions, 2026-10-31.** The user explicitly approved
the annotation revisions R1–R6 below, the Helvetica font change, and Member
Account Assignment R3 (Account assignments, Users and Profile): "I approve all
the adjustments we did on the wireframes due to improvements in the skill.
Additionally. the account to member assignment feature and its wireframes are
unapproved to my knowledge. I approve them too". The approval covers the current
sources, including the user's note arrangement; earlier approvals remain history.

Cleanup: all review-marked notes were restored to yellow with black text and
the obsolete "(R5 draft)"/"(R6)" page-name suffixes were removed from the About
sources. Geometry, text and connectors are unchanged. All 12 PNG previews were
re-exported from the cleaned sources and visually inspected. The R1–R6 and R3
sections below are kept as history; their "not approved" status is superseded.
The Member Account Assignment click prototype still needs explicit approval
before Angular work.

**Member Account Assignment R3 click prototype draft, 2026-10-31; not approved.**
Administration now has the Account assignments tab and Users has no assignment
column. See the [prototype record](prototypes/README.md#member-account-assignment-r3-2026-10-31)
for states and the standalone/integrated verification matrix. Explicit prototype
approval is required before Angular implementation.

## Member Account Assignment R4 (2026-10-31)

**Account assignments wireframe R4 approved, 2026-10-31; click prototype R4 draft, not approved.**
The user approved the current, user-arranged source with "approved", including
the split list, duplicate-name and editor notes. R3 approval remains history.
Account assignments uses display names without a Username column; only duplicate
Member names show a secondary username, also included in edit labels and dialog
titles. Users and Profile sources are unchanged. Removing the column is a
structural change; the earlier direct-prototype classification was incorrect.

The [R4 assignment source](wireframes/administration/administration-account-assignments-wireframe.drawio)
removes the Username header and cells and redistributes their width to Display
name and Assigned accounts, preserving the table boundary and action positions.
The list note covers list loading/empty/error states (heading and tabs remain
available) and compact phone items. The user attached it to the viewport and
placed it below the separate duplicate-name note, which uses
`[edge-case: duplicate names]` and targets the Display name header. Both left
notes now have the user's 500px width. The editor note covers active-account
selection and reachable phone dialog actions; the existing 480px editor and
visibility note widths are retained. Approved geometry, text and routing are
preserved; only the three blue review notes were reset to normal yellow with
black text. All arrows start at fixed note-edge centers.

Source checks passed: well-formed XML, unique IDs, four contiguous columns per
row, valid connector references and zero source offsets, 1440px dashed viewport
first, Helvetica notes outside the viewport without note overlap, correct
approved viewport/name/editor annotation targets and normal note colors.
The [PNG preview](wireframes/administration/administration-account-assignments-wireframe.png)
was exported from the cleaned approved R4 source with draw.io and visually
inspected: all notes are readable, correctly attached and outside the viewport.

The existing R4 prototype already matches the approved structure and note
requirements, so reconciliation required no code change. Sixteen ordinary
Chromium cases passed across standalone/integrated navigation, English/German,
light/dark and 360/1440px: four columns, duplicate names including disabled
Members, dialog identity and reachable actions, focus return, loading/error/empty
states retaining heading/tabs, Users unchanged, Member fallback and no page
errors. Prototype approval remains separate and pending. See the
[R4 prototype record](prototypes/README.md#member-account-assignment-r4-2026-10-31)
for verification evidence; production code is unchanged.

## Annotation Clarity R1 (2026-10-30)

**All 12 wireframes in the reference table are Annotation Clarity R1 drafts; not approved.** The annotations were shortened without moving notes, controls or connectors. Blue notes identify the changes. The earlier status and approvals in the table are retained as history, not approval of R1. The Account assignments, Users and Profile diagrams also retain their pending Member Account Assignment R3 review. The prior notes below preserve detailed design context for prototype review, including the user-edited R3 sources. They are historical, not new decisions: current ADRs and later approved designs take precedence. In particular, Member visibility is limited to assigned active accounts and retired details are Manager-only. The prototypes have not been changed. Note arrangement and source review are pending; export follows approval.

### Annotation Scope R2 (2026-10-30)

**All 12 wireframes remain drafts; R2 is not approved.** Scope headers group
conditional role, state, viewport and phone details within the existing notes;
redundant visible-layout descriptions were removed, including the Legal
information tab note and its connector. Changed notes are blue. Existing note
positions and remaining connectors are preserved. Arrange notes in draw.io as
needed before source review. The linked PNGs have not been updated for R2 and
may show an earlier revision; export follows explicit approval.

### Annotation Formatting R3 (2026-10-30)

**The wireframes remain drafts; R3 is not approved.** Scope headers are bold,
with a blank line before each header that follows other note text. Some note
boxes were made taller to fit without moving their anchor positions; arrangement
and visual inspection remain pending. PNG previews remain unchanged pending
approval.

### Role Scope R4 (2026-10-30)

**The wireframes remain drafts; R4 is not approved.** Notes now use singular
role headers and separate Manager and Member sections for differing behavior.
Note arrangement and visual inspection remain pending; PNGs are not exported
until approval.

### Combined Scope R5 (2026-10-30)

**The wireframes remain drafts; R5 is not approved.** Account details and Accounts
now express combined role/state/device conditions in adjacent brackets, for
example `[role: manager][state: retired]`. Opening-form conditions move from prose
into their headers; phone transaction/deletion conditions explicitly retain their
Manager scope. Note geometry and connectors are unchanged. Source arrangement
and visual review remain pending; PNGs are unchanged until explicit approval.

### Placeholder Conventions R6 (2026-10-30)

**The wireframes remain drafts; R6 is not approved.** Text placeholders now use
curly braces (`Version {build version}`, `{Package source}`, reviewed legal-text
bodies); square brackets are reserved for icons. Named icon placeholders became
`[icon] Search components`, `[icon] GitHub project`, `[icon] Source for this
version`, and the rename action `[rename]`. The two Login card notes were merged
into one blue note with one arrow (grown upward, outside the viewport), and the
signed-out/signed-in header split into separate sections. Three connectors in
Profile and Shell were made explicitly straight and black. No other geometry
changed; arrangement and source review are pending, and PNGs follow approval.

<details>
<summary>Previous annotation detail (historical context)</summary>

- **login / login-wireframe.drawio - sNdbuL23PBqq-89-687P-2:** The area for notes/errors is hidden when there are none. Errors (in the notes area): incorrect username or password, without saying which; locked after 5 failed attempts (try again in 15 minutes); sign-in temporarily unavailable. The username is kept, the password is cleared. Session expired : info note "Your session has expired. Please sign in again." Sessions end after 8 hours or when a Manager resets the password, changes the role, or disables the user.

- **login / login-wireframe.drawio - login-note-3:** Forced password change : after the first sign-in or a password reset, the card shows "Change your password" with an info note, current password, new password (at least 12 characters), "Change password", and a "Sign out" link. Afterwards the user signs in again. Phone : full-width form without the card; same states.

- **login / login-wireframe.drawio - login-footer-note:** Footer in every login state: Version | About, with a pipe separator and no info icon. Opens the shared About modal without signing in; closing restores focus here and preserves the form. Footer flows below tall content without overlap on phones.

- **application-shell / application-shell-wireframe.drawio - repository-note:** Build version remains beneath About in smaller text. GitHub/source, project license, third-party notices and operator/privacy links move to About. GitHub stays unavailable there until the future repository URL is agreed.

- **accounts-overview / accounts-overview-wireframe.drawio - undefined-41:** Managers only: link to the dedicated Accounts view. Members see all accounts read-only, without this link.

- **accounts-overview / accounts-overview-wireframe.drawio - undefined-42:** The whole card links to the account details. Accounts are ordered by name. Cards wrap: 4 per row at full width, fewer when space is narrower. Phone: one full-width card per row, "Manage" as short link. States Loading: skeleton cards. Empty: "No accounts yet"; Managers additionally get a link to create the first account in Accounts. Error: message with "Try again"; no stale balances shown as current.

- **accounts-overview / accounts-overview-wireframe.drawio - undefined-43:** The Balance label is right-aligned directly above its amount, not below the account name, on desktop and phones. Balance colored by sign: positive green, negative red, zero standard text. Uninitialized accounts say so instead of showing 0.

- **accounts-overview / accounts-overview-wireframe.drawio - undefined-44:** Allowance has two rows on desktop and phone. The first row shows the monthly amount with sign-based coloring and its frequency, or "No monthly allowance". The second row shows execution information, including the credit date, next scheduled credit, or Manager-visible failure status, using the theme-aware Text dimmed color. Existing role visibility and scheduling rules apply. No execution row is shown for "No monthly allowance". Long text wraps.

- **accounts / accounts-wireframe.drawio - retirement-list-note:** Scheduled for deletion Managers see retired accounts here, separate from active accounts. Names and chevrons open read-only details; show the scheduled deletion date. Omit the section when empty. Reactivation is available only in account details. Phone: stack the name and date without clipping; the name opens details.

- **accounts / accounts-wireframe.drawio - undefined-34:** Columns: Name, Balance, Allowance, Status, chevron. Name has a capped width. Balance and Allowance are right-aligned. Additional desktop width is allocated to Status. Allowance shows the configured monthly amount or "No monthly allowance". Names are links without underlines, with hover feedback and visible keyboard focus. The chevron opens account details. Renaming is available via the pencil in account details; allowance configuration is also in account details. Phone: avatar/name share a 44px-minimum link on the left; muted status is below the name. Balance is on the right, with Allowance directly below it. No separate status or chevron column. Names and amounts wrap without overlap.

- **accounts / accounts-wireframe.drawio - undefined-36:** Create dialog only Field: Name (1-40 characters, unique). Buttons: Cancel and Create account. On success open account details; new accounts are not initialized. Rename and image changes are available only in account details. Full-screen on phones. Creation validation Errors are announced, including duplicate names. Input is kept on errors and retries. No existing name, balance, or history is editable in this list.

- **account-details / account-details-wireframe.drawio - transaction-dialog-note:** Record transaction opens a dialog at every width: Deposit/Withdrawal selector, positive amount (up to two decimals), optional comment (up to 500 characters), mode-coloured submit. Errors retain input; success closes and refreshes balance/history. No inline transaction form. Right-aligned actions: icon-only refresh, then labelled Record transaction for Managers with an opening balance. On phones the action group wraps together onto a right-aligned line. Rename stays beside the name. Managers only. The mode is shown by color plus sign: deposit green (+), withdrawal red (−) on the selected toggle, the amount sign, and the button. Submitting disables the button until the backend confirms; retries reuse the same request so nothing is booked twice. Withdrawals may make the balance negative. Member: balance, allowance and history only; no business-write controls. Phone: labelled Record transaction stays after refresh in the header and opens a full-screen dialog. Balance, allowance and history remain stacked; amounts are never truncated.

- **account-details / account-details-wireframe.drawio - undefined-60:** Managers: avatar edits the image (PNG/JPEG/WebP); pencil beside the heading renames (1-40 characters, unique). Errors keep input; Cancel keeps the name. Members see no edit controls. Rename is available only on this page.

- **account-details / account-details-wireframe.drawio - undefined-63:** Newest first, 20 per page. Dates in the business timezone, formatted for the language. Amounts signed and colored. Without transactions: "No transactions yet".

- **account-details / account-details-wireframe.drawio - undefined-64:** Not initialized The balance shows "Not initialized". Managers get an "Opening amount" form instead of "Record transaction": signed amount (may be zero or negative), optional comment, "Post opening amount". Final once posted, so a confirmation dialog asks before posting. Members see a note instead.

- **account-details / account-details-wireframe.drawio - undefined-65:** Monthly allowance Current/next-month settings; positive amount or disabled (retains amount). Opening required. Credit runs below, separated by space: latest credited month/time or no credits; oldest pending/failed month. No repeated amount. Managers see attempt details/reason. Retries catch up eligible months. History: Allowance by Automatic, with its month. Saving never posts money.

- **account-details / account-details-wireframe.drawio - delete-account-note:** Delete account Managers only. The icon-only button has a Delete account tooltip and accessible name. Confirm deletion and explain both possible outcomes: immediate deletion without manual transaction or credited allowance history, otherwise retirement for 30 days. On success return to the account list. Announce failures and allow retry. On phones, wrap the header actions without overlap; the confirmation fills the screen.

- **account-details / account-details-wireframe.drawio - retired-details-note:** Retired state Show the banner only for retired accounts, below the name and image. Both roles can open a direct link and see the deletion date, balance, allowance and history. Hide rename, image, transaction, opening and allowance controls; no credits or business writes are allowed. Only Managers can reactivate, from this view before the deadline; Members see no action. When eligible allowance months are outstanding, require a choice: credit them or permanently drop them. Existing allowance settings stay unchanged and normal scheduling resumes after reactivation. Announce failures and keep the choice for retry. Format the date for the selected language and business timezone.

- **administration / administration-account-assignments-wireframe.drawio - visibility-note:** Managers only List Members only, including disabled Members. Managers never appear here: their account access is unrestricted and their retained assignments cannot be edited until demotion. Users remains the place for identity, role, status and passwords. Members see only Profile.

- **administration / administration-account-assignments-wireframe.drawio - editor-note:** Edit a Member's assignments Show assigned active account names, wrapping long lists, or No accounts. [edit] has a Member-specific accessible name and tooltip. Open a separate dialog naming the Member, with a scrolling active-account checkbox list, Save and Cancel. No selection is valid and removes all assignments. Retired accounts are not selectable; reactivation requires fresh assignment. Distinguish loading, no active accounts and load failure with Retry. Saving prevents duplicate submission. Save failure keeps input; reload before retry after an uncertain result. Stale edits, unavailable accounts or a changed role require reload/review. A role change reload returns to the Member list. No assignment history. Checked boxes use primary colors without filling the selected row. Keep keyboard focus visible.

- **administration / administration-account-assignments-wireframe.drawio - list-states-note:** List states and phones Loading and failure with Retry are distinct from an empty Member list. No Members: show an empty state with a link to Users, not account creation. A Member with no assignments still has a row and an edit control. Phone: tabs remain reachable without page overflow; each Member becomes a compact list item with name, username, status, assigned account names and an edit icon. No role column, user-edit or password actions. Dialog fits the viewport with its list scrolling and Save/Cancel reachable.

- **administration / administration-profile-wireframe.drawio - undefined-22:** "Change password" opens a dialog The action uses the square-asterisk icon. Fields: current password, new password (at least 12 characters), and Confirm new password. Confirmation is required and must match exactly. A mismatch appears at the confirmation field and prevents submission; entered values are kept. Cancel and Change password actions. Other errors appear at the relevant field (e.g. wrong current password). All sessions end after a successful change; the user signs in again. Full-screen on phones.

- **administration / administration-users-wireframe.drawio - undefined-38:** Managers only. The last active Manager cannot be disabled or demoted; the related controls are disabled with an explanation. Edit user dialog Display name, role, Active switch, and "Reset password". Role change or disabling ends the user's sessions. For the last active Manager, "Member" and "Active" are disabled with the reason shown.

- **administration / administration-users-wireframe.drawio - undefined-40:** Create user dialog Username (sign-in name, not changeable later), display name (up to 100 characters), role (Member / Manager). Then a second step shows the temporary password once with Copy and Done: never shown again, the user must change it at the first sign-in.

- **administration / administration-users-wireframe.drawio - undefined-42:** Reset password Asks for confirmation, then shows the new temporary password once (same step as when creating). Existing sessions of that user end.

- **administration / administration-users-wireframe.drawio - member-account-assignments-note:** Account assignments tab Managers manage Member account visibility in this separate tab. Users remains focused on identity, role, status and password actions; there is no assignment column or assignment action here. Members see only Profile.

- **about / about-legal-wireframe.drawio - tabs-note:** Last tab: Legal information. Distinct operator, warranty/liability and privacy sections in the same modal from login or app, for both roles. Retain current language/theme. Close or Escape restores focus to the opener; background stays inert. No consent gate or per-user acceptance state.

- **about / about-legal-wireframe.drawio - operator-note:** Placeholder structure only, not approved legal wording. Distinguish the person operating the instance from household users and project maintainers. Review hosting, access/HTTPS, configuration, updates, storage and backups/recovery responsibilities. No invented operator identity, contact or hosting promise.

- **about / about-legal-wireframe.drawio - warranty-note:** Wording remains subject to review. Qualify warranty/liability statements by mandatory law; do not promise absolute immunity, a service-level agreement or continued maintenance/support. This information must not restrict AGPL rights or replace the full text on the dedicated Project license tab.

- **about / about-legal-wireframe.drawio - privacy-note:** Privacy is a distinct section, not a liability disclaimer. Describe actual local processing and operator responsibilities after review; do not imply project maintainers host household data or reuse cloud legal texts. Publish no household/user details. German/English content must be reviewed separately from this layout.

- **about / about-legal-wireframe.drawio - phone-note:** Desktop: near-full viewport dialog; phone: full-screen with one readable column. Header/tabs remain visible; content scrolls internally. Text grows naturally; dashed boxes are placeholders, not fixed-height panels. Scroll the tab strip horizontally without page overflow. Accessible tabs and visible focus. Bundle required content locally.

- **about / about-license-wireframe.drawio - tabs-note:** Tab order: Overview (default), Project license (selected), Third-party notices, Legal information. Shared modal, public and both roles. Keyboard tabs, Close/Escape and opener focus return remain unchanged. No consent or acceptance gate.

- **about / about-license-wireframe.drawio - license-note:** Show the entire canonical project-license text immediately when selecting this tab. No details/summary, accordion, expand button or collapsed state. Preserve the bundled AGPL text verbatim, including line breaks; translate navigation/labels only. Project license remains AGPL-3.0-only. The dashed text box represents flowing text, not a framed fixed-height tool.

- **about / about-license-wireframe.drawio - file-note:** Keep a local link to the complete original license file, identical to the inline text and root LICENSE. No external network access is needed. This tab does not replace project/source links on Overview or third-party license obligations on the notices tab.

- **about / about-license-wireframe.drawio - phone-note:** Desktop: near-full viewport; phone: full-screen. Header/tabs remain fixed while the license flows in the existing dialog scroll area. Keep centred content stable with balanced scrollbar gutters. Wrap long lines without horizontal content overflow; do not add a nested license scroll box. Tab strip can scroll horizontally on phones.

- **about / about-notices-wireframe.drawio - tabs-note:** Shared modal from login or app, for both roles. Close or Escape restores focus; background stays inert. Tab order: Overview (default), Project license, Third-party notices (selected), Legal information. Only third-party content here; operator/privacy content stays last.

- **about / about-notices-wireframe.drawio - search-note:** Search includes component and package names. A matching package retains its complete parent entry and explicit document applicability. Keep the tabs/search visible for empty results. Preserve group/document expansion across filtering and tab changes; closing the dialog resets it. Controls/status text are German/English; original legal texts are not translated.

- **about / about-notices-wireframe.drawio - inventory-note:** Each expanded entry contains clearly bounded package/license groups. Show applicable packages once per group, with individual source links. Put shared version/license metadata in the group heading; retain individual metadata when members differ. Give each document a readable title and independent expansion, initially closed. Open original always opens the locally bundled file without toggling its body. The illustrated MIT body is open only to show the pattern: expansion reveals the complete unchanged text and pushes later groups down. Do not repeat package lists before every document. This partial collection is not release approval.

- **about / about-notices-wireframe.drawio - phone-note:** Desktop: near-full viewport dialog; phone: full-screen. Stack group metadata below its heading and wrap package names, document titles and links. Keep header/tabs visible; use one scrolling content area, not nested legal-text scrollers. Document expansion uses keyboard-accessible controls with clear focus/state. Group borders, headings and spacing distinguish sections without relying on color. Tab-strip scrolling must not cause page overflow.

- **about / about-wireframe.drawio - access-note:** One shared About modal opens over login or the app, for both roles. Desktop: near-full viewport; phone: full-screen. Close icon and Escape dismiss it and restore focus to its opener. Trap focus; background is inert. Keep header/tabs visible; scroll content internally. Retain current language/theme. No authentication or consent gate.

- **about / about-wireframe.drawio - source-note:** Show only public version/revision metadata. GitHub and source access move here from the shell/login footer. Repository URL remains unavailable until agreed. Source must match this release; do not substitute the latest branch. Never invent URLs or expose deployment diagnostics.

- **about / about-wireframe.drawio - license-note:** The project license moves to its own second tab: Project license. Overview contains only project/version/source information. The license tab shows the complete bundled, unmodified AGPLv3 text immediately, without an expandable row. Project grant remains version 3 only.

- **about / about-wireframe.drawio - notices-note:** Tab order: Overview (default), Project license, Third-party notices, Legal information. Operator/privacy content stays on the last tab. Each tab has its own wireframe. Keyboard-accessible tabs and visible active state; scroll the tab strip on phones without page overflow.

</details>

## Member Account Assignment R3 (2026-10-30)

**Administration wireframes R3 draft; not approved.** The user requested the
dedicated tab on 2026-10-30 ("okay now change the wireframe to have this dedicated
tab"). This settles the layout direction, not approval of these revised artifacts.

- New [Account assignments source](wireframes/administration/administration-account-assignments-wireframe.drawio)
  and [preliminary PNG](wireframes/administration/administration-account-assignments-wireframe.png):
  Manager-only tab with Members only, including disabled Members. Columns are
  Display name, Username, Status, Assigned accounts and Actions (assignment edit
  only). No Manager rows, role column, user creation or password actions.
- Revised [Users source](wireframes/administration/administration-users-wireframe.drawio)
  and [preliminary PNG](wireframes/administration/administration-users-wireframe.png):
  remove the assignment column and add the third tab. Identity, role, status,
  create/edit user and password behavior remain unchanged.
- Revised [Profile source](wireframes/administration/administration-profile-wireframe.drawio)
  and [preliminary PNG](wireframes/administration/administration-profile-wireframe.png):
  synchronize Manager tab navigation; Members still see only Profile.

The assignment dialog behavior stays per Member with Save/Cancel, active accounts
only, valid empty selection and the agreed failure/conflict/reload behavior.
Notes retain primary-colored checked boxes without selected-row fill. The new
list notes cover empty/loading/failure and phone layout. Existing unrelated
geometry and connector routing are preserved; the former assignment connector
now targets the new Users tab link because its old cell was removed.

All three XML sources passed unique-ID, connector-target, 1440px viewport and
tab checks. The new list's Member-only rows and disabled Noah were checked;
Users has no assignment cells. All three PNGs were exported and visually
inspected as preliminary previews. Changed notes are blue, with initial placement
outside the viewport. **Note arrangement is pending:** the user may place them
on any side in draw.io before final export/review and explicit wireframe approval.
The R2 click prototype is unchanged; do not start its R3 revision or production
implementation before the required approvals. Earlier approvals below are history;
the linked Administration sources and previews now show R3.

## Member Account Assignment R2 (2026-10-30)

**Administration Users wireframe R2 approved, 2026-10-30.** The user explicitly
confirmed "wireframe approved" after adjusting the assignment connector to
Lena's cell. Backend/Data Proposal R9 was explicitly approved on 2026-10-30 in
the [account assignment plan](../../plans/migration/03a-accounts.md#member-account-assignment--backenddata-proposal-r9).
The [editable source](wireframes/administration/administration-users-wireframe.drawio)
adds a dedicated Assigned accounts column between Status and Actions. It shows
account names or No accounts with an edit icon for Members, including disabled
Members; Managers show All accounts without an assignment control. On phones,
assignments remain a separate labelled field, not a user-menu action. The
note describes a separate active-account checkbox dialog, independent
Save/Cancel, empty selection, load/save/conflict states, retirement and phone
behavior. Existing user-edit/password actions remain in the Actions column.
R2 replaces R1's mixed assignment/user actions at the user's request; R1 was
not approved.
The review note is restored to yellow, preserving all user geometry and routing.
The [PNG preview](wireframes/administration/administration-users-wireframe.png)
is re-exported from the approved source. Earlier wireframe approvals remain
historical.

**Member Account Assignment R2 click prototype draft; not approved.** The
[integrated application](prototypes/index.html) and standalone
[Administration Users](prototypes/administration/index.html) now show the
dedicated column and active-account checkbox dialog, including disabled Members,
empty selection, load/save failures and stale-edit/role/account conflicts. Shared
fictional assignments filter Member overview cards and direct account links;
retirement/deletion removes assignments without restoring them on reactivation.
The Member empty state and approved bilingual About privacy copy are included.
The production backend and Angular application are unchanged.

Sixteen standalone and sixteen integrated role/language/theme/viewport cases
passed at 360x1000 and 1440x1000, with focused save/retry, empty, conflict, focus,
long-name, navigation-persistence and private direct-link checks. The German
dark phone dialog and English light desktop column screenshots were inspected.
See the [verification record](prototypes/README.md#member-account-assignment-r2-2026-10-30).
Explicit approval of this click prototype is still required before Angular work.

Checkbox review correction, 2026-10-30: the draft assignment dialog now uses
explicit primary-color checkbox borders/fills without a selected-row fill,
with keyboard focus, disabled styling and native forced-color fallback. Eight
standalone and eight integrated Chromium cases passed across English/German,
light/dark and 360x1000/1440x1000, including Space-key toggling and visible focus.
The requested removal of the selected-row background also passed four standalone
and four integrated theme/viewport cases, retaining checkbox colors and toggling.
The subsequent dedicated-tab request is recorded in R3 above. This R2 section
records the earlier column-based design and its verification, not approval of R3.

## Overview Balance Label R1 (2026-10-26)

**Overview Balance Label R1 wireframe and matching prototype approved,
2026-10-26.** The user explicitly confirmed "wireframe approved, implement" after
adjusting the balance-note arrow. The
[editable source](wireframes/accounts-overview/accounts-overview-wireframe.drawio)
and [synchronized PNG](wireframes/accounts-overview/accounts-overview-wireframe.png)
place all six Balance labels right-aligned directly above their amounts instead
of below account names. The review marker was restored to yellow/black and the
PNG re-exported and inspected, preserving the user's source edits and routing.
The [overview prototype](prototypes/accounts-overview/index.html) now groups the
right-aligned label directly above its amount using existing spacing tokens.
Sixteen standalone and sixteen integrated checks passed across roles,
languages, themes and phone/desktop widths. The user subsequently confirmed
"prototype approved" for the current integrated revision. Angular implementation
is complete, with four focused production-image E2E checks and eight localized
layout reviews passing. Earlier allowance/typography approval below remains
historical. See the
[verification notes](prototypes/README.md#overview-balance-label-r1-2026-10-26).
See the [delivery record](../development.md#approved-balance-label-and-profile-key-icon-2026-10-26).

## User Action Icons R1 (2026-10-26)

**User Action Icons R1 prototype approved, 2026-10-26.** The
[Users prototype](prototypes/administration/index.html) now matches Angular's
icon-only pencil Edit and key Reset password actions, with translated accessible
names and native title tooltips. Existing action placement, dialogs and role
rules are unchanged; no wireframe or Angular change is needed. Sixteen standalone
and sixteen integrated scenarios covered both roles, languages, themes and
phone/desktop widths; Manager checks exercised keyboard Edit and native reset
confirmation/cancellation. The user approved the current integrated revision
with "prototype approved"; Angular already uses these icon-only actions.
See the [verification notes](prototypes/README.md#user-action-icons-r1-2026-10-26).

## Profile Key Icon R1 (2026-10-26)

**Profile Key Icon R1 prototype approved, 2026-10-26.** The
[Profile prototype](prototypes/administration/index.html) replaces the
square-asterisk on Change password with the existing shared key shape, matching
password reset. Control placement, translated names and password behavior are
unchanged; no wireframe revision is needed. Sixteen standalone and sixteen
integrated ordinary-Chromium checks passed, including native dialog open/cancel
and phone screenshots. Earlier square-asterisk approval remains history.
The user approved the current integrated revision with "prototype approved".
Angular now uses the same locally bundled key-round icon as password reset;
production verification is recorded in the
[delivery record](../development.md#approved-balance-label-and-profile-key-icon-2026-10-26).
See the [verification notes](prototypes/README.md#profile-key-icon-r1-2026-10-26).

## Overview Allowance and Panel Labels R1 (2026-10-26)

**Overview Allowance and Panel Labels R1 approved, 2026-10-26.** The user
explicitly answered "approved" to the named current revision, including the
single-sentence wording, matching title styles and 16px gap.
The user reported that an account with an enabled next-month allowance still
showed "No monthly allowance" on its overview card, and requested panel titles
at Balance's text size rather than oversized headings. The
[overview prototype](prototypes/accounts-overview/index.html) now shows the
scheduled signed green amount and localized start month in one sentence
("+20 EUR monthly from November 2026") when no allowance is active yet.
Active accounts preserve current amounts and credit/failure status;
scheduled changes or disablement appear as additional period-specific text.

In the [details prototype](prototypes/account-details/index.html), Balance,
Monthly Allowance and Transaction History now share the existing caption size,
regular weight and secondary color. Monthly Allowance already matched Balance;
Transaction History is corrected without removing its semantic heading.
The gap below Monthly Allowance increases from 8px to the existing 16px token;
spacing within its content is unchanged.
This is a wording/state and typography refinement within the existing wireframe
structure. Angular implementation is complete: 11 focused production-image
allowance checks and eight separate localized layout reviews passed. Earlier R2
approval below remains the historical implemented baseline. See the
[delivery record](../development.md#overview-allowance-and-panel-labels-r1-2026-10-26).
See the [verification notes](prototypes/README.md#overview-allowance-and-panel-labels-r1-2026-10-26).

Follow-up implementation alignment: Angular's Credit runs heading now uses the
same caption font as the other panel labels, matching the prototype's existing
size. Two focused production-image workflows passed with all four labels
compared. See the [delivery record](../development.md#credit-runs-label-alignment-2026-10-26).

## Prototype Settings R1 (2026-10-26)

**Shared prototype settings R1 draft.** The
[shared runtime](prototypes/shared/prototype.js) uses a labelled native dropdown
for View state instead of a clipped single-row segmented control. Every state
remains selectable; language, role, navigation and failure controls are unchanged.
Four standalone/integrated account-details checks at 360px and 1440px selected
all eight states and confirmed they apply, with no horizontal overflow.
No application code or wireframe changed. See the
[verification notes](prototypes/README.md#prototype-settings-r1-2026-10-26).

## Allowance Clarity R2 (2026-10-26)

**Account-details prototype R2 approved, 2026-10-26.** The user explicitly
approved the current prototype, including the first-line calendar alignment,
with "okay, prototype approved. Implement". The
[revised prototype](prototypes/account-details/index.html) puts a calendar icon,
"Automatic monthly allowance scheduled" and the green signed monthly amount
first. Supporting text names the effective month/year and automatic credits.
The current-month configuration is below in muted text, separated by 8px;
an absent current configuration no longer dominates the enabled future state.
Spacing groups the status/amount closely, separates the explanation and edit
action, and leaves a larger gap before credit history, using existing tokens.
Already-effective allowances without a pending change explicitly say "active".
Scheduled disablement prioritizes the future stop month, with this month's amount
as supporting text and completed credit information preserved. If current and future settings
are disabled, show one disabled-state message and no retained amount or redundant
month-specific messages. English/German, Member visibility
and R1's switch-dependent dialog remain intact. Wireframe structure, financial
policies are unchanged. Three selectable review fixtures
cover no credit this month/planned next, credited this month/disabled next, and
credited this month/changed amount next. They project consistent fictional
configuration, history and balance without changing the saved account data.
R2 supersedes the unapproved R1
presentation below. Angular implementation is complete, with 11 focused
production-image allowance checks and 24 separate language/theme/viewport/state
checks passing. See the [delivery record](../development.md#allowance-clarity-r2-2026-10-26).
See the [verification notes](prototypes/README.md#allowance-clarity-r2-2026-10-26).

## Allowance Clarity R1 (2026-10-26)

**Historical unapproved R1 draft, superseded by R2 above.** The
[revised prototype](prototypes/account-details/index.html) hides the
amount field, hint and explanatory section while the allowance switch is off.
Re-enabling restores the entered amount; disabling retains the saved amount.
Save and Cancel remain available in both states. The dialog info omits this
retention detail and explains only timing and that saving does not book money.

The empty current configuration explicitly means no allowance **this month**.
A scheduled credit names its localized month and year and uses the shared green,
signed money formatter, with an 8px gap below the current-month statement.
The text explicitly describes a planned automatic credit, not a completed or
guaranteed execution. English and German are included. The existing wireframe
structure and allowance policies are unchanged; no new wireframe revision is
needed for these dialog and wording details. Earlier approvals remain history.
R1's dialog refinements are included in the approved R2 above.
See the [verification notes](prototypes/README.md#allowance-clarity-r1-2026-10-26).

## Retired Account Allowance R2 (2026-10-28)

**Account-details prototype R2 approved, 2026-10-28.** The user explicitly approved
the current revision with "approved". The retirement explanation
is now an info box directly below Monthly allowance, before the status and amount,
using the existing info icon and theme-aware message styling. The English/German
wording is unchanged and the former paragraph is removed. Active accounts are
unchanged. This is a presentation refinement within the approved wireframe;
no wireframe revision is needed. Earlier R1 approval remains historical.
Angular implementation is complete; see the
[delivery record](../development.md#retired-account-allowance-r2-2026-10-28).
See the [preview](prototypes/account-details/index.html) and
[verification notes](prototypes/README.md#retired-account-allowance-r2-2026-10-28).
Review retired Alex through Accounts in the integrated prototype.

## Retired Account Allowance R1 (2026-10-28)

**Account-details prototype R1 approved, 2026-10-28.** The user approved the
current wording and divider with "okay, now lets implement everything", then
explicitly requested the shortened explanation in prototype and implementation.
The
[details prototype](prototypes/account-details/index.html) replaces active or
scheduled allowance status with "Automatic monthly allowance paused" for
accounts scheduled for deletion. A short explanation says automatic credits
are suspended while deletion is scheduled, without describing saved settings.
Future enabled revisions
are described as saved settings, not promised automatic credits. Amounts,
credit history, disabled states and active-account wording are preserved.
English and German are included. This is a wording/state refinement within the
approved wireframe structure; no wireframe change is needed. Angular
implementation is complete, including the shortened explanation in both languages.
A subtle full-width divider separates allowance configuration from Credit runs,
using the existing border and spacing tokens.
See the [delivery record](../development.md#retired-account-allowance-r1-2026-10-28).
See the [verification notes](prototypes/README.md#retired-account-allowance-r1-2026-10-28).
Earlier Account Deletion R2 approval remains historical for these changed texts.

## Account Deletion R2 (2026-10-28)

**Account-details wireframe R2 approved, 2026-10-28.** The retired-state annotation now
preserves allowance settings across retirement and reactivation, as approved in
[R7](../../plans/migration/03h-lifecycle.md#allowance-configuration-on-reactivation-r7).
The user explicitly approved the R2 wireframe. The note was restored to yellow,
and the [R2 preview](wireframes/account-details/account-details-wireframe.png)
was re-exported and inspected; placement and routing are unchanged.

**Account Deletion R2 click prototype approved, 2026-10-28.** The
[integrated prototype](prototypes/index.html) and
[account-details prototype](prototypes/account-details/index.html) preserve
current and scheduled allowance settings through retirement and reactivation.
The revised dialog offers the missed-month choice only when applicable. See the
[prototype verification](prototypes/README.md#account-deletion-r2-2026-10-28).
The user explicitly approved the current click prototype.

Angular implementation is complete: Manager delete confirmation, scheduled-deletion
list, read-only retired details and reactivation. Missed-month choices appear only
after the backend reports that an explicit policy is required; neither choice is
preselected. See the [delivery and verification record](../development.md#account-lifecycle-ui-and-typed-roles-2026-10-28).

## Account Deletion R1 (2026-10-28)

**Accounts and account-details wireframes R1 approved, 2026-10-28.** The user
explicitly approved both current sources after arranging their annotations and
clarified that `[delete]` represents an icon. The editable
[accounts source](wireframes/accounts/accounts-wireframe.drawio) adds a
Manager-only scheduled-deletion list with navigation to details. The
[account-details source](wireframes/account-details/account-details-wireframe.drawio)
adds deletion, a read-only retired-state notice and the sole reactivation action.
The user's positions, routing and icon placeholder are preserved. Review colors
have been restored in the sources.

The [accounts preview](wireframes/accounts/accounts-wireframe.png) and
[account-details preview](wireframes/account-details/account-details-wireframe.png)
were re-exported from the approved sources and inspected after color cleanup.
The user adjusted the delete and allowance annotations and exported the updated
account-details preview. Inspection found no crossing over the transaction or
last-credit text.

**Account Deletion R1 click prototype draft.** The
[integrated prototype](prototypes/index.html), [Accounts](prototypes/accounts/index.html)
and [account details](prototypes/account-details/index.html) now demonstrate
the deletion and reactivation flows. Shared fictional data hides retired accounts
from [Overview](prototypes/accounts-overview/index.html). See the separate
[prototype verification](prototypes/README.md#account-deletion-r1-2026-10-28).
R1 was superseded by the approved R2 prototype above.

## Prototype Password Sampling R1 (2026-10-26)

**Administration Users prototype R1 draft.** The
[temporary-password demonstration](prototypes/administration/index.html) now
rejects random values outside the largest range evenly divisible by its alphabet
length before selecting characters. The fictional password's alphabet, length,
grouping and dialog behavior are unchanged. Wireframes and application code are
unchanged; prior design approvals remain history. Verification is recorded in
the [prototype notes](prototypes/README.md#password-sampling-r1-2026-10-26).

## Notice Collection State (2026-10-24)

The user accepted the current curated notice collection as complete and requested
removal of its partial label. The application selects the existing data-driven
completed state, which omits the partial-collection banner. No layout,
interaction, translated text, wireframe or click-prototype revision is introduced;
R6's presentation and recorded approvals remain unchanged. Earlier partial
fixtures/evidence describe their state at the time, not the current collection.
ORT and its findings review are deferred until the revamp is finished, before
1.0.0; separate release-review metadata does not add a new public warning.
See the [delivery record](../development.md#notice-collection-completion-2026-10-24).

## Notice Document Hierarchy R6 (2026-10-24)

**Third-party notices wireframe and matching prototype R6 approved,
2026-10-24.** The user requested
the proposed hierarchy improvement after reviewing SQLite's mixed licenses and
repeated applicability lists. The
[updated source](wireframes/about/about-notices-wireframe.drawio) and
[review PNG](wireframes/about/about-notices-wireframe.png) show SQLite
expanded into Microsoft provider, SQLitePCLRaw and public-domain engine groups.
Each bounded group lists applicable packages once, retains each source link,
and distinguishes its version/license metadata from its legal documents.

Documents have readable titles, independent initially closed expansion and a
separate local-original link. One illustrative MIT body is open in the drawing
to show the legal-text boundary; actual expansion reveals the full unchanged
original and pushes subsequent content down. Mixed member metadata and distinct
document associations must remain explicit; no group-wide license is inferred
for a differently licensed member. Phone notes require stacked metadata, wrapped
names/links, keyboard operation and one content scroller. The four-tab dialog,
existing entry points and partial-coverage status are unchanged.

The user confirmed "i arranged them already"
on 2026-10-24; their source edits and note/arrow positions were preserved. The
PNG was re-exported and inspected: English-only text, external non-overlapping
notes, clear group/document boundaries, distinct original-file links and the
unchanged dashed viewport. The user subsequently explicitly approved that R6
wireframe with "approved" on 2026-10-24. Review markers were restored to normal
yellow notes and black text/connectors, the draft title was removed, and the PNG
was re-exported and inspected without changing the user's arrangement.

The [standalone About prototype](prototypes/about/index.html) now implements
this hierarchy, also available through actual navigation in the
[integrated prototype](prototypes/index.html). Its examples include all three
SQLite groups, multiple documents and mixed Angular package versions. Inline
document bodies remain explicitly labelled design placeholders; original-file
links open the existing tracked originals without another legal-text copy.
See the [verification evidence](prototypes/README.md#notice-document-hierarchy-r6-2026-10-24)
and [scoped component pattern](design-system/components.md#notice-document-hierarchy-r6).
The user subsequently explicitly approved the current prototype with
"prototype approved, implement" on 2026-10-24. Both R6 design gates are complete;
earlier approvals remain history. Angular implementation and its focused
production-image verification are complete; see the
[R6 delivery record](../development.md#grouped-notice-documents-r6-2026-10-24).
The application renders full original document bodies rather than prototype
placeholders. Its 11 focused production-image checks, 27 isolated input checks
and separate eight-combination localization/theme/viewport review passed.
The earlier prototype evidence remains separate from application verification.

## Currency Formatting R1 (2026-10-24)

**Shared money formatting and affected Overview, Accounts and account-details
prototypes R1 approved, 2026-10-24.** The user explicitly approved the current
Currency Formatting R1 prototype with "approved". Hide the fractional part only when cents are zero:
`10,00` becomes `10` in German; `10.00` becomes `10` in English. Nonzero cents
retain exactly two digits (`10,10` / `10.10`, including `0,01` / `0.01`).
This display rule applies equally to EUR and USD without choosing a currency
from the language. Currency labels, signs, amount colors, grouping, exact
minor-unit values and two-decimal parsing are unchanged. Editable input values
and canonical API strings are not reformatted by this revision.

The shared prototype formatter applies the rule to balances, allowances,
ledger rows, confirmations and monetary feedback. Its fictional fixture remains
EUR; this revision does not add a currency selector or change existing labels.
Wireframes are unchanged. Angular delivery is recorded in the
[implementation guide](../development.md). See the
[formatting examples](design-system/typography.md#currency-formatting-r1)
and [verification evidence](prototypes/README.md#currency-formatting-r1-2026-10-24).
The separate prototype approval gate is complete.

## Runtime Consistency and Feedback Corrections (2026-10-24)

The user clarified that the prototype-only scope must not leave equivalent
inconsistency in the application. Angular Overview had the same extra Manager
condition; it now shows outstanding generic allowance status to both roles,
matching account details and ADR-0016. Attempt details and failure reasons remain
Manager-only. No fictional failure was added to application data.

Angular also restores the approved shared feedback layout: field errors have a
separate icon column and spacing, and message icons align with the first text
line, including wrapped errors. These are implementation corrections to the
approved references, not new prototype designs. See the
[delivery evidence](../development.md#allowance-consistency-and-feedback-alignment-2026-10-24).

## Allowance Status Consistency R2 (2026-10-24)

**Overview and account-details prototypes R2 approved, 2026-10-24;
prototype-only correction.** The user explicitly approved the current corrections
and the preceding Password Dialog R1 prototype with "okay, approve also the previous changes".
Generic failure status is now visible to both Members and Managers on Overview
as well as in details. The extra Overview role check was inconsistent with
details and [ADR-0016](../ADR/ADR-0016-monthly-allowance-execution.md), which
reserves attempt details and failure reasons for Managers, not credit status.
Those details remain Manager-only. This supersedes R1's unchanged Overview
visibility and the older Manager-only summary behavior; earlier approvals remain
history. Wireframes, Angular and backend behavior are unchanged in this slice.
The later application correction is recorded above; the original prototype-only
delivery scope remains history.
See the [prototype evidence](prototypes/README.md#allowance-status-consistency-r2-2026-10-24).
The separate Password Dialog R1 prototype was approved at the same time.

## Account Details Consistency R1 (2026-10-24)

**Account-details prototype R1 draft; prototype-only correction.** Normal-mode
details now reads the same fictional allowance failure as Overview. Paul's
October failure appears beside his last successful September credit, with the
Error foreground and automatic-retry text. The failed period and illustrative
attempt date agree. Managers retain attempt/reason details; Members retain the
generic execution status without those details, matching existing details roles.
Overview role visibility is unchanged.

Explicit execution review states still override the normal fictional data.
No balance, ledger, wireframe, Angular or backend code changed. Earlier
account-details approvals remain history, not approval of this correction.
See the [prototype evidence](prototypes/README.md#account-details-consistency-r1-2026-10-24).
This historical draft was superseded by the approved Allowance Status Consistency R2 above.

## Error Feedback R3 and Password Dialog R1 (2026-10-24)

**Overview prototype R3, error-text tokens and Profile wireframe R1 approved,
2026-10-24; Profile password-dialog prototype R1 approved separately, 2026-10-24.**
The user explicitly approved both presented references with "both approved".
The user corrected failed executions from Danger to Error and selected a distinct,
contrast-safe Error text variant. Overview now uses `--status-error-fg`
(`#C4352B` light / `#FF6B60` dark); destructive actions and other existing status
colors are unchanged. Successful/scheduled executions remain dimmed, and role
visibility is unchanged. See the [error-text proposal](design-system/color-scheme.md#error-text-error-feedback-r3-2026-10-24).
The earlier R2 approval below remains history.

The [Profile wireframe](wireframes/administration/administration-profile-wireframe.drawio)
updates the existing password-dialog note in place: `square-asterisk` icon,
required new-password confirmation, exact matching and inline mismatch feedback
with retained input. Its position and arrow routing are preserved; the approved
note has been restored to yellow. The Profile prototype now implements this
dialog and local icon, with English/German labels and mismatch validation.
The user subsequently explicitly approved this prototype with "okay, approve also the previous changes",
completing its approval gate for Angular implementation.
The requested dialog change is scoped to Profile; the first-sign-in password
change page and Manager-generated temporary-password dialog are unchanged.

The approved Error foreground is ported to Angular; the approved password changes
are tracked in the [Angular delivery record](../development.md).
Prototype verification evidence is recorded
in the [prototype notes](prototypes/README.md#error-feedback-r3-2026-10-24).

## Allowance Presentation R1 (2026-10-24)

**Accounts and Overview wireframes R1 and prototypes R2 approved, 2026-10-24.**
The user explicitly approved both current wireframes with "approved".
Requested refinements:

- Accounts: Name, Balance, Allowance, Status and trailing chevron. On phones,
  Allowance is right-aligned below Balance; name/status remain on the left.
  The allowance displays its configured monthly amount or "No monthly allowance".
- Overview: monthly allowance and execution information occupy separate rows.
  Successful and scheduled execution text uses theme-aware Text dimmed; failed
  executions use the danger foreground, as requested during prototype review.
  Existing execution/role visibility is preserved. No execution row accompanies
  "No monthly allowance".

The revised [Accounts source](wireframes/accounts/accounts-wireframe.drawio)
and [Overview source](wireframes/accounts-overview/accounts-overview-wireframe.drawio)
preserve the user's annotation positions. Approved notes have been restored to
yellow; both sources were re-exported and their PNGs inspected after cleanup.
The user confirmed both annotation arrangements ready on 2026-10-24. Both PNGs
were then re-exported and inspected for readable English text, external notes,
straight component-directed arrows and no overlaps.
The [color guide](design-system/color-scheme.md#text-dimmed-allowance-presentation-2026-10-24)
records implemented design-token definitions, semantic theme aliases, specimens
and calculated contrast. Both prototypes now show the allowance refinements.
The subsequent danger-color correction is a prototype detail change, not a
structural wireframe revision. The user subsequently explicitly approved the
current Accounts and Overview R2 prototypes with "approved", closing the
prototype gate for Angular implementation.
Earlier approvals below remain history.

Final R2 verification passed 32 standalone and 32 integrated view combinations,
including exact danger/dimmed colors and unchanged Member visibility. Fresh
desktop/phone Chromium screenshots and the surface specimen were inspected.
See the [prototype evidence](prototypes/README.md#allowance-presentation-r2-2026-10-24)
for the separate interaction/state/wrapping checks and their revision scope.
The approved presentation is now implemented in Angular; see the
[allowance delivery record](../development.md#allowance-presentation-2026-10-24)
for API composition, current-month semantics and production-image verification.

## Compact Account Names R2 (2026-10-24)

**Wireframe and prototype R2 approved, 2026-10-24.** The user approved the
reviewed wireframe with "approved, change the prototype and directly implement
in Angular". This approves the existing wireframe, not the subsequently changed
prototype. After prototype verification, the user separately selected "Approve
the current Accounts R2 prototype and implement it in Angular", closing that gate.
The user selected a compact name-first layout
rather than moving Balance first. The revised
[Accounts wireframe](wireframes/accounts/accounts-wireframe.drawio) caps the name
column, brings the right-aligned balance beside it, and leaves spare desktop
width after the balance. Account names remain links without underlines, retaining
hover feedback and visible keyboard focus. The existing phone identity/status
grouping, wrapping and minimum link target remain unchanged.

The approved annotation uses standard yellow styling. The user's adjusted placement
is preserved; R2 replaces R1's change-oriented annotation prose with neutral
descriptions of the layout and behavior. The
[PNG preview](wireframes/accounts/accounts-wireframe.png) reflects that arrangement
and wording. The Accounts prototype reflects R2; the Angular port uses matching
column tokens and non-underlined name links. Earlier approvals remain history.

Verification passed 16 standalone and 16 integrated role/language/theme/viewport
combinations, plus targeted wrapping, failed-save and keyboard-navigation checks.
Desktop and phone screenshots were inspected. See the
[prototype evidence](prototypes/README.md#compact-account-names-r2-2026-10-24).

Angular delivery: application and production-image builds, catalog validation
and E2E typechecking passed. Six focused production-image account/transaction
checks passed on desktop/mobile, including non-underlined names, the capped
desktop column at 600/899/900/1440/1920px, phone wrapping at 320/360px, and visible
keyboard focus/Enter navigation. Desktop and 360px phone screenshots were
inspected. The existing warning-only 750kB initial-bundle budget remains exceeded
(753.81kB); no limits were changed. See the
[delivery record](../development.md#compact-account-names-2026-10-24).

## Shared Notice Documents R1 (2026-10-23)

**Approved, 2026-10-23:** the user accepted this prototype revision with
"approved, implement". The expanded Angular example in the
[standalone About prototype](prototypes/about/index.html) lists eight packages
under "Applies to" and shows one shared notice block, rather than repeating it
for every package. Member-name search preserves the group and its applicability
list. German uses "Gilt für". Existing illustrative legal-text placeholders are
retained; no second maintained original or completed inventory is implied.

This is an expanded-row detail correction; wireframe structure is unchanged.
Earlier approvals remain history; this explicit approval covers the revised
shared About presentation. Angular now renders each mapped document once per
entry with an explicit applicability list and each package's source link.
Distinct documents remain separate; members without documents remain visible.

Verified offline: eight standalone and sixteen integrated browser combinations;
see the [prototype evidence](prototypes/README.md#shared-notice-documents-r1-2026-10-23).
Approval does not establish complete notice coverage or publication readiness.

Angular delivery: application/production-image builds, translation validation
and E2E typecheck passed. All nine focused About/offline production-image checks
passed, including unique document counts, exact applicability/source mappings,
inline original text, download hashes and member-name search. Eight isolated
real-app checks covered English/German, light/dark and 1440px/360px; desktop and
German dark-phone screenshots were inspected without overflow or script errors.
The build retains a warning-only initial bundle budget overrun (756.75 kB versus
750 kB); no budget limits were changed. See the
[notice delivery record](../../notices/README.md#angular-runtime-packages-2026-10-23).

Final user acceptance on 2026-10-23: "all approved now, commit". This accepts
the delivered Angular notice collection and shared-document presentation;
partial coverage and independent publication gates remain unchanged.

## Legal License-Name Copy R2 (2026-10-24)

**Approved, 2026-10-24:** the user approved the current R2 prototype with
"approved" after the copy change and focused verification. The user requested the full license name
instead of the SPDX identifier in explanatory prose. The
[bilingual R2 wording](../terms/self_hosted_legal_information.md) and shared About
prototype now use "GNU Affero General Public License, version 3" (German:
"GNU Affero General Public License, Version 3") in the warranty section.
The license remains version 3 only. Precise license labels, metadata, technical
paths and the ADR retain `AGPL-3.0-only`; wireframe structure is unchanged.
Earlier R1 approvals below remain history; this explicit approval closes the R2
prototype gate. Angular's English and German warranty paragraphs now match R2.

Focused verification: JavaScript syntax and bilingual document/prototype copy
agreement passed. Eight standalone browser checks covered English/German,
light/dark at 1440px/360px with no legal-panel horizontal overflow. An integrated
smoke check navigated from Overview to Administration and opened About from the
shell as Manager, German, dark, 360px; revised text and overflow checks passed.
The full integrated role/language/theme matrix was not run.

After approval, all six Angular legal sections matched the R2 document paragraph
for paragraph in English and German. `npm --prefix web run check:catalogs`
and `npm --prefix web run build` passed. The build retains the existing
warning-only initial bundle budget overrun (756.82 kB versus 750 kB); no budget
limits changed. Production-image browser tests were not rerun for this copy update.

## Approved Legal Content (2026-10-23)

The user accepted the [bilingual R1 wording](../terms/self_hosted_legal_information.md)
with "sounds good, lets keep it", then requested its prototype presentation.
After review verification, the user requested Angular implementation with
"implement" on 2026-10-23, accepting the current presentation for that port.
The shared About dialog now displays that wording in the existing three Legal
information sections, with separate readable paragraphs and the accepted
deployment-specific privacy caveat instead of legal placeholders. This
presentation is now implemented in Angular. Approved wireframes and the
tonal-surface revision remain unchanged. This acceptance does not establish
deployment-specific legal readiness or complete third-party notice coverage.

The user explicitly accepted the completed wording, prototype presentation and
Angular implementation on 2026-10-23: "very well, all approved, whats next?".
This closes the current legal-content design/delivery review, not the independent
deployment-specific or artifact-publication gates.

Review the [standalone About prototype](prototypes/about/index.html) or open About
through the [integrated application](prototypes/index.html), then select Legal
information. Ordinary offline Chromium passed 12 standalone combinations
(English/German, light/dark, 1440px/360px/320px) followed by 16 integrated
Manager/Member combinations (both languages/themes, 1440px/360px) through real
Administration navigation and About entry points. Checks compared every body
paragraph with R1 and covered native keyboard tab selection, paragraph spacing,
overflow, internal scrolling, pinned header/tabs, Escape and opener focus return,
with no script errors. Desktop and German dark-phone screenshots were inspected.
See the [prototype record](prototypes/README.md#legal-content-presentation-2026-10-23).

Angular delivery: the production-image build, catalog validation and E2E
typechecking passed. Eight production-image About checks passed on desktop/mobile,
including every accepted English body paragraph, spacing and fixed-header
internal scrolling, alongside the existing access/license/notice regressions.
Eight separate development-app checks compared both languages with R1 across
light/dark and 1440px/360px. Production desktop/320px phone and German dark-phone
screenshots were inspected. See the [delivery record](../development.md#legal-information-delivery-2026-10-23).

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
[Angular delivery record](../development.md#tonal-surfaces-2026-10-23).

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
The temporary runtime/system smoke-check panel has been removed from the
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
remain unchanged. See the [delivery record](../development.md#four-tab-about-delivery-2026-10-23).

| Reference           | Scope                                                                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App shell           | Shared navigation, identity/role controls, content boundaries, and responsive structure, without specific view content                                                                                    |
| Accounts overview   | Application home/landing view with accounts and balances; no separate marketing page                                                                                                                      |
| Account management  | Dedicated **Accounts** navigation entry: Manager account creation and navigation; no existing-account name editing                                                                                        |
| Account details     | Manager rename beside the heading, image controls, balance, opening state, transactions/history, deposit/withdrawal forms, and monthly allowance configuration/status                                     |
| Settings            | **Profile** tab in Administration: personal preferences and password change; instance settings remain deployment configuration                                                                            |
| User administration | **Users** tab in Administration: Manager user creation, roles, disablement, password reset, and last-manager protection                                                                                   |
| Login               | Sign-in, forced-password change, and session-expiry states                                                                                                                                                |
| About               | Notices wireframe and matching shared prototype R6 explicitly approved 2026-10-24; Angular implemented and locally verified against the production image; other wireframes retain their earlier approvals |

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
wireframe when it adds review value, then a detailed click prototype.

- Keep each `.drawio` source and its exported PNG preview together here, named `<view>-wireframe.drawio` and `<view>-wireframe.png`.
- Draw one main desktop viewport per view. Show only the view inside the shell's main content container (max 1440px), not the application shell, so the shell can change independently. Mark its bounds with a dashed border. Briefly note key behavior, states, role differences, dialogs, or phone-layout choices needed to review what users see or can do or decide the layout. Use yellow note shapes outside the viewport, around its edges, with arrows pointing to the relevant component. Never overlay annotations on the view. Expand the drawing/export to include the notes, not the viewport itself. Create a separate `.drawio` only when a screen has its own substantial layout, such as the Profile and Users tabs.
- Show detailed interactions, validation, errors, and edge cases in the click prototype, not in exhaustive wireframe notes or additional wireframes. Keep enduring business and security rules in their authoritative ADRs; briefly note critical constraints when needed for wireframe review. Keep exports synchronized with the source revision. Prefer readable, uncompressed XML when practical.
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

Click prototypes in the following table retain the **approved 2026-10-23 surface
revision** as history where a later draft is listed. Earlier dates in that column
record approval history.

| Reference                  | Files                                                                                                                                                              | Status                                                                                                                                                                                                                                          | Click prototype                                                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App shell                  | [draw.io source](wireframes/application-shell/application-shell-wireframe.drawio), [PNG preview](wireframes/application-shell/application-shell-wireframe.png)     | Annotation revision approved 2026-10-31; English-only wording approved 2026-10-21; earlier all-wireframe approval and Administration-last correction approval 2026-10-17 retained as history; user-edited icon placeholders/annotation arrangement preserved | [Shell](prototypes/application-shell/index.html), revised Administration-last menu prototype explicitly approved 2026-10-17 ("Approve current shell prototype and implement Angular"); earlier approvals retained as history   |
| Accounts overview          | [draw.io source](wireframes/accounts-overview/accounts-overview-wireframe.drawio), [PNG preview](wireframes/accounts-overview/accounts-overview-wireframe.png)     | Annotation revision approved 2026-10-31; Allowance Presentation R1 approved 2026-10-24; earlier 2026-10-10 approval retained as history | [Overview](prototypes/accounts-overview/index.html), Member Account Assignment R2 draft 2026-10-30; earlier approvals retained as history |
| Accounts                   | [draw.io source](wireframes/accounts/accounts-wireframe.drawio), [PNG preview](wireframes/accounts/accounts-wireframe.png)                                         | Annotation revision approved 2026-10-31; Account Deletion R1 approved 2026-10-28; earlier approvals retained as history | [Accounts](prototypes/accounts/index.html), Account Deletion R2 shared state approved 2026-10-28; earlier approvals retained as history |
| Account details            | [draw.io source](wireframes/account-details/account-details-wireframe.drawio), [PNG preview](wireframes/account-details/account-details-wireframe.png)             | Annotation revision approved 2026-10-31; Account Deletion R2 approved 2026-10-28; R1 retained as history | [Account details](prototypes/account-details/index.html), Member Account Assignment R2 scoped reads draft 2026-10-30; earlier approvals retained as history |
| Administration: Profile    | [draw.io source](wireframes/administration/administration-profile-wireframe.drawio), [PNG preview](wireframes/administration/administration-profile-wireframe.png) | Member Account Assignment R3 navigation and annotation revision approved 2026-10-31; earlier approvals retained as history | [Administration](prototypes/administration/index.html), Account assignments tab added for Managers in R3 draft 2026-10-31; Password Dialog R1 prototype approved 2026-10-24 |
| Administration: Users      | [draw.io source](wireframes/administration/administration-users-wireframe.drawio), [PNG preview](wireframes/administration/administration-users-wireframe.png)     | Member Account Assignment R3 approved 2026-10-31; assignments moved to separate tab; R2 approval retained as history | [Administration](prototypes/administration/index.html), Member Account Assignment R3 draft 2026-10-31 (assignment column removed); Password Sampling R1 draft and earlier approvals retained as history |
| Administration: Account assignments | [draw.io source](wireframes/administration/administration-account-assignments-wireframe.drawio), [PNG preview](wireframes/administration/administration-account-assignments-wireframe.png) | Member Account Assignment R4 approved 2026-10-31 ("approved"); user arrangement preserved, notes cleaned, PNG exported and inspected; R3 approval retained as history | [Administration](prototypes/administration/index.html), Member Account Assignment R4 draft 2026-10-31; reconciled and verified against approved R4, prototype approval pending |
| Login                      | [draw.io source](wireframes/login/login-wireframe.drawio), [PNG preview](wireframes/login/login-wireframe.png)                                                     | Annotation revision approved 2026-10-31; English-only wording approved 2026-10-21; earlier all-wireframe approval and icon-free footer approval 2026-10-17 retained as history | [Login](prototypes/login/index.html), centring correction draft 2026-10-19; prior shared About/footer approval retained as history                                                                                             |
| About: Overview            | [draw.io source](wireframes/about/about-wireframe.drawio), [PNG preview](wireframes/about/about-wireframe.png)                                                     | Annotation revision approved 2026-10-31; English-only wording approved 2026-10-21; earlier all-wireframe and R5 approval 2026-10-19 retained as history; project license remains outside Overview | [About](prototypes/about/index.html), R5 explicitly approved 2026-10-19                                                                                                                                                        |
| About: Project license     | [draw.io source](wireframes/about/about-license-wireframe.drawio), [PNG preview](wireframes/about/about-license-wireframe.png)                                     | Annotation revision approved 2026-10-31; English-only wording approved 2026-10-21; earlier all-wireframe and R5 approval 2026-10-19 retained as history; full AGPL text without expansion unchanged | [About](prototypes/about/index.html), R5 explicitly approved 2026-10-19                                                                                                                                                        |
| About: Third-party notices | [draw.io source](wireframes/about/about-notices-wireframe.drawio), [PNG preview](wireframes/about/about-notices-wireframe.png)                                     | Annotation revision approved 2026-10-31; R6 package/document hierarchy approved 2026-10-24; prior wording/source approval 2026-10-21 and R5 approval 2026-10-19 retained as history | [About](prototypes/about/index.html), R6 explicitly approved 2026-10-24 with "prototype approved, implement", after standalone and integrated verification; earlier R5 and Shared Notice Documents R1 approvals remain history |
| About: Legal information   | [draw.io source](wireframes/about/about-legal-wireframe.drawio), [PNG preview](wireframes/about/about-legal-wireframe.png)                                         | Annotation revision approved 2026-10-31; English-only wording approved 2026-10-21; earlier approvals retained as history; assignment privacy copy approved separately 2026-10-30, not blanket legal-copy approval | [About](prototypes/about/index.html), Member Account Assignment R2 privacy presentation draft 2026-10-30; earlier approvals retained as history |

Prototype structure, review settings, and fictional sign-in data are described in
the [prototype notes](prototypes/README.md).

Visual design is documented in the [design system](design-system/README.md),
with browser-viewable [specimens](design-system/specimens/index.html). Shared fonts
and images are stored in [assets](assets).

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
