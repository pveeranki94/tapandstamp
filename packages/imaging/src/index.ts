import { Buffer } from 'node:buffer';
import sharp from 'sharp';
import type { Branding } from '@tapandstamp/core';

export interface RenderStampStripOptions {
  branding: Branding;
  count: number;
  platform?: 'apple' | 'google';
  logoBuffer?: Buffer; // Optional logo image buffer for 'logo' shape stamps
}

export interface RenderStampStripResult {
  width: number;
  height: number;
  mime: string;
  buffer: Buffer;
}

/**
 * Platform-specific dimensions for stamp strips
 * Apple: 1125×537 (@3x for retina, taller for larger stamps)
 * Google: 1032×336 (@2x)
 */
const DIMENSIONS = {
  apple: { width: 1125, height: 537 },
  google: { width: 1032, height: 336 }
} as const;

/**
 * Renders a stamp strip image showing X/N stamps with merchant branding
 */
export async function renderStampStrip(
  options: RenderStampStripOptions
): Promise<RenderStampStripResult> {
  const { branding, count, platform = 'apple', logoBuffer } = options;
  const { width, height } = DIMENSIONS[platform];
  const { stamp, background, labelColor } = branding;

  // Validate inputs
  if (count < 0 || count > stamp.total) {
    throw new Error(`count must be between 0 and ${stamp.total}`);
  }

  // Calculate stamp layout - maximize stamp size with minimal gaps
  const spacingX = 4;
  const spacingY = 4;

  // Use 2 rows for 6 stamps (3 per row), single row otherwise
  const cols = stamp.total <= 6 ? Math.ceil(stamp.total / 2) : stamp.total;
  const rows = stamp.total <= 6 ? 2 : 1;

  // Use full dimensions - no padding
  const availableWidth = width;
  const availableHeight = height;

  // Calculate stamp size to fit grid - maximize size
  const maxStampWidth = (availableWidth - spacingX * (cols - 1)) / cols;
  const maxStampHeight = (availableHeight - spacingY * (rows - 1)) / rows;
  const stampSize = Math.min(maxStampWidth, maxStampHeight);

  // Center the grid both horizontally and vertically
  const gridWidth = cols * stampSize + (cols - 1) * spacingX;
  const gridHeight = rows * stampSize + (rows - 1) * spacingY;
  const startX = (width - gridWidth) / 2;
  const stampY = (height - gridHeight) / 2;

  // For logo shape, we need to composite the logo images
  if (stamp.shape === 'logo' && logoBuffer) {
    return renderLogoStampStrip({
      width,
      height,
      count,
      total: stamp.total,
      cols,
      rows,
      startX,
      startY: stampY,
      size: stampSize,
      spacingX,
      spacingY,
      backgroundColor: background.color,
      labelColor,
      logoBuffer
    });
  }

  // Create SVG for stamps (circle/square shapes)
  const stamps = generateStampsSVG({
    count,
    total: stamp.total,
    cols,
    rows,
    startX,
    startY: stampY,
    size: stampSize,
    spacingX,
    spacingY,
    shape: stamp.shape === 'logo' ? 'circle' : stamp.shape, // Fallback for logo without buffer
    filledColor: stamp.filledColor,
    emptyColor: stamp.emptyColor,
    outlineColor: stamp.outlineColor
  });

  // Build complete SVG - no text, just stamps for maximum size
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${background.color}"/>
      ${stamps}
    </svg>
  `;

  // Render to PNG using Sharp
  const buffer = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, quality: 90 })
    .toBuffer();

  return {
    width,
    height,
    mime: 'image/png',
    buffer
  };
}

interface LogoStampStripOptions {
  width: number;
  height: number;
  count: number;
  total: number;
  cols: number;
  rows: number;
  startX: number;
  startY: number;
  size: number;
  spacingX: number;
  spacingY: number;
  backgroundColor: string;
  labelColor: string;
  logoBuffer: Buffer;
}

/**
 * Renders a stamp strip with logo images as stamps
 * Filled stamps show full opacity logo, empty stamps show faded/grayscale logo
 */
async function renderLogoStampStrip(
  options: LogoStampStripOptions
): Promise<RenderStampStripResult> {
  const {
    width,
    height,
    count,
    total,
    cols,
    rows,
    startX,
    startY,
    size,
    spacingX,
    spacingY,
    backgroundColor,
    labelColor,
    logoBuffer
  } = options;

  // Create base image with background - no text for maximum stamp size
  const baseSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
    </svg>
  `;

  // Prepare logo in different states - use full slot size
  const logoSize = size; // Full slot size for maximum visibility

  // Resize logo to stamp size (SVG is rendered at high density for crisp output)
  const resizedLogo = await sharp(logoBuffer, { density: 300 })
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Create faded/grayscale version for empty stamps
  const fadedLogo = await sharp(logoBuffer, { density: 300 })
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .grayscale()
    .modulate({ brightness: 1.2 })
    .ensureAlpha()
    .composite([{
      input: Buffer.from([255, 255, 255, Math.round(255 * 0.2)]), // 20% opacity overlay
      raw: { width: 1, height: 1, channels: 4 },
      tile: true,
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  // Build composite operations for each stamp in grid layout
  const composites: sharp.OverlayOptions[] = [];
  const logoOffset = (size - logoSize) / 2; // Center logo in stamp slot

  for (let i = 0; i < total; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = Math.round(startX + col * (size + spacingX) + logoOffset);
    const y = Math.round(startY + row * (size + spacingY) + logoOffset);
    const isFilled = i < count;

    composites.push({
      input: isFilled ? resizedLogo : fadedLogo,
      left: x,
      top: y
    });
  }

  // Composite everything together
  const buffer = await sharp(Buffer.from(baseSvg))
    .composite(composites)
    .png({ compressionLevel: 9, quality: 90 })
    .toBuffer();

  return {
    width,
    height,
    mime: 'image/png',
    buffer
  };
}

interface StampSVGOptions {
  count: number;
  total: number;
  cols: number;
  rows: number;
  startX: number;
  startY: number;
  size: number;
  spacingX: number;
  spacingY: number;
  shape: 'circle' | 'square'; // 'logo' is handled separately via renderLogoStampStrip
  filledColor: string;
  emptyColor: string;
  outlineColor: string;
}

/**
 * Generates SVG markup for stamp slots in a grid layout
 */
function generateStampsSVG(options: StampSVGOptions): string {
  const {
    count,
    total,
    cols,
    startX,
    startY,
    size,
    spacingX,
    spacingY,
    shape,
    filledColor,
    emptyColor,
    outlineColor
  } = options;

  const stamps: string[] = [];
  const strokeWidth = 4;

  for (let i = 0; i < total; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (size + spacingX);
    const y = startY + row * (size + spacingY);
    const isFilled = i < count;
    const fillColor = isFilled ? filledColor : emptyColor;

    if (shape === 'circle') {
      const cx = x + size / 2;
      const cy = y + size / 2;
      const r = size / 2 - strokeWidth;
      stamps.push(`
        <circle
          cx="${cx}"
          cy="${cy}"
          r="${r}"
          fill="${fillColor}"
          stroke="${outlineColor}"
          stroke-width="${strokeWidth}"
        />
      `);
    } else {
      // square
      const adjustedX = x + strokeWidth / 2;
      const adjustedY = y + strokeWidth / 2;
      const adjustedSize = size - strokeWidth;
      const cornerRadius = 8;
      stamps.push(`
        <rect
          x="${adjustedX}"
          y="${adjustedY}"
          width="${adjustedSize}"
          height="${adjustedSize}"
          rx="${cornerRadius}"
          ry="${cornerRadius}"
          fill="${fillColor}"
          stroke="${outlineColor}"
          stroke-width="${strokeWidth}"
        />
      `);
    }
  }

  return stamps.join('\n');
}
