#!/bin/sh
set -eu

bunx prisma@7.7.0 migrate deploy

exec bun run dist/server/index.js
