#!/bin/sh
set -eu

bunx prisma@7.7.0 migrate deploy

if [ "${1:-}" = "--init" ]; then
  echo "Running init seed (speakers + characters)..."
  bun run dist/init.js
fi

exec bun run dist/server/index.js
