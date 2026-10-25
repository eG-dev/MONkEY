# ADR-0008 Local Authentication

_Creation date_: 2026-10-07

## Context

POCKET MONkEY needs self-contained username/password authentication for a small
shared instance, without email or an external identity provider. Browser and SSR
requests must receive the same backend-enforced permissions and session revocation.

## Decision

- Use ASP.NET Core Identity with EF Core SQLite, immutable user IDs, unique normalized usernames, and Manager/Member roles. Do not expose public registration.
- Use backend-issued HttpOnly authentication cookies, Secure in production, with SameSite=Lax and eight-hour absolute expiry. Do not use persistent remember-me sessions or browser-stored bearer tokens.
- Forward cookies through the same-origin Web-BFF, including SSR requests and authentication responses. Keep credentials out of hydration data and private responses out of shared caches.
- Validate antiforgery tokens on unsafe requests, including login and logout. SameSite alone is not CSRF protection.
- Revalidate account status and security stamps on every authenticated request. Password resets, disablement, and role changes revoke existing sessions on the next request. Persist Data Protection keys so valid sessions survive container restart.
- Bootstrap and recover managers only through host-operated commands; never seed default passwords or expose network setup/recovery bypasses. Audit these operations without credentials.
- Require temporary passwords to be changed before ordinary application access. Protect the last active manager with transactional checks.
- Apply login throttling, temporary lockout, and generic authentication errors. Defer MFA and OIDC; use supported standard integrations when added.

This specializes [shared-instance access](ADR-0003-shared-instance-access.md) and
preserves the [application boundaries](ADR-0002-application-boundaries.md).