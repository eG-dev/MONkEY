---
name: ui-ux-design
description: "Workflow for UI/UX changes in POCKET MONkEY: create or update a view's draw.io wireframe, build or extend its offline click prototype, adjust design-system tokens, and prepare the Angular implementation. Use when asked to design, redesign, or change a screen, dialog, navigation, colors, states, or interaction behavior, or to add a new view."
---

# UI/UX Design Workflow

Implements [ADR-0013](../../../docs/ADR/ADR-0013-wireframes-and-click-prototypes.md).
Follow the [design instructions](../../instructions/design.instructions.md) for
the rules; this skill describes the steps.

## 1. Understand the change

1. Read the [design index](../../../docs/design/README.md), the affected wireframe PNG, and the prototype.
2. Read the applicable ADRs and plans (business rules, roles, money, language). A design change must not invent business rules; ask when a policy is unclear.
3. Decide which artifacts change:

| Change | Wireframe | Prototype | Design system |
| --- | --- | --- | --- |
| New view | New source and PNG | New page | Only if new patterns are needed |
| Layout, sections, navigation, new controls | Update | Update | — |
| Validation, states, texts, dialog details, interaction | Callout only if important | Update | — |
| Colors, typography, spacing, component pattern | — | Update affected pages | Update tokens and guides |
| Shell (toolbar, navigation, user menu) | Shell wireframe | `shared/prototype.js` / `.css` | If tokens change |

## 2. Wireframe

- Location: `docs/design/wireframes/<view>/<view>-wireframe.drawio`; one page, 1440px wide, showing only the main content container.
- Style conventions: Calibri; panels and controls as plain boxes; primary actions green-filled; placeholders dashed; yellow callouts (`shape=callout`) for behavior, states, roles, dialogs, and phone layout.
- Keep the XML readable. If the user edited the source, change only the affected cells.
- Export the preview with the draw.io desktop app:

```powershell
& "C:\Program Files\draw.io\draw.io.exe" -x -f png -b 10 -o <view>-wireframe.png <view>-wireframe.drawio
```

- View the exported PNG and fix overlapping callouts before continuing.

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
- Summarize what changed and what was verified; list open business questions instead of deciding them in the design.
- Angular implementation happens separately after approval, following the [web instructions](../../instructions/revamp-web.instructions.md) and the E2E-first verification of [ADR-0005](../../../docs/ADR/ADR-0005-e2e-first-verification.md).
