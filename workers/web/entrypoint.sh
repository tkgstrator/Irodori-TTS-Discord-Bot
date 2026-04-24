#!/bin/sh
set -eu

bunx prisma migrate deploy

exec bun run dist/server/index.js
