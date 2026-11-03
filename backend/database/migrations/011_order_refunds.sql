-- MySQL: a marketplace order cancelled by the vendor (or an admin) waits as 'refund_pending' until the
-- admin records sending the advance back, like pre-orders and guide bookings (010_admin_refunds.sql).
ALTER TABLE orders
  MODIFY advance_status ENUM('held','released','refund_pending','refunded') NOT NULL DEFAULT 'held',
  ADD COLUMN refund_method VARCHAR(20) NULL,
  ADD COLUMN refund_transaction_id VARCHAR(40) NULL,
  ADD COLUMN refunded_at DATETIME NULL;
