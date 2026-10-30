# ADR-0003 Shared-Instance Access

_Creation date_: 2026-10-04
_Updated_: 2026-10-30

## Context

POCKET MONkEY serves a small household or group sharing pocket-money accounts.
Managers need instance-wide administration while Members should see only the
accounts explicitly assigned to them. Assignments limit application access;
they do not introduce ownership or separate tenants. The instance must remain
usable without email delivery or an external identity service.

## Decision

- Use one shared instance with local users and explicit Manager and Member roles; do not model tenancy or individually owned accounts.
- Ready authenticated Managers administer users/accounts, manage Member account assignments and perform business writes. Managers retain access to all accounts, including retired accounts under [ADR-0009](ADR-0009-shared-accounts.md).
- Ready authenticated Members may read only their explicitly assigned active accounts. A Member may have multiple accounts, and multiple Members may share an account. No assignments means no account access. Personal language/password preferences do not grant business-write permissions.
- Enforce account visibility in the backend for lists, direct IDs, images, transaction history, allowance reads and SSR requests, not only through frontend guards or hidden controls. Grants and revocations apply on subsequent requests with existing sessions. Return the same `404`/`not_found` response for inaccessible and nonexistent account IDs; do not expose existence through account-scoped reads.
- Retain assignments across promotion to Manager and disablement. They have no limiting effect for Managers and grant no access to disabled users; their effect returns on demotion to Member or re-enablement, provided the account remains active. Assignment management targets Members, including disabled Members, not current Managers.
- Keep only current assignments and concurrency metadata. Assignment changes are atomic and reject stale edits rather than silently overwrite another Manager's changes. Do not store assignment audit events, change history or a separate retention policy. Existing financial, account and user audit requirements are unaffected.
- Retirement removes account assignments; reactivation requires fresh assignment. Permanent account deletion leaves no assignment orphans. Existing Members start without assignments when this access model is introduced; do not infer access from prior all-account reads.
- Financial-only recovery leaves assignments empty for Managers to recreate, without inferred identity matches. Complete installation backup/restore preserves assignments with user identities, following [ADR-0021](ADR-0021-portable-financial-recovery.md). Application access controls cannot recall data already delivered or restrict host administrators with direct storage/backup access.
- Use immutable internal user identifiers; names and login/profile fields are not financial actor identity.
- Provide self-contained authentication and recovery without an email dependency. Choose the implementation library and recovery mechanism separately when evaluated.
- OIDC federation may be added later through standard libraries, but is not required to run the application. Do not implement OAuth/OIDC protocols from scratch.

## Change History

- 2026-10-30: Replaced all-account Member reads with explicit many-to-many account assignments to support family access boundaries without tenancy. Recorded retained role/disablement assignments, removal on retirement, empty recovery/upgrade assignments and current-state-only storage without assignment auditing.