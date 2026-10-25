# GitHub Builds and Releases

Status: root CI and protected public GHCR pre-release publishing are implemented.
Beta.1 attempts have failed before publication; the reported current blocker is
hosted .NET installation/download availability. Successful publishing, anonymous
pulls and real-host acceptance remain unverified. Retry the failed job only after
checking its actual failure. See the [finish-line plan](README.md).

## Verification Tiers

- PRs: locked builds, dependency audits, catalog/type/About-input checks, guardrails and six real-image desktop smoke cases.
- PRs labelled `full-e2e`: full regression in addition to the normal checks.
- `main`, manual verification, release calls and image export: full real-image E2E, persistence, recovery and container-lifecycle suite.
- Ordinary verification is read-only, fork-safe and secret-free; privileged publishing does not execute PR code or rebuild an untrusted artifact.
- Pin actions to reviewed SHAs, keep zero test retries and retain useful failure artifacts without credentials/private household data.

See [testing](testing.md#ci-verification-tiers) for the current matrix. Fork-specific
verification remains an explicit acceptance item, not proven by local success.

## Release Workflow

Follow [ADR-0006](../../docs/ADR/ADR-0006-github-delivery.md) and the
[GitHub/GHCR setup guide](../../docs/development.md#ghcr-prereleases).

1. Select a reviewed commit reachable from `main`; match its protected semantic-version tag to the application manifest version.
2. Build once with clean, matching release identity and complete reviewed notice inputs; test that exact production image in full CI.
3. Prepare a draft GitHub Release and generated notes. Review highlights, limitations and deployment/upgrade instructions before approving publication.
4. Require the protected `release` environment's approval. The publisher downloads the same run's checksum-checked image without checking out source or rebuilding.
5. Verify Linux amd64, version/revision/source/build identity and anonymous matching-source access. Push only the immutable version tag to `ghcr.io/eg-dev/monkey`.
6. Verify anonymous pulling of the exact digest. Attach digest-pinned deployment assets and publish the reviewed GitHub pre-release.

Existing version tags may resume only with the identical image; never overwrite
a distributed version with different contents. Failed unpublished attempts may
be retagged only after explicit authorization and the checks in ADR-0006. Keep
failed run history and remove stale draft assets if applicable. Do not weaken
tag protection or bypass failed verification.

The implemented workflow supports pre-releases only. It does not advance
`latest`, major or minor aliases. A stable-release publication/alias path must
be agreed and verified before claiming 1.0.0 publishing support.

## About Content and Release Inputs

Use [ADR-0019](../../docs/ADR/ADR-0019-build-identity-and-about-assets.md),
[ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md) and the
[notice guide](../../notices/README.md), not a separate inventory implementation.

- One application version, exact commit, clean release identity and source link must agree across About, OCI labels and release assets.
- The project license is copied exactly from the root license. Reviewed German/English legal content remains separate from upstream originals and dependency metadata.
- GitHub dependency reporting and targeted distribution review replace mandatory ORT. Dependabot alerts and notifier-only Renovate do not replace rights, compatibility or source-obligation review.
- The curated collection is complete and the owner confirmed release review. Changed shipped packages/assets/native/runtime/OS material requires renewed applicable review; do not manufacture approval from successful generation or audit output.
- Ordinary builds package maintained notices. Release builds enforce evidence, document hashes, generated-bundle consistency, reviewed status and resolved findings.
- Bundle required originals, upstream runtime/OS notices and applicable corresponding source before testing. No runtime downloads or post-test artifact modification.

The maintained build wrapper is `npm --prefix web run build:image`; use the
[build guide](../../docs/development.md#build-metadata-and-license-generation)
for its release inputs and reproducible commands.

## Release Assets

The implemented pre-release path produces:

- The tested Linux amd64 image, an immutable version and its exact digest.
- Reviewed GitHub Release notes and a digest-pinned Compose deployment bundle with ENV examples and installation/backup/upgrade guidance.
- Image inspection, build identity, release identity and SHA-256 download checksums.

These files are not a generated SBOM or cryptographic attestation. Decide and
verify the required stable-release provenance/security artifacts separately.
Do not advertise untested architectures or add an offline image archive unless
that distribution requirement is explicitly agreed.

## Home-Server Pre-release Verification

Publish the verified beta first, then pull its digest on the Ubuntu Docker VM.
Host HTTPS/storage, restart/jobs and manual full-installation backup/restore
checks follow publication; they are not circular prerequisites for obtaining
the beta. Use [operations](04-operations-cutover.md) for the host checklist.
Public beta distribution still requires automated verification, notices, source
access and approval. Production readiness is a separate subsequent acceptance.

### Home-Server Prerelease Verification

The current sequence and responsibilities are described immediately above; this
reference remains for existing links. Successful host rehearsal is still open.

## Acceptance Gates

- [ ] Current clean hosted verification passes the complete release suite and locked build/input checks.
- [ ] A fork PR exercises the intended checks without secrets or publishing permissions.
- [ ] Protected tags, required reviewers and narrowly scoped publishing permissions are verified without weakening failure gates.
- [ ] About/image/release source identity, license/notices, reviewed inputs and source delivery match the tested artifact.
- [ ] A draft is reviewed and the same-run tested image is published without rebuilding or moving stable aliases.
- [ ] Anonymous digest pull succeeds and matching release assets/checksums are downloadable.
- [ ] Partial-publication reruns preserve identical version contents and reviewed notes; failed verification never publishes.
- [ ] The deployment bundle works on the Ubuntu host; supported architectures, limitations and operational instructions are accepted.
- [ ] Stable publishing, security scan and SBOM/provenance expectations are agreed and verified before a stable release.