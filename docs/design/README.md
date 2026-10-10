# POCKET MONkEY design references

Store editable draw.io sources and synchronized PNG previews here for
[step 2B: product UX and UI design](../../plans/migration/02b-ux-ui-design.md).
The user approved the current wireframes, click prototypes, visual foundations,
and implemented representative design on 2026-10-10, including all subsequent
refinements recorded below. Approval applies to the current working-tree revision;
later design changes require renewed review. It does not settle future business
policies or certify unperformed technical checks.

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

Login and app-shell footer updates are approved: show the build version and a
GitHub icon/label. The repository link is an unavailable placeholder pending the
future repository URL; it must not point to the current repository. The login
footer sits at the bottom and flows below tall content on small screens.
The temporary foundation/system smoke-check panel has been removed from the
login implementation to match the approved references. Operational health checks
remain separate from the public sign-in screen.

| Reference | Scope |
| --- | --- |
| App shell | Shared navigation, identity/role controls, content boundaries, and responsive structure, without specific view content |
| Accounts overview | Application home/landing view with accounts and balances; no separate marketing page |
| Account management | Dedicated **Accounts** navigation entry: Manager account creation and navigation; no existing-account name editing |
| Account details | Manager rename beside the heading, image controls, balance, opening state, transactions/history, deposit/withdrawal forms, and monthly allowance configuration/status |
| Settings | **Profile** tab in Administration: personal preferences and password change; instance settings remain deployment configuration |
| User administration | **Users** tab in Administration: Manager user creation, roles, disablement, password reset, and last-manager protection |
| Login | Sign-in, forced-password change, and session-expiry states |

Use desktop/mobile and Manager/Member variants where relevant. Forms, dialogs,
image upload, confirmations, and validation/retry states can be named pages in
the owning view's source, not additional top-level views. The overview links to
the dedicated Accounts view for management instead of embedding Manager controls.
Legal views depend on the lifecycle scope review; monthly reports and dedicated
reversals remain deferred.

## Files and index

Follow [ADR-0013](../ADR/ADR-0013-wireframes-and-click-prototypes.md): rough
wireframe first, then a detailed click prototype.

- Keep each `.drawio` source and its exported PNG preview together here, named `<view>-wireframe.drawio` and `<view>-wireframe.png`.
- Draw one main desktop page per view. Show only the view inside the shell's main content container (max 1440px), not the application shell, so the shell can change independently. Describe the important behavior, states, role differences, dialogs, and phone layout in callouts on that page instead of extra pages. Create a separate `.drawio` only when a screen has its own substantial layout, such as the Profile and Users tabs.
- Show detailed interactions and states in the click prototype, not in additional wireframes. Keep exports synchronized with the source revision. Prefer readable, uncompressed XML when practical.
- Commit editable sources, not only screenshots or external draw.io links. Use fictional data; never include credentials or private financial information.
- As references arrive, add actual source/preview links below with role, viewport/state, draft/approved status, reviewed revision, approval date, and open questions. Only link files that exist.
- Keep visual-token and interaction guidance here too, linked from that index. Wireframes alone do not approve typography, colors, or all behavior.

| Reference | Files | Status | Click prototype |
| --- | --- | --- | --- |
| App shell | [draw.io source](wireframes/application-shell/application-shell-wireframe.drawio), [PNG preview](wireframes/application-shell/application-shell-wireframe.png) | Approved 2026-10-10, including footer refinements | [Shell](prototypes/application-shell/index.html) |
| Accounts overview | [draw.io source](wireframes/accounts-overview/accounts-overview-wireframe.drawio), [PNG preview](wireframes/accounts-overview/accounts-overview-wireframe.png) | Approved 2026-10-10 | [Overview](prototypes/accounts-overview/index.html) |
| Accounts | [draw.io source](wireframes/accounts/accounts-wireframe.drawio), [PNG preview](wireframes/accounts/accounts-wireframe.png) | Approved 2026-10-10, including mobile identity/status grouping and removal of the mobile chevron | [Accounts](prototypes/accounts/index.html) |
| Account details | [draw.io source](wireframes/account-details/account-details-wireframe.drawio), [PNG preview](wireframes/account-details/account-details-wireframe.png) | Approved 2026-10-10, including unified transaction dialog and labelled header action after refresh | [Account details](prototypes/account-details/index.html) |
| Administration: Profile | [draw.io source](wireframes/administration/administration-profile-wireframe.drawio), [PNG preview](wireframes/administration/administration-profile-wireframe.png) | Approved 2026-10-10 | [Administration](prototypes/administration/index.html) |
| Administration: Users | [draw.io source](wireframes/administration/administration-users-wireframe.drawio), [PNG preview](wireframes/administration/administration-users-wireframe.png) | Approved 2026-10-10 | [Administration](prototypes/administration/index.html) |
| Login | [draw.io source](wireframes/login/login-wireframe.drawio), [PNG preview](wireframes/login/login-wireframe.png) | Approved 2026-10-10, including version/GitHub footer | [Login](prototypes/login/index.html) |

Prototype structure, review settings, and fictional sign-in data are described in
the [prototype notes](prototypes/README.md).

Visual foundations are documented in the [design system](design-system/README.md),
with browser-viewable [specimens](design-system/specimens/index.html). Shared fonts
and images are stored in [assets](assets/).

## Review rules

Committing a reference does not approve it. New or changed references are drafts
until explicitly reviewed; record approval against the reviewed revision.
Approved references guide implementation but do not override ADRs, backend
security, exact money rules, or real-stack verification. Resolve policy conflicts
before implementation rather than inferring decisions from diagrams.

The user accepted the representative design on 2026-10-10; the phase 2B design
pause is lifted. Next is [account images](../../plans/migration/03d-account-images.md),
subject to its separate policy and verification prerequisites.