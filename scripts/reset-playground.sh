#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# reset-playground.sh — Tear down and rebuild the playground from scratch.
#
# Usage:
#   bash scripts/reset-playground.sh            # full clean (removes DB too)
#   bash scripts/reset-playground.sh --keep-db   # preserve database & test data
#   npm run reset:playground                     # keeps DB (default for dev)
#   npm run hardreset:playground                 # full clean incl. DB
#
# What it does:
#   1. Removes the playground directory contents (preserving DB if --keep-db)
#   2. Creates a minimal Astro project structure (package.json, tsconfig.json)
#   3. Runs the CLI scaffold: `npx @community-rss/core init --force`
#   4. Copies the dev .env template from scripts/playground.env
#   5. Runs `npm install` from root to wire workspace symlinks
#
# The playground is an ephemeral, non-version-controlled workspace used to
# test the framework exactly as a consumer would experience it.
#
# Understanding what gets refreshed:
#   - Pages, email templates, config, styles → rebuilt from latest templates
#   - Backend API routes, middleware, components → always live via symlink
#   - Database (test accounts, articles) → preserved with --keep-db
#   - .env (environment variables) → always recopied from scripts/playground.env
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLAYGROUND_DIR="$REPO_ROOT/playground"
KEEP_DB=false

for arg in "$@"; do
  case "$arg" in
    --keep-db) KEEP_DB=true ;;
  esac
done

echo ""
echo "  @community-rss/core — Reset Playground"
echo "  ─────────────────────────────────────────"

# ── Step 1: Clean up ──────────────────────────────────────────────────────────
if [ -d "$PLAYGROUND_DIR" ]; then
  if [ "$KEEP_DB" = true ] && [ -f "$PLAYGROUND_DIR/data/community.db" ]; then
    echo "  ♻  Preserving existing database..."
    mkdir -p /tmp/crss-playground-backup
    cp "$PLAYGROUND_DIR/data/community.db"* /tmp/crss-playground-backup/ 2>/dev/null || true
  fi

  echo "  ✕  Removing playground/..."
  # Some items (e.g. Docker volume mounts from a previous docker-compose)
  # cannot be removed. Delete what we can and proceed.
  find "$PLAYGROUND_DIR" -mindepth 1 -maxdepth 1 ! -name data -exec rm -rf {} + 2>/dev/null || true
  # Try to remove data dir; if it fails (Docker volume mount), leave it
  rm -rf "$PLAYGROUND_DIR/data" 2>/dev/null || true
fi

# ── Step 2: Create minimal Astro project ──────────────────────────────────────
echo "  ▸  Creating playground project structure..."
mkdir -p "$PLAYGROUND_DIR"

cat > "$PLAYGROUND_DIR/package.json" << 'PKGJSON'
{
  "name": "playground",
  "private": true,
  "type": "module",
  "version": "0.0.0",
  "scripts": {
    "dev": "ASTRO_TELEMETRY_DISABLED=1 astro dev --host 0.0.0.0",
    "build": "astro build",
    "preview": "astro preview",
    "start": "node dist/server/entry.mjs"
  },
  "dependencies": {
    "@astrojs/node": "^9.1.3",
    "@community-rss/core": "*",
    "astro": "^5.0.0"
  }
}
PKGJSON

cat > "$PLAYGROUND_DIR/tsconfig.json" << 'TSCONFIG'
{
  "extends": "astro/tsconfigs/strict"
}
TSCONFIG

# ── Step 3: Scaffold pages/config via CLI ─────────────────────────────────────
echo "  ▸  Scaffolding via @community-rss/core init..."
cd "$PLAYGROUND_DIR"
node "$REPO_ROOT/packages/core/src/cli/init.mjs" init --force

# ── Step 4: Copy dev .env ─────────────────────────────────────────────────────
echo "  ▸  Copying dev .env..."
cp "$REPO_ROOT/scripts/playground.env" "$PLAYGROUND_DIR/.env"

# Restore database if preserved
if [ "$KEEP_DB" = true ] && [ -f /tmp/crss-playground-backup/community.db ]; then
  echo "  ♻  Restoring database..."
  mkdir -p "$PLAYGROUND_DIR/data"
  cp /tmp/crss-playground-backup/community.db* "$PLAYGROUND_DIR/data/" 2>/dev/null || true
  rm -rf /tmp/crss-playground-backup
fi

# ── Step 5: Install dependencies ──────────────────────────────────────────────
echo "  ▸  Installing dependencies (npm install)..."
cd "$REPO_ROOT"
npm install --silent 2>&1 | tail -3

echo ""
echo "  ✓  Playground ready!"
echo ""
echo "  Next steps:"
echo "    npm run dev            # Start playground + docs"
echo "    npm run dev:playground # Start playground only"
echo ""
