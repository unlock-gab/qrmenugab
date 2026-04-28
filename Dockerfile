# ============================================================
# Stage 1: Install dependencies
# ============================================================
FROM node:20-slim AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.json ./
COPY artifacts/restaurant-qr/package.json ./artifacts/restaurant-qr/
COPY lib/ ./lib/

RUN pnpm install --frozen-lockfile --ignore-scripts

# ============================================================
# Stage 2: Build the Next.js app
# ============================================================
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules

# Cache bust — change this number to force a full rebuild: 5
ARG CACHEBUST=6
RUN echo "=== Build cache bust: ${CACHEBUST} ==="

COPY . .

RUN pnpm install --frozen-lockfile --ignore-scripts

# Generate Prisma client
RUN cd artifacts/restaurant-qr && npx prisma generate

# Build Next.js standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm --filter @workspace/restaurant-qr run build

# Debug: confirm server.js location in standalone
RUN echo "=== Standalone root ===" && ls -la /app/artifacts/restaurant-qr/.next/standalone/ | head -20

# Collect Prisma engine binaries
RUN mkdir -p /prisma-engines && \
    find /root/.cache/prisma /app/node_modules -maxdepth 10 \( \
      -name "libquery_engine-debian*" \
      -o -name "query-engine-debian*" \
      -o -name "schema-engine-debian*" \
    \) 2>/dev/null | while read f; do \
      cp "$f" /prisma-engines/ 2>/dev/null && echo "Copied: $f" || true; \
    done && \
    echo "=== Engines ===" && ls -la /prisma-engines/ || true

# ============================================================
# Stage 3: Production runner
# ============================================================
FROM node:20-slim AS runner

ARG CACHEBUST=6
LABEL build_version="2026-04-28-v5"

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Copy standalone build (server.js at workspace root → /app/server.js)
COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/.next/static \
    ./artifacts/restaurant-qr/.next/static

COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/public \
    ./artifacts/restaurant-qr/public

COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/prisma \
    ./artifacts/restaurant-qr/prisma

RUN mkdir -p /prisma-engines
COPY --from=builder /prisma-engines /prisma-engines

# Install Prisma CLI globally for migrations
RUN npm install -g prisma@6.19.3 --quiet && rm -rf ~/.npm

# Entrypoint
COPY --chown=nextjs:nodejs artifacts/restaurant-qr/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT||3000) + '/api/health', r => process.exit(r.statusCode <= 503 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
