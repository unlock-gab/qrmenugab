#!/bin/sh
set -e

echo "🚀 Starting QRMenu SaaS..."

# Run Prisma migrations
echo "📦 Running database migrations..."
cd /app/artifacts/restaurant-qr
npx prisma migrate deploy

echo "✅ Migrations done. Starting server on port ${PORT:-3000}..."

# Start Next.js standalone server
# The standalone output puts server.js in the artifact subfolder
exec node /app/artifacts/restaurant-qr/server.js
