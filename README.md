# POCKET MONkEY

<img src="docs/design/assets/images/monkey_face.png" alt="POCKET MONkEY logo" width="256" height="256">

Welcome to POCKET MONkEY!

What started as a small hobby project to manage my children's pocket money has grown into an application for tracking pocket money and savings for specific goals.

## Why POCKET MONkEY?

### 💰 Too much cash at home?

Collect your children's spare cash, put it somewhere suitable, such as a savings account, and record the deposit in POCKET MONkEY. When a child needs cash, hand it over and record the withdrawal.

You always have an overview of each account's balance. POCKET MONkEY records the money you manage; it does not hold or transfer funds.

### 🔄 Forgetting to credit pocket money?

Set a monthly allowance for each child and POCKET MONkEY automatically credits it to their account.

### 🎯 Saving for something special?

Whether it is a bicycle, a holiday, or your next big purchase, create an account for that purpose. Record the money you set aside and any spending against it, so you can see how much you have saved and what remains available.

The money stays wherever you keep it; the account gives you a separate record for your savings goal.

## Features

POCKET MONkEY is a simple way to track virtual account balances, with less paperwork and a clearer history of where the money went.

### 🏠 Self-hosted

Run your own instance and keep your data under your control.

### 👥 Shared accounts

Manage pocket-money and savings accounts together with local user accounts.

### 🔐 Role-based permissions

Managers administer accounts and record transactions; Members can view all accounts and their history.

### 💰 Account balances

Record opening balances, deposits, and withdrawals.

### 📒 Transaction history

See who recorded each transaction, how much, when, and why.

### 🔄 Automatic pocket-money credits

Monthly bookings using the allowance you choose.

### 🌍 German and English

Choose your preferred interface language.

## Technology

POCKET MONkEY uses Angular, .NET, and SQLite, packaged together in a Docker image. See the [technical guide](docs/development.md) for setup and verification commands.

## Run With Docker

The current image is a development/foundation build, not a production release.
These examples run from the repository root and use PowerShell. You need Node.js
24 with npm and Docker Compose with a Linux container engine. The image builds
.NET inside Docker; a host .NET SDK is not required for this route.

Install the build tooling and build the local image:

```powershell
npm --prefix web ci --ignore-scripts
npm --prefix web run build:image
```

For first-time setup, create an ignored local configuration from the
[Compose environment example](deploy/compose.env.example). Do not overwrite
an existing configuration:

```powershell
New-Item -ItemType Directory -Force .local | Out-Null
Copy-Item deploy/compose.env.example .local/compose.env
```

Edit the copied file, replacing `MONKEY_PUBLIC_URL` with the HTTPS origin supplied
by your reverse proxy. Review the timezone, language, currency and retention
settings, then validate the configuration and start:

```powershell
docker compose --env-file .local/compose.env -f deploy/compose.yaml config --quiet
docker compose --env-file .local/compose.env -f deploy/compose.yaml up -d --no-build
```

Compose publishes HTTP at `127.0.0.1:8080` for your host reverse proxy. Configure
that proxy to serve your chosen HTTPS origin and forward requests to this port,
then open the HTTPS URL. Compose does not install TLS or configure DNS, and
signed-in production use requires HTTPS because session cookies are Secure.

Create the first Manager while the container is running:

```powershell
docker compose --env-file .local/compose.env -f deploy/compose.yaml exec app dotnet /app/backend/PocketMonkey.Host.dll bootstrap-manager
```

Enter the username and password at the prompts; there is no default account or
public registration. Passwords require at least 12 characters, uppercase and
lowercase letters, and a digit. Use `recover-manager` instead of
`bootstrap-manager` to recover an existing Manager's access.

Stop the instance without deleting its persistent data:

```powershell
docker compose --env-file .local/compose.env -f deploy/compose.yaml down
```

The named volume stores the database, account images and authentication keys.
Do not add `--volumes` to the shutdown command unless you intend to delete that
state. Full backups require stopping the instance and preserving the complete
data volume together with deployment configuration.

## Configuration

Edit your local environment file and repeat `up -d --no-build` after configuration
changes; `restart` alone does not apply them. Existing shell environment variables
take precedence over values in that file. Keep a private backup of the settings.

An environment file supplies values to Compose, not automatically to the
container: only variables referenced by the selected Compose files are forwarded.
See the [Compose guide](docs/development.md#docker-compose-configuration) for the
service layout, ports, persistent storage, HTTPS proxy example and export override.

| Variable | Default | Example or meaning |
| --- | --- | --- |
| `MONKEY_PUBLIC_URL` | Required | Your HTTPS origin, such as `https://monkey.home.example`. |
| `TZ` | `UTC` | Business timezone, such as `Europe/Berlin`, used for monthly allowances. |
| `MONKEY_DEFAULT_LOCALE` | `de-DE` | `de-DE` or `en-US`; users can choose their own interface language. |
| `MONKEY_CURRENCY` | `EUR` | `EUR` or `USD`; changes the displayed unit, not the amounts or exchange rate. |
| `MONKEY_TRANSACTION_RETENTION_MONTHS` | `24` | Keep transaction details for 1 through 120 UTC calendar months; `0` keeps unlimited history. |
| `MONKEY_TRUSTED_PROXIES` | Empty | Explicit trusted proxy IPs/CIDRs when forwarded headers are needed; do not trust arbitrary clients. |

Retention cleanup preserves openings, stored balances and permanent safety
records. Increasing retention cannot recover details that have already been
removed. Language, currency and business timezone are independent settings.

Daily change-only financial JSON exports are optional and disabled by default.
Enable them with a separate private export mount using the
[export configuration and recovery guide](docs/development.md#portable-financial-recovery).
These exports do not replace full backups or include users, passwords or images.
See the [complete environment reference](plans/migration/configuration.md) for
storage paths, export retention and other settings.

## Local Development

For hot reload without Docker, install Node.js 24 and the .NET SDK pinned in
[global.json](global.json), then run from the repository root:

```powershell
npm --prefix web ci --ignore-scripts
npm --prefix web run dev
```

Open http://127.0.0.1:4180. The launcher starts Angular SSR and the .NET backend,
keeps development data separate from Docker data, and stops both with Ctrl+C.
Before signing in for the first time, follow the
[development Manager setup](docs/development.md#first-manager-and-recovery) in a
second terminal so the operator command uses the same development database.

If the default ports are occupied, choose another pair:

```powershell
npm --prefix web run dev -- --web-port 4182 --backend-port 5182
```

The development launcher uses local HTTP authentication settings; do not expose
it as a production deployment. See the [technical guide](docs/development.md#build-and-verify)
for builds, tests and verification commands.

## Questions or Suggestions?

Use this repository's GitHub Issues tab for questions, bug reports, and feature suggestions. Check existing issues before opening a new one, and include relevant details or steps to reproduce a problem.

## About This Project

⚠️ This is a hobby project, developed by me alone and in my spare time.

## License

POCKET MONkEY is licensed under the **GNU Affero General Public License,
version 3 only** (`AGPL-3.0-only`). See [LICENSE](LICENSE) for the full terms.

Commercial use is permitted under the license. Covered distributions carry
source-sharing obligations, and modified versions made available over a network
must offer their corresponding source to remote users as required by section 13.
The software is provided without warranty to the extent permitted by applicable law.

Third-party dependencies, fonts, and other separately licensed assets retain their
respective licenses and notices.