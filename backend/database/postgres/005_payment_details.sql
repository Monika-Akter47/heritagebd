-- Supabase version of migrations/009_payment_details.sql, which was only written for MySQL. Without these
-- columns the admin Payments page (GET /api/admin/payments) fails. Safe to run more than once.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS advance_payer_phone VARCHAR(20) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS advance_transaction_id VARCHAR(40) NULL;

ALTER TABLE preorders ADD COLUMN IF NOT EXISTS advance_payer_phone VARCHAR(20) NULL;
ALTER TABLE preorders ADD COLUMN IF NOT EXISTS advance_transaction_id VARCHAR(40) NULL;
ALTER TABLE preorders ADD COLUMN IF NOT EXISTS pickup_payer_phone VARCHAR(20) NULL;
ALTER TABLE preorders ADD COLUMN IF NOT EXISTS pickup_transaction_id VARCHAR(40) NULL;

ALTER TABLE guide_bookings ADD COLUMN IF NOT EXISTS advance_payment_method VARCHAR(20) NULL;
ALTER TABLE guide_bookings ADD COLUMN IF NOT EXISTS advance_payer_phone VARCHAR(20) NULL;
ALTER TABLE guide_bookings ADD COLUMN IF NOT EXISTS advance_transaction_id VARCHAR(40) NULL;

ALTER TABLE guide_payments ADD COLUMN IF NOT EXISTS payer_phone VARCHAR(20) NULL;
ALTER TABLE guide_payments ADD COLUMN IF NOT EXISTS recorded_by VARCHAR(20) NOT NULL DEFAULT 'tourist';
