#!/usr/bin/env bash
set -euo pipefail
umask 077
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
state="$root/.local/codespaces/image-testing"
compose() { docker compose --project-name pocket-monkey-codespaces-image -f "$state/compose.yaml" "$@"; }
case "${1:-}" in
  start)
    version=${2:-}
    if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$ ]]; then
      printf '%s\n' 'Specify an exact release version without v, for example 0.1.0-beta.2' >&2
      exit 1
    fi
    if [[ ! "${CODESPACE_NAME:-}" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || [[ ! "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" =~ ^[a-z0-9]+([.-][a-z0-9]+)*$ ]]; then
      printf '%s\n' 'Run inside Codespaces with a valid forwarded-port hostname' >&2
      exit 1
    fi
    origin="https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    mkdir -p "$state/releases"
    staging=$(mktemp -d "$state/staging.XXXXXX")
    trap 'rm -rf "$staging"' EXIT
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
    jq --exit-status '.name == "pocket-monkey-codespaces-image"' "$staging/compose.yaml" > /dev/null
    docker compose -f "$staging/compose.yaml" config --quiet
    mv "$staging/compose.yaml" "$state/compose.yaml"
    compose pull
    compose up -d --no-build
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
  *) printf '%s\n' 'Use start VERSION, stop, logs, bootstrap, recover or reset --confirm' >&2; exit 1 ;;
esac