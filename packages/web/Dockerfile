FROM oven/bun:1 AS deps
WORKDIR /app

RUN --mount=type=bind,source=package.json,target=package.json,readonly \
    --mount=type=bind,source=bun.lock,target=bun.lock,readonly \
    --mount=type=bind,source=packages/shared/package.json,target=packages/shared/package.json,readonly \
    --mount=type=bind,source=packages/web/package.json,target=packages/web/package.json,readonly \
    bun install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY package.json tsconfig.base.json tsconfig.json ./
COPY packages/shared packages/shared
COPY packages/web packages/web
RUN bunx prisma generate --schema=packages/web/prisma/schema.prisma --generator client && \
    bun run --filter @irodori-tts/web build

FROM oven/bun:1 AS prod-deps
WORKDIR /app

RUN --mount=type=bind,source=packages/web/package.json,target=package.json,readonly \
    --mount=type=bind,source=bun.lock,target=bun.lock,readonly \
    bun install --ignore-scripts --omit=dev

FROM oven/bun:1-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules node_modules
COPY --from=build /app/packages/web/generated/prisma packages/web/generated/prisma
COPY --from=build /app/packages/web/dist packages/web/dist
COPY --from=build /app/packages/web/prisma/schema.prisma packages/web/prisma/

EXPOSE 3000
CMD ["bun", "run", "packages/web/dist/server/index.js"]
