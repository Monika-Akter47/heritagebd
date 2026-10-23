ALTER TABLE trip_plans
  ADD COLUMN guide_response ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending'
  AFTER status;
