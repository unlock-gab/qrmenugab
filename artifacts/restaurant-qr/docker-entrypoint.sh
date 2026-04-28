#!/bin/sh
# Do NOT use set -e — we handle errors manually

echo "=== QRMenu Startup ==="
echo "Node: $(node --version)"
echo "PORT: ${PORT:-3000}"
echo "HOSTNAME: ${HOSTNAME:-not set}"
echo "DATABASE_URL prefix: ${DATABASE_URL:0:50}..."

# Debug: show /app contents to confirm standalone structure
echo ""
echo "=== /app contents ==="
ls -la /app/

# Prisma engine binaries debug
echo ""
echo "=== Prisma engines in /prisma-engines ==="
ls -la /prisma-engines/ 2>/dev/null || echo "(none found)"

# Auto-locate server.js
# With outputFileTracingRoot=workspace-root, standalone root = /app/ → server.js at /app/server.js
if [ -f "/app/server.js" ]; then
  SERVER_JS="/app/server.js"
  echo "server.js: /app/server.js ✓"
elif [ -f "/app/artifacts/restaurant-qr/server.js" ]; then
  SERVER_JS="/app/artifacts/restaurant-qr/server.js"
  echo "server.js: /app/artifacts/restaurant-qr/server.js ✓"
else
  echo "Searching for server.js..."
  FOUND=$(find /app -name "server.js" -maxdepth 6 2>/dev/null | head -1)
  if [ -z "$FOUND" ]; then
    echo "FATAL: No server.js found — listing /app tree:"
    find /app -maxdepth 4 2>/dev/null | head -80
    exit 1
  fi
  SERVER_JS="$FOUND"
  echo "server.js found at: $SERVER_JS"
fi

# Point Prisma to the correct engine binary
ENGINE_FILE=$(ls /prisma-engines/libquery_engine-debian* 2>/dev/null | head -1)
if [ -n "$ENGINE_FILE" ]; then
  export PRISMA_QUERY_ENGINE_LIBRARY="$ENGINE_FILE"
  echo "PRISMA_QUERY_ENGINE_LIBRARY=$ENGINE_FILE"
fi

SCHEMA_FILE=$(ls /prisma-engines/schema-engine-debian* 2>/dev/null | head -1)
if [ -n "$SCHEMA_FILE" ]; then
  export PRISMA_SCHEMA_ENGINE_BINARY="$SCHEMA_FILE"
  echo "PRISMA_SCHEMA_ENGINE_BINARY=$SCHEMA_FILE"
fi

# Run Prisma migrations (non-fatal)
echo ""
echo "=== DB Migrations ==="
if command -v prisma >/dev/null 2>&1; then
  prisma migrate deploy \
    --schema /app/artifacts/restaurant-qr/prisma/schema.prisma \
    && echo "Migrations: OK" \
    || echo "WARNING: Migrations failed — app starting anyway"
else
  echo "WARNING: prisma CLI not found — skipping migrations"
fi

# Start Next.js
echo ""
echo "=== Starting Next.js on 0.0.0.0:${PORT:-3000} ==="
export HOSTNAME="0.0.0.0"
export PORT="${PORT:-3000}"
exec node "$SERVER_JS"
