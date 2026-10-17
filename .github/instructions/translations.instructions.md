---
description: "Use when adding replacement translation catalogs: German/English completeness, stable keys, placeholders, pluralization, language registration, and safe community contributions."
applyTo: "revamp/web/public/i18n/**/*.json"
---
# Translation Catalogs

- Follow [language and timezone](../../docs/ADR/ADR-0004-language-and-timezone.md) and the [localization plan](../../plans/migration/localization.md). German and English must cover all shipped UI.
- The selected catalog root is `revamp/web/public/i18n/`, with feature catalogs beneath each language directory, bundled through the language registry. Keep the paths, loader, and this scope synchronized if the layout changes.
- Use stable semantic keys, not source-language sentences. Do not concatenate translated sentence fragments or translate user-entered names/comments.
- Preserve ICU `{parameter}` names, formatter types, and supported plural/message syntax. Run `npm --prefix web run check:catalogs` from `revamp/` to validate key/placeholder consistency and compiler syntax; use the supported MessageFormat integration, not a custom parser/engine.
- Treat catalog values as text, not unrestricted HTML. Include validation messages, page titles, tooltips, and accessibility labels, and coordinate Taiga language resources.
- Add languages through the central registry and documented contributor workflow; document incomplete-language fallback and verify text direction/layout before advertising RTL support.
- Do not change currency, persisted amounts, timestamps, or business periods through translation changes. Preview affected UI and rerun relevant language E2E scenarios.
- English source/fallback and Transloco/MessageFormat are selected in [ADR-0007](../../docs/ADR/ADR-0007-application-foundation.md). German is the instance default; presentation language never selects financial currency or business periods.