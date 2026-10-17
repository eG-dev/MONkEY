# ADR-0001 Architecture Decision Records

_Creation date_: 2026-10-04
_Updated_: 2026-10-17

## Context

POCKET MONkEY is an application for managing pocket money, intended for publication
as an open-source project on GitHub. Contributors and coding agents need a shared
record of key architectural decisions without a heavyweight review template.
ADRs explain the product's architecture and rationale; development plans describe
delivery steps, and instructions guide implementation.

## Decision

- Store ADRs as Markdown files under `/docs/ADR`, using stable numbered filenames such as `ADR-0001-architecture-decision-records.md`.
- Require `Context` and `Decision` sections. Explain the problem and relevant constraints in Context, then the What and How in Decision. Keep the record concise and self-contained.
- Do not include Reviewers or Status sections. Creation/update dates and related-document links may be included when useful.
- Include an Alternatives section only when multiple alternatives were actually evaluated. Other sections are optional and should add meaningful information rather than template boilerplate.
- Add fenced `mermaid` diagrams where they clarify architecture, interactions, or implementation approach; diagrams are not mandatory for every ADR.
- Write ADRs from a greenfield product perspective: document enduring requirements, architectural choices, and rationale. Keep delivery sequencing and transition details in development plans, not ADRs.
- Retain ADRs after delivery, independently of temporary plans. Plans may reference ADRs, but ADRs must stand alone and must not link to temporary plans; reference other ADRs or maintained product/operational documentation instead.
- Record agreed decisions in ADRs; keep unresolved proposals in development plans until decided. Do not present unevaluated tooling suggestions as binding architecture.
- GitHub Copilot instructions must require contributors and coding agents to read and follow applicable ADRs before changing code, plans, or instructions.
- When a requested change conflicts with an ADR, identify the conflict and obtain agreement on the decision change before implementing it. Update the decision record alongside the approved change.
- Preserve decision history. For a material replacement, add a new ADR and cross-link the records with a short supersession note rather than silently rewriting the original rationale. No Status section is needed.