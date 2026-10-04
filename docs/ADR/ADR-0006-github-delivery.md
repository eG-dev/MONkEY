# ADR-0006 GitHub Delivery

_Creation date_: 2026-10-04

## Context

POCKET MONkEY is intended for open-source development on GitHub and self-hosted
Docker use. Contributors need reproducible verification, and operators need
versioned releases traceable to tested source and runtime artifacts.

## Decision

- Build and verify the project through GitHub Actions, without developer-machine or Azure credentials.
- Publish versioned GitHub Releases, with Docker as the primary runtime distribution and accompanying deployment/upgrade information.
- Gate publishing on the relevant E2E, integration, container, and security checks. Publish the tested artifact and record its source revision and image digest.
- Support fork PR verification without secrets or publishing privileges. Grant publishing permissions only to trusted release jobs and do not execute untrusted PR code/artifacts in those jobs.
- Distinguish prereleases from stable releases, never silently overwrite a published version, and advertise only verified host architectures.
- Choose the registry, tag convention, approval mechanism, and provenance tooling separately when evaluated; hosting on GitHub does not itself decide those details.