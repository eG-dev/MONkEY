# Step 3A: Shared Accounts

Status: implemented and locally verified. Follow
[ADR-0009](../../docs/ADR/ADR-0009-shared-accounts.md) and the
[business-feature summary](03-ui-business-logic.md).

## Implemented Scope

- Both roles list/view every account; only Managers create/edit through backend-authorized contracts.
- Trimmed, nonempty names of at most 40 characters, case-insensitive database uniqueness, immutable IDs and no nine-account cap.
- Atomic account mutation/audit, reload/restart persistence and private request-scoped SSR.
- Accessible responsive list/detail/dialog states with German/English catalogs.

## Acceptance Gate

- [x] Real browser/API checks cover create/edit/reload, shared Member reads and denied writes, anonymous access, CSRF, invalid/missing accounts and responsive layouts.
- [x] SQLite probes cover constraints, concurrent duplicate names, rename conflicts and atomic audit rollback.
- [x] Persisted account state and private SSR isolation survive restart without cross-user leakage.

Images, money and allowances are delivered in their respective slices, not
deferred features. Account archival/deletion is outside the approved implemented
scope; the pending design review is in
[lifecycle completion](03h-lifecycle.md#account-deletion-proposal-r4).
Current commands and release gates are in [testing](testing.md) and the
[finish-line plan](README.md).

## Member Account Assignment — Backend/Data Proposal R7

**Draft for review; not approved or implemented.** This proposed change
intentionally differs from the implemented scope and acceptance results above.
No production code, API contract, schema, migration, ADR or approved design
reference changes until the relevant review gates are passed.

### Purpose and boundaries

- Members should read only accounts explicitly assigned to them. A Member can
  have multiple assigned accounts; an unassigned Member sees an empty overview
  explaining that no accounts are currently assigned and a Manager must assign
  one. Managers manage assignments and retain access to all accounts and
  business writes. Member preferences do not grant writes.
- Accounts remain shared instance resources, not individually owned accounts or
  tenants. On 2026-10-29 the user confirmed that multiple Members may be assigned
  the same account as well as a Member having multiple accounts. This does not
  approve the full R7 proposal.
- Apply access checks on the backend, including direct API and SSR requests,
  not just the overview or hidden navigation. Revocation must affect subsequent
  requests without waiting for cookie expiry. Data already delivered to a
  browser or retained in backups cannot be recalled.
- Financial calculation, transaction history, allowance execution and Manager
  write rules are unchanged. Assignment changes must not rewrite financial
  history, balances or actor IDs.

### Affected types and responsibilities

- Existing storage entities
  [`PocketMonkey.Storage.Entities.ApplicationUser`](../../backend/PocketMonkey.Storage/Entities/ApplicationUser.cs)
  and [`PocketMonkey.Storage.Entities.Account`](../../backend/PocketMonkey.Storage/Entities/Account.cs)
  retain their immutable IDs. Proposed
  `PocketMonkey.Storage.Entities.MemberAccountAssignment`
  (`backend/PocketMonkey.Storage/Entities/MemberAccountAssignment.cs`) joins
  these identities; mapping belongs in existing
  [`PocketMonkey.Storage.PocketMonkeyDbContext`](../../backend/PocketMonkey.Storage/PocketMonkeyDbContext.cs).
- Proposed `PocketMonkey.Host.Services.MemberAccountAssignments`
  (`backend/PocketMonkey.Host/Services/MemberAccountAssignments.cs`) owns
  assignment reads and changes; a shared backend access predicate should be
  used by account-scoped reads. Existing
  [`PocketMonkey.Host.Services.UserAdministration`](../../backend/PocketMonkey.Host/Services/UserAdministration.cs)
  must coordinate any agreed role/disablement policy.
- Existing
  [`AccountEndpoints`](../../backend/PocketMonkey.Host/Endpoints/AccountEndpoints.cs),
  [`AccountImageEndpoints`](../../backend/PocketMonkey.Host/Endpoints/AccountImageEndpoints.cs),
  [`TransactionEndpoints`](../../backend/PocketMonkey.Host/Endpoints/TransactionEndpoints.cs)
  and [`AllowanceEndpoints`](../../backend/PocketMonkey.Host/Endpoints/AllowanceEndpoints.cs)
  in `PocketMonkey.Host.Endpoints` need scoped reads; existing
  [`UserEndpoints`](../../backend/PocketMonkey.Host/Endpoints/UserEndpoints.cs)
  would expose Manager-only assignment management. Existing account, ledger,
  image and allowance services must apply the predicate at the data access
  boundary, including the list query.
- The affected frontend callers include
  [`Users`](../../web/src/app/components/users/users.ts),
  [`UsersService`](../../web/src/app/services/users/users.service.ts),
  [`Overview`](../../web/src/app/components/overview/overview.ts) and
  [`AccountsService`](../../web/src/app/services/accounts/accounts.service.ts).
  Final control placement and interaction are design-review decisions, not
  implied by these references.

### Proposed data and persistence

- Store non-null immutable `UserId` and `AccountId` foreign keys with a
  composite primary key `(UserId, AccountId)` and an account-leading index for
  cleanup/lookups. Foreign keys reject orphan assignments; duplicate pairs are
  impossible. Assignment itself has no monetary amount or timestamp. Agree
  separately on audit-event contents, retention and deletion behavior before
  fixing the schema or contract.
- Assignment replacement is one atomic transaction: validate the target Member
  and all selected account IDs before changing anything, then commit the
  complete set and any agreed audit record together. Empty selection removes
  all assignments. Concurrent Manager edits must not silently overwrite an
  unseen change; propose a version/precondition and conflict response, with its
  precise representation to be reviewed. A retry after a lost response may
  conflict on the old version: reload the current set before retrying instead
  of overwriting intervening edits. No duplicate audit event should result from
  an unchanged set.
- On 2026-10-29 the user chose to retain assignments when a Member becomes a
  Manager and restore their effect if the user later becomes a Member again.
  Managers still have unrestricted access while in that role. The user also
  chose to retain assignments on disablement and restore access on re-enabling;
  disabled users cannot access accounts. These policies do not approve the
  full R7 proposal. The user also chose to preserve assigned Members'
  direct-link read access during account retirement; retired accounts remain
  hidden from the overview. Account deletion must not leave assignment
  orphans; reactivation behavior remains open below. Job scheduling, retry
  identities and financial records are unaffected; no new hosted job is proposed.
- Add a Storage migration only after approval. On 2026-10-29 the user chose to
  start existing Members with **no assignments** on upgrade, rather than
  backfill all accounts. This restricts existing Member access immediately
  until a Manager assigns accounts; it does not approve the full R7 proposal.
  Verify this behavior with a populated database upgrade, foreign-key checks
  and failure rollback; take a full backup before upgrading. An older binary
  cannot enforce this new visibility rule, so rollback requires an explicitly planned
  maintenance/restore procedure rather than assuming a schema downgrade is
  safe.
- [Portable financial recovery](../../docs/ADR/ADR-0021-portable-financial-recovery.md)
  excludes user identities and is not a full backup. Decide how assignments
  are handled after financial-only recovery without guessing identity matches;
  full-volume backup/restore must preserve them.

### Proposed API and callers

- Keep `GET /api/accounts` as the active-account overview list; filter it to
  assigned accounts for Members and leave Manager results unchanged.
  `GET /api/accounts/{id}`, `/image`, `/transactions` and `/allowance` must
  enforce the same assignment boundary, including assigned retired direct
  links. Propose `404` with existing `not_found` semantics for
  inaccessible and nonexistent account IDs alike, to avoid revealing existence.
  Existing Manager-only archived list and business-write routes stay restricted.
- Proposed Manager-only `GET /api/users/{id}/account-assignments` returns
  `{ accountIds: string[], version: string }`; proposed `PUT` on the same
  route accepts `{ accountIds: string[], version: string }` and returns the
  resulting set and new version. The initial version for an empty set is still
  required. These routes and DTO names
  (`PocketMonkey.Host.Contracts.Users.MemberAccountAssignmentsResponse` and
  `UpdateMemberAccountAssignmentsRequest`, both **proposed**) are review
  candidates, not current contracts.
- Require ready authenticated Manager authorization and antiforgery on writes;
  anonymous requests retain authentication behavior, Member management calls
  return `403`, nonexistent users/accounts return `404`, malformed or duplicate
  IDs return `400`, and stale versions return `409` without partial updates.
  Define stable error codes and the response for a non-Member target during
  review. The backend must enforce authorization even for forged IDs and direct
  calls.
- On 2026-10-29 the user chose user administration as the place where a
  Manager selects accounts for each Member. The Manager UI needs an accessible
  multi-account assignment interaction there, with save, validation, failure
  and retry states; its detailed design is not yet approved. The Member
  overview must distinguish its no-assignment message from the Manager's existing
  no-accounts/create-first state. Provide English and German; do not show a
  no-assignment message for loading or failed requests. Resolve the empty-list
  state for Members with only retired assignments before claiming that none
  are assigned. The precise wording and interaction details require design
  review.

### Architecture and design gates

- [ADR-0003](../../docs/ADR/ADR-0003-shared-instance-access.md) explicitly
  prohibits per-account assignments and grants Members all-account reads.
  [ADR-0009](../../docs/ADR/ADR-0009-shared-accounts.md) likewise grants
  ready Members all-account and retired direct-link reads. The requested model
  conflicts with both. If agreed, amend these authoritative records in place,
  with dated rationale, before implementation; do not treat this draft as
  approval. Review [ADR-0014](../../docs/ADR/ADR-0014-private-account-images.md)
  for its ready-user image-read rule, and align any affected records and product
  documentation, including the bilingual About privacy explanation.
- Preserve [ADR-0002](../../docs/ADR/ADR-0002-application-boundaries.md),
  [ADR-0008](../../docs/ADR/ADR-0008-local-authentication.md) and
  [ADR-0017](../../docs/ADR/ADR-0017-backend-project-boundaries.md).
  [ADR-0013](../../docs/ADR/ADR-0013-wireframes-and-click-prototypes.md)
  requires any structural assignment UI change to pass wireframe review before
  prototype review; the overview's state/text change also requires prototype
  review. Both must be approved at their current revisions before Angular
  implementation. Existing approvals are historical, not approval of this work.

### Decisions still needed

1. What happens to assignments on account reactivation and permanent deletion?
   May a Manager assign a retired account?
2. Should financial-only recovery leave assignments empty for Managers to
   recreate? What audit detail and retention are required for changes?
3. What are the exact localized empty-state and error messages? Review the
   access model before finalizing the wireframe and prototype.

### Verification after approval

- Real-stack browser coverage: Manager assigns multiple accounts, removes one
  and all, handles stale edits and failed saves; Member sees only assigned
  cards, the informative empty state when none are visible, and no write
  controls. Check Manager access, accessible interactions and phone layout.
- API and SSR coverage: separate Members with overlapping/disjoint assignments,
  immediate grant/revocation with existing sessions, promotion and subsequent
  demotion and disablement/re-enablement with retained assignments, direct IDs for details,
  image, history and allowance, inaccessible/nonexistent responses, retired
  accounts under the agreed policy, anonymous and forged requests, CSRF, and
  concurrent request/cache isolation. Reconcile existing shared-read regression
  tests with the approved rule.
- Real SQLite integration checks: pair uniqueness, foreign keys, deletion and
  lifecycle behavior, atomic validation/audit rollback, competing edits,
  restart persistence and populated migration with the agreed empty-assignment policy.
  Check full backup/restore and the agreed financial-recovery boundary. Validate
  both translation catalogs and review localized layouts separately under
  [ADR-0005](../../docs/ADR/ADR-0005-e2e-first-verification.md).
