#!/bin/sh
set -e

echo "=== QRMenu SaaS Startup ==="
echo "Working dir: $(pwd)"
echo "Node: $(node --version)"
echo "DATABASE_URL prefix: ${DATABASE_URL:0:40}..."

# Debug: show what's in /app to confirm server.js location
echo ""
echo "=== Files in /app ==="
ls -la /app/
echo ""

# In Next.js standalone (pnpm monorepo), server.js is at the WORKSPACE ROOT
# i.e. /app/server.js — NOT inside artifacts/restaurant-qr/
SERVER_JS="/app/server.js"
if [ ! -f "$SERVER_JS" ]; then
  echo "ERROR: $SERVER_JS not found! Searching..."
  find /app -name "server.js" -maxdepth 4 2>/dev/null || true
  exit 1
fi

# Run Prisma migrations
echo "=== Running DB migrations ==="
prisma migrate deploy \
  --schema /app/artifacts/restaurant-qr/prisma/schema.prisma
echo "=== Migrations complete ==="

# HOSTNAME=0.0.0.0 is required in Docker so Next.js listens on all interfaces
export HOSTNAME="0.0.0.0"
export PORT="${PORT:-3000}"

echo "Starting Next.js on ${HOSTNAME}:${PORT}..."
exec node "$SERVER_JS"
