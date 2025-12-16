-- Pass registrations table for Apple Wallet push notifications
-- Stores device registrations for push updates when stamps are collected

CREATE TABLE IF NOT EXISTS pass_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  push_token text NOT NULL,
  pass_type_id text NOT NULL,
  platform text NOT NULL DEFAULT 'apple',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(member_id, device_id, pass_type_id)
);

-- Index for efficient lookups by member
CREATE INDEX IF NOT EXISTS idx_pass_registrations_member_id ON pass_registrations(member_id);

-- Index for finding all registrations for a pass type
CREATE INDEX IF NOT EXISTS idx_pass_registrations_pass_type ON pass_registrations(pass_type_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pass_registration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pass_registrations_updated_at
  BEFORE UPDATE ON pass_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_pass_registration_timestamp();
