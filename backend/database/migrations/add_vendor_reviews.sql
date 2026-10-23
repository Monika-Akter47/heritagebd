ALTER TABLE reviews
  MODIFY COLUMN target_type ENUM('place','product','guide','vendor') NOT NULL;

ALTER TABLE vendors
  ADD COLUMN review_count INT NOT NULL DEFAULT 0 AFTER rating;
