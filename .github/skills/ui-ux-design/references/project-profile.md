# Project Profile Contract

A project profile binds the reusable workflow to one repository. Keep it short,
factual and maintained with the project. Store it in this skill's `references/`
folder as `references/<project>.md`, and
link it from the project's agent instructions so it is found reliably.

Use exactly one canonical profile inside the skill; do not duplicate it in
project documentation. Keep design artifacts and the design index in their
project locations and link to them from the profile. The explicit link from
`AGENTS.md`, `.github/copilot-instructions.md` (or equivalent agent instructions)
takes priority over directory discovery. This file defines the contract; it is
not the project's filled-in profile. See the skill's [repository integration guide](../SKILL.md#repository-integration).

## Shared and Project Files

| File | Ownership |
| --- | --- |
| `SKILL.md`, `references/project-profile.md`, `references/drawio-conventions.md`, `references/design-system.md`, `assets/` | Shared: copy unchanged between projects; never add project details |
| `references/<project>.md` | Project-owned profile inside the skill; never copy to another project |

When adopting the skill elsewhere, copy only the shared files, then create the
new project's profile in that project's own workspace.

## Precedence

1. Authoritative project decisions (ADRs, policies, security and business rules).
2. The project profile.
3. Defaults in the skill and its references.

## Required Settings

| Setting | Purpose | When missing |
| --- | --- | --- |
| Design index | Where artifact links, status, approvals and evidence are recorded | Propose a location; create it during setup |
| Decision records | Authoritative design, approval and domain rules | Use the skill's default approval rules |
| Design baseline | Links to the design guide, component/pattern notes, and prototype/application entry points for finding nearby implementations | Detect existing equivalents; explicitly record absent resources |
| Wireframe sources | Path pattern for draw.io sources and approved previews | Propose `docs/design/wireframes/<view>/<view>-wireframe.drawio` |
| draw.io executable | Local desktop app path used for export | Detect the default install path; ask |
| Desktop viewport | Width of the main-content viewport | Ask; propose 1440px |
| Product languages | Languages prototypes and the application must provide | Detect from the application; ask |
| Permissions | Roles or permission levels whose behavior differs | Detect from decisions; ask; never invent |
| States and themes | Review states and supported themes | Detect; propose loading, empty, error and success |
| Breakpoints | Phone/desktop verification widths | Ask; propose 360px and the desktop width |
| Design tokens | Location of the design system (tokens, guides, specimens) per the [design-system contract](design-system.md) | Detect; otherwise start from the shared design-system starter when the design system is in scope |
| Prototype runtime | Prototype location, shared runtime, integrated entry and helpers | Detect; create a minimal offline runtime during setup |
| Shared helpers | Inventory of reusable UI behavior, styles and utilities, with scope and concrete source/usage links | Inspect the relevant runtime and nearby consumers; record none found rather than inventing helpers |
| Implementation | Application stack, conventions and verification requirements | Detect; ask before implementation |

Detect settings from the repository first. Ask for business-relevant values such
as roles, languages and approval rules; never invent them. Record agreed values
in the profile so later requests do not repeat the questions.

## Optional Business Context

Link existing domain stories, journey maps, process narratives or workshop
notes that can inform wireframes and prototypes. Record their location and
ownership/review conventions; cite the relevant source and activities when used,
without assuming one story maps to one screen. These are contextual inputs,
not replacements for authoritative requirements and decisions. Missing sources
are not a setup failure: record "none" and proceed without creating them or
introducing a workshop or approval prerequisite.

## Shared Helper Inventory

Identify existing reuse points by purpose, not by prescribed framework or file
name. For each, record whether it belongs to prototypes, the application or
both; link its implementation, associated styles where separate, and usage
documentation or a representative consumer. Examples include dialogs, shell
integration, localization, formatting and form controls, only where they exist.
Do not treat prototype helpers as production components by default.

Keep the inventory focused on shared entry points, not every component. During
setup and affected design work, verify the relevant links and update missing or
stale entries before introducing a parallel helper.

## Scope Vocabulary

List the annotation attributes the project uses, their allowed values and their
order in compound headers. Default order: `role`, `state`, `device` or `viewport`.
The vocabulary is extensible: when a wireframe needs another dimension, such as
direction, language or theme, add the attribute, its values and its position in
the order here, then reuse it consistently. Business values (roles, domain states)
come from requirements, never from the annotation vocabulary.

```text
role: <role values>
state: <state values>
device: phone | tablet | desktop
```

## Design Index Fields

For every wireframe and prototype, record:

- artifact name and link;
- current revision and status (`draft`, `in review`, `approved`);
- approval date and the user's explicit wording, once given;
- verification evidence links or summaries;
- open questions and pending work, such as cleanup or blocked checks.

Keep earlier approvals as history; never move them to a changed revision.

## Profile Template

```markdown
# <Project> Design Profile

- Design index: <path>
- Decision records: <paths or "none">
- Design baseline: <guide>; component/pattern notes: <paths>; nearby implementations: <prototype/application roots or examples; note absences>
- Business context (optional): <domain stories, journeys or workshop notes; ownership/review conventions; or "none">
- Wireframes: <path pattern>; preview: <path pattern>
- draw.io executable: <path>
- Desktop viewport: <width>
- Product languages: <languages>
- Permissions: <roles and differences>
- States/themes: <list>
- Breakpoints: <widths>
- Tokens: <path>; contrast/pattern docs: <paths>
- Prototypes: <view path>; shared runtime: <path>; integrated entry: <path>
- Shared helpers: <purpose; prototype/application/both; source and style links; usage docs or consumer, repeated per helper; or "none found">
- Implementation: <stack>; verification: <requirements>
- Scope vocabulary: <attributes, values and order>
- Style overrides: <deviations from drawio-conventions.md>
```
