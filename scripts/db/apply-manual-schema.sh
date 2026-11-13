#!/usr/bin/env bash
# Aplica scripts/db/001_initial_schema.sql no Postgres do compose.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Falta .env — cp .env.example .env"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

echo "==> Aplicando schema manual em checkout (user ${POSTGRES_USER})..."
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  < "${ROOT}/scripts/db/001_initial_schema.sql"

echo ""
echo "==> Tabelas:"
docker compose exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c '\dt'

echo ""
echo "OK. Próximo: pnpm --filter @checkout/database db:generate && pnpm build"
