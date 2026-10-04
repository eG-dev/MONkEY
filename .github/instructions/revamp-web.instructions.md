---
description: "Use when implementing the replacement Angular SSR frontend and Web-BFF: Taiga UI, Lucide assets, accessibility, request isolation, and backend transport."
applyTo: "revamp/web/**"
---
# Angular and Web-BFF

- Follow [application boundaries](../../docs/ADR/ADR-0002-application-boundaries.md) and the [foundation plan](../../plans/migration/01-stack-foundation.md). Keep business rules, authorization decisions, persistence, and jobs in the backend.
- Use Taiga UI consistently and locally packaged Lucide icon fonts/assets; do not depend on a runtime CDN. Use accessible labels/tooltips for icon controls and verify keyboard/mobile behavior.
- Keep identity, language, and other SSR state request-scoped. Do not store user state in singletons, prerender private pages, or shared-cache private responses.
- Forward sessions and CSRF data according to the verified backend contract. Never trust client identity/role headers, expose backend secrets in hydration data, or store authentication tokens in browser local storage.
- Use documented API contracts and stable error codes; UI guards and hidden controls supplement, not replace, backend authorization.
- Ship loading, empty, validation, and actionable failure states with each workflow. Browser-only APIs and image controls must not execute during SSR.
- Follow the [localization plan](../../plans/migration/localization.md): German/English text, accessibility labels, Taiga resources, and formatting are part of each feature. Library selection remains subject to the foundation spike.
- Verify affected workflows through the real-stack [E2E strategy](../../plans/migration/testing.md), including SSR/hydration and relevant language/viewport combinations. Record actual commands once available; no application runner exists yet.