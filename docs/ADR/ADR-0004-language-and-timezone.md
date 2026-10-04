# ADR-0004 Language and Timezone

_Creation date_: 2026-10-04

## Context

POCKET MONkEY needs German and English user interfaces and an extensible translation
model for community contributions. Users may choose different languages while
sharing financial accounts and one definition of monthly business periods.

## Decision

- Deliver German and English from the first release and allow additional languages through structured catalogs and a central registry, rather than scattered language-specific conditionals.
- Package translations, component language resources, and icons/fonts locally; runtime use must not depend on a translation service or CDN.
- Allow explicit language selection before login and saved personal language preferences after login. Resolve language per SSR request and hydrate with the same language.
- Keep presentation language/formatting separate from currency, stored monetary values, and period boundaries. Store raw UTC timestamps and financial data instead of localized report strings.
- Configure the business timezone through Docker ENV `TZ` using a validated IANA ID. Apply it explicitly to schedules and reports; browser language/timezone must not redefine financial periods.
- Select the translation library, source/fallback language, and precise negotiation rules separately when evaluated. New language support must include completeness checks, formatting, and accessible layout verification.