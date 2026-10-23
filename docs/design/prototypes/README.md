# Click Prototypes

Offline click prototypes for the approved wireframes. Open any `index.html`
directly in a browser; no server or internet access is required. Keep the
surrounding design folder with the pages, because they use the shared design
stylesheet, Roboto fonts, and logo.

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

## About Approval

The four-tab R5 wireframes and shared prototype were explicitly approved on
2026-10-19 and ported to Angular on 2026-10-23 at the user's request. Overview now
contains product/version/source information only; Project license is the second
tab and shows the complete original text immediately, without an accordion.
Notices preserve expanded rows across filtering/tab changes and reset on close.
Eight focused desktop/mobile production-image checks passed; see the
[delivery record](../../../revamp/README.md#four-tab-about-delivery-2026-10-23).
Legal placeholders and the staged notice collection remain review material.

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
