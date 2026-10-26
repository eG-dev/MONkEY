# Configuration

Read configuration at startup and validate it before readiness succeeds. Set
application variables directly under `services.app.environment` in `compose.yaml`.
Recreate the container after changes. No separate environment file is required.
Keep passwords, keys and other secrets out of Compose configuration.

Environment-file interpolation is optional: replace a direct value with an
explicit `${VARIABLE:-default}` expression if you prefer that arrangement, then
supply it through your shell or Compose's `--env-file` option. Merely adding a
variable to an environment file does not override a literal Compose value.
A service-level `env_file` supplies container variables and is different from
Compose interpolation; an explicit `environment` entry takes precedence over it.

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONKEY_PUBLIC_URL` | Required in production | Public HTTPS origin used for redirects and origin validation. |
| `TZ` | `UTC` | IANA business timezone, for example `Europe/Berlin`, shared by Node and .NET. |
| `MONKEY_DATA_PATH` | `/data` | Absolute container path containing persistent application state. |
| `MONKEY_LOG_LEVEL` | `Information` | Shared application logging level. |
| `MONKEY_DEFAULT_LOCALE` | `de-DE` | Instance presentation fallback: `de-DE` or `en-US`. |
| `MONKEY_CURRENCY` | `EUR` | Display unit: `EUR` or `USD`; changing it does not convert stored values. |
| `MONKEY_TRANSACTION_RETENTION_MONTHS` | `24` | UTC calendar-month detail retention: `1` through `120`; `0` retains unlimited history. |
| `MONKEY_EXPORT_PATH` | Unset; disabled | Absolute private export directory outside the main data root. |
| `MONKEY_EXPORT_KEEP_COUNT` | `30` | Financial snapshots to retain: `1` through `365`; `0` retains all snapshots. |
| `MONKEY_TRUSTED_PROXIES` | Empty; trust none | Explicit proxy IP addresses or CIDRs allowed to supply forwarded headers. |

The top-level Compose `name` selects the project and its named volume; keep it
stable across upgrades. An explicit `--project-name` or `COMPOSE_PROJECT_NAME`
overrides that value, so remove stale overrides before operating an instance.
Set host storage paths directly in volume mounts, including the optional export
override's bind `source`. Host ports and storage paths are Compose settings, not
application variables or overrides of the internal backend address.

## Language, Currency and Time

Language, currency and business timezone are separate choices. Saved user language,
an explicit language cookie, supported browser language and the instance default
determine presentation in that order. A Member may change personal language
without gaining financial-write permissions.

Currency is an instance-wide display unit. Changing EUR to USD relabels values;
it never performs conversion or silently rewrites financial history. Follow the
[currency decision](../ADR/ADR-0011-currency-display-unit.md).

Timestamps remain UTC. Allowance periods and the daily export slot use `TZ`,
independently of browser timezone. The backend reads `TZ` explicitly; changing
only the host clock or OS timezone is not sufficient. Timezone changes require
a restart and deliberate review of existing schedules and periods.
Never silently reinterpret recorded allowance periods or duplicate credits.

Retention uses UTC calendar months, independently of `TZ`. Cleanup runs at startup
and daily, preserving balances, openings, audit and durable financial safety
records. Increasing retention cannot recover deleted transaction details. Set it
to `0` before starting a restored database if automatic pruning must stay disabled.
See the [retention decision](../ADR/ADR-0012-manual-transactions-and-signed-balances.md).

## Storage and Permissions

Persist the entire data root on private local disk. It contains `monkey.db`,
`images/` and `keys/`; do not back up only the database and assume the installation
is recoverable. SQLite is single-instance storage, not a shared multi-replica database.

The production process uses UID/GID `10001`. Bind-mounted directories must be
private and writable by that identity. An invalid or unwritable path must fail
startup rather than fall back to ephemeral container storage. A host mount such
as `/srv/monkey:/data` does not require changing `MONKEY_DATA_PATH`.

## HTTPS and Proxy Trust

Production authentication requires HTTPS. Set `MONKEY_PUBLIC_URL` to the browser's
actual origin and terminate TLS at a reverse proxy. Forward HTTP to port 8080;
do not expose the internal backend port. Configure explicit trusted proxy addresses
only when forwarded headers are needed. An empty setting trusts none.

Do not disable Secure cookies based on the public URL, trust arbitrary forwarded
headers, or expose the full server environment to the browser. Passwords, bootstrap
credentials and signing keys do not belong in ordinary environment variables.

## Optional Financial Exports

Mount a separate private export directory outside the main data root. The paths
must not overlap or use symbolic links. Pre-create a Linux bind mount with owner
UID/GID `10001` and owner-only permissions, such as `0700`.

When enabled, exports check on startup and daily at 01:00 business time, writing
only changed financial data. Retention counts completed snapshots, not their age.
No export interval or schedule setting exists. A no-op transaction-retention scan
does not by itself create another export.

Financial exports omit Identity users, passwords, authentication keys and images.
Copy them off-host, but also maintain full-volume backups. See the
[export and import procedures](../development.md#portable-financial-recovery).