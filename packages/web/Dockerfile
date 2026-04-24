FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY packages/web/package.json packages/web/
RUN bun install --frozen-lockfile --ignore-scripts

FROM base AS build
COPY tsconfig.base.json tsconfig.json ./
COPY packages/shared packages/shared
COPY packages/web packages/web
RUN bunx prisma generate --schema=packages/web/prisma/schema.prisma --generator client && \
    bun run --filter @irodori-tts/web build

FROM oven/bun:1-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY packages/web/package.json packages/web/
RUN bun install --frozen-lockfile --ignore-scripts --omit=dev

COPY --from=build /app/tsconfig.base.json ./
COPY --from=build /app/packages/shared packages/shared
COPY --from=build /app/packages/web/tsconfig.json packages/web/
COPY --from=build /app/packages/web/generated packages/web/generated
COPY --from=build /app/packages/web/dist packages/web/dist
COPY --from=build /app/packages/web/src packages/web/src
COPY --from=build /app/packages/web/prisma/schema.prisma packages/web/prisma/

EXPOSE 3000
CMD ["bun", "run", "packages/web/src/index.ts"]
