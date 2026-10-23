CREATE TABLE guide_payments (
  id VARCHAR(40) NOT NULL PRIMARY KEY,
  booking_id VARCHAR(40) NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('cash','bkash','nagad') NOT NULL,
  reference VARCHAR(120) NULL,
  status ENUM('reported','confirmed') NOT NULL DEFAULT 'reported',
  reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME NULL,
  FOREIGN KEY (booking_id) REFERENCES guide_bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;
