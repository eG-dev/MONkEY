# Design System Contract

Defines what a project's design system must contain for this workflow. The
content (brand, values, guides) belongs to the project; this file defines only
its structure and rules. Start a new design system from the
[starter template](../assets/design-system/). The profile's *Design tokens*
setting records where the project keeps it.

## Required Parts

| Part | Contents |
| --- | --- |
| Tokens | Machine-readable values in token files used directly by prototypes |
| Overview guide | Product character, content rules, visual baseline, links to the other parts |
| Color guide | Brand and semantic roles, intended use, calculated contrast for every text/background and boundary pair, per theme |
| Typography guide | Font families and fallbacks, type roles, font assets and their licences |
| Component notes | Product-specific patterns on top of the UI framework; framework defaults need no entry |
| Accessibility baseline | Target level (for example WCAG 2.2 AA), interaction rules, verification approach |
| Specimens | Offline pages showing tokens and primitives in every theme |

Create the tokens and overview guide when a project starts; add the other parts
when the first view or pattern needs them. Keep fonts and images in one local
assets folder; never load them from a CDN.

## Token Layers

1. **Primitives:** raw brand colors, neutral scales, font sizes, spacing and
   radii. Only semantic tokens reference them.
2. **Semantic aliases:** roles such as text, surface, border, action, status and
   focus. Components and prototypes use only this layer.
3. **Component tokens:** optional, for values a single pattern needs, such as a
   column width or control height.

- Every supported theme overrides only semantic aliases; primitives stay the same.
- Give every semantic color a value in every theme, including foregrounds on
  colored fills.
- Name tokens by role (`--action-primary`), never by appearance (`--maroon`).
- Use one spacing scale, one radius scale and one set of type roles.

## Rules

- Components and prototypes never use literal colors or sizes; add a token instead.
- Document calculated contrast for every new color pair in every theme before
  approval: 4.5:1 for normal text, 3:1 for large text and essential boundaries.
- Never convey meaning by color alone; pair status with text or an icon.
- Keep visible focus and accessible names; focus colors must contrast with every
  surface they appear on.
- When the application maps the tokens into its own styles, keep names and
  values synchronized in the same change.
- A design-system change is a design change: update the guides and specimens,
  then follow the approval gates before implementation.

## Change Checklist

- Token values for every theme, semantic layer only for theme differences.
- Contrast documented for new or changed pairs.
- Affected guide, component notes and specimens updated.
- Prototypes using the changed tokens rechecked in every theme.
- Application synchronization noted or performed after approval.
