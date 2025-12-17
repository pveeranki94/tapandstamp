# Build stage
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS builder
WORKDIR /app

# Copy package files for dependency installation
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY packages/imaging/package.json packages/imaging/
COPY packages/pass-apple/package.json packages/pass-apple/
COPY packages/pass-google/package.json packages/pass-google/
COPY apps/api/package.json apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ packages/
COPY apps/api/ apps/api/

# Build packages first, then API
RUN pnpm -r --filter './packages/*' build
RUN pnpm --filter @tapandstamp/api build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy workspace config and package files
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Copy built packages and API
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

WORKDIR /app/apps/api

EXPOSE 8080
ENV PORT=8080

CMD ["node", "dist/index.js"]
