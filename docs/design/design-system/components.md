# Component Design Notes

These framework-neutral notes record POCKET MONkEY-specific choices on top of
Taiga UI. They are design inputs, not a component API or proof that a component
exists in Angular. Use the [design guide](README.md) and [reference styles](styles/)
for shared values and the [accessibility baseline](accessibility.md) for
interaction requirements.

## Standard Controls

| Pattern | POCKET MONkEY choice |
| --- | --- |
| Actions | Primary for the main action, secondary for alternatives, ghost for low emphasis, danger for destructive consequences. While submitting, prevent duplicate submission without implying success. |
| Switch or checkbox | A switch applies a setting immediately; a checkbox is committed with a form. |
| Panels | Titled groups on `--surface-panel` with a 1px border, optional header actions and footer. |
| Feedback | Show errors near their source and success only after confirmation. Inline messages use the tone's `--status-*-bg`, a 1px `--status-*-solid` border, primary text, and a `--status-*-fg` icon. A toast is supplementary. |
| Count badges | `--count-bg`/`--count-fg` pill, or `--count-danger-bg` with white text when action is needed. |
| Theme-aware neutrals | Navigation text uses `--text-nav`, icons `--icon-default`, checkbox and radio outlines `--control-border`. Do not use grey literals. |
| Inputs | `--surface-input`, `--text-primary` values, `--text-placeholder` placeholders; never a white literal. |

## View Headers

- Keep the view title and identity on the left. Place view-level actions, such as
  refresh or create, at the right edge of the main content header, not immediately
  beside the title. Group multiple view actions there with consistent spacing.
- Keep contextual actions beside their target: for example, the account-name
  pencil stays beside the name, and row actions stay in their row.
- On narrow screens, allow long titles to wrap without shrinking icon controls
  or overlapping content. Keep view actions aligned right; if the header needs
  another line, the action group remains right-aligned on that line.

## Amounts

- Show amounts with an explicit currency and tabular figures, formatted for the
  selected language. Language never changes the stored value or currency.
- Right-align comparable amounts. Render positive amounts with `--amount-positive`
  (green), negative with `--amount-negative` (red), and zero with
  `--amount-zero` (standard text). Always show the sign as well; see
  [amount colors](color-scheme.md#amounts).
- Never truncate an amount; long values wrap or the layout adapts.
- The record-transaction form shows its mode by color and sign: deposit green
  with `+`, withdrawal red with `−`, on the selected toggle, before the amount,
  and on the submit button ("Record deposit" / "Record withdrawal").

## Navigation

- Back/forward text navigation uses the matching Lucide `arrow-left` and `arrow-right` icons, never a text arrow. Icons are decorative beside the link label and share consistent spacing.
- Regular links remain underlined. Text navigation links, including back/overview and account-management navigation, use `--type-body-lg` without underlines. Account-name links to account details use the same larger type but retain their underlines. Sidebar, tab, and menu controls keep their established styling.
- Selected navigation uses `--surface-selected`, a 4px `--indicator-selected`
  start border, and `--text-selected` in Medium weight.
- Administration is pinned to the bottom of the side navigation.
- Below 1440px, the navigation is a temporary drawer that closes after selection.
  Opening or closing it must not reset the current view.
- Confirm consequential departures, such as leaving an unsaved transaction form;
  cancelling preserves the entered data.

## Reference Lifecycle

The [click prototypes](../prototypes/README.md) show these patterns per view;
they are review references, not a component catalogue. Build further examples
from these notes, the tokens, and the view wireframes.
