# Postgres na mão + Prisma

Primeiro o SQL no banco; depois o `schema.prisma` só espelha o que já existe. Prisma não cria as tabelas neste projeto — ele gera o client TypeScript.

## 1. Infra

```bash
docker compose up -d
./scripts/smoke-infra.sh
```

## 2. Aplicar schema

```bash
./scripts/db/apply-manual-schema.sh
```

Ou colar `scripts/db/001_initial_schema.sql` no DBeaver/psql.

## 3. Conferir

```bash
docker compose exec postgres psql -U checkout -d checkout -c '\dt'
```

Tem `orders` e `products` e uma linha Demo Widget.

## 4. Prisma client

```bash
pnpm install
pnpm db:generate
pnpm build
```

`db:studio` se quiser UI do Prisma.

## Migrações depois

- `002_order_items.sql` — itens do pedido
- `003_order_failure_reason.sql` — `failure_reason` / `failure_detail` em `FAILED`

Scripts: `apply-order-items.sh`, `apply-order-failure-reason.sh` ou `pnpm db:order-items`, etc.

## Zerar dados (local)

```sql
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "OrderFailureReason" CASCADE;
```

Roda o `001` de novo.
