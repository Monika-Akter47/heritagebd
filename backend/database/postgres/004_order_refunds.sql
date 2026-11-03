-- A marketplace order cancelled by the vendor (or an admin) waits as 'refund_pending' until the admin
-- records sending the advance back, like pre-orders and guide bookings (003_admin_refunds.sql).
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_advance_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_advance_status_check
  CHECK (advance_status IN ('held','released','refund_pending','refunded'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_method VARCHAR(20) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_transaction_id VARCHAR(40) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP NULL;
