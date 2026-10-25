# ADR-0001 Architecture Decision Records

_Creation date_: 2026-10-04
_Updated_: 2026-10-18

## Context

POCKET MONkEY is an application for managing pocket money, intended for publication
as an open-source project on GitHub. Contributors and coding agents need a shared
record of key architectural decisions without a heavyweight review template.
Readers need one authoritative current decision per coherent topic, rather than
following a chain of replacement records to discover which rules apply.
ADRs explain the product's architecture and rationale; development plans describe
delivery steps, and instructions guide implementation.

## Decision

- Store ADRs as Markdown files under `/docs/ADR`, using stable numbered filenames such as `ADR-0001-architecture-decision-records.md`.
- Maintain one authoritative ADR per coherent topic. Its Decision section states the current approved position. Keep its number and filename stable when that position changes; create another ADR for a genuinely distinct topic or a justified topic split, not merely a revised decision. Cross-link related topics and keep affected decisions consistent.
- Require `Context` and `Decision` sections. Explain the problem and relevant constraints in Context, then the What and How in Decision. Keep the record concise and self-contained.
- Do not include Reviewers or Status sections. Creation/update dates and related-document links may be included when useful.
- Include an Alternatives section only when multiple alternatives were actually evaluated. Other sections are optional and should add meaningful information rather than template boilerplate.
- Add fenced `mermaid` diagrams where they clarify architecture, interactions, or implementation approach; diagrams are not mandatory for every ADR.
- Write ADRs from a greenfield product perspective: document enduring requirements, architectural choices, and rationale. Keep delivery sequencing and transition details in development plans, not ADRs.
- Retain ADRs after delivery, independently of temporary plans. Plans may reference ADRs, but ADRs must stand alone and must not link to temporary plans; reference other ADRs or maintained product/operational documentation instead.
- Record agreed decisions in ADRs; keep unresolved proposals in development plans until decided. Do not present unevaluated tooling suggestions as binding architecture.
- GitHub Copilot instructions must require contributors and coding agents to read and follow applicable ADRs before changing code, plans, or instructions.
- When a requested change conflicts with an ADR, identify the conflict and obtain agreement on the decision change before implementing it. Update the decision record alongside the approved change.
- Preserve decision history without mandatory supersession records. After explicit approval, update the existing topic's Context and Decision as needed, its update date, and a concise dated Change History entry for significant changes explaining what changed and why. Git preserves the complete earlier text; retain evaluated alternatives where they explain the current choice rather than accumulating a running implementation changelog.
- An ADR reference means the current approved decision. When a historical discussion depends on earlier wording, use a commit-specific reference to that revision rather than treating the current document as an immutable snapshot.

## Change History

- 2026-10-18: Adopted one maintained authoritative ADR per topic, replacing mandatory separate supersession records. This keeps current decisions discoverable while dated rationale and Git retain history; explicit approval of architectural changes remains required.