# ============================================================
# Stage 1: Install dependencies
# ============================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.json ./

# Copy all package.json files for workspace packages
COPY artifacts/restaurant-qr/package.json ./artifacts/restaurant-qr/
COPY lib/ ./lib/

# Install all dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# ============================================================
# Stage 2: Build the Next.js app
# ============================================================
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full source
COPY . .

# Reinstall to ensure workspace links are correct
RUN pnpm install --frozen-lockfile --ignore-scripts

# Generate Prisma client
RUN cd artifacts/restaurant-qr && npx prisma generate

# Build Next.js (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm --filter @workspace/restaurant-qr run build

# ============================================================
# Stage 3: Production runner (slim image)
# ============================================================
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone Next.js build
COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/.next/static \
    ./artifacts/restaurant-qr/.next/static

COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/public \
    ./artifacts/restaurant-qr/public

# Copy Prisma for migrations at runtime
COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/prisma \
    ./artifacts/restaurant-qr/prisma

COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/node_modules/.prisma \
    ./artifacts/restaurant-qr/node_modules/.prisma

COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/node_modules/@prisma \
    ./artifacts/restaurant-qr/node_modules/@prisma

COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/prisma \
    ./node_modules/prisma

# Copy entrypoint
COPY --chown=nextjs:nodejs artifacts/restaurant-qr/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
