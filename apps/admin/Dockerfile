# Build stage
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS builder
WORKDIR /app

# Copy package files for dependency installation
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json .eslintrc.cjs ./
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

# Build args for environment-specific Supabase URLs (baked into Next.js client)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
# Dummy service key for build (real value comes at runtime from secrets)
ENV SUPABASE_SERVICE_ROLE_KEY=placeholder-service-key

# Contentful build args (optional - page renders without if not set)
ARG CONTENTFUL_SPACE_ID
ARG CONTENTFUL_DELIVERY_TOKEN
ARG CONTENTFUL_ENVIRONMENT=master
ENV CONTENTFUL_SPACE_ID=${CONTENTFUL_SPACE_ID}
ENV CONTENTFUL_DELIVERY_TOKEN=${CONTENTFUL_DELIVERY_TOKEN}
ENV CONTENTFUL_ENVIRONMENT=${CONTENTFUL_ENVIRONMENT}

RUN pnpm --filter @tapandstamp/admin build

# Production stage
FROM base AS runner
WORKDIR /app

# Install openssl for PassKit certificate handling and fonts for stamp rendering
RUN apt-get update && apt-get install -y openssl fontconfig fonts-dejavu-core && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy workspace config and package files
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/imaging/package.json ./packages/imaging/
COPY --from=builder /app/packages/pass-apple/package.json ./packages/pass-apple/
COPY --from=builder /app/packages/pass-google/package.json ./packages/pass-google/
COPY --from=builder /app/apps/admin/package.json ./apps/admin/

# Copy built packages
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/imaging/dist ./packages/imaging/dist
COPY --from=builder /app/packages/pass-apple/dist ./packages/pass-apple/dist
COPY --from=builder /app/packages/pass-google/dist ./packages/pass-google/dist

# Copy Next.js build artifacts
COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/apps/admin/next.config.js ./apps/admin/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

WORKDIR /app/apps/admin

EXPOSE 8080
ENV PORT=8080

CMD ["pnpm", "start"]
