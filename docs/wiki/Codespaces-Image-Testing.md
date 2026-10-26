# Codespaces Image Testing

Choose **POCKET MONkEY - Published Image Testing** in GitHub's Codespaces
configuration selector, and choose the machine size yourself. Creating and running
a Codespace can incur charges. Stop it when finished; deleting it removes its
retained workspace and Docker data. Use synthetic financial data only.

This profile installs terminal Docker/Compose, GitHub CLI and jq tools, not the
application development SDKs. Creation does not start the application. Its tool
image builds locally and the management script has fixture-based regression
coverage. Actual GitHub Codespaces forwarding, sign-in and persistence across
cloud rebuilds have not yet been verified; treat this profile as experimental.

## Start an Exact Release

From the repository root, explicitly select a published release:

```sh
bash .devcontainer/image-testing/manage.sh start 0.1.0-beta.2
```

The command downloads the selected release's records, checks `SHA256SUMS` and its
Linux amd64 identity, then uses the exact image digest. It never builds source or
selects `latest`. The generated Compose settings are direct values in ignored
`.local/codespaces/image-testing/compose.yaml`; repeated starts preserve operator
settings and the named data volume. Defaults are German, EUR and Europe/Berlin.
Switching releases keeps the same data; image downgrade does not undo migrations.

Open forwarded port **8080** using its HTTPS URL and keep its visibility
**Private**. The terminal prints that URL; the internal backend is not forwarded.
Do not disable Secure cookies or make the port public to fix sign-in issues.

## Manager Setup and Lifecycle

There are no preset credentials. Use the interactive operator commands:

```sh
bash .devcontainer/image-testing/manage.sh bootstrap
bash .devcontainer/image-testing/manage.sh logs
bash .devcontainer/image-testing/manage.sh stop
```

Use `recover` instead of `bootstrap` to recover an existing Manager. Enter
passwords only at the terminal prompt. Run `start VERSION` again to resume.
Stopping retains the database, images and keys in the isolated
`pocket-monkey-codespaces-image_monkey-data` Docker volume. Retention is not an
off-host backup, and Docker pruning or deleting the Codespace can destroy it.

For an intentional fresh image-testing instance only:

```sh
bash .devcontainer/image-testing/manage.sh reset --confirm
```

This removes that profile's application containers and data volume, not the
development profile's data. Cached release records and Compose settings remain.
Back up anything needed before resetting. See [Configuration](Configuration.md)
and the [recovery guide](../development.md#portable-financial-recovery).