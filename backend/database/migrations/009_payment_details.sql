-- Payment proof for manual bKash/Nagad payments (until a gateway is integrated) and who recorded a
-- guide's cash payment. Portable: runs as-is on MySQL/MariaDB and on PostgreSQL (Supabase). Run once.

-- Online advance: the wallet number it was sent from and the TrxID from the payment SMS.
ALTER TABLE orders
  ADD COLUMN advance_payer_phone VARCHAR(20) NULL,
  ADD COLUMN advance_transaction_id VARCHAR(40) NULL;

ALTER TABLE preorders
  ADD COLUMN advance_payer_phone VARCHAR(20) NULL,
  ADD COLUMN advance_transaction_id VARCHAR(40) NULL,
  ADD COLUMN pickup_payer_phone VARCHAR(20) NULL,
  ADD COLUMN pickup_transaction_id VARCHAR(40) NULL;

ALTER TABLE guide_bookings
  ADD COLUMN advance_payment_method VARCHAR(20) NULL,
  ADD COLUMN advance_payer_phone VARCHAR(20) NULL,
  ADD COLUMN advance_transaction_id VARCHAR(40) NULL;

-- 'tourist' = reported by the tourist and awaiting the guide's confirmation;
-- 'guide' = the guide recorded the cash/wallet payment directly (confirmed at once).
ALTER TABLE guide_payments
  ADD COLUMN payer_phone VARCHAR(20) NULL,
  ADD COLUMN recorded_by VARCHAR(20) NOT NULL DEFAULT 'tourist';
