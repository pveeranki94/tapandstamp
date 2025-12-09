# Tap & Stamp Admin

Next.js-based admin dashboard for managing merchant branding and loyalty card configuration.

## Features

### Merchant Branding Wizard (`/branding/new`)

Complete UI for setting up merchant loyalty card branding with:

#### 1. Merchant Details
- Merchant name and URL-friendly slug
- Configurable reward goal (stamps required for reward)

#### 2. Logo Upload
- Drag-and-drop or click-to-upload interface
- Image validation (type and size checks)
- Live preview of uploaded logo
- TODO: Integrate with Supabase Storage or CDN

#### 3. Color Customization
- Primary color (background)
- Secondary color
- Label color (text)
- Interactive color pickers with hex input
- **WCAG Contrast Validation**: Real-time contrast checking against WCAG AA/AAA standards
- Visual indicators for contrast quality (excellent/good/fair/poor)

#### 4. Stamp Configuration
- Shape selection: Circle or Square
- Filled stamp color (with contrast check)
- Empty stamp color (with contrast check)
- Outline color
- Overlay logo toggle (future feature)

#### 5. Live Preview
- Real-time preview of stamp strip design
- Platform toggle: Apple Wallet vs Google Wallet
- Interactive stamp counter slider
- Shows actual dimensions (1125×432px for Apple, 1032×336px for Google)

## Components

### `LogoUpload`
File upload component with preview and validation
- **Location**: `components/branding/LogoUpload.tsx`
- **Features**: Image validation, preview, change/remove actions

### `ColorPicker`
Color input with contrast validation
- **Location**: `components/branding/ColorPicker.tsx`
- **Features**: Native color picker, hex text input, WCAG contrast checking

### `StampConfig`
Stamp shape and color configuration
- **Location**: `components/branding/StampConfig.tsx`
- **Features**: Shape selector, color pickers with contrast validation

### `BrandingPreview`
Live preview of wallet pass design
- **Location**: `components/branding/BrandingPreview.tsx`
- **Features**: Platform toggle, interactive stamp counter, scaled preview

## Utilities

### Color Utils (`lib/color-utils.ts`)
- `hexToRgb()`: Convert hex to RGB
- `getContrastRatio()`: Calculate WCAG contrast ratio
- `meetsContrastAA()`: Check WCAG AA compliance (4.5:1)
- `meetsContrastAAA()`: Check WCAG AAA compliance (7:1)
- `getContrastStatus()`: Get detailed contrast information
- `isValidHexColor()`: Validate hex color format
- `normalizeHexColor()`: Add # prefix if missing

## Running the Admin App

```bash
# Development mode
pnpm --filter @tapandstamp/admin dev

# Production build
pnpm --filter @tapandstamp/admin build
pnpm --filter @tapandstamp/admin start

# Type checking
pnpm --filter @tapandstamp/admin typecheck

# Linting
pnpm --filter @tapandstamp/admin lint
```

## Next Steps

### Immediate TODOs

1. **API Integration** (`/api/merchants`)
   - POST endpoint to save merchant and branding data
   - Generate stamp strip images (0..N) using `@tapandstamp/imaging`
   - Upload images to CDN/storage
   - Create Apple PassKit template
   - Create Google Wallet LoyaltyClass

2. **Logo Upload Integration**
   - Implement actual file upload to Supabase Storage
   - Generate multiple sizes (logo.png, icon.png for PassKit)
   - Return CDN URLs

3. **Asset Generation**
   - Call `renderStampStrip()` from `@tapandstamp/imaging` for each stamp count (0..N)
   - Upload to storage: `stamps/<merchantSlug>/v<version>_<X>of<N>.png`
   - Bump `branding_version` on updates to invalidate cache

4. **QR Code Generation**
   - Generate Join QR: `/add/:merchantSlug`
   - Generate Stamp QR: `/stamp/:memberId` (per member)

5. **Merchant Dashboard**
   - List all merchants
   - Edit existing branding
   - View member stats
   - Download QR code posters

## Design System

### Colors
- Primary: `#3b82f6` (blue)
- Success: `#10b981` (green)
- Warning: `#eab308` (yellow)
- Error: `#ef4444` (red)
- Neutral: `#6b7280` (gray)

### Spacing
- Small: `0.5rem` (8px)
- Medium: `1rem` (16px)
- Large: `1.5rem` (24px)
- XLarge: `2rem` (32px)

### Typography
- Headings: System font stack, bold
- Body: System font stack, regular (16px base)
- Small: 0.875rem (14px)
- Code: Monospace

## Testing

```bash
# Run tests
pnpm --filter @tapandstamp/admin test

# Coverage
pnpm --filter @tapandstamp/admin coverage
```

## Architecture Notes

- **Client Components**: All branding wizard components use `'use client'` directive for interactivity
- **CSS Modules**: Scoped styles with `.module.css` suffix
- **Type Safety**: Imports shared types from `@tapandstamp/core` package
- **Form State**: Uses React hooks (`useState`) for local state management
- **Validation**: Client-side validation with clear error messages

## Accessibility

- WCAG AA/AAA contrast checking built-in
- Keyboard navigation supported
- Semantic HTML elements
- Color-blind friendly status indicators
- Alt text for images
