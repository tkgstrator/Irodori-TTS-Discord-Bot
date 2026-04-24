# syntax=docker/dockerfile:1.7
# Build from the repository root:
#   docker build -f workers/web/Dockerfile -t tkgling/plotmaker:latest .

FROM oven/bun:1 AS deps
WORKDIR /app
RUN --mount=type=bind,source=package.json,target=package.json,readonly \
    --mount=type=bind,source=bun.lock,target=bun.lock,readonly \
    --mount=type=bind,source=packages/shared/package.json,target=packages/shared/package.json,readonly \
    --mount=type=bind,source=workers/bot/package.json,target=workers/bot/package.json,readonly \
    --mount=type=bind,source=workers/web/package.json,target=workers/web/package.json,readonly \
    bun install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY package.json tsconfig.base.json ./
COPY packages/shared packages/shared
COPY workers/web workers/web
RUN bunx prisma generate --schema=workers/web/prisma/schema.prisma --generator=client
RUN bun run --filter @irodori-tts/web build

FROM oven/bun:1-slim AS runtime
WORKDIR /app/workers/web
ENV NODE_ENV=production

COPY --from=build /app/workers/web/dist dist

EXPOSE 3000
CMD ["bun", "run", "dist/server/index.js"]
