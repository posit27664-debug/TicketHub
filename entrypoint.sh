#!/bin/sh
echo "=== Entrypoint started ==="
echo "DATABASE_URL is set: ${DATABASE_URL:+yes}"
echo "PORT: ${PORT:-3001}"
echo "NODE_ENV: ${NODE_ENV:-not set}"

echo "Running Prisma db push..."
cd /app/server && bunx prisma db push 2>&1
echo "Prisma db push complete."

echo "Starting server..."
cd /app/server && exec bun run src/index.ts
