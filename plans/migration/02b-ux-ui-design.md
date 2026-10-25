# Step 2B: product UX and UI design

Status: design approved and accepted by the user on 2026-10-10, including the
current wireframes, click prototypes, visual foundations, subsequent refinements,
and implemented representative screens in `web`. The design pause is
lifted; proceed to [step 3D account images](03d-account-images.md), resolving its
separate policy prerequisites before implementation. Authentication and existing
3A-3C implementation and verification records remain intact.

Approval is human design acceptance, not new test evidence. The initial redesign
record reports 57/57 E2E cases passing; a subsequent full recheck had 56 passes
and one restart-request connection reset, whose isolated rerun passed. Later UI
refinements received builds and focused checks, not another full E2E run.
Outstanding technical verification remains explicit below and in future slice
and release gates; it must not be represented as completed by this approval.

## Goal

Establish deliberately designed workflows, navigation, visual foundations, and
representative UI patterns before further business features. Existing screens
now use the accepted representative design. A toolkit and
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
- Follow [ADR-0013](../../docs/ADR/ADR-0013-wireframes-and-click-prototypes.md): rough view-only wireframes first, then detailed offline click prototypes on a shared shell.
- Start with the app shell without specific view content, then separate references for accounts overview, account management, account details including transactions, settings, user administration, and login.
- Treat the accounts overview as the application home/landing view, not a separate marketing page. Forms, dialogs, and error states can be named pages in the owning view's source.
- Agree the household/group audience, Manager/Member workflows, navigation, page hierarchy, back behavior, primary actions, and recovery paths. Separate everyday account use from administration.
- Approve visual direction, typography, color roles, spacing, density, content widths, responsive breakpoints, borders/elevation, and interaction/focus states as reusable foundations.
- Define Taiga/Lucide patterns for account items, exact balances, ledger rows, forms, pagination, notifications, and confirmations. Keep identity recognizable without a decorative dashboard.
- Cover German/English, mobile/desktop, signed-out/forced-password states, both roles, empty/loading/submitting/success/error/retry states, long text, uninitialized accounts, overdrafts, and signed monetary limits.
- Wireframes establish structure and interaction intent, not automatically visual styling, accessibility compliance, or business rules. Record visual foundations and interaction notes alongside them.
- Use fictional data. Monthly reports are excluded from the product scope. Dedicated reversals remain deferred; future allowance/image/legal details require their separately agreed business policies.

## Approval and implementation sequence

1. Agree audience, workflows, navigation, and information hierarchy using the existing functional application.
2. Review the app shell independently, then representative desktop/mobile view wireframes and role differences.
3. Review a realistic transaction flow including validation/retry and Member access. Explicitly approve the references, visual direction, and reusable patterns before broad implementation.
4. Implement the approved shared shell, tokens, and representative patterns on existing screens in the real Angular application. Keep resources colocated and business/security decisions on the backend.
5. Verify and approve the implemented representative design before resuming remaining milestone 3 features.

## Verification

Post-approval cleanup on 2026-10-10 removes the temporary foundation/system login
panel, demo API contracts, sample-state entity and startup sample creation. A
forward migration drops only the demo table; operational health endpoints and
private storage checks remain. Historical migration files are preserved. Existing
`images/foundation.txt` files are inert and are not automatically deleted from
operator storage. Smoke checks now use real accounts and readiness, not public
demo data. This cleanup does not reopen the approved visual foundations.

Cleanup verification on 2026-10-10: frontend/backend builds and the production
Docker image build passed. The focused Playwright run passed all nine selected
desktop/mobile shell and account/key restart-and-replacement checks with retries
disabled. The Release `identity-upgrade` integration probe passed, including
preservation of an existing account and removal of the old sample table.
Catalog validation, E2E TypeScript checking and repository guardrails also passed.
This is focused cleanup verification, not a new full-suite acceptance run.

- Preserve authorization, CSRF, session isolation, exact arithmetic, persistence, and idempotent retries through [real-stack verification](testing.md) under [ADR-0005](../../docs/ADR/ADR-0005-e2e-first-verification.md).
- Review screenshots and actual interactions at agreed phone/tablet/desktop widths, including 320px, long German labels, and the full signed monetary range without truncation, scientific notation, overlap, or horizontal page overflow.
- Verify keyboard navigation, visible focus, accessible names/headings, contrast, touch targets, responsive navigation, both roles/languages, SSR/hydration, and local asset loading.
- Preserve request-scoped identity/language and locally bundled runtime assets. Language never changes money, currency, UTC timestamps, business periods, or user-entered text.
- Record explicit human design approval separately from behavioral E2E results; screenshot capture alone is not approval.

## Acceptance gate

- [x] Audience, workflows, navigation, and information hierarchy are agreed.
- [x] App shell and representative desktop/mobile view wireframes and interaction flows are indexed and explicitly approved.
- [x] Visual foundations and reusable component/state patterns are explicitly approved by the user on 2026-10-10.
- [x] Approved shell, tokens, and representative patterns are established on existing screens in the real application.
- [ ] Both roles/languages, monetary limits, long content, important states, accessibility, responsive layout, and SSR/hydration checks pass on those screens.
- [x] Relevant real-stack financial/security regressions pass after the representative redesign.
- [x] The implemented representative design is accepted by the user on 2026-10-10; no unresolved design foundation blocks subsequent features.

Next: resume [incremental UI and business logic](03-ui-business-logic.md).