---
description: "Use when implementing replacement Docker deployment or GitHub Actions builds/releases: process lifecycle, persistent state, secure publishing, and operational recovery."
applyTo: "deploy/**,.github/workflows/*.yml,.github/workflows/*.yaml"
---
# Deployment and CI

- Follow [GitHub delivery](../../docs/ADR/ADR-0006-github-delivery.md), the [build/release plan](../../plans/migration/builds-releases.md), and the [operations plan](../../plans/migration/04-operations-cutover.md).
- Use the primary public registry, [GHCR](../../docs/ADR/ADR-0006-github-delivery.md), with narrowly scoped `GITHUB_TOKEN` publishing jobs. Verify anonymous pulls and explicit public package visibility; public source visibility alone is insufficient. Registry selection does not authorize publishing before the release gates are met.
- The selected [foundation arrangement](../../docs/ADR/ADR-0007-application-foundation.md) is one non-root Node/.NET image with Tini/Supervisor and fail-fast process events, locally verified on Linux x86-64. Keep its crash/shutdown tests passing; extra services or architectures require explicit evaluation.
- Run applications non-root, forward shutdown signals, reap child processes, and surface failed child processes. Readiness must cover meaningful backend/storage availability, not just a listening frontend port.
- Persist database, images, and authentication keys outside the container writable layer. Validate the [ENV contract](../../plans/migration/configuration.md); do not log secrets or weaken Secure cookies for deployment convenience.
- Use explicit trusted proxies and production HTTPS. Document host mount paths separately from container data paths and published ports.
- Keep test/build toolchains out of production images. Verify offline runtime assets and only advertise tested architectures.
- GitHub PR checks must work without Azure secrets or publishing privileges. Pin third-party actions to reviewed SHAs; use read-only permissions except narrowly scoped trusted publishing jobs.
- Never execute untrusted contribution code or PR artifacts in privileged publishing jobs. Publish the tested image/digest and matching release assets; failed checks must not publish stable releases.
- Legacy Azure workflows were removed with owner approval. Keep root CI read-only and secret-free; run the guardrail validator when workflow scopes change.
- Back up persistent state consistently, rehearse restore/upgrades, and document schema compatibility. Image rollback alone is not a database rollback.
- Follow the [verified build/lifecycle commands and remaining gates](../../docs/development.md). Hosted CI and publishing rehearsal remain unverified; local image tests and workflow parsing do not prove publishing or production readiness.