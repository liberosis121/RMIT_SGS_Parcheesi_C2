#!/usr/bin/env bash
# Start TideCloak dev container (playbook: start-tidecloak-dev). Usage: bash infra/start-tidecloak.sh [--wipe]
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
: "${KC_BOOTSTRAP_ADMIN_PASSWORD:?set KC_BOOTSTRAP_ADMIN_PASSWORD in .env}"
IMAGE="tideorg/tidecloak-dev:latest"

if curl -sf http://localhost:8080 >/dev/null 2>&1 && [ "${1:-}" != "--wipe" ]; then
  echo "TideCloak already running on :8080 (use --wipe for a clean start)"; exit 0
fi

docker stop tidecloak >/dev/null 2>&1 || true
docker rm tidecloak >/dev/null 2>&1 || true
mkdir -p ./data
if [ "${1:-}" = "--wipe" ]; then rm -f ./data/keycloakdb*; fi

# Git Bash on Windows: avoid path mangling of the container path, give docker a Windows host path.
HOST_DATA="$(pwd -W 2>/dev/null || pwd)/data"
MSYS_NO_PATHCONV=1 docker run -d --name tidecloak \
  -v "${HOST_DATA}:/opt/keycloak/data/h2" \
  -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME="${KC_BOOTSTRAP_ADMIN_USERNAME:-admin}" \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD="$KC_BOOTSTRAP_ADMIN_PASSWORD" \
  "$IMAGE"

for i in $(seq 1 30); do
  if curl -sf http://localhost:8080 >/dev/null 2>&1; then echo "TideCloak ready"; exit 0; fi
  echo "Waiting ($i/30)..."; sleep 5
done
echo "TideCloak did not start; see: docker logs tidecloak" >&2; exit 1
