# POCKET MONkEY design references

Store editable draw.io sources and synchronized PNG previews here for
[step 2B: product UX and UI design](../../plans/migration/02b-ux-ui-design.md).
The wireframes below were approved on 2026-10-10; the visual foundations in the
design system are still a draft.

## Reference inventory

| Reference | Scope |
| --- | --- |
| App shell | Shared navigation, identity/role controls, content boundaries, and responsive structure, without specific view content |
| Accounts overview | Application home/landing view with accounts and balances; no separate marketing page |
| Account management | Dedicated **Accounts** navigation entry: Manager account creation/editing and image controls |
| Account details | Balance, opening state, transactions/history, deposit/withdrawal forms, and monthly allowance configuration/status |
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
| App shell | [draw.io source](wireframes/application-shell/application-shell-wireframe.drawio), [PNG preview](wireframes/application-shell/application-shell-wireframe.png) | Approved 2026-10-10 | [Shell](prototypes/application-shell/index.html) |
| Accounts overview | [draw.io source](wireframes/accounts-overview/accounts-overview-wireframe.drawio), [PNG preview](wireframes/accounts-overview/accounts-overview-wireframe.png) | Approved 2026-10-10 | [Overview](prototypes/accounts-overview/index.html) |
| Accounts | [draw.io source](wireframes/accounts/accounts-wireframe.drawio), [PNG preview](wireframes/accounts/accounts-wireframe.png) | Approved 2026-10-10 | [Accounts](prototypes/accounts/index.html) |
| Account details | [draw.io source](wireframes/account-details/account-details-wireframe.drawio), [PNG preview](wireframes/account-details/account-details-wireframe.png) | Approved 2026-10-10 | [Account details](prototypes/account-details/index.html) |
| Administration: Profile | [draw.io source](wireframes/administration/administration-profile-wireframe.drawio), [PNG preview](wireframes/administration/administration-profile-wireframe.png) | Approved 2026-10-10 | [Administration](prototypes/administration/index.html) |
| Administration: Users | [draw.io source](wireframes/administration/administration-users-wireframe.drawio), [PNG preview](wireframes/administration/administration-users-wireframe.png) | Approved 2026-10-10 | [Administration](prototypes/administration/index.html) |
| Login | [draw.io source](wireframes/login/login-wireframe.drawio), [PNG preview](wireframes/login/login-wireframe.png) | Approved 2026-10-10 | [Login](prototypes/login/index.html) |

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

Remaining phase 3 feature work waits for the
[phase 2B acceptance gate](../../plans/migration/02b-ux-ui-design.md#acceptance-gate).