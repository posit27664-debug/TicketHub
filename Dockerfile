FROM oven/bun:1

WORKDIR /app

# Copy workspace manifests
COPY package.json bun.lock ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all dependencies
RUN bun install

# Copy all source files
COPY client/ ./client/
COPY server/ ./server/

# Generate Prisma client
RUN cd server && DATABASE_URL="postgresql://p:p@localhost:5432/db" bunx prisma generate

# Build the Vite/React client
RUN cd client && bun run build

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3001

CMD ["/app/entrypoint.sh"]
