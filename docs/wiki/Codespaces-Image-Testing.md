# Codespaces Image Testing

Choose **POCKET MONkEY - Image Testing** in GitHub's Codespaces
configuration selector, and choose the machine size yourself. Creating and running
a Codespace can incur charges. Stop it when finished; deleting it removes its
retained workspace and Docker data. Use synthetic financial data only.

This profile installs terminal Docker/Compose, GitHub CLI and jq tools, not the
application development SDKs. Creation does not start the application. Its tool
image builds locally and the management script has fixture-based regression
coverage. Actual GitHub Codespaces forwarding, sign-in and persistence across
cloud rebuilds have not yet been verified; treat this profile as experimental.

## Review a Pending Release

Use this profile to manually approve the actual image built by the
[prerelease workflow](../../.github/workflows/ghcr-prerelease.yml), before its
protected `release` environment approval publishes anything to GHCR. The
verification job must have succeeded and uploaded its `verified-image` artifact;
the overall workflow may still be waiting for approval.

The workflow's **Candidate Image Review** summary provides the exact candidate
command and a creation link selecting the release tag's Image Testing configuration.
Reuse an existing review Codespace when practical. Creating a new one still
requires your confirmation and machine choice; the workflow does not create,
start or delete personal workspaces.

From that workflow run in `eG-dev/MONkEY`, copy its numeric run ID and complete
40-character source commit SHA. From the repository root, replace both placeholders:

```sh
bash .devcontainer/image-testing/manage.sh candidate RUN_ID FULL_SOURCE_SHA
```

The helper checks the repository, source revision, release workflow and successful
verification job in the current run attempt. It rejects missing, ambiguous,
expired or previous-attempt artifacts, checks the expected files and their
`SHA256SUMS`, validates clean release metadata and Linux amd64 image labels, then
loads the archive and verifies the loaded image identity. It never rebuilds the
image, pulls a candidate from a registry or publishes it. Compose starts the
loaded image by immutable local image ID with pulls disabled.

GitHub CLI needs authenticated read access to the repository's Actions artifacts;
use the Codespace's existing GitHub authentication. Do not enter tokens in command
arguments or chat. Download errors are failures, not a reason to use a different
run's image. Artifacts expire after seven days; reruns must have matching successful
verification and a fresh unambiguous artifact. Unpublished Actions artifacts are
not private escrow for secrets or unreviewed distribution material.

The command prints the selected run, attempt, revision and image. A compact record
including the artifact ID is saved in ignored
`.local/codespaces/image-testing/candidate-review.json`; the downloaded archive is
temporary. Inspect readiness, sign in, exercise the intended changes and review
the draft release notes before approving the **same run's** protected publishing
job in GitHub Actions. If that run is rerun or its artifact changes, repeat review;
do not reuse acceptance for a different image. Approval itself is not automated.

The publisher loads the same verified artifact without rebuilding it. Record the
tested run/attempt, source, image identity and acceptance results with the review.
Neither manual acceptance nor passing E2E certifies real-host production readiness.

## Start an Exact Published Release

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
passwords only at the terminal prompt. Run the same
`candidate RUN_ID FULL_SOURCE_SHA` or `start VERSION` command again to resume.
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

Candidate and published-release modes use the same image-testing volume and
preserve your settings. Back up data before switching images; an older image
cannot undo migrations. Use `reset --confirm` only for an intentional fresh
synthetic-data test. A new candidate start needs its Actions artifact again,
even if a stopped container or previously loaded image still exists locally.