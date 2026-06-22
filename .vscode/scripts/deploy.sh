#!/bin/bash
set -euo pipefail

PLATFORMS="linux/amd64,linux/arm64"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

BUILDER_NAME="multiarch-builder"
if ! docker buildx inspect "$BUILDER_NAME" &>/dev/null; then
  echo "=== Creating buildx builder ==="
  docker buildx create --name "$BUILDER_NAME" --use --driver docker-container
else
  docker buildx use "$BUILDER_NAME"
fi

declare -A IMAGES=(
  ["tkgling/irodori-tts-discord-bot:latest"]="workers/bot/Dockerfile"
  ["tkgling/plotmaker:latest"]="workers/web/Dockerfile"
)

for IMAGE in "${!IMAGES[@]}"; do
  DOCKERFILE="${IMAGES[$IMAGE]}"
  echo "=== Building and pushing ${IMAGE} (${PLATFORMS}) ==="
  docker buildx build \
    --platform "$PLATFORMS" \
    --tag "$IMAGE" \
    --file "$REPO_ROOT/$DOCKERFILE" \
    --push \
    "$REPO_ROOT"
done

echo "=== All images pushed ==="
