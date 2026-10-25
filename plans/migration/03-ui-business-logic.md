# Milestone 3: Business Features

Status: the agreed first-release feature scope is implemented and locally
verified. Remaining work is acceptance/operational closeout, not a new business
slice. See the [finish-line plan](README.md) and [operations](04-operations-cutover.md).

## Delivery Steps

| Step | Implemented Outcome | Reference |
| --- | --- | --- |
| 3A | Shared accounts, listing/details and Manager create/edit | [Accounts](03a-accounts.md) |
| 3B | Explicit signed openings, exact balances and display units | [Ledger](03b-ledger-opening-balances.md) |
| 3C | Atomic deposits/withdrawals, safe retries and paginated history | [Transactions](03c-transactions.md) |
| 3D | Private validated image upload/replacement/removal | [Images](03d-account-images.md) |
| 3E | Immutable next-month allowance configuration | [Configuration](03e-allowance-configuration.md) |
| 3F | Durable monthly credits, catch-up/retry and visible outcomes | [Execution](03f-allowance-execution.md) |
| 3H | Profile/legal/About completion and automatic safe retention | [Lifecycle](03h-lifecycle.md) |

Portable financial export/recovery is also implemented under
[operations](04-operations-cutover.md#portable-financial-export-and-recovery).
Dedicated reversals are deferred. Monthly reports, archival, user deletion/
anonymization, tenancy, email and Azure import are outside the first-release scope.

## Decision Boundaries

- Account identity/names/access: [ADR-0009](../../docs/ADR/ADR-0009-shared-accounts.md).
- Exact minor-unit arithmetic, openings and EUR/USD display: [ADR-0010](../../docs/ADR/ADR-0010-ledger-and-money.md) and [ADR-0011](../../docs/ADR/ADR-0011-currency-display-unit.md).
- Signed money, source-aware retries, history and UTC-month retention: [ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md).
- Private images: [ADR-0014](../../docs/ADR/ADR-0014-private-account-images.md).
- Allowance revisions and durable execution: [ADR-0015](../../docs/ADR/ADR-0015-monthly-allowance-configuration.md) and [ADR-0016](../../docs/ADR/ADR-0016-monthly-allowance-execution.md).
- About/build identity and notice review: [ADR-0019](../../docs/ADR/ADR-0019-build-identity-and-about-assets.md) and [ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md).
- Offline recovery: [ADR-0021](../../docs/ADR/ADR-0021-portable-financial-recovery.md).

These are approved implemented decisions, not pending proposals. New behavior
still requires the applicable backend/data and UI design review; unfinished
operations gates do not authorize extra product scope.

## Verification Across Slices

Use [E2E-first verification](testing.md) against real SSR/BFF/backend/SQLite.
Preserve role/CSRF denials, concurrent SSR/session isolation, exact limits,
rollback/concurrency/idempotency, restart/job safety and persisted outcomes.
Runtime probes control time/failures where stronger than browser-only checks;
there is no routine mocked unit-test or coverage requirement.

Keep desktop/mobile checks where layout matters, German/English catalogs and
focused localized review, EUR core flows and bounded USD coverage. Real-image
About/offline checks verify source/notice delivery. Use isolated fixtures and
actionable traces/logs, with no unconditional retries.

Passing local functionality does not complete hosted release verification,
application-wide design acceptance or real-host production readiness.