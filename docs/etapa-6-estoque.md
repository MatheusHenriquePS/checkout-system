# Etapa 6 — Estoque

Baixar estoque na API com duas requests ao mesmo tempo = overselling. A API só valida que o produto existe; o decremento atômico fica no Worker:

```sql
UPDATE products
SET stock_quantity = stock_quantity - :qty
WHERE id = :id AND stock_quantity >= :qty;
```

Zero linhas afetadas → `FAILED` (ou `INSUFFICIENT_STOCK_AFTER_PAYMENT` depois da etapa 7).

## Tabela `order_items`

```bash
./scripts/db/apply-order-items.sh
pnpm db:generate && pnpm build
```

SQL em `scripts/db/002_order_items.sql` se preferir DBeaver.

## Checkout

```json
{
  "customerEmail": "voce@email.com",
  "items": [
    { "productId": "<uuid do Demo Widget>", "quantity": 1 }
  ]
}
```

```sql
SELECT id, name, stock_quantity FROM products;
```

## Teste de concorrência

```sql
UPDATE products SET stock_quantity = 1 WHERE name = 'Demo Widget';
```

Dois POST com idempotency keys diferentes, qty 1. Um `PAID`, um `FAILED`, estoque 0.
