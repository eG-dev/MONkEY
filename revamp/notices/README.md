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
| `entries` | Curated grouping and ordering for About | Stable `id`, `displayName`, `componentIds`, optional presentation `groups`; array order is presentation order |
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

### Grouped About Documents R6 (2026-10-24)

The user explicitly approved the current wireframe, then its matching prototype
with "prototype approved, implement". Angular now renders bounded
package/license groups and lists their applicable members once, not before
every document. Documents have readable translated titles, independent initially
closed expansion, full unchanged original text and separate local-original
links. Mixed member metadata remains explicit. This does not change collection
coverage or legal provenance.

An entry may specify ordered `groups`, each with a stable `id`, `titleKey` and
`componentIds`. A non-null title key names its German/English label beneath
`about.noticeGroups` in the existing translation catalogs; null uses the
entry's proper display name. Group members retain the entry's component order.
Groups must form a complete nonoverlapping partition of the entry. Every member
of a group must have the same complete document-ID set; a shared license alone
does not justify grouping packages with different NOTICE/copyright requirements.
Without explicit groups, the assembler creates one group and enforces that same
applicability condition. Different document sets require explicit groups.

SQLite configures provider, binding and engine groups. Other current entries
use the validated default. The generated About data carries these same groups;
Angular does not maintain a second package/group inventory. The canonical
distribution bundle and original bytes are unchanged by this UI revision.

The [production delivery record](../README.md#grouped-notice-documents-r6-2026-10-24)
records 27 passing isolated input checks, 11 focused production-image checks,
eight separate localization/theme/viewport combinations and inspected
desktop/phone captures. The build rejects invalid IDs/title-key syntax,
unknown/duplicate assignments, omitted members and mixed document applicability.
Coverage remains partial; these checks are not a release or legal approval.

### Artifact Locations And Ownership

| Location | Role |
| --- | --- |
| `revamp/notices/catalog.json` | Maintained reviewed identities, explicit mappings and provenance; manual first, later supplemented by proposed adapter changes |
| `revamp/notices/originals/<component-id>/<version-or-approved-series>/...` | Tracked, unmodified upstream license/NOTICE/copyright/evidence documents; shared documents reference one physical file where appropriate |
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

**Approved major-series reuse, 2026-10-24:** use `MAJOR.x` folders for all
currently cataloged components:

| Component | Original folder |
| --- | --- |
| Angular | `originals/angular/22.x/` |
| .NET | `originals/dotnet/10.x/` |
| ASP.NET Core | `originals/aspnetcore/10.x/` (shares .NET's identical MIT document) |
| Entity Framework Core | `originals/microsoft-entityframeworkcore/10.x/` |
| SQLitePCLRaw | `originals/sqlitepclraw/2.x/` |
| SQLite engine | `originals/sqlite/3.x/` |
| Taiga UI | `originals/taiga-ui/5.x/` |
| Lucide | `originals/lucide-static/1.x/` |
| Roboto | `originals/roboto/3.x/` |

This extends the 2026-10-23 .NET/EF Core patch-series and Angular major-series
reuse approvals. The .NET and ASP.NET Core originals likewise use `10.x`.
Assume licensing stays unchanged across minor and
patch releases within each major series; routine updates do not require repeat
downloads or duplicate original documents. Keep exact shipped component
versions and version evidence in the catalog, and preserve each document's
actual captured upstream URL, revision and SHA-256. The series folder is only a
storage convention, not a wildcard component version or a fabricated source
revision. Review a new major series before reusing its documents, and revisit
reuse if upstream announces changed terms or obvious contradictory material
appears. This does not automatically cover separate uncataloged dependencies or
replace component-specific NOTICE/copyright material, including Lucide's
supplied Feather attribution.

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

### SQLite Provider, Bindings And Engine (2026-10-24)

The catalog now has all eight agreed initial About entries, still with
`partial` overall coverage. The SQLite entry explicitly maps the Storage
lockfile's three Microsoft provider packages, four SQLitePCLRaw packages and
the separately identified engine:

| Components | Exact version | Licensing and local documents |
| --- | --- | --- |
| `Microsoft.EntityFrameworkCore.Sqlite`, `Microsoft.EntityFrameworkCore.Sqlite.Core`, `Microsoft.Data.Sqlite.Core` | `10.0.13` | MIT; share the existing EF Core original from the matching upstream release |
| `SQLitePCLRaw.core`, `SQLitePCLRaw.bundle_e_sqlite3`, `SQLitePCLRaw.provider.e_sqlite3`, `SQLitePCLRaw.lib.e_sqlite3` | `2.1.13` | Apache-2.0; shared original license, NOTICE and package copyright text |
| SQLite engine (`e_sqlite3`) | `3.53.3` | Public domain, with no invented SPDX identifier; source-matched original public-domain statement |

The installed Microsoft NuGet metadata declares MIT and identifies EF Core's
upstream source. Each SQLitePCLRaw package declares Apache-2.0 and the identical
`Copyright 2014-2024 SourceGear, LLC` text. No license, NOTICE or copyright files
were supplied separately in these installed packages. The exact copyright
metadata value is preserved in [COPYRIGHT.txt](originals/sqlitepclraw/2.x/COPYRIGHT.txt),
with a terminating LF and explicit field/package provenance, not represented as
an upstream file of that name.

The SQLitePCLRaw [LICENSE](originals/sqlitepclraw/2.x/LICENSE.txt) and
[NOTICE](originals/sqlitepclraw/2.x/NOTICE.txt) were captured unchanged from
`v2.1.12`, commit `ca835d21508bff43121c65081035840ac5006c4c`.
Git treats the canonical root bundle as byte-preserved, like the originals:
the upstream Apache text's CRLF bytes remain intact instead of being normalized
on commit/checkout and invalidating deterministic assembly.
No `v2.1.13` tag was found at collection; the catalog does not fabricate one.
The originals are reused under the approved same-major assumption, consistent
with all four `2.1.13` package declarations and the matching SourceGear copyright
metadata in the captured release. The full upstream NOTICE includes broader
material such as SQLCipher/OpenSSL; retaining it does not assert that those
alternatives ship in this application.

The actual Linux image's
`/app/backend/runtimes/linux-x64/native/libe_sqlite3.so` reports:

```text
sqlite3_libversion(): 3.53.3
sqlite3_sourceid(): 2026-06-26 20:14:12 d4c0e51e4aeb96955b99185ab9cde75c339e2c29c3f3f12428d364a10d782c62
SHA-256: b0f5c48026fedcf9f05cf31c6fadf9e1e001ca59cd85aa68b8b6814e52c18a07
```

The image's native bytes match the cached `lib.e_sqlite3` payload. The packaged
Windows x64 DLL reports the same version/source identity. Engine version evidence
hashes the Storage lockfile and records this direct native inspection; a lockfile
change requires rechecking the engine, not copying the NuGet version into its
record. Other native architectures are present in the published output and
covered by the native package mapping, but are not claimed as tested platforms.

The unchanged [public-domain statement](originals/sqlite/3.x/PUBLIC-DOMAIN.txt)
comes from `LICENSE.md` at the engine's exact Fossil source identity. It
distinguishes the deliverable SQLite engine from separately licensed build
scripts. Public-domain status applies to that engine, not to its Microsoft
provider or SQLitePCLRaw bindings/packaging. About retains each group's separate
version/license association using the existing presentation; no layout or
translation changes are needed.

This completes the selected manual component groups, not a complete
dependency/asset/runtime/OS inventory, legal review or distribution approval.
The planned ORT-assisted expansion and supplemental review remain open.

Verification: notice assembly/freshness, all 24 isolated About build-input
checks, E2E TypeScript checking and the production Linux image build passed.
The initial browser bundle remains `697.61 kB`. The nine-case real-image run
passed seven cases, including network-disabled original/bundle delivery and
desktop/mobile authenticated/forced-password About flows. The two public cases
exposed an obsolete test assumption that a package-name search matches only
one entry: `Microsoft.EntityFrameworkCore` now also matches SQLite's provider.
The assertion now checks the expected matches from the catalog; both public
desktop/mobile cases passed on the focused rerun, including shared documents,
all package/license associations, exact originals, public-domain labels and
download hashes. Desktop and 320px phone SQLite screenshots were inspected.
Git clean filtering was checked with `core.autocrlf=true` and preserves the
assembled bundle's exact bytes. These are focused local results, not hosted or
release acceptance.

### .NET And ASP.NET Core (2026-10-24)

This addition brought the catalog to seven partial entries. The two runtime entries map
`Microsoft.NETCore.App` and `Microsoft.AspNetCore.App`, both `10.0.13`, as reported
by `dotnet --list-runtimes` in the built Linux image. Version evidence records
the final base's exact `10.0.13-noble` image digest and hashes the
[Dockerfile](../deploy/Dockerfile), rather than treating the SDK version or a
NuGet package as the runtime version. A Dockerfile change requires refreshing
that evidence after checking the affected runtime inputs.

- The unchanged [MIT original](originals/dotnet/10.x/LICENSE.txt) was copied
  from `/usr/share/dotnet/LICENSE.txt` in the image. It is byte-identical to
  the matching `dotnet/runtime` and `dotnet/aspnetcore` release license files,
  so both components explicitly reference this one document. Original
  copyright and permission text is preserved.
- The runtime's full [ThirdPartyNotices.txt](originals/dotnet/10.x/ThirdPartyNotices.txt)
  was copied from `/usr/share/dotnet/ThirdPartyNotices.txt`. Its provenance
  records the pinned upstream image digest and internal source path.
- ASP.NET Core's full [THIRD-PARTY-NOTICES.txt](originals/aspnetcore/10.x/THIRD-PARTY-NOTICES.txt)
  comes from the matching upstream `v10.0.13` release. It is retained separately
  because it differs from the runtime image's notice file.

MIT describes the respective projects' own license, not a claim that every
bundled dependency is MIT. The supplied notice documents retain other licenses
and attributions unchanged. Their broad upstream content is not an assertion
that every listed tool, platform or component ships in this Linux application.
Existing runtime/OS notices remain in the image; this addition does not replace
them or establish complete runtime/container coverage. The About layout and
local download mechanism are unchanged.

At this point the initial SQLite provider/binding/native chain remained open;
later comprehensive ORT/transitive/native/OS review is still required.
Coverage stays `partial`.

Verification: notice assembly/freshness, all 24 isolated About build-input
checks, E2E TypeScript checking and the production Linux image build passed.
The initial browser bundle remains `697.61 kB`; notice data stays on demand.
All nine focused real-image checks passed without retries: desktop/mobile
public, Manager, Member and forced-password About flows, plus network-disabled
runtime delivery. They verify both `.NET` search matches, individual component
search, shared-license and separate-NOTICE applicability, exact inline text,
downloaded original hashes and canonical bundle delivery. Desktop/320px phone
summary and expanded-document screenshots were inspected. These are local
focused results, not hosted verification or complete distribution approval.

### Taiga UI And Lucide (2026-10-24)

This addition brought the catalog to five partial entries: Angular, Entity Framework Core,
Taiga UI, Lucide and Roboto. This addition uses the existing About layout and
shared-document associations without UI or dependency changes.

- **Taiga UI:** the four direct runtime packages `@taiga-ui/cdk`,
  `@taiga-ui/core`, `@taiga-ui/i18n` and `@taiga-ui/styles` are each `5.29.0`
  in the installed package metadata and npm lockfile. All declare Apache-2.0
  and supply byte-identical root `LICENSE` documents, including the
  `Copyright 2026 Pineopticone` appendix. They share one unchanged
  [original](originals/taiga-ui/5.x/LICENSE.txt) captured from
  `@taiga-ui/core@5.29.0`, with the locked tarball URL, package path and SHA-256
  recorded in the catalog. No separate NOTICE or copyright document was found
  in these packages outside their nested dependencies.
- **Lucide:** `lucide-static@1.61.0` supplies the locally bundled icon font and
  CSS through the existing Angular asset configuration, which also copies its
  `LICENSE`. Its manifest declares ISC, but its supplied
  [original](originals/lucide-static/1.x/LICENSE.txt) also includes the
  Feather-derived icon list, Cole Bemis attribution and MIT terms. The catalog
  therefore records `ISC AND MIT`, preserving the entire original document
  rather than dropping the inherited material or treating it as an alternative
  license choice. Its provenance is the locked npm tarball and `package/LICENSE`;
  no separate NOTICE or copyright document was found.

Coverage remains `partial`. This slice does not review the separate Taiga-family
packages `@taiga-ui/design-tokens`, `@taiga-ui/event-plugins`,
`@taiga-ui/font-watcher` or `@taiga-ui/polymorpheus`, or other transitive
dependencies. Their package scopes alone do not establish shared licensing or
document applicability. At this point .NET, ASP.NET Core and the SQLite
provider/binding/native chain remained in the agreed initial backlog;
comprehensive ORT, runtime, OS and
transitive coverage remains later release work.

Verification: canonical notice assembly/freshness and all 24 isolated About
build-input checks passed. The production Linux image built successfully. All
eight desktop/mobile public, Manager, Member and forced-password About checks
passed, exercising the new entries' search, shared applicability mappings, exact
inline originals and downloaded SHA-256 values. Desktop and 320px phone
screenshots for both entries were inspected. The separate network-disabled
runtime check passed, including exact canonical bundle delivery and every mapped
original document. The initial Windows-backslash Playwright path selector
matched no tests; rerunning with the filename regex `about[.]spec[.]ts$` ran the
eight checks above. These are local focused results, not hosted verification or
release/legal-completeness approval.

### Angular Runtime Packages (2026-10-23)

Dependency refresh on 2026-10-24 updates SSR to `22.2.4`; the seven framework
packages stay at `22.2.3`. The new SSR package's `LICENSE` has the same SHA-256
as the reviewed original below. Its catalog version, PURL and upstream release
link, and the generated root notice document have been updated. The following
records the original 2026-10-23 collection.

At the time of this addition, the catalog contained three partial entries: Angular, Entity Framework Core
and Roboto. The Angular entry explicitly maps the eight direct runtime packages
`@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/forms`,
`@angular/platform-browser`, `@angular/platform-server`, `@angular/router` and
`@angular/ssr`. Each installed version and matching npm lockfile record is
`22.2.3`; each package declares MIT and supplies the same root `LICENSE` bytes,
including the Google LLC copyright notice. No separate root NOTICE or copyright
file was found in these eight packages.

The captured [original](originals/angular/22.x/LICENSE.txt) comes from the
installed `@angular/core@22.2.3` package. Its provenance records the locked npm
tarball URL and `package/LICENSE`; its SHA-256 is
`15e77c4692114f87c2020353626c868472c23954a4ed37ecc4c1522d14be1eb7`.
All eight inspected originals have that hash, so the explicit component mappings
share one stored document. The first seven packages identify `angular/angular`
as their upstream repository; SSR identifies `angular/angular-cli`, retained in
its own source link. The initial catalog-only addition changed no package
versions, dependencies or UI layout.

Verified: notice assembly and About freshness, all 24 isolated build-input
checks, the production-image build and all nine focused About/offline image
checks. These exercised grouped member/version/license associations, exact
inline texts and downloaded original hashes, search, keyboard reading and
desktop/320px layouts. Desktop/mobile Angular screenshots were inspected.

The user subsequently approved Shared Notice Documents R1 on 2026-10-23:
"approved, implement". Angular now shows each document once per entry, followed
through explicit applicability mappings rather than duplicated inside each
package. Shared versions/licenses remain a single summary label, while distinct
documents and mixed version/license associations are retained. Each applicable
package keeps its source link; members without mapped documents stay visible.
No original bytes, catalog mappings or distribution bundle were changed by this
presentation correction. Application/image builds, catalog validation, E2E
typecheck and all nine About/offline image checks passed again. Eight isolated
English/German, light/dark, desktop/phone real-app checks passed; screenshots are
ignored under `revamp/.local/shared-notice-angular-review/`.

This bounded slice does not cover Angular's separate dependencies, including
`rxjs`, `tslib`, `@standard-schema/spec`, `zod`, `xhr2` and `beasties`, or establish
which transitive material ships in the final outputs. Build-only Angular tools
are not added merely because their names match. The remaining agreed initial
components and later ORT/transitive/native/runtime/OS review stay open; coverage
remains `partial`, not distribution or legal-completeness approval.

### Implemented Manual Proof (2026-10-19)

The initial proof deliberately covered only two entries, not the full initial set:

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