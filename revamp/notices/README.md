# Manual Notices and ORT Preparation

[ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md) selects the OSS
Review Toolkit (ORT) for the dependency/license overview. The previous bespoke
inventory and notice-review baseline are superseded. This is preparation, not a
completed ORT installation or a release compliance review.

## Timing

The user confirmed on 2026-10-19: source-only public GitHub development comes
first; Docker images and releases come later. ORT setup, comprehensive dependency
and asset review, and complete About integration are deferred to final release preparation
after the repository can become public. Source publication still requires rights
and applicable license/copyright/NOTICE material for included code and assets,
plus a review of repository history for private data or credentials. This timing
does not mark those checks complete or authorize a visibility/publishing action.

## Staged Delivery

1. **Manual first version:** prepare reviewed entries for Angular, .NET, ASP.NET
  Core, Entity Framework Core, SQLite, Taiga UI, Lucide and Roboto. Resolve the actual package/asset
  identities and shipped versions; retain required original license, copyright
  and NOTICE texts with provenance. Handcrafted collection is acceptable and
  does not require ORT. Use the canonical root notice document and existing
  exact-copy delivery; do not create a second maintained notice bundle. An
  initial About presentation can use these reviewed entries independently of
  tooling, following the existing UI review process. Mark the set as partial;
  the selected product names do not establish complete distribution coverage.
2. **Tool-assisted expansion:** at the end of the work order, establish ORT using
  the checklist below, compare its findings with the reviewed initial entries,
  supplement missing transitive/native/runtime/OS/asset coverage and extend the
  notices/About presentation. Preserve reviewed original material and record
  unresolved findings rather than treating a successful scan as approval.

For SQLite, include `Microsoft.EntityFrameworkCore.Sqlite`,
`Microsoft.Data.Sqlite.Core` and the actual `SQLitePCLRaw` binding/bundle/native
packages resolved by the lockfile. The compiled SQLite engine (for example,
`libe_sqlite3.so` on Linux) is native code invoked by the managed .NET bindings.
SQLite's engine is public domain; that does not make the independently licensed
.NET provider, bindings or package material public domain. Check their original
terms separately, without treating the package version as the engine version.

The user selected these stages, added ASP.NET Core/SQLite and explicitly accepted
known gaps in the initial coverage on 2026-10-19. This records the delivery scope,
not completed notice collection or approval of any particular upstream text.
Required notices/rights for material already distributed cannot be deferred by
calling its overview partial. Preserve upstream accompanying notices, resolve
applicable obligations before distribution or withhold the affected artifact.
Source-only publication and image/release checks remain distinct as above.

## Manual Mapping Concept R1

**Approved, 2026-10-19:** the user answered "okay approved" after the R1 ownership
review and the concrete Roboto mapping. Implement the manual input-to-About
contract first with one managed package and Roboto. ADR-0020 records the approved
originals/mappings ownership; ORT remains selected for later discovery, while the
data contract is independent of that tool. UI changes retain their design gates.

### Input Contract

The implemented [catalog](catalog.json) uses `schemaVersion: 1`, an explicit
`coverage` of `partial` or `complete`, and three collections:

| Collection | Purpose | Fields |
| --- | --- | --- |
| `components` | Exact reviewed package, runtime, engine or asset identities; not a complete dependency graph | Stable `id`, `kind`, `name`, exact `version`, optional package URL (PURL), `versionEvidence`, `upstreamUrl`, `licenseExpression` where verified, `licensingStatus`, `reviewStatus`, `documentIds` |
| `entries` | Curated grouping and ordering for About | Stable `id`, `displayName`, `componentIds`; array order is presentation order |
| `documents` | Original local texts and their provenance | Stable `id`, `kind`, repository-relative `path`, original `upstreamUrl` and revision/version evidence, `sha256` |

Components reference document IDs; entries reference component IDs. Resolve paths
only from the document records, never from a display name, guessed package name
or runtime URL. A component can have several documents; components can share a
document only when the original bytes and applicability match. A shared license
does not replace component-specific NOTICE or copyright material.

Keep an engine version separate from its NuGet bundle version. Represent an
unresolved value explicitly in draft input, not with a guessed version or SPDX
identifier. Public-domain status has its own `licensingStatus` and upstream
evidence; it is not a fabricated permissive license. Preserve original-language
legal texts unchanged; translate only UI labels, not upstream documents.

Example relationship, with IDs illustrative rather than a completed inventory:

```text
About entry: sqlite
  component: microsoft-data-sqlite-core@10.0.12
    documents: provider-license, provider-copyright
  component: sqlitepclraw-core@2.1.12
    documents: binding-license, binding-notice-if-applicable
  component: sqlitepclraw-native-bundle@2.1.12
    documents: bundle-material-as-reviewed
  component: sqlite-engine@<verified-engine-version>
    documents: sqlite-public-domain-statement
```

These labels do not assert that the example documents exist or are all required.
Use the resolved package chain and actual upstream artifacts when collecting the
first set. The same mechanism supports Angular, runtime/framework groups, fonts
and icons without forcing one display row per package. About must retain each
member's own version/license association rather than assigning a single guessed
version or license to a mixed group.

### Artifact Locations And Ownership

| Location | Role |
| --- | --- |
| `revamp/notices/catalog.json` | Maintained reviewed identities, explicit mappings and provenance; manual first, later supplemented by proposed adapter changes |
| `revamp/notices/originals/<component-id>/<version>/...` | Tracked, unmodified upstream license/NOTICE/copyright/evidence documents; shared documents reference one physical file where appropriate |
| Root `THIRD-PARTY-NOTICES.txt` | Canonical assembled distribution output, deterministically generated and committed for source recipients; not independently hand-edited |
| Existing ignored `revamp/web/src/generated/about/` | Generated About entry data with resolved local document references/texts, plus downloadable documents; no second maintained catalog |
| Existing ignored `revamp/.build/about/` | Prepared container inputs, extended to capture this same catalog/document set before packaging |

The [assembler](../web/scripts/assemble-notices.mjs) generates both the root
document and About assets from the same reviewed inputs. Output is deterministic
and associates each text with its applicable components/versions. Exact-copy
checks verify the root document shipped by the tested image matches the committed
distribution output. Generated asset URLs are derived under the existing
`/licenses/` location, not entered separately in the catalog or Angular component.
The container build must receive the original inputs as well as verify the
assembled output; it must not rely on files outside its prepared build context.

ADR-0020 now makes originals/mappings authoritative and the root file a generated
distribution output. Do not maintain both a hand-edited root bundle and
independently edited original texts.

### Manual Workflow And Later Automation

Use the exact shipped package or matching upstream release/revision as the primary
source. Reasonably rely on its supplied license, copyright and NOTICE information
unless there are obvious gaps or contradictions. Preserve original texts and
provenance; do not routinely audit upstream authorship or reconstruct its
compliance process. Our review checks applicability to the actual version and
bundled material, not whether we can perform a more exhaustive investigation than
the upstream project. A project's own license does not automatically cover all
its dependencies. Record missing or conflicting material as an unresolved finding
rather than inventing notices or claiming complete coverage. The same principle
applies to manual collection and later automated adapters.

1. Select an actual shipped component from a lockfile, runtime/image input or
   local asset. Record its exact identity/version and supporting evidence.
2. Obtain its original legal documents from the matching package or verified
   upstream revision. Store unchanged bytes, provenance and hashes locally.
3. Review licensing/status and attach document IDs to the component. Map the
   component to an existing About entry or add an explicitly curated entry.
4. Run the assembler and checks, inspect the root notice output and About
   association, then commit inputs and the assembled root document together.
5. Later, let ORT or another adapter propose component/version/document changes
   into this same contract for review. Do not make the UI consume tool-specific
   reports, silently replace reviewed texts or infer About grouping automatically.
   Newly discovered unmapped components remain visible as review findings, not
   silently dropped or presented as reviewed.

First exercise the entire path with one managed package and one asset, then add
the rest of the agreed initial set. No automatic registry lookup, notice download
at runtime, backend endpoint, database or bespoke dependency-discovery engine.
The small assembler validates explicit reviewed inputs; it does not rediscover
the dependency graph or recreate the removed inventory/reconciliation pipeline.

### Acceptance Checks And Review

- Reject duplicate IDs, dangling references, missing/out-of-root documents,
  mismatched hashes, stale assembled output and generated URL collisions.
- Check recorded package versions against their stated lockfile evidence for
  supported npm/NuGet inputs. Keep runtime/asset evidence explicit and reviewed;
  do not pretend all versions can be inferred from package locks.
- Mark partial overall coverage independently of individual component review.
  Reject unreviewed/incomplete mapped entries in release validation; development
  input may retain explicit unresolved states. Unmapped discovery results must
  not be interpreted as absent obligations.
- Verify one-to-many grouping, component-specific license/NOTICE associations,
  deterministic output, exact original text bytes and stale-version rejection.
- Use the existing About layout and local assets. Update the applicable design
  references for real versions, licensing and document states before Angular
  implementation, following the existing UI approval gates. Verify search,
  keyboard/mobile reading and network-independent access with the real image.

**Review gate closed, 2026-10-19:** the three-collection mapping, tracked originals
and generated-root ownership are approved for the manual proof. Implementation
and verification evidence follow separately; approval does not establish notice
completeness or approve changed UI artifacts.

### Implemented Manual Proof (2026-10-19)

The catalog deliberately covers only two entries, not the full initial set:

| Entry | Exact input and legal material |
| --- | --- |
| Entity Framework Core | `Microsoft.EntityFrameworkCore` `10.0.12`, checked against the Storage NuGet lockfile; original MIT `LICENSE.txt` from the matching upstream `v10.0.12` release |
| Roboto | All four local Light/Regular/Medium/Bold WOFF2 files identify `Version 3.015; 2026`, Roboto Project Authors and SIL OFL 1.1 in their name tables; original Google Fonts `OFL.txt` pinned to commit `2e69e0bf1bd2662d6775bb54a398bded758e87cf` |

The user supplied [Google Fonts](https://fonts.google.com/specimen/Roboto/license)
as the download source on 2026-10-19. All four local font name tables were inspected
with disposable `fontTools[woff]` `4.61.1`; no Python dependency was added to the
project. The catalog records each local font hash, document hashes, immutable
legal-source revisions and provenance. Git attributes preserve original document
bytes, including upstream line endings and trailing spaces.

Run from the repository root after changing reviewed inputs:

```text
npm --prefix revamp/web run assemble:notices
node revamp/web/scripts/assemble-notices.mjs --check
npm --prefix revamp/web run prepare:about
npm --prefix revamp/web run prepare:about -- --check
npm --prefix revamp/web run check:about
npm --prefix revamp/web run build:image
npm --prefix revamp/tests/e2e run check
npm --prefix revamp/tests/e2e test -- specs/shell/about.spec.ts specs/authentication/about.spec.ts specs/lifecycle/runtime.spec.ts --grep "About|runtime works with networking disabled" --workers 1
```

Ordinary preparation checks the tracked root bundle; it does not silently rewrite
it. It generates `/about/third-party.json` and `/licenses/notices/<document-id>.txt`
alongside the root bundle download. The JSON retains grouped components, each
version/license/document association, coverage and full original texts. The
existing container snapshot captures the catalog, originals and lockfile/font
evidence under `revamp/.build/about/inputs/`. Packaged preparation validates those
inputs and rejects drift in web evidence against the actual build context.

Supported evidence is `npm` (lockfile `path`, `package`), `nuget` (lockfile `path`,
`framework`, `package`), or `files` (review description and `path`/`sha256` records).
File hashes bind manually reviewed runtime/asset evidence; the assembler does not
infer font or runtime versions. Release-input validation rejects partial coverage
and unresolved mapped components; marking coverage complete is not legal approval.

Verified locally: 24 isolated build-input checks, real preparation/freshness,
production-image build, E2E typecheck and three image-backed checks (offline
runtime plus public About on desktop/mobile). Offline verification fetches the
generated mappings and checks each original document's served SHA-256 against
the tracked catalog; it also checks the exact assembled bundle.

On 2026-10-19 the user explicitly approved reuse of the existing R4 dialog and
matching prototype for real notice data without layout/interaction changes. The
About component now imports the generated JSON at build time, preserves grouped
component/version/license associations and displays the exact original texts with
local document links. Search matches entry/member names, versions and license
identifiers. The partial-coverage warning and UI labels are German/English;
original legal texts are not translated. No runtime fetch or backend endpoint was
added. The legal tab remains review content.

Angular/catalog/type checks and the production-image build passed. All nine
focused About/offline image checks passed, including exact inline original texts,
download hashes, license search, keyboard expansion, public desktop/320px reading,
both roles and form preservation. English screenshots were inspected; four German
browser checks at 1440px/360px in light/dark passed without overflow or script errors.
Remaining initial components and later ORT expansion are separate follow-up work.

## ORT Implementation Checklist

- Evaluate and pin an ORT distribution and its prerequisites. Record a tested,
  reproducible invocation here before adding CI automation. Do not use an
  unpinned image or introduce a mandatory scan into normal application builds.
- Analyze the replacement web and backend projects, including resolved npm and
  NuGet transitives. Exclude legacy Azure projects from the replacement report;
  preserve dependency relationships across the replacement backend projects.
- Produce a readable report with package identity, exact version, dependency
  relationships, declared/detected licenses and unresolved findings. Keep raw
  results reproducible and generated, not manually maintained. Verify missing or
  unknown licenses remain visible, including on otherwise issue-free packages.
- Review build-only versus redistributed dependencies against actual outputs.
  Explicitly account for native/embedded code, Node/.NET runtimes, OS packages,
  fonts and copied assets. Do not claim that package-manager analysis finds all
  these automatically. Record supplemental coverage and remaining gaps.
- Keep review decisions and manually collected original license, copyright and
  NOTICE files separate from generated reports. Associate them with exact
  package identities/versions and upstream provenance. First exercise the manual
  mapping contract above; later assess ORT output as an adapter to that contract,
  not as the format the UI must consume. Do not build another dependency parser
  or competing inventory. Automated download/scanning is optional.
- Evaluate ORT reporting/notice output as a possible input adapter to the existing
  assembly contract. Review required text, copyright, NOTICE,
  compatibility and source/source-offer/relinking duties. A scan is not approval.

## Retained Delivery

The root [THIRD-PARTY-NOTICES.txt](../../THIRD-PARTY-NOTICES.txt) remains the
canonical distribution document, beside the project license. The existing About
preparation helper copies its exact bytes into ignored build inputs and generated
assets. Angular serves it at `/licenses/THIRD-PARTY-NOTICES.txt` in the tested
image; runtime retrieval from external services is not required. Generated copies
must not be edited. Preserve upstream runtime and OS notices supplied in the
image. Project-license generation and build/source metadata are independent of
ORT and remain unchanged.

Extend the partial proof through reviewed inputs, regenerate the document,
bundle it before image verification, and publish only the tested artifact.
Incomplete distribution notices and unresolved source obligations remain public
image/release blockers; the source-only publication checks above remain separate.
About's illustrative component rows are not an ORT report or a completed review.

## Preserved Provenance

- N09, 2026-10-18: User confirmed: "the images were created by me". Treat project
  artwork/logo/favicon as first-party provenance. This does not select a separate
  asset license or establish a legal name; attribution/license coverage still
  needs documenting. Do not ask for the same authorship confirmation again.

No ORT version, successful scan, complete coverage or license approval is claimed
yet. The initial manual notice set may be delivered before tooling; comprehensive
collection/review and complete About integration remain deferred until release
preparation after source-only public development can begin. This does not waive
rights/notices for the published repository contents.