# ADR-0019 Build Identity and About Assets

_Creation date_: 2026-10-17

## Context

Operators need to identify the running application and its matching source.
About, sign-in, navigation, and container metadata must not disagree or imply
that uncommitted changes belong to a published revision. The full project
license must remain locally available without manually maintaining duplicate text.

## Decision

- Use the [web package version](../../revamp/web/package.json) as the single application SemVer input. Require both lockfile version fields to match it and release tags to be exactly `v<version>`. Framework and dependency versions are separate component identities.
- Capture the full Git commit and source cleanliness before container packaging. Build About, sign-in, shell, static metadata, and OCI labels from the same validated inputs. Record development/release identity; unavailable or dirty provenance must be explicit, not fabricated.
- Release inputs require clean source, a tag pointing to the captured commit, matching version fields, and an explicitly configured public repository URL. Do not infer a public source URL from a developer's Git remote. Only clean, identified builds receive revision-specific source links.
- Generate inline and downloadable project-license assets from the canonical root [LICENSE](../../LICENSE), preserving its text and recording its SHA-256 hash. Keep generated assets and prepared container inputs out of source control; validate them during the build.
- Assemble metadata and license assets before testing the image, verify their agreement with OCI label inputs, and reject input drift after the build. Do not mutate or rebuild the tested artifact for publication.
- Bundle these static public assets locally without backend endpoints, household data, runtime registry requests, or consent state. Build-only dependencies are not delivered-component notices unless their code or assets are redistributed.
- Build-identity validation does not establish complete third-party notices, reviewed legal wording, Corresponding Source completeness, or permission to publish. Those retain their independent release gates.

This refines [GitHub delivery](ADR-0006-github-delivery.md) and
[project licensing](ADR-0018-project-license.md). Operational commands are documented
in the [build guide](../../revamp/README.md#build-metadata-and-license-generation).