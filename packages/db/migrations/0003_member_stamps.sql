-- Add stamp tracking columns to members table

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS device_type text CHECK (device_type IN ('apple', 'google', 'web')),
  ADD COLUMN IF NOT EXISTS stamp_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_stamp_at timestamptz;

-- Create index for cooldown checks (queries by last_stamp_at)
CREATE INDEX IF NOT EXISTS idx_members_last_stamp ON members (last_stamp_at);

-- Comments for documentation
COMMENT ON COLUMN members.device_type IS 'Platform: apple, google, or web (browser-based card)';
COMMENT ON COLUMN members.stamp_count IS 'Current number of stamps collected';
COMMENT ON COLUMN members.reward_available IS 'True when stamp_count >= reward_goal';
COMMENT ON COLUMN members.last_stamp_at IS 'Timestamp of last stamp for cooldown enforcement';
