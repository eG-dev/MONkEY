# Step 3H: management and lifecycle completion

Status: not started. Depends on the preceding features affected by each lifecycle
operation. Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

Complete remaining profile, instance-settings, legal, and lifecycle workflows
without losing financial/audit history. Review this backlog after earlier steps;
deliver each remaining workflow separately rather than treating it as one large task.

## Decisions before implementation

- Agree account archival and user deletion/anonymization semantics, including historical actor readability.
- Proposed default: retain financial history with no automatic twelve-month deletion. Resolve retention before adding cleanup jobs.
- Review self-hosted terms/privacy content and acceptance requirements rather than copying cloud wording unchanged.
- Agree which sensitive actions require confirmation and re-authentication.

## Work

- Review existing milestone 2 user/role administration, password flows, last-manager protection, and personal language preferences; implement only remaining agreed profile/management gaps.
- Preserve language selection before login and saved preferences for both roles; do not rebuild the foundation selector or grant business writes through personal preferences.
- Add agreed instance-settings workflows, not tenant creation/selection/invitation/deletion or email settings.
- Deliver reviewed legal content/acceptance flows and agreed archive/anonymization workflows with German/English UI.
- Protect ledger/audit integrity and immutable actor IDs; expose only explicitly agreed destructive actions with suitable confirmations/re-authentication.

## Acceptance gate

- [ ] Each newly delivered lifecycle workflow has real-stack browser coverage for both roles/languages and direct API denials.
- [ ] Archival/anonymization preserves required financial history, report integrity, and historical attribution.
- [ ] Last-manager protection remains valid, including concurrency; retention behavior follows the approved policy.
- [ ] No tenant or email assumptions remain in the agreed replacement workflows.

Next: [operations and cutover](04-operations-cutover.md); outstanding release and
deployment gates are not waived by completion of these business features.