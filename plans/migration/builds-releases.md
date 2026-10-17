# GitHub builds and releases

Status: independent build/E2E workflow implemented with an optional non-publishing
image export. GitHub-hosted/fork execution and publishing rehearsal remain unverified.
See the [foundation guide](../../revamp/README.md); complete production publishing
during [operations and cutover](04-operations-cutover.md).

## Goal

Build and test the project on GitHub-hosted runners and create versioned GitHub
Releases. Contributors must not need Azure credentials or access to the original
developer's machine. Docker is the primary distribution format; GHCR is the
selected primary public image registry, as recorded in
[ADR-0006](../../docs/ADR/ADR-0006-github-delivery.md). Anonymous public
pulls must be verified before release; no registry publishing has been implemented
or performed yet. Confirm the owner/image namespace during publishing setup.

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
4. Publish the tested image to GHCR with the version and source revision recorded in OCI labels. Preserve its digest; do not rebuild a different image after testing.
5. Create a draft GitHub Release for the same tag and attach the release assets below. Link to the published image by version and digest.
6. Complete the configured release approval/checks, then publish the release. Mark prereleases explicitly; only a successful stable release may update a convenience tag such as `latest`.

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

## About content and release inputs

The user accepted defining the About update process before further Step 3H work
on 2026-10-17. Follow the revisioned
[input/artifact and verification proposal](03h-lifecycle.md#about-content-update-process);
specific generator/scanner tooling and final legal content remain to be evaluated.

- Capture the application version, exact source revision, source cleanliness, and agreed repository/source references before Docker packaging; use the same identity in About, OCI labels, and release assets.
- Generate local project-license assets from the canonical root license. Derive notices from the actual shipped npm/NuGet/runtime/container/font/icon/asset inputs and explicitly reviewed exceptions, not a manually maintained About list.
- Keep reviewed German/English legal documents separately revisioned. Dependency updates regenerate inventory for review, not operator/privacy wording or acceptance state.
- Bundle all outputs before testing the image. Check the completed image against its inventory and publish that tested digest without rebuilding or modifying it. Record resolved inputs and content checksums with release evidence.
- Gate release publication on matching version/tag/source identity, complete reviewed notices and legal revisions, source access, and offline real-image About checks. Development placeholders do not satisfy these release gates.

## Release assets

- A GitHub Release with release notes, known limitations, supported host architectures, and the exact source commit/image digest.
- A deployment bundle containing the example Docker/Compose configuration, non-secret ENV examples, and install/upgrade/backup/restore instructions. Pin its image reference to the tested release.
- SHA-256 checksums for downloadable assets and an SBOM/provenance record describing the build and dependencies, using tooling selected during the foundation spike.
- Optional offline image archives only if agreed as a distribution requirement; publishing to GitHub Releases does not automatically require a second non-Docker runtime package.

Do not publish untested architectures. Start with the verified target platform;
add a multi-architecture manifest only when its images have the agreed verification.
Builds may access package registries, but installed application assets must still
satisfy the offline runtime requirements.

## Delivery sequence

- Milestone 1: independent GitHub Actions builds/E2E checks and a publishing dry run or clearly labeled foundation prerelease. Do not claim feature completeness.
- Milestones 2 and 3: expand workflow gates alongside authentication and business features; keep tagged development releases explicitly prerelease.
- Step 2B: preserve real-stack/security regression gates while establishing the approved UX/UI design before remaining milestone 3 features resume.
- Milestone 4: verify application-wide design acceptance, the production release process, downloadable assets, public image access, upgrade instructions, and release approval policy.
- Keep legacy Azure workflows independent during migration; new paths must not accidentally deploy the old application. Retire them only through approved cutover.
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