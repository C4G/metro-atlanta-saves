#!/usr/bin/env bash

set -euo pipefail

compose_file="./docker-compose.dev.yaml"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example."
fi

echo "Installing dependencies..."
pnpm install

echo "Starting PostgreSQL..."
docker compose -f "$compose_file" up -d

echo "Waiting for PostgreSQL to accept connections..."
database_ready=false
for _ in {1..30}; do
  if docker compose -f "$compose_file" exec -T metro-db \
    sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; then
    database_ready=true
    break
  fi
  sleep 1
done

if [[ "$database_ready" != true ]]; then
  echo "PostgreSQL did not become ready within 30 seconds." >&2
  exit 1
fi

echo "Generating the Prisma client..."
pnpm exec nx run backend:prisma-generate

echo "Applying database migrations..."
pnpm exec nx run backend:prisma-migrate

echo "Loading seed data..."
pnpm exec nx run backend:prisma-seed

echo "Starting the frontend and backend development servers..."
exec pnpm exec nx serve frontend
