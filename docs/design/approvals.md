# Design Approvals

The single place to look up the review state of every view. Each row covers a
view's wireframes and its click prototype. Git history keeps every earlier version:
the commit that changes a row to an approved state identifies what was approved.

## States

States are ordered; a view moves forward through them and back when it changes.

1. `wireframe draft`: a wireframe is being created or changed.
2. `wireframe approved`: the user explicitly approved the current wireframes.
3. `prototype draft`: the prototype is being created or changed. Views without a
   wireframe, or with only small changes, start here.
4. `prototype approved`: the user explicitly approved the current prototype; the
   view may be handed off for implementation.
5. `implemented`: the approved design is built in the application and verified.

Changing a wireframe returns the view to `wireframe draft`; changing only the
prototype returns it to `prototype draft`. After a wireframe approval that needs no
prototype change, the view returns directly to `prototype approved`. Feedback,
corrections, "proceed" or passing checks are not approval (see
[ADR-0013](../ADR/ADR-0013-wireframes-and-click-prototypes.md#changes-and-approval)).
Approval does not settle business policy, legal wording or unperformed checks.

*Since* is the date the view entered its current state. *Last approved* is the most
recent explicit approval of any of its artifacts and stays visible while the view
is back in draft. Use *Note* for pending review, a known wireframe/prototype
mismatch or open items.

## Views

| View | Wireframes | Prototype | State | Since | Last approved | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Application shell | [shell](wireframes/application-shell/application-shell-wireframe.drawio) | [shell](prototypes/application-shell/index.html) | prototype draft | 2026-10-31 | 2026-10-31 | Review panel replaces the Prototype settings menu entry and dialog; awaiting review. The approved design is implemented in Angular. |
| Accounts overview | [overview](wireframes/accounts-overview/accounts-overview-wireframe.drawio) | [overview](prototypes/accounts-overview/index.html) | prototype draft | 2026-10-31 | 2026-10-31 | Review panel; awaiting review. Confirm that the Member assignment approval covers the scoped-overview presentation drafted on 2026-10-30. |
| Accounts | [accounts](wireframes/accounts/accounts-wireframe.drawio) | [accounts](prototypes/accounts/index.html) | prototype draft | 2026-10-31 | 2026-10-31 | Review panel; awaiting review. The approved design is implemented in Angular. |
| Account details | [details](wireframes/account-details/account-details-wireframe.drawio) | [details](prototypes/account-details/index.html) | prototype draft | 2026-10-31 | 2026-10-31 | Review panel; awaiting review. Confirm that the Member assignment approval covers the scoped direct-link reads drafted on 2026-10-30. |
| Administration | [profile](wireframes/administration/administration-profile-wireframe.drawio), [users](wireframes/administration/administration-users-wireframe.drawio), [account assignments](wireframes/administration/administration-account-assignments-wireframe.drawio) | [administration](prototypes/administration/index.html) | prototype draft | 2026-10-31 | 2026-10-31 | Review panel; awaiting review. The approved Member account assignment design is implemented in Angular. |
| Login | [login](wireframes/login/login-wireframe.drawio) | [login](prototypes/login/index.html) | prototype draft | 2026-10-31 | 2026-10-31 | Review panel; the sign-in sample note moved from the page into the panel; awaiting review. |
| About | [overview](wireframes/about/about-wireframe.drawio), [project license](wireframes/about/about-license-wireframe.drawio), [notices](wireframes/about/about-notices-wireframe.drawio), [legal](wireframes/about/about-legal-wireframe.drawio) | [about](prototypes/about/index.html) | prototype draft | 2026-10-31 | 2026-10-31 | Review panel; the review page's language and theme controls moved into it; awaiting review. Legal wording and notice coverage are reviewed separately. Confirm the 2026-10-30 assignment privacy presentation. |
| Integrated entry | — | [index](prototypes/index.html) | prototype draft | 2026-10-31 | 2026-10-23 | Each framed page shows its own review panel; the chrome-less entry shows none. Awaiting review. |

Update a row in the same commit as the artifact change or approval it records.
Add a row when a new view gets its first wireframe or prototype.
