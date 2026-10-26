-- Uploaded file bytes. The API host's disk is wiped on every deploy, so the database is the durable copy.
CREATE TABLE IF NOT EXISTS stored_files (
  kind       VARCHAR(20) NOT NULL,
  name       VARCHAR(80) NOT NULL,
  mime_type  VARCHAR(100) NOT NULL,
  data       BYTEA NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (kind, name)
);
ALTER TABLE stored_files ENABLE ROW LEVEL SECURITY;
