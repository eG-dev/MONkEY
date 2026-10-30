# Project Profile Contract

A project profile binds the reusable workflow to one repository. Keep it short,
factual and maintained with the project. Store it in this skill's `references/`
folder (for example `references/<project>.md`) or in project documentation linked
from the project's agent instructions.

## Precedence

1. Authoritative project decisions (ADRs, policies, security and business rules).
2. The project profile.
3. Defaults in the skill and its references.

## Required Settings

| Setting | Purpose | When missing |
| --- | --- | --- |
| Design index | Where artifact links, status, approvals and evidence are recorded | Propose a location; create it during setup |
| Decision records | Authoritative design, approval and domain rules | Use the skill's default approval rules |
| Wireframe sources | Path pattern for draw.io sources and approved previews | Propose `docs/design/wireframes/<view>/<view>-wireframe.drawio` |
| draw.io executable | Local desktop app path used for export | Detect the default install path; ask |
| Desktop viewport | Width of the main-content viewport | Ask; propose 1440px |
| Product languages | Languages prototypes and the application must provide | Detect from the application; ask |
| Permissions | Roles or permission levels whose behavior differs | Detect from decisions; ask; never invent |
| States and themes | Review states and supported themes | Detect; propose loading, empty, error and success |
| Breakpoints | Phone/desktop verification widths | Ask; propose 360px and the desktop width |
| Design tokens | Token location and documentation for contrast/patterns | Detect; create only when the design system is in scope |
| Prototype runtime | Prototype location, shared runtime, integrated entry and helpers | Detect; create a minimal offline runtime during setup |
| Implementation | Application stack, conventions and verification requirements | Detect; ask before implementation |

Detect settings from the repository first. Ask for business-relevant values such
as roles, languages and approval rules; never invent them. Record agreed values
in the profile so later requests do not repeat the questions.

## Scope Vocabulary

List the annotation attributes the project uses, their allowed values and their
order in compound headers. Default order: `role`, `state`, `device` or `viewport`.

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
- Wireframes: <path pattern>; preview: <path pattern>
- draw.io executable: <path>
- Desktop viewport: <width>
- Product languages: <languages>
- Permissions: <roles and differences>
- States/themes: <list>
- Breakpoints: <widths>
- Tokens: <path>; contrast/pattern docs: <paths>
- Prototypes: <view path>; shared runtime: <path>; integrated entry: <path>
- Implementation: <stack>; verification: <requirements>
- Scope vocabulary: <attributes, values and order>
- Style overrides: <deviations from drawio-conventions.md>
```
