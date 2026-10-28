# ADR-0015 Monthly Allowance Configuration

_Creation date_: 2026-10-10

_Updated_: 2026-10-28

## Context

Monthly allowances need deterministic settings for each business month. Editing
the latest value must not change prior periods or financial history. Managers
configure allowances; members can read their configuration.

## Decision

- Monthly credits are due on the first day of each month at 00:00 in the configured business timezone `TZ`.
- Enabling, amount changes, and disabling take effect from the next business month. Do not permit backdating or retroactive changes.
- Retirement immediately suppresses execution without changing existing configuration revisions. Current and previously scheduled settings remain in force, and normal execution resumes on reactivation under those settings.
- Enabled amounts must be positive exact two-decimal values within the existing signed 64-bit minor-unit range. Disabling retains the last configured amount. Require an opening entry before enabling.
- Persist immutable configuration revisions with an internal actor ID, UTC save time, effective month, enabled state, and amount. Resolve a month's configuration from revisions effective on or before that month; the latest revision for the effective month wins.
- Enforce Manager writes, shared authenticated reads, antiforgery, and atomic revision/audit persistence in the backend. Reject stale concurrent edits using the last revision token; identical retries must not append duplicate revisions.
- Saving configuration never posts a ledger credit or claims successful execution. Scheduling, durable credit identities, catch-up, and timezone-change execution policies belong to the allowance-execution decision.
- Use the configured currency as a display unit only, with the existing exact-money API representation. Verify workflows in English with EUR, and verify German catalogs separately.

## Change History

- 2026-10-28: Preserved allowance configuration across retirement and reactivation; execution is suppressed by account status instead of a disabling revision.
- 2026-10-28: Retirement immediately suppresses allowance execution and schedules a disabling revision so reactivation does not silently restart future credits.
