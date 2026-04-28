#!/bin/sh
# Minimal entrypoint — NO set -e, migrations are non-blocking

echo "=== QRMenu v5 ==="
echo "Node: $(node --version)"
echo "PORT=${PORT:-3000} HOSTNAME=${HOSTNAME:-not-set}"

# Show /app structure to confirm server.js location
echo "--- /app ---"
ls /app/

# Locate server.js
if [ -f "/app/server.js" ]; then
  SERVER_JS="/app/server.js"
elif [ -f "/app/artifacts/restaurant-qr/server.js" ]; then
  SERVER_JS="/app/artifacts/restaurant-qr/server.js"
else
  echo "ERROR: server.js not found. Tree:"
  find /app -name "server.js" 2>/dev/null | head -10
  exit 1
fi
echo "server.js: $SERVER_JS"

# Run migrations — non-fatal, never block startup
echo "--- Migrations ---"
prisma migrate deploy --schema /app/artifacts/restaurant-qr/prisma/schema.prisma 2>&1 \
  && echo "Migrations: OK" \
  || echo "Migrations: WARNING (skipped)"

# Start
echo "--- Starting Next.js ---"
export HOSTNAME="0.0.0.0"
export PORT="${PORT:-3000}"
exec node "$SERVER_JS"
