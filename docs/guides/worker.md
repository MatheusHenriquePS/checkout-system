# Worker

O Worker lê `checkout.orders`. Só dá **ack** depois de processar; se cair no meio, a mensagem volta.

- **Nack requeue** — erro que vale tentar de novo (ex.: gateway instável)
- **Nack sem requeue** — vai pra DLQ `checkout.orders.dlq` (payload inválido, pedido impossível)

## Subir

```bash
pnpm dev:api    # terminal 1
pnpm dev:worker # terminal 2
```

Insomnia: `POST /checkout` com `X-Idempotency-Key` e body com `items` (ver [inventory.md](inventory.md)).

```sql
SELECT id, status FROM orders ORDER BY created_at DESC LIMIT 5;
```

`PENDING` vira `PAID` em poucos segundos se tudo ok.

RabbitMQ em http://localhost:8084 — fila principal some; DLQ vazia.

## Erro PRECONDITION_FAILED na fila

Fila antiga sem DLX configurada igual ao código. Apaga `checkout.orders` e `checkout.orders.dlq` na UI, sobe API e Worker de novo.
