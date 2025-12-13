-- User authentication and merchant access control

-- User-merchant access control junction table
-- Links Supabase Auth users to merchants they can access
CREATE TABLE IF NOT EXISTS user_merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, merchant_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_merchants_user ON user_merchants (user_id);
CREATE INDEX IF NOT EXISTS idx_user_merchants_merchant ON user_merchants (merchant_id);

-- Enable Row Level Security
ALTER TABLE user_merchants ENABLE ROW LEVEL SECURITY;

-- Users can only see their own merchant assignments
CREATE POLICY "Users can view own merchant assignments"
  ON user_merchants FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all user_merchants (for admin operations)
CREATE POLICY "Service role manages user_merchants"
  ON user_merchants FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE user_merchants IS 'Junction table controlling user access to merchants';
COMMENT ON COLUMN user_merchants.role IS 'User role for this merchant: admin (full access) or viewer (read-only)';
