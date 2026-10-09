# Localization foundation

Status: foundation implemented and locally verified. Extend throughout
[UI and business logic](03-ui-business-logic.md); see [ADR-0007](../../docs/ADR/ADR-0007-application-foundation.md)
and the [foundation guide](../../revamp/README.md).

## Requirements

German (`de`) and English (`en`) are first-release languages, not a later UI
polish task. Translation catalogs, locale formatting, and Taiga component language
resources must be packaged locally and work without an external translation service.

- Selected approach: Transloco with its MessageFormat integration, verified with Angular SSR/Taiga. Catalogs under `revamp/web/public/i18n/{de,en}/` are bundled locally through the central registry. Avoid separate container builds per language and a custom translation engine.
- Use stable semantic translation keys and version-controlled JSON catalogs grouped by feature. Do not use German strings as keys or concatenate translated sentence fragments.
- Use English as the selected source catalog and missing-key fallback; this is separate from the German instance default. CI requires complete German and English catalogs rather than relying on that fallback.
- Support interpolation and locale-aware pluralization through the library's supported message-format tooling. Include validation errors, notifications, tooltips, accessibility labels, page titles, empty states, and authentication screens.
- Maintain one language registry mapping language IDs to display names, formatting locales, catalog resources, Taiga language resources, and text direction. Adding a language must not require scattered language-specific conditionals.
- Selected selection order: saved user preference, explicit language-choice cookie, supported `Accept-Language` negotiation, then `MONKEY_DEFAULT_LOCALE`. Anonymous negotiation/switching is implemented; saved authenticated preferences arrive with authentication. Cookie values are registered language IDs.
- Normalize BCP 47 locale tags to registered language/formatting combinations. Validate the ENV default at startup; unsupported request preferences fall back deterministically rather than selecting arbitrary resource paths.
- Persist signed-in users' language choices as personal preferences. Members may change their own language without receiving business-write permissions. A cookie carries the explicit choice for anonymous requests and SSR.
- Resolve language per request before SSR, load the required catalogs and Taiga resources, set document `lang`/`dir`, and hydrate with the same resolved language. Never mutate process-wide culture or a shared translation instance based on one user.
- Register the required Angular locale data and synchronize date/number formatting with the selected language. Language changes must not alter stored amounts, currency, UTC timestamps, or business periods governed by `TZ`.
- API errors expose stable machine-readable codes and structured parameters for UI translation; do not display raw English/German backend exception messages. Keep user-entered names/comments unchanged and store system-generated ledger descriptions as stable codes plus parameters where appropriate.
- Catalog values are text by default. Do not render contributor-provided translation strings as unrestricted HTML.
- Provide deterministic fallback for incomplete future languages and document their completion status. Evaluate RTL layout support before advertising an RTL language; text direction alone is not sufficient.

## Delivery sequence

The anonymous shell and language selector are built in milestone 1. Preference
persistence and translated login screens follow in milestone 2; every milestone 3
slice delivers its German and English translations alongside its functionality.
German/English layout and interaction review is part of
[step 2B product UX and UI design](02b-ux-ui-design.md); it does not postpone feature translations.
OSS contribution documentation is completed in
[operations and cutover](04-operations-cutover.md#open-source-translation-contributions).

## Acceptance gate

- [x] The shell renders in German and English, with matching Taiga resources and hydration language.
- [x] Language negotiation, explicit switching, and unsupported-language fallback work without outbound access.
- [x] Concurrent SSR requests in different languages remain isolated; document language and formatting are correct.
- [x] Catalog checks catch missing/extra keys, incompatible interpolation placeholders, and invalid plural/message syntax.