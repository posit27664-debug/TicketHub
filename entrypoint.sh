#!/bin/sh
set -e

echo "Running Prisma db push..."
bunx prisma db push 2>&1
echo "Prisma db push complete."

echo "Starting server..."
exec bun dist/index.js
