-- Auth hardening: hashed session tokens + attempt throttling.
-- Run ONCE on an existing database. Running the UPDATE twice would hash the
-- hashes and sign everyone out (harmless, but users must log in again).

-- Existing sessions stay valid: MySQL SHA2(...,256) matches PHP hash('sha256', ...).
UPDATE auth_tokens SET token = SHA2(token, 256) WHERE CHAR_LENGTH(token) = 64;

ALTER TABLE auth_tokens ADD INDEX idx_auth_tokens_expires (expires_at);

CREATE TABLE IF NOT EXISTS auth_attempts (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  action      VARCHAR(30)  NOT NULL,
  identifier  VARCHAR(190) NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_attempts_lookup (action, identifier, created_at),
  INDEX idx_auth_attempts_created (created_at)
) ENGINE=InnoDB;

DELETE FROM auth_tokens WHERE expires_at <= NOW();
DELETE FROM password_resets WHERE expires_at <= NOW() OR used = 1;
