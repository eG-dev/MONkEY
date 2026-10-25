# Accessibility

Status: Design baseline approved by the user on 2026-10-10; this is not a compliance certification. Carry forward WCAG 2.2 Level AA as the accessibility target
for the POCKET MONkEY browser UI. This is a target, not a claim of conformance.

## Baseline

- Meet at least 4.5:1 contrast for normal text and 3:1 for large text (at least
  18 pt regular or 14 pt bold). Essential control boundaries, graphical information,
  and state indicators need at least 3:1 against adjacent colors where WCAG applies.
- Make all functionality operable with a keyboard, without keyboard traps. Keep
  focus visible, logically ordered, and unobscured by navigation or other overlays.
- Give controls programmatically associated labels and meaningful accessible names.
  Associate validation errors with their fields and announce important status changes
  without unnecessarily interrupting or moving focus.
- Use semantic HTML, headings, and landmarks first. Add ARIA only where necessary;
  assigning a role alone does not implement the required keyboard behavior.
- Provide text alternatives for meaningful images and icons. Hide decorative
  imagery from assistive technology. Do not rely on color alone for meaning.
- Support text resizing to 200% without losing content or functionality. Respect
  reduced-motion preferences and test forced-colors/high-contrast settings.
- Review pointer targets against WCAG 2.2 AA target-size requirements: at least
  24 x 24 CSS pixels or an applicable spacing/other exception. Use 44px touch
  targets on phones.
- Avoid unnecessary time limits; review any session timeout for warnings and
  extension options, subject to applicable security exceptions.

## POCKET MONkEY Interactions

- Distinguish actual tab panels from route navigation. Use the appropriate semantics
  and keyboard pattern rather than giving every tab-shaped link a tab role.
- The hamburger needs an accessible name and expanded state. The temporary drawer
  closes with Escape and returns focus to the hamburger.
- The user menu button names the user and role; the menu supports arrow keys and
  Escape with focus restoration.
- Announce signed amounts unambiguously, including the minus sign and currency.
- Departure guards must be keyboard accessible. Cancelling must preserve entered
  data and return focus appropriately.

## Verification

Combine automated checks with manual keyboard, zoom, contrast, and screen-reader
testing. Include phone, compact, and wide layouts, German and English content,
both roles, and loading, validation, retry, and departure-guard states.
Automated checks alone cannot establish conformance.

## References

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Color scheme](color-scheme.md)
