# Pagamento simulado

No Worker: cobrança fake → se ok, estoque atômico → `PAID` ou `FAILED`.

Falha **transitória** no gateway: retry com backoff dentro da mensagem; se esgotar, `nack` com requeue e o pedido fica `PENDING`.

Pagamento vai **antes** do estoque para não reservar unidade enquanto o PSP cai e volta.

## Env úteis (ver `.env.example`)

`PAYMENT_FAIL_RATE` (0–1) — sorteio de “gateway fora”. `0.15` é o dia a dia; `1` só para ver circuit breaker requeue no terminal.

Também: latência fake, timeout, `PAYMENT_MAX_ATTEMPTS`, backoff, `CIRCUIT_BREAKER_*`.

**Reinicia o Worker** depois de mudar qualquer `PAYMENT_*`.

Tem ainda ~5% fixo no código de `card_declined` (recusa definitiva → `FAILED`, sem requeue infinito).

## Ver o circuit breaker

Só no log do Worker. DBeaver não mostra estado do breaker.

Lab rápido:

```env
PAYMENT_FAIL_RATE=1
CIRCUIT_BREAKER_FAILURE_THRESHOLD=3
CIRCUIT_BREAKER_COOLDOWN_MS=15000
```

Reinicia Worker, manda 2–3 checkouts com keys diferentes. Deve aparecer `circuit breaker opened` e `transient failure — requeue`. Volta o fail rate para `0.15` quando cansar.

## Onde está o código

`apps/worker/src/payment/` — `fake-gateway.ts`, `circuit-breaker.ts`, `resilient-payment-client.ts`, e o `process-checkout.ts` orquestra tudo.

## Checar

```sql
SELECT id, status, failure_reason, failure_detail
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

`GET /orders/:id` na API devolve o mesmo motivo quando `FAILED`.
