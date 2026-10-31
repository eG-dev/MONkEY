# Click Prototypes

Offline click prototypes for the POCKET MONkEY views. Open any `index.html`
directly in a browser; no server or internet access is required. Keep the
surrounding design folder with the pages, because they use the shared design
stylesheet, Roboto fonts and logo. The [approval register](../approvals.md)
records each view's review state; Git history keeps earlier versions.

Prototypes illustrate behavior and layout intent. They are not the Angular
implementation, enforce no security and define no business rules or API
contracts. Amounts are integer cents and the business date is fixed to
10 Oct 2026 for repeatable reviews.

## Views

| Prototype | Wireframes |
| --- | --- |
| [Integrated application](index.html) | — |
| [Application shell](application-shell/index.html) | [Shell](../wireframes/application-shell/application-shell-wireframe.png) |
| [Overview](accounts-overview/index.html) | [Accounts overview](../wireframes/accounts-overview/accounts-overview-wireframe.png) |
| [Accounts](accounts/index.html) | [Accounts](../wireframes/accounts/accounts-wireframe.png) |
| [Account details](account-details/index.html%3Faccount%3Dnoah) | [Account details](../wireframes/account-details/account-details-wireframe.png) |
| [Administration](administration/index.html) | [Profile](../wireframes/administration/administration-profile-wireframe.png), [Users](../wireframes/administration/administration-users-wireframe.png), [Account assignments](../wireframes/administration/administration-account-assignments-wireframe.png) |
| [Login](login/index.html) | [Login](../wireframes/login/login-wireframe.png) |
| [About dialog](about/index.html) | [Overview](../wireframes/about/about-wireframe.png), [Project license](../wireframes/about/about-license-wireframe.png), [Third-party notices](../wireframes/about/about-notices-wireframe.png), [Legal information](../wireframes/about/about-legal-wireframe.png) |

## Current Design

### Application shell

Header with navigation toggle, logo and user menu (Profile, Dark mode, Sign out).
The drawer lists Overview, Manager-only Accounts and Administration, with About
anchored at the bottom above the version. Wide layouts pin the navigation;
compact layouts open a temporary drawer with backdrop and Escape dismissal.
Surfaces use neutral tonal fills rather than decorative outlines.

### Overview

Account cards show the name, a right-aligned Balance label directly above the
signed amount, and the allowance summary. An enabled next-month configuration
reads "{amount} monthly from {month}"; current execution status is dimmed when
successful and uses the Error foreground when a credit failed, for both roles.
Members see only their assigned active accounts and an informative empty state
without a create action; Managers get a create-first state. Retired accounts are
excluded. Review states: loading, empty and error with retry.

### Accounts

Manager account management: non-underlined, width-capped name links, Balance,
right-aligned Allowance ("No monthly allowance" when absent) and Status. On
phones, Allowance sits below Balance on the right. Account creation validates
input and keeps it after a failed save. A scheduled-deletion list shows retired
accounts.

### Account details

Manager rename beside the heading, borderless image-edit badge, balance,
opening state, deposit/withdrawal forms and transaction history with
"Recorded by" display names. The monthly allowance panel leads a scheduled
change with a calendar-labelled message, states this month's allowance as a
muted sentence, shows a single message when disabled, and separates Credit runs
(latest success, oldest pending or failed month) with a divider. Managers also
see attempt details and safe failure reasons. Retired accounts are read-only,
show an info box below Monthly allowance, and offer deletion or reactivation
with a credit/drop choice for outstanding months. Members can open only their
assigned active accounts; other direct links show the same not-found message.
Review states cover loading, error and the credit execution variants.

### Administration

- **Profile** (everyone): account facts, Change password with the key icon
  (current, new and confirmation; all sessions end), language and dark mode.
- **Users** (Managers): Display name, Username, Role, Status and icon-only edit
  and reset-password actions. Create user and reset show a grouped, twelve-character
  temporary password once. The last active Manager cannot be disabled or demoted.
- **Account assignments** (Managers): Members only, including disabled Members,
  with display name, assigned active accounts and an edit icon; no status
  column. Duplicate display names show the username below the name and in the
  edit label and dialog title. The dialog lists active accounts as compact
  checkbox rows (selected rows use the navigation selection colors) and allows
  an empty selection. An unconfirmed save keeps the selection, disables saving
  and offers reloading the current assignments. List states: loading, error and
  no Members; dialog states: loading, error, no active accounts, unavailable and
  not a Member.

Members see only Profile; `#users` and `#assignments` fall back to it.

### Login

Language buttons, sign-in, forced password change, signed-out and expired-session
messages, a lockout after five failed attempts, and a `Version | About` footer.
Sample credentials are in the review panel.

### About

One shared dialog opened from the shell, login and the direct review page, with
four tabs: Overview (product, version, source), Project license (the complete
original text, shown immediately), Third-party notices (package/license groups,
search, independently expandable documents and Open original links) and Legal
information (accepted wording, including the assignment privacy explanation).
Notice texts are illustrative placeholders; the application renders the
complete originals.

## Structure

- [shared/prototype.js](shared/prototype.js) builds the application shell and
  provides formatting, dialogs, toasts, preferences and the review-panel
  registration. Each view only renders the main content.
- [shared/prototype.css](shared/prototype.css) contains the shell and common
  component styles on top of the design-system tokens.
- [shared/data.js](shared/data.js) holds the fictional seed data. Changes made
  while clicking through are kept in the browser's local storage.
- [shared/about.js](shared/about.js) provides the lazy-loaded About dialog.
- [shared/project-license.js](shared/project-license.js) is generated mechanically
  from the root [LICENSE](../../../LICENSE). Its decoded text must remain identical
  to that canonical file; regenerate the asset whenever the license changes.
- [shared/prototype-review.js](shared/prototype-review.js) and
  [shared/prototype-review.css](shared/prototype-review.css) are unchanged copies
  of the UI/UX skill's [review-panel starter](../../../.github/skills/ui-ux-design/assets/prototype-review/).

## Review Panel

Prototype-only controls live in one review panel, not in the reviewed layout.
The round button in a page corner opens it; drag the button or use its arrow
keys to move it to another corner, for example away from a toast. Alt+Shift+R
hides or shows the button for clean screenshots. The runtime registers:

- **Settings:** language, theme and, on shell pages, the signed-in sample user
  (Manager Mara or Member Emma) and navigation mode (auto, compact, wide).
- **States:** the view's sample states where it has any, **Next save fails** to
  exercise error and retry handling once, and **Reset prototype data**.
- **About this view:** its purpose, simulation boundaries and links to its
  wireframes, this README and the approval register.

Each page owns its shell and therefore hosts its own panel. The integrated
entry is a chrome-less frame without a panel, so exactly one panel is visible
and no cross-frame messaging is needed.

## Integrated Application Entry

[index.html](index.html) frames the maintained pages, starting at Overview.
Actual navigation opens Accounts, account details and Administration; About
opens from its real entry points, and sign out leads to Login and back through
sign in. Preferences, role and fictional data persist through local storage.
The root copies no markup, keeps no second state store and does not access the
framed page's DOM. It is offline review composition, not production routing.

## Verification

Verify changed views standalone first, then through the integrated entry and
actual navigation, using the skill's verification matrix. Record standalone and
integrated evidence separately; passing checks are not approval.

Review panel, ordinary headless Chromium, 2026-10-31:

| Scope | Role | Language | Theme | Viewport | States/flows | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Standalone, all seven views | Manager; Member switch on shell pages | en, de | light, dark | 360, 1440 | One panel, no Prototype settings menu item or in-layout review controls, settings applied, shell-only controls, failure switch consumed by a save, reset, Escape and Alt+Shift+R, link targets, panel within the viewport, no overflow (56 cases) | pass |
| Standalone, Administration | Manager | de | dark | 360 | Account assignments loading state selected from the panel | pass |
| Integrated | Manager | en, de | light | 1440 | No panel on the entry, one inside the frame, language kept through navigation to Administration | pass |

No page errors occurred. Panel screenshots of Overview (English, light, 1440px),
Administration (German, dark, 360px) and the integrated entry were inspected.
