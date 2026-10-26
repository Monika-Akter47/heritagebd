-- ============================================================================
-- HeritageBD - Full Database Schema
-- MySQL 8.0+ / MariaDB 10.4+
-- Charset: utf8mb4 (supports Bangla text)
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS heritagebd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE heritagebd;

DROP TABLE IF EXISTS commission_settings;
CREATE TABLE commission_settings (
  flow ENUM('order','preorder','guide_booking') NOT NULL PRIMARY KEY,
  advance_percent DECIMAL(5,2) NOT NULL,
  commission_percent DECIMAL(5,2) NOT NULL
) ENGINE=InnoDB;

INSERT INTO commission_settings (flow, advance_percent, commission_percent) VALUES
  ('order', 20, 10), ('preorder', 30, 10), ('guide_booking', 20, 10);

DROP TABLE IF EXISTS settlements;
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

-- ----------------------------------------------------------------------------
-- USERS & ROLES
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id            VARCHAR(40)  NOT NULL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(30)  NULL,
  avatar        VARCHAR(500) NULL,
  role          ENUM('tourist','vendor','guide','admin') NOT NULL DEFAULT 'tourist',
  verified      TINYINT(1)   NOT NULL DEFAULT 0,
  status        ENUM('active','pending','suspended') NOT NULL DEFAULT 'active',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

DROP TABLE IF EXISTS auth_tokens;
CREATE TABLE auth_tokens (
  token       VARCHAR(128) NOT NULL PRIMARY KEY, -- SHA-256 hex of the bearer token, never the raw token
  user_id     VARCHAR(40)  NOT NULL,
  user_agent  VARCHAR(255) NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_tokens_expires (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS auth_attempts;
CREATE TABLE auth_attempts (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  action      VARCHAR(30)  NOT NULL,
  identifier  VARCHAR(190) NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_attempts_lookup (action, identifier, created_at),
  INDEX idx_auth_attempts_created (created_at)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS password_resets;
CREATE TABLE password_resets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(190) NOT NULL,
  otp_code    VARCHAR(255) NOT NULL,
  expires_at  DATETIME     NOT NULL,
  used        TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

DROP TABLE IF EXISTS user_documents;
CREATE TABLE user_documents (
  id            VARCHAR(40) NOT NULL PRIMARY KEY,
  user_id       VARCHAR(40) NOT NULL,
  document_type ENUM('identity','business_license','guide_license','other') NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  storage_name  VARCHAR(80) NOT NULL UNIQUE,
  mime_type     VARCHAR(100) NOT NULL,
  file_size     INT UNSIGNED NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_documents_user_created (user_id, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tourist-specific data
DROP TABLE IF EXISTS tourist_saved_places;
CREATE TABLE tourist_saved_places (
  user_id  VARCHAR(40) NOT NULL,
  place_id VARCHAR(40) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, place_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Vendor profile
DROP TABLE IF EXISTS vendors;
CREATE TABLE vendors (
  user_id          VARCHAR(40)  NOT NULL PRIMARY KEY,
  shop_name        VARCHAR(200) NOT NULL,
  shop_description TEXT         NULL,
  shop_image       VARCHAR(500) NULL,
  shop_cover_image VARCHAR(500) NULL,
  location         VARCHAR(200) NULL,
  business_type    VARCHAR(100) NULL,
  business_address TEXT         NULL,
  product_categories JSON       NULL,
  pickup_location  VARCHAR(500) NULL,
  rating           DECIMAL(2,1) NOT NULL DEFAULT 0,
  review_count     INT          NOT NULL DEFAULT 0,
  total_sales      INT          NOT NULL DEFAULT 0,
  nid_number       VARCHAR(50)  NULL,
  trade_license    VARCHAR(100) NULL,
  verification_status ENUM('unverified','pending','verified','rejected') NOT NULL DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tour guide profile
DROP TABLE IF EXISTS guides;
CREATE TABLE guides (
  user_id             VARCHAR(40)  NOT NULL PRIMARY KEY,
  bio                 TEXT         NULL,
  location            VARCHAR(200) NULL,
  lat                 DECIMAL(10,7) NULL,
  lng                 DECIMAL(10,7) NULL,
  price_per_day       DECIMAL(10,2) NOT NULL DEFAULT 0,
  rating              DECIMAL(2,1) NOT NULL DEFAULT 0,
  review_count        INT          NOT NULL DEFAULT 0,
  tours_completed     INT          NOT NULL DEFAULT 0,
  years_experience    INT          NOT NULL DEFAULT 0,
  is_available        TINYINT(1)   NOT NULL DEFAULT 1,
  is_location_sharing TINYINT(1)   NOT NULL DEFAULT 0,
  phone_public        TINYINT(1)   NOT NULL DEFAULT 0,
  profile_image       VARCHAR(500) NULL,
  nid_number          VARCHAR(50)  NULL,
  guide_license        VARCHAR(100) NULL,
  verification_status ENUM('unverified','pending','verified','rejected') NOT NULL DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS guide_languages;
CREATE TABLE guide_languages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guide_id VARCHAR(40) NOT NULL,
  language VARCHAR(60) NOT NULL,
  FOREIGN KEY (guide_id) REFERENCES guides(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS guide_specializations;
CREATE TABLE guide_specializations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guide_id VARCHAR(40) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  FOREIGN KEY (guide_id) REFERENCES guides(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS guide_certifications;
CREATE TABLE guide_certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guide_id VARCHAR(40) NOT NULL,
  certification VARCHAR(150) NOT NULL,
  FOREIGN KEY (guide_id) REFERENCES guides(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS guide_cover_areas;
CREATE TABLE guide_cover_areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guide_id VARCHAR(40) NOT NULL,
  area VARCHAR(100) NOT NULL,
  FOREIGN KEY (guide_id) REFERENCES guides(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS guide_tour_types;
CREATE TABLE guide_tour_types (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  guide_id    VARCHAR(40)  NOT NULL,
  name        VARCHAR(150) NOT NULL,
  duration    VARCHAR(60)  NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  description TEXT NULL,
  FOREIGN KEY (guide_id) REFERENCES guides(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Admin profile
DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
  user_id     VARCHAR(40) NOT NULL PRIMARY KEY,
  permissions JSON NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- HERITAGE PLACES
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS heritage_places;
CREATE TABLE heritage_places (
  id                   VARCHAR(40)  NOT NULL PRIMARY KEY,
  name                 VARCHAR(200) NOT NULL,
  name_local           VARCHAR(200) NULL,
  description          TEXT NOT NULL,
  historical_background TEXT NULL,
  significance         TEXT NULL,
  location             VARCHAR(200) NOT NULL,
  district             VARCHAR(100) NOT NULL,
  division              VARCHAR(100) NOT NULL,
  lat                  DECIMAL(10,7) NOT NULL,
  lng                  DECIMAL(10,7) NOT NULL,
  category             ENUM('mosque','fort','palace','temple','monument','archaeological','natural','museum') NOT NULL,
  rating               DECIMAL(2,1) NOT NULL DEFAULT 0,
  review_count         INT NOT NULL DEFAULT 0,
  open_time            VARCHAR(30) NULL,
  close_time           VARCHAR(30) NULL,
  entry_fee            VARCHAR(150) NULL,
  best_time            VARCHAR(100) NULL,
  featured             TINYINT(1) NOT NULL DEFAULT 0,
  established          VARCHAR(60) NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FULLTEXT KEY ft_place_search (name, description, location, district)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS place_images;
CREATE TABLE place_images (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  place_id VARCHAR(40) NOT NULL,
  url      VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (place_id) REFERENCES heritage_places(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS place_tags;
CREATE TABLE place_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  place_id VARCHAR(40) NOT NULL,
  tag      VARCHAR(60) NOT NULL,
  FOREIGN KEY (place_id) REFERENCES heritage_places(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS place_nearby;
CREATE TABLE place_nearby (
  id INT AUTO_INCREMENT PRIMARY KEY,
  place_id      VARCHAR(40) NOT NULL,
  nearby_name   VARCHAR(200) NOT NULL,
  FOREIGN KEY (place_id) REFERENCES heritage_places(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- MARKETPLACE: PRODUCTS, CART, ORDERS
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id             VARCHAR(40)  NOT NULL PRIMARY KEY,
  vendor_id      VARCHAR(40)  NOT NULL,
  name           VARCHAR(200) NOT NULL,
  description    TEXT NULL,
  price          DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NULL,
  category       ENUM('gi-product','handicraft','clothing','food','jewelry','pottery','other') NOT NULL,
  rating         DECIMAL(2,1) NOT NULL DEFAULT 0,
  review_count   INT NOT NULL DEFAULT 0,
  stock          INT NOT NULL DEFAULT 0,
  featured       TINYINT(1) NOT NULL DEFAULT 0,
  district       VARCHAR(100) NULL,
  -- pre-order ("ready when you arrive") fields
  preorder_enabled     TINYINT(1) NOT NULL DEFAULT 0,
  preparation_time     VARCHAR(60) NULL,
  pickup_location       VARCHAR(200) NULL,
  pickup_lat            DECIMAL(10,7) NULL,
  pickup_lng            DECIMAL(10,7) NULL,
  max_advance_days      INT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(user_id) ON DELETE CASCADE,
  FULLTEXT KEY ft_product_search (name, description)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS product_images;
CREATE TABLE product_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(40) NOT NULL,
  url        VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS product_tags;
CREATE TABLE product_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(40) NOT NULL,
  tag        VARCHAR(60) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS product_specifications;
CREATE TABLE product_specifications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  product_id   VARCHAR(40) NOT NULL,
  spec_key     VARCHAR(100) NOT NULL,
  spec_value   VARCHAR(255) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS product_time_slots;
CREATE TABLE product_time_slots (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(40) NOT NULL,
  slot_label VARCHAR(30) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS product_near_destinations;
CREATE TABLE product_near_destinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(40) NOT NULL,
  place_id   VARCHAR(40) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES heritage_places(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS cart_items;
CREATE TABLE cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    VARCHAR(40) NOT NULL,
  product_id VARCHAR(40) NOT NULL,
  quantity   INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_product (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id                 VARCHAR(40) NOT NULL PRIMARY KEY,
  user_id            VARCHAR(40) NOT NULL,
  status             ENUM('placed','confirmed','preparing','shipped','out_for_delivery','delivered','completed','cancelled') NOT NULL DEFAULT 'placed',
  total_amount       DECIMAL(10,2) NOT NULL,
  advance_percent    DECIMAL(5,2) NOT NULL DEFAULT 20,
  commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10,
  advance_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
  cod_amount         DECIMAL(10,2) NOT NULL DEFAULT 0,
  advance_status     ENUM('held','released','refunded') NOT NULL DEFAULT 'held',
  delivery_fee       DECIMAL(10,2) NOT NULL DEFAULT 0,
  ship_name          VARCHAR(150) NOT NULL,
  ship_phone         VARCHAR(30)  NOT NULL,
  ship_address       VARCHAR(255) NOT NULL,
  ship_city          VARCHAR(100) NOT NULL,
  ship_district      VARCHAR(100) NOT NULL,
  ship_division      VARCHAR(100) NOT NULL,
  ship_postal_code   VARCHAR(20)  NULL,
  payment_method     ENUM('bkash','nagad','card','cod') NOT NULL,
  tracking_number    VARCHAR(60) NULL,
  estimated_delivery DATE NULL,
  advance_payer_phone VARCHAR(20) NULL,
  advance_transaction_id VARCHAR(40) NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   VARCHAR(40) NOT NULL,
  product_id VARCHAR(40) NOT NULL,
  quantity   INT NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- PRE-ORDER ("READY WHEN YOU ARRIVE")
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS preorder_settings;
CREATE TABLE preorder_settings (
  id                              INT PRIMARY KEY DEFAULT 1,
  advance_percent                 INT NOT NULL DEFAULT 30,
  payment_methods                 JSON NULL,
  cancellation_window_hours       INT NOT NULL DEFAULT 2,
  advance_refund_percent          INT NOT NULL DEFAULT 80,
  vendor_preparation_cutoff_minutes INT NOT NULL DEFAULT 30,
  max_pickup_time_slots           INT NOT NULL DEFAULT 6,
  allow_cash_at_pickup            TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

DROP TABLE IF EXISTS preorders;
CREATE TABLE preorders (
  id                    VARCHAR(40) NOT NULL PRIMARY KEY,
  order_number          VARCHAR(40) NOT NULL UNIQUE,
  tourist_id            VARCHAR(40) NOT NULL,
  vendor_id             VARCHAR(40) NOT NULL,
  product_id            VARCHAR(40) NOT NULL,
  destination_id        VARCHAR(40) NULL,
  pickup_location       VARCHAR(200) NOT NULL,
  pickup_date           DATE NOT NULL,
  pickup_time           VARCHAR(30) NOT NULL,
  quantity              INT NOT NULL DEFAULT 1,
  unit_price            DECIMAL(10,2) NOT NULL,
  total_amount          DECIMAL(10,2) NOT NULL,
  advance_percent       DECIMAL(5,2) NOT NULL DEFAULT 30,
  advance_paid          DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_percent    DECIMAL(5,2) NOT NULL DEFAULT 10,
  advance_status         ENUM('held','released','refunded') NOT NULL DEFAULT 'held',
  remaining_amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  advance_payment_method ENUM('bkash','nagad','card') NULL,
  pickup_payment_method  ENUM('bkash','nagad','card','cash') NULL,
  status                ENUM('confirmed','advance_paid','vendor_accepted','preparing','ready_for_pickup','arrived','qr_verified','pickup_payment_pending','picked_up','completed','cancelled','refunded') NOT NULL DEFAULT 'confirmed',
  qr_code               VARCHAR(255) NOT NULL,
  preparation_time      VARCHAR(60) NULL,
  notes                 TEXT NULL,
  cancellation_reason   VARCHAR(255) NULL,
  refund_amount         DECIMAL(10,2) NULL,
  advance_payer_phone   VARCHAR(20) NULL,
  advance_transaction_id VARCHAR(40) NULL,
  pickup_payer_phone    VARCHAR(20) NULL,
  pickup_transaction_id VARCHAR(40) NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(user_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES heritage_places(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- GUIDE BOOKINGS
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS guide_payments;
DROP TABLE IF EXISTS guide_bookings;
CREATE TABLE guide_bookings (
  id           VARCHAR(40) NOT NULL PRIMARY KEY,
  guide_id     VARCHAR(40) NOT NULL,
  tourist_id   VARCHAR(40) NOT NULL,
  tour_type    VARCHAR(150) NOT NULL,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  status       ENUM('pending','accepted','rejected','awaiting_confirmation','completed','cancelled') NOT NULL DEFAULT 'pending',
  message      TEXT NULL,
  total_price  DECIMAL(10,2) NOT NULL,
  advance_percent DECIMAL(5,2) NOT NULL DEFAULT 20,
  commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10,
  advance_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  advance_status ENUM('held','released','refunded') NOT NULL DEFAULT 'held',
  group_size   INT NOT NULL DEFAULT 1,
  advance_payment_method VARCHAR(20) NULL,
  advance_payer_phone VARCHAR(20) NULL,
  advance_transaction_id VARCHAR(40) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guide_id) REFERENCES guides(user_id) ON DELETE CASCADE,
  FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS guide_booking_destinations;
CREATE TABLE guide_booking_destinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id VARCHAR(40) NOT NULL,
  place_name VARCHAR(200) NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES guide_bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE guide_payments (
  id VARCHAR(40) NOT NULL PRIMARY KEY,
  booking_id VARCHAR(40) NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('cash','bkash','nagad') NOT NULL,
  reference VARCHAR(120) NULL,
  status ENUM('reported','confirmed') NOT NULL DEFAULT 'reported',
  reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME NULL,
  payer_phone VARCHAR(20) NULL,
  recorded_by VARCHAR(20) NOT NULL DEFAULT 'tourist',
  FOREIGN KEY (booking_id) REFERENCES guide_bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS events;
CREATE TABLE events (
  id           VARCHAR(40) NOT NULL PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  description  TEXT NULL,
  category     ENUM('cultural','food','market','heritage','festival','religious') NOT NULL,
  location     VARCHAR(200) NOT NULL,
  district     VARCHAR(100) NOT NULL,
  lat          DECIMAL(10,7) NULL,
  lng          DECIMAL(10,7) NULL,
  start_date   DATETIME NOT NULL,
  end_date     DATETIME NOT NULL,
  image        VARCHAR(500) NOT NULL,
  featured     TINYINT(1) NOT NULL DEFAULT 0,
  is_free      TINYINT(1) NOT NULL DEFAULT 1,
  ticket_price DECIMAL(10,2) NULL,
  organizer    VARCHAR(200) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

DROP TABLE IF EXISTS event_images;
CREATE TABLE event_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(40) NOT NULL,
  url VARCHAR(500) NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS event_tags;
CREATE TABLE event_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(40) NOT NULL,
  tag      VARCHAR(60) NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- STORIES (BLOG)
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS stories;
CREATE TABLE stories (
  id           VARCHAR(40) NOT NULL PRIMARY KEY,
  title        VARCHAR(250) NOT NULL,
  excerpt      VARCHAR(500) NULL,
  content      LONGTEXT NOT NULL,
  author_name  VARCHAR(150) NOT NULL,
  author_avatar VARCHAR(500) NULL,
  author_bio   VARCHAR(500) NULL,
  category     ENUM('heritage','food','culture','travel','festival','artisan') NOT NULL,
  image        VARCHAR(500) NOT NULL,
  read_time    VARCHAR(30) NULL,
  featured     TINYINT(1) NOT NULL DEFAULT 0,
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FULLTEXT KEY ft_story_search (title, excerpt, content)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS story_tags;
CREATE TABLE story_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id VARCHAR(40) NOT NULL,
  tag      VARCHAR(60) NOT NULL,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- PUBLIC SITE CONTENT
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS site_settings;
CREATE TABLE site_settings (
  setting_key   VARCHAR(100) NOT NULL PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- REVIEWS (polymorphic: place / product / guide / vendor)
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
  id          VARCHAR(40) NOT NULL PRIMARY KEY,
  user_id     VARCHAR(40) NOT NULL,
  target_id   VARCHAR(40) NOT NULL,
  target_type ENUM('place','product','guide','vendor') NOT NULL,
  rating      TINYINT NOT NULL,
  title       VARCHAR(150) NULL,
  content     TEXT NOT NULL,
  helpful     INT NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_target (target_type, target_id),
  UNIQUE KEY uniq_user_target_review (user_id, target_type, target_id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS review_photos;
CREATE TABLE review_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_id VARCHAR(40) NOT NULL,
  url VARCHAR(500) NOT NULL,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- TRIP PLANNER
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS trip_plans;
CREATE TABLE trip_plans (
  id          VARCHAR(40) NOT NULL PRIMARY KEY,
  user_id     VARCHAR(40) NOT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  start_time  TIME NULL,
  end_time    TIME NULL,
  status      ENUM('draft','planned','ongoing','completed') NOT NULL DEFAULT 'draft',
  guide_response ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  guide_id    VARCHAR(40) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (guide_id) REFERENCES guides(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

DROP TABLE IF EXISTS trip_destinations;
CREATE TABLE trip_destinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id     VARCHAR(40) NOT NULL,
  destination VARCHAR(200) NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trip_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS trip_days;
CREATE TABLE trip_days (
  id      VARCHAR(40) NOT NULL PRIMARY KEY,
  trip_id VARCHAR(40) NOT NULL,
  day_date DATE NOT NULL,
  notes   TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (trip_id) REFERENCES trip_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS trip_stops;
CREATE TABLE trip_stops (
  id          VARCHAR(40) NOT NULL PRIMARY KEY,
  day_id      VARCHAR(40) NOT NULL,
  place_id    VARCHAR(40) NULL,
  place_name  VARCHAR(200) NOT NULL,
  place_image VARCHAR(500) NULL,
  location    VARCHAR(200) NULL,
  duration    VARCHAR(60) NULL,
  notes       TEXT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  FOREIGN KEY (day_id) REFERENCES trip_days(id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES heritage_places(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id         VARCHAR(40) NOT NULL PRIMARY KEY,
  user_id    VARCHAR(40) NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    VARCHAR(500) NOT NULL,
  type       ENUM('booking','order','review','system','message') NOT NULL DEFAULT 'system',
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  link       VARCHAR(300) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- CHAT / MESSAGING
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS conversations;
CREATE TABLE conversations (
  id              VARCHAR(40) NOT NULL PRIMARY KEY,
  last_message    VARCHAR(500) NULL,
  last_message_at DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

DROP TABLE IF EXISTS conversation_participants;
CREATE TABLE conversation_participants (
  conversation_id VARCHAR(40) NOT NULL,
  user_id         VARCHAR(40) NOT NULL,
  unread_count    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (conversation_id, user_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
  id              VARCHAR(40) NOT NULL PRIMARY KEY,
  conversation_id VARCHAR(40) NOT NULL,
  sender_id       VARCHAR(40) NOT NULL,
  content         TEXT NOT NULL,
  is_read         TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS message_attachments;
CREATE TABLE message_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(40) NOT NULL,
  url VARCHAR(500) NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- CATEGORIES (explore page facets)
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
  id    VARCHAR(40) NOT NULL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  icon  VARCHAR(60) NULL,
  image VARCHAR(500) NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- LOCAL FOODS (traditional dishes by area; reference content, editable by admins)
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS local_foods;
CREATE TABLE local_foods (
  id           VARCHAR(40)  NOT NULL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  name_local   VARCHAR(150) NULL,
  district     VARCHAR(100) NOT NULL,
  division     VARCHAR(100) NOT NULL,
  food_type    ENUM('dish','sweet','snack','drink','fruit','ingredient') NOT NULL DEFAULT 'dish',
  description  TEXT         NOT NULL,
  where_to_try VARCHAR(300) NULL,
  image        VARCHAR(500) NULL,
  featured     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_local_foods_division (division),
  INDEX idx_local_foods_district (district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT IGNORE INTO local_foods (id, name, name_local, district, division, food_type, description, where_to_try, featured) VALUES
-- Chattogram division
('lf-ctg-mezban', 'Mezbani Beef', 'মেজবানি মাংস', 'Chattogram', 'Chattogram', 'dish', 'Spicy beef curry slow-cooked for mezban, the community feasts of Chattogram, with a signature blend of roasted spices and mustard oil.', 'Mezban restaurants around GEC Circle and Chawkbazar, Chattogram', 1),
('lf-ctg-kalabhuna', 'Kala Bhuna', 'কালা ভুনা', 'Chattogram', 'Chattogram', 'dish', 'Beef dry-fried for hours until it turns almost black, rich with caramelised onion and whole spices.', 'Local restaurants across Chattogram city', 0),
('lf-cox-shutki', 'Shutki Bhorta', 'শুঁটকি ভর্তা', 'Cox''s Bazar', 'Chattogram', 'dish', 'Sun-dried sea fish mashed with chilli, garlic and onion, a coastal staple. Dried fish is also a popular thing to take home.', 'Dried-fish markets and beachside restaurants in Cox''s Bazar', 1),
('lf-cum-rosmalai', 'Cumilla Rosmalai', 'কুমিল্লার রসমালাই', 'Cumilla', 'Chattogram', 'sweet', 'Small flattened cheese dumplings soaked in thickened, cardamom-scented milk; Cumilla''s best-known sweet.', 'Sweet shops around Monohorpur, Cumilla', 1),
('lf-chd-ilish', 'Chandpur Ilish', 'চাঁদপুরের ইলিশ', 'Chandpur', 'Chattogram', 'dish', 'Hilsa from the Padma–Meghna confluence, prized across the country; served fried or as shorshe ilish in mustard gravy.', 'Chandpur fish ghat and riverside eateries', 0),
('lf-ban-bamboo', 'Bamboo Chicken', 'বাঁশ মুরগি', 'Bandarban', 'Chattogram', 'dish', 'Chicken marinated with hill spices and cooked inside a green bamboo tube over fire, a dish of the Chittagong Hill Tracts communities.', 'Restaurants in Bandarban and Rangamati towns', 0),
-- Sylhet division
('lf-syl-shatkora', 'Shatkora Beef', 'সাতকরা গরুর মাংস', 'Sylhet', 'Sylhet', 'dish', 'Beef curry cooked with shatkora, a fragrant Sylheti citrus whose thick rind gives a bitter-sour aroma.', 'Restaurants around Zindabazar, Sylhet', 1),
('lf-mou-7layer', 'Seven-Layer Tea', 'সাত রঙের চা', 'Moulvibazar', 'Sylhet', 'drink', 'Tea poured in distinct coloured layers, each with its own flavour, made famous in Sreemangal.', 'Tea stalls in Sreemangal', 1),
('lf-syl-akhni', 'Akhni Pulao', 'আখনি পোলাও', 'Sylhet', 'Sylhet', 'dish', 'Sylheti spiced rice cooked with meat in one pot, a festive dish at weddings and Eid.', 'Home-style restaurants in Sylhet city', 0),
('lf-syl-chunga', 'Chunga Pitha', 'চুঙ্গা পিঠা', 'Moulvibazar', 'Sylhet', 'snack', 'Sticky rice packed into thin bamboo and roasted over fire, a winter treat of greater Sylhet.', 'Winter pitha stalls in Moulvibazar and Sylhet', 0),
-- Dhaka division
('lf-dha-kacchi', 'Kacchi Biryani', 'কাচ্চি বিরিয়ানি', 'Dhaka', 'Dhaka', 'dish', 'Marinated mutton layered with fragrant rice and potato and slow-cooked in a sealed pot; the signature dish of Old Dhaka.', 'Restaurants around Nazira Bazar and Bangshal, Old Dhaka', 1),
('lf-dha-bakarkhani', 'Bakarkhani', 'বাকরখানি', 'Dhaka', 'Dhaka', 'snack', 'Flaky, crisp layered flatbread baked in clay ovens and eaten with tea in Old Dhaka since Mughal times.', 'Bakeries in Lalbagh and Chawkbazar, Old Dhaka', 0),
('lf-dha-morogpolao', 'Morog Polao', 'মোরগ পোলাও', 'Dhaka', 'Dhaka', 'dish', 'Chicken cooked with aromatic polao rice, ghee and whole spices; a celebration dish across Dhaka.', 'Old Dhaka restaurants', 0),
('lf-tan-chomchom', 'Porabarir Chomchom', 'পোড়াবাড়ির চমচম', 'Tangail', 'Dhaka', 'sweet', 'Dense, oval chhena sweet with a browned crust, associated with Porabari village in Tangail.', 'Sweet shops in Tangail town', 1),
-- Rajshahi division
('lf-bog-doi', 'Bogura Doi', 'বগুড়ার দই', 'Bogura', 'Rajshahi', 'sweet', 'Sweet yogurt set in clay pots, caramel-coloured and creamy; Bogura''s most famous food.', 'Sweet shops across Bogura town', 1),
('lf-raj-mango', 'Rajshahi Mango', 'রাজশাহীর আম', 'Rajshahi', 'Rajshahi', 'fruit', 'Fazli, Langra, Himsagar and other varieties from the Rajshahi–Chapainawabganj belt, in season roughly June to August.', 'Mango markets in Rajshahi and Kansat, Chapainawabganj', 1),
('lf-raj-kalai', 'Kalai Ruti', 'কালাই রুটি', 'Chapainawabganj', 'Rajshahi', 'dish', 'Flatbread of black gram and rice flour cooked on a clay griddle, served with chilli-onion bhorta or beef.', 'Roadside kalai ruti stalls in Chapainawabganj and Rajshahi', 0),
('lf-nat-kachagolla', 'Natore Kachagolla', 'নাটোরের কাঁচাগোল্লা', 'Natore', 'Rajshahi', 'sweet', 'Soft, fresh chhena sweet with a light cardamom aroma, a speciality of Natore.', 'Sweet shops in Natore town', 0),
-- Khulna division
('lf-khu-chuijhal', 'Chuijhal Mutton', 'চুইঝাল মাংস', 'Khulna', 'Khulna', 'dish', 'Meat curry cooked with chui jhal, a pungent local vine stem; a southwestern speciality.', 'Restaurants in Khulna city', 1),
('lf-jas-gur', 'Jashore Khejur Gur', 'যশোরের খেজুর গুড়', 'Jashore', 'Khulna', 'ingredient', 'Date-palm jaggery made from winter sap and used in payesh and pitha; fresh nolen gur is the prized variety.', 'Winter markets in Jashore', 1),
('lf-kus-tilkhaja', 'Kushtia Tilkhaja', 'কুষ্টিয়ার তিলের খাজা', 'Kushtia', 'Khulna', 'sweet', 'Crisp sesame and sugar candy, a well-known take-home sweet from Kushtia.', 'Shops near Kushtia railway station', 0),
('lf-bag-golda', 'Golda Chingri Malaikari', 'গলদা চিংড়ির মালাইকারি', 'Bagerhat', 'Khulna', 'dish', 'Giant freshwater prawn cooked in coconut-milk gravy; Bagerhat and Khulna are major prawn-farming areas.', 'Restaurants in Bagerhat and Khulna', 0),
-- Barishal division
('lf-bho-mohishdoi', 'Buffalo Curd', 'মহিষের দই', 'Bhola', 'Barishal', 'sweet', 'Thick, tangy curd from buffalo milk, set in clay pots on Bhola island.', 'Markets in Bhola', 1),
('lf-jha-peyara', 'Floating-Market Guava', 'ভাসমান বাজারের পেয়ারা', 'Jhalokati', 'Barishal', 'fruit', 'Guavas sold straight from boats at the Bhimruli floating market, in season around July to September.', 'Bhimruli floating market, Jhalokati', 1),
('lf-bar-ilish', 'Barishal Ilish', 'বরিশালের ইলিশ', 'Barishal', 'Barishal', 'dish', 'River hilsa from the Kirtankhola and surrounding rivers, fried, cooked in mustard or steamed as ilish paturi.', 'Riverside restaurants in Barishal', 0),
-- Rangpur division
('lf-rng-haribhanga', 'Haribhanga Mango', 'হাঁড়িভাঙ্গা আম', 'Rangpur', 'Rangpur', 'fruit', 'Fibreless, sweet mango variety from Rangpur, in season in late June and July.', 'Mango markets in Mithapukur, Rangpur', 1),
('lf-din-litchi', 'Dinajpur Litchi', 'দিনাজপুরের লিচু', 'Dinajpur', 'Rangpur', 'fruit', 'Juicy litchis from Dinajpur orchards, available in May and June.', 'Litchi markets in Dinajpur', 0),
('lf-din-kataribhog', 'Kataribhog Rice', 'কাটারিভোগ চাল', 'Dinajpur', 'Rangpur', 'ingredient', 'Aromatic fine rice used for polao and payesh; Dinajpur''s best-known grain.', 'Rice markets in Dinajpur', 0),
('lf-rng-shidol', 'Shidol Bhorta', 'সিদল ভর্তা', 'Rangpur', 'Rangpur', 'dish', 'Fermented dried-fish paste mashed with chilli and garlic, a northern Bengal favourite.', 'Home-style eateries in Rangpur', 0),
-- Mymensingh division
('lf-mym-monda', 'Muktagachar Monda', 'মুক্তাগাছার মণ্ডা', 'Mymensingh', 'Mymensingh', 'sweet', 'Soft, flat chhena-and-sugar sweet made in Muktagacha since the 19th century.', 'Sweet shops in Muktagacha, Mymensingh', 1),
('lf-net-balish', 'Balish Mishti', 'বালিশ মিষ্টি', 'Netrokona', 'Mymensingh', 'sweet', 'Large pillow-shaped chhena sweet soaked in syrup and topped with thickened milk.', 'Sweet shops in Netrokona town', 0),
('lf-she-tulshimala', 'Tulshimala Rice', 'তুলসীমালা চাল', 'Sherpur', 'Mymensingh', 'ingredient', 'Small-grained aromatic rice from Sherpur, used for polao and payesh.', 'Rice markets in Sherpur', 0);


SET FOREIGN_KEY_CHECKS = 1;
