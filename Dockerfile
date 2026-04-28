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
COPY . .

RUN pnpm install --frozen-lockfile --ignore-scripts

# Generate Prisma client — downloads query engine binary
RUN cd artifacts/restaurant-qr && npx prisma generate

# Download schema-engine (needed for prisma migrate deploy at runtime)
# We trigger it by running prisma -v which downloads all engines
RUN cd artifacts/restaurant-qr && npx prisma version --json || true

# Build Next.js standalone output
# outputFileTracingRoot in next.config.ts points to /app so engines are traced
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm --filter @workspace/restaurant-qr run build

# Collect ALL Prisma engine binaries (query + schema) to a known path
RUN mkdir -p /prisma-engines && \
    find /root/.cache/prisma /app/node_modules -maxdepth 10 \( \
      -name "libquery_engine-debian*" \
      -o -name "query-engine-debian*" \
      -o -name "schema-engine-debian*" \
    \) 2>/dev/null | while read f; do \
      cp "$f" /prisma-engines/ 2>/dev/null && echo "Copied: $f" || true; \
    done && \
    echo "=== Engines collected ===" && ls -la /prisma-engines/ || true

# ============================================================
# Stage 3: Production runner
# ============================================================
FROM node:20-slim AS runner

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

# Copy the standalone Next.js build
# With outputFileTracingRoot=/app, standalone mirrors workspace root structure:
#   /app/server.js                                    ← entry point
#   /app/node_modules/                                ← traced deps
#   /app/artifacts/restaurant-qr/.next/server/        ← server bundles
COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/.next/standalone ./

# Copy static assets and public files
COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/.next/static \
    ./artifacts/restaurant-qr/.next/static

COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/public \
    ./artifacts/restaurant-qr/public

# Copy Prisma schema + migrations
COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/prisma \
    ./artifacts/restaurant-qr/prisma

# Copy Prisma engine binaries
RUN mkdir -p /prisma-engines
COPY --from=builder /prisma-engines /prisma-engines

# Install Prisma CLI globally for running migrations at startup
RUN npm install -g prisma@6.19.3 --quiet && \
    rm -rf ~/.npm

# Point Prisma to the correct engine binary locations
ENV PRISMA_QUERY_ENGINE_LIBRARY=/prisma-engines
ENV PRISMA_SCHEMA_ENGINE_BINARY=/prisma-engines

# Entrypoint script
COPY --chown=nextjs:nodejs artifacts/restaurant-qr/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT||3000) + '/api/health', r => process.exit(r.statusCode <= 503 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
