# POCKET MONkEY Design Profile

Repository bindings for the reusable [UI/UX design workflow](../SKILL.md),
following the [profile contract](project-profile.md). They apply only here.

## Decisions and Index

- Decision records: [ADR-0013](../../../../docs/ADR/ADR-0013-wireframes-and-click-prototypes.md) owns design decisions and the approval policy; [ADR-0005](../../../../docs/ADR/ADR-0005-e2e-first-verification.md) owns implementation verification.
- Concise constraints: [design instructions](../../../instructions/design.instructions.md).
- Design index: [docs/design/README.md](../../../../docs/design/README.md).

## Settings

- Wireframes: `docs/design/wireframes/<view>/<view>-wireframe.drawio`; approved preview `<view>-wireframe.png` beside it.
- draw.io executable (Windows): `C:\Program Files\draw.io\draw.io.exe`.
- Desktop viewport: 1440px main content; the application shell has its own wireframe. Full-window wireframes (application shell, login) use 1920px.
- Product languages: German and English for prototypes and the application.
- Permissions: Manager (business writes) and Member (read-only). Never treat UI visibility as security enforcement.
- Themes: light and dark.
- Breakpoints: 1440px desktop and 360px phone; phone styles use `@media (max-width: 599px)`.
- Tokens: `docs/design/design-system/styles/*.css` with light and dark values; contrast in `color-scheme.md`, patterns in `components.md` or `typography.md`.
- Prototypes: `docs/design/prototypes/<view>/index.html`; shared runtime `docs/design/prototypes/shared/`; integrated entry `docs/design/prototypes/index.html`; composition notes in the [prototype README](../../../../docs/design/prototypes/README.md).
- Implementation: Angular, following the [web instructions](../../../instructions/web.instructions.md).
- Style overrides: none.

## Scope Vocabulary

Order: `role`, `state`, `device` or `viewport`.

```text
role: manager | member
state: e.g. retired | uninitialized | password change required | signed out
device: phone
viewport: e.g. below 1440px
```

Use `[roles: manager, member]` only for a detail shared by both roles.

## Prototype Runtime

Page skeleton: `<div id="view">`, then `../shared/data.js`, `../shared/prototype.js`,
and an inline script calling `PM.init`.

```js
PM.init({
  active: 'overview',            // navigation entry; omit for none
  title: 'pageTitleKey',
  states: ['normal', 'loading', 'error'], // optional review states
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

## Verification

- Matrix: Manager and Member, English and German, light and dark, 1440px and 360px, plus the changed review states.
- Exercise simulated save failures with "Next save fails".
- The integrated browser tab may be hidden: prefer `page.evaluate` with `requestSubmit()`/`click()` or `force: true` clicks, and disable the cache (`Network.setCacheDisabled`) so edited `file://` scripts reload.
