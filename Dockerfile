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

# Generate Prisma client (puts engines in pnpm store)
RUN cd artifacts/restaurant-qr && npx prisma generate

# Build Next.js standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm --filter @workspace/restaurant-qr run build

# Collect Prisma engine binaries to a known path for easy copying
RUN mkdir -p /prisma-engines && \
    find /app/node_modules -name "libquery_engine-debian*" -o \
         -name "query-engine-debian*" -o \
         -name "schema-engine-debian*" \
         2>/dev/null | xargs -I{} cp {} /prisma-engines/ 2>/dev/null || true

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

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Copy the standalone Next.js build (includes trimmed node_modules)
COPY --from=builder --chown=nextjs:nodejs \
    /app/artifacts/restaurant-qr/.next/standalone ./

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

# Copy Prisma engine binaries (if any were found)
COPY --from=builder --chown=nextjs:nodejs /prisma-engines /prisma-engines

# Install prisma CLI globally for running migrations at startup
RUN npm install -g prisma@6.19.3 --quiet && \
    rm -rf ~/.npm

# Entrypoint script
COPY --chown=nextjs:nodejs artifacts/restaurant-qr/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
