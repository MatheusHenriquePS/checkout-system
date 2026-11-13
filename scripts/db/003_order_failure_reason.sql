CREATE TYPE "OrderFailureReason" AS ENUM (
  'PAYMENT_DECLINED',
  'INSUFFICIENT_STOCK_AFTER_PAYMENT'
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS failure_reason "OrderFailureReason",
  ADD COLUMN IF NOT EXISTS failure_detail TEXT;

COMMENT ON COLUMN orders.failure_reason IS 'Set by the worker when status is FAILED';
COMMENT ON COLUMN orders.failure_detail IS 'Optional context (e.g. product_id, gateway message)';
