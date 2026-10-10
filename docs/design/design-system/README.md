# POCKET MONkEY Design System

Status: Draft for the [phase 2B design review](../../../plans/migration/02b-ux-ui-design.md).
The structure was adapted from an earlier product's design system; colors,
typography, and the application shell are specific to POCKET MONkEY. Nothing here
is approved or implemented in the [Angular application](../../../revamp/web/) yet.

POCKET MONkEY manages household pocket-money accounts on a shared instance.
Managers maintain accounts and record transactions; Members view all accounts.
Prioritize clear balances, unambiguous amounts, and simple everyday tasks over
decoration.

## Contents

- [Color scheme](color-scheme.md): logo-derived brand colors, neutrals, semantic roles, and contrast.
- [Typography](typography.md): Roboto, font assets, and type roles.
- [Logo](logo.md): supplied assets and usage rules.
- [Accessibility](accessibility.md): WCAG 2.2 AA target and outstanding verification.
- [Component design notes](components.md): product-specific patterns on top of Taiga UI.
- [Foundation specimens](specimens/index.html): browser-viewable colors, typography, spacing, and shell examples.
- [Click prototypes](../prototypes/README.md): the application shell and every view, offline.
- [Reference stylesheet](styles.css): imports the design tokens and base styles.

## Authority and Layout

[ADRs](../../ADR/README.md) and the [migration plans](../../../plans/migration/README.md)
take precedence over illustrative prototype behavior. A specimen or prototype does
not create a requirement, permission, API, or business rule.

| Material | Location |
| --- | --- |
| Guide, tokens, and specimens | This directory |
| Shared fonts and images | [docs/design/assets](../assets/) |
| Shell wireframe | [draw.io source](../wireframes/application-shell/application-shell-wireframe.drawio) and [PNG export](../wireframes/application-shell/application-shell-wireframe.png) |
| Click prototypes | [prototypes](../prototypes/README.md), outside the application build |
| Angular application | [revamp/web](../../../revamp/web/) with Taiga UI 5 and locally bundled Lucide assets |

Do not import the specimen stylesheet into Angular. When the foundations are
approved, map the tokens onto Taiga's CSS variables in the web application in a
separate, verified change.

## Content and Behavior

- Use friendly, plain, sentence-case copy. Buttons name their consequence:
  "Record deposit", "Delete account", not "OK".
- Do not show success until the backend confirms. Preserve input on failure and
  explain recovery near its source.
- Deliver every user-facing string in German and English. Allow roughly 30-40%
  text expansion for German; do not concatenate translated sentences.
- Format numbers, dates, and money for the selected language without changing the
  stored currency or values. Show an explicit currency and tabular figures for
  amounts. Positive amounts are green, negative amounts red, and zero uses the
  standard text color, always together with the sign.
- Pair status with an icon and text. Give icon-only controls accessible names and
  tooltips; never put essential information only in a tooltip.
- Hide or disable Manager-only actions for Members for clarity only; the backend
  enforces authorization.

## Visual Foundations

| Area | Baseline |
| --- | --- |
| Brand | Maroon `#650000` primary actions, links, and selection; peach `#E5BFA7` as the dark-theme accent and focus color on the toolbar |
| Toolbar | Dark grey `#2E2E2E` with white icons and text |
| Surfaces | White app background, neutral grey `#F5F5F5` panels, flat surfaces |
| Selection | Maroon indicator on a light peach `#F7EBE3` fill |
| Feedback | Success, warning, error, and info with contrast-safe `--status-*-fg` text |
| Amounts | Positive green, negative red, zero standard text, always with a sign |
| Destructive actions | Red `--action-danger` (`#C62828`), always labeled and confirmed |
| Typography | Roboto; body 14px/1.5 Regular; labels and buttons Medium; headings Bold; Light only for large figures |
| Spacing | 2, 4, 8, 12, 16, 20, 24, 32, 40, 48px |
| Radii | 2px checkboxes, 4px controls, 6px panels, 8px dialogs; pill only for badges |
| Controls | 36px default, 32px compact, 44px touch targets on small screens |
| Elevation | Borders first; shadows only for menus, dialogs, toasts, and the temporary drawer |
| Motion | Functional 100-240ms transitions; respect reduced-motion preferences |

No gradients, textures, or decorative imagery beyond the logo.

### Application Shell

The [shell wireframe](../wireframes/application-shell/application-shell-wireframe.png)
defines the outer frame only:

- A 56px dark-grey toolbar spanning the full width: hamburger and logo at the
  start, the user button at the end. The user button opens a menu with the user's
  name and role, a link to the profile in Administration, a dark-mode switch, and
  sign out.
- A 264px side navigation below the toolbar. **Overview** is the first entry;
  further entries are defined by later wireframes. **Administration** is always
  pinned to the bottom. The application name and version sit below the navigation.
- A main content container with a maximum width of 1440px, centered in the
  remaining space. Its interior layout belongs to the individual view wireframes.
- From 1440px viewport width, the navigation is pinned and can be collapsed.
  Below 1440px, it becomes a temporary drawer over the content that closes after
  selection, with Escape, or by clicking the backdrop. Opening it must not move the
  toolbar controls.

The same shell must work down to 320px wide on phones (see the
[design plan](../../../plans/migration/02b-ux-ui-design.md#verification)).

### Icons and Components

Use the locally bundled Lucide assets from `lucide-static`; never load icons or
fonts from a CDN. Typical icon sizes are 16px in tables, 18px in controls, and
20-24px in navigation and the toolbar. No emoji as icons.

Taiga owns standard controls, dialogs, notifications, and other primitives. The
[component notes](components.md) only record product-specific choices.

## Tokens and Assets

The [reference styles](styles/) contain the [colors](styles/colors.css),
[typography](styles/typography.css), [spacing](styles/spacing.css),
[font declarations](styles/fonts.css), and [base rules](styles/base.css) used by
the specimens and the prototype. Keep token names and values synchronized when
they are adopted in Angular.

Fonts and images live once in [docs/design/assets](../assets/); do not duplicate
them in the design system. Specimens and the prototype load all assets locally
and work offline when opened directly from the file system.

## Open Checks

Before approval, resolve the [open questions](color-scheme.md#open-questions),
keyboard and screen-reader behavior, zoom/reflow,
German layouts, and phone widths. The prototype is not evidence that these checks
have passed.
