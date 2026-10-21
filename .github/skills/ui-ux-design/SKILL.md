---
name: ui-ux-design
description: "Workflow for UI/UX changes in POCKET MONkEY: create or update a view's draw.io wireframe, build or extend its offline click prototype, adjust design-system tokens, and prepare the Angular implementation. Use when asked to design, redesign, or change a screen, dialog, navigation, colors, states, or interaction behavior, or to add a new view."
---

# UI/UX Design Workflow

Implements [ADR-0013](../../../docs/ADR/ADR-0013-wireframes-and-click-prototypes.md).
Follow the [design instructions](../../instructions/design.instructions.md) for
the rules; this skill describes the steps.

## Explicit Approval Gates

- New or changed wireframes and click prototypes are drafts until the user explicitly approves the current revision of each artifact. Preserve earlier approvals as history; never carry them forward to changed references.
- Feedback, requested corrections, annotation-placement confirmation, business-policy acceptance, "proceed", and successful automated checks are not design approval. A response that identifies remaining flaws leaves the artifact unapproved.
- After wireframe export and inspection, present the draft and wait for explicit wireframe approval before advancing to its click prototype. After prototype verification, present the draft and wait for explicit prototype approval before Angular implementation. The user may explicitly approve both named current artifacts together.
- Approval must identify the artifact and reviewed revision. Record the user's explicit approval and date in the design index only after it is given. Never mark a reference approved based on inference or implementation progress.
- When corrections are requested, apply them to the draft, verify it, and return it for review. Do not repeatedly prompt for approval while the user is still reviewing or requesting fixes, and do not continue dependent implementation in the meantime.

## 1. Understand the change

1. Read the [design index](../../../docs/design/README.md), the affected wireframe PNG, and the prototype.
2. Read the applicable ADRs and plans (business rules, roles, money, language). A design change must not invent business rules; ask when a policy is unclear.
3. Decide which artifacts change:

| Change | Wireframe | Prototype | Design system |
| --- | --- | --- | --- |
| New view | New source and PNG | New page | Only if new patterns are needed |
| Layout, sections, navigation, new controls | Update | Update | — |
| Validation, states, texts, dialog details, interaction | Note only if important | Update | — |
| Colors, typography, spacing, component pattern | — | Update affected pages | Update tokens and guides |
| Shell (toolbar, navigation, user menu) | Shell wireframe | `shared/prototype.js` / `.css` | If tokens change |

## 2. Wireframe

- Location: `docs/design/wireframes/<view>/<view>-wireframe.drawio`; one page with a 1440px-wide main-content viewport (or an existing agreed viewport size). Expand the drawing around it for annotations; do not enlarge the viewport merely to fit notes.
- Use English only for all wireframe text, including UI labels, placeholders, annotations and connector labels, unless the user explicitly requests another language or bilingual text. Do not pair English and German terms by default. The bilingual requirements for click prototypes and the application remain unchanged.
- Style conventions: Calibri; panels and controls as plain boxes; primary actions green-filled; placeholders dashed. Enclose the viewport in a dashed border. Use yellow note shapes (`shape=note`, not callouts) for behavior, states, roles, dialogs, and phone layout, entirely outside the viewport. Arrange notes around its edges with space between them. Connect each note to the relevant existing component with an arrow pointing from note to component; route through empty space where possible.
- Keep the XML readable. If the user edited the source, change only the affected cells.
- Consolidate notes about the same area/component into one note with one arrow. Use straight connectors (`edgeStyle=none;curved=0`) with a 3px stroke (`strokeWidth=3`) and no intermediate waypoints.
- Use a black 3px viewport border with draw.io's "Dashed (1)" preset (`strokeColor=#000000;strokeWidth=3;dashed=1`, no custom `dashPattern`).
- Send the viewport rectangle to the back (first drawable cell in the XML root), keeping other elements in front. Use black (`strokeColor=#000000`) for annotation connector lines.
- Make new or changed annotations visually obvious during review instead of embedding revision labels such as "R5 draft" in comment text. Prefer a temporary light-blue note (`fillColor=#dae8fc;strokeColor=#6c8ebf`); optionally highlight its text or connector in blue (`#0078D4`). Use a consistent marker for the changed annotations only, keeping their text readable and preserving the user's positions and arrow routing. Keep revision/approval history in the design index, not the annotation prose.
- After explicit approval, inspect the approved source for remaining review colours. If the user has not reset them, restore the normal yellow note (`fillColor=#fff2cc;strokeColor=#d6b656`), black text (`fontColor=#000000`) and black connector (`strokeColor=#000000`), removing temporary inline text-colour overrides where necessary. Remove obsolete revision/draft prefixes from annotation prose without changing its meaning. Preserve all other user edits. This is approval housekeeping, not a new design revision or approval gate.
- Whenever review markers are added or cleared, re-export and inspect the PNG from the resulting source. Do not leave the approved preview showing stale highlights, or record cleanup as complete until the source and preview agree.
- Give notes an initial non-overlapping position outside the viewport, then ask the user to arrange them in draw.io. Offer all four sides, including top and bottom, to shorten arrows. Pause final layout/export review until the user confirms the arrangement is ready; do not automatically optimize routes or overwrite their placement. A preliminary PNG may be exported as a draft.
- Export the preview with the draw.io desktop app:

```powershell
& "C:\Program Files\draw.io\draw.io.exe" -x -f png -b 10 -o <view>-wireframe.png <view>-wireframe.drawio
```

- Once the user confirms the arrangement, re-export and view the PNG. Check English-only text (unless explicitly requested otherwise), the dashed viewport, external note placement, readable text, one arrow per annotated area, and absence of annotation/control overlap before continuing.
- Arrangement confirmation only permits export. Wait for explicit approval of the exported wireframe revision before starting or updating its dependent click prototype.

## 3. Click prototype

- Page skeleton: `docs/design/prototypes/<view>/index.html` with `<div id="view">`, then `../shared/data.js`, `../shared/prototype.js`, and an inline script calling `PM.init`.

```js
PM.init({
  active: 'overview',            // navigation entry; omit for none
  title: 'pageTitleKey',
  states: ['normal', 'loading', 'error'], // optional review states
  render,                        // re-run on every language, theme, role, or data change
  strings: { en: { /* … */ }, de: { /* … */ } }
});
```

- Runtime helpers in `shared/prototype.js`:

| Helper | Purpose |
| --- | --- |
| `PM.t(key, params)` | Translated text; `{name}` placeholders |
| `PM.money(minor)` / `PM.amountHtml(minor)` | Signed, colored amount from integer cents |
| `PM.parseAmount(text, { signed })` | Exact two-decimal input to cents, or `null` |
| `PM.date(iso, withTime)` | Business-timezone date formatting for the language |
| `PM.dialog({ title, body, footer, dismissible })` | Modal dialog with focus return |
| `PM.fieldError(input, message)` | Accessible field error |
| `PM.request()` | Simulated save; honors "Next save fails" |
| `PM.toast(text, tone)` | Supplementary confirmation |
| `PM.data`, `PM.saveData()` | Fictional data in local storage |
| `PM.isManager()`, `PM.currentUser()` | Role-dependent rendering |

- Cover the important states: loading, empty, error with retry, validation, submitting, success, failure with kept input, Member read-only, phone layout (`@media (max-width: 599px)`).
- Add every string in English and German. Use tokens from `design-system/styles/`; add a token there rather than a literal.

## 4. Design system

- Change tokens in `design-system/styles/*.css` with light and dark values.
- Calculate contrast for new color pairs and document them in `color-scheme.md`; update `components.md` or `typography.md` for new patterns and the specimens when a foundation changes.

## 5. Verify

Open the prototype in the integrated browser and check:

- Manager and Member, English and German, light and dark mode.
- Desktop width and a 360px phone width without horizontal overflow.
- The changed flows, including validation, failure ("Next save fails"), and the review states.
- No script errors in the console.

The integrated browser tab may be hidden: prefer `page.evaluate` with `requestSubmit()`/`click()` or `force: true` clicks, and disable the cache (`Network.setCacheDisabled`) so edited `file://` scripts reload.

## 6. Finish

- Update the [design index](../../../docs/design/README.md): links, and mark changed references as drafts until the user approves them.
- When approval is given, record the approved revision/date and complete the annotation-colour cleanup and PNG re-export above; do not wait for the user to request cleanup separately.
- Summarize what changed and what was verified; list open business questions instead of deciding them in the design.
- Angular implementation happens separately after approval, following the [web instructions](../../instructions/web.instructions.md) and the E2E-first verification of [ADR-0005](../../../docs/ADR/ADR-0005-e2e-first-verification.md).
- If either current artifact is still a draft, finish by stating what awaits review. Do not infer approval from feedback or a general instruction to continue.
