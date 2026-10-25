# GitHub builds and releases

Status: root CI and a protected public GHCR prerelease workflow are implemented,
including same-run tested-image transfer and digest-pinned deployment assets.
The new publishing workflow has not run on GitHub or published any image/release.
See the [development guide](../../docs/development.md); complete production publishing
during [operations and cutover](04-operations-cutover.md).

## Goal

Build and test the project on GitHub-hosted runners and create versioned GitHub
Releases. Contributors must not need Azure credentials or access to the original
developer's machine. Docker is the primary distribution format; GHCR is the
selected primary public image registry, as recorded in
[ADR-0006](../../docs/ADR/ADR-0006-github-delivery.md). Anonymous public
pulls must be verified before release. The initial workflow uses the lowercase
repository namespace, `ghcr.io/<owner>/<repository>`; no publishing has occurred.

## Build and verification workflows

- Run GitHub Actions on pull requests and pushes to the default branch. Include relevant application, shared configuration, lockfile, container, test, and workflow changes in trigger coverage.
- Restore locked dependencies, build Angular SSR and .NET, validate translations, and build the production container from a clean checkout.
- Follow the [E2E-first testing plan](testing.md): run the real-stack core Playwright suite on pull requests and the full regression/container lifecycle suite for releases.
- Run the focused integration checks as they become available; do not introduce a mandatory unit-test suite or unit-coverage threshold.
- Install matching Playwright browsers/dependencies on the runner. Keep local and CI commands aligned and record the validated toolchain versions.
- Upload test reports, failure traces/screenshots, and relevant application logs with bounded retention and no credentials/private user data.
- Require the appropriate checks before merging. If a workflow is required, ensure trigger/filter choices do not leave its status permanently pending.
- Exercise fork pull requests without publishing credentials, cloud secrets, or required privileged services. Cache dependencies by lockfile/toolchain without treating cached outputs as trusted release artifacts.
- Pin third-party actions to reviewed commit SHAs and keep them updated. Grant read-only permissions by default and write permissions only to the publishing jobs that need them.
- Do not execute untrusted contribution code through privileged `pull_request_target` jobs or promote untrusted PR artifacts into a privileged publishing job.

## Release workflow

Follow the protected, immutable semantic-version tag convention agreed in
[ADR-0006](../../docs/ADR/ADR-0006-github-delivery.md), such as `v0.1.0` or
`v0.1.0-beta.1`. Validate the tag against the single application version input;
the [About content proposal](03h-lifecycle.md#about-content-update-process)
defines the proposed source and metadata checks. Do not infer application versions
from framework or dependency versions.

1. Validate tag format, intended source commit, and that the commit belongs to the reviewed release history. Derive a consistent application/image/release version from the tag.
2. Build the production image and deployment bundle from that exact source revision using the locked toolchain/dependencies.
3. Run the release verification gates against that image, including E2E, targeted integration checks, container lifecycle checks, and the agreed security scan policy.
4. Prepare a draft GitHub Release with generated notes for review before approving publication; preserve reviewed notes on reruns.
5. After protected-environment approval, publish the tested image to GHCR and verify its anonymous digest-pinned pull. Preserve version/source identity and do not rebuild after testing.
6. Attach matching deployment assets and publish the reviewed draft. Mark prereleases explicitly; only a future successful stable-release path may update a convenience tag such as `latest`.

Publishing jobs use narrowly scoped GitHub token permissions such as
`contents: write` and `packages: write`, with additional attestation permissions
only if that mechanism is chosen. Ordinary PR jobs never receive these privileges.
Protect release tags and define which maintainers may approve/publish releases.

Use the publishing job's `GITHUB_TOKEN` for GHCR rather than a separate registry
credential. Associate the package with its source repository and explicitly
configure public package visibility; a public source repository alone is not proof
of anonymous image access. Verify a pull without registry credentials.

Make publishing reruns deliberate and safe: reconcile partial draft/image uploads,
never silently overwrite a published version with a different digest, and do not
publish a release when a required check failed. Exact versions/digests are the
recovery reference; convenience tags are not immutable release identifiers.

### Implemented Public Prerelease Path

On 2026-10-25 the owner selected **public prereleases** for the first GHCR
workflow, rather than a private-beta exception. This selects the workflow policy,
not an immediate visibility change or authorization to publish.

The [prerelease workflow](../../.github/workflows/ghcr-prerelease.yml) accepts
protected prerelease tags reachable from `main`, with the exact package version,
or a manual rerun selected on such a tag. It calls the same read-only
[CI workflow](../../.github/workflows/ci.yml) used for PR verification. Full
real-image E2E/lifecycle checks and existing dependency audits run before export.
The release build wrapper still rejects dirty source and pending notice review.

Draft creation has only `contents: write`. The `release` environment gates the
separate publisher, which downloads only this run's checksum-checked image and
does not check out code or build again. It checks Linux amd64, build identity,
required reviewer configuration and anonymous matching-source access before
publishing. Version-only pushes reject an existing different image; an identical
image can resume a failed publisher. Anonymous image access gates GitHub Release
publication. No stable, major/minor or `latest` aliases are supported yet.

The bundle includes a digest-pinned Compose file, optional export override,
ENV example and setup/backup/upgrade guidance. Image inspection, build identity,
release identity and download checksums accompany it. These build records are not
a generated SBOM or a cryptographic attestation; those tooling/review tasks and
the complete security/source-delivery review remain separate release gates.

Follow the [GitHub and GHCR setup guide](../../docs/development.md#ghcr-prereleases)
before creating a tag. In particular, configure `v*` protection and required
environment reviewers, review the draft before approval, and make the package
public explicitly. Workflow creation does not close the catalog's pending
release review, alter repository/package visibility, or approve distribution.

Local verification (2026-10-25): workflow YAML/expression/ShellCheck validation,
eight rejected unsafe workflow mutations, actual deployment-export generation
with fresh/existing Compose volume identities and missing-name refusal, all 28
About input checks, documentation links and editor diagnostics passed. The
actionlint image does not recognize the existing `ubuntu-26.04` label; only that
runner-label warning was excluded. No hosted publisher, approval, registry push,
anonymous pull or GitHub Release operation was executed.

## About content and release inputs

The user accepted defining the About update process before further Step 3H work
on 2026-10-17. Follow the revisioned
[input/artifact and verification proposal](03h-lifecycle.md#about-content-update-process).
The approved ORT-assisted notice process is recorded in
[ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md), with mandatory
bespoke per-build collection/reconciliation retained as an evaluated alternative.
Follow the [ORT preparation guide](../../notices/README.md); scanner
version/invocation and reporting still need verification. The agreed curated
notice collection and reviewed self-hosted legal information are delivered;
the independent release review remains pending, not a renewed manual backlog.

Application/build identity and project-license generation are implemented under
[ADR-0019](../../docs/ADR/ADR-0019-build-identity-and-about-assets.md). Use
`npm --prefix web run build:image` from the repository root to prepare metadata/license
inputs and validate matching OCI labels; the CI workflow uses this same
non-publishing wrapper. Ordinary builds copy the maintained local notice document;
they no longer require bespoke inventory collectors or image scanning. The
offline runtime test checks the served document against its checked-in bytes,
not its legal completeness. See the [current build commands](../../docs/development.md#build-metadata-and-license-generation)
and [notice review guidance](../../docs/development.md#third-party-notices).

- Capture the application version, exact source revision, source cleanliness, and agreed repository/source references before Docker packaging; use the same identity in About, OCI labels, and release assets.
- Generate local project-license assets from the canonical root license. Use ORT for the dependency/license overview and assemble reviewed required license/copyright/NOTICE text in the root distribution document; manual original-notice collection is acceptable. Review actual shipped npm/NuGet/runtime/container/font/icon/asset material, including transitives/native payloads and gaps in scan coverage; external package links do not replace required text. The curated collection is complete; its independent pending release review is not release approval.
- Keep reviewed German/English legal documents separately revisioned. Shipped dependency/runtime/asset changes trigger human notice review, not automatic changes to operator/privacy wording or acceptance state. Inspect final OS package inputs before release even if the manifest did not change. Optional initial/release audits assist that review without mandatory per-build archive reconciliation.
- Bundle all outputs before testing the image and publish that tested digest without rebuilding or modifying it. Record reviewed inputs, reviewer/date, unresolved findings and release content checksums. Resolve applicable source delivery, source-offer, relinking and other obligations separately from notices.
- Gate release publication on matching version/tag/source identity, complete reviewed notices and legal revisions, source access, and offline real-image About checks. Development placeholders do not satisfy these release gates.

## Release assets

- A GitHub Release with release notes, known limitations, supported host architectures, and the exact source commit/image digest.
- A deployment bundle containing the example Docker/Compose configuration, non-secret ENV examples, and install/upgrade/backup/restore instructions. Pin its image reference to the tested release.
- SHA-256 checksums for downloadable assets and an SBOM/provenance record describing the build and dependencies, using tooling selected during the runtime spike.
- Optional offline image archives only if agreed as a distribution requirement; publishing to GitHub Releases does not automatically require a second non-Docker runtime package.

Do not publish untested architectures. Start with the verified target platform;
add a multi-architecture manifest only when its images have the agreed verification.
Builds may access package registries, but installed application assets must still
satisfy the offline runtime requirements.

## Delivery sequence

### Home-Server Prerelease Verification

On 2026-10-25 the user clarified that real-environment runtime/integration
verification is only possible on their home server's Ubuntu Docker VM after a
versioned image is available from GHCR. Do not require that host rehearsal before
producing the prerelease artifact needed to perform it. Automated CI/image tests
and local disposable checks remain distinct from real-host acceptance.

Plan the delivery order as follows:

1. Implement and verify the protected GHCR prerelease publishing workflow and
	matching deployment assets. Confirm the image namespace and required
	publication approvals before publishing.
2. Build and test the exact source revision in CI, then publish an immutable
	prerelease image and matching GitHub prerelease. The proposed first version
	is `0.1.0-beta.1`, with Git tag `v0.1.0-beta.1`; do not advance `latest` or
	stable convenience tags.
3. The user pulls that version/digest onto the Ubuntu Docker VM and verifies
	HTTPS/proxy integration, storage permissions, restart/job behavior and manual
	full-installation backup/restore using disposable data first.
4. Address findings in new immutable prereleases, such as `0.1.0-beta.2`.
	Complete real-host acceptance before claiming production readiness or
	promoting a stable release.

This records the verification dependency, not authorization to publish now.
Existing automated verification, security, licensing/notices and corresponding
source requirements still apply to distributed beta images; a prerelease label
does not waive them or mark the pending release review complete. Keep the
agreed ORT/1.0.0 work order separate from this host-availability constraint and
resolve any blocking publication-policy decisions explicitly.

### Milestone Delivery

- Milestone 1: independent GitHub Actions builds/E2E checks and a publishing dry run or clearly labeled development prerelease. Do not claim feature completeness.
- Milestones 2 and 3: expand workflow gates alongside authentication and business features; keep tagged development releases explicitly prerelease.
- Step 2B: preserve real-stack/security regression gates while establishing the approved UX/UI design before remaining milestone 3 features resume.
- Milestone 4: verify application-wide design acceptance, the production release process, downloadable assets, public image access, upgrade instructions, and release approval policy.
- Legacy Azure workflows were removed in the owner-approved root cleanup on 2026-10-25. No release workflow may stop or delete deployed Azure resources implicitly.
- Record key build/publishing/versioning decisions in `/docs/ADR` during the relevant phase, following the [ADR lifecycle](00-guardrails.md#architecture-decision-records).

## Acceptance gates

- [ ] A clean GitHub-hosted runner builds the replacement and executes its current E2E suite without Azure or developer-machine dependencies.
- [ ] Fork pull requests can run the intended checks without secrets or publishing permissions.
- [ ] Failure artifacts make CI failures diagnosable; required checks cannot be bypassed by an incomplete publishing run.
- [ ] About and release artifacts use matching application/build identity, synchronized project-license text, complete reviewed local third-party notices, and reviewed German/English legal revisions; source access matches the distributed revision.
- [ ] A release rehearsal produces a matching version tag, tested container digest, deployment assets, and GitHub Release.
- [ ] Failed verification does not publish a release or update stable image tags.
- [ ] Release reruns handle partial publishing safely without changing already published version contents.
- [ ] The release image is publicly pullable and its deployment bundle works on a clean supported host.
- [ ] Supported architecture claims, security policy, provenance/checksums, permissions, and approval expectations are documented and verified.