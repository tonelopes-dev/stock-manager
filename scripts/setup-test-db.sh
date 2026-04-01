#!/usr/bin/env bash
# =============================================================
# Setup script for the test database
# Creates the kipo_test database and pushes the Prisma schema.
# =============================================================

set -e

echo "🧪 Setting up test database..."

# Create the test database if it doesn't exist
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'kipo_test'" | grep -q 1 || \
  psql -U postgres -c "CREATE DATABASE kipo_test"

echo "📐 Pushing Prisma schema to test database..."

# Push schema directly (faster than migrations for test setup)
dotenv -e .env.test -- npx prisma db push --force-reset --accept-data-loss --skip-generate

echo "✅ Test database ready!"
