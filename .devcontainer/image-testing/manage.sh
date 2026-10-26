#!/usr/bin/env bash
set -euo pipefail
umask 077
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
state="$root/.local/codespaces/image-testing"
compose() { docker compose --project-name pocket-monkey-codespaces-image -f "$state/compose.yaml" "$@"; }
case "${1:-}" in
  start|candidate)
    mode=$1
    if [[ "$mode" == start ]]; then
      version=${2:-}
      if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$ ]]; then
        printf '%s\n' 'Specify an exact release version without v, for example 0.1.0-beta.2' >&2
        exit 1
      fi
    else
      run=${2:-}
      revision=${3:-}
      if [[ ! "$run" =~ ^[1-9][0-9]*$ ]] || [[ ! "$revision" =~ ^[a-f0-9]{40}$ ]]; then
        printf '%s\n' 'Use candidate RUN_ID FULL_SOURCE_SHA for an eG-dev/MONkEY release workflow run' >&2
        exit 1
      fi
    fi
    if [[ ! "${CODESPACE_NAME:-}" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || [[ ! "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" =~ ^[a-z0-9]+([.-][a-z0-9]+)*$ ]]; then
      printf '%s\n' 'Run inside Codespaces with a valid forwarded-port hostname' >&2
      exit 1
    fi
    origin="https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    mkdir -p "$state/releases"
    staging=$(mktemp -d "$state/staging.XXXXXX")
    trap 'rm -rf "$staging"' EXIT
    if [[ "$mode" == start ]]; then
      release="$state/releases/$version"
      if [[ ! -d "$release" ]]; then
        gh release view "v$version" --repo eG-dev/MONkEY --json isDraft,tagName > "$staging/release.json"
        jq --exit-status --arg tag "v$version" '.isDraft == false and .tagName == $tag' "$staging/release.json" > /dev/null
        gh release download "v$version" --repo eG-dev/MONkEY --dir "$staging" \
          --pattern deployment.tar.gz --pattern SHA256SUMS --pattern image.json --pattern build-info.json --pattern release-identity.json
        (cd "$staging" && sha256sum --check SHA256SUMS)
        mv "$staging" "$release"
        staging=$(mktemp -d "$state/staging.XXXXXX")
      fi
      (cd "$release" && sha256sum --check SHA256SUMS)
      jq --exit-status --arg version "$version" \
        '.version == $version and .os == "linux" and .architecture == "amd64" and
        (.revision | test("^[a-f0-9]{40}$")) and (.image | test("^ghcr.io/eg-dev/monkey@sha256:[a-f0-9]{64}$"))' \
        "$release/release-identity.json" > /dev/null
      image=$(jq --raw-output '.image' "$release/release-identity.json")
    else
      endpoint="repos/eG-dev/MONkEY/actions/runs/$run"
      gh api "$endpoint" > "$staging/run.json"
      jq --exit-status --argjson run "$run" --arg revision "$revision" \
        '.id == $run and .head_sha == $revision and .head_repository.full_name == "eG-dev/MONkEY" and
        .path == ".github/workflows/ghcr-prerelease.yml" and (.event == "push" or .event == "workflow_dispatch") and
        (.run_attempt | type == "number" and . >= 1)' "$staging/run.json" > /dev/null
      attempt=$(jq --raw-output '.run_attempt' "$staging/run.json")
      gh api --paginate --slurp "$endpoint/attempts/$attempt/jobs?per_page=100" > "$staging/jobs.json"
      jq --exit-status --argjson attempt "$attempt" \
        '[.[].jobs[] | select(.name == "verify / verify")] |
        length == 1 and .[0].run_attempt == $attempt and .[0].conclusion == "success"' "$staging/jobs.json" > /dev/null
      gh api --paginate --slurp "$endpoint/artifacts?per_page=100" > "$staging/artifacts.json"
      jq --exit-status --slurpfile run "$staging/run.json" \
        '[.[].artifacts[] | select(.name == "verified-image")] | length == 1 and
        .[0].expired == false and .[0].workflow_run.id == $run[0].id and
        .[0].workflow_run.head_sha == $run[0].head_sha and .[0].created_at >= $run[0].run_started_at' \
        "$staging/artifacts.json" > /dev/null
      mkdir "$staging/image"
      gh run download "$run" --repo eG-dev/MONkEY --name verified-image --dir "$staging/image"
      test "$(awk '{print $2}' "$staging/image/SHA256SUMS" | sort)" = \
        "$(printf '%s\n' build-info.json compose.exports.yaml compose.yaml deployment.json image.json verified-image.tar.gz | sort)"
      for asset in SHA256SUMS build-info.json compose.exports.yaml compose.yaml deployment.json image.json verified-image.tar.gz; do
        test -f "$staging/image/$asset" && test ! -L "$staging/image/$asset"
      done
      (cd "$staging/image" && sha256sum --check --strict SHA256SUMS)
      jq --exit-status --arg revision "$revision" \
        '.kind == "release" and .dirty == false and .revision == $revision and
        .repositoryUrl == "https://github.com/eG-dev/MONkEY" and .releaseTag == ("v" + .version) and
        (.version | test("^[0-9]+\\.[0-9]+\\.[0-9]+-[0-9A-Za-z][0-9A-Za-z.-]*$"))' \
        "$staging/image/build-info.json" > /dev/null
      version=$(jq --raw-output '.version' "$staging/image/build-info.json")
      jq --exit-status --arg revision "$revision" --arg version "$version" \
        'length == 1 and (.[0].Id | test("^sha256:[a-f0-9]{64}$")) and
        .[0].Os == "linux" and .[0].Architecture == "amd64" and
        .[0].Config.Labels["org.opencontainers.image.version"] == $version and
        .[0].Config.Labels["org.opencontainers.image.revision"] == $revision and
        .[0].Config.Labels["org.opencontainers.image.source"] == "https://github.com/eG-dev/MONkEY" and
        .[0].Config.Labels["org.pocketmonkey.build.kind"] == "release" and
        .[0].Config.Labels["org.pocketmonkey.build.dirty"] == "false"' "$staging/image/image.json" > /dev/null
      gh api "$endpoint" > "$staging/current-run.json"
      jq --exit-status --slurpfile original "$staging/run.json" \
        '.id == $original[0].id and .head_sha == $original[0].head_sha and .run_attempt == $original[0].run_attempt' \
        "$staging/current-run.json" > /dev/null
      image=$(jq --raw-output '.[0].Id' "$staging/image/image.json")
      docker load --input "$staging/image/verified-image.tar.gz"
      docker image inspect "$image" > "$staging/loaded-image.json"
      jq --exit-status --slurpfile expected "$staging/image/image.json" \
        'length == 1 and .[0].Id == $expected[0][0].Id and .[0].Os == "linux" and .[0].Architecture == "amd64" and
        .[0].Config.Labels == $expected[0][0].Config.Labels' "$staging/loaded-image.json" > /dev/null
      jq --null-input --argjson run "$run" --argjson attempt "$attempt" --arg revision "$revision" \
        --arg image "$image" --arg version "$version" --slurpfile artifacts "$staging/artifacts.json" \
        '{run: $run, attempt: $attempt, revision: $revision, image: $image, version: $version,
          artifactId: ([$artifacts[0][].artifacts[] | select(.name == "verified-image")][0].id)}' > "$staging/candidate-review.json"
    fi
    if [[ -f "$state/compose.yaml" ]]; then
      jq --arg image "$image" --arg origin "$origin" \
        '.services.app.image = $image | .services.app.environment.MONKEY_PUBLIC_URL = $origin' \
        "$state/compose.yaml" > "$staging/compose.yaml"
    else
      jq --null-input --arg image "$image" --arg origin "$origin" '{
        name: "pocket-monkey-codespaces-image",
        services: {app: {
          image: $image, ports: ["127.0.0.1:8080:8080"], restart: "on-failure", stop_grace_period: "25s",
          environment: {MONKEY_PUBLIC_URL: $origin, TZ: "Europe/Berlin", MONKEY_DEFAULT_LOCALE: "de-DE",
            MONKEY_CURRENCY: "EUR", MONKEY_TRANSACTION_RETENTION_MONTHS: "24", MONKEY_TRUSTED_PROXIES: ""},
          volumes: ["monkey-data:/data"]
        }}, volumes: {"monkey-data": {}}
      }' > "$staging/compose.yaml"
    fi
    jq --arg mode "$mode" 'if $mode == "candidate" then .services.app.pull_policy = "never"
      else del(.services.app.pull_policy) end' "$staging/compose.yaml" > "$staging/configured.json"
    mv "$staging/configured.json" "$staging/compose.yaml"
    jq --exit-status '.name == "pocket-monkey-codespaces-image"' "$staging/compose.yaml" > /dev/null
    docker compose -f "$staging/compose.yaml" config --quiet
    mv "$staging/compose.yaml" "$state/compose.yaml"
    if [[ "$mode" == start ]]; then
      compose pull
      compose up -d --no-build
      rm -f "$state/candidate-review.json"
    else
      compose up -d --no-build --pull never
      mv "$staging/candidate-review.json" "$state/candidate-review.json"
      printf 'Candidate: https://github.com/eG-dev/MONkEY/actions/runs/%s (attempt %s)\nSource: %s\n' "$run" "$attempt" "$revision"
    fi
    printf 'Image: %s\nPrivate forwarded URL: %s\nCreate the first Manager: bash .devcontainer/image-testing/manage.sh bootstrap\n' "$image" "$origin"
    ;;
  stop|logs)
    compose "$1"
    ;;
  bootstrap)
    compose exec app dotnet /app/backend/PocketMonkey.Host.dll bootstrap-manager
    ;;
  recover)
    compose exec app dotnet /app/backend/PocketMonkey.Host.dll recover-manager
    ;;
  reset)
    if [[ "${2:-}" != --confirm ]]; then
      printf '%s\n' 'Destructive: reset --confirm removes only the image-testing instance and its data volume' >&2
      exit 1
    fi
    jq --exit-status '.name == "pocket-monkey-codespaces-image"' "$state/compose.yaml" > /dev/null
    compose down --volumes --remove-orphans
    ;;
  *) printf '%s\n' 'Use start VERSION, candidate RUN_ID FULL_SOURCE_SHA, stop, logs, bootstrap, recover or reset --confirm' >&2; exit 1 ;;
esac