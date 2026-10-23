ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'placed',
    'confirmed',
    'preparing',
    'shipped',
    'out_for_delivery',
    'delivered',
    'completed',
    'cancelled'
  ) NOT NULL DEFAULT 'placed';

-- Before tourist confirmation was added, delivered orders were already settled.
UPDATE orders
SET status = 'completed'
WHERE status = 'delivered' AND advance_status = 'released';
