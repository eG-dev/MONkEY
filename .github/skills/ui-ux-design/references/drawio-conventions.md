# draw.io Wireframe Conventions

Defaults for draw.io wireframes. A project profile may override house-style
values; keep the structural and review rules unless a project decision changes them.
Start new sources from [the wireframe template](../assets/wireframe-template.drawio).

## Drawing

- House style (overridable): Calibri; panels and controls as plain boxes; primary actions green-filled; placeholders dashed.
- Icon placeholders use square brackets and are not literal labels. They are separate from annotation scope headers and need no explanatory note:
  - `[delete]` alone is an icon-only button; the bracketed word names its purpose and accessible name.
  - `[icon] Overview` in menus, navigation or similar is a labelled item with an icon. Choosing the icon does not block wireframe review or approval; define it in the prototype.
- Keep the XML readable. In user-edited sources, change only the affected cells.

## Viewport

- One rectangle at the agreed desktop width, black 3px border with draw.io's "Dashed (1)" preset: `fillColor=none;strokeColor=#000000;strokeWidth=3;dashed=1`, no custom `dashPattern`.
- Make it the first drawable cell in the XML root so all content and notes stay in front of it.
- Expand the page around the viewport for notes; do not enlarge the viewport to fit them.

## Notes and Connectors

- Notes use `shape=note` (not callouts), placed entirely outside the viewport with space between them.
- Normal note: `fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#000000`.
- One note and one arrow per annotated area; the arrow points from note to component.
- Connectors: `edgeStyle=none;curved=0;strokeWidth=3;strokeColor=#000000;endArrow=classic`, no intermediate waypoints; route through empty space.
- Scope headers are bold (`<b>…</b>`) and on their own line; separate them from preceding text with an empty line (`<br><br>`).

## Review Markers

- Mark new or changed notes visually instead of adding revision labels to their text.
- Changed note: `fillColor=#dae8fc;strokeColor=#6c8ebf`; optionally blue text or connector `#0078D4`.
- Mark only changed notes; preserve the user's positions and routing.
- Keep revision and approval history in the design index.

## Cleanup After Approval

If the user has not already reset them:

1. Restore normal note colors, black text (`fontColor=#000000`) and black connectors.
2. Remove temporary inline text-color overrides.
3. Remove obsolete revision or draft prefixes without changing meaning.
4. Preserve all other user edits. Cleanup is housekeeping, not a new revision or approval gate.

## Export

Export only the cleaned, approved source:

```text
<drawio-executable> -x -f png -b 10 -o <view>-wireframe.png <view>-wireframe.drawio
```

`-p <n>` selects a 1-based page. View the exported image and confirm it shows the
viewport, the external notes and the cleaned styles.

## Source Checks

Before presenting a draft, check:

- well-formed XML, unique cell IDs and valid connector sources/targets;
- viewport first, dashed and at the agreed width;
- notes entirely outside the viewport, without overlapping controls or other notes;
- one arrow per annotated area and readable text;
- English-only text and concise notes that do not restate the drawing or explain icon placeholders.

Report any check that cannot be performed.
