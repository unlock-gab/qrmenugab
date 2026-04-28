#!/bin/sh
set -e

echo "🚀 Starting QRMenu SaaS..."
echo "📍 Working directory: $(pwd)"
echo "🗄️  Database: ${DATABASE_URL:0:40}..."

# Run Prisma migrations using global prisma CLI
echo "📦 Running database migrations..."
prisma migrate deploy \
  --schema /app/artifacts/restaurant-qr/prisma/schema.prisma

echo "✅ Migrations done."
echo "🌐 Starting Next.js server on 0.0.0.0:${PORT:-3000}..."

# HOSTNAME=0.0.0.0 is required for Docker — otherwise Next.js only listens on 127.0.0.1
export HOSTNAME="0.0.0.0"

exec node /app/artifacts/restaurant-qr/server.js
