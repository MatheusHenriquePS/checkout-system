# Etapa 3 — Idempotência

Cliente manda `X-Idempotency-Key` (um UUID por tentativa de compra). Mesma key de novo → mesma resposta, sem segundo pedido.

Redis guarda estado por ~24h (`IDEMPOTENCY_TTL_SECONDS`). Lock curto enquanto processa (`IDEMPOTENCY_LOCK_SECONDS`).

Fluxo resumido:

1. Se já tem resultado cacheado → devolve de novo (mesmo `orderId`)
2. Tenta lock; se outra request está processando → 409 ou replay conforme caso
3. Handler grava pedido e fila
4. Sucesso → marca completo no Redis
5. Erro 5xx → limpa chave para permitir retry com a mesma key

Código: `apps/api/src/plugins/idempotency.ts` e rota em `routes/checkout.ts`.

## Teste

```bash
KEY="minha-chave-$(uuidgen)"
curl -s -X POST http://localhost:8080/checkout \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $KEY" \
  -d '{"customerEmail":"voce@email.com","items":[{"productId":"<uuid>","quantity":1}]}'
```

Roda duas vezes. O `orderId` tem que ser igual.
