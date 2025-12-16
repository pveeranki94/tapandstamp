# Build stage
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS builder
WORKDIR /app

# Copy package files for dependency installation
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY packages/imaging/package.json packages/imaging/
COPY packages/pass-apple/package.json packages/pass-apple/
COPY packages/pass-google/package.json packages/pass-google/
COPY apps/admin/package.json apps/admin/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ packages/
COPY apps/admin/ apps/admin/

# Build packages first, then admin app
RUN pnpm -r --filter './packages/*' build
RUN pnpm --filter @tapandstamp/admin build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/apps/admin/package.json ./apps/admin/
COPY --from=builder /app/apps/admin/next.config.js ./apps/admin/

WORKDIR /app/apps/admin

EXPOSE 8080
ENV PORT=8080

CMD ["pnpm", "start"]
