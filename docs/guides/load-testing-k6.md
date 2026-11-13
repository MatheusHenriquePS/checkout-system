# k6

O script `scripts/k6/checkout.js` martela o `POST /checkout`. Ele **não** espera `PAID`: isso é trabalho do Worker. Depois do teste, olhe `orders` e a fila no RabbitMQ.

## Instalar

```bash
brew install k6
```

## Antes de rodar

Docker, `pnpm dev:api` e `pnpm dev:worker` ligados.  
Não deixe `PAYMENT_FAIL_RATE=1` no `.env` (sobra do lab do circuit breaker).

Bota estoque para não virar tudo `FAILED` no Worker:

```sql
UPDATE products SET stock_quantity = 500 WHERE name = 'Demo Widget';
```

## Rodar

Smoke (3 usuários virtuais, 15 segundos):

```bash
K6_SMOKE=1 pnpm k6:checkout
```

Rampa até 15 VUs (~1 minuto):

```bash
pnpm k6:checkout
```

`PRODUCT_ID` e `BASE_URL` vêm do script; dá para sobrescrever no terminal se precisar.

## Lendo o resultado

No fim o k6 imprime um sumário. Olho principalmente:

- **checks** — o script exige 202 e `orderId`; quero perto de 100%
- **http_req_failed** — erros HTTP; quero perto de 0%
- **http_req_duration p(95)** — latência que a maioria sente na API

`thresholds` com ✓ = passou no critério que defini no `options` do script.

## Muitos PENDING depois do teste?

Normal se você ligou forte na API e o Worker vai com `prefetch=1`.

O k6 para em ~1 min; o Worker pode levar **muito mais** para drenar fila. API boa no k6 + monte de `PENDING` no Postgres = ingresso rápido e processamento atrás — é o desenho, não falha do teste.

Conferir:

```sql
SELECT status, COUNT(*)
FROM orders
WHERE customer_email LIKE 'k6-%@load.test'
GROUP BY status;
```

Se aparecer **503** no k6, Worker provavelmente estava off ou a fila não aguentou publish.
