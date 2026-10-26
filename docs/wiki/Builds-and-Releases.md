# Builds and Releases

This page describes the maintained public **prerelease** workflow for
`eG-dev/MONkEY`. It publishes Linux amd64 images to `ghcr.io/eg-dev/monkey`.
Stable-release publication and `latest`, major or minor convenience aliases are
not enabled. A published beta is for acceptance testing, not a claim of
production readiness.

Operators installing an existing version should use
[Getting Started](Getting-Started.md) and that version's deployment bundle.
Contributors should use [Development and Testing](Development-and-Testing.md).
Commands here are maintainer procedures, not instructions to create a release
as part of an ordinary contribution.

## Verification and Build Identity

[CI](../../.github/workflows/ci.yml) runs locked builds, dependency audits,
catalog/type/About-input checks and workflow/migration safeguards. PRs use the
bounded real-image smoke suite; the `full-e2e` label requests full coverage.
Pushes to `main`, manual verification, release verification and image export use
the full suite. Ordinary verification is read-only and does not need publishing
secrets. Test diagnostics are uploaded as `test-results` with seven-day retention.

The application version comes from
[web/package.json](../../web/package.json); both version fields in its
[lockfile](../../web/package-lock.json) must agree. Framework/runtime versions are
separate identities. Use the exact toolchain and container pins maintained in the
repository, not floating `latest` or `lts` selectors.

For local image builds, use the maintained wrapper:

```sh
npm --prefix web run build:image
```

It prepares build metadata and local license/notice assets before building
`pocket-monkey:local`, then checks for input drift. About, static metadata and OCI
labels share the version, revision, build kind and source-cleanliness inputs.
Development builds may identify uncommitted changes; a release must have clean,
matching tagged identity and an explicit public repository URL. A local rebuild
is not a substitute for the image retained by release verification.

License/notice and source-delivery review remain independent gates. Changed
shipped packages, assets, native components, runtimes or operating-system inputs
require applicable review. The curated About list, dependency graph and a passing
audit do not establish complete distribution rights. Follow the
[notice maintenance guide](../../notices/README.md),
[build identity decision](../ADR/ADR-0019-build-identity-and-about-assets.md) and
[notice decision](../ADR/ADR-0020-shipped-component-inventory.md). Release builds
enforce reviewed status and input consistency; do not edit approval fields merely
to make a build pass.

## Prepare a Prerelease

Before creating a tag, confirm:

1. The chosen version is unused and its reviewed source commit is reachable from
   `main`. The repository and exact source commit must be publicly accessible.
2. An active tag ruleset protects `v*` tags against unauthorized creation,
   modification and deletion.
3. The GitHub `release` environment has required reviewers and appropriate
   release-tag deployment restrictions. Ensure an eligible reviewer can approve;
   self-review prevention must not leave a sole maintainer without a reviewer.
4. The trusted publisher can write repository releases and GHCR packages through
   its scoped `GITHUB_TOKEN`. No additional registry PAT is required. The GHCR
   package must be explicitly public; public repository visibility is not enough.
5. Applicable security, license/notice, corresponding-source and operational
   release review is complete. No private data or secrets may be present in the
   source, image, logs or exported artifact.

Update the single version source and lockfile without creating an automatic tag.
For example, **only if this version is unused**:

```sh
npm --prefix web version 0.1.0-beta.3 --no-git-tag-version --ignore-scripts
```

Review the version diff, commit it, push it to `main` and confirm verification of
the selected source. Then, from that exact clean commit, create and push its
matching annotated tag:

```sh
git tag -a v0.1.0-beta.3 -m "POCKET MONkEY 0.1.0-beta.3"
git push origin v0.1.0-beta.3
```

The application/image version has no `v`; the Git tag does. Select a fresh
version rather than copying an example over an existing tag. Do not create a
branch for every release. Maintenance branches are for independently supporting
older lines, not an alternative to the current workflow's `main` ancestry check.

## Review Before Approval

The [GHCR Pre-release workflow](../../.github/workflows/ghcr-prerelease.yml) runs
in this order:

1. Validate the protected prerelease tag, package version, selected revision and
   ancestry from `main`.
2. Reuse full CI to build once, test the actual image and export `verified-image`.
   Verification has no package/release-write permissions.
3. Prepare generated draft release notes, preserving an existing reviewed draft.
   Show the **Candidate Image Review** summary with version, run, attempt, source,
   exact candidate command and release-tag-specific Image Testing creation link.
4. Wait for approval on the protected `release` environment before publishing.

Review and edit the draft while publication waits. Include highlights,
limitations, breaking changes, deployment/upgrade instructions and recovery
precautions; generated pull-request summaries alone are not enough.

For manual candidate acceptance, follow
[Codespaces Image Testing](Codespaces-Image-Testing.md#review-a-pending-release)
using the command from that run's summary. Reuse an existing review Codespace or
follow the creation link, confirm its configuration and choose the machine size
yourself. The workflow does not create, start or delete a personal workspace.
Keep forwarded port 8080 private and use synthetic data. Codespaces usage may
incur charges; stopping a workspace does not remove its stored data.

The candidate helper verifies the current successful verification attempt,
artifact identity, checksums and clean build/source metadata, then loads the
saved image with registry pulls disabled. It does not rebuild or publish.
Check readiness, authentication and intended changes against that image before
approving the same run. A rerun or changed artifact requires fresh review.
Codespaces cloud forwarding/sign-in/persistence acceptance remains separate from
the local script checks; the profiles are still experimental.

The `verified-image` Actions artifact contains `verified-image.tar.gz`,
`image.json`, `build-info.json`, `compose.yaml`, `compose.exports.yaml`,
`deployment.json` and `SHA256SUMS`. Retention is seven days. Actions artifacts are
**not private escrow**: people with the repository's Actions-artifact access can
download the candidate before publication approval. Distribution obligations
therefore apply before export, not only after approving GHCR publication.

## Publish the Tested Artifact

After approval, the privileged job checks environment reviewer rules, anonymous
source access and the unpublished draft. It downloads the same run's artifact,
checks its checksums and loaded image identity, and verifies Linux amd64,
version, revision and clean release labels. It does not check out application
source or rebuild the image.

The publisher pushes only the immutable version tag, verifies an anonymous pull
of its exact digest, then attaches deployment assets and publishes the reviewed
GitHub prerelease. It does not advance stable aliases.

The [published release](https://github.com/eG-dev/MONkEY/releases) provides:

- Reviewed release notes with the exact source revision and image digest.
- `deployment.tar.gz`, containing digest-pinned `compose.yaml`, optional
  `compose.exports.yaml` and `DEPLOYMENT.md`.
- `image.json`, `build-info.json`, `release-identity.json` and `SHA256SUMS` for the
  downloadable assets.

Verify checksums before unpacking and retain the installation's exact Compose
project name, data volume and operator settings when upgrading. New bundles use
direct environment settings; already published assets retain their original
format. See [Backup, Restore and Upgrades](Backup-Restore-and-Upgrades.md).
These JSON records and checksums are not an SBOM or a cryptographic attestation.
Only Linux amd64 is advertised; an exported candidate archive is not an extra
published offline-distribution offering.

## Handle a Failed Attempt

Read the failed job and diagnostics before rerunning. If verification failed,
do not bypass it or approve publication of a replacement local build. If the
first GHCR package is private and anonymous pull fails, make that package public
through GitHub's package settings, then rerun only the failed publishing job
with the retained artifact. The publisher may resume an existing version only
when its image identity matches; different contents are rejected.

Do not move a published tag, reuse its version, replace distributed contents or
delete evidence of a failed run. An expired artifact or required source change
normally calls for a new version and full verification, not a rebuild beneath
an existing image tag. An already published GitHub Release cannot be overwritten
by rerunning this workflow.

For a failed **unpublished** attempt, moving a tag is an exceptional,
explicitly owner-authorized operation only after confirming that no versioned
image, public release or distributed release assets exist. Reconcile stale draft
assets/metadata, retain run history and repeat verification using the approved
tag-protection mechanism; never weaken the ruleset. Follow the exact conditions
in [GitHub delivery](../ADR/ADR-0006-github-delivery.md#release-identity-and-maintenance).

After beta publication, verify the digest-pinned bundle on the intended HTTPS
host, including storage, restarts, jobs and a complete backup/restore rehearsal.
Successful publishing and anonymous pulls do not prove production acceptance.
Remaining acceptance work belongs in the
[finish-line plan](../../plans/migration/README.md), not in release-success claims.