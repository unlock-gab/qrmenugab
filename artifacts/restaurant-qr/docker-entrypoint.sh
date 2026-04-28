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
echo "🌐 Starting Next.js server on port ${PORT:-3000}..."

# Start Next.js standalone server
exec node /app/artifacts/restaurant-qr/server.js
