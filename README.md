# POCKET MONkEY

<img src="docs/design/assets/images/monkey_face.png" alt="POCKET MONkEY logo" width="256" height="256">

Self-hosted tracking for children's pocket money and savings, in German and English.

When your children want to put cash aside, you could keep the money in an
easy-access savings account rather than holding large amounts of cash at home.
Record the deposit here; when they need cash, hand it over and record the
withdrawal. Each account shows the balance and transaction history.

You can also use separate accounts for savings goals, such as a bicycle, a holiday,
or another planned purchase. The money stays wherever you keep it; POCKET MONkEY
records it without holding or transferring funds.

> [!IMPORTANT]
> From personal experience, I recommend giving children pocket money in cash.
> Holding it in their hands can make receiving money feel more tangible than
> seeing a number change on a screen.
> Let them deposit money they do not need day to day with you, and record it here.
> How much cash they keep on hand is up to your family. If you prefer not to use
> cash, automatic monthly allowance credits are available instead.

## Run With Docker

Linux amd64 pre-release images are available from
[Releases](https://github.com/eG-dev/MONkEY/releases). Start with the matching,
digest-pinned deployment bundle and [Getting Started](docs/wiki/Getting-Started.md).
These beta releases are for acceptance testing, not a production-readiness claim.

The standalone template below is an alternative for an existing Traefik setup.
Set the exact published image and application settings directly in `compose.yaml`,
replacing the domain and Traefik names as appropriate. No environment file is required.

```yaml
services:
  app:
    image: ghcr.io/eg-dev/monkey:0.1.0-beta.2
    restart: on-failure
    stop_grace_period: 25s
    environment:
      MONKEY_PUBLIC_URL: https://monkey.example.com
      TZ: Europe/Berlin
      # MONKEY_EXPORT_PATH: /exports
      # MONKEY_EXPORT_KEEP_COUNT: "30"
    volumes:
      - monkey-data:/data
      # - /srv/pocket-monkey/exports:/exports
    networks: [proxy]
    labels:
      traefik.enable: "true"
      traefik.docker.network: proxy
      traefik.http.routers.monkey.rule: Host(`monkey.example.com`)
      traefik.http.routers.monkey.entrypoints: websecure
      traefik.http.routers.monkey.tls.certresolver: letsencrypt
      traefik.http.services.monkey.loadbalancer.server.port: "8080"
volumes:
  monkey-data:
networks:
  proxy:
    external: true
```

```sh
docker compose pull
docker compose up -d
```

### HTTPS With Traefik

The example assumes an existing Traefik Docker provider, external `proxy` network,
`websecure` entrypoint and `letsencrypt` certificate resolver. Point DNS at Traefik;
TLS terminates there, forwarding HTTP to port 8080. No application port needs
publishing. HTTPS is required for authentication cookies.

## Configuration

Set these under `app.environment`; apply changes with `docker compose up -d`.

Set the public HTTPS origin and business timezone, preserve the data volume and
trust only your actual reverse proxies. Language and display currency are
independent settings. See the maintained [configuration reference](docs/wiki/Configuration.md)
for defaults, validation, retention and optional financial exports.

## First Manager and Password Reset

With the app running, create the first Manager:

```sh
docker compose exec app dotnet /app/backend/PocketMonkey.Host.dll bootstrap-manager
```

Follow the prompts, then sign in at your HTTPS URL. There is no default account or
public registration. Passwords need at least 12 characters, upper/lowercase letters
and a digit. Create further users and reset their passwords in user administration.

To recover an existing Manager's access:

```sh
docker compose exec app dotnet /app/backend/PocketMonkey.Host.dll recover-manager
```

Recovery requires another password change after login; there is no email recovery.

## Financial Export and Import

Uncomment the export settings and mount in the Compose example. Pre-create the
private host directory with owner UID/GID `10001` and permissions `0700`. An initial
JSON snapshot is created on startup; subsequent checks run at 01:00 in `TZ` and
write only changed financial data. Copy exports off-host.

Import offline into a fresh data volume, with currency, timezone and transaction
retention matching the snapshot. Replace the snapshot directory and filename:

```sh
docker compose stop app
docker compose run --rm --no-deps --entrypoint dotnet --volume /absolute/private/snapshots:/recovery:ro app /app/backend/PocketMonkey.Host.dll import-financial /recovery/snapshot.json
docker compose up -d
```

Imports never merge or overwrite existing financial state. Bootstrap a new Manager
afterward, then recreate other users in user administration. Exports exclude users,
passwords, authentication keys and images; they are **not full backups**. For a full
backup, stop the app and preserve the complete `/data` volume and configuration. See
[financial recovery details](docs/development.md#portable-financial-recovery).

## Project Background

POCKET MONkEY is a revamp of an application I originally built several years ago.
This new version would not be possible without GitHub Copilot, which is heavily
involved throughout its development. I use it as a development partner while
keeping responsibility for the project's direction and decisions.

## Development

Builds, local development and detailed operations: [technical guide](docs/development.md).
This is a spare-time hobby project, and I do not depend on outside code
contributions to move it forward. Bug reports, feedback and suggestions are
welcome through GitHub Issues. Please read the [contribution guide](CONTRIBUTING.md)
before starting work on a pull request.

## License

Licensed under **AGPL-3.0-only**, without warranty; see [LICENSE](LICENSE).
Third-party components retain their [own licenses and notices](THIRD-PARTY-NOTICES.txt).