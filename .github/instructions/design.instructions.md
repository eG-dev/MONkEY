---
description: "Use when creating or changing wireframes, click prototypes, design-system tokens, specimens, or design references under docs/design."
applyTo: "docs/design/**"
---
# Design References

- Follow [ADR-0013](../../docs/ADR/ADR-0013-wireframes-and-click-prototypes.md): rough wireframe first, then a detailed click prototype, then the Angular implementation. Use the [ui-ux-design skill](../skills/ui-ux-design/SKILL.md) for the step-by-step workflow.
- Keep the [design index](../../docs/design/README.md) current: every wireframe and prototype is linked with its status. A change to an approved reference makes it a draft again until it is re-approved.
- Wireframes: one `<view>/<view>-wireframe.drawio` with one desktop page showing only the main content container (no shell). Describe important behavior, states, roles, dialogs, and phone layout in yellow callouts. Re-export the PNG after every change.
- Do not regenerate or overwrite a `.drawio` source the user has edited by hand; edit it in place and keep their changes.
- Click prototypes: one `prototypes/<view>/index.html` built on `prototypes/shared/` (`prototype.js`, `prototype.css`, `data.js`). Views render only their main content; shell changes go into the shared files.
- Every prototype string exists in English and German. Use `PM.t`, `PM.money`, and `PM.date`; never hard-code amounts, currency, or dates.
- Use design-system tokens from `design-system/styles/` instead of color or size literals. New tokens need light and dark values, documented contrast, and a matching entry in the design-system guides.
- Amounts: positive green, negative red, zero standard text, always with a sign. Pair status with an icon and text; keep visible focus and accessible names.
- Use fictional data only. Keep assets local; no CDNs, fonts, or icons from the internet.
- Verify changed prototypes in a browser: both roles, both languages, light and dark mode, 360px phone width, and the relevant loading/error/validation states. Report what was actually checked.
