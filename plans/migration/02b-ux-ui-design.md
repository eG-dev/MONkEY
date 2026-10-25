# Step 2B: Product UX and UI Design

Status: representative wireframes, click prototypes, visual direction and
implemented patterns are accepted. Subsequent shipped features use those patterns.
No design pause remains; application-wide final acceptance is still a release gate.

## References and Design System

Use the [design index](../../docs/design/README.md) and
[ADR-0013](../../docs/ADR/ADR-0013-wireframes-and-click-prototypes.md).
Editable draw.io views/previews, offline click prototypes and shared design tokens
are the maintained references, not a new parallel design exercise.

- Review rough view-only wireframes, then detailed shared-shell prototypes before implementing new UI behavior.
- Reuse approved Taiga/local Lucide patterns, typography, color roles, spacing, density, forms, dialogs, tables and feedback.
- Keep backend business/security rules and existing feature acceptance intact; design approval does not change financial policy.
- Use fictional data and actual Manager/Member workflows. No marketing landing page, monthly reports or silently added reversal feature.
- Verify long names, signed money limits, uninitialized/negative accounts, both languages/themes and loading/empty/error/retry states.

## Verification

- Review actual interactions/screenshots across phone/tablet/desktop, including 320px and long German text, without overlap, truncation or page overflow.
- Check keyboard navigation, focus restoration, accessible names/headings, contrast, touch targets and responsive navigation.
- Preserve authorization/CSRF, SSR identity/language isolation, exact amounts, retries and locally bundled runtime assets through [real-stack tests](testing.md).
- Separate visual/localization acceptance from behavioral E2E results. A screenshot or passing compiler is not human design acceptance.

## Acceptance Gate

- [x] Audience, navigation, representative references and reusable visual/component patterns are accepted.
- [x] Approved shell/tokens/patterns are implemented and subsequent feature slices use them.
- [x] Temporary demo surfaces are removed; real accounts/readiness drive runtime tests.
- [x] Representative financial/security regressions have local coverage.
- [ ] Complete application-wide review of all shipped screens, roles, languages, important states and accessibility before production acceptance.

The remaining review belongs to [operations](04-operations-cutover.md#release-gate),
not a repeat of the accepted representative redesign.