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

FROM oven/bun:1 AS prisma-cli
WORKDIR /app/workers/web
RUN printf '%s' '{"dependencies":{"prisma":"7.7.0"}}' > package.json && \
    bun install --linker=hoisted --production

FROM oven/bun:1-slim AS runtime
WORKDIR /app/workers/web
ENV NODE_ENV=production

COPY --from=build /app/workers/web/dist dist
COPY --from=build /app/workers/web/prisma/schema.prisma prisma/schema.prisma
COPY --from=build /app/workers/web/prisma/migrations prisma/migrations
COPY --from=build /app/workers/web/prisma.config.ts prisma.config.ts
COPY --from=prisma-cli /app/workers/web/node_modules node_modules
COPY workers/web/entrypoint.sh /entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
