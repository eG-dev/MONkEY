# Troubleshooting

Start with the intended deployment, its logs and readiness status. Preserve data
before changing storage or attempting recovery. Pre-releases still require
host-specific acceptance; a healthy container does not certify the reverse proxy,
backups or every application workflow.

## Collect the Basics

Run these commands from the configured release-bundle directory. Use the same
Compose files, project name and overrides as the running instance. These examples
use only `compose.yaml`; include your networking or export overrides when applicable.

```sh
docker compose -f compose.yaml config --quiet
docker compose -f compose.yaml ps --all
docker compose -f compose.yaml logs --tail 100 app
```

Check the first startup failure rather than only the last message in a restart
loop. Record the application version, exact image digest and time of the failure.
The application contains supervised Node and .NET processes; a process failure
can stop the whole container, and its restart policy may then restart it.

`config --quiet` validates without printing the resolved configuration. The full
`docker compose config` output can include private values and mount paths; do not
paste it into a public issue. Do not publish full environment dumps, snapshots,
database files, passwords, cookies, authentication keys or unredacted logs.

## Distinguish Liveness From Readiness

| Endpoint | Successful response means | What it does not prove |
| --- | --- | --- |
| `/health/live` | The web process responds | Backend or storage availability, successful sign-in or working jobs |
| `/health/ready` | The web process can reach backend readiness, which checks database access and persistent storage | Successful exports, every financial workflow or off-host backup protection |

Web readiness returns HTTP `200` with status `ready`, or HTTP `503` with status
`unavailable`. The image's Docker health check uses readiness. A failed request or
unhealthy status needs investigation; repeatedly restarting is not a repair.

From a host with `curl`, replace the example origin with your configured HTTPS URL:

```sh
curl --fail --show-error --include --max-time 10 https://monkey.example.com/health/ready
```

To separate application failure from proxy failure, you can also check the host
upstream if your deployment publishes the default loopback port:

```sh
curl --fail --show-error --include --max-time 10 http://127.0.0.1:8080/health/ready
```

Run the latter on the Docker host and adjust its port to your actual mapping.
It is a diagnostic upstream request, not an HTTP sign-in URL. A proxy connected
through a Docker network may have no published host port at all.

If the upstream is ready but the public request fails, check DNS, certificates,
proxy routing and networking. If upstream readiness fails too, inspect application
logs, database access, mount permissions and available storage. A `502` with code
`backend_unavailable` from the Web-BFF means its backend request failed; do not
expose the backend port as a workaround.

## Startup or Configuration Changes Fail

- Check `MONKEY_PUBLIC_URL`: production requires a complete HTTPS origin without
  a path, query, fragment or embedded credentials.
- Check the business `TZ`, supported locale/currency, retention values, absolute
  data/export paths and writable mounts against [Configuration](Configuration.md).
- Keep `MONKEY_BACKEND_URL` internal and loopback-only. Do not replace it with the
  public URL or a remote service to resolve a transport error.
- Inspect the actual Docker host's free disk space and storage availability.
  Preserve the complete data root before any database recovery work; never delete
  SQLite WAL/journal files or authentication keys to make startup succeed.

After changing Compose environment or mounts, validate and recreate the service:

```sh
docker compose -f compose.yaml config --quiet
docker compose -f compose.yaml up -d --no-build
```

`docker compose restart` restarts the old container with its existing environment;
it does not apply changed Compose settings. An interpolation environment file also
does not override a literal `environment` value. See
[configuration precedence](Configuration.md).

## HTTPS Works but Sign-In Fails

Use the exact HTTPS origin configured in `MONKEY_PUBLIC_URL`, not the HTTP
upstream or an alternative hostname. Production cookies are Secure. Do not turn
off Secure cookies, bypass certificate checks or weaken origin/CSRF validation.

Check that the proxy forwards to the web service's container port `8080` using the
deployment's actual network. A containerized proxy's `127.0.0.1` is its own
container, not the application or Docker host. The host-loopback proxy example in
the [technical guide](../development.md#host-https-reverse-proxy) is specifically
for a proxy on the same host.

Trust forwarded headers only from the proxy IP addresses or CIDRs actually seen
by the web process. Leave `MONKEY_TRUSTED_PROXIES` empty when that processing is
not needed. Never use a trust-all network as a troubleshooting shortcut. Missing
proxy trust can also cause client-IP rate limiting to group requests together.

If a request reports `csrf_invalid`, reload the application at its configured
origin and retry with a fresh page. Check proxy origin/cookie handling if it
persists; do not replay captured credentials or remove the antiforgery check.

## Access Is Locked or a Password Must Change

There is no public registration, default password or email recovery. Bootstrap
creates the first Manager only while the installation has no users. A restored
complete installation already contains its users; financial-only recovery does not.

Five failed password attempts lock an account for fifteen minutes. Login also
has an instance-wide rate limit of twenty attempts per minute. Stop repeated
attempts and allow the relevant limit to clear. A temporary or recovered password
requires a password change before ordinary protected access.

For a forgotten password, use Manager user administration where available, or
the [interactive operator recovery procedure](Backup-Restore-and-Upgrades.md#recover-manager-access)
for an existing Manager. Verify the command's reported data directory before
entering credentials. Recovery against another volume cannot repair this instance.

Members can read every account but cannot perform business writes. A missing
write control or a rejected business write may be correct authorization, not a
deployment failure. Never change roles directly in SQLite to bypass it.

## Accounts or Images Appear Missing

Check the Compose project name, `COMPOSE_PROJECT_NAME`, any `--project-name`
override and the data mount before creating users or accounts. A changed project
name can select a fresh named volume. Changing `MONKEY_DATA_PATH` does not move
existing files or change a Docker mount automatically.

Stop unintended instances and identify the original volume. Do not delete either
volume or copy selected database files between them. Follow
[complete installation recovery](Backup-Restore-and-Upgrades.md#restore-a-complete-installation)
when restoration is needed.

The complete data root includes the database, `images/` and `keys/`. A financial
JSON import intentionally restores accounts with default images and does not
restore login users or authentication keys. Missing image files also use the
account's fallback display; compare what your recovery source actually includes.

Linux bind mounts must be private and writable by UID/GID `10001:10001`, with
owner-only data-directory permissions such as `0700`. Correct only the intended
mount's ownership and permissions. Do not run the application as root or grant
world access. Use local disk and a single application instance per data root.

## Financial Exports or Import Fail

Exports require an explicitly enabled, pre-created private directory outside the
main data root. Data and export paths must not overlap or use symbolic links.
Confirm the export override is included on your Compose commands; the base
configuration alone leaves exports disabled. Check directory ownership, write
access, free space and application logs.

No new file on an unchanged day is expected. Exports check at 01:00 in business
`TZ` and publish only changed financial content; retention counts snapshots, not
days. A ready application does not establish that exports succeeded. An invalid
latest snapshot is a reported failure, not an unchanged result. Preserve earlier
completed snapshots while investigating.

Offline import must target empty financial state with matching configuration.
`recovery_target_not_empty` is a protection, not an instruction to erase a volume.
For `snapshot_invalid`, `snapshot_version_unsupported`,
`snapshot_configuration_mismatch` or `recovery_storage_busy`, preserve the original
snapshot and resolve the reported cause. Do not hand-edit balances, run imports
against live storage or add reset flags. Follow the
[financial import procedure](Backup-Restore-and-Upgrades.md#import-financial-data-offline).

## An Upgrade Fails

Stop the failed instance, retain logs and preserve both its current state and the
pre-upgrade backup. An older image cannot undo migrations. Restore a complete
compatible installation or use an explicitly schema-compatible image, following
[upgrade recovery](Backup-Restore-and-Upgrades.md#upgrade-without-losing-recovery-options).
Do not repeatedly switch image versions against the same unverified database.

## Report a Reproducible Problem

Include the exact version and digest, host OS/architecture, relevant sanitized
configuration, symptom, timestamp, reproduction steps, expected result and actual
result. State whether the issue affects upstream readiness, the public HTTPS
route, sign-in or one operation. Include only a short redacted log excerpt and
use synthetic records for screenshots and reproduction.

Report through [GitHub Issues](https://github.com/eG-dev/MONkEY/issues) following
the [contribution guide](../../CONTRIBUTING.md). Do not publish credentials or
private financial data to make a report easier to reproduce.