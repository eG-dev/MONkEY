# Typography

Status: Approved by the user on 2026-10-10. Role sizes and weights are defined in
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

## Currency Formatting R1

This presentation revision was explicitly approved on 2026-10-24 for the shared
click prototype and Angular implementation. Hide the fractional part only for zero
cents; otherwise retain exactly two fractional digits. Examples below omit
unchanged signs and currency labels for clarity.

| Exact value | German display | English display |
| --- | --- | --- |
| `0.00` | `0` | `0` |
| `10.00` | `10` | `10` |
| `10.10` | `10,10` | `10.10` |
| `10.01` | `10,01` | `10.01` |
| `1250.00` | `1.250` | `1,250` |

Apply the same rule to EUR and USD, positive and negative amounts, balances,
allowances, history, confirmations and monetary feedback. Preserve locale
grouping, the currency suffix and signed/color semantics. This changes display
only: exact minor-unit arithmetic, canonical API values and editable input
strings retain their existing precision and behavior.

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

- Match these pixel-based role sizes in the Angular application. Do not convert
  them to `rem` assuming a 16px root: Taiga uses a 14px root, which would shrink
  body text and headings. Keep Taiga button text sizing independent of these
  content roles; changing content typography must not resize buttons or spacing.
- Prefer Regular for text and Medium or Bold for emphasis. Do not use Light for
  small or essential text.
- Do not shrink text to fit a German translation into a fixed-width control;
  allow wrapping instead.
- Keep amounts right-aligned in tables with tabular figures, and keep the sign and
  currency visible at all widths.

See [accessibility](accessibility.md) for resizing and contrast requirements.
