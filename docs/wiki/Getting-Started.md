# Getting Started

Use a published Linux amd64 image, not a local source build. A release provides
the tested image, a digest-pinned Compose bundle, checksums and matching build
records. Start with synthetic data while the application is in pre-release.

## Prerequisites

- A Linux amd64 Docker host with Docker Compose v2.
- A domain and HTTPS reverse proxy that can reach the application's HTTP port 8080.
- Persistent private local-disk storage for the database, images and authentication keys.
- `curl`, `sha256sum` and `tar` for the POSIX-shell download commands below.

Codespaces configurations are not available yet. The current
[technical guide](../development.md#docker-compose-configuration) describes host
networking, mounts and an existing Traefik reverse proxy.

## Download a Release

Choose a published version from [Releases](https://github.com/eG-dev/MONkEY/releases).
The example uses the published beta.2, not a moving `latest` tag:

```sh
VERSION=0.1.0-beta.2
mkdir pocket-monkey-test
cd pocket-monkey-test
for asset in deployment.tar.gz SHA256SUMS image.json build-info.json release-identity.json; do
  curl --fail --location --remote-name "https://github.com/eG-dev/MONkEY/releases/download/v$VERSION/$asset"
done
sha256sum --check SHA256SUMS
tar -xzf deployment.tar.gz
```

Stop if a download or checksum fails. Checksums detect corruption or inconsistent
downloads; they are not a separate cryptographic signature. Keep the bundle and
build records together. The bundled Compose file already pins the image by digest.

## Configure the Instance

Edit `services.app.environment` directly in `compose.yaml` before starting. Set
the public HTTPS origin, business timezone and presentation/retention values. See
[Configuration](Configuration.md#environment-variables).

Published beta.2 bundles still contain environment-file interpolation. To use
direct settings with that immutable bundle, replace only its top-level `name`
value and `services.app.environment` mapping as below. Keep its digest-pinned
`image`, ports and volumes unchanged. New bundles use direct values by default.

```yaml
name: pocket-monkey
services:
  app:
    environment:
      MONKEY_PUBLIC_URL: https://monkey.example.com
      TZ: Europe/Berlin
      MONKEY_DEFAULT_LOCALE: de-DE
      MONKEY_CURRENCY: EUR
      MONKEY_TRANSACTION_RETENTION_MONTHS: "24"
      MONKEY_TRUSTED_PROXIES: ""
```

The snippet is a partial edit, not a complete Compose file. Replace the example
HTTPS origin with your own. For an existing installation, reuse its exact project
name and data volume: changing `name` can select empty storage instead of upgrading
the existing instance. Preserve your settings when adopting a new release bundle;
do not blindly overwrite your configured Compose file.

Arrange HTTPS termination and Docker networking using the bundled `DEPLOYMENT.md`
and the [reverse-proxy guide](../development.md#host-https-reverse-proxy).
Trust only the actual proxy addresses when forwarded headers are needed. Do not
disable Secure cookies or trust every network to make authentication work.

```sh
docker compose -f compose.yaml config --quiet
docker compose -f compose.yaml pull
docker compose -f compose.yaml up -d --no-build
docker compose -f compose.yaml logs --tail 100 app
```

## Create the First Manager

There are no default credentials. Run the interactive operator command:

```sh
docker compose -f compose.yaml exec app dotnet /app/backend/PocketMonkey.Host.dll bootstrap-manager
```

Enter credentials in the terminal, never in a checked-in environment file or issue
report. Passwords require at least 12 characters, uppercase and lowercase letters,
and a digit. Sign in at the configured HTTPS URL. Create additional users through
user administration; Members can read every account but cannot perform business writes.

For an existing Manager who cannot sign in, use `recover-manager` instead of
trying to bootstrap another first Manager. See the
[Manager recovery procedure](../../README.md#first-manager-and-password-reset).

## Stop, Restart and Preserve Data

```sh
docker compose -f compose.yaml stop
docker compose -f compose.yaml up -d --no-build
```

Stopping or replacing the container must retain its data volume. Do not run
`down --volumes` against data you intend to keep. A new volume is a new instance,
not a recovery method.

Before an upgrade, stop the application and back up the complete data volume and
private configuration. Financial JSON exports are useful but exclude users,
credentials, keys and images; they are not full-installation backups. Follow the
[financial recovery guide](../development.md#portable-financial-recovery) and
the release's upgrade instructions. Reverting an image does not undo migrations.