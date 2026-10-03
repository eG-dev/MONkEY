# Milestone 2: authentication and authorization

Status: not started. Depends on [stack foundation](01-stack-foundation.md).

## Goal

Deliver self-contained login and backend-enforced manager/member permissions,
without Azure identity, email, or a custom OAuth/OIDC protocol implementation.

## Identity approach

Use ASP.NET Core Identity with supported password hashing and cookie
authentication. Keep immutable internal user IDs, normalized unique usernames,
display names, active/disabled state, and explicit Manager/Member roles. Email is
not required as a login identifier, delivery channel, or recovery mechanism.

Local cookie authentication is not OIDC. Optional future federation should use
standard OIDC libraries and an external provider; it is not a first-release task.
Do not build an embedded authorization server merely to label local login OAuth.

## Work

1. Add identity schema migrations and an explicit backend current-user contract.
2. Implement one-time first-manager setup using an operator-controlled mechanism. Do not expose an unauthenticated setup screen on an arbitrary network interface or seed default credentials.
3. Implement login, logout, current-user retrieval, password change, and session expiry.
4. Implement manager-controlled user creation, disablement, role changes, and password reset. Use one-time credentials with forced change; never log them.
5. Define an operator-only recovery command/process for loss of the sole manager's credentials. It requires host access, creates an audit event, and cannot be invoked remotely as an authentication bypass.
6. Reject actions that disable, delete, or demote the last active manager, including concurrent requests.
7. Implement server-side role policies. Members read shared account data; only managers perform financial/account/user-management writes.
8. Add Taiga login and user/session UI, including password-manager-friendly fields and accessible error states.
9. Add throttling, safe authentication errors, and a defined lockout/recovery policy.

## BFF and SSR security contract

- Backend validation is authoritative; UI hiding and Angular route guards are only usability aids.
- The BFF forwards the backend session cookie for authorized SSR reads and API requests, and correctly relays authentication response cookies.
- Never accept a client-supplied user ID or role header as proof of identity.
- Do not place bearer tokens or credentials in browser local storage or Angular hydration data.
- Use HttpOnly, Secure cookies with an explicitly chosen SameSite policy and appropriate path/domain behavior through the proxy.
- Protect unsafe cookie-authenticated requests against CSRF, including login/logout where applicable; validate the chosen backend-token/BFF forwarding flow.
- Enforce HTTPS in production even on LAN/VPN deployments.
- Disable shared caching and prerendering for private routes. Review Angular HTTP transfer-cache behavior; exclude private responses unless their transfer is explicitly safe and request-scoped.
- Persist Data Protection keys with restrictive filesystem permissions and back them up deliberately.
- Set and test a session-revocation policy for password resets, disablement, and role changes. Do not leave stale manager privileges valid until ordinary cookie expiry.

## Acceptance gate

- [ ] A fresh instance can bootstrap one manager without default passwords or email.
- [ ] Setup cannot be reused once initialized.
- [ ] Login, logout, expiry, password change, and non-email recovery work.
- [ ] Anonymous API requests fail even when bypassing Angular routes.
- [ ] Member read requests succeed; direct member business-write requests fail.
- [ ] The last active manager cannot be removed, even through concurrent requests.
- [ ] Disabled users and revoked manager sessions lose access within the documented bound.
- [ ] SSR uses the correct session and does not leak data between concurrent users.
- [ ] CSRF attempts and forged identity/role headers are rejected.
- [ ] Container restart has deliberate, tested session behavior.
- [ ] No SMTP, external identity, or outbound network access is required.

## Deferred decisions

Decide whether MFA is needed, exact session durations, and whether members may
change personal presentation preferences. Such preferences do not grant account
write access. Separate host-operator powers from the in-application Manager role.

Next: [incremental UI and business logic](03-ui-business-logic.md).