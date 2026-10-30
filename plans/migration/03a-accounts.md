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

## Member Account Assignment — Backend/Data Proposal R9

**Backend/Data Proposal R9 approved on 2026-10-30; not implemented.** This change
intentionally differs from the implemented scope and acceptance results above.
The user explicitly approved the whole current concept, including the R9 data,
concurrency, lifecycle and API/error contracts. Backend implementation is
authorized within this scope; assignment UI wireframe and prototype approval
remain separate prerequisites for Angular changes. Confirmed architectural
requirements are recorded in ADR-0002, ADR-0003, ADR-0009, ADR-0014 and ADR-0021.
Approval is not evidence that production access enforcement has changed.

### Purpose and boundaries

- Members should read only accounts explicitly assigned to them. A Member can
  have multiple assigned accounts; an unassigned Member sees an empty overview
  explaining that no accounts are currently assigned and a Manager must assign
  one. Managers manage assignments and retain access to all accounts and
  business writes. Member preferences do not grant writes.
- Accounts remain shared instance resources, not individually owned accounts or
  tenants. On 2026-10-29 the user confirmed that multiple Members may be assigned
  the same account as well as a Member having multiple accounts. This does not
  approve the full proposal.
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
  Add proposed non-null `ApplicationUser.AccountAssignmentsVersion`: a random
  GUID formatted as 32 lowercase hexadecimal characters, initialized separately
  for every existing/new user, independent of Identity's security/concurrency
  stamps. It is current-state concurrency metadata, not change history.
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
  impossible. Assignment itself has no monetary amount or timestamp. On
  2026-10-30 the user explicitly rejected storing assignment changes: keep only
  the current assignments and concurrency metadata. No assignment audit events,
  actor/change records, assignment history, retention policy or retention job.
  Existing financial, account-lifecycle and user-administration audit behavior
  is unchanged; do not attach assignment diffs to those events.
- Assignment replacement is one atomic transaction: validate the target Member
  and all selected account IDs before changing anything, then commit the
  complete set and its version together. Empty selection removes all assignments.
  The version is an internal check that another Manager has not changed the
  selection since it was loaded; no version control is displayed in the UI.
  Compare the submitted version inside the same serialized write transaction.
  An outdated version returns a conflict without changes. Generate a fresh
  random version only when the set actually changes; a valid unchanged save
  returns the existing version. A retry after a lost response may conflict on
  the old version: reload before retrying rather than overwrite newer changes.
- On 2026-10-29 the user chose to retain assignments when a Member becomes a
  Manager and restore their effect if the user later becomes a Member again.
  Managers still have unrestricted access while in that role. The user also
  chose to retain assignments on disablement and restore access on re-enabling;
  disabled users cannot access accounts. These policies do not approve the
  full proposal. On 2026-10-30 the user allowed the simpler retirement policy:
  remove all assignments to an account atomically when retiring it, updating
  each affected user's assignment version in that transaction. Reactivation
  restores no assignments; a Manager must assign the account again. This
  replaces the 2026-10-29 retained-assignment/direct-link policy: Members lose
  direct-link access on retirement; Managers keep their existing retired reads.
  Retired accounts are hidden from assignment selection and cannot be assigned;
  enforce this on the backend, including retirement between selection and save.
  Permanent deletion also removes any assignments atomically, advances affected
  user versions and leaves no orphans. No hidden assignment set needs merging
  when saving active-account selections. Job scheduling, retry identities and
  financial records are unaffected; no new hosted job is proposed.
- Add a Storage migration only after approval. On 2026-10-29 the user chose to
  start existing Members with **no assignments** on upgrade, rather than
  backfill all accounts. This restricts existing Member access immediately
  until a Manager assigns accounts; it does not approve the full proposal.
  Verify this behavior with a populated database upgrade, foreign-key checks
  and failure rollback; take a full backup before upgrading. An older binary
  cannot enforce this new visibility rule, so rollback requires an explicitly planned
  maintenance/restore procedure rather than assuming a schema downgrade is
  safe.
- [Portable financial recovery](../../docs/ADR/ADR-0021-portable-financial-recovery.md)
  excludes user identities and is not a full backup. On 2026-10-30 the user
  confirmed that financial-only recovery leaves assignments empty for Managers
  to recreate, without guessing identity matches. Full-volume backup/restore
  must preserve them. This isolated decision does not approve the proposal.

### Proposed API and callers

- Keep `GET /api/accounts` as the active-account overview list; filter it to
  assigned accounts for Members and leave Manager results unchanged.
  `GET /api/accounts/{id}`, `/image`, `/transactions` and `/allowance` must
  enforce the same assignment boundary. Members cannot read retired accounts,
  including by direct link. Propose `404` with existing `not_found` semantics for
  inaccessible and nonexistent account IDs alike, to avoid revealing existence.
  Existing Manager-only archived list and business-write routes stay restricted.
- Proposed Manager-only `GET /api/users/{id}/account-assignments` returns
  `{ accountIds: string[], version: string }`; proposed `PUT` on the same
  route accepts `{ accountIds: string[], version: string }` and returns the
  resulting set and version, sorting IDs consistently. The initial version for
  an empty set is required. `accountIds` contains the complete selected set of
  active account IDs, not an incremental patch. These routes and DTO names
  (`PocketMonkey.Host.Contracts.Users.MemberAccountAssignmentsResponse` and
  `UpdateMemberAccountAssignmentsRequest`, both **proposed**) are review
  candidates, not current contracts.
- Require ready authenticated Manager authorization and antiforgery on writes;
  anonymous requests retain authentication behavior, Member management calls
  return `403`, and all rejected saves leave the current assignments unchanged.
  Use the existing JSON error shape `{ code: string }` and the proposed mapping
  below. Validate request shape first, then target existence/role, then version,
  then selected account existence/status, inside the write transaction. The
  backend must enforce authorization even for forged IDs and direct calls.
- Assignment routes accept disabled Members so Managers can prepare their
  assignments before re-enabling them. A Manager target returns the non-Member
  conflict; retained assignments remain stored but cannot be edited until that
  user is a Member again. Role and disablement changes alone do not change the
  assignment version; role/eligibility is always checked on each save.

| Condition | HTTP status | Proposed code |
| --- | --- | --- |
| Target user or any selected account does not exist | 404 | `not_found` |
| Null/missing account list, malformed or duplicate IDs, missing/malformed version | 400 | `invalid_account_assignments` |
| Target user is not currently a Member (GET or PUT) | 409 | `assignment_target_not_member` |
| Submitted version is outdated | 409 | `account_assignments_conflict` |
| A selected account is retired, including retirement during editing | 409 | `account_not_assignable` |

The list of selected IDs and its version must be read from one consistent
database snapshot. Retirement/deletion invalidates an open editor's version
when it removes any of that user's assignments; otherwise selecting a newly
retired account returns `account_not_assignable`. Concurrent role changes and
assignment writes must serialize so target validation cannot race the commit.
- On 2026-10-29 the user chose user administration as the place where a
  Manager selects accounts for each Member. The Manager UI needs an accessible
  multi-account assignment interaction there, with save, validation, failure
  and retry states; its detailed design is not yet approved. The Member
  overview must distinguish its no-assignment message from the Manager's existing
  no-accounts/create-first state. Provide English and German; do not show a
  no-assignment message for loading or failed requests. Use the empty-overview
  wording below; retirement now removes assignments rather than leaving a
  hidden retired-only selection.
  On 2026-10-30 the user delegated initial wording for later correction in the
  click prototype; the wording and interaction details are not design approval.

### Draft localized wording

Carry these candidates into the wireframe/prototype review, not production
catalogs yet. Existing Manager empty-state wording remains unchanged.

| State | English | German |
| --- | --- | --- |
| Empty Member overview: heading | No accounts to show | Keine Konten anzuzeigen |
| Empty Member overview: body | No active accounts are assigned to you. Ask a Manager if you need access to an account. | Dir sind keine aktiven Konten zugewiesen. Bitte einen Manager, wenn du Zugriff auf ein Konto brauchst. |
| Assignment control label | Assigned accounts | Zugewiesene Konten |
| No active accounts available for selection | No active accounts available. | Keine aktiven Konten verfügbar. |
| Overview load failure | Accounts could not be loaded. Please try again. | Die Konten konnten nicht geladen werden. Bitte versuche es erneut. |
| Assignment save failure | Assignments could not be saved. Please try again. | Die Zuweisungen konnten nicht gespeichert werden. Bitte versuche es erneut. |
| Stale assignment version | These assignments have changed. Reload them before saving again. | Diese Zuweisungen wurden geändert. Lade sie neu, bevor du erneut speicherst. |
| Account retired or deleted since selection | An account is no longer available for assignment. Reload the account list and check your selection. | Ein Konto kann nicht mehr zugewiesen werden. Lade die Kontenliste neu und prüfe deine Auswahl. |
| Target is no longer a Member | Accounts can only be assigned to Members. Reload the user list. | Konten können nur Mitgliedern zugewiesen werden. Lade die Benutzerliste neu. |
| Inaccessible or nonexistent account | Account not found. | Konto nicht gefunden. |

The generic save-failure wording must not promise that nothing changed after a
lost response; reload before retrying as described above. Keep the same account
not-found wording for inaccessible and nonexistent IDs.

### Architecture and design gates

- On 2026-10-30 the user explicitly requested alignment of the access ADRs.
  [ADR-0003](../../docs/ADR/ADR-0003-shared-instance-access.md) now defines
  assigned-active-account Member reads, Manager administration and no assignment
  audit/history. [ADR-0009](../../docs/ADR/ADR-0009-shared-accounts.md) removes
  assignments on retirement/deletion and requires reassignment on reactivation.
  [ADR-0014](../../docs/ADR/ADR-0014-private-account-images.md) applies that same
  boundary to images. These are authoritative requirements, not a claim that
  the application already enforces them.
- Before delivery, align repository instructions and product/operator
  documentation with the implemented access rule. Change the bilingual About
  privacy explanation alongside verified backend enforcement, not earlier:
  current runtime wording still describes all-account reads. The following
  English and German wording was explicitly approved on 2026-10-30. English:
  "Managers can read all accounts. Members can read only active
  accounts assigned to them by a Manager. Accounts remain shared instance
  resources, not individually owned private spaces." German: "Manager können
  alle Konten lesen. Mitglieder können nur aktive Konten lesen, die ihnen ein
  Manager zugewiesen hat. Konten bleiben gemeinsam genutzte Ressourcen der
  Instanz und sind keine privaten Bereiche im Eigentum einzelner Benutzer."
  Preserve the warning about host administrators and storage/backup access.
- Preserve [ADR-0002](../../docs/ADR/ADR-0002-application-boundaries.md),
  [ADR-0008](../../docs/ADR/ADR-0008-local-authentication.md) and
  [ADR-0017](../../docs/ADR/ADR-0017-backend-project-boundaries.md).
  [ADR-0013](../../docs/ADR/ADR-0013-wireframes-and-click-prototypes.md)
  requires any structural assignment UI change to pass wireframe review before
  prototype review; the overview's state/text change also requires prototype
  review. Both must be approved at their current revisions before Angular
  implementation. Existing approvals are historical, not approval of this work.

### Review and revision history

- R8 received an "approved, lets proceed" response on 2026-10-30, followed by
  clarification of its remaining specification gaps. No implementation followed.
- R9 records the subsequent explicit rejection of assignment auditing and the
  simpler removal-on-retirement policy. It proposes the concrete version and
  API/error contracts above for review; no audit-retention question remains.
- On 2026-10-30 the user authorized rewriting ADR-0003, ADR-0009 and ADR-0014 to
  the current requirements; the records and index were aligned in place with
  dated rationale. R9's concrete technical contracts still await explicit
  backend/data approval before production implementation. The separate
  wireframe and prototype gates remain; wording will be reviewed in the prototype.
- On 2026-10-30 the user explicitly approved the bilingual About privacy wording
  in the architecture section above. Apply it alongside verified backend access
  enforcement. This copy approval does not approve the remaining R9 technical
  contracts, assignment UI artifacts or other draft localized wording.
- On 2026-10-30 the user explicitly stated "I approve the whole concept",
  approving Backend/Data Proposal R9, including its current-state-only storage,
  concurrency token, atomic lifecycle changes, scoped reads and API/error
  contracts. Earlier pending backend-review notes above are historical. The
  assignment wireframe and click prototype still require their own explicit
  approvals before Angular implementation.
- On 2026-10-30 the user explicitly approved Administration Users wireframe R2
  after editing its assignment connector. Review colors were cleared and the
  synchronized preview inspected without altering that routing. The Member
  Account Assignment R2 click prototype is now drafted and verified standalone
  and through the integrated entry; it awaits explicit prototype approval.
  See the [design review record](../../docs/design/README.md#member-account-assignment-r2-2026-10-30).
- Later on 2026-10-30 the user requested a dedicated assignment tab instead.
  [Wireframe R3](../../docs/design/README.md#member-account-assignment-r3-2026-10-30)
  now separates the Member-only list from Users and synchronizes Profile tabs.
  Note arrangement and explicit R3 wireframe approval are pending before revising
  the click prototype. The earlier R2 approval does not approve R3.

### Verification after approval

- Real-stack browser coverage: Manager assigns multiple accounts, removes one
  and all, handles stale edits and failed saves; Member sees only assigned
  cards, the informative empty state when none are visible, and no write
  controls. Cover non-Member target conflicts and disabled-Member assignment
  preparation. Check Manager access, accessible interactions and phone layout.
- API and SSR coverage: separate Members with overlapping/disjoint assignments,
  immediate grant/revocation with existing sessions, promotion and subsequent
  demotion and disablement/re-enablement with retained assignments, direct IDs for details,
  image, history and allowance, inaccessible/nonexistent responses, retired
  accounts becoming inaccessible to Members on retirement, rejection of retired
  selections (including retirement during editing), fresh assignment required
  after reactivation, anonymous and forged requests, CSRF, and
  concurrent request/cache isolation. Reconcile existing shared-read regression
  tests with the approved rule.
- Real SQLite integration checks: pair uniqueness, foreign keys, deletion and
  lifecycle behavior, atomic validation rollback, no assignment audit/history
  writes, competing edits and serialized role/lifecycle changes, unchanged-save
  version stability, restart persistence and populated migration with per-user
  initial versions and the agreed empty-assignment policy.
  Check full backup/restore and the agreed financial-recovery boundary. Validate
  both translation catalogs and review localized layouts separately under
  [ADR-0005](../../docs/ADR/ADR-0005-e2e-first-verification.md).
