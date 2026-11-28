# Release Deployment Quick Reference

Use this quick reference with an extracted release bundle. Linux amd64
pre-releases are for acceptance testing, not production readiness. For detailed
setup and recovery, use the Getting Started and Backup, Restore and Upgrades
guides; each release bundle links to the matching source revision.

Configure HTTPS, the reverse proxy and instance settings in `compose.yaml`.
For an existing installation, retain its exact Compose project name, data volume
and configuration; a different project name can select empty storage.

```sh
docker compose -f compose.yaml config --quiet
docker compose -f compose.yaml pull
docker compose -f compose.yaml up -d --no-build
```

Create the first Manager interactively:

```sh
docker compose -f compose.yaml exec app dotnet /app/backend/PocketMonkey.Host.dll bootstrap-manager
```

Before upgrading, stop the instance and back up the complete data volume and
private configuration. Rehearse restoration separately. An image rollback does
not undo database migrations; never use `down --volumes` on data to retain.
Financial exports are not full backups. Keep passwords out of Compose.
