# Milestone 3: incremental UI and business logic

Status: the user accepted the [step 2B representative design](02b-ux-ui-design.md) on 2026-10-10; the design pause is lifted. Step 3D account images is locally implemented and verified on 2026-10-10. Steps 3E allowance configuration and 3F execution are locally implemented and verified on 2026-10-12; see the [final allowance acceptance evidence](03f-allowance-execution.md#delivery-evidence).
Steps 3A, 3B, and the approved 3C scope remain locally implemented and verified on 2026-10-08;
step 3H has not started. Dedicated correction/reversal workflows are deferred.
Depends on [step 2A authentication](02-authentication-authorization.md) and [step 2B product design](02b-ux-ui-design.md).

Monthly reports are excluded from the product scope.

## Delivery model

Deliver each slice through backend rules, persistence, API contracts, and Angular
UI together. Each slice must be usable and tested before starting the next.
Managers can administer the instance; members can read every account.

Functional slice acceptance does not approve the final visual design. Complete
[step 2B](02b-ux-ui-design.md), including approved references and established
representative UI patterns, before resuming. Adapt existing screens as part of
that work; preserve their business rules and recorded delivery history. Remaining
slices follow the approved patterns and review newly introduced ones explicitly.
Application-wide design acceptance remains a distinct gate before release.

Use Taiga UI consistently and locally packaged Lucide icon fonts/assets. Give
icon-only controls accessible names and tooltips. Validate keyboard operation,
responsive layouts, loading/empty/error states, and SSR/hydration behavior.
Image cropping and other browser-only interactions must not execute during SSR.

Every slice includes complete German and English catalogs following the
[localization foundation](localization.md).
Translate application and Taiga-provided UI consistently; do not defer translation
until feature completion. Check longer text and localized number/date entry as
well as display, without changing the business timezone or currency.

## Delivery steps

Implement one step at a time, through the real backend and UI. Each linked plan
has its own scope, decision prerequisites, and acceptance gate. Do not treat this
milestone as one implementation task or build later-step infrastructure in advance.

| Step | Plan | Usable outcome | Depends on |
| --- | --- | --- | --- |
| 3A | [Shared accounts](03a-accounts.md) | List, view, create, and edit text-only accounts | Milestone 2 |
| 3B | [Ledger and opening balances](03b-ledger-opening-balances.md) | Explicit opening entries and exact displayed balances | 3A and approved money policies |
| 3C | [Deposits, withdrawals, and history](03c-transactions.md) | Manual posting and paginated ledger history | 3B |
| 3D | [Account images](03d-account-images.md) | Safe private upload, display, replacement, and removal | 3A |
| 3E | [Allowance configuration](03e-allowance-configuration.md) | Persisted manager settings and member-visible configuration | 3B |
| 3F | [Allowance execution](03f-allowance-execution.md) | Durable monthly credits and visible execution outcomes | 3C and 3E |
| 3H | [Management and lifecycle completion](03h-lifecycle.md) | Remaining profile/settings/legal/lifecycle workflows | Relevant preceding steps |

Start with 3A. The table gives the default order, not a requirement to block
independent image work on unresolved money policies: 3D can follow 3A directly.
Complete the active step's gate before starting another. Reassess scope after each
delivery rather than accumulating incomplete backend-only or UI-only work.

For the remaining delivery sequence, proceed from 3F to 3H.
Step 2B is a prerequisite for all remaining feature work, not a parallel
activity or a late cosmetic pass.

## Decision boundaries

- 3A resolved: trimmed names of 1-40 characters, case-insensitive uniqueness, and no nine-account cap; see [ADR-0009](../../docs/ADR/ADR-0009-shared-accounts.md).
- 3B resolved: exact two-decimal integer minor units, decimal-string API, explicit single opening entries, and EUR/USD display units; see [ADR-0010](../../docs/ADR/ADR-0010-ledger-and-money.md) and [ADR-0011](../../docs/ADR/ADR-0011-currency-display-unit.md). The original nonnegative rule is superseded by 3C.
- 3C resolved: signed openings/balances and overdrafts, positive manual inputs, atomic source-aware posting, and snapshot-bounded history; see [ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md). Dedicated correction/reversal behavior requires a separately agreed follow-up.
- 3D resolved: PNG/JPEG/WebP, 512 pixels per axis, 2 MiB, metadata-free re-encoding, and immutable-file/reference recovery; see [ADR-0014](../../docs/ADR/ADR-0014-private-account-images.md).
- 3E/3F resolved: next-month immutable configuration, business-time due dates, historical catch-up, automatic durable retry, and credited-history preservation after timezone changes; see [ADR-0015](../../docs/ADR/ADR-0015-monthly-allowance-configuration.md) and [ADR-0016](../../docs/ADR/ADR-0016-monthly-allowance-execution.md).
- Before destructive work in 3H: archival, deletion/anonymization, retention, and sensitive-action confirmation/re-authentication.

Proposed defaults in the child plans remain proposals. Resolve affected business
policies before implementing them; record approved enduring decisions in ADRs
during that step, not speculative records now. Follow the existing
[application boundaries](../../docs/ADR/ADR-0002-application-boundaries.md),
[shared access](../../docs/ADR/ADR-0003-shared-instance-access.md), and
[language/timezone](../../docs/ADR/ADR-0004-language-and-timezone.md) decisions.

The locally implemented authentication foundation is the starting point, not work
to repeat in 3H. Hosted/fork CI, publishing rehearsal, and real-host deployment
gates remain open as recorded in the [migration overview](README.md).

## Verification across slices

- Follow the [E2E-first testing foundation](testing.md): browser E2E tests are the primary feature acceptance and regression suite.
- Add end-to-end scenarios with every slice, covering user-visible rules, persisted outcomes, manager/member permissions, invalid inputs, failures, and recovery through the real application.
- No routine unit tests are required; do not create backend rule/mock test suites or coverage quotas by default. Add an exceptional unit test only when its specific benefit is justified.
- Use targeted real-SQLite integration tests for transaction rollback/concurrency, database constraints, schema changes, and deterministic job boundary behavior that is difficult to verify reliably through the browser.
- Use deterministic clocks for scheduling tests rather than waiting for wall-clock timers; exercise retries and restart behavior through the application/job host.
- Check direct unauthorized requests against the running API in addition to browser role scenarios; do not rely on hidden buttons or route guards.
- Check SSR HTML, hydration, desktop/mobile layouts, and local font/image loading.
- Review each slice against approved [design references](../../docs/design/README.md); complete application-wide visual/usability acceptance before cutover. Passing functional E2E tests does not approve the design.
- Run core browser workflows in English, retaining only the German desktop first-render/hydration exception in ADR-0005; verify German completeness and longer-text layouts separately through catalog checks and localized design review.
- Verify changing language leaves ledger amounts, allowance periods, actor identity, and user-entered content unchanged.
- Keep fixtures isolated and core services unmocked; attach traces and relevant logs when a scenario fails.
- Update schema migrations and API contracts with each slice; keep the old application independently runnable.

Current next activity: review the remaining scope and decision prerequisites for
[step 3H management and lifecycle completion](03h-lifecycle.md).
Remaining slice completion leads to
[operations and cutover](04-operations-cutover.md).