# Milestone 3: incremental UI and business logic

Status: in progress. Steps 3A and 3B are locally implemented and verified on 2026-10-08;
steps 3C-3H have not started. Depends on [authentication and authorization](02-authentication-authorization.md).

## Delivery model

Deliver each slice through backend rules, persistence, API contracts, and Angular
UI together. Each slice must be usable and tested before starting the next.
Managers can administer the instance; members can read every account.

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
| 3G | [Monthly reports](03g-monthly-reports.md) | Immutable monthly snapshots and report views, without email | 3C and 3F |
| 3H | [Management and lifecycle completion](03h-lifecycle.md) | Remaining profile/settings/legal/lifecycle workflows | Relevant preceding steps |

Start with 3A. The table gives the default order, not a requirement to block
independent image work on unresolved money policies: 3D can follow 3A directly.
Complete the active step's gate before starting another. Reassess scope after each
delivery rather than accumulating incomplete backend-only or UI-only work.

## Decision boundaries

- 3A resolved: trimmed names of 1-40 characters, case-insensitive uniqueness, and no nine-account cap; see [ADR-0009](../../docs/ADR/ADR-0009-shared-accounts.md).
- 3B resolved: exact two-decimal integer minor units, decimal-string API, non-negative balances, explicit single opening entries, and EUR/USD display units; see [ADR-0010](../../docs/ADR/ADR-0010-ledger-and-money.md) and [ADR-0011](../../docs/ADR/ADR-0011-currency-display-unit.md).
- Before 3C: manual-posting validation and correction/reversal behavior.
- Before 3D: upload limits/formats and file/database failure recovery.
- Before 3E/3F: allowance configuration/effective dates, due dates, catch-up, and subsequent timezone changes.
- Before 3G: report closure, late corrections, and immutable period boundaries.
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
- Use targeted real-SQLite integration tests for transaction rollback/concurrency, database constraints, schema changes, and deterministic job/report boundary behavior that is difficult to verify reliably through the browser.
- Use deterministic clocks for scheduling tests rather than waiting for wall-clock timers; exercise retries and restart behavior through the application/job host.
- Check direct unauthorized requests against the running API in addition to browser role scenarios; do not rely on hidden buttons or route guards.
- Check SSR HTML, hydration, desktop/mobile layouts, and local font/image loading.
- Run core browser workflows in German and English, including authentication/validation errors, accessible labels, long-text layouts, and decimal/date input.
- Verify changing language leaves ledger amounts, report periods, actor identity, and user-entered content unchanged.
- Keep fixtures isolated and core services unmocked; attach traces and relevant logs when a scenario fails.
- Update schema migrations and API contracts with each slice; keep the old application independently runnable.

Next: [operations and cutover](04-operations-cutover.md).