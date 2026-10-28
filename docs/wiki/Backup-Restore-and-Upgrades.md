# Backup, Restore and Upgrades

Keep a complete installation backup before upgrades or recovery work. Financial
JSON snapshots are an additional recovery option, not a substitute for that backup.
Use synthetic data to rehearse both paths before relying on them for real records.
Real-host full-volume restore and upgrade-failure acceptance remain open; this
guide describes the supported procedure, not a completed host rehearsal.

## Choose the Recovery Source

| Recovery source                                                      | Includes                                                                                                                                                 | Does not provide                                                                                                  |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Complete stopped-instance data backup, plus deployment configuration | Database and its accompanying SQLite files, account images, users, password records and authentication keys                                              | Writes made after the backup, or an automatic database downgrade                                                  |
| Financial JSON snapshot                                              | Accounts, exact stored balances, retained ledger details, historical attribution, allowance revisions/executions and permanent retry/maintenance records | Login users, passwords, sessions, authentication keys, images, later writes or already-pruned transaction details |

A separate directory on the same disk is not off-host disaster protection.
Choose backup frequency, retention, encryption and private off-host storage to
match how much data loss and downtime you can accept. Restrict access to backups:
they contain private financial data and, for complete backups, authentication state.

## Back Up the Complete Installation

Run commands from the configured release-bundle directory used for this instance.
Use the same Compose files, project name and overrides on every command. The
examples below use only `compose.yaml`; include your export or networking overrides
when applicable. Check for a stale `COMPOSE_PROJECT_NAME` or `--project-name`
override before operating the instance.

1. Record the running image digest, application version and matching release
   bundle. Preserve private deployment configuration, proxy settings, Compose
   project/volume identity and any environment-file inputs separately.
2. Stop the application and confirm that the command succeeds:

   ```sh
   docker compose -f compose.yaml stop app
   ```

3. Using your host's backup tooling, copy the complete mounted data root while
   the application remains stopped. The default container path is `/data`;
   identify the actual named volume or host bind in your configured Compose file.
   Preserve all files, including any SQLite WAL/journal files, `images/` and
   `keys/`, with their ownership and private permissions. Do not copy only
   `monkey.db` or take an ordinary live filesystem copy of an active database.
4. Back up the separate financial-export directory too if you want to retain its
   snapshots and scheduling state. It is outside the main data root.
5. Verify that the backup is readable, complete and stored outside the running
   container. Keep the source instance stopped until the copy is complete.
6. Restart the same instance and inspect its logs:

   ```sh
   docker compose -f compose.yaml up -d --no-build
   docker compose -f compose.yaml logs --tail 100 app
   ```

Do not use `down --volumes` or delete the source volume as part of backup or
recovery. A successful copy is not proof of recoverability; rehearse restoration
into separate disposable storage.

## Restore a Complete Installation

1. Preserve the failed installation and any writes newer than the backup. Stop
   all application processes that could access the recovery target.
2. Prepare an empty compatible target volume or host directory. Restore the
   complete data backup and its matching configuration, not a mixture of files
   from different backup times. Keep the original image digest available.
3. Restore private permissions and application UID/GID `10001:10001` ownership.
   On Linux, private data directories require owner-only access. Do not work
   around permission failures by running the application as root.
4. Select an image compatible with the restored schema. Confirm the target
   mount, Compose identity, public HTTPS origin, currency, business `TZ` and
   transaction-retention settings before startup.
5. Start only the intended instance using the restart commands above. Verify
   readiness, HTTPS sign-in, existing users, accounts, balances, history, images
   and allowance status. Inspect logs without sharing credentials, keys or
   financial payloads in an issue report.

Startup can perform migrations, catch up outstanding allowances and prune eligible
transaction details. Increasing retention cannot restore previously deleted
details. Set retention to `0` before starting a full restore if pruning must stay
disabled, and review allowance catch-up before allowing normal use. See
[Configuration](Configuration.md#language-currency-and-time).

Restoring authentication keys and user records can preserve still-valid sessions;
a complete restore is not a forced logout or password reset. Use an isolated
rehearsal environment, and do not leave two application instances operating on
the same data root.

## Enable Financial Snapshots

Exports are disabled unless `MONKEY_EXPORT_PATH` is set. Pre-create a private
host directory writable by UID/GID `10001:10001`, with Linux permissions `0700`.
Completed snapshots use `0600`. Do not commit snapshots to the repository.

Add the following settings and mount to your existing `app` service, preserving
its other environment entries and volumes. This is a partial edit, not a complete
Compose file; replace the example host path deliberately:

```yaml
services:
  app:
    environment:
      MONKEY_EXPORT_PATH: /exports
      MONKEY_EXPORT_KEEP_COUNT: "30"
    volumes:
      - type: bind
        source: /srv/pocket-monkey/exports
        target: /exports
        bind:
          create_host_path: false
```

Recreate the application with `docker compose -f compose.yaml up -d --no-build`.
The export directory must be outside `MONKEY_DATA_PATH`. With a repository
deployment, the checked-in [export override](../../deploy/compose.exports.yaml)
provides these settings instead; use it together with the base Compose file.

An initial snapshot is created on first enabled startup. Subsequent checks run at
01:00 in business `TZ`, publishing only changed financial content. After downtime,
the worker checks the latest missed slot; it does not invent historical snapshots.
Daylight-saving transitions use the first occurrence of a repeated 01:00, or the
first valid instant after a skipped 01:00. Snapshot timestamps remain UTC.

The default keeps 30 completed snapshots. Set `MONKEY_EXPORT_KEEP_COUNT` to
`1` through `365`, or `0` for unlimited. This counts snapshots, not days. Unchanged
days create no file and prune nothing; pruning happens only after successful new
publication. Lowering the count takes effect then. Monitor failures, disk capacity
and your separate off-host copy process. Failed writes preserve earlier completed
snapshots; exports do not block financial posting or determine readiness.

## Import Financial Data Offline

Use a separate recovery deployment with fresh financial storage. Keep the source
installation and its volume intact. Stop the recovery target, set currency,
business timezone and transaction-retention configuration to match the snapshot,
and mount the snapshot read-only. The directory and file must be readable by the
application's non-root identity without making the snapshot publicly accessible.

From the recovery deployment's configured release directory, replace the absolute
host directory and snapshot filename in this command:

```sh
docker compose -f compose.yaml stop app
docker compose -f compose.yaml run --rm --no-deps --entrypoint dotnet --volume /absolute/private/snapshots:/recovery:ro app /app/backend/PocketMonkey.Host.dll import-financial /recovery/snapshot.json
```

Proceed only after `financial_import_success`. The importer has no merge, wipe or
reset option. It rejects existing financial state, incompatible format or
configuration, invalid references and busy storage. Format version 2 rejects
unknown fields and files larger than 256 MiB; unsupported formats, including
version 1, are rejected. Financial inserts are atomic;
a failed import cannot leave partially recovered financial records.

Do not delete existing data or edit the snapshot to bypass an error. Diagnostics
include `snapshot_invalid`, `snapshot_version_unsupported`,
`snapshot_configuration_mismatch`, `recovery_target_not_empty` and
`recovery_storage_busy`. A content hash detects differences, not authenticity.

After successful import, start the recovery instance:

```sh
docker compose -f compose.yaml up -d --no-build
docker compose -f compose.yaml exec app dotnet /app/backend/PocketMonkey.Host.dll bootstrap-manager
```

Bootstrap is needed only when the target has no users. Existing separately
created users can remain; otherwise create the first Manager interactively and
recreate other users through user administration. Imported historical actors
remain historical attribution, not login users. Accounts use default images.

Verify exact balances, retained history and allowance state before allowing normal
use. Balances are restored directly, not recalculated from partial history or
replayed as new credits. Normal startup resumes allowance catch-up and retention;
permanent execution records prevent re-crediting already credited months.

## Upgrade Without Losing Recovery Options

1. Choose an exact published release and review its notes and compatibility
   requirements. Download and verify its matching deployment assets in a
   separate directory using [Getting Started](Getting-Started.md#download-a-release).
   Do not overwrite your configured installation with an unreviewed bundle.
2. Preserve the current image digest and take a complete stopped-instance backup
   before the new image can access the data. A financial snapshot alone cannot
   recover the complete installation.
3. Apply the target release's digest-pinned image and required configuration
   changes deliberately. Preserve the existing project name, data volume,
   private mounts, HTTPS/proxy settings and business configuration.
4. Validate the configured Compose file, pull the selected image and start it:

   ```sh
   docker compose -f compose.yaml config --quiet
   docker compose -f compose.yaml pull
   docker compose -f compose.yaml up -d --no-build
   docker compose -f compose.yaml logs --tail 100 app
   ```

5. Verify readiness, deployed version, sign-in, balances, account images, history
   and allowance status. Keep the pre-upgrade backup until the upgrade and its
   recovery procedure have been accepted.

If startup or verification fails, stop the application and preserve the failed
state for diagnosis. Starting the old image does not undo schema migrations.
Use an explicitly compatible image, or restore the complete pre-upgrade backup
with its matching image and configuration into an empty recovery target. Later
writes are not present in that backup; do not copy database files between the
failed and restored installations or replay transactions blindly.

## Recover Manager Access

For an existing Manager who cannot sign in, run the interactive operator command
against the running intended instance:

```sh
docker compose -f compose.yaml exec app dotnet /app/backend/PocketMonkey.Host.dll recover-manager
```

Recovery resets that Manager's password, clears lockout, reactivates the account
and requires a password change after sign-in. It is not financial recovery and
does not create a new first Manager. Enter credentials directly into the terminal,
never into chat or command arguments. Host access is privileged operator access;
there is no email recovery.

See the [detailed financial recovery contract](../development.md#portable-financial-recovery)
and [recovery decision](../ADR/ADR-0021-portable-financial-recovery.md) for format
and safety details.
