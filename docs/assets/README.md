# Screenshots

For README, LinkedIn, and demos. Not used at build time.

| File | Shows |
|------|--------|
| `checkout-202-insomnia.png` | POST /checkout → 202 + PENDING |
| `dbeaver-k6-orders-by-status.png` | PAID / PENDING / FAILED (k6 load test orders) |
| `k6-smoke-total-results.png` | Smoke run (`K6_SMOKE=1`): 3 VUs, 15s |
| `k6-load-total-results.png` | Ramp run: up to 15 VUs, ~9.5k requests, p95 ~23 ms |
| `rabbitmq-queues.png` | `checkout.orders` + DLQ in the management UI |
