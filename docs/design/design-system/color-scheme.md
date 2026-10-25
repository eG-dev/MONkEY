# Color Scheme

Status: Brand palette approved on 2026-10-10; tonal-surface and secondary-action
revision explicitly approved on 2026-10-23 and implemented in Angular.
Brand colors are sampled from the supplied
[logo](../assets/images/monkey.png); everything else is derived. Values are
defined in [colors.css](styles/colors.css). Calculated contrast ratios are token
pairs, not rendered-state test results.

## Core Palette

| Role | Token | Hex | Intended use |
| --- | --- | --- | --- |
| Primary | `--pm-color-primary` | `#650000` | Logo maroon: primary actions, links, selection indicator, focus |
| Secondary | `--pm-color-secondary` | `#E5BFA7` | Logo peach: dark-theme actions and links, focus on the toolbar |
| Tertiary | `--pm-color-tertiary` | `#F7EBE3` | Light peach: selected navigation and subtle brand fills |
| Toolbar | `--pm-color-toolbar` | `#2E2E2E` | Dark-grey application toolbar |
| Toolbar dark | `--pm-color-toolbar-dark` | `#1F1F1F` | Toolbar in the dark theme |
| Background | `--pm-color-background` | `#FFFFFF` | Light app background |
| Surface | `--pm-color-surface` | `#F5F5F5` | Panels and content surfaces |
| Background dark | `--pm-color-background-dark` | `#121212` | Dark app background |
| Surface dark | `--pm-color-surface-dark` | `#1E1E1E` | Dark panels |
| Surface raised dark | `--pm-color-surface-raised-dark` | `#262626` | Dark menus and dialogs |
| Text | `--pm-color-text` | `#242424` | Primary text on light surfaces |
| Text dark | `--pm-color-text-dark` | `#E0E0E0` | Primary text on dark surfaces |
| Text dimmed | `--pm-color-text-dimmed` | `#666666` | Supporting execution text on light surfaces |
| Text dimmed dark | `--pm-color-text-dimmed-dark` | `#A6A6A6` | Supporting execution text on dark surfaces |
| Success | `--pm-color-success` | `#00C853` | Confirmed outcomes |
| Warning | `--pm-color-warning` | `#FF9800` | Attention required |
| Error | `--pm-color-error` | `#F44336` | Errors and validation |
| Info | `--pm-color-info` | `#2196F3` | Information |
| Danger | `--pm-color-danger` | `#C62828` | Destructive actions |

Neutrals are pure greys (`--grey-0` to `--grey-900`) so they do not compete
with the warm brand colors. Components use the semantic aliases such as
`--text-primary`, `--surface-panel`, and `--action-primary`, never raw hex values.

## Application

### Text Dimmed (Allowance Presentation, 2026-10-24)

**Wireframes R1 and prototypes R2 approved, 2026-10-24.** The overview execution-information
row is below the monthly allowance. Successful and scheduled execution text uses
the theme-aware semantic token `--text-dimmed`, backed by these core tokens:

| Role | Token | Hex | Intended use |
| --- | --- | --- | --- |
| Text dimmed | `--pm-color-text-dimmed` | `#666666` | Supporting execution text on light surfaces |
| Text dimmed dark | `--pm-color-text-dimmed-dark` | `#A6A6A6` | Supporting execution text on dark surfaces |

Calculated contrast for the light token: 5.74:1 on white, 5.27:1 on
card `#F5F5F5`, and 4.82:1 on hovered card `#EBEBEB`. The dark token:
7.70:1 on app `#121212`, 6.85:1 on card `#1E1E1E`, and 5.74:1 on hovered card
`#2C2C2C`. All exceed 4.5:1 for normal text. Amount colors retain their existing
meaning. The approved R2 used `--status-danger-fg` (`#C62828` light /
`#FF8A80` dark), not dimmed text, with an explicit failure label.
This is a color-detail correction requested on 2026-10-24; role visibility is
unchanged. The subsequent Error Feedback R3 draft below supersedes that failure
color proposal. Definitions and semantic theme mappings are in
[colors.css](styles/colors.css); both treatments appear in the
[surface specimen](specimens/colors-surfaces.html). Angular follows prototype
approval.

### Error Text (Error Feedback R3, 2026-10-24)

**Approved, 2026-10-24.** The user corrected failed executions to Error rather than Danger
and selected a distinct, contrast-safe error-text variant. The Error core swatch
remains `--pm-color-error: #F44336`; it is not suitable for small text on light
cards (3.68:1 on white, 3.38:1 on `#F5F5F5`, 3.09:1 on hover `#EBEBEB`).

| Role | Derived token | Semantic alias | Light | Dark |
| --- | --- | --- | --- | --- |
| Error text | `--error-text-fg` | `--status-error-fg` | `#C4352B` | `#FF6B60` |

The light variant keeps the Error swatch's warm-red direction while darkening
it for text. Contrast is 5.40:1 on white, 4.95:1 on the card and 4.53:1 on hover.
The dark variant has 6.71:1 on `#121212`, 5.97:1 on `#1E1E1E` and 5.00:1 on
hover `#2C2C2C`. All exceed 4.5:1 for normal text.

The Overview failed-execution row and the surface specimen use this alias.
Successful/scheduled rows remain dimmed. Destructive-action Danger colors,
existing status aliases and sign-based monetary colors are unchanged; this is
not a global recoloring of validation or feedback components. The user explicitly
approved the current prototype and token values with "both approved"; Angular
uses the same foreground values and semantic alias.

### Usage

- Use neutral surfaces for content and maroon for hierarchy, actions, and
  selection. Do not use peach as text on white (1.7:1).
- Reserve feedback colors for their meaning and pair them with text or an icon.
- The dark toolbar uses white text and icons; its focus outline switches to peach,
  because maroon is invisible on dark grey.
- Maroon primary and red danger are both reddish. Distinguish destructive actions
  by label, icon, and confirmation, never by color alone.

## Amounts

Everywhere in the application, including balances, transactions, and totals:

| Value | Token | Light | Dark |
| --- | --- | --- | --- |
| Positive | `--amount-positive` | Green `#00732F` | `#5FD38D` |
| Negative | `--amount-negative` | Red `#C62828` | `#FF8A80` |
| Zero | `--amount-zero` | Primary text | Primary text |

Always keep the sign (`+`/`−`) as well, so the meaning does not depend on color.
The color reflects only the sign of the value, not whether it is a problem: a
negative balance is shown in red whether or not it is allowed.

Calculated contrast: green 6.0:1 on white and 5.5:1 on panels; red 5.6:1 and
5.2:1; dark green 8.9:1 and dark red 7.3:1 on dark panels.

The record-transaction form uses the same meaning for its mode: deposit uses
`--action-deposit` (green) and withdrawal `--action-withdrawal` (red) on the
selected toggle, the amount sign, and the submit button, always together with a
`+`/`−` icon and the label. Labels have 6.0:1 (deposit) and 5.6:1 (withdrawal)
in light mode and 8.3:1 and 6.8:1 in dark mode.

## Calculated Contrast

### Tonal Surfaces

Cards use `--surface-card` (`#F5F5F5` light / `#1E1E1E` dark), with
`--surface-card-hover` (`#EBEBEB` / `#2C2C2C`). Panels retain `--surface-panel`;
menus/dialogs retain `--surface-raised`. Light navigation uses `#FAFAFA` to
separate it from the white page without a divider. These are decorative surface
differences, not substitutes for control boundaries or keyboard focus.

| Pair | Light | Dark |
| --- | --- | --- |
| Primary / secondary text on card | 14.24 / 6.95:1 | 12.63 / 7.95:1 |
| Primary / secondary text on hovered card | 13.02 / 6.35:1 | 10.58 / 6.66:1 |
| Secondary-button label, default / hover / active | 13.02 / 10.68 / 8.26:1 | 9.57 / 8.23 / 5.74:1 |

Secondary-button fills are `#EBEBEB` / `#D6D6D6` / `#BDBDBD` in light mode and
`#333333` / `#3D3D3D` / `#545454` in dark mode. Their labels remain primary text.
The [surface specimen](specimens/colors-surfaces.html) and shared prototypes
demonstrate the approved treatment, now mapped into Angular application SCSS.

### Established Pairs

| Pair | Ratio |
| --- | --- |
| White on primary `#650000` / hover `#841A1A` / active `#4A0000` | 13.5 / 9.8 / 16.3:1 |
| Primary on white / on selected fill `#F7EBE3` | 13.5 / 11.6:1 |
| White on toolbar `#2E2E2E` | 13.6:1 |
| Peach focus on toolbar | 8.0:1 |
| White on danger `#C62828` / hover `#A61F1F` | 5.6 / 7.4:1 |
| Text `#242424` / secondary `#545454` / muted `#6E6E6E` on white | 15.5 / 7.6 / 5.1:1 |
| Muted text on panel `#F5F5F5` | 4.7:1 |
| Control border `#6E6E6E` / strong border `#8A8A8A` on white | 5.1 / 3.5:1 |

## Dark Theme

The dark theme uses neutral charcoal surfaces and peach for actions, links,
selection, and focus. Primary buttons use peach with `#242424` labels.

| Pair | Ratio |
| --- | --- |
| Label on peach default / hover `#EDCFBC` / pressed `#D4A88C` | 9.1 / 10.5 / 7.2:1 |
| Peach on raised `#262626` / selected `#3B2A22` / app `#121212` | 8.9 / 8.0 / 11.0:1 |
| Primary / secondary / muted text on raised | 11.5 / 7.2 / 5.6:1 |

Dark feedback tints and foregrounds are re-derived in [colors.css](styles/colors.css).

## Open Questions

- **Logo on the dark toolbar:** the maroon "k" and face outline have 1.0:1
  contrast against `#2E2E2E` and are hard to make out. A dark-background logo
  variant is needed (see [logo](logo.md)).
- **Dark mode preference:** the [shell wireframe](../wireframes/application-shell/application-shell-wireframe.png)
  adds a dark/bright switch to the user menu. Decide the default (light or the
  device setting) and whether the choice is saved as a personal preference.
