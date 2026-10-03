# Implementation guardrails

Status: not started. Complete Step 0 before scaffolding [stack foundation](01-stack-foundation.md).

## Goal

Define repository instructions before scaffolding the replacement. Plans describe
what to deliver and in which order; instructions describe how to implement and
validate it. Keep instructions concise and reference the migration plans instead
of copying their contents.

## Repository-wide instructions

- Create or extend `.github/copilot-instructions.md` with architectural ownership, incremental migration rules, security expectations, and required validation.
- Keep the current Azure application independently runnable; apply replacement-only requirements to the replacement, not retroactively to legacy projects.
- Record the agreed scope: no tenancy, email, or Azure data import; shared read access for members and backend-enforced manager business writes.
- Keep business rules, authorization, persistence, and jobs in .NET; keep rendering and browser transport in Angular/Web-BFF.
- Require atomic financial writes, exact money handling, idempotent jobs, request-scoped SSR state, and safe handling of credentials/private data.
- Require German and English translations with each feature, locally packaged assets, and separation of language from `TZ`, currency, and stored data.
- Distinguish confirmed requirements from proposed tooling choices; do not turn an unvalidated library or deployment assumption into a permanent rule.
- Require key architectural decisions to be recorded in ADRs during the migration, starting with this Step 0 and continuing through every phase.

## Architecture decision records

Create the initial ADRs while executing this guardrail phase, not while editing
the migration plans. Store them as Markdown files under `/docs/ADR` and add Mermaid
diagrams where they clarify architecture, interactions, or decision consequences.

- Establish the ADR convention and an index during Step 0, then document the initial key decisions agreed at that point.
- Use stable numbered filenames such as `0001-short-decision-title.md`.
- Include status, date, context, decision, alternatives considered, consequences, and links to related plans/ADRs. Clearly distinguish Proposed from Accepted decisions.
- Initial records capture agreed scope and architectural boundaries; unresolved storage, identity, library, or deployment choices remain Proposed until evaluated and agreed in the relevant phase.
- Each subsequent phase adds records for new key decisions and updates proposal status when decisions are resolved. Link the relevant ADRs from the affected plans and instructions.
- Preserve accepted decision history. When a decision changes materially, create a replacement ADR and mark/link the earlier record as Superseded rather than silently rewriting its rationale.
- Use fenced `mermaid` blocks when useful, not a mandatory diagram for every decision. Verify diagrams render in GitHub Markdown when the records are created.
- Keep plans focused on delivery and instructions on implementation rules; ADRs own the decision rationale and tradeoffs.

## Path-scoped instructions

Create focused `.github/instructions/*.instructions.md` files after confirming
the replacement workspace paths, using explicit `applyTo` patterns and meaningful
descriptions. Cover these areas without duplicating repository-wide rules:

- Angular/Web-BFF: Taiga UI, Lucide assets, accessibility, SSR/hydration, API transport, localization, and private-cache behavior.
- .NET/backend: domain/application boundaries, API contracts, server-side authorization, monetary arithmetic, SQLite migrations, and transaction consistency.
- Tests: extensive browser E2E coverage, targeted integration tests, deterministic clocks, concurrency/retry cases, and commands required for the touched area. Do not mandate unit tests or unit-coverage targets; any exceptional unit tests need a clear benefit over the main strategy.
- Deployment: Docker lifecycle, persistent storage, validated ENV configuration, non-root execution, secrets, and backup/restore expectations.
- Translation catalogs: stable keys, placeholders/plurals, language registration, completeness checks, and contributor-facing validation.

Use the [configuration](configuration.md), [localization](localization.md), and
[testing](testing.md) plans as the detailed sources for those instructions.

## Acceptance gate

- [ ] Initial repository-wide instructions are reviewed before scaffolding.
- [ ] The ADR convention, index, and initial decision records are created under `/docs/ADR` during Step 0, with explicit statuses and Mermaid diagrams where useful.
- [ ] Replacement paths are confirmed and scoped instructions match representative files without unintentionally targeting legacy projects.
- [ ] Instructions reference existing plans, have valid metadata, and contain no contradictory or duplicated requirements.
- [ ] Concrete validation commands are recorded as tooling becomes available; unavailable checks are identified rather than claimed as passed.
- [ ] Critical invariants are backed by tests/CI as their features arrive; instructions alone are not enforcement.
- [ ] Tooling-specific rules are refined after the foundation spike confirms compatibility.