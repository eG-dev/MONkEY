# POCKET MONkEY Design Profile

Repository bindings for the reusable [UI/UX design workflow](../SKILL.md),
following the [profile contract](project-profile.md). They apply only here.

## Decisions and Index

- Decision records: [ADR-0013](../../../../docs/ADR/ADR-0013-wireframes-and-click-prototypes.md) owns design decisions and the approval policy; [ADR-0005](../../../../docs/ADR/ADR-0005-e2e-first-verification.md) owns implementation verification.
- Concise constraints: [design instructions](../../../instructions/design.instructions.md).
- Design index: [docs/design/README.md](../../../../docs/design/README.md): artifact links, scope and pointers; no status.
- Approval register: [docs/design/approvals.md](../../../../docs/design/approvals.md): one row per view with its ordered review state and dates; the only place tracking approval status.

## Settings

- Design baseline: [design guide](../../../../docs/design/design-system/README.md), [components](../../../../docs/design/design-system/components.md) and [typography](../../../../docs/design/design-system/typography.md); inspect the affected or nearest analogous [prototype](../../../../docs/design/prototypes/) and [Angular component](../../../../web/src/app/components/).
- Business context: none. Requirements and ADRs are the authoritative inputs.
- Brand standard: none. The design system is the only visual baseline.
- Wireframe use: by review value per ADR-0013; small changes may start directly with the prototype.
- Wireframes: `docs/design/wireframes/<view>/<view>-wireframe.drawio`; approved preview `<view>-wireframe.png` beside it.
- draw.io executable (Windows): `C:\Program Files\draw.io\draw.io.exe`.
- Desktop viewport: 1440px main content; the application shell has its own wireframe. Full-window wireframes (application shell, login) use 1920px.
- Product languages: German and English for prototypes and the application.
- Permissions: Manager (business writes) and Member (read-only). Never treat UI visibility as security enforcement.
- Themes: light and dark.
- Breakpoints: 1440px desktop and 360px phone; phone styles use `@media (max-width: 599px)`.
- Tokens: `docs/design/design-system/styles/*.css` with light and dark values; contrast in `color-scheme.md`, patterns in `components.md` or `typography.md`.
- Prototypes: `docs/design/prototypes/<view>/index.html`; shared runtime `docs/design/prototypes/shared/`; integrated entry `docs/design/prototypes/index.html`; composition notes in the [prototype README](../../../../docs/design/prototypes/README.md). Every page owns its shell and hosts its own review panel; the integrated entry is a chrome-less frame without one, so no cross-frame messaging is used.
- Implementation: Angular, following the [web instructions](../../../instructions/web.instructions.md).
- Style overrides: none.

## Scope Vocabulary

Order: `role`, `state`, `device` or `viewport`, then any added attributes in the
order listed below. Add a new attribute here with its values and position when a
detail genuinely varies along another dimension.

```text
role: manager | member
state: e.g. retired | uninitialized | password change required | signed out
device: phone
viewport: e.g. below 1440px
edge-case: e.g. duplicate names
```

Use `[roles: manager, member]` only for a detail shared by both roles.
Use `edge-case` after device/viewport scopes for exceptional data conditions,
such as `[edge-case: duplicate names]`, rather than treating them as view states.

## Prototype Runtime

Page skeleton: `<div id="view">`, then `../shared/data.js`, `../shared/prototype.js`,
and an inline script calling `PM.init`.

```js
PM.init({
  active: 'overview',            // navigation entry; omit for none
  title: 'pageTitleKey',
  states: ['normal', 'loading', 'error'], // optional review states, shown in the review panel
  render,                        // re-run on every language, theme, role, or data change
  strings: { en: { /* … */ }, de: { /* … */ } }
});
```

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

- Provide every string in English and German. Use `PM.t`, `PM.money` and `PM.date`; never hard-code translated strings, amounts, currency or dates.
- Amounts are always signed: positive green, negative red, zero standard text.
- Use fictional data and local assets only; no CDNs, fonts or icons from the internet.
- `PM.init` loads the review panel and registers its Settings (language, theme; on shell pages also sample user and navigation), States (`states`, Next save fails, Reset prototype data) and About this view. Per-view purpose and wireframe links live in `REVIEW_VIEWS` in `prototype.js`; add an entry for a new view. Never add review controls or sample notes to the reviewed layout.

## Shared Helpers

| Purpose | Scope | Source and usage references |
| --- | --- | --- |
| Prototype runtime (`PM.*` above): shell, localization, formatting, dialogs, field errors, simulated saves, fictional data | Prototypes | [prototype.js](../../../../docs/design/prototypes/shared/prototype.js), [prototype.css](../../../../docs/design/prototypes/shared/prototype.css), [data.js](../../../../docs/design/prototypes/shared/data.js); composition in the [prototype README](../../../../docs/design/prototypes/README.md) |
| Review panel for settings, sample states and view context | Prototypes only | [prototype-review.js](../../../../docs/design/prototypes/shared/prototype-review.js) and [prototype-review.css](../../../../docs/design/prototypes/shared/prototype-review.css), unchanged copies of the skill starter, registered by `prototype.js`; see the [review panel notes](../../../../docs/design/prototypes/README.md#review-panel) |
| About dialog and license text | Prototypes | [about.js](../../../../docs/design/prototypes/shared/about.js), [project-license.js](../../../../docs/design/prototypes/shared/project-license.js); used by the [shell](../../../../docs/design/prototypes/application-shell/index.html) |
| Shared design styles | Prototypes and specimens | [styles.css](../../../../docs/design/design-system/styles.css), [style modules](../../../../docs/design/design-system/styles/), [specimens](../../../../docs/design/design-system/specimens/) |
| Modal dialog | Application | [modal-dialog.ts](../../../../web/src/app/components/modal-dialog/modal-dialog.ts), [modal-dialog.html](../../../../web/src/app/components/modal-dialog/modal-dialog.html); consumer [profile.html](../../../../web/src/app/components/profile/profile.html) |
| Amount formatting and tone | Application | [currency-amount.pipe.ts](../../../../web/src/app/pipes/currency-amount/currency-amount.pipe.ts), [amount-tone.pipe.ts](../../../../web/src/app/pipes/amount-tone/amount-tone.pipe.ts); consumer [accounts.html](../../../../web/src/app/components/accounts/accounts.html) |
| Language and theme | Application | [language](../../../../web/src/app/services/language/), [theme](../../../../web/src/app/services/theme/) services |

## Verification

- Matrix: Manager and Member, English and German, light and dark, 1440px and 360px, plus the changed review states.
- Exercise simulated save failures with "Next save fails" in the review panel.
- Record evidence in the [prototype README](../../../../docs/design/prototypes/README.md) and the view's state in the [approval register](../../../../docs/design/approvals.md), in the same commit as the change or approval.
- The integrated browser tab may be hidden: prefer `page.evaluate` with `requestSubmit()`/`click()` or `force: true` clicks, and disable the cache (`Network.setCacheDisabled`) so edited `file://` scripts reload.
