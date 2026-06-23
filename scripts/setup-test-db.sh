#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$SCRIPT_DIR/server/.env.test"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env.test not found at $ENV_FILE"
  exit 1
fi

export $(grep -v '^\s*#' "$ENV_FILE" | xargs)

echo "--- Setting up test database ---"

cd "$SCRIPT_DIR/server"

echo ">> Resetting test database..."
psql -U apple -d postgres -tc "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname='tickethub_test' AND pid <> pg_backend_pid()" 2>/dev/null || true
dropdb -U apple tickethub_test 2>/dev/null || true
createdb -U apple tickethub_test

echo ">> Syncing schema to test DB (db push)..."
DATABASE_URL="$DATABASE_URL" bunx prisma db push --accept-data-loss

echo ">> Seeding test DB..."
DATABASE_URL="$DATABASE_URL" bun src/db/seed.ts

echo "--- Test database setup complete ---"
