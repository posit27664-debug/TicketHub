#!/bin/sh
echo "Running Prisma db push..."
cd /app/server && bunx prisma db push 2>&1
echo "Prisma db push complete."

echo "Starting server..."
cd /app/server && exec bun run src/index.ts
