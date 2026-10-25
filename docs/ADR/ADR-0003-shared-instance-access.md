# ADR-0003 Shared-Instance Access

_Creation date_: 2026-10-04

## Context

POCKET MONkEY serves a small household or group sharing pocket-money accounts.
Users need different permissions, but separate tenants and account-by-account
membership would add unnecessary access-model complexity. The instance must be
usable without email delivery or an external identity service.

## Decision

- Use one shared instance with local users and explicit Manager and Member roles; do not model tenancy or per-account user assignments.
- Members may read all accounts. Managers administer users/accounts and perform financial writes. Members may manage their own language/password preferences without gaining business-write permissions.
- Enforce these rules in the backend, not only through frontend guards or hidden controls.
- Use immutable internal user identifiers; names and login/profile fields are not financial actor identity.
- Provide self-contained authentication and recovery without an email dependency. Choose the implementation library and recovery mechanism separately when evaluated.
- OIDC federation may be added later through standard libraries, but is not required to run the application. Do not implement OAuth/OIDC protocols from scratch.