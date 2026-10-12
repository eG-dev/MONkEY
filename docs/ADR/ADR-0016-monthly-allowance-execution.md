# ADR-0016 Monthly Allowance Execution

_Creation date_: 2026-10-12

## Context

Monthly allowance execution must recover from downtime and failures without
duplicating credits or applying today's settings to historical periods.
Business-timezone changes must not rewrite financial history.

## Decision

- Credit every missed eligible business month, using that month's historical configuration resolved according to [ADR-0015](ADR-0015-monthly-allowance-configuration.md). Do not use the latest amount for all missed months.
- Skip months whose effective configuration is disabled or absent. Later enabling does not make those months eligible retroactively.
- Automatically retry failed execution and resume outstanding work after restart. Enforce a durable unique account/business-month credit identity and atomic financial writes so retries and concurrent execution cannot duplicate credits or leave partial postings.
- After a configured `TZ` change, preserve already credited business-month identities, amounts, timestamps, and posting history. Use the new timezone to determine outstanding scheduling; never rename or replay an already credited month because its UTC boundary changed.
- Configuration saves remain separate from execution and never post credits. Preserve the exact-money and display-currency rules in [ADR-0010](ADR-0010-ledger-and-money.md) and [ADR-0011](ADR-0011-currency-display-unit.md).

### Durable execution

- Use a backend-hosted scanner at startup and once per minute. The timer only wakes the scanner; persisted revisions and execution records determine due work. No external scheduler or broker is needed for the shared SQLite instance.
- Resolve historical configuration by immutable save order among revisions effective for the month. Process eligible months oldest first; a failure blocks later months for that account, not other accounts.
- Persist each account/month attempt with its selected revision and a stable posting idempotency key before posting. Enforce unique account/month execution and ledger identities in SQLite. Commit the ledger entry, exact balance, financial audit, and credited execution outcome in one transaction.
- Resume unfinished attempts after interruption and automatically retry safe failures. Persist stable error codes, never internal exception messages; expose attempt details and failure reasons only to authenticated Managers while Members retain credit status/history access.