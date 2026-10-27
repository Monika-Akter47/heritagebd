-- Refunds the admin sends back after a vendor cancels a paid pre-order or a guide cancels/rejects a
-- booking: the advance waits as 'refund_pending' until the admin records the refund.
ALTER TABLE preorders DROP CONSTRAINT IF EXISTS preorders_advance_status_check;
ALTER TABLE preorders ADD CONSTRAINT preorders_advance_status_check
  CHECK (advance_status IN ('held','released','refund_pending','refunded'));
ALTER TABLE preorders ADD COLUMN IF NOT EXISTS refund_method VARCHAR(20) NULL;
ALTER TABLE preorders ADD COLUMN IF NOT EXISTS refund_transaction_id VARCHAR(40) NULL;
ALTER TABLE preorders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP NULL;

ALTER TABLE guide_bookings DROP CONSTRAINT IF EXISTS guide_bookings_advance_status_check;
ALTER TABLE guide_bookings ADD CONSTRAINT guide_bookings_advance_status_check
  CHECK (advance_status IN ('held','released','refund_pending','refunded'));
ALTER TABLE guide_bookings ADD COLUMN IF NOT EXISTS refund_method VARCHAR(20) NULL;
ALTER TABLE guide_bookings ADD COLUMN IF NOT EXISTS refund_transaction_id VARCHAR(40) NULL;
ALTER TABLE guide_bookings ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP NULL;
