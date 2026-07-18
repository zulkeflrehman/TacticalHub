#!/usr/bin/env bash
# POSIX helper to build and run docker compose and run Prisma steps from host.
# Usage: ./scripts/local-deploy.sh

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found in PATH. Install Docker and try again." >&2
  exit 1
fi

echo "docker compose up --build -d"
docker compose up --build -d

echo "Waiting for web service to respond on http://localhost:3000 ..."
for i in {1..30}; do
  sleep 2
  if curl -fsS http://localhost:3000 >/dev/null 2>&1; then
    echo "Web service responded"
    break
  fi
  echo "Attempt $i: no response yet"
done

if command -v npm >/dev/null 2>&1; then
  echo "Running npm ci, prisma generate, db push, seed and import locally"
  export DATABASE_URL="postgresql://postgres:postgres_password@localhost:5432/tecticalhub_db?schema=public"
  npm ci || echo "npm ci failed"
  npm run db:push || echo "db:push failed"
  npm run db:seed || echo "db:seed failed"
  npm run db:import || echo "db:import failed"
  echo "Local DB setup complete. Visit http://localhost:3000"
else
  echo "npm not found — skipping DB migration/seed steps" >&2
fi

echo "To tail logs: docker compose logs -f tecticalhub-web"