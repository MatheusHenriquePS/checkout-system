#!/usr/bin/env bash
# Smoke test da infraestrutura (Etapa 1).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Falta .env — rode: cp .env.example .env"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

echo "==> Aguardando containers healthy (até ~90s)..."
deadline=$((SECONDS + 90))
while true; do
  unhealthy="$(docker compose ps --format '{{.Service}} {{.Health}}' | awk '$2 != "healthy" {print $1 ":" $2}')"
  if [[ -z "$unhealthy" ]]; then
    break
  fi
  if (( SECONDS >= deadline )); then
    echo "Timeout esperando healthchecks:"
    echo "$unhealthy"
    docker compose ps
    exit 1
  fi
  sleep 2
done

echo ""
echo "==> Status dos containers"
docker compose ps

echo ""
echo "==> Postgres (porta ${POSTGRES_HOST_PORT})"
docker compose exec -T postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

echo ""
echo "==> Redis (porta ${REDIS_HOST_PORT})"
docker compose exec -T redis redis-cli ping

echo ""
echo "==> RabbitMQ"
docker compose exec -T rabbitmq rabbitmq-diagnostics -q ping

echo ""
echo "OK — infra saudável."
echo "  Postgres:  localhost:${POSTGRES_HOST_PORT}"
echo "  Redis:     localhost:${REDIS_HOST_PORT}"
echo "  API (Etapa 2+): http://localhost:${API_HOST_PORT:-8080}"
echo "  RabbitMQ:  amqp://localhost:${RABBITMQ_HOST_PORT}  |  UI http://localhost:${RABBITMQ_MANAGEMENT_HOST_PORT}"
