# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json bun.lock ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all dependencies
RUN bun install

# Copy all source files
COPY client/ ./client/
COPY server/ ./server/

# Build the Vite/React client → output to client/dist
RUN cd client && bun run build

# Generate Prisma client (placeholder DATABASE_URL — not used at runtime)
RUN cd server && DATABASE_URL="postgresql://p:p@localhost:5432/db" bunx prisma generate

# Bundle the Express server → output to server/dist
RUN cd server && bun run build

# ─── Stage 2: Production runtime ─────────────────────────────────────────────
FROM oven/bun:1 AS runner

WORKDIR /app

# Copy only the production artifacts
COPY --from=builder /app/client/dist        ./client/dist
COPY --from=builder /app/server/dist        ./server/dist
COPY --from=builder /app/server/prisma.config.ts ./server/prisma.config.ts
COPY --from=builder /app/server/prisma         ./server/prisma
COPY --from=builder /app/server/src/generated    ./server/src/generated
COPY --from=builder /app/server/node_modules  ./server/node_modules
COPY --from=builder /app/node_modules        ./node_modules
COPY --from=builder /app/server/package.json  ./server/package.json

WORKDIR /app/server

EXPOSE 3001

# Start the server (migrations run via preDeployCommand in railway.json)
CMD ["sh", "-c", "bun dist/index.js"]
