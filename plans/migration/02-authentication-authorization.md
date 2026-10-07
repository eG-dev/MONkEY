# Milestone 2: authentication and authorization

Status: local authentication, operator bootstrap/recovery, cookie/CSRF transport,
and manager user administration are implemented. Local verification is recorded in
the [development guide](../../revamp/README.md). The user approved this work on the
locally verified [stack foundation](01-stack-foundation.md); its hosted/fork CI,
publishing, and deployment-host gates remain open, not waived.

The approved choices are recorded in [ADR-0008](../../docs/ADR/ADR-0008-local-authentication.md).

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

- [x] A fresh instance can bootstrap one manager without default passwords or email.
- [x] Setup cannot be reused once initialized.
- [x] Login, logout, expiry, password change, and non-email recovery work.
- [x] Anonymous protected API requests fail even when bypassing Angular routes; harmless foundation diagnostics remain an explicit development exception.
- [x] Members can read their session and manage personal preferences; direct member user-administration writes fail. Shared-account reads and financial writes must be verified with their milestone 3 contracts.
- [x] The last active manager cannot be disabled or demoted, even through concurrent requests; user deletion is not exposed.
- [x] Disabled users and revoked manager sessions lose access on the next authenticated request.
- [x] SSR uses the correct session and does not leak data between concurrent users.
- [x] CSRF attempts and forged identity/role headers are rejected.
- [x] Container restart has deliberate, tested session behavior.
- [x] No SMTP or external identity dependency is introduced; the offline runtime checks remain passing.

These are local acceptance results, not a claim that hosted CI or production
deployment is complete. On 2026-10-07 all 31 production-image acceptance cases
passed. The web dependency audit remains blocked by a critical advisory in the
existing development-only `concurrently` / `shell-quote` chain; foundation
hosted/fork CI, publishing, and deployment-host gates also remain open.

## Session and recovery policy

- Eight-hour absolute, non-persistent cookie sessions; no sliding expiry or remember-me option.
- Per-request account/security-stamp validation. Password reset, disablement, and role changes revoke existing sessions on the next authenticated request.
- Valid sessions survive container restart through persistent Data Protection keys.
- Five failed password attempts cause a fifteen-minute lockout. Login also has an instance-wide twenty-attempt-per-minute limit; do not trust client IP headers as throttle identity.
- Managers create/reset temporary passwords that require a change before ordinary application access. Host-only recovery also clears lockout and requires a password change.
- Members may change their own password and German/English language preference. These operations do not grant business-write permissions.
- MFA and OIDC are deferred. Host-operator powers remain separate from the in-application Manager role.

The harmless read-only foundation diagnostics remain public during development.
Financial routes do not exist yet; their Manager/Member access checks must be added
with each milestone 3 feature, not inferred from frontend controls.

Next: [incremental UI and business logic](03-ui-business-logic.md).