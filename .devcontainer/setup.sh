#!/usr/bin/env bash
set -euo pipefail
umask 077
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$root"
docker version
docker compose version
gh --version
jq --version
case "${1:-}" in
  image-testing)
    printf '%s\n' 'Ready. Start manually: bash .devcontainer/image-testing/manage.sh start VERSION'
    ;;
  development)
    node --version
    npm --version
    dotnet --version
    npm --prefix web ci --ignore-scripts
    npm --prefix tests/e2e ci --ignore-scripts
    dotnet tool restore --configfile NuGet.Config
    dotnet restore PocketMonkey.slnx --locked-mode --configfile NuGet.Config
    cd "$root/tests/e2e"
    npm exec --no -- playwright install --with-deps chromium
    mkdir -p "$root/.local/codespaces/development"
    chmod 700 "$root/.local/codespaces/development"
    printf '%s\n' 'Ready. Start manually from the repository root: npm --prefix web run dev'
    ;;
  *) printf '%s\n' 'Choose image-testing or development' >&2; exit 1 ;;
esac