---
description: "Use when creating or changing wireframes, click prototypes, design-system tokens, specimens, or design references under docs/design."
applyTo: "docs/design/**"
---

# Design References

- Read and follow [ADR-0013](../../docs/ADR/ADR-0013-wireframes-and-click-prototypes.md) for the design decisions and approval policy. Choose a wireframe by review value; do not advance past an unapproved artifact or export draft wireframes.
- Load the [ui-ux-design skill](../skills/ui-ux-design/SKILL.md) before design work. It owns the detailed workflow, annotation syntax, drawing conventions, export procedure and verification checklist; do not duplicate them here.
- Use the skill's [POCKET MONkEY profile](../skills/ui-ux-design/references/pocket-monkey.md) for local paths, languages, roles, viewports and runtime helpers. Keep those bindings there rather than treating them as universal workflow requirements.
- Preserve user-edited sources and placement; make targeted changes instead of regenerating artifacts.
- Track each view's review state only in the [approval register](../../docs/design/approvals.md), updated in the same commit as the change or approval; do not number revisions or keep approval logs. Keep the [design index](../../docs/design/README.md) to artifact links and scope, and artifact READMEs to the current design and verification evidence.
- Put prototype-only controls and sample context in the shared review panel, never in the reviewed layout.
- Design references do not override authoritative business, security or accessibility requirements. Report unresolved policy questions and blocked checks rather than inventing rules or claiming approval.
