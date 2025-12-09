# @tapandstamp/imaging

Image generation package for Tap & Stamp loyalty cards. Generates branded stamp strip images for Apple Wallet and Google Wallet passes.

## Features

- **Platform-specific dimensions**: Apple (1125×432px) and Google (1032×336px) optimized
- **Customizable branding**: Colors, shapes (circle/square), and stamp counts
- **Efficient rendering**: SVG-to-PNG pipeline using Sharp
- **Deterministic output**: Same inputs always produce identical images

## Usage

```typescript
import { renderStampStrip } from '@tapandstamp/imaging';
import type { Branding } from '@tapandstamp/core';

const branding: Branding = {
  logoUrl: 'https://example.com/logo.png',
  primaryColor: '#6B4A3A',
  secondaryColor: '#E8D9CF',
  labelColor: '#FFFFFF',
  background: {
    type: 'solid',
    color: '#6B4A3A'
  },
  stamp: {
    total: 8,
    shape: 'circle',
    filledColor: '#FFFFFF',
    emptyColor: '#E8D9CF',
    outlineColor: '#FFFFFF',
    overlayLogo: false
  }
};

// Render a stamp strip with 3 out of 8 stamps filled
const result = await renderStampStrip({
  branding,
  count: 3,
  platform: 'apple' // or 'google'
});

// result.buffer contains the PNG image data
fs.writeFileSync('stamp-strip.png', result.buffer);
```

## API

### `renderStampStrip(options)`

Renders a stamp strip image.

**Parameters:**
- `options.branding` (Branding): Merchant branding configuration
- `options.count` (number): Number of stamps filled (0 to total)
- `options.platform` ('apple' | 'google'): Target platform (default: 'apple')

**Returns:** `Promise<RenderStampStripResult>`
- `width`: Image width in pixels
- `height`: Image height in pixels
- `mime`: MIME type ('image/png')
- `buffer`: PNG image data as Buffer

**Throws:**
- Error if count is negative or exceeds stamp.total

## Examples

Generate sample images:

```bash
pnpm tsx examples/generate-samples.ts
```

This creates sample images in `examples/output/` for visual inspection.

## Testing

```bash
pnpm test
pnpm coverage
```

The test suite covers:
- Basic rendering (0, partial, and full stamps)
- Platform-specific dimensions
- Shape variations (circle/square)
- Input validation
- Branding customization
- Output size constraints (<300KB per TDD spec)
- Deterministic rendering
