# Codespaces Development

Choose **POCKET MONkEY - Full-stack Development** in GitHub's Codespaces
configuration selector. Choose your own machine size and stop it when finished;
Codespaces usage may incur charges. Use synthetic data, not private family data.

The profile installs the repository-matching Node/npm and .NET SDK, Docker/Compose,
GitHub CLI, jq, C#/Angular editor extensions and Playwright Chromium prerequisites.
On creation it restores locked web/test dependencies, the EF tool and the .NET
solution, then installs Chromium. It does not start either application.

Local validation passed the tool-image build and locked dependency/EF/.NET
restores. The local Chromium download is blocked by certificate trust, so complete
creation, browser E2E and actual GitHub forwarded HTTPS/sign-in remain unverified.
The profile is experimental until those checks pass in a real Codespace.

## Start Development

From the repository root:

```sh
npm --prefix web run dev
```

Open forwarded port **4180** at its HTTPS URL, keeping its visibility **Private**.
The launcher derives the exact Codespaces hostname, permits that Vite host and
keeps backend port 5180 on loopback. Ctrl+C stops both watching applications.
Defaults are German, EUR and Europe/Berlin. Changing the machine or browser
language does not change financial periods or the display currency.

Data is isolated in `.local/codespaces/development`, separate from local
`.local/dev` and the image-testing profile's Docker volume. Stopping the application
keeps it. Deleting the Codespace/workspace removes it; keep separate backups.

## First Manager

While the application is running, use another terminal from the repository root:

```sh
ASPNETCORE_ENVIRONMENT=Development MONKEY_PUBLIC_URL="https://${CODESPACE_NAME}-4180.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}" MONKEY_DATA_PATH="$PWD/.local/codespaces/development" dotnet run --project backend/PocketMonkey.Host --no-launch-profile -- bootstrap-manager
```

There are no default credentials. Enter passwords at the terminal prompt; use
`recover-manager` for an existing Manager. Personal browser language is independent
of the instance defaults. Match the launcher's printed origin if using another
port; the second terminal does not inherit its child-process environment.

## Checks and Reset

```sh
node scripts/check-codespaces.mjs
npm --prefix tests/e2e run check
npm --prefix tests/e2e run test:smoke
```

Browser E2E runs against isolated real application images, not the development
database. Follow [Development and Testing](Development-and-Testing.md)
for image preparation, full checks and failure diagnostics.

If creation fails, fix the reported cause and rerun
`bash .devcontainer/setup.sh development`. For a TLS-intercepting network, install
your organization's approved CA and configure `NODE_EXTRA_CA_CERTS` if needed.
Never disable TLS verification. Do not treat partial setup as successful.

For an intentional fresh development database, first stop the launcher and any
operator command, then run from the repository root:

```sh
rm -rf -- .local/codespaces/development
```

Restart manually and bootstrap a new Manager. This does not remove the
image-testing volume. Never reset or prune data you need to retain.