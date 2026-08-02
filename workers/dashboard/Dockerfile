# syntax=docker/dockerfile:1.7
# Build from the repository root:
#   docker build -f workers/dashboard/Dockerfile -t ghcr.io/tkgstrator/irodori-tts-dashboard:latest .

FROM oven/bun:1 AS deps
WORKDIR /app
RUN --mount=type=bind,source=package.json,target=package.json,readonly \
    --mount=type=bind,source=bun.lock,target=bun.lock,readonly \
    --mount=type=bind,source=packages/shared/package.json,target=packages/shared/package.json,readonly \
    --mount=type=bind,source=workers/bot/package.json,target=workers/bot/package.json,readonly \
    --mount=type=bind,source=workers/web/package.json,target=workers/web/package.json,readonly \
    --mount=type=bind,source=workers/dashboard/package.json,target=workers/dashboard/package.json,readonly \
    bun install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY package.json tsconfig.base.json ./
COPY packages/shared packages/shared
COPY workers/dashboard workers/dashboard
RUN bun run --filter @irodori-tts/dashboard build

FROM oven/bun:1-slim AS runtime
WORKDIR /app/workers/dashboard
ENV NODE_ENV=production
ENV PORT=18775

COPY --from=build /app/workers/dashboard/dist dist

EXPOSE 18775
CMD ["bun", "run", "dist/server/index.js"]
