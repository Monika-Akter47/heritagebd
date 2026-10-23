ALTER TABLE vendors
  ADD COLUMN business_type VARCHAR(100) NULL,
  ADD COLUMN business_address TEXT NULL,
  ADD COLUMN product_categories JSON NULL,
  ADD COLUMN pickup_location VARCHAR(500) NULL;
