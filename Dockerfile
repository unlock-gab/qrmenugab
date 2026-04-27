# ============================================================
# Stage 1: Dependencies installer
# ============================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc* ./
COPY tsconfig.base.json tsconfig.json ./

# Copy all workspace package manifests (needed for pnpm workspace linking)
COPY artifacts/restaurant-qr/package.json ./artifacts/restaurant-qr/package.json
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json 2>/dev/null || true
COPY lib/ ./lib/
COPY scripts/package.json ./scripts/package.json 2>/dev/null || true

# Install all dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile --ignore-scripts

# ============================================================
# Stage 2: Builder
# ============================================================
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/artifacts/restaurant-qr/node_modules ./artifacts/restaurant-qr/node_modules 2>/dev/null || true

# Copy full source
COPY . .

# Generate Prisma client
RUN cd artifacts/restaurant-qr && npx prisma generate

# Build Next.js app (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN cd artifacts/restaurant-qr && pnpm run build

# ============================================================
# Stage 3: Runner (slim production image)
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

# Copy the standalone Next.js build
COPY --from=builder /app/artifacts/restaurant-qr/.next/standalone ./
COPY --from=builder /app/artifacts/restaurant-qr/.next/static ./artifacts/restaurant-qr/.next/static
COPY --from=builder /app/artifacts/restaurant-qr/public ./artifacts/restaurant-qr/public

# Copy Prisma schema and migrations for runtime
COPY --from=builder /app/artifacts/restaurant-qr/prisma ./artifacts/restaurant-qr/prisma
COPY --from=builder /app/artifacts/restaurant-qr/node_modules/.prisma ./artifacts/restaurant-qr/node_modules/.prisma
COPY --from=builder /app/artifacts/restaurant-qr/node_modules/@prisma ./artifacts/restaurant-qr/node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || true
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma 2>/dev/null || true
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma 2>/dev/null || true

# Copy entrypoint script
COPY artifacts/restaurant-qr/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
