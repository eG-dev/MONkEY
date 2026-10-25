# POCKET MONkEY Repository Instructions

## Product Name

- The application is named **POCKET MONkEY**, with a lowercase `k`, a pun on managing pocket money. Use that spelling in product-facing text and documentation; do not rename existing technical identifiers or paths merely to match the display name.

## Architecture Decisions

- Read and follow applicable ADRs in `docs/ADR/` before changing code, plans, or instructions. ADRs are the authoritative record of agreed architectural decisions; do not silently depart from them.
- Follow [ADR-0001](../docs/ADR/ADR-0001-architecture-decision-records.md) when creating or updating decision records: concise Markdown, required Context and Decision, no Reviewers or Status, optional Alternatives only when evaluated, and Mermaid diagrams where useful.
- Maintain one authoritative ADR per coherent topic. Update it in place after approval, keeping its number/filename and concise dated change rationale; add a new record for a distinct topic rather than a revised decision. Use commit-specific references for historical wording.
- Write ADRs from a greenfield product perspective. Document enduring architecture and rationale, not revamping history, legacy comparisons for their own sake, or migration sequencing; those details belong in the plans.
- If a request or existing implementation conflicts with an ADR, identify the conflict and obtain agreement on the decision change before implementing it. Record the approved change and preserve history as specified in ADR-0001.
- Add decision records during the relevant migration phase, not speculative ADRs for unresolved proposals. Link affected plans and instructions to the applicable records.
- Use the [ADR index](../docs/ADR/README.md) to identify applicable records: application boundaries, shared access, language/timezone, E2E-first verification, GitHub delivery, and the wireframe/click-prototype design process are already documented.

## Backend Design Review

- Before designing or changing replacement backend models, database schemas, entities, endpoint contracts, or service responsibilities, load the combined [backend/data design skill](skills/backend-data-design/SKILL.md) and follow the [backend review gate](instructions/backend.instructions.md), including when work starts in a plan rather than a backend file.
- Present a revisioned design proposal with class, namespace, and file references, then wait for explicit approval before implementing the reviewed design. Identify applicable ADRs and proposed architectural decisions; record accepted enduring decisions according to ADR-0001, not every implementation detail.

## Repository Layout

- Follow the [migration overview](../plans/migration/README.md) and the applicable milestone/supporting plans. Proposed choices in those plans are not automatically agreed decisions.
- On 2026-10-25 the owner approved removing the legacy application and Azure workflows and promoting the replacement to the repository root. Earlier migration isolation requirements are historical, not current layout requirements.
- Application paths are `web`, `backend`, `tests/e2e`, `tests/integration`, and `deploy`; the solution and shared build configuration live at the root. Use the [development guide](../docs/development.md) for commands.
- Repository cleanup does not authorize deleting deployed Azure resources, rewriting Git history, changing visibility, or publishing releases.

## Replacement Invariants

- The backend owns authorization, business rules, persistence, and jobs; Angular/Web-BFF owns rendering and transport. UI guards are not security enforcement.
- Use a shared instance with Manager and Member roles, not tenancy. Members read all accounts; managers perform business writes. Personal preferences do not grant business-write access. Do not add email or Azure data import.
- Financial writes must be atomic, use exact monetary arithmetic, and be safe under retries/concurrency. Jobs must be idempotent. Do not silently rewrite financial history.
- Keep SSR identity and language request-scoped. Never expose server secrets or privately cache one user's response for another user.
- Deliver German and English with every UI feature and bundle runtime assets locally. Keep language, currency, UTC timestamps, and the business timezone configured by `TZ` separate.

## Verification

- Follow the [E2E-first testing plan](../plans/migration/testing.md). Do not require routine unit tests or a unit-coverage quota for the replacement.
- Run the narrow checks relevant to the touched area and report what actually ran. Record reproducible application commands after scaffolding; do not invent tooling commands or claim unavailable checks passed.
- Keep proposed library choices, deployment details, and unresolved business policies in the plans until evaluated and agreed. Add their ADRs in the responsible phase.