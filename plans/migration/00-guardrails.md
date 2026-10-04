# Implementation guardrails

Status: pre-scaffolding guardrails implemented and validated on 2026-10-04.
Application enforcement and tooling refinement continue during [stack foundation](01-stack-foundation.md) and later features.

## Goal

Define repository instructions before scaffolding the replacement. Plans describe
what to deliver and in which order; instructions describe how to implement and
validate it. Keep instructions concise and reference the migration plans instead
of copying their contents.

## Repository-wide instructions

- Create or extend `.github/copilot-instructions.md` with architectural ownership, incremental migration rules, security expectations, and required validation.
- Use the application name **POCKET MONkEY**, preserving the lowercase `k`, in product-facing text and documentation.
- Keep the current Azure application independently runnable; apply replacement-only requirements to the replacement, not retroactively to legacy projects.
- Record the agreed scope: no tenancy, email, or Azure data import; shared read access for members and backend-enforced manager business writes.
- Keep business rules, authorization, persistence, and jobs in .NET; keep rendering and browser transport in Angular/Web-BFF.
- Require atomic financial writes, exact money handling, idempotent jobs, request-scoped SSR state, and safe handling of credentials/private data.
- Require German and English translations with each feature, locally packaged assets, and separation of language from `TZ`, currency, and stored data.
- Distinguish confirmed requirements from proposed tooling choices; do not turn an unvalidated library or deployment assumption into a permanent rule.
- Require key architectural decisions to be recorded in ADRs during the migration, starting with this Step 0 and continuing through every phase.

## Architecture decision records

Follow [ADR-0001: Architecture Decision Records](../../docs/ADR/ADR-0001-architecture-decision-records.md),
which establishes the convention before migration execution. Store records as
Markdown files under `/docs/ADR`.

- Create an index and the initial project decision records during Step 0, then extend the records throughout subsequent phases. Timing belongs in the plans, not in the ADRs themselves.
- Use stable numbered filenames such as `ADR-0002-short-decision-title.md`.
- Require Context and Decision: the problem/constraints and the What/How. Do not include Reviewers or Status sections; include Alternatives only when multiple alternatives were evaluated.
- Write records as greenfield product architecture: enduring requirements, choices, and rationale. Keep revamping context, old/new code separation, and rollout steps in migration plans.
- Keep unresolved storage, identity, library, or deployment proposals in the plans until evaluated and agreed in the relevant phase.
- Require GitHub instructions to enforce reading and following applicable ADRs; resolve conflicts explicitly before implementing a decision change.
- Link relevant records from affected plans/instructions and preserve decision history according to ADR-0001.
- Use fenced `mermaid` blocks where useful and verify GitHub rendering when diagrams are added.
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

## Confirmed replacement paths

The user confirmed `revamp/` as the independent replacement root. No application
directories/projects are scaffolded in this phase; scope checks use representative
future paths. Backend project subdivisions and the solution filename are decided
during foundation work.

| Area | Planned paths | Instructions |
| --- | --- | --- |
| Angular/Web-BFF | `revamp/web/**` | [Web](../../.github/instructions/revamp-web.instructions.md) |
| .NET backend | `revamp/backend/**` | [Backend](../../.github/instructions/revamp-backend.instructions.md) |
| E2E/integration tests | `revamp/tests/e2e/**`, `revamp/tests/integration/**` | [Tests](../../.github/instructions/revamp-tests.instructions.md) |
| Docker and new CI | `revamp/deploy/**`, `.github/workflows/revamp-*.yml`, `.github/workflows/revamp-*.yaml` | [Deployment](../../.github/instructions/revamp-deployment.instructions.md) |
| Translation catalogs | `revamp/web/public/i18n/**/*.json` | [Translations](../../.github/instructions/revamp-translations.instructions.md) |

Translation JSON intentionally also receives web instructions. If the validated
translation library needs another catalog location, update the path and scope
together. Do not broaden the patterns to legacy WebApp or Data projects.

## Initial decision records

The [ADR index](../../docs/ADR/README.md) lists the initial greenfield records for
application boundaries, shared access, language/timezone, E2E-first verification,
and GitHub delivery. Concrete storage/authentication/translation libraries, image
registry, runtime versions, process supervision, financial precision/policies,
and retention remain decisions for the responsible phases.

## Foundation handoff

- Root `Directory.Packages.props` is inherited by nested .NET projects. Isolate replacement package configuration deliberately before adding backend projects; do not change legacy versions implicitly.
- Root `.editorconfig` disables primary constructors for C# and does not set `root = true`. Respect that preference and inspect any ancestor rules when setting up formatting.
- There is no repository `global.json` or `Directory.Build.props/targets`. Pin a supported replacement toolchain during scaffolding rather than assuming an SDK is selected already.
- Both Azure workflows currently deploy on default-branch changes outside their single ignored application folder. Replacement-only changes would trigger both deployments. Address those filters explicitly in milestone 1 before pushing replacement work to the default branch; Step 0 does not modify them.
- Application build/test/container commands do not exist yet. Record and validate them during the foundation spike; document checks in this phase are not application verification.

## Verification record

Run from the repository root with Node.js and npm available. The parser packages
are temporary validation tooling, not replacement application dependencies.

```powershell
npm install --prefix "$env:TEMP\pocket-monkey-guardrail-tools" --no-save --package-lock=false yaml@2 minimatch@9 mermaid@11 jsdom@26
node .\plans\migration\verify-guardrails.mjs
```

The [validator](verify-guardrails.mjs) parses YAML metadata, exercises intended
and legacy path fixtures, checks local Markdown links/anchors, verifies required
ADR headings/greenfield wording, and parses Mermaid syntax. Instruction-content
consistency was also reviewed against the confirmed scope and ADR-0001; automated
syntax checks do not prove that instructions are followed by an agent.

Editor diagnostics reported no errors in the affected instructions, ADRs, or plans.
No replacement build, E2E/integration suite, container, or CI checks were run:
those projects do not exist yet. Mermaid syntax is checked locally; the diagram
still needs a GitHub rendering preview when the documents are published.

## Acceptance gate

- [x] Initial repository-wide instructions are reviewed before scaffolding.
- [x] GitHub instructions require reading and following applicable ADRs, including the format defined in ADR-0001.
- [x] The ADR index and initial project decision records are created under `/docs/ADR` during Step 0, following the concise greenfield format with Mermaid diagrams where useful.
- [x] Replacement paths are confirmed and scoped instructions match representative files without unintentionally targeting legacy projects.
- [x] Instructions reference existing plans, have valid metadata, and contain no contradictory or duplicated requirements.
- [x] Concrete validation commands are recorded as tooling becomes available; unavailable checks are identified rather than claimed as passed.
- [ ] Critical invariants are backed by tests/CI as their features arrive; instructions alone are not enforcement.
- [ ] Tooling-specific rules are refined after the foundation spike confirms compatibility.

The final two items are ongoing delivery gates, not claims that Step 0 has
implemented runtime enforcement or chosen the application toolchain.