---
description: "Use when implementing the replacement Angular SSR frontend and Web-BFF: Taiga UI, Lucide assets, accessibility, request isolation, and backend transport."
applyTo: "revamp/web/**"
---
# Angular and Web-BFF

- Follow the [Angular and TypeScript style rules](revamp-typescript.instructions.md) for logical spacing, braces, control flow, and readable formatting.
- Follow [application boundaries](../../docs/ADR/ADR-0002-application-boundaries.md) and the [foundation plan](../../plans/migration/01-stack-foundation.md). Keep business rules, authorization decisions, persistence, and jobs in the backend.
- Follow the evaluated [foundation stack](../../docs/ADR/ADR-0007-application-foundation.md): Angular 22/Node 24, Taiga 5, Transloco/MessageFormat, and server-only `provideUniversal()` providers. Patch versions and commands live in the [foundation guide](../../revamp/README.md).
- Use Taiga UI consistently and locally packaged Lucide icon fonts/assets; do not depend on a runtime CDN. Use accessible labels/tooltips for icon controls and verify keyboard/mobile behavior.
- Author application/component/global styles in Sass using SCSS syntax. Keep Taiga's vendor Less theme import as Less; new Angular component and inline-style defaults must use SCSS.
- Keep identity, language, and other SSR state request-scoped. Do not store user state in singletons, prerender private pages, or shared-cache private responses.
- Forward sessions and CSRF data according to the verified backend contract. Never trust client identity/role headers, expose backend secrets in hydration data, or store authentication tokens in browser local storage.
- Use documented API contracts and stable error codes; UI guards and hidden controls supplement, not replace, backend authorization.
- Ship loading, empty, validation, and actionable failure states with each workflow. Browser-only APIs and image controls must not execute during SSR.
- Give unique controls, forms, messages, and dialogs document-unique `<scope>-<purpose>` IDs per [ADR-0005](../../docs/ADR/ADR-0005-e2e-first-verification.md#browser-selectors); every `app-modal-dialog` needs a `dialogId`. Use item-scoped `data-testid` values in repeated rows/cards. Keep controls disabled until hydration (and, for shell controls reset by `NavigationEnd`, initial navigation) completes.
- Follow the [localization plan](../../plans/migration/localization.md): German/English text, accessibility labels, Taiga resources, and formatting are part of each feature. The registry owns language/catalog/Taiga mappings; do not duplicate language conditionals across components.
- Verify affected workflows through the real-image [E2E strategy](../../plans/migration/testing.md), including SSR/hydration and relevant language/viewport combinations. Run the documented build/catalog/E2E commands; a successful compile alone does not verify hydration or request isolation.