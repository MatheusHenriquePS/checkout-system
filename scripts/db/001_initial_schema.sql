CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  customer_email TEXT NOT NULL,
  status "OrderStatus" NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);

INSERT INTO products (name, price_cents, stock_quantity)
SELECT 'Demo Widget', 1999, 100
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Demo Widget');
