FROM oven/bun:1 AS deps
WORKDIR /app

RUN --mount=type=bind,source=package.json,target=package.json,readonly \
    --mount=type=bind,source=bun.lock,target=bun.lock,readonly \
    --mount=type=bind,source=packages/shared/package.json,target=packages/shared/package.json,readonly \
    --mount=type=bind,source=packages/bot/package.json,target=packages/bot/package.json,readonly \
    bun install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY package.json tsconfig.base.json tsconfig.json ./
COPY packages/shared packages/shared
COPY packages/bot packages/bot
RUN bun run --filter @irodori-tts/bot build

FROM oven/bun:1 AS prod-deps
WORKDIR /app

RUN --mount=type=bind,source=package.json,target=package.json,readonly \
    --mount=type=bind,source=bun.lock,target=bun.lock,readonly \
    --mount=type=bind,source=packages/shared/package.json,target=packages/shared/package.json,readonly \
    --mount=type=bind,source=packages/bot/package.json,target=packages/bot/package.json,readonly \
    bun install --frozen-lockfile --ignore-scripts --omit=dev

FROM oven/bun:1-slim
WORKDIR /app

RUN \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  --mount=type=cache,target=/var/cache/apt,sharing=locked \
  apt-get update && apt-get install -y --no-install-recommends ffmpeg

ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules node_modules
COPY --from=build /app/packages/shared packages/shared
COPY --from=build /app/packages/bot/dist packages/bot/dist

CMD ["bun", "run", "packages/bot/dist/index.js"]
