import type { Db } from './index.js';

export const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  phone       VARCHAR(20) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  phone       VARCHAR(20) PRIMARY KEY,
  code        VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS loans (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_name   VARCHAR(100) NOT NULL,
  amount_cents  BIGINT NOT NULL CHECK (amount_cents > 0),
  due_date      DATE NOT NULL,
  note          VARCHAR(500),
  receipt_path  TEXT,
  repaid_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS loans_user_id_idx ON loans (user_id);
`;

export async function migrate(db: Db): Promise<void> {
  await db.query(schemaSql);
}
