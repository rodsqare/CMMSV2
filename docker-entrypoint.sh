#!/bin/sh
set -e

# Railway provides MYSQL_URL, export it as DATABASE_URL for Prisma compatibility
if [ -n "$MYSQL_URL" ] && [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="$MYSQL_URL"
  echo "[RAILWAY] Using MYSQL_URL as DATABASE_URL"
fi

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "[ERROR] DATABASE_URL is not set. Please configure MYSQL_URL or DATABASE_URL in Railway."
  exit 1
fi

echo "[PRISMA] Starting Next.js application..."
exec node_modules/.bin/next start
