# ADR-0006 GitHub Delivery

_Creation date_: 2026-10-04
_Updated_: 2026-10-19

## Context

POCKET MONkEY is intended for open-source development on GitHub and self-hosted
Docker use. Contributors need reproducible verification, and operators need
versioned releases traceable to tested source and runtime artifacts.
Public image distribution should integrate with these workflows without requiring
a separate registry account.
Release identities must remain immutable, while maintenance branches should exist
only when an older version needs fixes independently of ongoing development.

## Decision

- Build and verify the project through GitHub Actions, without developer-machine or Azure credentials.
- Treat public source development separately from public image/release distribution. The repository may become public before ORT setup, comprehensive dependency/asset review and About integration, subject to rights, required notices and a private-data/credential review for the material and history being published. Public repository visibility does not authorize image publication or waive the release gates under [ADR-0020](ADR-0020-shipped-component-inventory.md).
- Publish versioned GitHub Releases, with Docker as the primary runtime distribution and accompanying deployment/upgrade information.
- Use GitHub Container Registry (GHCR) as the primary public Docker image registry. Explicitly configure public package visibility and verify anonymous pulls before advertising a release; public repository visibility alone does not establish package visibility.
- Gate publishing on the relevant E2E, integration, container, and security checks. Publish the tested artifact, record its source revision and image digest, and associate packages with their source repository.
- Support fork PR verification without secrets or publishing privileges. Use narrowly scoped `GITHUB_TOKEN` permissions only in trusted publishing jobs and do not execute untrusted PR code/artifacts in those jobs.
- Distinguish prereleases from stable releases, never silently overwrite a published version, and advertise only verified host architectures.
- Choose the owner/image namespace and provenance tooling separately when evaluated; hosting on GitHub does not itself decide those details.

### Release identity and maintenance

- Develop on `main` through verified pull requests. Identify each release with
	an immutable semantic-version Git tag, such as `v1.0.0` or `v1.0.0-rc.1`,
	pointing to the selected verified commit.
- Do not create a branch for every release. Create maintenance branches such as
	`release/1.0` only when supporting an older version independently of `main`.
	Each maintenance release still receives its own immutable tag, such as `v1.0.1`.
- Protect `v*` release tags with a ruleset restricting creation, modification,
	and deletion. Never move a published release tag or reuse its version.

### Publishing flow

- Use a dedicated release-tag-triggered workflow. Validate the version and run
	release verification before publication; require approval through a protected
	GitHub `release` environment before the publishing job runs.
- Build once, test that image, and publish the same artifact without rebuilding.
	Verification jobs have no publishing privileges. Only trusted publishing jobs
	receive the required `contents: write` and `packages: write` permissions.
- Publish immutable GHCR version tags without the Git tag's `v` prefix, such as
	`1.0.0` and `1.0.0-rc.1`. Reject attempts to replace an existing version.
	Stable releases may advance the applicable `1.0`, `1`, and `latest` convenience
	aliases; prereleases must not update stable aliases, and maintenance releases
	must not move aliases backward from newer stable versions.
- Verify anonymous pulls before making the matching GitHub Release public.
	Include release notes, deployment/upgrade information, the source revision,
	and the published image digest. Recommend digest-pinned deployments when exact
	reproducibility is required.

### Release notes

- Maintain release notes in the matching GitHub Release description, not in a
	dedicated branch or a duplicate repository changelog.
- Have the workflow prepare a draft GitHub Release with notes generated from
	merged pull requests since the preceding applicable release. Use the relevant
	version line as the comparison baseline for maintenance releases.
- Review and edit the draft before approving publication. Add curated highlights,
	breaking changes, and deployment/upgrade instructions where needed; generated
	pull-request summaries alone are not sufficient operational guidance.
- Preserve reviewed notes when rerunning the workflow. Publish the prepared
	draft only after release approval, successful GHCR publication, and verified
	anonymous pulls, adding the final source revision and image digest.
- Draft preparation is a trusted release-metadata operation with narrowly scoped
	`contents: write` permission, not a verification job or a reason to grant
	verification jobs publishing privileges.

## Change History

- 2026-10-19: Approved source-only public development before completion of third-party release preparation; public Docker images and versioned releases remain separately gated.