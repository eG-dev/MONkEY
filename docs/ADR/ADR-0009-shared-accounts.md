# ADR-0009 Shared Accounts

_Creation date_: 2026-10-08

_Updated_: 2026-10-28

## Context

POCKET MONkEY gives ready authenticated users shared access to every account,
while managers maintain account labels. Names must be useful human-readable
labels without becoming account identity or permitting ambiguous duplicates.
Validation and concurrent writes require backend and database enforcement.

## Decision

- An account belongs to the shared instance, not a tenant or individual user. Its generated immutable ID is its identity; renaming preserves that ID.
- Trim names at the application boundary and require 1-40 characters. Account names are user-entered content, not translated UI text.
- Names are unique ignoring case. Persist an invariant-uppercase normalized name and enforce uniqueness with a database index, including concurrent writes. Reject conflicts rather than silently modifying another account.
- Do not impose an arbitrary nine-account limit.
- Ready authenticated Managers and Members can list active accounts and view active or retired accounts by ID. Only Managers can list retired accounts and create, edit, delete, retire or reactivate accounts; the backend enforces access and antiforgery requirements.
- Commit account mutations and their audit events atomically, retaining immutable actor and account IDs until account deletion. Failed mutations must not leave partial changes or audit events. Deletion purges account-linked audit events without a surviving account-linked deletion event.
- Account labels do not include an editable balance. Financial amounts belong to explicit ledger behavior, not account-name administration.
- Managers may immediately delete accounts without manual transactions or credited allowances, including accounts with an opening or uncredited allowance configuration. Otherwise retirement blocks business writes and allowance credits, hides the account from the overview, and schedules permanent deletion after 30 elapsed days. Managers can reactivate before the deadline. Account details remain readable by direct link during retirement and show the scheduled deletion date.
- Permanently delete the account, linked ledger details, balance, audit events, allowance records and attributable retry keys atomically; clean up associated image files durably after commit. Preserve global posting sequence state. Backups and exports can retain older copies.

Related: [shared-instance access](ADR-0003-shared-instance-access.md) and
[application boundaries](ADR-0002-application-boundaries.md).

## Change History

- 2026-10-28: Approved immediate deletion or a 30-day reversible retirement according to financial activity, with eventual account-data purge and preserved direct-link reads during retirement.