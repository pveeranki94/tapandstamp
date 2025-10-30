-- Tap & Stamp initial schema

CREATE TABLE IF NOT EXISTS merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  reward_goal integer NOT NULL DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  wallet_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  stamped_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('apple', 'google')),
  state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_merchant ON members (merchant_id);
CREATE INDEX IF NOT EXISTS idx_visits_member ON visits (member_id);
CREATE INDEX IF NOT EXISTS idx_visits_merchant ON visits (merchant_id);
CREATE INDEX IF NOT EXISTS idx_passes_member ON passes (member_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_merchants_slug ON merchants (slug);

COMMENT ON TABLE merchants IS 'Merchant definitions for Tap & Stamp loyalty.';
COMMENT ON TABLE members IS 'One row per customer wallet pass.';
COMMENT ON TABLE visits IS 'Audit trail of awarded stamps.';
COMMENT ON TABLE passes IS 'Metadata for wallet pass state by platform.';
