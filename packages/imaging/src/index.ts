import { Buffer } from 'node:buffer';
import sharp from 'sharp';
import type { Branding } from '@tapandstamp/core';

export interface RenderStampStripOptions {
  branding: Branding;
  count: number;
  platform?: 'apple' | 'google';
}

export interface RenderStampStripResult {
  width: number;
  height: number;
  mime: string;
  buffer: Buffer;
}

/**
 * Platform-specific dimensions for stamp strips
 * Apple: 1125×432 (@2x for retina)
 * Google: 1032×336 (@2x)
 */
const DIMENSIONS = {
  apple: { width: 1125, height: 432 },
  google: { width: 1032, height: 336 }
} as const;

/**
 * Renders a stamp strip image showing X/N stamps with merchant branding
 */
export async function renderStampStrip(
  options: RenderStampStripOptions
): Promise<RenderStampStripResult> {
  const { branding, count, platform = 'apple' } = options;
  const { width, height } = DIMENSIONS[platform];
  const { stamp, background, labelColor } = branding;

  // Validate inputs
  if (count < 0 || count > stamp.total) {
    throw new Error(`count must be between 0 and ${stamp.total}`);
  }

  // Calculate stamp layout
  const padding = 40;
  const textHeight = 80;
  const stampAreaHeight = height - textHeight - padding * 2;
  const stampSize = Math.min(
    (width - padding * 2) / stamp.total - 20,
    stampAreaHeight
  );
  const totalStampsWidth = stamp.total * stampSize + (stamp.total - 1) * 20;
  const startX = (width - totalStampsWidth) / 2;
  const stampY = padding;

  // Create SVG for stamps
  const stamps = generateStampsSVG({
    count,
    total: stamp.total,
    startX,
    startY: stampY,
    size: stampSize,
    spacing: 20,
    shape: stamp.shape,
    filledColor: stamp.filledColor,
    emptyColor: stamp.emptyColor,
    outlineColor: stamp.outlineColor
  });

  // Create text SVG
  const text = `
    <text
      x="${width / 2}"
      y="${height - padding - 20}"
      font-family="Helvetica, Arial, sans-serif"
      font-size="64"
      font-weight="bold"
      fill="${labelColor}"
      text-anchor="middle"
      dominant-baseline="middle"
    >${count} / ${stamp.total}</text>
  `;

  // Build complete SVG
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${background.color}"/>
      ${stamps}
      ${text}
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

interface StampSVGOptions {
  count: number;
  total: number;
  startX: number;
  startY: number;
  size: number;
  spacing: number;
  shape: 'circle' | 'square';
  filledColor: string;
  emptyColor: string;
  outlineColor: string;
}

/**
 * Generates SVG markup for stamp slots
 */
function generateStampsSVG(options: StampSVGOptions): string {
  const {
    count,
    total,
    startX,
    startY,
    size,
    spacing,
    shape,
    filledColor,
    emptyColor,
    outlineColor
  } = options;

  const stamps: string[] = [];
  const strokeWidth = 4;

  for (let i = 0; i < total; i++) {
    const x = startX + i * (size + spacing);
    const isFilled = i < count;
    const fillColor = isFilled ? filledColor : emptyColor;

    if (shape === 'circle') {
      const cx = x + size / 2;
      const cy = startY + size / 2;
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
      const adjustedY = startY + strokeWidth / 2;
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
