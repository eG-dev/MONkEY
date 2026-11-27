# POCKET MONkEY design references

Editable draw.io wireframes, approved PNG previews, offline click prototypes and
the design system for POCKET MONkEY, started in
[step 2B: product UX and UI design](../../plans/migration/02b-ux-ui-design.md).

- [Approval register](approvals.md): the only place recording each view's review
  state and dates. Git history keeps earlier versions; the commit that sets an
  approved state identifies what was approved.
- [ADR-0013](../ADR/ADR-0013-wireframes-and-click-prototypes.md) owns the design
  decisions and approval policy.
- The [UI/UX skill](../../.github/skills/ui-ux-design/SKILL.md) and its
  [POCKET MONkEY profile](../../.github/skills/ui-ux-design/references/pocket-monkey.md)
  own the workflow, annotation syntax, draw.io conventions and local bindings.
- [Prototype notes](prototypes/README.md) describe the current prototypes, the
  review panel, integrated entry and verification evidence.
- The [design system](design-system/README.md) holds tokens, guides and
  browser-viewable [specimens](design-system/specimens/index.html); shared fonts
  and images are in [assets](assets).

Review draft wireframes as draw.io sources. PNG previews are exported only after
source approval and marker cleanup, so a preview may show an earlier version
while its source is a draft.

## Views

| View | Wireframe sources | Previews | Prototype |
| --- | --- | --- | --- |
| Application shell | [shell](wireframes/application-shell/application-shell-wireframe.drawio) | [shell](wireframes/application-shell/application-shell-wireframe.png) | [shell](prototypes/application-shell/index.html) |
| Accounts overview | [overview](wireframes/accounts-overview/accounts-overview-wireframe.drawio) | [overview](wireframes/accounts-overview/accounts-overview-wireframe.png) | [overview](prototypes/accounts-overview/index.html) |
| Accounts | [accounts](wireframes/accounts/accounts-wireframe.drawio) | [accounts](wireframes/accounts/accounts-wireframe.png) | [accounts](prototypes/accounts/index.html) |
| Account details | [details](wireframes/account-details/account-details-wireframe.drawio) | [details](wireframes/account-details/account-details-wireframe.png) | [details](prototypes/account-details/index.html) |
| Administration | [profile](wireframes/administration/administration-profile-wireframe.drawio), [users](wireframes/administration/administration-users-wireframe.drawio), [account assignments](wireframes/administration/administration-account-assignments-wireframe.drawio) | [profile](wireframes/administration/administration-profile-wireframe.png), [users](wireframes/administration/administration-users-wireframe.png), [account assignments](wireframes/administration/administration-account-assignments-wireframe.png) | [administration](prototypes/administration/index.html) |
| Login | [login](wireframes/login/login-wireframe.drawio) | [login](wireframes/login/login-wireframe.png) | [login](prototypes/login/index.html) |
| About | [overview](wireframes/about/about-wireframe.drawio), [project license](wireframes/about/about-license-wireframe.drawio), [notices](wireframes/about/about-notices-wireframe.drawio), [legal](wireframes/about/about-legal-wireframe.drawio) | [overview](wireframes/about/about-wireframe.png), [project license](wireframes/about/about-license-wireframe.png), [notices](wireframes/about/about-notices-wireframe.png), [legal](wireframes/about/about-legal-wireframe.png) | [about](prototypes/about/index.html) |
| Integrated entry | — | — | [index](prototypes/index.html) |

## Scope

| View | Scope |
| --- | --- |
| Application shell | Shared navigation, identity/role controls, content boundaries and responsive structure, without specific view content |
| Accounts overview | Application home with accounts and balances; no separate marketing page |
| Accounts | Dedicated Manager navigation entry for account creation, management and retired accounts |
| Account details | Rename, image controls, balance, opening state, transactions/history, deposit/withdrawal forms, and monthly allowance configuration/status |
| Administration | Profile (personal preferences, password change), Users (Manager user management, last-manager protection) and Account assignments (Manager-maintained Member access) |
| Login | Sign-in, forced password change and session-expiry states |
| About | Product information, project license, third-party notices and legal information in one shared dialog |

Forms, dialogs, image upload, confirmations and validation/retry states belong
to their owning view, not additional top-level views. Instance settings remain
deployment configuration. Dedicated reversals remain deferred; monthly reports
are outside the product scope.

Approved references guide implementation but do not override ADRs, backend
security, exact money rules or real-stack verification. Resolve policy
conflicts before implementation rather than inferring decisions from diagrams.
Use fictional data only; never include credentials or private financial data.
