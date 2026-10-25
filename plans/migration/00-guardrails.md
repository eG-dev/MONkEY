# Implementation Guardrails

Status: implemented. Migration-only automation is retired; maintain the repository
instructions, ADRs and focused safety checks as the application evolves. Remaining delivery work is in the
[finish-line plan](README.md), not a new scaffolding phase.

## Architecture Decision Records

Follow [ADR-0001](../../docs/ADR/ADR-0001-architecture-decision-records.md)
and the [ADR index](../../docs/ADR/README.md). ADRs own enduring architecture and
approved rationale; instructions own implementation rules; plans own remaining
delivery work. Git retains historical proposals and delivery narratives.

- Read applicable ADRs before changes; resolve conflicts through explicit approval.
- Maintain one authoritative record per topic, with Context and Decision, stable number/filename, and concise dated rationale for approved changes.
- Keep unresolved proposals out of binding instructions; obtain the required backend/data or UI design approval before implementing affected behavior.
- Preserve authorization, exact/atomic money, retry-safe jobs, request-scoped SSR identity/language, local runtime assets and German/English completeness.

## Repository Instructions

The repository-wide [instructions](../../.github/copilot-instructions.md) and
scoped rules are implemented. Use **POCKET MONkEY**, with a lowercase `k`, in
product-facing text. Keep business rules/persistence/jobs in .NET and rendering/
browser transport in Angular/Web-BFF. Do not reintroduce tenancy, email or Azure
data import, or treat UI guards as authorization.

| Area | Current Paths | Instructions |
| --- | --- | --- |
| Angular/Web-BFF | `web/**` | [Web](../../.github/instructions/web.instructions.md) |
| Backend | `backend/**` | [Backend](../../.github/instructions/backend.instructions.md) |
| E2E/integration | `tests/e2e/**`, `tests/integration/**` | [Tests](../../.github/instructions/tests.instructions.md) |
| Docker/CI | `deploy/**`, `.github/workflows/**` | [Deployment](../../.github/instructions/deployment.instructions.md) |
| Catalogs | `web/public/i18n/**/*.json` | [Translations](../../.github/instructions/translations.instructions.md) |

## Runtime Handoff

The application lives at the root, with `PocketMonkey.slnx`, shared .NET build
inputs and locked SDK/tooling configuration. Legacy source and Azure workflows
are removed. Repository cleanup does not authorize cloud-resource retirement,
history rewriting or data disposal. Commands are maintained in the
[development guide](../../docs/development.md).

## Verification

```text
npm --prefix tests/e2e ci --ignore-scripts
node scripts/verify-workflows.mjs
node scripts/verify-migrations.mjs
node scripts/check-docs.mjs
```

Workflow checks retain read-only verification, protected same-artifact publishing
and smoke/full selection. The EF check covers namespaces, designer pairs and one
snapshot; the build owns placement. Documentation links, Mermaid syntax and basic
instruction metadata run only for Markdown/tooling changes or file deletions in CI, or unconditionally with
the local command above. Legacy-layout/routing fixtures, arbitrary metadata lengths
and ADR vocabulary bans are removed. These checks complement real-image tests;
they do not establish agent compliance or prove publishing enforcement on GitHub.

## Acceptance Gate

- [x] Repository/scoped instructions and current application paths are established.
- [x] ADR lifecycle, required approvals and architecture boundaries are enforced by instructions and structural checks.
- [x] Financial, authentication, SSR and lifecycle invariants have local real-stack regression coverage.
- [x] Reproducible commands and meaningful narrow validation are documented.
- [ ] Current hosted release, fork and real-host acceptance passes the [finish-line gates](README.md).