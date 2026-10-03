# Milestone 3: incremental UI and business logic

Status: not started. Depends on [authentication and authorization](02-authentication-authorization.md).

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

## Slice A: accounts and read-only overview

- Introduce tenant-free domain models and repositories, separate from Azure SDK entities.
- Build account listing, detail pages, balances, and paginated transaction history.
- Add manager account creation and editing; decide name limits and whether the old nine-account UI limit remains relevant.
- Add authenticated image upload/read/delete with size limits, content validation, safe generated filenames, and path-traversal prevention.
- Store files privately; serve through authorized endpoints with appropriate private caching.
- Re-encode uploaded images and remove unnecessary metadata. Define cleanup for orphan files and failure recovery between database and file changes.
- Provide explicit initial/opening balance behavior rather than importing Azure data or silently editing balances.

Gate: managers can create accounts; members can view all accounts but cannot
modify them; invalid uploads and direct unauthorized writes fail.

## Slice B: ledger and deposits/withdrawals

- Implement transaction posting in backend application services, replacing the behavior in AccountDetails.razor.
- Decide currency and negative-balance policy before exposing financial writes.
- Proposed default: integer minor units, one configured currency, and explicit rounding. Never use binary floating-point for monetary calculations.
- Define the API money representation so Angular cannot introduce precision loss; use bounded safe integers or decimal strings as appropriate.
- Insert the ledger entry and update any stored balance in one database transaction.
- Introduce unique idempotency keys so repeated clicks, retries, and concurrent submissions do not duplicate entries.
- Store actor user ID, timestamp, source, and optional comment; retain an actor display snapshot where historical readability requires it.
- Prefer append-only financial entries and explicit correction/reversal entries over silent history edits.
- Show actionable failures; do not preserve the current swallowed exceptions.

Gate: simultaneous manager writes produce correct balances; failed writes roll
back completely; repeating a request does not double-post; members cannot post.

## Slice C: monthly allowances

- Add manager allowance configuration and member-visible allowance status.
- Use the business timezone from Docker ENV `TZ`; define due date, effective-date behavior, missed-month catch-up rules, and handling subsequent timezone changes.
- Replace the pocket-money Azure Function with backend scheduling plus persistent job state.
- Use a unique account/period identity for allowance credits, enforced by the database and posted through the same atomic ledger service.
- Do not depend on an in-memory timer firing exactly once; startup and retries must safely resume pending work.
- Record execution outcomes and make failure status visible to managers.

Gate: repeated runs and crash/restart scenarios never double-credit; tests cover
month boundaries, daylight saving transitions, disabled allowances, and downtime.

## Slice D: monthly reports without email

- Replace monthly reporting with backend jobs and an Angular report list/detail view.
- Generate immutable report snapshots from ledger boundaries with unique account/period constraints.
- Use Docker ENV `TZ` to determine report-period boundaries; retain UTC timestamps and do not reinterpret closed periods after a timezone change.
- Use raw timestamps and amounts in report data; apply locale formatting at presentation boundaries.
- Define report-period closure and correction behavior so late changes do not silently alter historical reports.
- Persist sufficient opening-balance/checkpoint information to support reliable reporting.
- Do not port email triggers, SMTP templates, queues, delivery preferences, or resend controls.
- Add download/export only if agreed as a requirement; it is not a substitute email feature.

Gate: opening/closing balances reconcile with posted transactions; empty periods,
late corrections, retries, and period boundaries have defined behavior.

## Slice E: management and lifecycle completion

- Complete manager user/role administration and member self-service profile/password screens.
- Include a language selector usable before login and saved personal language preferences for both roles; the basic selector and identity integration are delivered in milestones 1 and 2.
- Replace tenant settings with instance settings; remove tenant creation, selection, invitation, and tenant deletion workflows.
- Review terms/privacy pages and acceptance requirements for the self-hosted operating model rather than copying cloud wording unchanged.
- Define account archival and user deletion/anonymization without destroying financial audit history accidentally.
- Proposed default: retain financial history; no automatic twelve-month deletion. Resolve retention requirements before adding a cleanup job.
- Add explicit confirmations and re-authentication where appropriate for sensitive actions.

Gate: all agreed core workflows work for both roles; destructive actions preserve
ledger integrity and last-manager protection; no email or tenant assumptions remain.

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