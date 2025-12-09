-- Add branding column to merchants table

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS branding jsonb NOT NULL DEFAULT '{}';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS branding_version integer NOT NULL DEFAULT 1;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS join_qr_url text;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS stamp_qr_url text;

COMMENT ON COLUMN merchants.branding IS 'Merchant branding configuration (colors, logo, stamps)';
COMMENT ON COLUMN merchants.branding_version IS 'Incremented on branding updates to invalidate cached assets';
COMMENT ON COLUMN merchants.join_qr_url IS 'URL for Join QR code: /add/:slug';
COMMENT ON COLUMN merchants.stamp_qr_url IS 'Base URL for Stamp QR code: /stamp/:memberId';
