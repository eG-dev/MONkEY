# ADR-0013 Wireframes and Click Prototypes

_Creation date_: 2026-10-10
_Updated_: 2026-10-30

## Context

User interfaces need deliberately designed views before features are implemented.
Contributors and coding agents need a shared way to
agree on structure and behavior that is quick to change, reviewable without the
running application, and does not tie every view to the current application shell.

Static images alone hide behavior such as validation, dialogs, roles, languages,
and phone layouts; a fully specified wireframe for every state becomes hard to
maintain. The workflow must respect authoritative business rules, permissions,
accessibility and localization requirements without depending on a particular
product domain or frontend framework.

## Decision

Design work for a view follows two steps: a rough wireframe, then a detailed
click prototype. Review and explicitly approve each current artifact before
advancing to its dependent artifact or application implementation. This record
owns those decisions and their rationale. The [UI/UX skill](../../.github/skills/ui-ux-design/SKILL.md)
owns the detailed procedure, annotation syntax, drawing/export conventions and
repository bindings; the [design instructions](../../.github/instructions/design.instructions.md)
provide concise constraints and routing. The [design index](../design/README.md)
owns artifact status, approval history and review evidence. Do not maintain
parallel copies of those details here.

See the skill's [workflow overview](../../.github/skills/ui-ux-design/SKILL.md#workflow-overview)
for the design sequence and review checkpoints.

### Wireframes

- Use one editable draw.io source with one main desktop viewport per substantially different view layout, keeping the shared shell separate. This avoids multiplying drawings for every state or shell change.
- Keep wireframes rough: structure, hierarchy and key behavior, not visual polish or exhaustive specifications. Concise external notes connect to the relevant components and add only behavior or constraints the drawing cannot convey. Detailed interactions belong in the prototype; enduring business/security rules remain in authoritative decisions.
- Review the editable source, not a stale image. PNG previews represent approved sources only, never drafts. Preserve user edits and annotation arrangement so revisions do not overwrite reviewed work. The skill defines [drawing and review procedures](../../.github/skills/ui-ux-design/SKILL.md#drawing-and-review), including note arrangement, review markers and post-approval cleanup/export.

### Click prototypes

- Build an offline click prototype per view from its approved wireframe, using shared shell, components, formatting, design tokens and fictional data. Local assets and file-system operation allow review without a running application or internet access.
- Demonstrate the detailed interactions and relevant permission, localization, theme and responsive states that static drawings hide. Prototypes illustrate behavior; they are not production code, enforce no security and establish no production API contracts.

### Integrated prototype entry

- Maintain a full-application review entry composed from the standalone views and shared shell, not a specimen gallery or copied markup. Actual navigation must preserve preferences, role and fictional data without duplicate chrome.
- Require standalone and integrated verification: standalone success cannot expose every shell-context or navigation defect. The skill defines the [verification procedure](../../.github/skills/ui-ux-design/SKILL.md#5-verify), evidence recording and local coverage matrix; composition wiring belongs in the prototype documentation, not production routing contracts.

### Changes and approval

- New or changed references are drafts until explicit user approval identifies the artifact and reviewed revision. Require approval of the current wireframe source and completion of its approved PNG preview before its prototype; require approval of the current prototype before application implementation. Both named current artifacts may be approved together.
- Feedback, requested corrections, annotation-placement readiness, business-policy acceptance, general instructions to proceed and successful checks are not approval. Earlier approvals remain history and do not approve changed artifacts.
- Change structure or key behavior needed to review the wireframe there first and then in the prototype; change other interaction details in the prototype only.
- Approved references guide implementation but do not override architectural decisions, authorization or domain constraints, and do not create business rules on their own. Approval recording and correction handling follow the skill's [approval procedure](../../.github/skills/ui-ux-design/SKILL.md#explicit-approval-gates) and [completion checklist](../../.github/skills/ui-ux-design/SKILL.md#6-finish).
- Implement approved views using the shared design-system tokens and the project's verification requirements.

Repository bindings are maintained once in the skill's
[repository integration](../../.github/skills/ui-ux-design/SKILL.md#repository-integration-pocket-monkey).
Implementation verification follows [ADR-0005](ADR-0005-e2e-first-verification.md).

## Change History

- 2026-10-30: Consolidated annotation handling, verification/evidence steps, approval administration, the workflow diagram and local bindings in the skill, leaving this ADR responsible for decisions/rationale and instructions for concise constraints/routing. This reduces drift without changing design or approval requirements.
- 2026-10-30: Defined adjacent scope attributes as a combined condition and separated reusable design/review principles from repository-specific bindings, so the workflow can be adopted in other domains and frameworks.
- 2026-10-30: Clarified singular role headers and separate sections for differing role behavior, so each detail's audience is clear.
- 2026-10-30: Made scope headers bold and separated them from preceding note text with a blank line, improving annotation scanability.
- 2026-10-30: Moved PNG export until after source approval and review-marker cleanup, avoiding repeated exports while the editable wireframe is still changing.
- 2026-10-30: Clarified that wireframe notes capture only behavior needed to review the view, use a bracketed first-line scope header when details are conditional, and leave detailed interactions and enduring rules to their authoritative records, to keep wireframes readable.
- 2026-10-30: Excluded notes that merely repeat visible wireframe content, including revision changes, while retaining necessary details not conveyed by the drawing.
- 2026-10-23: Added a global application composition and standalone-then-integrated
    verification, following the requested prototype review pattern. This exposes
    navigation, dialog and shell-context problems that isolated views cannot show;
    standalone references and explicit design approval gates remain unchanged.
- 2026-10-21: Adopted temporary visual review markers and automatic post-approval cleanup/export instead of revision labels in annotation prose; user layout and approval gates remain unchanged.
- 2026-10-10: Adopted external component-directed notes and user-arranged annotation layout instead of in-viewport callouts and automatic layout optimization.
