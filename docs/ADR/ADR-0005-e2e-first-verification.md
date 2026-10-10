# ADR-0005 E2E-First Verification

_Creation date_: 2026-10-04
_Updated_: 2026-10-10

## Context

POCKET MONkEY correctness depends on the interaction of UI, SSR, authentication,
business rules, and persistence. Isolated mock-heavy tests do not provide enough
confidence in the actual user workflows, while some database and scheduling
failures require more deterministic checks than a browser can conveniently express.
Repeating the same workflows for every language duplicates E2E coverage;
translation correctness needs dedicated localization checks instead.
Browser selectors must remain stable across languages and visual changes without
concealing accessibility regressions or relying on component-library internals.

## Decision

- Make real-application browser E2E tests the primary acceptance and regression suite, adding meaningful scenarios with each feature.
- Organize E2E specs in category folders, with multiple focused files separating browser workflows, API rules, persistence, and recovery where appropriate. Share reusable helpers outside the specs rather than growing one long file per category.
- Run through actual frontend, backend, authentication, and persistence rather than mocking core services. Include persisted outcomes, permissions, errors, and responsive workflows.
- Run application E2E workflows in English. Do not duplicate scenarios for German or other languages, or add per-language E2E projects. The sole non-English exception is one focused desktop browser check that an explicit German selection initializes the first SSR render and hydration correctly; it does not repeat application workflows.
- Use EUR for core E2E workflows. Verify the USD setting separately without repeating business workflows, following [ADR-0011](ADR-0011-currency-display-unit.md).
- Verify German and other languages outside the E2E suite through Transloco tooling and catalog validation for missing keys, placeholders, pluralization, and fallback behavior. Use focused localization checks and design/browser review for formatting, language selection and persistence, SSR/hydration language consistency, accessible translated names, and longer-text layouts; catalog checks alone do not prove these behaviors.
- Use targeted integration tests for transaction rollback/concurrency, constraints, migrations, retries, and controlled time/failure cases where they provide stronger evidence.
- Unit tests are optional exceptions and may be absent entirely. Do not require unit-coverage quotas or duplicate E2E scenarios with routine mock/unit suites.
- Isolate fixtures and session state, use deterministic clocks where necessary, and keep test controls out of production HTTP interfaces.
- Preserve actionable failure diagnostics and repair flaky behavior rather than hiding it. Verify the production artifact used for release.
- Choose the concrete E2E/integration runners and runnable commands when the toolchain is established.

### Browser selectors

- Prefer stable HTML `id` selectors wherever the target is genuinely unique.
	IDs must be unique across the entire rendered document, including the shell,
	active view, and open dialogs; view-local uniqueness alone is insufficient.
- Use lowercase kebab-case with an ownership prefix: `<scope>-<purpose>`.
	Examples: `shell-navigation-toggle`, `login-username`, `login-submit`,
	`account-details-image-dialog`, `account-details-image-upload`,
	`account-details-image-save`, and `profile-password-submit`.
- Name IDs by enduring purpose, not translated text, styling, position, or
	implementation details. Preserve label and ARIA references when changing IDs.
- Use stable `data-testid` values for repeated rows, cards, or controls, scoped
	to the relevant item. Do not manufacture HTML IDs from display names or row
	indexes. Reusable components must not hard-code IDs that can be duplicated.
- Use role/label locators when no suitable stable ID exists. Avoid selectors
	coupled to CSS layout, DOM ancestry, or component-library implementation.
- Keep explicit assertions for accessible roles/names and English text even
when interactions use IDs. Stable selectors do not replace accessibility or
the separate localization checks.
- IDs do not establish hydration readiness. Wait for enabled interactive
	controls and completed navigation before filling or submitting forms.