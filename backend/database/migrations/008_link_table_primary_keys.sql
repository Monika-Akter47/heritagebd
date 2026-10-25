-- Give the 12 link tables (tags, areas, destinations…) a surrogate primary key, as the rest of
-- the schema has. The code always inserts with explicit column lists, so nothing else changes.
-- Matches schema.sql; Supabase got the same change plus foreign-key indexes (InnoDB already
-- indexes foreign keys, so MySQL needs only the keys). Run once.
ALTER TABLE guide_languages            ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE guide_specializations      ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE guide_certifications       ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE guide_cover_areas          ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE place_tags                 ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE place_nearby               ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE product_tags               ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE product_near_destinations  ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE guide_booking_destinations ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE event_tags                 ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE story_tags                 ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE trip_destinations          ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
