# Step 3F: Allowance Execution

Status: implemented and locally verified under
[ADR-0016](../../docs/ADR/ADR-0016-monthly-allowance-execution.md).

## Implemented Scope

- Backend startup/minute scanning uses durable SQLite attempts, historical immutable configuration and unique account/month posting identities.
- Catch up every missed eligible month, skip disabled/unconfigured periods and post through the same exact atomic ledger service as manual writes.
- Retry failures automatically and resume interrupted attempts without duplicate credits. Preserve credited identities/history after `TZ` changes; use the new timezone for outstanding scheduling.
- Both roles see localized status/history; Manager-only attempt/error details are backend-redacted from Member responses.

## Delivery Evidence

Current coverage is part of the **87-case local full-suite pass** recorded in
[testing](testing.md). Reproduce the focused slice after preparing Release probes
and the current production image:

```text
npm --prefix tests/e2e test -- specs/accounts/allowance-execution.spec.ts
```

The five executions retain desktop interrupted-worker/idempotency recovery,
active/disabled periodic retries, deterministic SQLite boundary/concurrency checks
and mobile active-failure layout/role visibility. Failures are injected only by
isolated test tooling, not production HTTP endpoints.

## Acceptance Gate

- [x] Persisted credits/status appear through the real application with exact balances and immutable history.
- [x] Crash/restart, concurrent execution, audit failure and automatic retry preserve one credit per period.
- [x] SQLite probes cover month/year/DST boundaries, historical amounts, catch-up, disabled periods, overflow and timezone changes.
- [x] Real Manager/Member reads prove attempt/error redaction and responsive status rendering; German/English catalogs pass separately.

No email alerts or public clock/failure controls are in scope. Real-host job
behavior and current hosted release verification remain separate
[finish-line gates](README.md), not missing allowance implementation.