# syntax=docker/dockerfile:1.7
# Build from the repository root:
#   docker build -f workers/bot/Dockerfile -t tkgling/plotmaker-bot:latest .

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
COPY workers/bot workers/bot
RUN bun run --filter @irodori-tts/bot build

FROM oven/bun:1 AS prod-deps
WORKDIR /app
RUN --mount=type=bind,source=package.json,target=package.json,readonly \
    --mount=type=bind,source=bun.lock,target=bun.lock,readonly \
    --mount=type=bind,source=packages/shared/package.json,target=packages/shared/package.json,readonly \
    --mount=type=bind,source=workers/bot/package.json,target=workers/bot/package.json,readonly \
    --mount=type=bind,source=workers/web/package.json,target=workers/web/package.json,readonly \
    bun install --frozen-lockfile --ignore-scripts --omit=dev

FROM oven/bun:1-slim AS runtime
WORKDIR /app/workers/bot
RUN --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends ffmpeg
ENV NODE_ENV=production

COPY --from=build /app/workers/bot/dist dist
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/workers/bot/node_modules /app/workers/bot/node_modules

CMD ["bun", "run", "dist/index.js"]
