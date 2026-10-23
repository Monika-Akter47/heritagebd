CREATE TABLE commission_settings (
  flow ENUM('order','preorder','guide_booking') NOT NULL PRIMARY KEY,
  advance_percent DECIMAL(5,2) NOT NULL,
  commission_percent DECIMAL(5,2) NOT NULL
) ENGINE=InnoDB;

INSERT INTO commission_settings (flow, advance_percent, commission_percent) VALUES
  ('order', 20, 10), ('preorder', 30, 10), ('guide_booking', 20, 10);

ALTER TABLE orders
  ADD COLUMN advance_percent DECIMAL(5,2) NOT NULL DEFAULT 20,
  ADD COLUMN commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10,
  ADD COLUMN advance_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN cod_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN advance_status ENUM('held','released','refunded') NOT NULL DEFAULT 'held';

ALTER TABLE preorders
  MODIFY COLUMN advance_percent DECIMAL(5,2) NOT NULL DEFAULT 30,
  ADD COLUMN commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10,
  ADD COLUMN advance_status ENUM('held','released','refunded') NOT NULL DEFAULT 'held';

ALTER TABLE guide_bookings
  MODIFY COLUMN status ENUM('pending','accepted','rejected','awaiting_confirmation','completed','cancelled') NOT NULL DEFAULT 'pending',
  ADD COLUMN advance_percent DECIMAL(5,2) NOT NULL DEFAULT 20,
  ADD COLUMN commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10,
  ADD COLUMN advance_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN balance_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN advance_status ENUM('held','released','refunded') NOT NULL DEFAULT 'held';

CREATE TABLE settlements (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  flow ENUM('order','preorder','guide_booking') NOT NULL,
  source_id VARCHAR(40) NOT NULL,
  partner_id VARCHAR(40) NOT NULL,
  partner_role ENUM('vendor','guide') NOT NULL,
  gross_amount DECIMAL(10,2) NOT NULL,
  advance_amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  partner_released DECIMAL(10,2) NOT NULL,
  partner_cash DECIMAL(10,2) NOT NULL,
  partner_total DECIMAL(10,2) NOT NULL,
  settled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_settlement (flow, source_id, partner_id),
  INDEX idx_settlement_partner (partner_id),
  INDEX idx_settlement_settled_at (settled_at)
) ENGINE=InnoDB;

UPDATE orders
SET advance_amount = ROUND(total_amount * advance_percent / 100, 2),
    cod_amount = total_amount - ROUND(total_amount * advance_percent / 100, 2);

UPDATE preorders
SET advance_paid = ROUND(total_amount * advance_percent / 100, 2),
    remaining_amount = total_amount - ROUND(total_amount * advance_percent / 100, 2);

UPDATE guide_bookings
SET advance_amount = ROUND(total_price * advance_percent / 100, 2),
    balance_amount = total_price - ROUND(total_price * advance_percent / 100, 2);

INSERT INTO settlements
  (flow, source_id, partner_id, partner_role, gross_amount, advance_amount, commission_amount,
   partner_released, partner_cash, partner_total, settled_at)
SELECT 'preorder', po.id, po.vendor_id, 'vendor', po.total_amount, po.advance_paid,
       ROUND(po.total_amount * po.commission_percent / 100, 2),
       po.advance_paid - ROUND(po.total_amount * po.commission_percent / 100, 2),
       po.total_amount - po.advance_paid,
       po.total_amount - ROUND(po.total_amount * po.commission_percent / 100, 2),
       po.updated_at
FROM preorders po
WHERE po.status = 'completed' AND po.advance_status = 'held';

UPDATE preorders SET advance_status = 'released' WHERE status = 'completed' AND advance_status = 'held';

INSERT INTO settlements
  (flow, source_id, partner_id, partner_role, gross_amount, advance_amount, commission_amount,
   partner_released, partner_cash, partner_total, settled_at)
SELECT 'guide_booking', gb.id, gb.guide_id, 'guide', gb.total_price, gb.advance_amount,
       ROUND(gb.total_price * gb.commission_percent / 100, 2),
       gb.advance_amount - ROUND(gb.total_price * gb.commission_percent / 100, 2),
       gb.balance_amount,
       gb.total_price - ROUND(gb.total_price * gb.commission_percent / 100, 2),
       gb.created_at -- guide_bookings has no updated_at
FROM guide_bookings gb
WHERE gb.status = 'completed' AND gb.advance_status = 'held';

UPDATE guide_bookings
SET advance_status = CASE
  WHEN status = 'completed' THEN 'released'
  WHEN status IN ('cancelled','rejected') THEN 'refunded'
  ELSE advance_status
END
WHERE advance_status = 'held' AND status IN ('completed','cancelled','rejected');

UPDATE orders SET advance_status = 'refunded'
WHERE advance_status = 'held' AND status = 'cancelled';

UPDATE preorders SET advance_status = 'refunded'
WHERE advance_status = 'held' AND status IN ('cancelled','refunded');
