#!/bin/sh

echo "🚀 Starting E-commerce Application..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until npx prisma db push --accept-data-loss; do
  echo "Database not ready, waiting 5 seconds..."
  sleep 5
done

echo "✅ Database is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma db push --accept-data-loss

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start the application
echo "🎉 Starting Next.js application..."
exec npx next start
