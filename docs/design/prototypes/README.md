# Click Prototypes

Offline click prototypes for the approved wireframes. Open any `index.html`
directly in a browser; no server or internet access is required. Keep the
surrounding design folder with the pages, because they use the shared design
stylesheet, Roboto fonts, and logo.

| Prototype | Wireframe |
| --- | --- |
| [Application shell](./application-shell/index.html) | [Shell](../wireframes/application-shell/application-shell-wireframe.png) |
| [Overview](./accounts-overview/index.html) | [Accounts overview](../wireframes/accounts-overview/accounts-overview-wireframe.png) |
| [Accounts](./accounts/index.html) | [Accounts](../wireframes/accounts/accounts-wireframe.png) |
| [Account details](./account-details/index.html?account=noah) | [Account details](../wireframes/account-details/account-details-wireframe.png) |
| [Administration](./administration/index.html) | [Profile](../wireframes/administration/administration-profile-wireframe.png) and [Users](../wireframes/administration/administration-users-wireframe.png) |
| [Login](./login/index.html) | [Login](../wireframes/login/login-wireframe.png) |
| [About dialog](./about/index.html) | [Overview](../wireframes/about/about-wireframe.png), [Third-party notices](../wireframes/about/about-notices-wireframe.png), [Legal information](../wireframes/about/about-legal-wireframe.png) |

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

The user explicitly approved the current shared dialog and updated shell/login
prototypes on 2026-10-17 for Angular implementation. The component inventory and legal wording remain labelled review placeholders;
repository/source links remain unavailable until their URLs are agreed.
The project license is bundled verbatim for offline reading. Close the dialog on
the direct review page to access its language/theme controls; reopening resets the
selected tab to Overview. Other views retain the existing prototype settings.

The latest login footer reads `Version | About` without an icon. The requested
Administration-below-Overview wireframe was explicitly approved on 2026-10-17.
All shared-shell prototypes now show Overview, Administration, Manager-only Accounts,
and labelled About anchored at the bottom above the version. The wireframe's textual
icon placeholders are represented by actual icons in the prototype. This current
prototype revision is covered by the explicit 2026-10-17 approval.

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
