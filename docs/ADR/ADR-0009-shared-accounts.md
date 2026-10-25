# ADR-0009 Shared Accounts

_Creation date_: 2026-10-08

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
- Ready authenticated Managers and Members can list and view every account. Only Managers can create or edit accounts; the backend enforces access and antiforgery requirements.
- Commit each account mutation and its audit event atomically, retaining immutable actor and account IDs. Failed mutations must not leave partial changes or audit events.
- Account labels do not include an editable balance. Financial amounts belong to explicit ledger behavior, not account-name administration.

Related: [shared-instance access](ADR-0003-shared-instance-access.md) and
[application boundaries](ADR-0002-application-boundaries.md).