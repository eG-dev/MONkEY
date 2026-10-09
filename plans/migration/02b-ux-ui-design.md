# Step 2B: product UX and UI design

Status: not started; this is the next activity. Remaining milestone 3 feature
work is paused until this step's acceptance gate passes. Authentication remains
locally implemented as [step 2A](02-authentication-authorization.md); existing
3A-3C implementation and verification records remain intact.

## Goal

Establish deliberately designed workflows, navigation, visual foundations, and
representative UI patterns before further business features. Existing screens
are functional implementations, not an accepted final design. A toolkit and
passing E2E tests are not visual or usability approval.

## Delivery model

Agree design references first, then establish the approved shell and reusable
patterns on existing screens. Do not continue later milestone 3 features in
parallel or accumulate backend-only additions during the pause. Use existing
authentication, accounts, and transactions as realistic design material without
discarding their business rules or delivery history.

Not every future screen must be designed upfront. After this gate passes,
remaining [business slices](03-ui-business-logic.md) reuse established patterns
and explicitly review new ones. Final application-wide design acceptance remains
a release prerequisite.

Keep Angular SSR, Taiga UI, local Lucide assets, and backend-owned business and
security rules under [ADR-0002](../../docs/ADR/ADR-0002-application-boundaries.md).
No framework replacement or business-policy change is implied by a wireframe.

## References and foundations

- Store editable draw.io sources and synchronized PNG previews under [docs/design](../../docs/design/README.md), with roles, viewports, states, revision-specific approval, and open questions indexed there.
- Start with the app shell without specific view content, then separate references for accounts overview, account management, account details including transactions, settings, user administration, and login.
- Treat the accounts overview as the application home/landing view, not a separate marketing page. Forms, dialogs, and error states can be named pages in the owning view's source.
- Agree the household/group audience, Manager/Member workflows, navigation, page hierarchy, back behavior, primary actions, and recovery paths. Separate everyday account use from administration.
- Approve visual direction, typography, color roles, spacing, density, content widths, responsive breakpoints, borders/elevation, and interaction/focus states as reusable foundations.
- Define Taiga/Lucide patterns for account items, exact balances, ledger rows, forms, pagination, notifications, and confirmations. Keep identity recognizable without a decorative dashboard.
- Cover German/English, mobile/desktop, signed-out/forced-password states, both roles, empty/loading/submitting/success/error/retry states, long text, uninitialized accounts, overdrafts, and signed monetary limits.
- Wireframes establish structure and interaction intent, not automatically visual styling, accessibility compliance, or business rules. Record visual foundations and interaction notes alongside them.
- Use fictional data. Monthly reports and dedicated reversals remain deferred; future allowance/image/legal details require their separately agreed business policies.

## Approval and implementation sequence

1. Agree audience, workflows, navigation, and information hierarchy using the existing functional application.
2. Review the app shell independently, then representative desktop/mobile view wireframes and role differences.
3. Review a realistic transaction flow including validation/retry and Member access. Explicitly approve the references, visual direction, and reusable patterns before broad implementation.
4. Implement the approved shared shell, tokens, and representative patterns on existing screens in the real Angular application. Keep resources colocated and business/security decisions on the backend.
5. Verify and approve the implemented representative design before resuming remaining milestone 3 features.

## Verification

- Preserve authorization, CSRF, session isolation, exact arithmetic, persistence, and idempotent retries through [real-stack verification](testing.md) under [ADR-0005](../../docs/ADR/ADR-0005-e2e-first-verification.md).
- Review screenshots and actual interactions at agreed phone/tablet/desktop widths, including 320px, long German labels, and the full signed monetary range without truncation, scientific notation, overlap, or horizontal page overflow.
- Verify keyboard navigation, visible focus, accessible names/headings, contrast, touch targets, responsive navigation, both roles/languages, SSR/hydration, and local asset loading.
- Preserve request-scoped identity/language and locally bundled runtime assets. Language never changes money, currency, UTC timestamps, business periods, or user-entered text.
- Record explicit human design approval separately from behavioral E2E results; screenshot capture alone is not approval.

## Acceptance gate

- [ ] Audience, workflows, navigation, and information hierarchy are agreed.
- [ ] App shell and representative desktop/mobile view wireframes and interaction flows are indexed and explicitly approved.
- [ ] Visual foundations and reusable component/state patterns are explicitly approved, not inferred from wireframes alone.
- [ ] Approved shell, tokens, and representative patterns are established on existing screens in the real application.
- [ ] Both roles/languages, monetary limits, long content, important states, accessibility, responsive layout, and SSR/hydration checks pass on those screens.
- [ ] Relevant real-stack financial/security regressions pass after the representative redesign.
- [ ] The implemented representative design is accepted; no unresolved design foundation blocks subsequent features.

Next: resume [incremental UI and business logic](03-ui-business-logic.md).