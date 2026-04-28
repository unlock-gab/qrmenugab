#!/bin/sh
# Do NOT use set -e so one failing step doesn't kill the container

echo "=== QRMenu Startup ==="
echo "Node: $(node --version)"
echo "Working dir: $(pwd)"
echo "DATABASE_URL prefix: ${DATABASE_URL:0:50}..."

# Debug: locate server.js
echo ""
echo "=== Locating server.js ==="
ls /app/ 2>/dev/null || echo "Cannot list /app/"

# The Next.js standalone COPY puts server.js at /app/server.js (workspace root)
# In pnpm monorepo, standalone root = workspace root after COPY
if [ -f "/app/server.js" ]; then
  SERVER_JS="/app/server.js"
  echo "Found: /app/server.js"
elif [ -f "/app/artifacts/restaurant-qr/server.js" ]; then
  SERVER_JS="/app/artifacts/restaurant-qr/server.js"
  echo "Found: /app/artifacts/restaurant-qr/server.js"
else
  echo "Searching for server.js..."
  FOUND=$(find /app -name "server.js" -maxdepth 5 2>/dev/null | head -1)
  if [ -z "$FOUND" ]; then
    echo "FATAL: No server.js found anywhere in /app"
    ls -R /app/ 2>/dev/null | head -50
    exit 1
  fi
  SERVER_JS="$FOUND"
  echo "Found at: $SERVER_JS"
fi

# Run Prisma migrations (non-fatal — log error and continue)
echo ""
echo "=== DB Migrations ==="
if command -v prisma >/dev/null 2>&1; then
  prisma migrate deploy \
    --schema /app/artifacts/restaurant-qr/prisma/schema.prisma \
    && echo "Migrations OK" \
    || echo "WARNING: Migration failed (app will still start)"
else
  echo "WARNING: prisma CLI not found, skipping migrations"
fi

echo ""
echo "=== Starting Next.js ==="
export HOSTNAME="0.0.0.0"
export PORT="${PORT:-3000}"
echo "Listening on ${HOSTNAME}:${PORT}"
echo "Server: $SERVER_JS"

exec node "$SERVER_JS"
