---
name: backend-data-design
description: "Combined backend, database, and API design review for POCKET MONkEY's replacement backend. Use when designing or changing models, DB schemas, entities, relationships, constraints, indexes, migrations, endpoint routes/contracts, DTOs, authorization visibility, or service responsibilities; also use for backend design proposals and related ADR decisions before implementation."
---

# Backend and Data Design Workflow

Follow the [backend instructions](../../instructions/revamp-backend.instructions.md#design-review-gate).
This is one combined review workflow, not separate database and API approvals.
It applies to the replacement backend, not the legacy Azure application.

## 1. Understand the Change

1. Read the [ADR index](../../../docs/ADR/README.md), applicable records, the [migration overview](../../../plans/migration/README.md), and the affected phase plan.
2. Inspect the owning entity, context mapping, application service, endpoint/contract, and nearest real-stack check as needed for the requested scope. Keep exploration local; do not inventory the entire backend.
3. Identify the requested behavior, current invariants, and unresolved policies. Do not invent financial, retention, authorization, or scheduling policies. Identify conflicts with existing ADRs explicitly.

## 2. Write the Review Proposal

Add a concise draft section to the applicable plan, with a stable proposal title and
revision identifier. Reuse the existing plan; create a supporting plan only when
there is no suitable home. Include the following where relevant, marking items
unaffected or not applicable rather than expanding the scope to fill a template:

| Review Area | Expected Summary |
| --- | --- |
| Purpose and invariants | Intended behavior, boundaries, business rules, and what remains unchanged |
| Types and responsibilities | Existing/new/changed/deleted class or interface names, full namespaces, file links or proposed paths, and each responsibility |
| Data model | Fields and nullability, relationships/cardinality, keys, constraints, indexes, deletion/retention behavior, exact money, timestamps, and immutable history |
| Persistence | Atomicity, idempotency, concurrency, migration strategy, impact on populated data, upgrade checks, and recovery/rollback limitations |
| API contracts | Methods/routes, request/response DTOs, validation, status/error codes, authentication, Manager/Member access and field visibility, and affected callers |
| Execution boundaries | Application services versus HostedServices, durable state, retries and failure behavior when jobs are affected |
| Architecture | Applicable ADR links, conflicts, evaluated alternatives, and proposed new/amended ADRs with their rationale |
| Verification | Focused E2E and real-persistence checks covering relevant roles, constraints, upgrades, concurrency, and failures |

Use clickable links for files that exist. Label proposed paths/types as proposed;
do not create placeholder production classes to make proposal links work. Use a
small Mermaid relationship or sequence diagram only when it clarifies the design.
Keep the review readable without requiring the user to infer behavior from code.

## 3. Review and Approval

1. Present the anticipated concept and link the draft proposal, highlighting decisions needing agreement and any ADR implications.
2. Stop before production-code changes, contract/schema changes, or migration generation. Read-only investigation and proposal edits may continue during review.
3. Treat requested corrections as changes to the draft. Revise the proposal identifier and return it for review; do not repeatedly solicit approval while the user is still providing feedback.
4. Only explicit approval identifying the current backend/data proposal permits its implementation. Record the user's approval, date, revision, and scope in the plan. Preserve earlier approvals as history; approval of UI artifacts or an isolated business policy does not approve this backend proposal.
5. Reopen review when implementation would materially depart from the approved design. Routine formatting, test-only work, and behavior-preserving repairs within it do not need a new design gate.

## 4. Record Accepted Architecture

Follow [ADR-0001](../../../docs/ADR/ADR-0001-architecture-decision-records.md).
Not every entity, endpoint, or migration needs an ADR: record enduring architectural
choices and rationale, not a class inventory or delivery steps. Keep unresolved
decisions in the plan until agreed. After approval, add or update relevant ADRs
before dependent implementation, update the [ADR index](../../../docs/ADR/README.md),
and link affected plans/instructions. Preserve materially replaced decisions with
a new ADR and cross-linked supersession notes. Do not add Status or Reviewers.

## 5. Implement and Verify

Implement only the approved scope, using existing code conventions and the
backend's migration-location rules. Run the narrow executable check for the first
changed slice before expanding the implementation, then the agreed real-stack
acceptance checks. Update the plan with actual results and outstanding gates;
passing checks are verification, not retrospective design approval.