# API Documentation

## Endpoints

### POST /api/merchants

Create a new merchant with branding configuration.

**Request Body:**
```typescript
{
  name: string;           // Merchant display name
  slug: string;           // URL-friendly identifier (lowercase, alphanumeric, hyphens)
  rewardGoal: number;     // Number of stamps required for reward
  branding: {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    labelColor: string;
    background: {
      type: 'solid' | 'image';
      color: string;
      imageUrl?: string;
    };
    stamp: {
      total: number;
      shape: 'circle' | 'square';
      filledColor: string;
      emptyColor: string;
      outlineColor: string;
      overlayLogo: boolean;
    };
  };
}
```

**Response (201):**
```typescript
{
  success: true;
  merchantId: string;     // UUID of created merchant
  slug: string;           // Merchant slug
  message: string;
}
```

**Error Responses:**
- `400` - Missing required fields or invalid slug format
- `409` - Slug already exists
- `500` - Server error

**What Happens:**
1. Validates request data
2. Checks if slug is unique
3. Creates merchant record in database
4. Generates stamp strip images (0..N) for both Apple and Google platforms
5. Uploads all images to Supabase Storage
6. Returns merchant details

### POST /api/upload/logo

Upload a logo image to Supabase Storage.

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `logo`: Image file (PNG, JPG, etc.)
  - `slug`: Merchant slug

**Response (200):**
```typescript
{
  success: true;
  url: string;  // Public URL of uploaded logo
}
```

**Error Responses:**
- `400` - Missing file, invalid file type, or file too large (>5MB)
- `500` - Upload failed

## Database Schema

### merchants table

```sql
CREATE TABLE merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  reward_goal integer NOT NULL DEFAULT 8,
  branding jsonb NOT NULL DEFAULT '{}',
  branding_version integer NOT NULL DEFAULT 1,
  join_qr_url text,
  stamp_qr_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns:**
- `id` - Unique merchant identifier
- `slug` - URL-friendly identifier for QR code routes
- `name` - Display name
- `reward_goal` - Stamps required for reward
- `branding` - JSONB containing full branding configuration
- `branding_version` - Incremented on updates to invalidate cached assets
- `join_qr_url` - URL for Join QR code (`/add/:slug`)
- `stamp_qr_url` - Base URL for Stamp QR codes (`/stamp`)
- `created_at` - Timestamp of creation

## Storage Structure

Supabase Storage bucket: `tapandstamp`

```
tapandstamp/
├── logos/
│   └── {merchantSlug}/
│       └── logo.png
└── stamps/
    └── {merchantSlug}/
        ├── v1_0of8.png      (Apple 1125×432)
        ├── v1_1of8.png
        ├── v1_2of8.png
        └── ...
```

- **Logos**: Uploaded merchant logos
- **Stamps**: Generated stamp strip images
  - Format: `v{version}_{count}of{total}.png`
  - Version number allows cache invalidation on branding updates
  - Generated for both Apple (1125×432) and Google (1032×336) platforms

## Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_STORAGE_BUCKET=tapandstamp
```

## Helper Functions

### Database (`lib/db/merchants.ts`)

- `createMerchant()` - Insert new merchant
- `getMerchantBySlug()` - Fetch by slug
- `getMerchantById()` - Fetch by ID
- `updateMerchantBranding()` - Update branding and increment version

### Storage (`lib/storage.ts`)

- `uploadFile()` - Generic file upload
- `uploadLogo()` - Upload merchant logo
- `uploadStampStrip()` - Upload generated stamp strip image
- `deleteStampStrips()` - Clean up old version assets
- `getPublicUrl()` - Get public URL for stored file

### QR Codes (`lib/qrcode.ts`)

- `generateQRCode()` - Generate QR code as data URL
- `generateQRCodeBuffer()` - Generate QR code as PNG buffer
- `generateJoinQR()` - Generate Join QR for merchant
- `generateStampQR()` - Generate template Stamp QR

### Color Utilities (`lib/color-utils.ts`)

- `hexToRgb()` - Convert hex to RGB
- `getContrastRatio()` - Calculate WCAG contrast ratio
- `meetsContrastAA()` - Check WCAG AA compliance (4.5:1)
- `meetsContrastAAA()` - Check WCAG AAA compliance (7:1)
- `getContrastStatus()` - Get detailed contrast info
- `isValidHexColor()` - Validate hex format
- `normalizeHexColor()` - Add # prefix if missing

## Flow Diagram

```
User fills branding form
        ↓
Uploads logo (optional Supabase upload)
        ↓
Clicks "Save & Generate Assets"
        ↓
POST /api/merchants
        ↓
    ┌───────────────────┐
    │ Validate data     │
    └───────────────────┘
        ↓
    ┌───────────────────┐
    │ Create merchant   │
    │ in database       │
    └───────────────────┘
        ↓
    ┌───────────────────┐
    │ Generate stamps   │
    │ (0..N images)     │
    │ for Apple+Google  │
    └───────────────────┘
        ↓
    ┌───────────────────┐
    │ Upload to         │
    │ Supabase Storage  │
    └───────────────────┘
        ↓
Redirect to success page
        ↓
    ┌───────────────────┐
    │ Display QR codes  │
    │ Download options  │
    └───────────────────┘
```

## Testing

Before using in production:

1. **Set up Supabase project**
   - Create project at supabase.com
   - Run migrations in `packages/db/migrations/`
   - Create storage bucket named `tapandstamp`
   - Set bucket to public read access

2. **Configure environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in Supabase credentials

3. **Test the flow**
   - Start dev server: `pnpm --filter @tapandstamp/admin dev`
   - Navigate to `/branding/new`
   - Fill in merchant details
   - Upload logo
   - Save and verify:
     - Merchant created in database
     - Images uploaded to storage
     - Success page displays QR codes

## Security Considerations

- **Service Role Key**: Only used server-side (API routes)
- **Anon Key**: Used client-side, has limited permissions
- **File validation**: Type and size checks before upload
- **Slug validation**: Prevents SQL injection, ensures URL safety
- **Storage permissions**: Configure RLS policies in Supabase

## Future Enhancements

- [ ] Logo image optimization (resize, compress)
- [ ] Generate multiple logo sizes for PassKit (logo.png, icon.png)
- [ ] Batch image uploads for better performance
- [ ] Image CDN integration
- [ ] Generate printable posters (PDF) with QR codes
- [ ] Webhook notifications on merchant creation
- [ ] Admin authentication and authorization
