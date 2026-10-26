# Wiki Documentation Proposal

Date: 2026-10-26. Revision: R6. Status: first content batch, exact bootstrap adoption, automatic publisher and commit/push approved; first real publication awaiting verification.

Approved direction: application-repository Markdown is authoritative; the GitHub
Wiki is a published view, not a separately maintained copy. The owner approved
the page structure, English documentation and automatic publication from `main`.
The initially empty Wiki now has its owner-created bootstrap page. Secret metadata
and Wiki initialization are verified. The hosted receive-pack dry-run passed;
actual publication remains unverified. The first source pages, local preview,
guarded publisher and automatic workflow are implemented. The owner approved
the complete reviewed batch, exact bootstrap adoption and commit/push on
2026-10-26. First actual publication must still be verified after the push.

Follow [GitHub delivery](../../docs/ADR/ADR-0006-github-delivery.md). GitHub describes
[multiple Wiki editing methods](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages)
and [Wiki links and images](https://docs.github.com/en/communities/documenting-your-project-with-wikis/editing-wiki-content).

## Ownership and Layout

- Use `docs/wiki/` for canonical reader-facing English Markdown, with flat filenames
  matching stable Wiki page names. Use ordinary relative Markdown links so the
  source is readable in the application repository too.
- Keep ADRs, design sources, legal originals, implementation scripts and test
  fixtures in their existing repository locations. Link to them instead of
  creating another authoritative copy in the Wiki.
- Keep remaining-work checklists, unresolved policies and acceptance evidence
  in the plans. Completed implementation chronology is not a user guide; Git
  preserves historical text when redundant documents are eventually retired.
- Keep the root README as the short introduction and entry point. Release
  bundles retain instructions matching their exact image; a changing Wiki page
  does not replace those assets or certify production readiness.
- Only publish pages that describe implemented and checked behavior. The
  Codespaces pages depend on their configurations being implemented and tested.

## Approved Page Index

The page names below are approved Wiki slugs, not necessarily existing files or
published links. Only Home, Getting-Started and Configuration currently have sources.
Group them in a generated sidebar rather than introducing nested Wiki directories.

| Group | Page | Contents |
| --- | --- | --- |
| Start | Home | Product purpose, supported scope, beta limitations and navigation |
| Start | Getting-Started | Select a released image, persistent storage, HTTPS, first Manager and first sign-in |
| Use | Accounts-and-Transactions | Shared accounts, signed opening balances, images, deposits, withdrawals, history and retention |
| Use | Monthly-Allowances | Configuration, effective months, catch-up, execution status and retry behavior |
| Use | Users-and-Access | Manager/Member permissions, user administration, password changes and operator recovery |
| Operate | Configuration | ENV reference, validation, timezone/language/currency separation and trusted proxies |
| Operate | Backup-Restore-and-Upgrades | Full-volume backup/restore, upgrade precautions and the separate financial export/import workflow |
| Operate | Troubleshooting | Logs, readiness, HTTPS/cookies, permissions, mounts and safe diagnostics |
| Test | Codespaces-Image-Testing | Explicit release/digest selection, manual startup, private HTTPS, Manager setup, retained data and explicit reset |
| Develop | Codespaces-Development | Full toolchain, dependency restore, manual startup, private HTTPS, browser E2E and separate development data |
| Develop | Development-and-Testing | Local setup, runtime boundaries, locked builds, focused checks, smoke/full E2E and failure diagnostics |
| Develop | Translation-Contributions | Language registration, catalogs, placeholders, completeness and verification |
| Maintain | Builds-and-Releases | Protected tags, draft review, same-artifact publishing, approval and immutable version recovery |

Start with cohesive pages; split a page later only when its actual content warrants
it. Do not reproduce the development guide's dated headings as Wiki pages.

## Source-to-Page Mapping

Extraction means rewriting for the reader, checking commands and linking the
authoritative contract. It does not mean copying plan prose and completion boxes.

| Existing Source | Proposed Destination and Treatment |
| --- | --- |
| [Root README](../../README.md) | Retain a short product introduction and tested quick-start; link detailed guides after they are published |
| [Development guide](../../docs/development.md) | Extract current setup, operations and verification procedures into the relevant pages; separate dated delivery evidence from instructions |
| [Migration overview](README.md) | Keep remaining work and acceptance ownership; do not publish milestone history as product documentation |
| [Guardrails](00-guardrails.md) | Summarize contributor verification in Development-and-Testing; retain repository instruction/ADR ownership links |
| [Runtime stack](01-runtime-stack.md) | Summarize supported deployment limits and development boundaries; keep architectural decisions in ADRs |
| [Authentication](02-authentication-authorization.md) | Rewrite practical access/password behavior for Users-and-Access; keep security invariants linked to ADRs and implementation |
| [UX/UI plan](02b-ux-ui-design.md) | Link repository design references from developer guidance; keep design sources and unfinished review gates out of the Wiki |
| [Business feature overview](03-ui-business-logic.md) | Use supported product boundaries in Home; retain incomplete work in the plan |
| [Accounts](03a-accounts.md), [opening balances](03b-ledger-opening-balances.md), [transactions](03c-transactions.md), [images](03d-account-images.md) | Combine implemented reader-facing behavior in Accounts-and-Transactions, without implementation chronology |
| [Allowance configuration](03e-allowance-configuration.md), [allowance execution](03f-allowance-execution.md) | Combine in Monthly-Allowances; explain month boundaries, catch-up and failure states without promising deferred behavior |
| [Lifecycle](03h-lifecycle.md) | Extract relevant retention/About/maintenance explanations; retain unfinished work, review decisions and acceptance evidence in the repository |
| [Operations](04-operations-cutover.md) | Extract deployment, backup/recovery and troubleshooting procedures; retain real-host acceptance and production-cutover decisions in the plan |
| [Builds and releases](builds-releases.md) | Extract maintainer procedures into Builds-and-Releases; retain unfinished verification and acceptance items in the plan |
| [Configuration](configuration.md) | Move the maintained ENV contract and rules to Configuration after approval; leave a concise plan pointer until all references are updated |
| [Localization](localization.md) | Explain user selection in Users-and-Access and instance defaults in Configuration; extract contributor steps into Translation-Contributions |
| [Testing](testing.md) | Extract reproducible strategy/commands into Development-and-Testing; retain current evidence and open acceptance gates in the plan |
| Codespaces discussion | Add the two new guides only alongside validated configurations; there is no existing implementation to document as complete |

Before extraction, reconcile stale statements against actual release evidence.
The README now links the published beta images and the new Getting Started guide;
older plans still contain dated failure diagnoses. Publication alone does not
prove real-host operation, recovery or production acceptance.

Retire or shorten a source document only after its useful content is covered,
local links and anchors are migrated, and remaining acceptance ownership is
explicit. Keep useful compatibility pointers during the transition. Do not
silently remove ADR or repository-instruction references to old plan locations.

## Publication Design

Selected mode: automatically publish validated documentation changes from `main`.
Changes to canonical pages, selected assets, navigation and publishing tooling
must receive validation before publication. PR validation remains read-only;
publishing must not execute untrusted contribution code with write credentials.
Retain local dry-run generation for review and troubleshooting, not as a second
independently maintained publishing process.

Do not assume the repository `GITHUB_TOKEN` can push the separate Wiki Git
repository. Verify the supported authentication and minimum permissions before
enabling hosted publishing. The owner approved the narrowly scoped trial below;
no broader credential or alternative authentication mechanism is approved.

### Approved Authentication Trial

- Try a dedicated fine-grained PAT restricted to `eG-dev/MONkEY`, with repository
  Contents read/write and automatically included Metadata read access. Use an
  expiration; do not add workflow, package or administration permissions.
- The owner creates the token and enters it directly into the GitHub Actions
  secret `WIKI_PUBLISH_TOKEN`. Never request or print the token in chat or logs.
  Do not reuse the owner's local GitHub CLI OAuth credential in Actions.
- The agreed initialization instruction was a Home page stating:
  "Documentation is maintained in the application repository; automated publishing
  is being configured." Treat this agreed bootstrap text as intended for later
  adoption by the generated Home page, not as approval to overwrite other content.
  The actual owner-created page instead contains GitHub's default welcome text.
  The approved first adoption is restricted to its exact SHA-256 below.
- Check Git authentication with a non-mutating push dry-run against a generated
  candidate commit. Anonymous clone success alone does not establish write access.
  A dry-run does not certify the full publishing path; the first approved real
  publication remains a separate acceptance check.
- If Wiki Git rejects this token type, stop and discuss a supported alternative.
  Do not silently switch to a classic PAT, expand scope or request another secret.

### Current Access Verification

- Confirmed that `WIKI_PUBLISH_TOKEN` exists by reading its name and update time
  only. Its value is not accessible to local tooling and has not been requested.
- Confirmed that the Wiki has an initial commit and default branch `master`.
  Read access does not establish permission to push with the new token.
- Prepared the manual, main-only [Wiki access check](../../.github/workflows/wiki-access-check.yml).
  It grants no `GITHUB_TOKEN` permissions, uses a disposable local candidate
  commit, and only attempts a push dry-run. It does not publish pages.
- The [workflow checker](../../scripts/verify-workflows.mjs) executes that exact
  shell against a disposable bare Wiki repository. Valid-fixture and missing-token
  cases pass, and all remote refs remain unchanged.
- With explicit owner approval, committed/pushed `8b05435` and ran the
  [hosted check](https://github.com/eG-dev/MONkEY/actions/runs/40293841009): success.
  Wiki HEAD remained `e0ddae0c1fc61f9252352750c89194925c657103` on `master`.
  The dedicated fine-grained PAT was accepted for the non-mutating receive-pack
  dry-run; no broader scope or alternate credential is needed for this trial.
- The default bootstrap Home bytes have SHA-256
  `2391fa8ef920f50b1b0bd8ba63f89a27cc85e8919057446b03a235d7c91bb717`.
  [The manifest](../../docs/wiki/navigation.json) permits only that exact adoption,
  not arbitrary Home/sidebar/footer overwrites. First real publication is still open.

### Generation and Links

- Use an explicit page/navigation manifest, stable page slugs and deterministic
  output. Generate Home/sidebar/footer only where ownership is agreed.
- Parse Markdown links and images structurally. Translate links between managed
  source pages into Wiki URLs while preserving fragments and link text. Do not
  rewrite examples inside code blocks.
- Link non-published repository material, including ADRs and scripts, to the
  exact source commit used for publication. Keep external URLs unchanged.
- Copy only explicitly selected, rights-cleared image assets into a managed Wiki
  asset directory and rewrite their references. Do not copy the whole design
  tree, private screenshots or legal-original collection as a convenience.
- Include the source commit, an Edit Source link and applicable release scope.
  Label development-only guidance distinctly; the Wiki's current branch is not
  tied to the application's release tags.

### Protect Existing Wiki Content

- The initially empty Wiki now contains the owner's bootstrap Home. Check its
  exact approved-for-review hash before adoption. Any other existing content is
  unmanaged and must not be implicitly adopted.
- Abort on an existing destination-page or asset collision until ownership or
  import is approved, including Home, sidebar and footer collisions.
- Track managed paths and last-published content hashes. Refuse to overwrite a
  managed page edited directly in the Wiki; reconcile that edit back into the
  repository first. Leave all unmanaged pages and assets unchanged.
- Permit deletions only for previously managed paths shown in the reviewed
  publication diff. Never mirror-delete the entire Wiki or force-push its history.
- Dry-run generation and show additions, changes and removals before publication.
  An unchanged publication is a no-op. Stop on concurrent remote changes rather
  than overwriting them; keep the source commit in the Wiki commit message.
- PR checks remain read-only. Automatic publication uses only approved trusted
  `main` source and never runs PR-controlled code with Wiki-write
  credentials. Wiki publishing must not require image-release credentials.

## Rollout and Verification

1. Completed: the owner approved the page structure, repository source location,
  English documentation and automatic publication from `main`.
2. Completed: initialization, dedicated secret and the approved hosted credential
  dry-run, with no remote changes.
3. Locally implemented: [Home](../../docs/wiki/Home.md),
  [Getting Started](../../docs/wiki/Getting-Started.md) and
  [Configuration](../../docs/wiki/Configuration.md). The beta.2 deployment bundle's
  checksum, file layout and Compose configuration were checked. The ENV plan now
  points to the canonical guide while retaining acceptance ownership and anchors.
  The owner subsequently approved direct Compose settings as the default, with
  environment-file interpolation optional. Checked-in examples and future release
  bundles use direct values; published beta.2 assets remain immutable and the
  guide explains local adaptation while preserving image digest and data volume.
4. Locally implemented: structural Markdown generation, explicit assets/navigation,
  ownership hashes and guarded trusted-main publication. Read-only CI checks and
  the [automatic workflow](../../.github/workflows/wiki-publish.yml) are prepared.
5. Passed locally: focused rendering/ownership/real-Git regressions, including
  direct edits, collisions, symlinks, no-ops, managed deletions, unmanaged-file
  preservation, stale sources and concurrent Wiki commits. Source documentation
  and workflow safety checks pass. A read-only clone using the publisher's exact
  Git-byte settings also passed bootstrap adoption; its checkout and remote Wiki
  HEAD remained unchanged. The owner approved the generated content, exact
  bootstrap adoption, automatic workflow and commit/push on 2026-10-26.
  Verify the resulting first real publication before marking it complete.
6. Add the remaining pages incrementally. Add Codespaces guides with their tested
   configurations, and shorten the old guide/plans only after coverage is checked.

The agreed Codespaces direction is two separate selectable profiles: published
image testing and full-stack development with browser E2E tools. Both use manual
application startup, separate retained data, interactive Manager setup, private
HTTPS and defaults of German, `EUR` and `Europe/Berlin`. The image profile selects a release
explicitly and pins its digest; development restores dependencies on creation.
No billable Codespaces, application environments or publishing credentials are
created by this documentation proposal.

## Decisions Still Needed

- Verify the approved first actual publication and source/image/navigation links.
- Continue the remaining approved pages incrementally; implement and verify both
  Codespaces configurations before documenting them as available.