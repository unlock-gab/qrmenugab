#!/bin/sh
# QRMenu production entrypoint — no set -e, failures are handled manually

echo "=== QRMenu v6 ==="
echo "Node: $(node --version)"
echo "PORT=${PORT:-3000}"

SCHEMA="/app/artifacts/restaurant-qr/prisma/schema.prisma"

# ── 1. Run DB migrations ────────────────────────────────────────────────────
echo "--- DB Migrations ---"
if command -v prisma >/dev/null 2>&1; then
  prisma migrate deploy --schema "$SCHEMA" 2>&1 \
    && echo "✅ Migrations: OK" \
    || {
      echo "⚠️  migrate deploy failed — trying db push as fallback..."
      prisma db push --schema "$SCHEMA" --accept-data-loss 2>&1 \
        && echo "✅ DB push: OK" \
        || echo "❌ DB push also failed — app will start anyway, check DB connection"
    }
else
  echo "⚠️  prisma CLI not found"
fi

# ── 2. Locate server.js ─────────────────────────────────────────────────────
echo "--- Locating server.js ---"
if [ -f "/app/server.js" ]; then
  SERVER_JS="/app/server.js"
elif [ -f "/app/artifacts/restaurant-qr/server.js" ]; then
  SERVER_JS="/app/artifacts/restaurant-qr/server.js"
else
  FOUND=$(find /app -name "server.js" -maxdepth 6 2>/dev/null | head -1)
  if [ -z "$FOUND" ]; then
    echo "FATAL: server.js not found"
    ls /app/ 2>/dev/null | head -20
    exit 1
  fi
  SERVER_JS="$FOUND"
fi
echo "server.js: $SERVER_JS"

# ── 3. Start Next.js ────────────────────────────────────────────────────────
export HOSTNAME="0.0.0.0"
export PORT="${PORT:-3000}"
echo "--- Starting on ${HOSTNAME}:${PORT} ---"
exec node "$SERVER_JS"
