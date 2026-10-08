# Docker environment configuration

Status: implemented and locally verified in [stack foundation](01-stack-foundation.md).
Real host HTTPS/mount configuration remains an operational gate; see the
[foundation guide](../../revamp/README.md) and [ADR-0007](../../docs/ADR/ADR-0007-application-foundation.md).

## Environment contract

The business timezone is configured through Docker ENV. The remaining settings
below are the implemented deployment contract.
Read configuration at startup and validate it before readiness succeeds.

| Variable | Default | Purpose |
| --- | --- | --- |
| `TZ` | `UTC` | IANA business timezone, for example `Europe/Berlin`; shared by Node and .NET. |
| `MONKEY_DATA_PATH` | `/data` | Absolute container path containing all persistent application state. |
| `MONKEY_PUBLIC_URL` | Required in production | Public origin, for example `https://monkey.home.example`; used for redirects and origin validation. |
| `MONKEY_LOG_LEVEL` | `Information` | Shared application log level, mapped explicitly to both runtime logging systems. |
| `MONKEY_DEFAULT_LOCALE` | `de-DE` | Instance fallback presentation locale; German and English are initially supported. Users may override it without changing timezone or currency. |
| `MONKEY_CURRENCY` | `EUR` | Instance-wide display unit: `EUR` or `USD`. Its symbol follows localized amounts; changing it relabels values without conversion. |
| `MONKEY_TRUSTED_PROXIES` | Empty: trust none | Explicit proxy IP addresses or CIDRs allowed to supply forwarded headers. |

## Configuration rules

- The backend reads `TZ` explicitly for business rules; setting the OS timezone alone is not the scheduling implementation.
- Include timezone data and required globalization support in the image. Verify the configured IANA ID in both runtimes and fail startup on invalid values.
- Persist timestamps in UTC; derive allowance months and report boundaries in the configured business timezone, not the browser timezone.
- Timezone changes require a restart and a deliberate policy for existing schedules/periods. Never silently reinterpret closed reports or duplicate credits.
- Derive `monkey.db`, `images/`, and `keys/` beneath `MONKEY_DATA_PATH`; do not expose independent path variables until a real need exists.
- The host bind-mount path is a Docker/Compose setting, not an application variable. For example, mount `/srv/monkey` on the host to `/data` in the container; no `MONKEY_DATA_PATH` override is needed.
- Validate that the data path is absolute, private, and writable by the non-root backend. Do not fall back silently to ephemeral container storage if the configured path is invalid.
- Keep the public container port fixed initially; select the host port through Docker port publishing. Keep the internal backend address server-only.
- Do not disable Secure cookies based on a configurable public URL; production requires HTTPS. Restrict forwarded-header trust to the configured proxies.
- Keep passwords, bootstrap credentials, and signing keys out of ordinary ENV values; use protected secret files or an operator command for sensitive setup.
- Document defaults and expose only safe browser configuration. Do not forward the full server environment to Angular.
- Validate `MONKEY_CURRENCY` before readiness. Follow [ADR-0011](../../docs/ADR/ADR-0011-currency-display-unit.md): the setting changes only displayed units, never exact arithmetic or stored financial history.

Language selection follows the [localization plan](localization.md); it does not
change business periods or stored financial values.

## Acceptance gate

- [x] Non-default `TZ` and data-root settings work; invalid timezone/path/proxy settings fail startup clearly.
- [x] Node and .NET agree on timezone behavior, including daylight saving boundaries.
- [x] Non-root runtime can write mounted paths and reports actionable permission errors.
- [x] EUR/USD display works independently of language; changing the unit preserves exact amounts/provenance, and unsupported currencies fail startup.