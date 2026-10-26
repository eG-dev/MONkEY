# Docker environment configuration

Status: implemented and locally verified in [runtime stack](01-runtime-stack.md).
Real host HTTPS/mount configuration remains an operational gate; see the
[development guide](../../docs/development.md) and [ADR-0007](../../docs/ADR/ADR-0007-application-foundation.md).

## Environment contract

The maintained contract now lives in the canonical
[Configuration guide](../../docs/wiki/Configuration.md#environment-variables).
This plan retains acceptance ownership and compatibility anchors, not a second
independently maintained variable table. Read and validate configuration at
startup, before readiness succeeds.

## Configuration rules

Follow the guide's [language, currency and time rules](../../docs/wiki/Configuration.md#language-currency-and-time),
[storage requirements](../../docs/wiki/Configuration.md#storage-and-permissions),
[HTTPS/proxy restrictions](../../docs/wiki/Configuration.md#https-and-proxy-trust)
and [export rules](../../docs/wiki/Configuration.md#optional-financial-exports).
Keep timezone data and globalization support in the image and validate the IANA ID
in both runtimes. No independently configurable database, image or key paths are
introduced. Language contribution work remains in the [localization plan](localization.md).

## Acceptance gate

- [x] Non-default `TZ` and data-root settings work; invalid timezone/path/proxy settings fail startup clearly.
- [x] Node and .NET agree on timezone behavior, including daylight saving boundaries.
- [x] Non-root runtime can write mounted paths and reports actionable permission errors.
- [x] EUR/USD display works independently of language; changing the unit preserves exact amounts/provenance, and unsupported currencies fail startup.