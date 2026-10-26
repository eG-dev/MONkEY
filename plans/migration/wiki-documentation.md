# Wiki Documentation Proposal

Date: 2026-10-26. Revision: R7. Status: first batch published and independently verified; experimental Codespaces profiles/guides implemented locally, browser installation and hosted checks open.

Approved direction: application-repository Markdown is authoritative; the GitHub
Wiki is a published view, not a separately maintained copy. The owner approved
the page structure, English documentation and automatic publication from `main`.
The initially empty Wiki now has its owner-created bootstrap page. Secret metadata
and Wiki initialization are verified. The hosted receive-pack dry-run passed;
actual publication remains unverified. The first source pages, local preview,
guarded publisher and automatic workflow are implemented. The owner approved
the complete reviewed batch, exact bootstrap adoption and commit/push on
2026-10-26. Commit `283b9a4` was pushed and the
[automatic publication](https://github.com/eG-dev/MONkEY/actions/runs/40300863112)
succeeded. An independent clone verified the source revision and every managed
file hash at Wiki commit `e942e1f322f5ea59d3ad877c148297ed2a725900`.

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
published links. Home, Getting-Started and Configuration are published. The two
experimental Codespaces guides and profiles are local follow-up work, not yet
published or validated in an actual GitHub Codespace.
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
- The one-off manual credential probe used a disposable local candidate commit
  and a push dry-run, without publishing pages. Its disposable bare-Git tests
  verified accepted/missing credentials and unchanged remote refs.
- The probe workflow and its dedicated tests were removed after successful real
  publication superseded them. The [workflow checker](../../scripts/verify-workflows.mjs)
  still enforces the automatic publisher's safeguards; the historical trial
  result remains linked below.
- With explicit owner approval, committed/pushed `8b05435` and ran the
  [hosted check](https://github.com/eG-dev/MONkEY/actions/runs/40293841009): success.
  Wiki HEAD remained `e0ddae0c1fc61f9252352750c89194925c657103` on `master`.
  The dedicated fine-grained PAT was accepted for the non-mutating receive-pack
  dry-run; no broader scope or alternate credential is needed for this trial.
- The default bootstrap Home bytes have SHA-256
  `2391fa8ef920f50b1b0bd8ba63f89a27cc85e8919057446b03a235d7c91bb717`.
  [The manifest](../../docs/wiki/navigation.json) permits only that exact adoption,
  not arbitrary Home/sidebar/footer overwrites. That first publication has now
  succeeded with independently verified source and content hashes.

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
3. Published and independently verified: [Home](../../docs/wiki/Home.md),
  [Getting Started](../../docs/wiki/Getting-Started.md) and
  [Configuration](../../docs/wiki/Configuration.md). The beta.2 deployment bundle's
  checksum, file layout and Compose configuration were checked. The ENV plan now
  points to the canonical guide while retaining acceptance ownership and anchors.
  The owner subsequently approved direct Compose settings as the default, with
  environment-file interpolation optional. Checked-in examples and future release
  bundles use direct values; published beta.2 assets remain immutable and the
  guide explains local adaptation while preserving image digest and data volume.
4. Implemented and hosted-verified: structural Markdown generation, explicit assets/navigation,
  ownership hashes and guarded trusted-main publication. Read-only CI checks and
  the [automatic workflow](../../.github/workflows/wiki-publish.yml) passed its first publication.
5. Passed locally: focused rendering/ownership/real-Git regressions, including
  direct edits, collisions, symlinks, no-ops, managed deletions, unmanaged-file
  preservation, stale sources and concurrent Wiki commits. Source documentation
  and workflow safety checks pass. A read-only clone using the publisher's exact
  Git-byte settings also passed bootstrap adoption; its checkout and remote Wiki
  HEAD remained unchanged. The owner approved the generated content, exact
  bootstrap adoption, automatic workflow and commit/push on 2026-10-26.
  The resulting first actual publication succeeded and an independent clone
  matched its source revision and every generated-file hash.
6. Add the remaining pages incrementally. Add Codespaces guides with their tested
   configurations, and shorten the old guide/plans only after coverage is checked.

The agreed Codespaces direction is two separate selectable profiles: published
image testing and full-stack development with browser E2E tools. Both use manual
application startup, separate retained data, interactive Manager setup, private
HTTPS and defaults of German, `EUR` and `Europe/Berlin`. The image profile selects a release
explicitly and pins its digest; development restores dependencies on creation.
No billable Codespaces, application environments or publishing credentials are
created by this documentation proposal.

### Codespaces Local Follow-up

- Added selectable [image-testing](../../.devcontainer/image-testing/devcontainer.json)
  and [development](../../.devcontainer/development/devcontainer.json) profiles,
  with a digest-pinned official Ubuntu base and resolved feature lockfiles.
- Both tool images built locally with Dev Containers CLI `0.89.0`. The development
  toolchain reports Node `24.22.1`, npm `12.2.1` and .NET SDK `10.0.403`.
  Eight focused profile/environment/actual-script fixture checks pass and are
  wired into secret-free CI. Application startup is manual; data is isolated.
- In a disposable local development container, locked web/test dependency,
  EF-tool and .NET solution restores passed. Playwright's Linux prerequisites
  installed, but its Chromium download failed certificate trust validation even
  with Node's system CA store. TLS verification was not disabled. Complete
  post-create/browser acceptance remains open; do not claim it passed.
- The [image-testing guide](../../docs/wiki/Codespaces-Image-Testing.md) and
  [development guide](../../docs/wiki/Codespaces-Development.md) describe the
  implemented commands and explicitly identify experimental/unverified behavior.
  A real Codespaces session, private forwarded HTTPS/sign-in, cloud persistence
  and reset still need acceptance. No billable Codespace was created.

## Decisions Still Needed

- Review the local Codespaces follow-up and authorize its commit/push separately.
- Resolve the local browser-download trust prerequisite without weakening TLS,
  then obtain authorization for any billable hosted Codespaces acceptance session.
- Continue the remaining approved pages incrementally; keep incomplete acceptance
  explicit rather than advertising production-ready or fully verified profiles.