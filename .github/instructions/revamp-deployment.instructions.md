---
description: "Use when implementing replacement Docker deployment or GitHub Actions builds/releases: process lifecycle, persistent state, secure publishing, and operational recovery."
applyTo: "revamp/deploy/**,.github/workflows/revamp-*.yml,.github/workflows/revamp-*.yaml"
---
# Deployment and CI

- Follow [GitHub delivery](../../docs/ADR/ADR-0006-github-delivery.md), the [build/release plan](../../plans/migration/builds-releases.md), and the [operations plan](../../plans/migration/04-operations-cutover.md).
- The target is a self-contained Docker deployment. Evaluate the preferred single-container/two-process arrangement in the foundation spike; do not silently require extra services or claim supervision has been verified.
- Run applications non-root, forward shutdown signals, reap child processes, and surface failed child processes. Readiness must cover meaningful backend/storage availability, not just a listening frontend port.
- Persist database, images, and authentication keys outside the container writable layer. Validate the [ENV contract](../../plans/migration/configuration.md); do not log secrets or weaken Secure cookies for deployment convenience.
- Use explicit trusted proxies and production HTTPS. Document host mount paths separately from container data paths and published ports.
- Keep test/build toolchains out of production images. Verify offline runtime assets and only advertise tested architectures.
- GitHub PR checks must work without Azure secrets or publishing privileges. Pin third-party actions to reviewed SHAs; use read-only permissions except narrowly scoped trusted publishing jobs.
- Never execute untrusted contribution code or PR artifacts in privileged publishing jobs. Publish the tested image/digest and matching release assets; failed checks must not publish stable releases.
- Do not edit legacy Azure deployment workflows as an incidental side effect. Foundation work must address their broad triggers explicitly before replacement changes are pushed to the default branch.
- Back up persistent state consistently, rehearse restore/upgrades, and document schema compatibility. Image rollback alone is not a database rollback.
- Record actual build, lifecycle, scan, and publishing checks once available; no replacement image or workflow exists yet.