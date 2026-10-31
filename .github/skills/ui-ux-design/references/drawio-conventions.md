# draw.io Wireframe Conventions

draw.io is the workflow's wireframe tool. These conventions apply to every wireframe;
a project profile may override only the house-style values, not the structural
and review rules. Start new sources from [the wireframe template](../assets/wireframe-template.drawio).

## Drawing

- House style (overridable): Helvetica for all text, including notes, controls, labels and connector labels; set `fontFamily=Helvetica` explicitly on every text-bearing cell rather than relying on draw.io's default; panels and controls as plain boxes; primary actions green-filled; placeholders dashed.
- Icon placeholders use square brackets and are not literal labels. They are separate from annotation scope headers and need no explanatory note:
  - `[delete]` alone is an icon-only button; the bracketed word names its purpose and accessible name.
  - `[icon] Overview` in menus, navigation or similar is a labelled item with an icon. Choosing the icon does not block wireframe review or approval; define it in the prototype.
- Text placeholders use curly braces, such as `Version {build version}` or `{Reviewed privacy information}`, for variable or yet-to-be-written content. Do not use square brackets for text.
- Keep the XML readable. In user-edited sources, change only the affected cells.

## Viewport

- One rectangle at the agreed desktop width, black 3px border with draw.io's "Dashed (1)" preset: `fillColor=none;strokeColor=#000000;strokeWidth=3;dashed=1`, no custom `dashPattern`.
- Make it the first drawable cell in the XML root so all content and notes stay in front of it.
- Expand the page around the viewport for notes; do not enlarge the viewport to fit them.

## Notes and Connectors

- Notes use `shape=note` (not callouts), placed entirely outside the viewport with space between them.
- Default note width: 500 px; set the height to fit the text without overflow.
- Normal note: `fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#000000`.
- One note and one arrow per annotated area; the arrow points from note to component.
- Connectors: `edgeStyle=none;curved=0;strokeWidth=3;strokeColor=#000000;endArrow=classic`, no intermediate waypoints; route through empty space.
- Snap each connector's start to the fixed connection point (the blue `x`) at the center of the note edge facing its target, so draw.io keeps it attached when the note moves or resizes. The source stores `source="<note id>"` with `exitX=1;exitY=0.5`, `exitX=0;exitY=0.5`, `exitX=0.5;exitY=0` or `exitX=0.5;exitY=1` and `exitDx=0;exitDy=0` (`exitPerimeter=0` may accompany it). Never use offsets, a floating `sourcePoint` or a start at a corner. Glue the end to the annotated element (`target`), pointing at the relevant spot.
- Note text uses `html=1`. Within a note, put general details first, then each scope group once.
- Scope headers are bold (`<b>…</b>`) and on their own line, followed by a single line break (`<br>`) before their details.
- Separate a header from preceding text with an empty line (`<br><br>`); never put an empty line before the note's first line.
- Example value: `General detail.<br><br><b>[role: manager][state: retired]</b><br>Scoped detail.`

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

Export only the cleaned, approved source with the draw.io desktop app, using the
executable path from the project profile:

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
- 500 px note width (unless a profile overrides it) and arrows glued to a note edge center and their target;
- in each note, general details first and each scope group once, with bold headers and the required line breaks;
- square brackets only for icon placeholders; text placeholders in curly braces;
- English-only text and concise notes that do not restate the drawing or explain icon placeholders.

Report any check that cannot be performed.
