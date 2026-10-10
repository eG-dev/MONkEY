# Typography

Status: Draft. Role sizes and weights are defined in
[typography.css](styles/typography.css); fonts are declared in
[fonts.css](styles/fonts.css).

## Font Family

Use **Roboto**, self-hosted and never fetched from a public font service, with
Arial and the generic sans-serif family as fallbacks:

```css
font-family: "Roboto", Arial, sans-serif;
```

| Role | Style |
| --- | --- |
| Display / large figures | Light 300, 40px |
| H1 / H2 | Bold 700, 24px / 18px |
| H3 | Medium 500, 16px |
| Body | Regular 400, 14px/1.5 (16px for large body) |
| Labels, buttons, selected navigation | Medium 500, 13-14px |
| Captions | Regular 400, 12px |
| Amounts | Roboto with tabular figures (`font-variant-numeric: tabular-nums`), colored by sign ([amount colors](color-scheme.md#amounts)) |

No monospaced font is bundled. `--font-mono` uses the system monospace stack and
is only meant for rare technical text; amounts use Roboto's tabular figures.

## Reference Assets

The [Roboto folder](../assets/fonts/Roboto/) contains all 18 static styles,
Thin (100) to Black (900), each upright and italic, as WOFF2. All are declared in
[fonts.css](styles/fonts.css); browsers only download the styles that are used.
The interface roles use these:

| Weight | CSS weight | File |
| --- | --- | --- |
| Light | 300 | [Roboto-Light.woff2](../assets/fonts/Roboto/Roboto-Light.woff2) |
| Regular | 400 | [Roboto-Regular.woff2](../assets/fonts/Roboto/Roboto-Regular.woff2) |
| Medium | 500 | [Roboto-Medium.woff2](../assets/fonts/Roboto/Roboto-Medium.woff2) |
| Bold | 700 | [Roboto-Bold.woff2](../assets/fonts/Roboto/Roboto-Bold.woff2) |

The files were converted from the supplied Roboto 3.015 TrueType files without
changing glyphs or names; the TTF files are not kept.

## License

Roboto is © 2011 The Roboto Project Authors and licensed under the SIL Open Font
License 1.1, as declared in the font metadata. The
[license](../assets/fonts/Roboto/OFL.txt), [authors](../assets/fonts/Roboto/AUTHORS.txt),
and [contributors](../assets/fonts/Roboto/CONTRIBUTORS.txt) notices are copied
from [googlefonts/roboto-classic](https://github.com/googlefonts/roboto-classic).
Ship `OFL.txt` with any distribution that includes the fonts, including the
Angular application. The fonts must not be sold on their own.

## Readability and Localization

- Prefer Regular for text and Medium or Bold for emphasis. Do not use Light for
  small or essential text.
- Do not shrink text to fit a German translation into a fixed-width control;
  allow wrapping instead.
- Keep amounts right-aligned in tables with tabular figures, and keep the sign and
  currency visible at all widths.

See [accessibility](accessibility.md) for resizing and contrast requirements.
