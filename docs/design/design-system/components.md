# Component Design Notes

These framework-neutral notes record POCKET MONkEY-specific choices on top of
Taiga UI. They are design inputs, not a component API or proof that a component
exists in Angular. Use the [design guide](README.md) and [reference styles](styles/)
for shared values and the [accessibility baseline](accessibility.md) for
interaction requirements.

**Approved 2026-10-23:** the tonal-surface revision below replaces decorative
outlines with neutral fills, spacing and restrained elevation. The user approved
the current prototypes for Angular implementation; the surface treatment is now
mapped into application SCSS. Earlier approvals remain history.

## Standard Controls

| Pattern | POCKET MONkEY choice |
| --- | --- |
| Actions | Primary for the main action, secondary for alternatives, ghost for low emphasis, danger for destructive consequences. While submitting, prevent duplicate submission without implying success. |
| Switch or checkbox | A switch applies a setting immediately; a checkbox is committed with a form. |
| Panels | Borderless titled groups on `--surface-panel`, separated by spacing; optional header actions and footer. Do not nest decorative panel frames. |
| Account cards | Borderless `--surface-card` fill, `--surface-card-hover` on hover and at most `--shadow-1` hover elevation. Keep amount signs, colour and keyboard focus visible. |
| Feedback | Show errors near their source and success only after confirmation. Inline messages use `--status-*-bg`, primary text and a `--status-*-fg` icon without a surrounding outline. A toast is supplementary. |
| Count badges | `--count-bg`/`--count-fg` pill, or `--count-danger-bg` with white text when action is needed. |
| Theme-aware neutrals | Navigation text uses `--text-nav`, icons `--icon-default`, checkbox and radio outlines `--control-border`. Do not use grey literals. |
| Inputs | `--surface-input`, `--text-primary` values, `--text-placeholder` placeholders; never a white literal. |

## Surface Hierarchy

- Separate the page, navigation and grouped content with neutral surface tones
  and whitespace, not an outline around every region. Keep sections unframed;
  a tonal panel is for a meaningful group, not a wrapper around more panels.
- Use raised surfaces and existing shadows for menus, dialogs and toasts.
  Regular panels stay flat; account cards gain only subtle hover elevation.
- Use alternating soft table-row tones and spacing instead of row rules.
  Secondary buttons use a neutral fill rather than an outlined style.
- Keep borders where they convey interaction or state: input boundaries,
  checkbox/radio outlines, selected navigation/tab indicators and error inputs.
  Always retain visible keyboard focus. Do not remove boundaries in forced
  colours or other accessibility adaptations merely to match the flat style.
- Retain the established layout, brand colours, amount semantics and radii.
  The [surface specimen](specimens/colors-surfaces.html) shows both themes.

## View Headers

- Keep the view title and identity on the left. Place view-level actions, such as
  refresh or create, at the right edge of the main content header, not immediately
  beside the title. Group multiple view actions there with consistent spacing.
- Keep contextual actions beside their target: for example, the account-name
  pencil stays beside the name, and row actions stay in their row.
- On narrow screens, allow long titles to wrap without shrinking icon controls
  or overlapping content. Keep view actions aligned right; if the header needs
  another line, the action group remains right-aligned on that line.
- Account details groups icon-only refresh followed by a labelled, plus-icon
  "Record transaction" button. Managers see that action only after an opening
  balance exists. At every width it opens the same deposit/withdrawal dialog;
  no transaction form is embedded in the regular view. Phones use the existing
  full-screen dialog. Errors preserve input; success closes the dialog and
  refreshes balance/history. Closing without posting preserves the draft.

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

## Mobile Account Rows

- Below 600px, use two columns: identity on the left and balance on the right.
- Avatar and underlined name share one link with a minimum 44px tap height.
- Place muted caption-sized status beneath the name, aligned with the name rather
  than the avatar. Long names wrap within the identity column.
- Hide the duplicate chevron and separate status cells on phones. Desktop keeps
  the status column and chevron action.
- Bound the balance column so long amounts can wrap without overlapping names
  or creating horizontal page overflow; never truncate a monetary value.

## Reference Lifecycle

The [click prototypes](../prototypes/README.md) show these patterns per view;
they are review references, not a component catalogue. Build further examples
from these notes, the tokens, and the view wireframes.
