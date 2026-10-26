# Translation Contributions

POCKET MONkEY ships German and English together. Contributions are maintained in
the application repository, reviewed through pull requests and bundled with the
application. No external translation service or runtime CDN is required.

For toolchain setup and local startup, follow
[Development and Testing](Development-and-Testing.md) or
[Codespaces Development](Codespaces-Development.md). Run the commands below from
the repository root after restoring the locked dependencies.

## Find the Maintained Text

- [English catalogs](../../web/public/i18n/en/shell.json) are the source and
  missing-key fallback.
- [German catalogs](../../web/public/i18n/de/shell.json) must be complete too;
  fallback is not a substitute for delivering a translation.
- The [language registry](../../web/src/app/i18n/languages.ts) maps each supported
  ID to its display name, formatting locale, text direction, bundled catalog and
  Taiga UI language resources.

Current application messages live in each language's `shell.json`, grouped by
feature. Keep the same nested keys and file structure across languages. Edit the
maintained JSON, not generated assets, build output or the published Wiki.

## Change or Add Messages

Use stable semantic keys rather than English or German sentences as identifiers.
For a new message, add the same key in every supported language in the same pull
request. Cover page titles, validation, notifications, tooltips, accessible names,
empty states and authentication screens as well as visible headings and buttons.

Translate whole messages rather than concatenating fragments. Preserve the names
and roles of interpolation arguments: `{name}`, `{amount}` and `{month}` are
contracts with the caller, not words to translate. Do not hard-code currency
symbols or assemble a formatted amount from translated pieces.

Plural messages use ICU MessageFormat, for example:

```json
{
  "count": "{count, plural, one {One item} other {# items}}"
}
```

Use the target language's plural rules and keep an `other` branch. Preserve
argument names, argument types, select keys and plural offsets used by the
source; run the checker after changing ICU syntax. Do not replace a plural
expression with a fixed singular/plural sentence or translate its syntax tokens.

Catalog messages are text, not unrestricted HTML. Do not add scripts, event
handlers or markup rendering to accommodate a translation. Keep user-entered
names and comments unchanged. Translate stable API error codes and their
structured parameters in the UI, not raw backend exception messages.

The root project license and upstream notice originals are not translation
catalogs. Preserve those original documents; changes to explanatory legal text
need their own review.

## Validate a Translation

```sh
npm --prefix web run check:catalogs
npm --prefix web run build
```

The [catalog checker](../../web/scripts/check-catalogs.mjs) compares each language
directory with English. It rejects mismatched files or flattened keys, empty
messages, invalid ICU syntax and incompatible argument signatures. A successful
check does not prove that wording is accurate, that every message is used, or
that it fits the interface.

Start the application and review the affected workflow in both German and
English. Check narrow mobile and desktop layouts, light and dark themes,
long names and amounts, error/empty/loading states, accessible labels and plural
forms with representative counts. Text must remain readable without overlapping
or hiding actions. Use synthetic data and include useful screenshots in the pull
request without exposing credentials or financial information.

For SSR-sensitive changes, check a fresh page load as well as language switching:
document language, initial text, component resources and hydrated content must
agree. Different users' simultaneous requests must not share language state.
Use the real-image checks described in
[Development and Testing](Development-and-Testing.md#test-the-actual-image) when
the change affects loading, formatting, selection or persistence, not just words.

## Propose Another Language

Discuss the intended language ID, formatting locale, translation ownership and
verification scope before presenting a new language as supported. Copy the
complete English catalog structure into a new language directory, translate all
messages and retain complete German and English delivery.

The frontend starting points are the
[registry](../../web/src/app/i18n/languages.ts) and
[application configuration](../../web/src/app/app.config.ts): import the local
catalog, register the required Angular locale data, and supply matching local
Taiga resources, a native display name and text direction. Selectors and the
bundled loader use the registry; do not scatter language-specific branches
through components.

A registry entry alone is **not** complete language support. The backend
[preference endpoint](../../backend/PocketMonkey.Host/Endpoints/AuthenticationEndpoints.cs)
currently accepts only `de` and `en`, while
[instance configuration](../../backend/PocketMonkey.Host/Configuration/InstanceSettings.cs)
accepts only `de-DE` and `en-US`. Coordinate those validation contracts, SSR
negotiation, session/preference handling, configuration documentation and tests
with the maintainer. Do not advertise saved preferences or an instance default
that the backend rejects. Follow the repository's backend review process for
any required contract changes; this guide does not approve such changes.

Verify anonymous negotiation, explicit switching, saved preferences after
sign-in, reload/hydration, fallback and request isolation. For an RTL language,
review navigation, controls, icons and layout; setting `dir` alone is not RTL
acceptance. All catalogs and component resources must work without outbound
network access.

## Keep Presentation Separate

English uses `en-US` formatting and German uses `de-DE`; catalog IDs remain `en`
and `de`. English fallback is separate from the instance's German default.
Language does not change currency, exact stored money, UTC timestamps or business
month boundaries configured by `TZ`.

See [Users and Access](Users-and-Access.md#personal-preferences) for personal
settings, [Configuration](Configuration.md) for instance defaults, and the
[language and timezone decision](../ADR/ADR-0004-language-and-timezone.md) for the
architectural contract. In your pull request, describe the wording or support
change, checks actually run, layout review and any remaining limitations.