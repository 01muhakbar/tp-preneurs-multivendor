FROM node:20-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
COPY packages/schemas/package.json ./packages/schemas/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY . .

RUN pnpm build

FROM base AS runtime

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
COPY packages/schemas/package.json ./packages/schemas/package.json

RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/migrations ./server/migrations
COPY --from=build /app/server/scripts ./server/scripts
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/packages/schemas/dist ./packages/schemas/dist

RUN mkdir -p uploads

EXPOSE 3001

CMD ["node", "server/dist/server.js"]
