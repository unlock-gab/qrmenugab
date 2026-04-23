#!/bin/sh
# QR Menu Production Startup Script
set -e

echo "==> QR Menu starting..."
echo "==> Node: $(node --version)"
echo "==> Environment: ${NODE_ENV:-production}"

# Run Prisma migrations on startup
echo "==> Running database migrations..."
cd /app && npx prisma migrate deploy --schema=./prisma/schema.prisma || {
  echo "WARNING: Migration failed — attempting db push..."
  npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss || true
}

echo "==> Starting Next.js server..."
exec node artifacts/restaurant-qr/server.js
