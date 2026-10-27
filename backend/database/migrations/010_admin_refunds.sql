-- MySQL: advances wait as 'refund_pending' until the admin records the refund (vendor/guide cancellations).
ALTER TABLE preorders
  MODIFY advance_status ENUM('held','released','refund_pending','refunded') NOT NULL DEFAULT 'held',
  ADD COLUMN refund_method VARCHAR(20) NULL,
  ADD COLUMN refund_transaction_id VARCHAR(40) NULL,
  ADD COLUMN refunded_at DATETIME NULL;
ALTER TABLE guide_bookings
  MODIFY advance_status ENUM('held','released','refund_pending','refunded') NOT NULL DEFAULT 'held',
  ADD COLUMN refund_method VARCHAR(20) NULL,
  ADD COLUMN refund_transaction_id VARCHAR(40) NULL,
  ADD COLUMN refunded_at DATETIME NULL;
