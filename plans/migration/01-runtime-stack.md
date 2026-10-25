# Milestone 1: Runtime Stack

Status: implemented and locally verified. Authentication and financial features
are also implemented; this is not an unfinished runtime spike. Current hosted
release, fork and real-host acceptance remains in the [finish-line plan](README.md).

## Implemented Stack

Follow [ADR-0007](../../docs/ADR/ADR-0007-application-foundation.md) and the
[verified toolchain/build guide](../../docs/development.md#verified-stack).

- Angular SSR/Web-BFF with Taiga UI, local Lucide assets and German/English catalogs.
- ASP.NET Core backend, EF Core SQLite migrations and private persistent image/key directories.
- One non-root Linux container with supervised Node/.NET, bounded shutdown and whole-container failure if either application process fails.
- API forwarding before SSR fallback, backend/storage readiness, validated configuration and structured logs.
- Locked independent web/backend builds, production-image tests and protected GitHub delivery.
- No development toolchains or required runtime internet services in the production image.

## Ownership and Storage

[ADR-0002](../../docs/ADR/ADR-0002-application-boundaries.md) and
[ADR-0017](../../docs/ADR/ADR-0017-backend-project-boundaries.md) own the boundaries:

- `PocketMonkey.Host` owns configuration, endpoints, Identity, application services, jobs, operator commands, startup and filesystem behavior.
- `PocketMonkey.Storage` is a library owning EF context/entities/mappings/migrations. The production dependency is Host -> Storage, never the reverse.
- Host orchestrates migrations before readiness; migrations live directly under `backend/PocketMonkey.Storage/Migrations`, with one model snapshot and preserved migration identities.
- Only the backend accesses SQLite; local disk, short atomic transactions and bounded busy handling. No database transaction spans network/filesystem work.
- Browser traffic uses one public origin. The backend binds to loopback, internal addresses stay server-only, and identity/language remain request-scoped through SSR.

Use the maintained [backend guide](../../docs/development.md#backend-structure)
for EF commands; this completed extraction is not a pending redesign proposal.

## Acceptance Gate

- [x] Locked local solution, Angular SSR and production-image builds work.
- [x] SSR/hydration, Taiga, local fonts/icons and offline runtime work.
- [x] Database, images and authentication keys persist across restart/container replacement.
- [x] Intended port exposure, startup validation and meaningful readiness are tested.
- [x] Process crashes and bounded stop/shutdown are covered against the real container.
- [x] Linux timezone/globalization and German/English behavior are covered.
- [x] Host/Storage ownership, migration discovery and populated upgrades are verified locally.
- [ ] Current hosted release/fork verification and successful publication pass [builds and releases](builds-releases.md#acceptance-gates).
- [ ] The Ubuntu host verifies HTTPS, private storage and recovery under [operations](04-operations-cutover.md#release-gate).

## Limits

Initial publication is Linux amd64 and single-instance local-disk SQLite. Do not
claim ARM, multi-replica or host readiness from local checks. The application
requires HTTPS supplied by the configured host/reverse proxy; one container does
not eliminate operator setup, backups or update responsibilities.