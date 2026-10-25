# Step 3F: allowance execution

Status: locally implemented and verified on 2026-10-12. Execution policies are approved in [ADR-0016](../../docs/ADR/ADR-0016-monthly-allowance-execution.md); the current account-details wireframe and prototype were separately explicitly approved on 2026-10-12 in the [design index](../../docs/design/README.md). Depends on [manual transactions](03c-transactions.md) and
[allowance configuration](03e-allowance-configuration.md).
Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

The backend durably credits due monthly allowances. Members see allowance status
and ledger credits; managers see execution outcomes and failures.

## Decisions before implementation

- Resolved: catch up every missed eligible month using historical configuration; skip disabled or unconfigured months; automatically retry without duplicate credits; preserve credited month identities/history after `TZ` changes and use the new timezone for outstanding scheduling. See [ADR-0016](../../docs/ADR/ADR-0016-monthly-allowance-execution.md).
- Evaluated and implemented: backend-hosted startup/minute scanner with durable SQLite attempt state, immutable revision selection, unique account/month posting identities, and shared atomic ledger writes; recorded in [ADR-0016](../../docs/ADR/ADR-0016-monthly-allowance-execution.md#durable-execution).

## Work

- Replace the Azure pocket-money worker with backend scheduling and persistent execution state.
- Define account/period identities in business time using `TZ`, with raw UTC timestamps for events.
- Enforce a unique account/period credit identity in the database and post through the same atomic ledger service as manual writes.
- Resume pending work after startup/failure; do not rely on an in-memory timer firing exactly once.
- Persist execution outcomes and expose localized allowance status and manager-visible failures in the UI.

## Acceptance gate

- [x] Due credits appear in persisted balances/history and status through the real application.
- [x] Retries, concurrent execution, interrupted attempts, and forced process restart preserve one credit per month and atomic financial writes; see the scoped evidence below.
- [x] Deterministic real-SQLite checks cover month/DST/year boundaries, historical effective dates, disabled allowances, downtime/catch-up, and timezone policy; production-host checks exercise startup and periodic recovery.
- [x] English/EUR browser tests verify member-visible status, backend-redacted Manager details, and failure/recovery states; German/English catalog validation passes separately.

## Delivery evidence

Verified locally on 2026-10-12 against the final `pocket-monkey:foundation`
Linux production image: **17 checks passed**, one worker, zero retries. Run
from the repository root after the Release solution and production-image builds:

```powershell
npm.cmd --prefix tests/e2e test -- specs/accounts/allowance-execution.spec.ts specs/accounts/allowance-workflows.spec.ts specs/accounts/allowance-api.spec.ts specs/ledger/opening-workflows.spec.ts specs/shell/rendering.spec.ts --workers 1
```

- Real browser workflows on desktop/mobile show the latest successful credit and oldest outstanding month, automatic ledger provenance and business period, retained disabled settings, and Member read-only access. Catch-up credits retain a period label only when it differs from the posting month.
- A test-only harness prepares a durable interrupted attempt in an isolated volume. The production worker resumes after forced `SIGKILL`/startup; a second forced restart preserves the exact balance and immutable ledger history without duplicate credits.
- An isolated SQLite audit trigger makes a real worker posting fail. Balance/history remain unchanged, the durable failure is visible, and direct Member API reads redact attempts, attempt timestamps, and error codes. Removing the trigger while the application remains running allows its real one-minute timer to retry automatically. The recovered catch-up credit preserves earlier history and skips the disabled current month.
- The deterministic SQLite probe upgrades a populated pre-execution schema and checks historical amounts, immutable save-order precedence, Berlin month/DST/year boundaries, disabled months, audit rollback, concurrent retries, prepared-attempt recovery, overflow isolation, and timezone/currency changes without replaying history.
- Status and ledger timestamp formatting use the backend's validated business timezone with `en-US`/`de-DE` presentation. Browser assertions verify alignment, at least 12px outstanding-status spacing, and no horizontal overflow; saved desktop/mobile screenshots were inspected.
- Release .NET and Angular builds, E2E TypeScript checks, and German/English key/placeholder/ICU checks passed. The final acceptance set retains the sole German desktop first-render/hydration exception and English SSR desktop/mobile checks.

Fixtures and failure injection exist only in the test harness, not production
HTTP endpoints. This is local feature acceptance, not application-wide visual
acceptance or production readiness. A hosted run for this new revision, the full
release regression suite, and operational/publication gates remain open; earlier
GitHub success confirmations are preserved in the [testing record](testing.md).

## Constraints

Email is excluded. Test clocks/failure controls belong in isolated
test-host composition or protected operator tooling, never public production APIs.

Next: [management and lifecycle completion](03h-lifecycle.md).