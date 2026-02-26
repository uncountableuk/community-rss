# Community RSS — Production Dockerfile
#
# Multi-stage build for the Astro + Node.js application.
#
# Usage:
#   docker build -t community-rss-app .
#   docker run -p 4321:4321 --env-file .env community-rss-app
#
# Or with docker-compose:
#   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# ── Stage 1: Build ──────────────────────────────────────
FROM node:22-slim AS build

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the Astro project
RUN npm run build

# ── Stage 2: Production ────────────────────────────────
FROM node:22-slim AS production

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy the built output from the build stage
COPY --from=build /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set default environment variables
ENV HOST=0.0.0.0
ENV PORT=4321
ENV DATABASE_PATH=/app/data/community.db

EXPOSE 4321

CMD ["node", "dist/server/entry.mjs"]
