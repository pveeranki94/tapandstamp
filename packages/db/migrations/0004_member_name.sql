-- Add name column to members table for customer identification

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS name text;

-- Comment for documentation
COMMENT ON COLUMN members.name IS 'Customer display name for their stamp card';
