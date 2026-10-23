# Click Prototypes

Offline click prototypes for the approved wireframes. Open any `index.html`
directly in a browser; no server or internet access is required. Keep the
surrounding design folder with the pages, because they use the shared design
stylesheet, Roboto fonts, and logo.

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
[accepted German/English R1 wording](../../terms/self_hosted_information_draft.md)
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
