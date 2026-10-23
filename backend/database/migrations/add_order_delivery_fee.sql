ALTER TABLE orders
  ADD COLUMN delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER total_amount;
