#!/bin/sh
set -e

echo "🚀 SMCORP Backend - Starting..."
echo ""

# 1. Run migrations
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy
npx prisma generate
echo "✅ Migrations applied"
echo ""

# 2. Conditional seed
if [ "$SEED_ON_STARTUP" = "true" ]; then
  echo "🌱 SEED_ON_STARTUP=true → Running seed..."
  npx prisma db seed
  echo "✅ Seed completed"
else
  echo "⏭️  SEED_ON_STARTUP=false → Skipping seed"
fi

echo ""
echo "🔧 Starting NestJS application..."
exec npm run start:dev
