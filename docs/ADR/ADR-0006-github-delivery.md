# ADR-0006 GitHub Delivery

_Creation date_: 2026-10-04

## Context

POCKET MONkEY is intended for open-source development on GitHub and self-hosted
Docker use. Contributors need reproducible verification, and operators need
versioned releases traceable to tested source and runtime artifacts.
Public image distribution should integrate with these workflows without requiring
a separate registry account.

## Decision

- Build and verify the project through GitHub Actions, without developer-machine or Azure credentials.
- Publish versioned GitHub Releases, with Docker as the primary runtime distribution and accompanying deployment/upgrade information.
- Use GitHub Container Registry (GHCR) as the primary public Docker image registry. Explicitly configure public package visibility and verify anonymous pulls before advertising a release; public repository visibility alone does not establish package visibility.
- Gate publishing on the relevant E2E, integration, container, and security checks. Publish the tested artifact, record its source revision and image digest, and associate packages with their source repository.
- Support fork PR verification without secrets or publishing privileges. Use narrowly scoped `GITHUB_TOKEN` permissions only in trusted publishing jobs and do not execute untrusted PR code/artifacts in those jobs.
- Distinguish prereleases from stable releases, never silently overwrite a published version, and advertise only verified host architectures.
- Choose the owner/image namespace, tag convention, approval mechanism, and provenance tooling separately when evaluated; hosting on GitHub does not itself decide those details.