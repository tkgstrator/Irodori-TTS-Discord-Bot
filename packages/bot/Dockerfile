FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY packages/bot/package.json packages/bot/
RUN bun install --frozen-lockfile --ignore-scripts

FROM base AS build
COPY tsconfig.base.json tsconfig.json ./
COPY packages/shared packages/shared
COPY packages/bot packages/bot
RUN bun run --filter @irodori-tts/bot build

FROM oven/bun:1-slim
WORKDIR /app

RUN \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  --mount=type=cache,target=/var/cache/apt,sharing=locked \
  apt-get update && apt-get install -y --no-install-recommends ffmpeg

ENV NODE_ENV=production

COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY packages/bot/package.json packages/bot/
RUN bun install --frozen-lockfile --ignore-scripts --omit=dev

COPY --from=build /app/packages/shared packages/shared
COPY --from=build /app/packages/bot/dist packages/bot/dist

CMD ["bun", "run", "packages/bot/dist/index.js"]
