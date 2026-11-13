-- Etapa 7 — motivo estruturado quando status = FAILED
-- Rode: ./scripts/db/apply-order-failure-reason.sh (ou cole no DBeaver)

CREATE TYPE "OrderFailureReason" AS ENUM (
  'PAYMENT_DECLINED',
  'INSUFFICIENT_STOCK_AFTER_PAYMENT'
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS failure_reason "OrderFailureReason",
  ADD COLUMN IF NOT EXISTS failure_detail TEXT;

COMMENT ON COLUMN orders.failure_reason IS 'Preenchido pelo Worker quando status = FAILED';
COMMENT ON COLUMN orders.failure_detail IS 'Contexto opcional (ex.: product_id, gateway reason)';
