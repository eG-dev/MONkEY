# POCKET MONkEY design references

Store editable draw.io sources and synchronized PNG previews here for
[step 2B: product UX and UI design](../../plans/migration/02b-ux-ui-design.md).
No wireframes or visual direction have been approved yet.

## Reference inventory

| Reference | Scope |
| --- | --- |
| App shell | Shared navigation, identity/role controls, content boundaries, and responsive structure, without specific view content |
| Accounts overview | Application home/landing view with accounts and balances; no separate marketing page |
| Account management | Manager account creation/editing and planned image controls |
| Account details | Balance, opening state, transactions/history, deposit/withdrawal forms, and planned allowance configuration/status |
| Settings | Personal preferences and separately agreed instance settings |
| User administration | Manager user creation, roles, disablement, password reset, and last-manager protection |
| Login | Sign-in, forced-password change, and session-expiry states |

Use desktop/mobile and Manager/Member variants where relevant. Forms, dialogs,
image upload, confirmations, and validation/retry states can be named pages in
the owning view's source, not additional top-level views. Decide whether account
management is a dedicated view or embedded Manager controls before duplicating
navigation. Legal views depend on the lifecycle scope review; monthly reports
and dedicated reversals remain deferred.

## Files and index

- Keep each `.drawio` source and its exported PNG previews together here, with descriptive names such as `app-shell.drawio`, `app-shell-desktop.png`, and `app-shell-mobile.png`.
- Name pages by viewport, role, or state; keep exports synchronized with the source revision. Prefer readable, uncompressed XML when practical.
- Commit editable sources, not only screenshots or external draw.io links. Use fictional data; never include credentials or private financial information.
- As references arrive, add actual source/preview links below with role, viewport/state, draft/approved status, reviewed revision, approval date, and open questions. Only link files that exist.
- Keep visual-token and interaction guidance here too, linked from that index. Wireframes alone do not approve typography, colors, or all behavior.

No source files have been added yet.

## Review rules

Committing a reference does not approve it. New or changed references are drafts
until explicitly reviewed; record approval against the reviewed revision.
Approved references guide implementation but do not override ADRs, backend
security, exact money rules, or real-stack verification. Resolve policy conflicts
before implementation rather than inferring decisions from diagrams.

Remaining phase 3 feature work waits for the
[phase 2B acceptance gate](../../plans/migration/02b-ux-ui-design.md#acceptance-gate).