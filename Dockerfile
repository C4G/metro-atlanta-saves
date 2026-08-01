# syntax=docker/dockerfile:1
#
# Multi-stage build for both apps. `base` -> `deps` -> `build` are shared, so
# BuildKit runs `pnpm install` and the Nx builds once even though two images
# come out the other end.
#
#   docker build --target backend  -t mas-backend  .
#   docker build --target frontend -t mas-frontend .

# ---------------------------------------------------------------------------
# base — Node 24 is mandatory: pnpm-workspace.yaml sets engineStrict: true.
# openssl is required by Prisma's query engine.
# ---------------------------------------------------------------------------
FROM node:24-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /workspace

# ---------------------------------------------------------------------------
# deps — native modules (sharp, argon2, @swc/core, prisma engines) are compiled
# here and copied forward as-is, so every later stage must share this base
# image or the .node binaries will not match libc.
# ---------------------------------------------------------------------------
FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential python3 \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# build — never reaches out to Nx Cloud; nx.json carries an nxCloudId, and a
# deploy must not depend on that service being available.
# ---------------------------------------------------------------------------
FROM deps AS build
ENV NX_NO_CLOUD=true
ENV NX_DAEMON=false
COPY . .
RUN pnpm exec nx run backend:prisma-generate \
  && pnpm exec nx run backend:build:production \
  && pnpm exec nx run frontend:build:production

# ---------------------------------------------------------------------------
# backend — Nest bundle is not bundled-with-deps, so node_modules ships too.
# main.js resolves mail templates via join(__dirname, './assets/templates'),
# which is why dist/apps/backend is copied whole.
# ---------------------------------------------------------------------------
FROM base AS backend
ENV NODE_ENV=production
ENV API_PORT=3000
ENV UPLOAD_DIR=/data/uploads
WORKDIR /app
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/dist/apps/backend ./
COPY --from=build /workspace/apps/backend/prisma ./prisma
COPY docker/backend-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "main.js"]

# ---------------------------------------------------------------------------
# frontend — Angular SSR express server.
# ---------------------------------------------------------------------------
FROM base AS frontend
ENV NODE_ENV=production
ENV FE_PORT=4000
WORKDIR /app
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/dist/apps/frontend ./
EXPOSE 4000
CMD ["node", "server/server.mjs"]
