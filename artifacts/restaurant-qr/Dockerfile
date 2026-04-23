FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ── deps stage ──────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/restaurant-qr/package.json ./artifacts/restaurant-qr/
RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile

# ── builder stage ────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/artifacts/restaurant-qr/node_modules ./artifacts/restaurant-qr/node_modules

COPY . .

# Generate Prisma client
RUN cd artifacts/restaurant-qr && npx prisma generate

# Build Next.js
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @workspace/restaurant-qr run build

# ── runner stage ─────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy built output
COPY --from=builder /app/artifacts/restaurant-qr/.next/standalone ./
COPY --from=builder /app/artifacts/restaurant-qr/.next/static ./artifacts/restaurant-qr/.next/static
COPY --from=builder /app/artifacts/restaurant-qr/public ./artifacts/restaurant-qr/public
COPY --from=builder /app/artifacts/restaurant-qr/prisma ./prisma

# Startup script
COPY artifacts/restaurant-qr/scripts/startup.sh ./startup.sh
RUN chmod +x ./startup.sh && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["./startup.sh"]
