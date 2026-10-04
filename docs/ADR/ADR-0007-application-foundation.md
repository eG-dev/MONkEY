# ADR-0007 Application Foundation

_Creation date_: 2026-10-04

## Context

POCKET MONkEY needs a small, offline-capable Docker deployment with durable state,
server rendering, bilingual presentation, and a reproducible build. Its small
shared-instance workload does not require an external database service. Runtime
compatibility and process/storage failures must be verified against the real image.

## Decision

- Use supported Angular 22, Node 24 LTS, Taiga UI 5, and .NET 10 versions. Pin the SDK, container base digests, and dependency lockfiles; record patch versions and reproducible commands in the [foundation guide](../../revamp/README.md).
- Use EF Core SQLite for backend-only structured storage, with foreign keys, bounded busy handling, short transactions, and migrations before readiness. Use local disk, not a network share. Monetary representation remains a separate business decision.
- Keep the database, images, and Data Protection keys beneath one configurable private data root. Require owner-only Linux directory permissions and writable storage; fail rather than fall back to ephemeral state. Keys are filesystem-protected, not encrypted at rest by this arrangement.
- Run production Node and .NET processes in one non-root image. Use Tini for signal/reaping duties and Supervisor for lifecycle management, with an event listener and wrapper that fail the container when an application process exits unexpectedly or cannot start. Publish only the web port and bind the backend to loopback.
- Use the documented `TZ`, public-origin, data-path, language, logging, and proxy settings. Production requires an HTTPS public origin supplied by the host deployment; never infer financial periods from browser language.
- Use Transloco with its MessageFormat integration, English source/fallback catalogs, German instance default, and bundled Taiga resources. Resolve anonymous language from an explicit supported-language cookie, then supported Accept-Language negotiation, then the instance default; authenticated preferences take priority when available.
- Keep SSR language/data request-scoped, disable automatic HTTP transfer caching, and transfer only explicitly reviewed browser-safe data. Bundle Lucide fonts and retain their license locally.
- Use Playwright against isolated real production-image instances/volumes for browser acceptance and lifecycle checks. Use test-only mounted probes for cross-runtime contracts; do not ship test tooling or expose production test endpoints. No routine unit-test suite is required.

This implements the boundaries in [ADR-0002](ADR-0002-application-boundaries.md),
language/timezone separation in [ADR-0004](ADR-0004-language-and-timezone.md), and
verification strategy in [ADR-0005](ADR-0005-e2e-first-verification.md).