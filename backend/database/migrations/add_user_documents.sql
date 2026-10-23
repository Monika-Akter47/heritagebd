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
