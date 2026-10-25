# Step 2A: Authentication and Authorization

Status: implemented and locally verified, including operator bootstrap/recovery,
sessions, password flows and Manager user administration. Follow
[ADR-0008](../../docs/ADR/ADR-0008-local-authentication.md); release/host acceptance
remains in the [finish-line plan](README.md).

## Implemented Scope

- ASP.NET Core Identity, immutable user IDs, normalized unique usernames, display names, active/disabled state and explicit Manager/Member roles.
- One-time host-controlled Manager bootstrap without default passwords or an unauthenticated network setup screen.
- Login/logout/current-user/password-change flows, temporary credentials with forced change, and Manager-controlled user creation/reset/disablement/role changes.
- Host-only audited recovery, including lockout reset and forced password change; no remote authentication bypass.
- Last-active-Manager protection, including concurrent demotions/disablement. No user deletion.
- Members read shared accounts and change personal preferences/passwords; Managers perform business/user-management writes.
- Accessible bilingual login/profile/admin UI with real browser/API regression coverage.

## Session and Recovery Policy

- Eight-hour absolute non-persistent cookie sessions; no sliding expiry or remember-me.
- Per-request account/security-stamp checks revoke sessions after password reset, role change or disablement.
- Valid sessions survive container restart through persistent private Data Protection keys.
- Five failed passwords cause fifteen-minute lockout; login also has an instance-wide twenty-attempt-per-minute limit. Untrusted client IP headers are not throttle identity.
- No email, SMTP or external identity dependency. MFA/OIDC are deferred, not unfinished first-release tasks.

Commands are in the [operator guide](../../docs/development.md#first-manager-and-recovery).

## BFF and SSR Security Contract

- Backend authorization is authoritative; reject anonymous/Member writes independently of UI controls.
- Forward session/antiforgery cookies and tokens correctly, including authenticated SSR and login/logout. Never trust user/role headers supplied by a client.
- Use Secure/HttpOnly cookies and configured SameSite/path/proxy behavior; require production HTTPS, including LAN/VPN use.
- Never expose credentials/tokens in local storage or hydration data. Private SSR/API responses cannot use shared caches or leak across concurrent requests.
- Keep keys and recovery access private; host-operator authority is separate from the in-app Manager role.

## Acceptance Gate

- [x] Bootstrap is one-time; real login/logout, expiry, temporary/permanent password changes and non-email recovery work.
- [x] Manager/Member API denials, CSRF, forged identity and concurrent last-Manager protection are covered.
- [x] Revocation, lockout, restart sessions and concurrent SSR/private-cache isolation are covered.
- [x] Accessible profile/password flows and preference persistence are implemented for both roles.
- [x] No email/tenancy/federation requirement or user-deletion workflow is introduced.
- [ ] Current hosted release and real-host configuration pass the [release gate](04-operations-cutover.md#release-gate).

Local checks are summarized in [testing](testing.md). Historical browser timing
regressions and obsolete dependency advisories are not current implementation work;
triage current alerts and actual failing runs instead.